# Change Detection in Angular

## What is change detection?
Change detection is how Angular knows when to update the DOM. When data in your component changes, Angular needs to re-render the template to show the latest values. Change detection is the process that checks for those changes and updates the screen.

---

## How it works by default

Angular uses **Zone.js** to monitor all async activities in the browser — click events, HTTP responses, `setTimeout`, Promises, and more. Every time one of these completes, Zone.js notifies Angular: "something might have changed, go check."

Angular then walks the entire component tree from top to bottom and checks every component's template for changes. If it finds a difference between the old value and the new value, it updates the DOM.

```
User clicks button
  → Zone.js detects the event
    → Angular runs change detection
      → Checks AppComponent
        → Checks ChildComponent A
        → Checks ChildComponent B
          → Checks GrandchildComponent
      → Updates the DOM where values changed
```

This happens after every async event — every click, keypress, HTTP call, timer tick, etc.

---

## `Default` vs `OnPush` strategies

Angular gives you two change detection strategies. You set this with `changeDetection` in the `@Component` decorator.

### Default strategy

Every component in the tree is checked on every change detection cycle, regardless of whether its data actually changed.

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-product-card',
  // changeDetection: ChangeDetectionStrategy.Default — this is the default, no need to write it
  template: `<h2>{{ product.name }}</h2>`
})
export class ProductCardComponent {
  product = { name: 'Laptop' };
}
```

**Problem:** If you have a list of 1000 product cards, Angular checks all 1000 on every single user interaction — even if none of them changed.

---

### `OnPush` strategy

Angular only checks this component when one of these happens:
1. An `@Input()` reference changes (a new object/array is passed in)
2. An event happens inside this component (a click, input, etc.)
3. An Observable using the `async` pipe emits a new value
4. A Signal used in the template changes
5. You manually call `markForCheck()` or `detectChanges()`

```typescript
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h2>{{ product().name }}</h2>`
})
export class ProductCardComponent {
  product = input.required<Product>();
}
```

**Result:** Angular skips this component during most change detection cycles → less CPU work → smoother UI, especially for large lists.

---

## Important: `OnPush` cares about references, not values

With `OnPush`, Angular checks whether the input **reference** changed — not whether the data inside changed.

```typescript
// BAD — mutating an object does NOT trigger OnPush
this.product.name = 'New Name'; // same object reference → Angular skips this component

// GOOD — creating a new object triggers OnPush
this.product = { ...this.product, name: 'New Name' }; // new reference → Angular checks
```

This is why Angular (and the wider ecosystem) encourages **immutable data patterns**.

---

## Signals and change detection (Angular 17+)

Signals are a newer, more precise alternative. When a Signal used in the template changes, Angular knows exactly which components and which DOM nodes to update — without checking everything else.

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count() }}</p>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  count = signal(0);

  increment() {
    this.count.update(c => c + 1);
  }
}
```

Angular only updates the `{{ count() }}` part of the DOM — nothing else re-renders.

With `OnPush` + Signals combined, you get the most efficient setup available today.

---

## Zone.js — the engine behind default change detection

**Zone.js** is a library that Angular includes by default. It patches browser async APIs so Angular is notified every time something async completes.

What Zone.js patches:
- `addEventListener` / `removeEventListener`
- `setTimeout` / `setInterval`
- `Promise`
- `fetch` / `XMLHttpRequest`

```typescript
// You don't write Zone.js code directly — it runs in the background.
// Every one of these triggers a change detection cycle:
setTimeout(() => { this.count++; }, 1000);
fetchData().then(data => { this.items = data; });
element.addEventListener('click', () => { this.toggle(); });
```

---

## Manually triggering change detection

Sometimes you need to tell Angular to check a component manually. Two ways to do it:

### `markForCheck()`
Marks the component and all its ancestors to be checked in the next change detection cycle. Used with `OnPush` when you update data outside Angular's awareness (e.g., a third-party callback).

```typescript
import { Component, ChangeDetectorRef, inject } from '@angular/core';

@Component({ changeDetection: ChangeDetectionStrategy.OnPush, ... })
export class MyComponent {
  private cdr = inject(ChangeDetectorRef);

  onExternalEvent(data: any) {
    this.items = data;
    this.cdr.markForCheck(); // tell Angular: I changed something, check me next cycle
  }
}
```

### `detectChanges()`
Runs change detection on this component and its children immediately, right now — not at the next cycle.

```typescript
this.cdr.detectChanges(); // synchronous, immediate check
```

Use `markForCheck()` most of the time. Use `detectChanges()` only when you need an immediate synchronous update (rare).

---

## Zoneless change detection (Angular 20+ dev preview)

Angular is moving toward removing Zone.js entirely. In **zoneless** mode, Angular uses Signals as the only source of truth for what changed. No Zone.js patching, no full-tree traversal.

```typescript
// app.config.ts
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection()
  ]
};
```

**Benefits:**
- Smaller bundle (no Zone.js)
- Faster and more predictable — only Signals drive updates
- Required for some advanced use cases (WebWorkers, micro-frontends)

This is the future direction of Angular.

---

## Change detection flow — visual summary

```
Default mode (Zone.js):
  Async event → Zone.js notifies Angular → full tree check → DOM update

OnPush mode (Zone.js):
  Async event → Angular skips component unless input changed or event fired inside it

Signal mode (future — zoneless):
  Signal changes → Angular updates only the DOM nodes that read that signal
```

---

## Summary table

| Strategy | When Angular checks | Best for |
|----------|-------------------|----------|
| `Default` | Every async event, every component | Simple apps, rapid prototyping |
| `OnPush` | Input reference changes, internal events, async pipe, signals | Performance-sensitive components, large lists |
| Zoneless (Signals) | Only when a Signal changes | Maximum performance, future Angular |

---

## Quick memory line
Change detection = Angular checking what changed and updating the DOM. Default checks everything always. `OnPush` checks only when needed. Signals make it surgical — only the exact DOM that uses the changed data updates.

---

## Common mistakes
- Mutating objects/arrays with `OnPush` and wondering why the view doesn't update — always create a new reference
- Not using `OnPush` on "dumb" presentational components — they almost always should use it
- Calling `detectChanges()` when `markForCheck()` is the right tool
- Running heavy logic in Zone.js-tracked callbacks — it triggers a full change detection cycle every time
- Mixing mutable state with `OnPush` — leads to subtle bugs where the view is out of sync with the data
