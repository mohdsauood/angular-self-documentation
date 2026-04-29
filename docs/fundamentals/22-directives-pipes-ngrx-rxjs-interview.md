# Directives, Pipes, Signals, NgRx, and RxJS Operators

> This document is written for interview prep. Every section has a clear definition, a simple memorable example, and a use-case list. Read this the day before an Angular interview.

---

## Directives

### What is a directive?
A directive is an instruction to the DOM. It tells Angular to do something to an element — change its appearance, show/hide it, repeat it, or add behavior to it.

There are three types:

| Type | Example | What it does |
|------|---------|-------------|
| Component | `<app-user />` | A directive with a template — the most common type |
| Structural | `*ngIf`, `@if`, `*ngFor`, `@for` | Change the DOM structure (add/remove elements) |
| Attribute | `[ngClass]`, `[ngStyle]`, custom | Change appearance or behavior of an existing element |

---

### Structural directives

These add or remove elements from the DOM.

**`@if` (modern) / `*ngIf` (old)**
```html
@if (isLoggedIn()) {
  <p>Welcome back!</p>
} @else {
  <a routerLink="/login">Login</a>
}
```

**`@for` (modern) / `*ngFor` (old)**
```html
@for (user of users(); track user.id) {
  <app-user-card [user]="user" />
}
```

The `track` expression is required in modern `@for` — it helps Angular identify which items changed so it only re-renders those items, not the whole list.

**`@switch`**
```html
@switch (status()) {
  @case ('active')   { <span class="green">Active</span> }
  @case ('inactive') { <span class="red">Inactive</span> }
  @default           { <span>Unknown</span> }
}
```

---

### Attribute directives

These change how an element looks or behaves without adding/removing it.

**Built-in examples:**
```html
<div [ngClass]="{ active: isActive, disabled: isDisabled }"></div>
<div [ngStyle]="{ color: user.role === 'admin' ? 'red' : 'black' }"></div>
```

---

### Custom attribute directive

```typescript
import { Directive, ElementRef, HostListener, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective {
  color = input('yellow');                     // configurable color
  private el = inject(ElementRef);

  @HostListener('mouseenter') onEnter() {
    this.el.nativeElement.style.backgroundColor = this.color();
  }

  @HostListener('mouseleave') onLeave() {
    this.el.nativeElement.style.backgroundColor = '';
  }
}
```

Usage:
```html
<p appHighlight>Hover me — turns yellow</p>
<p appHighlight color="pink">Hover me — turns pink</p>
```

---

### Custom structural directive

```typescript
import { Directive, input, TemplateRef, ViewContainerRef, effect } from '@angular/core';

@Directive({
  selector: '[appShowIfAdmin]',
  standalone: true
})
export class ShowIfAdminDirective {
  appShowIfAdmin = input<boolean>();

  constructor(
    private template: TemplateRef<any>,
    private container: ViewContainerRef
  ) {
    effect(() => {
      if (this.appShowIfAdmin()) {
        this.container.createEmbeddedView(this.template);
      } else {
        this.container.clear();
      }
    });
  }
}
```

Usage:
```html
<div *appShowIfAdmin="isAdmin()">Admin Panel</div>
```

---

### Interview answer for "What is a directive?"

> "A directive is a class that adds behavior or structure to DOM elements. Components are the most common type — they are directives with templates. Structural directives like `@if` and `@for` add or remove elements from the DOM. Attribute directives like `ngClass` modify the appearance or behavior of existing elements. You can also write custom directives — for example, a highlight directive that changes background color on hover, or a permission directive that shows/hides elements based on user role."

---

## Pipes

### What is a pipe?
A pipe transforms a value in the template for display purposes. It takes a value, processes it, and returns a formatted version — without changing the original data.

```html
{{ price | currency }}           <!-- 1234.5 → $1,234.50 -->
{{ name | uppercase }}           <!-- john → JOHN -->
{{ date | date:'dd/MM/yyyy' }}   <!-- Date object → 25/04/2026 -->
{{ text | slice:0:100 }}         <!-- first 100 characters -->
{{ data$ | async }}              <!-- Observable → unwrapped value -->
```

---

### Built-in pipes

| Pipe | Example | Output |
|------|---------|--------|
| `date` | `{{ today \| date:'shortDate' }}` | `4/25/26` |
| `currency` | `{{ 1999 \| currency:'GBP' }}` | `£1,999.00` |
| `uppercase` | `{{ 'hello' \| uppercase }}` | `HELLO` |
| `lowercase` | `{{ 'HELLO' \| lowercase }}` | `hello` |
| `titlecase` | `{{ 'hello world' \| titlecase }}` | `Hello World` |
| `number` | `{{ 3.14159 \| number:'1.2-2' }}` | `3.14` |
| `percent` | `{{ 0.85 \| percent }}` | `85%` |
| `json` | `{{ obj \| json }}` | JSON string (debugging) |
| `slice` | `{{ items \| slice:0:3 }}` | First 3 items |
| `async` | `{{ data$ \| async }}` | Unwraps Observable/Promise |
| `keyvalue` | `*ngFor="let e of obj \| keyvalue"` | Iterates object key-value pairs |

---

### Custom pipe

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', standalone: true, pure: true })
export class TimeAgoPipe implements PipeTransform {
  transform(date: Date | string): string {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60)   return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }
}
```

Usage:
```html
<span>Posted {{ post.createdAt | timeAgo }}</span>
<!-- Output: "Posted 3 hours ago" -->
```

---

### Pure vs Impure pipes

| | Pure pipe | Impure pipe |
|---|---|---|
| When it runs | Only when input value reference changes | Every change detection cycle |
| Performance | Fast | Slow (use rarely) |
| Default | Yes | `pure: false` in decorator |

```typescript
@Pipe({ name: 'filterUsers', pure: false }) // re-runs on every change detection
export class FilterUsersPipe implements PipeTransform {
  transform(users: User[], query: string): User[] {
    return users.filter(u => u.name.includes(query));
  }
}
```

> Prefer pure pipes. Only use `pure: false` if your pipe depends on mutable data that changes without the reference changing (rare).

---

### Interview answer for "What is a pipe?"

> "A pipe is a class that transforms a value in a template for display. Angular has many built-in pipes like `date`, `currency`, `uppercase`, and `async`. You can write custom pipes — for example, a `timeAgo` pipe that converts a date to '3 hours ago'. Pipes run in the template and return a formatted value without modifying the original data. Pure pipes run only when the input reference changes, which makes them efficient."

---

## Signals (interview summary)

> Covered in depth in [20-signals.md](20-signals.md). This is the interview summary.

### What is a signal?

A signal is a reactive value that Angular tracks automatically. When it changes, every template and computed value that depends on it updates instantly — no Zone.js, no manual change detection.

### The three signal types

```typescript
// 1. Writable — you control it
count = signal(0);
count.set(5);
count.update(n => n + 1);

// 2. Computed — derived automatically
double = computed(() => this.count() * 2);

// 3. Model — two-way binding between parent/child
checked = model(false); // child can set it, parent can bind to it
```

### effect() — react to signal changes

```typescript
constructor() {
  effect(() => {
    localStorage.setItem('count', String(this.count()));
    // re-runs automatically when count() changes
  });
}
```

### Why signals over observables for state?

| | Signals | BehaviorSubject |
|---|---|---|
| Read value | `count()` | `count$.getValue()` |
| Write value | `count.set(n)` | `count$.next(n)` |
| Derived values | `computed()` | `.pipe(map(...))` |
| Template syntax | `{{ count() }}` | `{{ count$ \| async }}` |
| Auto-cleanup | Yes — built-in | Manual `unsubscribe` |

### Interview answer for "What is a signal in Angular?"

> "A signal is a reactive primitive introduced in Angular 16. It's a value that Angular tracks — when it changes, only the parts of the template that read it re-render. There are three kinds: `signal()` for writable state, `computed()` for derived values, and `model()` for two-way parent-child binding. You use `effect()` to run side effects when signals change. Signals are replacing Zone.js-based change detection because they are more precise — Angular knows exactly what changed and only updates that."

---

## NgRx

### What is NgRx?

NgRx is a **state management library** for Angular based on the Redux pattern. It gives your app a single, centralized store for state — useful when many components need to share and update the same data.

### When do you need NgRx?

You do **not** need NgRx for small-to-medium apps. Signals + services handle most cases.

Use NgRx when:
- Many unrelated components share state
- State changes need to be tracked/debugged with time-travel
- You need undo/redo functionality
- Complex async flows with many loading states

---

### Core NgRx concepts

| Concept | What it is |
|---------|-----------|
| **Store** | The single source of truth — holds all app state as one big object |
| **Action** | A plain object describing "what happened" — `{ type: '[Cart] Add Item', item }` |
| **Reducer** | A pure function that takes the current state + action → returns new state |
| **Effect** | Side effects (HTTP calls) triggered by actions |
| **Selector** | A function to read a slice of state from the store |

```
Component dispatches Action
          ↓
Effect (optional) — makes HTTP call, dispatches another Action
          ↓
Reducer — takes (state, action) → new state
          ↓
Store updated
          ↓
Selectors emit new values
          ↓
Components re-render
```

---

### NgRx example — counter

```typescript
// counter.actions.ts
import { createAction } from '@ngrx/store';

export const increment = createAction('[Counter] Increment');
export const decrement = createAction('[Counter] Decrement');
export const reset     = createAction('[Counter] Reset');
```

```typescript
// counter.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { increment, decrement, reset } from './counter.actions';

export const initialState = 0;

export const counterReducer = createReducer(
  initialState,
  on(increment, state => state + 1),
  on(decrement, state => state - 1),
  on(reset,     _     => 0)
);
```

```typescript
// counter.selectors.ts
import { createSelector, createFeatureSelector } from '@ngrx/store';

export const selectCount = createFeatureSelector<number>('counter');
```

```typescript
// counter.component.ts
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { increment, decrement, reset } from './counter.actions';
import { selectCount } from './counter.selectors';

@Component({
  template: `
    <p>Count: {{ count$ | async }}</p>
    <button (click)="inc()">+</button>
    <button (click)="dec()">−</button>
    <button (click)="reset()">Reset</button>
  `
})
export class CounterComponent {
  private store = inject(Store);

  count$ = this.store.select(selectCount);

  inc()   { this.store.dispatch(increment()); }
  dec()   { this.store.dispatch(decrement()); }
  reset() { this.store.dispatch(reset()); }
}
```

---

### NgRx with HTTP — Effects example

```typescript
// products.actions.ts
import { createAction, props } from '@ngrx/store';
import { Product } from './product.model';

export const loadProducts        = createAction('[Products] Load');
export const loadProductsSuccess = createAction('[Products] Load Success', props<{ products: Product[] }>());
export const loadProductsFailure = createAction('[Products] Load Failure', props<{ error: string }>());
```

```typescript
// products.effects.ts
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProductService } from './product.service';
import { loadProducts, loadProductsSuccess, loadProductsFailure } from './products.actions';

@Injectable()
export class ProductEffects {
  private actions$ = inject(Actions);
  private productService = inject(ProductService);

  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadProducts),
      switchMap(() =>
        this.productService.getAll().pipe(
          map(products  => loadProductsSuccess({ products })),
          catchError(err => of(loadProductsFailure({ error: err.message })))
        )
      )
    )
  );
}
```

```typescript
// products.reducer.ts
interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

const initial: ProductsState = { items: [], loading: false, error: null };

export const productsReducer = createReducer(
  initial,
  on(loadProducts,        state => ({ ...state, loading: true, error: null })),
  on(loadProductsSuccess, (state, { products }) => ({ ...state, loading: false, items: products })),
  on(loadProductsFailure, (state, { error })    => ({ ...state, loading: false, error }))
);
```

### NgRx Signals Store (modern NgRx)

NgRx also has a new **Signal Store** (`@ngrx/signals`) that replaces the traditional store with a signals-based API:

```typescript
import { signalStore, withState, withComputed, withMethods } from '@ngrx/signals';

export const CartStore = signalStore(
  withState({ items: [] as CartItem[] }),
  withComputed(({ items }) => ({
    total: computed(() => items().reduce((s, i) => s + i.price * i.qty, 0))
  })),
  withMethods((store) => ({
    addItem(item: CartItem) {
      patchState(store, { items: [...store.items(), item] });
    }
  }))
);
```

### Interview answer for "What is NgRx?"

> "NgRx is a state management library for Angular based on Redux. It uses a single store to hold all app state. Components dispatch actions to describe what happened, reducers compute the new state, and effects handle side effects like HTTP calls. Selectors read slices of state. I'd use NgRx in large apps where many components share state and you need predictable, debuggable state changes. For smaller apps, signals with services are usually enough. NgRx also has a newer Signal Store that integrates with Angular's signals system."

---

## RxJS Operators — interview summary

> Full detail in [18-rxjs.md](18-rxjs.md). This is the interview quick-reference.

### Transformation operators

| Operator | What it does | Simplest use |
|----------|-------------|-------------|
| `map` | Transform each value | `map(user => user.name)` |
| `switchMap` | Cancel previous, start new inner | Search input (cancel old requests) |
| `mergeMap` | Run all inner in parallel | Load multiple independent items |
| `concatMap` | Run inner one at a time, in order | Sequential saves |
| `exhaustMap` | Ignore new while current is running | Submit button (prevent double-submit) |

### Filtering operators

| Operator | What it does |
|----------|-------------|
| `filter` | Only pass values that match a condition |
| `take(n)` | Take first `n` values then complete |
| `takeUntil` | Complete when another Observable emits |
| `debounceTime(ms)` | Wait for silence before emitting (search inputs) |
| `distinctUntilChanged` | Skip duplicate consecutive values |
| `throttleTime(ms)` | Emit at most once per time window |

### Error handling operators

| Operator | What it does |
|----------|-------------|
| `catchError` | Handle error and return fallback Observable |
| `retry(n)` | Retry failed Observable n times |
| `retryWhen` | Retry with custom logic (delay, max attempts) |
| `finalize` | Run cleanup code whether success or error (like `finally`) |

### Combination operators

| Operator | What it does |
|----------|-------------|
| `forkJoin` | Wait for all to complete, emit all results (like Promise.all) |
| `combineLatest` | Emit when any source emits, combining all latest values |
| `merge` | Merge multiple streams into one |
| `zip` | Pair values from multiple streams by index |

---

### `exhaustMap` — the forgotten one (great for interviews)

```typescript
// Prevent double-submit on a form
this.submitButton.clicks$.pipe(
  exhaustMap(() => this.http.post('/api/save', this.form.value))
  // if user clicks again while saving, the click is IGNORED
).subscribe(result => console.log('Saved:', result));
```

`exhaustMap` ignores new values while the current inner Observable is still running. Perfect for submit buttons.

---

### `combineLatest` — react when any source changes

```typescript
import { combineLatest } from 'rxjs';

// Re-runs whenever either filters OR page changes
combineLatest([this.filters$, this.currentPage$]).pipe(
  switchMap(([filters, page]) =>
    this.http.get('/api/products', { params: { ...filters, page } })
  )
).subscribe(products => this.products = products);
```

---

### `retry` and `retryWhen`

```typescript
import { retry, retryWhen, delay } from 'rxjs/operators';
import { timer } from 'rxjs';

// Retry up to 3 times immediately
this.http.get('/api/data').pipe(
  retry(3)
).subscribe(...);

// Retry with 2 second delay between attempts
this.http.get('/api/data').pipe(
  retryWhen(errors => errors.pipe(delay(2000), take(3)))
).subscribe(...);
```

---

### `finalize` — always runs (like `finally`)

```typescript
import { finalize } from 'rxjs/operators';

this.isLoading = true;

this.http.get('/api/data').pipe(
  finalize(() => this.isLoading = false) // runs whether success or error
).subscribe({
  next: data => this.data = data,
  error: err => this.error = err
});
```

---

### `fromEvent` — turn DOM events into streams

```typescript
import { fromEvent } from 'rxjs';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';

// In ngAfterViewInit — need the element to exist first
ngAfterViewInit() {
  const input = this.searchInput.nativeElement;

  fromEvent<Event>(input, 'input').pipe(
    map(e => (e.target as HTMLInputElement).value),
    debounceTime(300),
    distinctUntilChanged()
  ).subscribe(query => this.search(query));
}
```

Or more cleanly with `viewChild` and `effect`:
```typescript
searchInput = viewChild.required<ElementRef>('searchInput');

constructor() {
  afterNextRender(() => {
    fromEvent<Event>(this.searchInput().nativeElement, 'input').pipe(
      map(e => (e.target as HTMLInputElement).value),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.searchService.search(q)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(results => this.results.set(results));
  });
}
```

### Click outside directive using `fromEvent`

```typescript
@Directive({ selector: '[appClickOutside]', standalone: true })
export class ClickOutsideDirective implements OnInit, OnDestroy {
  clickOutside = output<void>();

  private el = inject(ElementRef);
  private destroy$ = new Subject<void>();

  ngOnInit() {
    fromEvent<MouseEvent>(document, 'click').pipe(
      filter(e => !this.el.nativeElement.contains(e.target)),
      takeUntil(this.destroy$)
    ).subscribe(() => this.clickOutside.emit());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

```html
<div appClickOutside (clickOutside)="closeDropdown()">
  ...dropdown content...
</div>
```

---

### Interview answer for "Explain RxJS operators"

> "RxJS operators are functions you chain with `pipe()` to transform Observable streams. The most important ones: `map` transforms each value, `filter` skips values that don't match, `debounceTime` waits for quiet time (search inputs), `switchMap` cancels the previous inner Observable and switches to the latest — perfect for search. `mergeMap` runs all inner Observables in parallel, `concatMap` runs them sequentially. For errors, `catchError` handles them and lets you return a fallback. `finalize` always runs at the end regardless of success or error. `forkJoin` waits for multiple Observables like `Promise.all`. `fromEvent` turns DOM events into an Observable stream."

---

## Quick reference — what to say in an interview

| Topic | One-liner |
|-------|----------|
| **Directive** | Instructions to the DOM — structural directives add/remove elements, attribute directives change behavior |
| **Pipe** | Transform a value in the template for display — `date`, `currency`, `async`, or custom |
| **Signal** | Reactive value Angular tracks — when it changes, only dependent parts re-render |
| **computed()** | Derived signal that auto-recalculates when its signal dependencies change |
| **effect()** | Side effect that auto-runs when signals it reads change |
| **model()** | Two-way signal between parent and child — replaces @Input + @Output boilerplate |
| **NgRx** | Centralized state management — Store + Actions + Reducers + Effects + Selectors |
| **switchMap** | Cancel previous inner Observable, use only the latest — for search |
| **mergeMap** | Run all inner Observables in parallel |
| **concatMap** | Run inner Observables one at a time in order |
| **exhaustMap** | Ignore new while current is running — for submit buttons |
| **catchError** | Handle Observable error, return fallback |
| **finalize** | Always runs at end — like `finally` for Observables |
| **fromEvent** | Turn a DOM event into an Observable stream |
