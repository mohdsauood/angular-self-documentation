# Change Detection in Angular


## Table of Contents

- [What is change detection?](#what-is-change-detection)
- [How it works by default](#how-it-works-by-default)
- [`Default` vs `OnPush` strategies](#default-vs-onpush-strategies)
  - [Default strategy](#default-strategy)
  - [`OnPush` strategy](#onpush-strategy)
- [Important: `OnPush` cares about references, not values](#important-onpush-cares-about-references-not-values)
- [Signals and change detection (Angular 17+)](#signals-and-change-detection-angular-17)
- [Zone.js — the engine behind default change detection](#zonejs-the-engine-behind-default-change-detection)
- [Manually triggering change detection](#manually-triggering-change-detection)
  - [`markForCheck()`](#markforcheck)
  - [`detectChanges()`](#detectchanges)
- [`ExpressionChangedAfterItHasBeenCheckedError`](#expressionchangedafterithasbeencheckederror)
  - [What is it?](#what-is-it)
  - [Why it happens](#why-it-happens)
  - [The most common triggers](#the-most-common-triggers)
  - [Why it only appears in dev mode](#why-it-only-appears-in-dev-mode)
  - [How to fix it — decision tree](#how-to-fix-it-decision-tree)
  - [The `Promise.resolve().then()` escape hatch](#the-promiseresolvethen-escape-hatch)
  - [Quick memory line](#quick-memory-line)
- [Zoneless change detection (Angular 20+ dev preview)](#zoneless-change-detection-angular-20-dev-preview)
- [Change detection flow — visual summary](#change-detection-flow-visual-summary)
- [Summary table](#summary-table)
- [Quick memory line](#quick-memory-line-1)
- [Common mistakes](#common-mistakes)

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

#### "Next cycle" does NOT mean a delay

A common misconception: "next change detection cycle" sounds like it might be slow or happen after a long wait. It isn't.

Change detection cycles are triggered by events — clicks, HTTP responses, timers, keyboard input. "Next cycle" = the one that runs when the next event fires, which in a live app is **milliseconds away**.

If there are no events for an extended period, nothing on screen would change anyway — the user isn't interacting, so there's nothing to miss.

#### Why `markForCheck()` is needed at all

With `OnPush`, Angular only checks a component when it has reason to. If data changes inside a callback that Zone.js never saw — a third-party WebSocket library, a raw `addEventListener`, a non-Angular timer — Angular has no idea the data changed. Without `markForCheck()`, the screen stays **frozen forever**, not just until the next cycle.

```typescript
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class PriceComponent {
  price = 0;
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    // Third-party WebSocket — runs OUTSIDE Angular's Zone
    externalWebSocket.onMessage((data) => {
      this.price = data.price;
      // Without markForCheck(): screen is frozen, old price shown forever
      this.cdr.markForCheck(); // ← Angular will check this component next cycle
    });
  }
}
```

#### When each trigger already handles it for you

You only need `markForCheck()` manually when Angular's normal triggers aren't in play:

| How data changes | `markForCheck()` needed? |
|---|---|
| Angular template event `(click)`, `(input)` etc. | ❌ — `OnPush` sees it automatically |
| `async` pipe on an Observable | ❌ — `async` pipe calls it internally |
| A Signal used in the template | ❌ — Angular tracks Signals automatically |
| Third-party callback / raw `addEventListener` | ✅ — Zone.js didn't see it, you must call it |
| Non-Angular WebSocket / external library | ✅ — same reason |

### `detectChanges()`
Runs change detection on this component and its children **immediately and synchronously** — right now, not at the next cycle. Unlike `markForCheck()` which schedules a check, `detectChanges()` forces one to happen on the spot.

```typescript
this.cdr.detectChanges(); // runs right now, synchronously
```

#### When to actually use `detectChanges()`

**1. You need the DOM to be updated before you read it**

You set some data, and immediately need to measure a DOM element (e.g., its height, scroll position). If you only called `markForCheck()`, the DOM wouldn't be updated yet — you'd read stale values.

```typescript
this.items = newItems;
this.cdr.detectChanges(); // DOM is updated NOW
const height = this.listEl.nativeElement.scrollHeight; // reading updated DOM ✅
```

**2. Inside `ngAfterViewInit` or `ngAfterContentInit` with `OnPush`**

These lifecycle hooks run after the view is already checked. If you set data inside them, Angular is done checking for this cycle — the view won't update. `detectChanges()` forces an immediate re-check.

```typescript
ngAfterViewInit() {
  this.title = 'Loaded'; // set after view init
  this.cdr.detectChanges(); // without this, OnPush won't reflect the new title
}
```

**3. During unit tests**

In Angular tests, change detection doesn't run automatically. You call `detectChanges()` to trigger it manually and see the updated DOM.

```typescript
// In a test
component.title = 'New Title';
fixture.detectChanges(); // triggers change detection so the template reflects the change
expect(fixture.nativeElement.querySelector('h1').textContent).toBe('New Title');
```

This is by far the most common place you'll see `detectChanges()` in real Angular codebases.

**4. Rendering content inside a dynamically created component**

When you create a component dynamically via `ViewContainerRef`, it may not be part of the normal check cycle yet. Calling `detectChanges()` on its `ChangeDetectorRef` ensures it renders immediately.

#### `markForCheck()` vs `detectChanges()` — the key difference

| | `markForCheck()` | `detectChanges()` |
|---|---|---|
| When it runs | Next change detection cycle | Immediately, right now |
| Synchronous? | ❌ | ✅ |
| Checks ancestors too? | ✅ (marks up the tree) | ❌ (only this component + children) |
| Common use | External callbacks, WebSockets | DOM reads after update, `ngAfterViewInit`, tests |
| Risk | None | Can cause `ExpressionChangedAfterChecked` error if misused |

**Default choice: `markForCheck()`.** Only reach for `detectChanges()` when you specifically need the DOM updated before you do something else with it, or in tests.

---

## `ExpressionChangedAfterItHasBeenCheckedError`

### What is it?

This is one of the most common Angular errors you'll hit in development. You'll see it in the browser console as:

```
ERROR Error: ExpressionChangedAfterItHasBeenCheckedError:
Expression has changed after it was checked.
Previous value: 'false'. Current value: 'true'.
```

Angular only throws this **in development mode**. In production it's silently ignored — which is actually worse, because it means your UI is inconsistent with your data.

### Why it happens

Angular's change detection runs in two phases in development:
1. **Check phase** — reads all template expressions and compares to previous values, updates the DOM
2. **Verification phase** (dev only) — runs again immediately to confirm nothing changed during phase 1

If something changed *during* or *after* phase 1 (meaning phase 2 sees a different value than phase 1 just set), Angular panics and throws this error. It's telling you: "After I finished checking, something changed the data I just checked. My rendered DOM is already wrong."

### The most common triggers

**1. Changing data in `ngAfterViewInit`**

`ngAfterViewInit` runs *after* the check cycle is done. If you change a template-bound property here, Angular already rendered it as the old value.

```typescript
// BAD
ngAfterViewInit() {
  this.title = 'Loaded'; // change detection already ran, title was rendered as ''
  // Angular's verification pass sees 'Loaded' ≠ '' → error
}

// GOOD — force an immediate re-check so both phases see the same value
ngAfterViewInit() {
  this.title = 'Loaded';
  this.cdr.detectChanges(); // re-runs check right now, before the verification pass
}
```

**2. A parent reading a child's state in the template**

```typescript
// child.component.ts
export class ChildComponent {
  isReady = false;

  ngOnInit() {
    this.isReady = true; // set during init — parent already rendered with isReady = false
  }
}
```

```html
<!-- parent template — reads child's property AFTER child already changed it -->
<app-child #child></app-child>
<p>{{ child.isReady }}</p>  <!-- error: was false when checked, now true -->
```

Fix: move state to the parent, or use a Signal/Observable to communicate upward.

**3. A method call in the template that has side effects**

```html
<!-- BAD — getTitle() changes a property as a side effect -->
<h1>{{ getTitle() }}</h1>
```

```typescript
getTitle() {
  this.count++; // side effect — changes count every time Angular reads the template
  return 'Hello';
}
```

Template expressions should be **pure** — they should only return a value, never change state.

### Why it only appears in dev mode

In production Angular skips the verification phase for performance. The error disappears, but the bug is still there — your DOM renders with stale data. That's why you must fix these errors even though they "go away" in production.

### How to fix it — decision tree

```
Got ExpressionChangedAfterChecked?
  │
  ├─ Did you change data in ngAfterViewInit / ngAfterContentInit?
  │    └─ Add this.cdr.detectChanges() after the change
  │
  ├─ Is a parent reading data from a child's property?
  │    └─ Lift the state up to the parent, or use an EventEmitter / Signal
  │
  ├─ Is a method in the template changing state as a side effect?
  │    └─ Make the method pure — only return values, never mutate state
  │
  └─ Are you using async operations in a lifecycle hook?
       └─ Use async pipe, or defer the change with Promise.resolve().then(...)
```

### The `Promise.resolve().then()` escape hatch

For cases where you genuinely need to update something after Angular's check, you can defer the change to the next microtask — after both check and verification phases:

```typescript
ngAfterViewInit() {
  Promise.resolve().then(() => {
    this.title = 'Loaded'; // runs after the current check cycle is fully complete
    // markForCheck is enough here since we're now in the next microtask
    this.cdr.markForCheck();
  });
}
```

Use this sparingly — it's an escape hatch, not a solution. The real fix is restructuring your code so the change happens before check detection runs.

### Quick memory line
`ExpressionChangedAfterChecked` = Angular caught you changing data after it already rendered it. Fix it by using `detectChanges()` in `ngAfterViewInit`, lifting state up, or keeping template expressions side-effect free.

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
