# RxJS


## Table of Contents

- [What is RxJS?](#what-is-rxjs)
- [Core concepts](#core-concepts)
  - [Observable](#observable)
  - [Subscribe](#subscribe)
  - [Subject](#subject)
  - [BehaviorSubject](#behaviorsubject)
- [RxJS in Angular](#rxjs-in-angular)
  - [HTTP request returns an Observable](#http-request-returns-an-observable)
  - [Route params are Observables](#route-params-are-observables)
  - [Form value changes are Observables](#form-value-changes-are-observables)
- [Operators](#operators)
- [Common operators](#common-operators)
  - [`map` — transform each value](#map-transform-each-value)
  - [`filter` — skip values that don't match](#filter-skip-values-that-dont-match)
  - [`tap` — side effects without changing the value](#tap-side-effects-without-changing-the-value)
  - [`catchError` — handle errors](#catcherror-handle-errors)
  - [`debounceTime` — wait before emitting](#debouncetime-wait-before-emitting)
  - [`distinctUntilChanged` — skip duplicate values](#distinctuntilchanged-skip-duplicate-values)
  - [`takeUntil` — auto-unsubscribe when a signal fires](#takeuntil-auto-unsubscribe-when-a-signal-fires)
  - [`forkJoin` — wait for multiple Observables to complete](#forkjoin-wait-for-multiple-observables-to-complete)
- [`switchMap`, `mergeMap`, and `concatMap`](#switchmap-mergemap-and-concatmap)
  - [The problem they solve](#the-problem-they-solve)
  - [`switchMap` — cancel previous, keep only the latest](#switchmap-cancel-previous-keep-only-the-latest)
  - [`mergeMap` (also called `flatMap`) — run all in parallel](#mergemap-also-called-flatmap-run-all-in-parallel)
  - [`concatMap` — one at a time, in order](#concatmap-one-at-a-time-in-order)
- [Quick comparison](#quick-comparison)
- [Error handling — old way vs new way](#error-handling-old-way-vs-new-way)
  - [Old way — next / error / complete callbacks](#old-way-next-error-complete-callbacks)
  - [Modern way — `catchError` + `finalize` operators](#modern-way-catcherror-finalize-operators)
  - [Why `catchError` is better than the error callback](#why-catcherror-is-better-than-the-error-callback)
  - [Real-world pattern — loading state + error + finalize](#real-world-pattern-loading-state-error-finalize)
- [`fromEvent` — DOM events as Observables](#fromevent-dom-events-as-observables)
  - [Basic syntax](#basic-syntax)
  - [In an Angular component — search input](#in-an-angular-component-search-input)
  - [Common `fromEvent` use cases](#common-fromevent-use-cases)
  - [Modern cleanup — `takeUntilDestroyed`](#modern-cleanup-takeuntildestroyed)
- [Why it matters](#why-it-matters)
- [Quick memory line](#quick-memory-line)
- [Common mistakes](#common-mistakes)

## What is RxJS?
RxJS (Reactive Extensions for JavaScript) is a library for working with **asynchronous data streams** using **Observables**.

Think of an Observable like a stream of values that arrive over time — like a river of data you can tap into and react to.

```
Single value:    Promise    → gives you one value then it's done
Multiple values: Observable → gives you zero, one, or many values over time
```

Angular uses RxJS heavily — HTTP requests, routing events, form value changes, and router params all return Observables.

The `$` suffix on a variable name is a convention meaning "this is an Observable".

---

## Core concepts

### Observable
A source of data that emits values over time.

```typescript
import { Observable } from 'rxjs';

const numbers$ = new Observable(observer => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.complete(); // stream is done
});
```

### Subscribe
You activate an Observable (start receiving values) by subscribing to it.

```typescript
numbers$.subscribe({
  next: value => console.log(value), // 1, 2, 3
  error: err => console.error(err),
  complete: () => console.log('done')
});
```

**Important:** An Observable does nothing until you subscribe to it.

### Subject
A Subject is both an Observable (you can subscribe to it) and a way to emit values manually.

```typescript
import { Subject } from 'rxjs';

const clicked$ = new Subject<string>();

// Emit a value from anywhere
clicked$.next('button clicked');

// Subscribe to it elsewhere
clicked$.subscribe(msg => console.log(msg));
```

### BehaviorSubject
Like a Subject but holds the **last emitted value** and gives it to new subscribers immediately.

```typescript
import { BehaviorSubject } from 'rxjs';

const user$ = new BehaviorSubject<User | null>(null);

user$.next({ name: 'Alice' }); // emit a new value

// A new subscriber immediately gets { name: 'Alice' }
user$.subscribe(user => console.log(user));
```

Use `BehaviorSubject` when you need to share a current state (like the logged-in user) across the app.

---

## RxJS in Angular

### HTTP request returns an Observable
```typescript
// Does nothing until subscribed
this.http.get<User[]>('/api/users').subscribe(users => {
  this.users = users;
});
```

### Route params are Observables
```typescript
this.route.params.subscribe(params => {
  this.userId = params['id'];
});
```

### Form value changes are Observables
```typescript
this.searchControl.valueChanges.subscribe(query => {
  this.search(query);
});
```

---

## Operators
Operators are functions that transform, filter, or combine Observable streams. You chain them using the `pipe()` method.

```typescript
observable$.pipe(
  operator1(),
  operator2(),
  operator3()
).subscribe(result => ...);
```

---

## Common operators

### `map` — transform each value
Like `Array.map` but for streams. Transform each emitted value into something else.

```typescript
import { map } from 'rxjs/operators';

this.http.get<User[]>('/api/users').pipe(
  map(users => users.filter(u => u.active)) // only active users
).subscribe(users => this.users = users);
```

---

### `filter` — skip values that don't match

```typescript
import { filter } from 'rxjs/operators';

clicks$.pipe(
  filter(event => event.target.id === 'submit-btn')
).subscribe(() => this.submitForm());
```

---

### `tap` — side effects without changing the value
Use for logging or triggering actions without modifying the stream.

```typescript
import { tap } from 'rxjs/operators';

this.http.get<User>('/api/user/1').pipe(
  tap(user => console.log('Got user:', user)) // for debugging
).subscribe(user => this.user = user);
```

---

### `catchError` — handle errors

```typescript
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

this.http.get<User[]>('/api/users').pipe(
  catchError(err => {
    console.error(err);
    return of([]); // return empty array so the stream continues
  })
).subscribe(users => this.users = users);
```

---

### `debounceTime` — wait before emitting
Waits a set amount of time after the **last** value before emitting. Perfect for search inputs.

```typescript
import { debounceTime } from 'rxjs/operators';

this.searchControl.valueChanges.pipe(
  debounceTime(300) // wait 300ms after user stops typing
).subscribe(query => this.search(query));
```

---

### `distinctUntilChanged` — skip duplicate values
Only emits if the current value is different from the previous one.

```typescript
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged() // don't search again if the user typed the same thing
).subscribe(query => this.search(query));
```

---

### `takeUntil` — auto-unsubscribe when a signal fires
Completes the Observable when another Observable emits. Used to auto-clean up on component destroy.

```typescript
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    someObservable$.pipe(
      takeUntil(this.destroy$) // auto-unsubscribes when destroy$ fires
    ).subscribe(...);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

### `forkJoin` — wait for multiple Observables to complete
Like `Promise.all` — waits for all to finish, then emits all results together.

```typescript
import { forkJoin } from 'rxjs';

forkJoin([
  this.http.get<User>('/api/user/1'),
  this.http.get<Post[]>('/api/posts?userId=1')
]).subscribe(([user, posts]) => {
  this.user = user;
  this.posts = posts;
});
```

---

## `switchMap`, `mergeMap`, and `concatMap`

These are **higher-order mapping operators**. They each take a value from one Observable, use it to start a new inner Observable (like an HTTP request), and flatten the result back into one stream.

The difference is how they handle **multiple in-flight Observables** when values arrive fast.

### The problem they solve
Imagine a search input. The user types, and you send an HTTP request per keystroke. What happens if multiple requests are in-flight at the same time? Which result do you use?

---

### `switchMap` — cancel previous, keep only the latest

When a new value arrives, **cancel the previous inner Observable** and start fresh with the new value.

```
User types: "a"   → "an"  → "ang"
switchMap:  req1 ❌ cancelled
                   req2 ❌ cancelled
                          req3 ✅ kept
```

```typescript
import { switchMap, debounceTime } from 'rxjs/operators';

this.searchControl.valueChanges.pipe(
  debounceTime(300),
  switchMap(query => this.http.get<Result[]>(`/api/search?q=${query}`))
).subscribe(results => this.results = results);
```

**Use when:** Search inputs, autocomplete, navigation — situations where only the latest result matters.

---

### `mergeMap` (also called `flatMap`) — run all in parallel

Runs all inner Observables **at the same time**. Results come back as they finish — order is not guaranteed.

```
Clicks: click1 → click2 → click3
mergeMap: all three requests run in parallel ✅✅✅
```

```typescript
import { mergeMap } from 'rxjs/operators';

userIds$.pipe(
  mergeMap(id => this.http.get<User>(`/api/user/${id}`))
).subscribe(user => this.users.push(user));
```

**Use when:** Independent operations that can run simultaneously — like loading multiple unrelated items at once.

---

### `concatMap` — one at a time, in order

Waits for the current inner Observable to **complete before starting the next one**. Queues everything.

```
Actions: save1 → save2 → save3
concatMap: save1 runs → finishes → save2 runs → finishes → save3 runs
```

```typescript
import { concatMap } from 'rxjs/operators';

saveActions$.pipe(
  concatMap(action => this.http.post('/api/save', action))
).subscribe(result => console.log('Saved:', result));
```

**Use when:** Order matters — like saving sequential steps, processing a queue, or chaining dependent requests.

---

## Quick comparison

| Operator | Behavior | Use case |
|----------|----------|----------|
| `switchMap` | Cancel previous, use latest | Search, navigation |
| `mergeMap` | All run in parallel | Independent parallel requests |
| `concatMap` | One at a time, in order | Sequential operations |

---

## Error handling — old way vs new way

### Old way — next / error / complete callbacks

The `.subscribe()` method accepts three callbacks: `next`, `error`, and `complete`.

```typescript
this.http.get<User[]>('/api/users').subscribe(
  users  => this.users = users,   // next
  err    => console.error(err),   // error
  ()     => console.log('done')   // complete
);
```

This still works, but it mixes error handling into the subscription call, making it hard to share across multiple streams and hard to recover gracefully.

---

### Modern way — `catchError` + `finalize` operators

`catchError` handles errors **inside the pipe** and lets you return a fallback Observable so the stream does not just die.

`finalize` is the **RxJS equivalent of `finally`** — it always runs whether the stream succeeded, errored, or was unsubscribed.

```typescript
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

this.isLoading = true;

this.http.get<User[]>('/api/users').pipe(
  catchError(err => {
    this.errorMessage = 'Failed to load users';
    return of([]); // return a safe fallback, stream continues
  }),
  finalize(() => {
    this.isLoading = false; // always runs — like finally {}
  })
).subscribe(users => this.users = users);
```

### Why `catchError` is better than the error callback

| | Error callback in `.subscribe()` | `catchError` in `.pipe()` |
|---|---|---|
| Can recover the stream? | No — stream dies | Yes — return a new Observable |
| Reusable across streams? | No | Yes — extract into shared logic |
| Works with `retry()`? | No | Yes — `retry()` must be before `catchError` |
| Readable? | Less readable with 3 args | More readable in a chain |

### Real-world pattern — loading state + error + finalize

```typescript
loadUsers() {
  this.isLoading = true;
  this.errorMessage = null;

  this.http.get<User[]>('/api/users').pipe(
    retry(2),                            // retry twice before giving up
    catchError(err => {
      this.errorMessage = err.message;
      return of([]);                     // fallback to empty array
    }),
    finalize(() => this.isLoading = false) // always clear loading spinner
  ).subscribe(users => this.users = users);
}
```

---

## `fromEvent` — DOM events as Observables

`fromEvent` converts any DOM event into an Observable stream. This is how you bring RxJS power (debounce, filter, map, switchMap) to native DOM events.

### Basic syntax

```typescript
import { fromEvent } from 'rxjs';

const button = document.querySelector('#submit');
fromEvent(button, 'click').subscribe(() => console.log('clicked'));
```

### In an Angular component — search input

```typescript
import { Component, viewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  template: `<input #searchInput type="text" placeholder="Search...">`
})
export class SearchComponent implements AfterViewInit, OnDestroy {
  searchInput = viewChild.required<ElementRef>('searchInput');

  private destroy$ = new Subject<void>();

  ngAfterViewInit() {
    fromEvent<Event>(this.searchInput().nativeElement, 'input').pipe(
      map(e => (e.target as HTMLInputElement).value),
      debounceTime(300),          // wait 300ms after user stops typing
      distinctUntilChanged(),     // only if value actually changed
      switchMap(query =>
        this.searchService.search(query) // cancel previous, run new
      ),
      takeUntil(this.destroy$)    // clean up when component destroys
    ).subscribe(results => this.results = results);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Common `fromEvent` use cases

```typescript
// Keyboard shortcut — Ctrl+S to save
fromEvent<KeyboardEvent>(document, 'keydown').pipe(
  filter(e => e.ctrlKey && e.key === 's'),
  takeUntil(this.destroy$)
).subscribe(e => {
  e.preventDefault();
  this.save();
});

// Window resize — debounced
fromEvent(window, 'resize').pipe(
  debounceTime(200),
  map(() => window.innerWidth),
  distinctUntilChanged(),
  takeUntil(this.destroy$)
).subscribe(width => this.screenWidth = width);

// Scroll position tracking
fromEvent(window, 'scroll').pipe(
  debounceTime(50),
  map(() => window.scrollY),
  takeUntil(this.destroy$)
).subscribe(y => this.showBackToTop = y > 300);

// Click outside a dropdown to close it
fromEvent<MouseEvent>(document, 'click').pipe(
  filter(e => !this.dropdownEl.nativeElement.contains(e.target as Node)),
  takeUntil(this.destroy$)
).subscribe(() => this.isOpen = false);
```

### Modern cleanup — `takeUntilDestroyed`

Angular 16+ provides `takeUntilDestroyed()` which automatically completes when the component destroys — no manual `ngOnDestroy` needed:

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

export class SearchComponent {
  private destroyRef = inject(DestroyRef);

  ngAfterViewInit() {
    fromEvent<Event>(this.searchInput().nativeElement, 'input').pipe(
      map(e => (e.target as HTMLInputElement).value),
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef) // no ngOnDestroy needed
    ).subscribe(query => this.search(query));
  }
}
```

---

## Why it matters
- RxJS is how Angular handles async data elegantly
- Operators let you transform, filter, and combine streams with readable code
- `switchMap` prevents stale search results
- `concatMap` prevents race conditions in sequential operations

## Quick memory line
RxJS = streams of data over time. Operators = tools to shape those streams. `switchMap` = latest wins, `mergeMap` = all at once, `concatMap` = one by one.

## Common mistakes
- Subscribing inside a `subscribe` (nested subscribes) — use `switchMap`, `mergeMap`, or `concatMap` instead
- Forgetting to unsubscribe — use `takeUntil`, `async` pipe, or `toSignal()`
- Using `mergeMap` for search — old results can overwrite newer ones
- Using `switchMap` for sequential saves — earlier saves get cancelled mid-flight
