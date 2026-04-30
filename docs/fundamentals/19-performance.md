# Angular Performance Optimization

## What is performance optimization?
Performance optimization is making your Angular app load faster, run smoother, and use fewer resources. A performant app responds quickly to user actions and doesn't waste computation on things that haven't changed.

---

## 1. Lazy Loading

### What it is
Load feature routes only when the user navigates to them, not at app startup. This reduces the initial bundle size.

### Without lazy loading
Everything loads at startup → large initial download → slow first page load.

### With lazy loading
```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes').then(m => m.adminRoutes)
  }
];
```

The `DashboardComponent` code is only downloaded when the user visits `/dashboard`.

---

## 2. OnPush Change Detection

### What it is
By default, Angular checks every component for changes on every browser event. `ChangeDetectionStrategy.OnPush` tells Angular: only check this component when its inputs change or an Observable it uses emits.

```typescript
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush, // add this
  template: `<h2>{{ product().name }}</h2>`
})
export class ProductCardComponent {
  product = input.required<Product>();
}
```

**Result:** Fewer change detection cycles → less CPU work → smoother UI, especially for lists with many items.

---

## 3. `track` in `@for` loops (formerly `trackBy`)

### What it is
When Angular re-renders a list, it destroys and recreates all DOM elements by default. `track` tells Angular which item maps to which DOM element so it only updates what actually changed.

```html
<!-- Without track — recreates all DOM elements on every change -->
@for (user of users) {
  <div>{{ user.name }}</div>
}

<!-- With track — only updates the items that actually changed -->
@for (user of users; track user.id) {
  <div>{{ user.name }}</div>
}
```

**Old `*ngFor` way:**
```typescript
@Component({
  template: `
    <div *ngFor="let user of users; trackBy: trackUser">
      {{ user.name }}
    </div>
  `
})
export class UserListComponent {
  trackUser(index: number, user: User): number {
    return user.id;
  }
}
```

---

## 4. Signals (Angular 17+, fully stable Angular 19+)

### What it is
Signals are a reactive primitive where Angular knows exactly which parts of the template depend on which data. Only the affected DOM nodes are updated — not the whole component.

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count() }}</p>
    <p>Double: {{ double() }}</p>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  count = signal(0);
  double = computed(() => this.count() * 2);

  increment() {
    this.count.update(c => c + 1);
  }
}
```

Angular knows that only the `count()` and `double()` expressions need to update — nothing else re-renders.

---

## 5. `async` pipe — auto-unsubscribe

The `async` pipe subscribes to an Observable in the template and automatically unsubscribes when the component is destroyed. No manual subscription or `ngOnDestroy` needed.

```typescript
// component
export class UserListComponent {
  users$ = inject(UserService).getUsers(); // Observable — not yet subscribed
}
```

```html
<!-- template -->
@if (users$ | async; as users) {
  @for (user of users; track user.id) {
    <div>{{ user.name }}</div>
  }
}
```

---

## 6. `toSignal()` — convert Observables to Signals

A cleaner alternative to `async` pipe. Converts an Observable into a Signal that you read in the template.

```typescript
import { toSignal } from '@angular/core/rxjs-interop';

export class UserListComponent {
  private userService = inject(UserService);
  users = toSignal(this.userService.getUsers(), { initialValue: [] });
}
```

```html
@for (user of users(); track user.id) {
  <div>{{ user.name }}</div>
}
```

---

## 7. Avoid expensive functions in templates

Angular re-evaluates template expressions on every change detection cycle. A function call in a template runs very frequently.

```html
<!-- BAD — computeTotal(items) runs on every change detection cycle -->
<p>Total: {{ computeTotal(items) }}</p>
```

```typescript
// GOOD — computed signal only recalculates when items actually changes
total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));
```

```html
<p>Total: {{ total() }}</p>
```

---

## 8. Preloading strategies

Load lazy routes in the background after the initial app is ready, so navigation feels instant.

```typescript
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules) // download lazy routes in the background
    )
  ]
};
```

---

## 9. Image optimization with `NgOptimizedImage`

```typescript
import { NgOptimizedImage } from '@angular/common';

@Component({
  imports: [NgOptimizedImage],
  template: `<img ngSrc="hero.jpg" width="800" height="400" priority>`
})
```

- Lazy-loads images that are off-screen automatically
- `priority` loads above-the-fold images eagerly (better Core Web Vitals score)
- Warns you if you forget to specify `width`/`height` (prevents layout shift)

---

## 10. Zoneless change detection (Angular 20+ dev preview)

### What it is
Traditionally Angular relies on **Zone.js** to know when to run change detection — it patches all browser async APIs (setTimeout, fetch, event listeners, etc.) and notifies Angular on every callback.

In Angular 20, **zoneless** change detection reached developer preview. Instead of Zone.js patching everything, Angular uses **signals** to know precisely what changed and only updates those parts.

### Why it matters
- No Zone.js overhead — smaller bundle, faster startup
- Predictable change detection (only when a signal changes)
- Required for some advanced performance scenarios (WebWorkers, micro-frontends)
- The future default of Angular

### How to opt in (Angular 20+)
```typescript
// app.config.ts
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection()
    // remove provideZoneChangeDetection() if present
  ]
};
```

### OnPush + Signals = optimal today
Even before going fully zoneless, combining `ChangeDetectionStrategy.OnPush` with signals gives you most of the performance benefits right now:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...  
})
export class ProductCardComponent {
  product = input.required<Product>(); // signal input
  discountLabel = computed(() => ...); // derived signal
}
```

This is the **recommended default** for all components in Angular 21.

---

## Summary

| Technique | What it does | Main benefit |
|-----------|-------------|--------------|
| Lazy loading | Split code into chunks loaded on demand | Faster initial load |
| `OnPush` | Skip change detection when not needed | Less CPU, smoother UI |
| `track` in `@for` | Reuse existing DOM elements | Fewer DOM operations |
| Signals | Precise, fine-grained reactivity | Only affected nodes update |
| `async` pipe / `toSignal` | Auto-unsubscribe from Observables | No memory leaks |
| Avoid template functions | Reduce repeated computation | Less CPU per cycle |
| Preloading | Background-load lazy routes | Instant navigation |
| `NgOptimizedImage` | Lazy-load and size-optimize images | Faster page, no layout shift |
| Zoneless | Remove Zone.js overhead | Smaller bundle, predictable CD |

## Quick memory line
Performance = load less upfront (lazy loading) + update less (OnPush, signals) + track DOM efficiently (track).

## Common mistakes
- Not using lazy loading — everything loads at startup
- Default change detection on every component — use `OnPush` for list items and "dumb" components
- Missing `track` in `@for` loops with large or frequently-updated lists
- Calling functions directly in templates — use `computed()` instead
- Subscribing manually and forgetting to unsubscribe — use `async` pipe or `toSignal()`
