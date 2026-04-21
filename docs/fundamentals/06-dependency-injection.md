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

### With DI (Angular way - good)
```typescript
class MyComponent {
  constructor(private userService: UserService) {} // Angular gives it to you
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

## Quick memory line
DI = ask Angular for a service in constructor, Angular gives it to you.

## Common mistakes
- Creating service instances manually with `new`
- Forgetting `@Injectable()` decorator on services
- Putting too many responsibilities in one service
- Confusing DI with inheritance (they are different concepts)
