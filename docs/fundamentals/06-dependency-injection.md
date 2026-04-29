# Dependency Injection (DI)

## What is Dependency Injection?
Dependency Injection is how Angular provides services to components (or other classes) automatically, instead of you creating them manually.

## How it works

### Without DI (manual way - bad)
```typescript
class MyComponent {
  userService = new UserService(); // You create it yourself
}
```

### With DI - Modern way (Angular v14+ - best)
```typescript
import { inject } from '@angular/core';

class MyComponent {
  private userService = inject(UserService); // Modern inject() function
}
```

### With DI - Old way (still works)
```typescript
class MyComponent {
  constructor(private userService: UserService) {} // Constructor injection
}
```

## Key parts of DI

### Service
A service is a class that does a specific job (like fetching data, handling auth, etc.).
- Example: `UserService` fetches user data from API

### Provider
You register the service so Angular knows about it.
- Use `providedIn: 'root'` in `@Injectable()` decorator
- Angular creates one instance and shares it across the app

### Injector
Angular's injector gives you the service instance when you ask for it.
- You ask by adding it to constructor parameters
- Angular finds the service and passes it to your class

## Why it matters
- You don't manually create services (Angular does it)
- Same service instance is shared across components (efficient)
- Easy to test (you can replace real service with fake one)
- Loose coupling (components don't know how service is created)

## `inject()` function vs Constructor Injection — Old and New

### Background — why constructor injection existed

#### The old way (still works)
```typescript
import { Component } from '@angular/core';
import { UserService } from './user.service';
import { Router } from '@angular/router';

@Component({ ... })
export class UserComponent {
  constructor(
    private userService: UserService,
    private router: Router
  ) {}
}
```

**How it worked:** TypeScript emitted metadata about the constructor parameter types, and Angular's DI system read that metadata to know what to inject. The `private userService: UserService` shorthand declared the property AND typed it for DI all in one.

**Why it became a problem:**
- Required TypeScript `experimentalDecorators` and `emitDecoratorMetadata` compiler options
- Verbose when you have many dependencies
- Could not be used outside of class constructors (no DI in standalone functions like route guards in the old syntax)
- Made testing slightly awkward (you had to construct the class with all dependencies)

---

### The new way — `inject()` function (Angular v14+)

```typescript
import { Component, inject } from '@angular/core';
import { UserService } from './user.service';
import { Router } from '@angular/router';

@Component({ ... })
export class UserComponent {
  private userService = inject(UserService);
  private router = inject(Router);
}
```

**How it works:** `inject()` reads from Angular's current injection context — if you call it during class field initialization (which runs at construction time), Angular knows what injector to use.

---

### Why `inject()` is better

| | Constructor injection (old) | `inject()` (new) |
|---|---|---|
| Readability | All deps in constructor signature (gets long) | Field-level, each on its own line |
| Works in standalone functions | ❌ No | ✅ Yes (route guards, `ResolveFn`, etc.) |
| Works in base classes | ❌ Messy (must pass to `super()`) | ✅ Clean (just call `inject()`) |
| Migration to standalone | Needs refactor | Works out of the box |
| Required compiler options | `emitDecoratorMetadata` | Not needed |

**Example — base class nightmare with constructor injection:**
```typescript
// Old — child must pass everything to base class
export class BaseComponent {
  constructor(protected userService: UserService) {}
}
export class UserProfileComponent extends BaseComponent {
  constructor(userService: UserService, private router: Router) {
    super(userService); // must manually pass up
  }
}

// New — inject() in base class, child is clean
export class BaseComponent {
  protected userService = inject(UserService);
}
export class UserProfileComponent extends BaseComponent {
  private router = inject(Router); // no super() gymnastics
}
```

**Example — `inject()` in standalone functions (impossible with old way):**
```typescript
// Modern route guard (functional) — only possible with inject()
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isLoggedIn() ? true : router.parseUrl('/login');
};
```

---

### When can you call `inject()`?

`inject()` can only be called in an **injection context**:
- During class field initialization (`private x = inject(X)`)
- Inside a constructor
- Inside a factory function provided to Angular

**Not allowed:**
```typescript
export class MyComponent {
  private service!: UserService;

  ngOnInit() {
    this.service = inject(UserService); // ❌ ERROR — not in injection context
  }
}
```

**Fix:**
```typescript
export class MyComponent {
  private service = inject(UserService); // ✅ field initializer = injection context
}
```

---

## Quick memory line
DI = ask Angular for a service using `inject()` or constructor, Angular gives it to you. Prefer `inject()` in new code — cleaner, more flexible, works in functions.

## Common mistakes
- Creating service instances manually with `new`
- Forgetting `@Injectable()` decorator on services
- Putting too many responsibilities in one service
- Calling `inject()` inside lifecycle hooks (`ngOnInit`, etc.) — call it in field initializers instead
- Using constructor injection in new code (prefer `inject()` function)
