# Inputs and Outputs (Component Communication)


## Table of Contents

- [Are the new `input()` and `output()` signals?](#are-the-new-input-and-output-signals)
  - [`input()` — yes, it IS a signal (read-only)](#input-yes-it-is-a-signal-read-only)
  - [`output()` — NOT a signal](#output-not-a-signal)
  - [The complete picture](#the-complete-picture)
- [How to share data between parent and child](#how-to-share-data-between-parent-and-child)
- [What are Inputs and Outputs?](#what-are-inputs-and-outputs)
- [Inputs](#inputs)
  - [Modern way — `input()` signal (stable since Angular 19)](#modern-way-input-signal-stable-since-angular-19)
  - [Old way — `@Input()` decorator (still works)](#old-way-input-decorator-still-works)
- [Required Inputs](#required-inputs)
  - [Why required inputs exist](#why-required-inputs-exist)
  - [Modern way — `input.required<T>()`](#modern-way-inputrequiredt)
  - [Optional input with default value](#optional-input-with-default-value)
  - [Old way — `@Input({ required: true })`](#old-way-input-required-true)
- [Input Transforms](#input-transforms)
- [Outputs](#outputs)
  - [Modern way — `output()` function (stable since Angular 19)](#modern-way-output-function-stable-since-angular-19)
  - [Old way — `@Output()` with `EventEmitter`](#old-way-output-with-eventemitter)
- [Why `$event` in Angular?](#why-event-in-angular)
  - [The honest answer](#the-honest-answer)
  - [AngularJS history](#angularjs-history)
  - [How `$event` works today](#how-event-works-today)
  - [Why it makes sense as a developer](#why-it-makes-sense-as-a-developer)
- [Input + Output together (two-way binding)](#input-output-together-two-way-binding)
  - [The modern pattern](#the-modern-pattern)
  - [Manual equivalent (old way)](#manual-equivalent-old-way)
- [Quick memory lines](#quick-memory-lines)
- [Common mistakes](#common-mistakes)

## Are the new `input()` and `output()` signals?

**Short answer:** `input()` is a signal. `output()` is NOT a signal — it is a different thing.

### `input()` — yes, it IS a signal (read-only)

`input()` returns a `Signal<T>` — specifically an `InputSignal<T>`, which is a **read-only signal**. You read it by calling it like a function. Angular tracks it like any other signal, so `computed()` and `effect()` can depend on it.

```typescript
name = input<string>('Guest'); // InputSignal<string>

// Read it like any signal
console.log(this.name());       // 'Guest'

// Use in computed() — re-computes when parent changes the input
greeting = computed(() => `Hello, ${this.name()}!`);

// Use in effect() — re-runs when parent changes the input
constructor() {
  effect(() => console.log('Name changed to:', this.name()));
}
```

**Why read-only?** The parent owns the value. The child must not overwrite it. If you need to both receive a value from the parent *and* change it yourself, that is `model()` (a writable signal).

| | Type | Writable? | Use |
|---|---|---|---|
| `input()` | `InputSignal<T>` (read-only signal) | ❌ No | Receive data from parent |
| `model()` | `ModelSignal<T>` (writable signal) | ✅ Yes | Two-way binding |
| `signal()` | `WritableSignal<T>` | ✅ Yes | Internal component state |

---

### `output()` — NOT a signal

`output()` returns an `OutputEmitterRef<T>` — this is **not a signal**. It is a simple event emitter. You cannot read it, subscribe to it with `toSignal()`, or use it in `computed()`. Its only job is to `.emit()` values up to the parent.

```typescript
saved = output<string>(); // OutputEmitterRef<string> — NOT a signal

handleSave() {
  this.saved.emit('saved!'); // only thing you can do with it
}
```

Think of it as a stripped-down, modern replacement for `EventEmitter` — cleaner API, no RxJS dependency, but conceptually the same thing.

```typescript
// Old way — EventEmitter is actually an RxJS Subject underneath
@Output() saved = new EventEmitter<string>(); // is an Observable

// New way — OutputEmitterRef, not an Observable, not a signal
saved = output<string>();
```

> If you need a parent to subscribe to an output as an Observable (rare), use `outputToObservable(this.saved)` from `@angular/core/rxjs-interop`.

---

### The complete picture

```typescript
import { Component, input, output, model, signal, computed } from '@angular/core';

@Component({ selector: 'app-example', template: '' })
export class ExampleComponent {
  // From parent → child (read-only signal)
  userId   = input.required<number>();         // InputSignal<number>
  theme    = input<'light' | 'dark'>('light'); // InputSignal<'light'|'dark'>

  // Two-way with parent (writable signal)
  checked  = model(false);                     // ModelSignal<boolean>

  // Internal state (writable signal, parent doesn't know about this)
  count    = signal(0);                        // WritableSignal<number>

  // Derived (read-only signal, auto-updates)
  label    = computed(() => `User #${this.userId()}`); // Signal<string>

  // To parent (NOT a signal — just an emitter)
  saved    = output<string>();                 // OutputEmitterRef<string>
}
```

---

## How to share data between parent and child

The two main ways:

| Direction | Mechanism | What it does |
|-----------|-----------|-------------|
| Parent → Child | `input()` / `@Input()` | Parent passes data down to child |
| Child → Parent | `output()` / `@Output()` | Child emits an event up to parent |
| Two-way | `model()` | Parent and child stay in sync |

For sharing data between **unrelated components** (siblings, distant), use a **Service** — see [16-services.md](16-services.md).

---

## What are Inputs and Outputs?

Components talk to each other through **Inputs** (data flowing *in*) and **Outputs** (events flowing *out*).

```
Parent ──[Input: data]──▶ Child
Parent ◀──[Output: event]── Child
```

---

## Inputs

### Modern way — `input()` signal (stable since Angular 19)

```typescript
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-user-card',
  template: `<h2>{{ name() }}</h2>`
})
export class UserCardComponent {
  name = input<string>();        // optional input
  age  = input.required<number>(); // required input (see below)
}
```

### Old way — `@Input()` decorator (still works)

```typescript
import { Component, Input } from '@angular/core';

@Component({ selector: 'app-user-card', template: `<h2>{{ name }}</h2>` })
export class UserCardComponent {
  @Input() name?: string;
}
```

---

## Required Inputs

### Why required inputs exist

When you build a reusable component, some data *must* be passed or the component makes no sense. Without required inputs, a developer might forget to pass a value, and the app silently breaks.

Required inputs give you a **compile-time error** if the parent forgets to pass the value — you catch the mistake before the app even runs.

### Modern way — `input.required<T>()`

```typescript
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>{{ product().name }}</h3>
      <p>{{ product().price }}</p>
    </div>
  `
})
export class ProductCardComponent {
  // This input MUST be passed — no default, no undefined allowed
  product = input.required<Product>();
}
```

**In the template — forgetting to pass it → compile error:**
```html
<!-- ❌ ERROR at compile time: Required input 'product' is not set -->
<app-product-card />

<!-- ✅ Correct -->
<app-product-card [product]="selectedProduct" />
```

### Optional input with default value

```typescript
// input() with a default — optional, no error if not passed
label = input<string>('Default label');

// input.required() — must be passed, no default possible
title = input.required<string>();
```

### Old way — `@Input({ required: true })`

```typescript
@Input({ required: true }) product!: Product;
// Produces a template compile-time error if not passed
// The '!' (non-null assertion) tells TypeScript "I know this will be set"
```

---

## Input Transforms

You can transform the incoming value on the way in:

```typescript
import { input, booleanAttribute, numberAttribute } from '@angular/core';

@Component({ selector: 'app-toggle', template: '' })
export class ToggleComponent {
  // Accepts "true", "false", "", or boolean — converts to boolean
  disabled = input(false, { transform: booleanAttribute });

  // Accepts "42" or 42 — converts to number
  maxLength = input(100, { transform: numberAttribute });
}
```

Usage:
```html
<app-toggle disabled />            <!-- disabled = true -->
<app-toggle [disabled]="false" />  <!-- disabled = false -->
```

---

## Outputs

### Modern way — `output()` function (stable since Angular 19)

```typescript
import { Component, output } from '@angular/core';

@Component({ selector: 'app-button', template: `<button (click)="handleClick()">Save</button>` })
export class ButtonComponent {
  saved = output<string>(); // emits a string

  handleClick() {
    this.saved.emit('Success!');
  }
}
```

### Old way — `@Output()` with `EventEmitter`

```typescript
import { Component, Output, EventEmitter } from '@angular/core';

@Component({ selector: 'app-button', template: `<button (click)="handleClick()">Save</button>` })
export class ButtonComponent {
  @Output() saved = new EventEmitter<string>();

  handleClick() {
    this.saved.emit('Success!');
  }
}
```

---

## Why `$event` in Angular?

### The honest answer

`$event` is a convention inherited from **AngularJS (Angular 1.x)**, Angular's predecessor, and kept in modern Angular for consistency.

### AngularJS history

In AngularJS (released 2010), the template engine used `$` prefix to distinguish **Angular-managed variables** from your own variables in the scope. You had:
- `$scope` — Angular's data binding object
- `$http` — Angular's HTTP service
- `$event` — Angular's reference to the DOM event object

When Angular (2+) was rewritten from scratch in 2016, the team kept `$event` in templates because:
1. It was already familiar to the AngularJS community
2. It clearly signals "this is a special Angular thing, not your own variable"
3. It was a natural fit: `(click)="handler($event)"` reads as "on click, call handler with the event object"

### How `$event` works today

`$event` is the **value emitted by the event**. What that value is depends on the event:

| Event source | `$event` value |
|---|---|
| DOM `(click)`, `(keyup)` etc. | Native `MouseEvent`, `KeyboardEvent`, etc. |
| Angular `output()` / `@Output()` | Whatever type you passed to `.emit()` |
| `(ngModelChange)` | The new value of the input |

```html
<!-- DOM event — $event is MouseEvent -->
<button (click)="onClick($event)">Click</button>

<!-- Custom output — $event is the emitted value (e.g. a Car object) -->
<app-car-card (carSaved)="onCarSaved($event)" />
```

```typescript
onClick(event: MouseEvent) {
  console.log(event.target); // the button element
}

onCarSaved(car: Car) {
  // $event was a Car object, so we type the param as Car
  this.savedCars.push(car);
}
```

### Why it makes sense as a developer

When you receive `$event`, you are in the **component class** — and that is where you declare the **type** of the parameter. The template does not care about types; it just passes the value through. So:
- Template says: "here is `$event`, whatever it is"
- Component says: "I know it is a `Car`, I'll type it properly"

This separation is clean. The `$` prefix just reminds you it comes from Angular's event machinery, not from your own template variables.

---

## Input + Output together (two-way binding)

### The modern pattern

Angular's two-way binding via signals uses `model()`:

```typescript
import { Component, model } from '@angular/core';

@Component({ selector: 'app-rating', template: `...` })
export class RatingComponent {
  rating = model<number>(0); // two-way bindable signal
}
```

```html
<app-rating [(rating)]="myRating" />
```

> **Note:** Two-way binding is `model()`'s *primary* use case, but it is not the only one. Because `model()` is a full writable signal, you can also use it one-way (`[rating]` or `(ratingChange)`), as internal component state without any parent binding, and inside `computed()` / `effect()`. See [20-signals.md — Beyond two-way binding](20-signals.md#beyond-two-way-binding) for details.

### Manual equivalent (old way)

```typescript
@Input() value = 0;
@Output() valueChange = new EventEmitter<number>();
// The naming convention `xChange` is required for [(x)] banana-in-a-box syntax
```

---

## Quick memory lines

- `input()` = data flows *in* from parent to child
- `input.required()` = data flows *in* and the parent **must** provide it, or compiler errors
- `output()` = child emits events *out* to parent, parent catches with `$event`
- `$event` = Angular/AngularJS convention for "the value this event carried"
- `model()` = two-way: data flows both in and out; also a full writable signal usable for local state, one-way bindings, `computed()`, `effect()`, and `.subscribe()` — see [20-signals.md § Beyond two-way binding](20-signals.md#beyond-two-way-binding)

---

## Common mistakes

- Forgetting `input.required()` on inputs that don't make sense without data
- Using `@Input()` in new code (prefer `input()` signal)
- Using `@Output()` + `EventEmitter` in new code (prefer `output()`)
- Forgetting the `xChange` naming convention when doing manual two-way binding
- Trying to mutate an `input()` signal directly — inputs are read-only; use `model()` for two-way
