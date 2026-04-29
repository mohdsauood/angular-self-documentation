# Services

## What is a service?
A service is a TypeScript class that handles a specific job — like fetching data from an API, managing shared state, or handling authentication.

Services are separate from components. **Components handle the UI. Services handle the logic and data.**

---

## Why use services?

### The problem without services
```typescript
// UserListComponent
ngOnInit() {
  fetch('/api/users').then(...) // logic lives in component
}

// UserDetailComponent
ngOnInit() {
  fetch('/api/users/' + id).then(...) // same logic repeated
}
```

You end up duplicating code across every component that needs it.

### With a service
```typescript
// user.service.ts — one place for all user-related logic
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUsers() {
    return this.http.get<User[]>('/api/users');
  }

  getUserById(id: number) {
    return this.http.get<User>(`/api/users/${id}`);
  }
}

// UserListComponent — just calls the service
export class UserListComponent {
  private userService = inject(UserService);

  ngOnInit() {
    this.userService.getUsers().subscribe(users => this.users = users);
  }
}
```

One place for the logic. Any component can use it.

---

## How to create a service

### Generate with Angular CLI
```bash
ng generate service services/user
# or shorthand
ng g s services/user
```

This creates `user.service.ts` and `user.service.spec.ts` (for tests).

### What a service looks like
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'  // creates one shared instance for the whole app
})
export class UserService {
  private http = inject(HttpClient);

  getUsers() {
    return this.http.get<User[]>('/api/users');
  }
}
```

### The `@Injectable` decorator
- Marks the class as something Angular can inject
- `providedIn: 'root'` → Angular creates **one instance** and shares it across the whole app (singleton)

---

## Using a service in a component

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-user-list',
  template: `
    <ul>
      @for (user of users; track user.id) {
        <li>{{ user.name }}</li>
      }
    </ul>
  `
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  users: User[] = [];

  ngOnInit(): void {
    this.userService.getUsers().subscribe(users => this.users = users);
  }
}
```

---

## What services are used for

| Use case | Example service |
|----------|----------------|
| HTTP requests | `UserService`, `ProductService` |
| Authentication | `AuthService` |
| Shared state | `CartService` |
| Utility logic | `DateFormatService` |
| Notifications | `ToastService` |

---

## Services for sharing data between sibling components
Components that are not parent/child can share data through a service. Both components inject the same service instance — so any change in one is seen by the other.

```typescript
// cart.service.ts
@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>([]);

  cartItems = this.items.asReadonly();

  addItem(item: CartItem) {
    this.items.update(existing => [...existing, item]);
  }
}

// ProductComponent — adds an item to the cart
export class ProductComponent {
  private cart = inject(CartService);

  add(item: CartItem) {
    this.cart.addItem(item);
  }
}

// CartIconComponent — shows item count
export class CartIconComponent {
  private cart = inject(CartService);
  count = computed(() => this.cart.cartItems().length);
}
```

`ProductComponent` and `CartIconComponent` are unrelated in the component tree. But because they share the same `CartService` instance, the icon updates automatically when a product is added.

---

## Why it matters
- Avoids repeating the same logic in multiple components
- One shared instance keeps data in sync across the app
- Easy to test — you can swap the real service with a fake one
- Keeps components focused on UI only

## Quick memory line
Service = a class that handles a specific job (data, logic, state) so components don't have to.

## Common mistakes
- Putting HTTP calls or business logic directly in components
- Creating a new service instance manually with `new UserService()` instead of using DI
- Making one giant service — split by responsibility (`UserService`, `AuthService`, etc.)
- Forgetting `providedIn: 'root'` and wondering why the service isn't available
