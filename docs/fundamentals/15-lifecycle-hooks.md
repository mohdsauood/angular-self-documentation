# Component Lifecycle Hooks

## What are lifecycle hooks?
Every Angular component goes through a series of stages from creation to destruction. Lifecycle hooks are methods you add to your component to run code at a specific stage of that journey.

Angular calls these methods automatically at the right time — you just implement the ones you need.

## The lifecycle stages (in order)

```
Create → Change Detection → Destroy
```

| Hook | When it runs |
|------|-------------|
| `ngOnChanges` | Before `ngOnInit`, and every time an `@Input()` value changes |
| `ngOnInit` | Once, after the component is created and inputs are set |
| `ngDoCheck` | Every time Angular runs change detection |
| `ngAfterContentInit` | Once, after projected content (`<ng-content>`) is initialized |
| `ngAfterContentChecked` | After every check of projected content |
| `ngAfterViewInit` | Once, after the component's own view (template) is initialized |
| `ngAfterViewChecked` | After every check of the component's view |
| `ngOnDestroy` | Just before the component is removed from the DOM |

---

## The hooks you will actually use

### `ngOnInit` — most common
Runs once after the component is created and its inputs are set. Use this for initialization logic instead of the constructor.

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { UserService } from './user.service';

@Component({ selector: 'app-user', template: `...` })
export class UserComponent implements OnInit {
  users: User[] = [];

  private userService = inject(UserService);

  ngOnInit(): void {
    // Safe to use inputs and services here
    this.userService.getUsers().subscribe(users => this.users = users);
  }
}
```

**When to use:** Fetch data, set up subscriptions, initialize values that depend on inputs.

---

### `ngOnChanges` — when inputs change
Runs before `ngOnInit` and every time a parent changes an `@Input()` value.

```typescript
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({ selector: 'app-card', template: `...` })
export class CardComponent implements OnChanges {
  @Input() userId!: number;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId']) {
      console.log('Previous:', changes['userId'].previousValue);
      console.log('Current:', changes['userId'].currentValue);
      // re-fetch data when userId changes
    }
  }
}
```

**When to use:** React to input changes — like re-fetching data when an ID input changes.

> Note: `ngOnChanges` only works with `@Input()` decorator properties. It does **not** fire for the modern `input()` signal. For signals, use `effect()` instead.

---

### `ngOnDestroy` — cleanup
Runs just before the component is removed from the DOM. Use it to clean up and avoid memory leaks.

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({ selector: 'app-timer', template: `...` })
export class TimerComponent implements OnInit, OnDestroy {
  private subscription!: Subscription;

  ngOnInit(): void {
    this.subscription = someObservable$.subscribe(...);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe(); // prevent memory leak
  }
}
```

**When to use:** Unsubscribe from observables, cancel timers, clear event listeners.

---

### `ngAfterViewInit` — after view is ready
Runs once after Angular has rendered the component's template. Use it when you need to interact with DOM elements directly.

```typescript
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-input',
  template: `<input #myInput type="text">`
})
export class InputComponent implements AfterViewInit {
  @ViewChild('myInput') myInput!: ElementRef;

  ngAfterViewInit(): void {
    this.myInput.nativeElement.focus(); // safe to access DOM here
  }
}
```

**When to use:** `@ViewChild` queries, auto-focus inputs, integrating third-party DOM libraries (charts, maps, etc.).

---

## Constructor vs `ngOnInit` — what is the difference?

| | Constructor | `ngOnInit` |
|---|---|---|
| When it runs | First — during class creation | After Angular sets up the component |
| `@Input()` values available? | No — inputs not set yet | Yes — inputs are ready |
| Use for | Injecting services | Initialization logic, data fetching |

**Rule of thumb:** Put your startup logic in `ngOnInit`, not the constructor. Constructors should only receive injected dependencies.

---

## `effect()` — the signal alternative to `ngOnChanges`
When using signals (`input()`) instead of `@Input()`, use `effect()` to react to changes:

```typescript
import { Component, input, effect } from '@angular/core';

export class CardComponent {
  userId = input.required<number>();

  constructor() {
    effect(() => {
      const id = this.userId(); // re-runs whenever userId changes
      this.loadUser(id);
    });
  }
}
```

---

## `afterEveryRender` and `afterNextRender` — modern DOM hooks (Angular 20+)

These are function-based alternatives to `ngAfterViewInit` / `ngAfterViewChecked`, introduced in Angular 17 and renamed/stabilised in Angular 20.

| Function | When it runs |
|---|---|
| `afterNextRender()` | Once after the **next** render cycle — like `ngAfterViewInit` |
| `afterEveryRender()` | After **every** render cycle — like `ngAfterViewChecked` |

```typescript
import { Component, afterNextRender, afterEveryRender, ElementRef, viewChild } from '@angular/core';

@Component({ selector: 'app-chart', template: `<canvas #canvas></canvas>` })
export class ChartComponent {
  canvasRef = viewChild.required<ElementRef>('canvas');

  constructor() {
    afterNextRender(() => {
      // Safe to access DOM — runs once after first render
      const ctx = this.canvasRef().nativeElement.getContext('2d');
      this.initChart(ctx);
    });
  }
}
```

**Why use these over `ngAfterViewInit`?**
- Works correctly in zoneless change detection
- No class interface to implement
- `afterNextRender` correctly handles SSR (server-side rendering) — it won't run on the server
- More explicit about timing (next vs every render)

---

## `DestroyRef` — modern cleanup (Angular 16+)

Instead of implementing `ngOnDestroy`, inject `DestroyRef` and register cleanup callbacks:

```typescript
import { Component, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({ selector: 'app-timer', template: '' })
export class TimerComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private userService = inject(UserService);

  ngOnInit(): void {
    // Option 1: takeUntilDestroyed operator — auto-unsubscribes when component destroys
    this.userService.getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(users => this.users = users);

    // Option 2: onDestroy callback
    this.destroyRef.onDestroy(() => {
      console.log('Component is being destroyed');
    });
  }
}
```

---

## Why it matters
- `ngOnInit` gives you a safe place to fetch data and set up the component
- `ngOnDestroy` prevents memory leaks from open subscriptions
- `ngOnChanges` lets you react when a parent changes your inputs
- `ngAfterViewInit` lets you safely interact with DOM elements after render

## Quick memory line
Lifecycle hooks = methods Angular calls automatically at each stage of a component's life.

## Common mistakes
- Fetching data in the constructor instead of `ngOnInit`
- Forgetting `ngOnDestroy` and leaving subscriptions open (memory leak)
- Accessing a `@ViewChild` element before `ngAfterViewInit` — it is `undefined` until then
- Implementing `ngOnChanges` without checking which input actually changed
- Expecting `ngOnChanges` to work with `input()` signals — it does not
