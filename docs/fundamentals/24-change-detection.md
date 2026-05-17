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

---

## Common Misconception: When you DON'T need `markForCheck()`

Many developers add `markForCheck()` everywhere, thinking `OnPush` components need it. But there are many cases where Angular handles change detection automatically, even with `OnPush`.

---

### Router navigation works without `markForCheck()`

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>{{ isHistoryPage }}</div>`
})
export class CurrencyComponent {
  isHistoryPage = false;

  constructor(
    private router: Router,
    private currencyService: CurrencyService
  ) {}

  ngOnInit() {
    // This works WITHOUT markForCheck()
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.isHistoryPage = e.url.includes('historical-rates');
        // Angular automatically updates the template
      });
  }
}
```

**Why it works:**

Router navigation is Angular-managed. Internally:

```
NavigationEnd event fires
  ↓
Zone.js detects async completion
  ↓
Angular starts global change detection
  ↓
Your component checked (even though OnPush)
  ↓
Template updates
```

Since your component is part of the tree and the event originated from Angular's zone, Angular automatically runs CD and checks your component.

**Key insight:** Router events are already Angular-aware, so `OnPush` components still update.

---

### Reactive Forms (`.patchValue()`, `.setValue()`) work without `markForCheck()`

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input formControlName="fromCurrency">`
})
export class ExchangeComponent implements OnInit {
  exchangeForm = new FormGroup({
    fromCurrency: new FormControl('USD'),
    toCurrency: new FormControl('EUR')
  });

  constructor(private currencyService: CurrencyService) {}

  ngOnInit() {
    // This works WITHOUT markForCheck()
    this.currencyService.conversionState$.subscribe(state => {
      this.exchangeForm.patchValue({
        fromCurrency: state.fromCurrency,
        toCurrency: state.toCurrency
      });
      // Angular automatically updates the form inputs
    });
  }
}
```

**Why it works:**

Reactive Forms are deeply integrated with Angular's change detection system. When you call:

```typescript
formControl.setValue(...)
form.patchValue(...)
```

Internally, the Forms API:
- Updates the `FormControl` state
- Emits `valueChanges` Observable
- Triggers form directives
- Writes values into DOM inputs through value accessors
- **Already integrates with Angular's CD system**

So Angular automatically marks the component as needing checking.

**Key difference:**

```typescript
// This might need markForCheck() with OnPush
this.someObject.name = 'USD'; // plain object mutation

// This does NOT need markForCheck()
this.formControl.setValue('USD'); // Forms API integration
```

Forms are special — they're built to work seamlessly with Angular CD.

---

### RxJS subscriptions inside Angular zone work automatically

As long as your subscription runs inside Angular's `NgZone` (the default), Angular automatically runs CD when the subscription callback completes.

```typescript
// All of these are inside Angular zone by default:

this.http.get('/api').subscribe(data => {
  this.value = data; // Angular runs CD after this
});

this.router.events.subscribe(event => {
  this.current = event; // Angular runs CD after this
});

setTimeout(() => {
  this.count++; // Angular runs CD after this (Zone.js patched)
}, 1000);
```

**You only need `markForCheck()` if you run code OUTSIDE Angular's zone:**

```typescript
constructor(private ngZone: NgZone) {}

ngOnInit() {
  this.ngZone.runOutsideAngular(() => {
    // This code runs OUTSIDE Angular's awareness
    websocket.onmessage = () => {
      this.value = msg.data;
      this.cdr.markForCheck(); // ✅ Need this now
    };
  });
}
```

---

### The actual rule for `OnPush`

People often oversimplify `OnPush` as:

> ❌ "Component only updates when `@Input` reference changes"

That's incomplete. The actual rule is:

> ✅ "Component is checked only when something marks it dirty, and many things mark it dirty automatically"

What marks a component dirty in `OnPush`?

1. ✅ `@Input()` reference changed — automatic
2. ✅ DOM event inside component — automatic
3. ✅ `async` pipe emitted — automatic (async pipe calls `markForCheck()` internally)
4. ✅ Signal in template changed — automatic (Angular 17+)
5. ✅ Router navigation — automatic (triggers global CD)
6. ✅ Forms updates — automatic (Forms API integrates)
7. ✅ Zone.js-detected async completion — automatic
8. ✅ Manual `markForCheck()` — you called it
9. ✅ Manual `detectChanges()` — you called it

In most Angular applications, your components are already getting checked through #1-7, so you rarely need manual `markForCheck()`.

---

### When you ACTUALLY need `markForCheck()`

Only when:

1. **Code runs outside Angular's Zone**
   ```typescript
   this.ngZone.runOutsideAngular(() => { /* ... */ });
   this.cdr.markForCheck();
   ```

2. **Third-party library callbacks** that don't go through Angular
   ```typescript
   externalLibrary.onUpdate(() => {
     this.value = newValue;
     this.cdr.markForCheck();
   });
   ```

3. **Raw `addEventListener`** outside Angular
   ```typescript
   element.addEventListener('custom-event', () => {
     this.value = newValue;
     this.cdr.markForCheck();
   });
   ```

4. **Non-Angular timers/intervals** (rare)
   ```typescript
   // This is unusual — normally use Zone.js-aware setTimeout
   nativeTimerLibrary.setTimeout(() => {
     this.value = newValue;
     this.cdr.markForCheck();
   });
   ```

---

### The simple mental model

```
Inside Angular's zone and using Angular features?
  → YES: Angular handles CD automatically, even with OnPush
  → NO: You may need markForCheck()

Examples of "inside Angular's zone":
  ✅ Router events
  ✅ HTTP requests
  ✅ Forms updates
  ✅ RxJS subscriptions (default)
  ✅ Template events (click, input, etc.)
  ✅ Signals
  ✅ async pipe

Examples of "outside Angular's zone":
  ❌ ngZone.runOutsideAngular(() => ...)
  ❌ Raw addEventListener
  ❌ Third-party callbacks
  ❌ Non-Angular libraries
```

Use `markForCheck()` **only** for the "outside Angular's zone" cases.

For everything else, let Angular handle it.

---

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

---

## The Critical Distinction: Change Detection Cycles vs Component Eligibility

### The Confusion 🔴

Many developers think:

> "Browser events like mousemove/click already trigger change detection, so why do we need `markForCheck()` for `OnPush` components?"

This sounds logical, but it's **incomplete**. Here's why you're confused:

---

### What Actually Happens

**Two different things are happening:**

1. **Browser event fires** → Zone.js detects it → Angular starts a change detection cycle
2. **During that cycle**, Angular asks each component: "Are you dirty? Do you need checking?"

For `OnPush` components, the answer to #2 is only YES if:
- An `@Input()` reference changed
- An event originated INSIDE this component
- `async` pipe emitted
- `markForCheck()` was called
- A Signal changed

Otherwise, Angular **skips the component entirely**.

---

### Example: Why mousemove doesn't help

```typescript
@Component({
  selector: 'app-price',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Price: {{ price }}</p>`
})
export class PriceComponent {
  price = 0;
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    // External WebSocket — not an Angular event
    externalSocket.onMessage(data => {
      this.price = data.price; // data updated here
      // 🔴 Without markForCheck(): price never updates on screen
    });
  }
}
```

**Timeline:**

1. Data arrives from WebSocket
2. `this.price = data.price` ✅ (JavaScript variable updated)
3. But Angular doesn't know about this event
4. When Angular checks this component, it asks: "Did you change?"
5. `OnPush` says: "No, nothing interesting happened"
6. Angular skips the component → **UI stays frozen at old price** ❌

Now mousemove happens:

7. User moves mouse
8. Zone.js: "mousemove event! Start CD cycle!"
9. Angular checks: "PriceComponent, are you dirty?"
10. `OnPush`: "No, mousemove didn't happen inside MY component"
11. Skipped again ❌

The mousemove event triggered a CD cycle, but PriceComponent was never marked eligible for checking.

---

### With `markForCheck()`

```typescript
ngOnInit() {
  externalSocket.onMessage(data => {
    this.price = data.price;
    this.cdr.markForCheck(); // ✅ Tell Angular: check me next cycle
  });
}
```

**Timeline:**

1. Data arrives from WebSocket
2. `this.price = data.price`
3. `markForCheck()` sets: **"this component is DIRTY"**
4. Next event fires (mousemove, click, etc.)
5. Angular runs CD cycle
6. Angular asks: "PriceComponent, are you dirty?"
7. `OnPush`: "YES! Someone called `markForCheck()`"
8. Angular checks the component ✅
9. Price updates on screen ✅

---

### Why clicks inside the component work automatically

```html
<button (click)="refresh()">Refresh</button>
```

```typescript
refresh() {
  this.price++; // update data
}
```

This works WITHOUT `markForCheck()` because:

Angular automatically marks a component dirty when:
- An event happens **inside** that component's template
- An `@Input()` changes
- The `async` pipe emits

Angular knows: "If an event originated here, this component needs checking."

But if the event happened **outside** Angular's awareness (WebSocket, raw `addEventListener`, third-party library callback), Angular never marks it dirty.

---

### Why `async` pipe works automatically

The `async` pipe internally calls `markForCheck()` for you:

```html
<p>{{ price$ | async }}</p>
```

When the Observable emits:

1. `async` pipe receives value
2. `async` pipe calls `markForCheck()` internally ← This is key!
3. Component marked dirty
4. Next CD cycle checks the component
5. Price updates on screen ✅

That's why you never need manual `markForCheck()` when using `async` pipe.

---

### The Mental Model

Think of `OnPush` like this:

```
Angular (during change detection cycle):
  "Should I check this component?"

  Default strategy:
    → "YES always, check everything"

  OnPush strategy:
    → "Only if something important happened"

markForCheck() tells Angular:
    → "Something important happened."
```

Without `markForCheck()`, Angular sees:

```
"Did anything relevant happen in your component?"
OnPush: "No, that event was external to me."
Angular: "Skipping."
```

---

### SUPER IMPORTANT: Complete the mental model

**Incomplete mental model (wrong):**
> "Browser events trigger change detection"

**Complete mental model (correct):**
> "Browser events trigger a change detection **cycle**, but `OnPush` components are only checked if they are marked dirty."

That one word — "cycle" vs "component" — is the source of most confusion about `markForCheck()`.

---

## Deep Dive: What "event originated from this component" actually means

### The specific definition

"Event originated from this component" means:

> Any **DOM event handled inside this component's template** using Angular's event binding syntax.

**Examples that automatically mark component dirty:**

```html
<button (click)="save()">Save</button>

<input (input)="onInput($event)" />

<div (mousemove)="track()"></div>

<form (submit)="handleSubmit($event)">
  <input (keydown)="onKeydown($event)" />
</form>
```

All of these — button clicks, mousemove, input events, keydown, submit — automatically mark the component dirty in `OnPush`.

---

### Not just `@Output()` and `EventEmitter`

You might think "originated from this component" means only `EventEmitter` outputs. It's broader:

```typescript
@Output() saved = new EventEmitter();
```

This works too, but Angular events are broader than `EventEmitter`. The key is:

> Did Angular handle an **event listener** inside this component's template?

If YES → Angular marks component for checking.

---

### Working example

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button (click)="increment()">+</button>
    {{ count }}
  `
})
export class CounterComponent {
  count = 0;

  increment() {
    this.count++;
  }
}
```

Even WITHOUT `markForCheck()`:

1. User clicks button
2. Angular recognizes: "This event came from inside THIS component"
3. Component automatically marked dirty
4. Angular checks the component on next CD cycle
5. `{{ count }}` updates to `1` ✅

---

### This won't update (no `markForCheck()` needed, but it won't work anyway)

```typescript
ngOnInit() {
  setTimeout(() => {
    this.count++; // update data
  }, 1000);
}
```

Why it stays frozen:

* Timer fired **outside** component template
* No Angular template event happened
* No `@Input()` changed
* Component not marked dirty
* `OnPush` skips it

The timer triggered a CD cycle (Zone.js saw it), but the component was never marked eligible for checking.

---

## Deep Dive: `markForCheck()` vs `detectChanges()` — the real difference

### The confusion

These do completely different things, but they sound similar.

You asked:
> "If component is not marked for check, what's the point of `markForCheck()`?"

Here's the actual difference:

---

### `markForCheck()` — Schedule a check for next cycle

```typescript
this.cdr.markForCheck();
```

**What it means:**

```text
"Angular, please check me later
during the next change detection cycle."
```

**Key point:** It does NOT run CD immediately. It only marks component dirty.

**Flow:**

```typescript
setTimeout(() => {
  this.value = 10;
  this.cdr.markForCheck();  // ← just marks component dirty
}, 1000);

// Timeline:
// t=1s: timer fires
// → data changes to 10
// → component marked dirty
// → Angular WAITS for next event
// → next event triggers CD cycle
// → component checked
// → UI updates
```

---

### `detectChanges()` — Check RIGHT NOW

```typescript
this.cdr.detectChanges();
```

**What it means:**

```text
"Run change detection RIGHT NOW
for this component and its children."
```

**Key point:** It FORCEFULLY runs detection immediately. Ignores all `OnPush` restrictions.

**Flow:**

```typescript
setTimeout(() => {
  this.value = 10;
  this.cdr.detectChanges();  // ← runs detection NOW
}, 1000);

// Timeline:
// t=1s: timer fires
// → data changes to 10
// → detectChanges() runs IMMEDIATELY
// → UI updates instantly
// → no waiting for next cycle
```

---

### The biggest difference: Timing

| Aspect | `markForCheck()` | `detectChanges()` |
|---|---|---|
| **Timing** | Schedules check for next cycle | Runs immediately |
| **Synchronous?** | ❌ Asynchronous | ✅ Synchronous |
| **When to use** | Most of the time | Only when you need DOM updated before next line of code |

---

### Simple analogy 🎯

#### `markForCheck()` — raise your hand

```
Classroom scenario:

Student (component):
  "Teacher, I have a new answer. Check it next time you look around."

Teacher (Angular):
  Eventually notices hand raised and checks the answer.
```

#### `detectChanges()` — walk to teacher's desk

```
Classroom scenario:

Student (component):
  "Teacher, I have a new answer. Check it RIGHT NOW!"
  *walks to teacher's desk*

Teacher (Angular):
  Immediately stops and checks the answer.
```

---

### Critical detail: `detectChanges()` ignores `OnPush` restrictions

This is very important.

`OnPush` normally prevents checking unless conditions are met.

But `detectChanges()` **bypasses** those restrictions entirely.

It directly runs CD on:
- This component
- All child components

Even if not marked dirty.

That's why it works — it's forcing a check regardless of component strategy.

---

### So why not always use `detectChanges()`?

Because it's more expensive.

**Performance cost:**

- `markForCheck()` — just sets a flag (tiny)
- `detectChanges()` — forces synchronous work immediately (expensive)

Angular can batch multiple `markForCheck()` calls efficiently.

But `detectChanges()` runs right now, blocking everything.

Usually prefer `markForCheck()` for this reason.

---

### Important: `markForCheck()` still needs a future CD cycle

Here's a subtle but important detail:

```typescript
this.cdr.markForCheck();
```

This marks the component dirty.

BUT — if no future Angular change detection cycle ever happens, the UI still won't update.

Something still needs to trigger a CD cycle:

* User event (click, keydown, etc.)
* Timer (setTimeout, setInterval)
* HTTP request completion
* Promise resolution
* Observable emission
* Zone.js activity
* Manual `ApplicationRef.tick()`

Example:

```typescript
// BAD — relies on a future event that might not come
setTimeout(() => {
  this.value = 10;
  this.cdr.markForCheck();
  // If user doesn't interact, CD cycle never happens, UI doesn't update
}, 100000);

// GOOD — ensure CD happens
setTimeout(() => {
  this.value = 10;
  this.cdr.detectChanges(); // ← runs immediately, no waiting
}, 100000);
```

Usually this is not an issue in real apps because there are always upcoming events. But it's good to understand.

---

## Final mental model summary

### Browser event

```text
Triggers a change detection CYCLE
(Angular starts checking components)
```

### `OnPush` strategy

```text
Angular asks each component:
"Are you dirty? Need checking?"
```

### `markForCheck()`

```text
Answer:
"YES check me next cycle"
(passive request)
```

### `detectChanges()`

```text
Answer:
"Don't ask questions.
Check me immediately."
(immediate execution, ignores OnPush)
```

---

## Advanced: `detectChanges()` scope and children

### Does `detectChanges()` check ONLY current component, or children too?

**YES, it checks children recursively.**

```typescript
this.cdr.detectChanges();
```

Runs change detection for:
- Current component
- Its entire child subtree

It does NOT check:
- Parent components
- Sibling components
- Any other part of the tree

---

### Example: Component tree

```
AppComponent
 ├── HeaderComponent
 ├── DashboardComponent
 │     ├── ChartComponent
 │     └── TableComponent
 └── FooterComponent
```

If you call inside `DashboardComponent`:

```typescript
this.cdr.detectChanges();
```

Angular checks:

```
DashboardComponent ✅
 ├── ChartComponent ✅
 └── TableComponent ✅
```

It does NOT check:

```
AppComponent ❌
HeaderComponent ❌
FooterComponent ❌
```

---

### Important: Children get checked even if `OnPush`

When `detectChanges()` runs, even child components with `OnPush` strategy get checked.

`detectChanges()` **forces** checking regardless of component strategy.

---

### `detectChanges()` does NOT mark component dirty

This is important to understand:

```typescript
this.cdr.detectChanges();
```

Does NOT call `markForCheck()`.

Instead, it **directly runs checking** immediately, bypassing the dirty-check mechanism entirely.

Difference:

```typescript
// This marks dirty, waits for next cycle
this.cdr.markForCheck();

// This runs checking right now, immediately
this.cdr.detectChanges();
```

---

## Advanced: What "synchronous work immediately" really means

### Synchronous = Blocks everything

"Synchronous work immediately" means:

> Angular does the checking and DOM updating **RIGHT NOW** before the next line of JavaScript executes.

---

### Example: Synchronous execution

```typescript
this.value = 10;

this.cdr.detectChanges(); // ← runs NOW

console.log('done');
```

**Execution order:**

1. `this.value = 10` ✅
2. Angular updates DOM immediately ✅
3. `console.log('done')` runs ✅

The DOM is updated before the code continues.

---

### Compare with `markForCheck()` — asynchronous

```typescript
this.value = 10;

this.cdr.markForCheck(); // ← just marks dirty

console.log('done');
```

**Execution order:**

1. `this.value = 10` ✅
2. Component marked dirty ✅
3. `console.log('done')` runs ✅
4. Angular updates DOM LATER (next cycle) ✅

The DOM update is postponed.

---

### Why synchronous work is expensive

Every time you call `detectChanges()`, Angular:
- Re-renders your component
- Re-renders all children
- Updates the DOM
- Right now, not later

If you do this in a loop:

```typescript
for (let i = 0; i < 1000; i++) {
  this.cdr.detectChanges(); // 🔴 Forces re-render 1000 times immediately
}
```

You force Angular to re-render 1000 times synchronously.

Performance tank. 📉

---

### The DOM is updated before the code continues.

---

### Compare with `markForCheck()` — asynchronous

```typescript
this.value = 10;

this.cdr.markForCheck(); // ← just marks dirty

console.log('done');
```

**Execution order:**

1. `this.value = 10` ✅
2. Component marked dirty ✅
3. `console.log('done')` runs ✅
4. Angular updates DOM LATER (next cycle) ✅

The DOM update is postponed.

---

### Why synchronous work is expensive

Every time you call `detectChanges()`, Angular:
- Re-renders your component
- Re-renders all children
- Updates the DOM
- Right now, not later

If you do this in a loop:

```typescript
for (let i = 0; i < 1000; i++) {
  this.cdr.detectChanges(); // 🔴 Forces re-render 1000 times immediately
}
```

You force Angular to re-render 1000 times synchronously.

Performance tank. 📉

---

### Async work can be batched

With `markForCheck()`, Angular can batch multiple dirty marks:

```typescript
for (let i = 0; i < 1000; i++) {
  this.cdr.markForCheck(); // just marks dirty 1000 times
}
// Angular runs CD once, checks everything that's dirty
```

Much more efficient.

---

## ⚠️ PERFORMANCE: Real-world `detectChanges()` disasters

The loop example above is artificial, but the real problem is still valid: **forcing Angular to walk component trees and update DOM too frequently**.

Let's look at practical scenarios where `detectChanges()` becomes a performance problem:

---

### What `detectChanges()` actually does

When you call:

```typescript
this.cdr.detectChanges();
```

Angular immediately:

1. Checks all template bindings
2. Compares old vs new values
3. Updates DOM if values changed
4. Recursively checks child components

This **entire process happens RIGHT NOW**, even if:
- The browser is busy
- Angular was planning to do it in a few milliseconds anyway
- Updates could be batched more efficiently

---

### Real Problem #1: High-frequency events

**Example: Typing in search input**

```html
<input (input)="onType($event)">
```

```typescript
onType(e: Event) {
  this.search = (e.target as HTMLInputElement).value;
  this.cdr.detectChanges(); // ❌ Bad idea
}
```

**The problem:**

Angular ALREADY runs change detection after input events automatically.

So your `detectChanges()` call is **duplicate, unnecessary work**.

Every keystroke forces immediate CD when Angular was already planning to check it.

**Real-world impact:** UI feels jankier, especially on slower devices.

---

### Real Problem #2: Frequent events

**Example: Stock price ticker (50 updates/sec)**

```typescript
socket.onmessage = msg => {
  this.price = msg.price;
  this.cdr.detectChanges(); // ❌ 50 forced checks per second!
};
```

Now Angular performs a full component check **50 times per second**.

If your component tree is large, that's a lot of work.

```
1 second = 50 full tree walks + DOM updates
```

vs with `markForCheck()`:

```
1 second = a few batched update cycles
```

Massive difference.

---

### Real Problem #3: Dangerous event types

These events fire **VERY frequently**:

```html
<div (mousemove)="move($event)">Track cursor</div>
<div (scroll)="onScroll($event)">Scroll handler</div>
<div (resize)="onResize($event)">Resize handler</div>
```

**If you use `detectChanges()` on these:**

```typescript
move(e: MouseEvent) {
  this.x = e.clientX;
  this.y = e.clientY;
  this.cdr.detectChanges(); // 🔴 JANK WARNING
}
```

**Result:**

- Mousemove can fire 60+ times per second (every frame)
- Each fires forces immediate CD + DOM update
- Browser can't optimize or batch
- Causes: jank, lag, dropped frames, high CPU usage

---

### The Real-world Disaster Example

```typescript
@Component({
  template: `<div (mousemove)="track($event)">{{ x }}, {{ y }}</div>`
})
export class TrackingComponent {
  x = 0;
  y = 0;
  
  constructor(private cdr: ChangeDetectorRef) {}

  track(e: MouseEvent) {
    this.x = e.clientX;
    this.y = e.clientY;
    this.cdr.detectChanges(); // ❌ Catastrophic for performance
  }
}
```

**What happens when user moves mouse:**

```
Mousemove fires
→ track() called
→ x, y updated
→ detectChanges() forces immediate check
→ DOM updated
→ browser renders
→ 60ms later, another mousemove fires
→ repeat
```

Result: UI becomes sluggish, CPU goes high, animations stutter.

---

### Why DOM updates are expensive

Not just the Angular checking is expensive. DOM updates themselves are expensive.

When `detectChanges()` runs:

1. Template bindings are checked
2. DOM elements may get updated
3. Browser triggers layout calculation
4. Browser triggers repaint
5. GPU renders to screen

Step 3-5 are particularly slow.

For high-frequency events (mousemove, scroll, resize), doing this constantly = disaster.

---

### When IS `detectChanges()` actually useful?

`detectChanges()` makes sense only when:

1. **Angular doesn't know about the update** — External library callback or code outside Angular's Zone
2. **You need the DOM updated before the next line runs** — Reading DOM properties immediately after
3. **Unit tests** — Manually trigger CD to see results

**Example where it makes sense:**

```typescript
externalLibrary.onUpdate(data => {
  this.value = data; // update from non-Angular source
  this.cdr.detectChanges(); // ✅ Angular might never run CD automatically
});
```

**Example where it DOESN'T make sense:**

```typescript
(click)="handleClick()" {
  this.value = 10;
  this.cdr.detectChanges(); // ❌ Angular already runs CD for clicks
}
```

---

### Best practices to avoid `detectChanges()` performance issues

**1. Use `async` pipe instead**

```html
<!-- ✅ Good -->
{{ price$ | async }}

<!-- ❌ Avoid -->
{{ price }}
```

The `async` pipe handles CD efficiently internally.

---

**2. Use Signals instead**

```typescript
// ✅ Good — only updates this binding
price = signal(100);
template: {{ price() }}

// ❌ Avoid
price = 100;
this.cdr.detectChanges();
```

Signals are fine-grained and efficient.

---

**3. Use `markForCheck()` instead of `detectChanges()`**

```typescript
// ✅ Better
socket.onmessage = msg => {
  this.price = msg.price;
  this.cdr.markForCheck(); // let Angular batch this
};

// ❌ Expensive
socket.onmessage = msg => {
  this.price = msg.price;
  this.cdr.detectChanges(); // forces immediate render
};
```

Let Angular batch updates naturally.

---

**4. Debounce high-frequency events**

```typescript
// ✅ Good — limits CD checks
@HostListener('mousemove', ['$event'])
@debounceTime(100) // or use a debounce operator
track(e: MouseEvent) {
  this.x = e.clientX;
  this.y = e.clientY;
}

// ❌ Bad — CD on every mousemove
@HostListener('mousemove')
track(e: MouseEvent) {
  this.x = e.clientX;
  this.y = e.clientY;
  this.cdr.detectChanges();
}
```

---

**5. Avoid `detectChanges()` in high-frequency events**

```typescript
// ❌ NEVER do this
@HostListener('mousemove', ['$event'])
track(e: MouseEvent) {
  this.cdr.detectChanges(); // per-frame jank
}

// ❌ NEVER do this
@HostListener('scroll')
onScroll() {
  this.cdr.detectChanges(); // scroll jank
}

// ✅ Use markForCheck() if needed
@HostListener('mousemove', ['$event'])
track(e: MouseEvent) {
  this.cdr.markForCheck(); // batches naturally
}
```

---

### The mental model analogy

**Imagine Angular's update system:**

```
Angular says:
"I'll clean the house in 5 seconds.
I can batch all the cleaning efficiently."
```

**With `markForCheck()`:**

```
You say:
"Okay, but mark these rooms as dirty so you know to clean them."

Angular:
"Thanks! I'll clean everything when I do my cycle."
```

Efficient. Batched. Optimized.

**With `detectChanges()`:**

```
You say:
"STOP EVERYTHING. CLEAN NOW!"

Angular:
"But I was going to—"

You:
"CLEAN NOW!"
(calls detectChanges again)

Angular:
"But I just—"

You:
"CLEAN NOW!"

Angular:
(exhausted, high CPU usage)
```

Wasteful. Repetitive. Performance disaster.

---

### Summary of when to use what

| Situation | Use | Why |
|---|---|---|
| Template event (click, input, etc.) | Nothing — Angular handles | Angular already runs CD |
| Observable with `async` pipe | Nothing — async pipe handles | async pipe internally marks dirty |
| Signal used in template | Nothing — Angular tracks | Signals are reactive |
| Third-party callback | `detectChanges()` | Angular doesn't know about it |
| Need DOM updated before next line | `detectChanges()` | Synchronous guarantee needed |
| High-frequency events | `markForCheck()` | Let Angular batch |
| Most other cases | `markForCheck()` | Efficient, lets Angular optimize |
| **Almost never** | `detectChanges()` in loops | Forces repeated expensive work |

---

### Key takeaway

```
markForCheck() = "let Angular optimize"
detectChanges() = "do it now, ignore optimization"
```

Use `markForCheck()` as your default. Only use `detectChanges()` when you specifically need synchronous DOM updates.

Especially **never** use `detectChanges()` in loops or high-frequency events.



### Zone.js is the engine

Zone.js is a library Angular includes by default. It **monkey-patches** browser async APIs.

"Monkey-patch" means:
> Replace the original browser function with a wrapper that also tells Angular "something happened."

When Zone.js detects async work completing, it tells Angular:
```
"Something async finished. Start a change detection cycle."
```

---

### What Zone.js patches (and triggers CD)

#### Browser DOM events

```text
click
input
keydown
keyup
keypress
mousemove
mouseenter
mouseleave
scroll
submit
change
blur
focus
```

All of these trigger a CD cycle when they fire.

---

#### Timers

```typescript
setTimeout(() => {
  this.value = 10; // CD cycle triggered when callback runs
}, 1000);

setInterval(() => {
  this.count++; // CD cycle triggered each time
}, 5000);
```

---

#### HTTP / AJAX

```typescript
this.http.get('/api').subscribe(data => {
  this.data = data; // CD cycle triggered when response arrives
});

// or raw XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.addEventListener('load', () => {
  // CD cycle triggered here
});
```

---

#### Promises

```typescript
Promise.resolve().then(() => {
  this.value = 10; // CD cycle triggered here
});

async () => {
  const data = await fetch('/api'); // CD cycle when promise resolves
  this.data = data;
}
```

---

#### Angular `EventEmitter` (with `@Output()`)

```typescript
@Output() saved = new EventEmitter();

save() {
  this.saved.emit(data); // CD cycle triggered
}
```

Parent listening:

```typescript
<app-child (saved)="onSaved($event)">
```

When event emitted, CD cycle starts.

---

#### RxJS Observables (indirectly)

RxJS itself isn't patched by Zone.js.

BUT observables often use:
- Promises (patched)
- Timers (patched)
- HTTP (patched)
- Events (patched)

So most observable emissions trigger CD cycles indirectly.

```typescript
observable$.subscribe(value => {
  this.value = value; // Usually triggers CD cycle
});
```

---

#### WebSocket events

```typescript
socket.addEventListener('message', (event) => {
  this.data = event.data; // CD cycle triggered
});
```

---

#### User interactions inside Angular components

All Angular's `(click)`, `(input)`, etc. bindings use listeners that Zone.js patches.

So all template events trigger CD cycles.

---

### VERY IMPORTANT: Zone.js only NOTIFIES, doesn't run CD

**Critical distinction:**

Zone.js does NOT itself run change detection.

It only tells Angular:

```
"Something async finished."
```

Then Angular **decides** to run a CD cycle.

But for `OnPush` components, Angular still asks:

```
"Is this component dirty?"
```

If NO → skipped.

---

## Advanced: `ApplicationRef.tick()` — the nuclear option

### What it does

```typescript
import { ApplicationRef, inject } from '@angular/core';

export class MyComponent {
  private appRef = inject(ApplicationRef);

  forceFullUpdate() {
    this.appRef.tick(); // ← runs CD for ENTIRE APP
  }
}
```

`tick()` means:

```
"Run change detection for the ENTIRE Angular application right now."
```

---

### Scope of `tick()`

When you call `tick()`:

```
AppComponent
  ├── HeaderComponent
  ├── DashboardComponent
  │     ├── ChartComponent
  │     └── TableComponent
  └── FooterComponent

ALL components checked ✅✅✅
```

Everything in the entire app tree.

---

### It's synchronous and immediate

Like `detectChanges()`:

```typescript
this.appRef.tick(); // runs NOW, blocks everything
```

But on a much larger scale (entire app instead of just this component + children).

---

### Comparison table

| Method | Scope | Immediate? | Common use |
|---|---|---|---|
| `markForCheck()` | Current component | ❌ async | External callbacks, normal flow |
| `detectChanges()` | Current component + children | ✅ sync | DOM reads, `ngAfterViewInit`, tests |
| `ApplicationRef.tick()` | **ENTIRE APP** | ✅ sync | **VERY rarely needed** |

---

### Why `tick()` rarely gets used

It's VERY expensive.

Checking the entire app every time is overkill for most scenarios.

Uses:

* Low-level Angular internals
* Third-party integrations
* Manual bootstrapping
* Zoneless Angular
* Debugging production issues

For normal component development, you should **never** need it.

---

### Zoneless Angular is moving away from Zone.js

In newer Angular versions (20+), there's experimental support for zoneless change detection:

```typescript
// app.config.ts
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection()
  ]
};
```

In zoneless mode:
- No Zone.js monkey-patching
- Only Signals drive updates
- No `tick()` needed
- More predictable CD

This is the future direction of Angular.

---

## Ultimate mental model: The complete picture

### Layer 1: Browser event happens

```
User clicks button
(or timer fires, or HTTP completes, etc.)
```

---

### Layer 2: Zone.js detects it

```
Zone.js:
"Async work finished! Tell Angular!"
```

---

### Layer 3: Angular starts CD cycle

```
Angular:
"Start checking components..."
```

---

### Layer 4: OnPush components asked

```
For EACH component:
Angular: "Are you dirty?"

OnPush component:
"Let me check..."
  - Did my @Input change? NO
  - Did an event happen inside me? NO
  - Did markForCheck() get called? NO
  - Did my Signal change? NO
"I'm clean. Skip me."
```

---

### Layer 5: What can mark it dirty?

```
1. @Input() reference changed
   → component marked dirty automatically

2. Event in template (click, input, etc.)
   → component marked dirty automatically

3. async pipe emits
   → component marked dirty automatically (via internal markForCheck)

4. Signal changes
   → component marked dirty automatically

5. Manual markForCheck()
   → you tell Angular explicitly

6. detectChanges()
   → bypass dirty-check, run immediately

7. ApplicationRef.tick()
   → bypass everything, check entire app
```

---

### The final hierarchy

```
High priority (immediate, expensive):
  ↑
  ApplicationRef.tick() — entire app NOW
  detectChanges() — this component + children NOW
  ↓
Medium priority (next cycle):
  ↑
  markForCheck() — this component dirty, check later
  ↓
Low priority (automatic, efficient):
  ↑
  Template events, @Input changes, async pipe, Signals
  (Angular handles automatically)
  ↓
```

Use the **lowest level in the hierarchy** that solves your problem.

---

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
