# RxJS

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

### `forkJoin` — wait for multiple Observables to complete (all concurrent)

Like `Promise.all` — runs all Observables **at the same time** and waits for all to finish, then emits all results together.

```typescript
import { forkJoin } from 'rxjs';

forkJoin([
  this.http.get<User>('/api/user/1'),
  this.http.get<Post[]>('/api/posts?userId=1'),
  this.http.get<Comment[]>('/api/comments?userId=1')
]).subscribe(([user, posts, comments]) => {
  this.user = user;
  this.posts = posts;
  this.comments = comments;
});
```

**Use when:** You need to load multiple independent resources in parallel and wait for all to finish before proceeding. All requests start at the same time.

---

### Real-world examples: Sequential vs Concurrent

#### Example 1: Sequential API calls (one at a time)
Wait for each API call to finish before starting the next one using **concatMap**:

```typescript
import { from } from 'rxjs';
import { concatMap } from 'rxjs/operators';

function apiCall(url: string) {
  return this.http.get(url);
}

const urls = ['api/user', 'api/posts', 'api/comments'];

from(urls).pipe(
  concatMap(url => apiCall(url)) // Waits for each to finish before starting the next
).subscribe(result => {
  console.log('Received:', result);
  // this will log: api/user result → api/posts result → api/comments result
  // each one after the previous one completes
});
```

#### Example 2: Parallel API calls (all at once, wait for all)
Run all API calls at the same time and wait for all to finish using **forkJoin**:

```typescript
import { forkJoin } from 'rxjs';

forkJoin([
  this.http.get('/api/user'),
  this.http.get('/api/posts'),
  this.http.get('/api/comments')
]).subscribe(([user, posts, comments]) => {
  console.log('All loaded:', user, posts, comments);
  // All three requests started at the same time
  // This subscribes when ALL are done
});
```

#### Example 3: Parallel processing without waiting (mergeMap)
Process all values concurrently and emit results as they complete using **mergeMap**:

```typescript
import { from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

userIds$ = from([1, 2, 3, 4, 5]);

userIds$.pipe(
  mergeMap(id => this.http.get(`/api/user/${id}`)) // All requests run in parallel
).subscribe(user => {
  console.log('User received:', user);
  // Results come back as they finish, not necessarily in order
});
```

---

## Flattening Operators and Higher-Order Observables

### What is a "flattening operator"?

A **flattening operator** in RxJS is an operator that takes an Observable that emits other Observables (called a "higher-order Observable") and flattens the emissions into a single Observable stream.

- **Higher-order Observable:** An Observable whose values are themselves Observables.  
  Example: `Observable<Observable<T>>`

- **Flattening:** Turning `Observable<Observable<T>>` into `Observable<T>` by merging, concatenating, switching, or exhausting the inner Observables.

---

### What is a "higher-order Observable"?

A **higher-order Observable** is simply an Observable that emits other Observables as its values.

**Example:**
```typescript
import { of, interval } from 'rxjs';
import { map } from 'rxjs/operators';

const higherOrder$ = of(1, 2, 3).pipe(
  map(x => interval(1000)) // Each value emits a new Observable
);
// higherOrder$ is Observable<Observable<number>>
```

---

### `merge` vs `mergeMap` — Key difference

Both run all operations **in parallel**, but they work differently:

#### `merge` (static function) — combine pre-built observables
You pass multiple Observables that already exist:

```typescript
import { merge } from 'rxjs';

// You manually create each observable
merge(
  this.http.get('/api/user'),
  this.http.get('/api/posts'),
  this.http.get('/api/comments')
).subscribe(result => {
  console.log(result); // individual results as they arrive
});
```

#### `mergeMap` (operator) — transform values into observables, then merge

You start with a source Observable, transform each emitted value into a new Observable, then merge all those inner Observables:

```typescript
import { mergeMap } from 'rxjs/operators';
import { from } from 'rxjs';

const urls = ['api/user', 'api/posts', 'api/comments'];

from(urls).pipe(
  mergeMap(url => this.http.get(url)) // Transform each URL into an observable, merge them
).subscribe(result => {
  console.log(result); // individual results as they arrive
});
```

**Summary:**
- `merge`: Combines observables you already have
- `mergeMap`: Transforms emitted values INTO observables, then combines them

---

### `concat` vs `concatMap` — Similar concept, sequential

#### `concat` (static function) — combine pre-built observables sequentially
```typescript
import { concat } from 'rxjs';

// You manually create each observable
concat(
  this.http.get('/api/user'),    // runs first
  this.http.get('/api/posts'),   // runs after user finishes
  this.http.get('/api/comments') // runs after posts finishes
).subscribe(result => {
  console.log(result); // results come one by one, in order
});
```

#### `concatMap` (operator) — transform values into observables, then concatenate sequentially
```typescript
import { concatMap } from 'rxjs/operators';
import { from } from 'rxjs';

const urls = ['api/user', 'api/posts', 'api/comments'];

from(urls).pipe(
  concatMap(url => this.http.get(url)) // Transform each URL, concatenate sequentially
).subscribe(result => {
  console.log(result); // results come one by one, in order
});
```

**Summary:**
- `concat`: Combines observables you already have, one after another
- `concatMap`: Transforms emitted values INTO observables, concatenates them sequentially

---

### `merge` vs `mergeMap` — Detailed comparison table

| Aspect | `merge` | `mergeMap` |
|---|---|---|
| **Type** | Static function | Operator |
| **Input** | Multiple pre-built Observables | Source Observable + mapping function |
| **When to use** | You already have the observables ready | You need to create observables from emitted values |
| **Execution** | All run in parallel immediately | All run in parallel as values are emitted |
| **Output** | Individual results as they complete | Individual results as they complete |
| **Order** | No guaranteed order | No guaranteed order |

**Example comparison:**

```typescript
// Using merge — you have the observables already
const user$ = this.http.get('/api/user');
const posts$ = this.http.get('/api/posts');

merge(user$, posts$).subscribe(result => console.log(result));

// Using mergeMap — you create observables from values
const endpoints = ['/api/user', '/api/posts'];

from(endpoints).pipe(
  mergeMap(endpoint => this.http.get(endpoint))
).subscribe(result => console.log(result));
```

---

## `switchMap`, `mergeMap`, `concatMap`, and `exhaustMap`

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

Waits for the current inner Observable to **complete before starting the next one**. Queues everything in order.

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

### `exhaustMap` — ignore while busy

Ignores new values while the current inner Observable is still running. It "exhausts" the current request before accepting the next trigger.

```
Clicks: click1 → click2 → click3 → click4
exhaustMap: request1 running... (click2, click3 ignored) ...done
           request2 running... (click4 ignored) ...done
```

```typescript
import { exhaustMap } from 'rxjs/operators';

submitClicks$.pipe(
  exhaustMap(() => this.http.post('/api/submit', {}))
).subscribe(() => console.log('Submitted'));
```

**Use when:** Preventing double-submissions — ignore rapid clicks while a request is in-flight.

---

### Real-world `exhaustMap` example — Payment form

```typescript
import { exhaustMap, finalize } from 'rxjs/operators';
import { fromEvent } from 'rxjs';

export class PaymentComponent {
  isSubmitting = false;

  ngAfterViewInit() {
    const submitButton = document.querySelector('#pay-button');

    fromEvent(submitButton, 'click').pipe(
      exhaustMap(() => 
        this.http.post('/api/payment', this.paymentData).pipe(
          finalize(() => this.isSubmitting = false)
        )
      )
    ).subscribe(
      response => console.log('✅ Payment successful:', response),
      error => console.error('❌ Payment failed:', error)
    );
  }
}
```

**What happens:**
- User clicks "Pay" button
- Request starts: `isSubmitting = true`
- User frantically clicks "Pay" 10 more times (all ignored by `exhaustMap`)
- Request finishes: `isSubmitting = false`
- If user clicks again, it starts a new request

This prevents duplicate charges! ✅

---

## Quick comparison of flattening strategies

| Operator | Behavior | Use case | Concurrency | Static/Operator |
|----------|----------|----------|-------------|-----------------|
| `mergeMap` | Run all inner Observables concurrently | Independent parallel requests | All run at once | Operator |
| `merge` | Combine pre-built Observables concurrently | Combine existing observables | All at once | Static |
| `concatMap` | Run inner Observables sequentially (one at a time) | Sequential operations that must maintain order | One at a time | Operator |
| `concat` | Combine pre-built Observables sequentially | Combine existing observables in order | One at a time | Static |
| `switchMap` | Cancel previous, keep only the latest | Search, navigation, latest-only operations | Only latest | Operator |
| `exhaustMap` | Ignore new inner Observables while busy | Prevent double-submissions, debounce submissions | One at a time (drop rest) | Operator |
| `forkJoin` | Wait for all Observables to complete | Run all concurrently and wait for all to finish | All at once, wait for all | Static |

---

### When to use `merge`/`concat` vs `mergeMap`/`concatMap`

### When to use `merge`/`concat` vs `mergeMap`/`concatMap`

**Use `merge`/`concat`** when you already have the observables:
```typescript
const obs1 = this.http.get('/api/1');
const obs2 = this.http.get('/api/2');
const obs3 = this.http.get('/api/3');

merge(obs1, obs2, obs3); // or concat(obs1, obs2, obs3)
```

**Use `mergeMap`/`concatMap`** when you need to create observables FROM emitted values:
```typescript
const urls = ['/api/1', '/api/2', '/api/3'];

from(urls).pipe(
  mergeMap(url => this.http.get(url)) // or concatMap
);
```

Both approaches do the same thing, but `mergeMap`/`concatMap` are more flexible because:
1. **Less boilerplate** — No need to manually create each observable
2. **Dynamic** — Works with ANY array size
3. **Part of the stream** — Can chain more operators easily
4. **Convenience** — One line handles 3 items or 3000 items the same way

---

### Real fruit example — `merge` vs `mergeMap`

```typescript
// Imagine you have this API call
function getPriceAndInfo(fruit: string) {
  return this.http.get(`/api/fruit/${fruit}`);
}

const fruits = ['apple', 'mango', 'orange', 'grapes', 'banana'];
```

**Approach 1: `merge` — manual (tedious!)**
```typescript
import { merge } from 'rxjs';

merge(
  getPriceAndInfo('apple'),
  getPriceAndInfo('mango'),
  getPriceAndInfo('orange'),
  getPriceAndInfo('grapes'),
  getPriceAndInfo('banana')
  // 😩 Imagine 1000 fruits!
).subscribe(result => console.log(result));
```

**Approach 2: `mergeMap` — automatic (clean!)**
```typescript
import { mergeMap } from 'rxjs/operators';

from(fruits).pipe(
  mergeMap(fruit => getPriceAndInfo(fruit))  // ✅ Handles any array size!
).subscribe(result => console.log(result));
```

**Result:** Both output the same thing, but `mergeMap` is way cleaner!

---

### Real fruit example — `concat` vs `concatMap`

```typescript
// Save fruits to database one at a time
function saveFruit(fruit: string) {
  return this.http.post('/api/fruits', { name: fruit });
}

const fruits = ['apple', 'mango', 'orange', 'grapes', 'banana'];
```

**Approach 1: `concat` — manual (tedious!)**
```typescript
import { concat } from 'rxjs';

concat(
  saveFruit('apple'),
  saveFruit('mango'),
  saveFruit('orange'),
  saveFruit('grapes'),
  saveFruit('banana')
  // 😩 Imagine if this list changes!
).subscribe(result => console.log('Saved:', result));
```

**Approach 2: `concatMap` — automatic (clean!)**
```typescript
import { concatMap } from 'rxjs/operators';

from(fruits).pipe(
  concatMap(fruit => saveFruit(fruit))  // ✅ Saves one by one, works with any array!
).subscribe(result => console.log('Saved:', result));
```

**Timeline:**
```
t=0s: Save 'apple'
t=1s: 'apple' saved → Save 'mango'
t=2s: 'mango' saved → Save 'orange'
...
```

**Both output the same fruit results, but `concatMap` is more maintainable!**

---

### `mergeMap`/`concatMap` are just convenient wrappers

Think of it this way:

```typescript
// Without mergeMap (manual, verbose)
merge(
  apiCall('api/1'),
  apiCall('api/2'),
  apiCall('api/3')
)

// With mergeMap (convenient, declarative)
from(['api/1', 'api/2', 'api/3']).pipe(
  mergeMap(url => apiCall(url))
)
```

The second one is **part of the observable stream**, so you can chain more operators:

```typescript
from(urls).pipe(
  filter(url => url.includes('api')),     // Filter before API call
  mergeMap(url => apiCall(url)),          // Call API
  map(result => result.data),             // Transform result
  tap(data => console.log('Got:', data)), // Side effect
  catchError(err => of(null))             // Error handling
).subscribe(final => console.log(final));
```

Try doing THAT with manual `merge`! 🎯

---

## Practical Comparison: `merge` vs `mergeMap` vs `concat` vs `concatMap`

### Setup
```typescript
function apiCall(url: string) {
  // Simulates an HTTP request that takes 1 second
  return of(url).pipe(
    delay(1000),
    map(u => `${u} result`)
  );
}

const urls = ['api/1', 'api/2', 'api/3'];
```

---

### Approach 1: Using `merge` (pre-built observables, parallel)
```typescript
import { merge } from 'rxjs';

merge(
  apiCall('api/1'),
  apiCall('api/2'),
  apiCall('api/3')
).subscribe(result => console.log(result));

// ⏱️  Timeline:
// t=0s:   all 3 requests start
// t=1s:   (all finish at roughly the same time)
// Output:
// api/1 result
// api/2 result
// api/3 result
```

---

### Approach 2: Using `mergeMap` (transform values, parallel)
```typescript
import { mergeMap } from 'rxjs/operators';

from(urls).pipe(
  mergeMap(url => apiCall(url))
).subscribe(result => console.log(result));

// ⏱️  Timeline:
// t=0s:   from(urls) emits: 'api/1', 'api/2', 'api/3' (all at once)
//         mergeMap creates 3 observables and merges them (all run in parallel)
// t=1s:   (all finish at roughly the same time)
// Output: (same as merge)
// api/1 result
// api/2 result
// api/3 result
```

---

### Approach 3: Using `concat` (pre-built observables, sequential)
```typescript
import { concat } from 'rxjs';

concat(
  apiCall('api/1'),
  apiCall('api/2'),
  apiCall('api/3')
).subscribe(result => console.log(result));

// ⏱️  Timeline:
// t=0s:   api/1 starts
// t=1s:   api/1 finishes → api/2 starts
// t=2s:   api/2 finishes → api/3 starts
// t=3s:   api/3 finishes
// Output:
// api/1 result
// api/2 result
// api/3 result
```

---

### Approach 4: Using `concatMap` (transform values, sequential)
```typescript
import { concatMap } from 'rxjs/operators';

from(urls).pipe(
  concatMap(url => apiCall(url))
).subscribe(result => console.log(result));

// ⏱️  Timeline:
// t=0s:   from(urls) emits: 'api/1'
//         concatMap creates observable and waits for it
// t=1s:   api/1 finishes → from(urls) emits 'api/2'
// t=2s:   api/2 finishes → from(urls) emits 'api/3'
// t=3s:   api/3 finishes
// Output: (same as concat)
// api/1 result
// api/2 result
// api/3 result
```

---

### Key Takeaway 🎯

| Pattern | Total time | Start | Use when |
|---------|-----------|-------|----------|
| `merge` / `mergeMap` | ~1s | All at once | Independent requests, speed matters |
| `concat` / `concatMap` | ~3s | One by one | Order matters, dependencies exist |

**The actual output is the same**, but the timing is different!

---



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
