# Signals

## What are signals?
A **signal** is a reactive value that Angular tracks automatically. When a signal's value changes, any template or computation that reads it updates automatically — no manual change detection needed.

```typescript
import { signal } from '@angular/core';

count = signal(0); // initial value is 0

// Read it (call it like a function)
console.log(this.count()); // 0

// Write it
this.count.set(5);
this.count.update(n => n + 1); // based on previous value
```

**In template — reads the signal:**
```html
<p>{{ count() }}</p>  <!-- auto-updates when count changes -->
```

> Signals were introduced in Angular 16 (developer preview), became stable in Angular 17, and are the **primary reactivity model** in modern Angular. `linkedSignal`, `toSignal`, and `toObservable` are stable. Signal Forms (`@angular/forms/signals`) became stable in Angular v22. Signals replace most uses of `ngOnChanges`, `BehaviorSubject`, and manual change detection.

---

## Why signals were introduced

Before signals, Angular used **Zone.js** to detect changes. Zone.js monkey-patches every async operation (setTimeout, Promise, fetch, etc.) and tells Angular "something might have changed — check everything."

**The problems with Zone.js:**
- Angular re-renders the whole tree even if only one tiny value changed
- Hard to know *what* changed — just that *something* did
- Makes Angular hard to use without Zone.js (server-side rendering, web workers)
- Performance degrades in large apps

**Signals fix this:**
- Angular knows *exactly which signal changed*
- Only the parts of the template that read that signal re-render
- No Zone.js required (Angular is moving toward a Zone-less future)
- Change detection becomes **fine-grained and predictable**

---

## Three kinds of signals

| Signal | Created with | Writable? | Description |
|--------|-------------|-----------|-------------|
| Writable signal | `signal()` | Yes | You control the value |
| Computed signal | `computed()` | No | Derived from other signals |
| Model signal | `model()` | Yes (two-way) | Two-way binding between parent and child; also a full writable signal usable for local state, `computed()`, `effect()`, and subscriptions |

---

## `signal()` — writable signal

```typescript
import { signal } from '@angular/core';

export class CounterComponent {
  count = signal(0);

  increment() { this.count.update(n => n + 1); }
  reset()     { this.count.set(0); }
}
```

```html
<p>Count: {{ count() }}</p>
<button (click)="increment()">+</button>
<button (click)="reset()">Reset</button>
```

### `set` vs `update`

```typescript
// set — replace the value entirely
this.count.set(10);

// update — compute new value from old value
this.count.update(prev => prev + 1);

// mutate — for objects/arrays: mutate in-place and notify (use sparingly)
this.items.mutate(list => list.push('new item'));
```

---

## `computed()` — derived read-only signal

`computed()` creates a signal whose value is automatically calculated from other signals. It re-runs only when its dependencies change (it is lazy and memoized).

```typescript
import { signal, computed } from '@angular/core';

export class CartComponent {
  items = signal<CartItem[]>([]);
  discount = signal(0.1); // 10%

  // Automatically recalculates when items or discount changes
  subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  total = computed(() =>
    this.subtotal() * (1 - this.discount())
  );
}
```

```html
<p>Subtotal: {{ subtotal() | currency }}</p>
<p>Total after discount: {{ total() | currency }}</p>
```

`computed()` is **memoized** — if `items` and `discount` haven't changed since the last read, Angular returns the cached value instead of recalculating.

---

## `model()` — two-way binding signal

### What is `model()`?

`model()` is a **writable signal** introduced in **Angular 17.2**. Its primary design goal is two-way data binding between a parent and child component, but because it is a full writable signal it has several other use cases too (see [Beyond two-way binding](#beyond-two-way-binding) below).

Under the hood, every `model()` automatically creates:
- An **input** — parent can push a value in.
- An **output** named `${propertyName}Change` — fires whenever the child calls `.set()` or `.update()`.

When used with banana-in-a-box syntax `[(x)]`, both sides stay in sync. But the input and output can also be used independently.

It is the modern, signal-based replacement for the old pattern:
```typescript
// OLD pattern (verbose):
@Input() value!: string;
@Output() valueChange = new EventEmitter<string>();
```

### Why `model()` was introduced

The old two-way binding pattern required two separate decorators (`@Input` + `@Output`) and the output had to be named exactly `propertyChange` (with `Change` suffix) for `[(banana-box)]` syntax to work. This was boilerplate-heavy and easy to get wrong.

`model()` collapses both into one signal, is type-safe, and integrates with the signals system so parent and child are always in sync reactively.

### Before `model()` — the old way

```typescript
// child component — old
@Input()  checked = false;
@Output() checkedChange = new EventEmitter<boolean>();

toggle() {
  this.checked = !this.checked;
  this.checkedChange.emit(this.checked); // must manually emit
}
```

```html
<!-- parent — old -->
<app-toggle [(checked)]="isOn" />
```

### After `model()` — the new way

```typescript
// child component — modern
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-toggle',
  template: `
    <button (click)="toggle()">
      {{ checked() ? 'ON' : 'OFF' }}
    </button>
  `
})
export class ToggleComponent {
  checked = model(false); // default false

  toggle() {
    this.checked.update(v => !v); // signal update — parent is automatically notified
  }
}
```

```html
<!-- parent — same banana-box syntax, but backed by signals now -->
<app-toggle [(checked)]="isOn" />
```

### How `model()` works internally

When you write `checked = model(false)`, Angular automatically creates:
- An **input signal** (parent can pass a value in)
- An **output** named `checkedChange` (child notifies parent when it changes)

When the child calls `this.checked.set(true)` or `.update(...)`, Angular fires the output automatically. The parent's bound signal updates too. Both sides stay in sync.

### `model.required()` — required two-way binding

```typescript
// Must be passed from parent
value = model.required<string>();
```

### Optional model with default

```typescript
// Has a default value — parent doesn't have to pass it
size = model<'small' | 'medium' | 'large'>('medium');
```

### Real-world example — custom input component

This rating component is a good use case for `model()` because:
- The **parent** owns the rating value and needs to read it (e.g., to save to an API)
- The **child** controls how the stars look and how the user interacts with them
- Both sides need to stay in sync — `model()` handles this automatically with no extra boilerplate

**Child component:**

```typescript
// app-rating.component.ts
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-rating',
  standalone: true,
  template: `
    @for (star of stars; track star) {
      <span
        class="star"
        (click)="rate(star)"
        [class.filled]="star <= rating()">★</span>
    }
  `,
  styles: [`
    .star { font-size: 2rem; cursor: pointer; color: #ccc; }
    .filled { color: gold; }
  `]
})
export class RatingComponent {
  rating = model(0); // two-way: parent can set it, user can change it
  stars = [1, 2, 3, 4, 5];

  rate(star: number) {
    this.rating.set(star); // notifies parent automatically via ratingChange output
  }
}
```

**Parent component:**

```typescript
// product-detail.component.ts
import { Component, signal } from '@angular/core';
import { RatingComponent } from './app-rating.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RatingComponent],
  template: `
    <h2>{{ product.name }}</h2>
    <app-rating [(rating)]="productRating" />
    <p>You rated: {{ productRating() }} / 5</p>
    <button (click)="saveRating()">Save</button>
  `
})
export class ProductDetailComponent {
  product = { name: 'Wireless Headphones' };
  productRating = signal(0); // starts at 0, updated by child via model()

  saveRating() {
    console.log('Saving rating:', this.productRating()); // read the signal directly
    // e.g. this.productService.saveRating(this.productRating())
  }
}
```

**What happens step by step:**
1. `productRating` is a signal in the parent — starts at `0`
2. `[(rating)]="productRating"` binds it two-ways to the child's `model()`
3. User clicks a star → `rate()` calls `this.rating.set(star)`
4. Angular automatically fires the `ratingChange` output — the parent's `productRating` signal updates
5. Both `<app-rating>` (star highlights) and `<p>You rated: ...</p>` re-render with the new value
6. The parent can read `productRating()` at any time — for example, when the user clicks Save

---

### Beyond two-way binding

`model()` is **not** limited to the `[(banana-box)]` two-way pattern. Because it is a full writable signal it can be used in all of the following ways.

#### 1. One-way input binding only

The parent can push values *in* without listening to changes — identical to using `input()`:

```html
<!-- parent provides a value but doesn't need to react to changes -->
<app-rating [rating]="fixedRating" />
```

```typescript
export class RatingComponent {
  rating = model(0); // still writable inside the child; parent just seeds the value
}
```

#### 2. One-way output (event notification) only

The parent can listen to changes *without* two-way sync — identical to using `output()`:

```html
<!-- parent only wants to know when the user picks a rating -->
<app-rating (ratingChange)="onRatingChange($event)" />
```

```typescript
export class ProductPage {
  onRatingChange(value: number) {
    console.log('User picked', value);
  }
}
```

#### 3. Local component state (no parent binding at all)

You can use `model()` exactly like `signal()` as internal state. The auto-generated output just goes unheard — no overhead, no errors:

```typescript
export class CounterComponent {
  count = model(0); // works as plain writable signal; no parent required

  increment() { this.count.update(n => n + 1); }
  reset()     { this.count.set(0); }
}
```

This is useful when you want to keep a component self-contained *today* but allow a parent to take control via two-way binding *later*, without changing the component's internals.

#### 4. Used inside `computed()` and `effect()`

`model()` is a readable signal, so derived signals and effects react to it just like any other signal:

```typescript
export class CartComponent {
  quantity  = model(1);
  unitPrice = signal(9.99);

  total = computed(() => this.quantity() * this.unitPrice()); // reacts to model changes

  constructor() {
    effect(() => {
      console.log('Quantity changed to', this.quantity()); // runs on every update
    });
  }
}
```

#### 5. Subscribing like an Observable

`ModelSignal` exposes a `.subscribe()` method, so you can integrate it with any RxJS-based code:

```typescript
export class SearchComponent implements OnInit {
  query = model('');

  ngOnInit() {
    // Treat the model as an observable stream
    this.query.subscribe(value => {
      console.log('Query is now:', value);
    });
  }
}
```

For richer RxJS pipelines, convert it first with `toObservable()`:

```typescript
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export class SearchComponent {
  query = model('');

  constructor() {
    toObservable(this.query).pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(value => this.search(value));
  }

  search(term: string) { /* call API */ }
}
```

#### Summary — when to reach for `model()` vs `signal()`

| Scenario | Use |
|----------|-----|
| Child value must stay in sync with parent | `model()` with `[(x)]` |
| Parent seeds value but doesn't need updates | `model()` with `[x]` (or `input()`) |
| Parent only wants to react to changes | `model()` with `(xChange)` (or `output()`) |
| Purely internal state, no parent involvement | `signal()` (clearer intent) or `model()` if you *might* expose it later |
| Value inside `computed()` / `effect()` | Either — both are readable signals |

---

## `effect()` — run side effects when signals change

### What is `effect()`?

`effect()` is a function that runs a **side effect** whenever any signal it reads inside changes. It automatically tracks which signals it depends on.

```typescript
import { signal, effect } from '@angular/core';

export class ThemeComponent {
  theme = signal<'light' | 'dark'>('light');

  constructor() {
    effect(() => {
      // Runs immediately, then re-runs every time theme() changes
      document.body.className = this.theme();
    });
  }
}
```

### Where to define `effect()`

`effect()` must be created in an **injection context** — that means inside:
- The class constructor
- A field initializer in the class body (with `inject()`)
- A service or function called during construction

```typescript
// ✅ Correct — in constructor
constructor() {
  effect(() => { ... });
}

// ✅ Correct — as a field (using injection context implicitly)
private logger = effect(() => console.log(this.count()));

// ❌ Wrong — in ngOnInit (not an injection context)
ngOnInit() {
  effect(() => { ... }); // throws error
}
```

### `effect()` vs `ngOnChanges`

| | `ngOnChanges` | `effect()` |
|---|---|---|
| Works with | `@Input()` decorator only | Any signal |
| Tracks automatically | No — you check `changes` object | Yes — reads any signal it touches |
| Multiple signals | Complex — one hook for all inputs | Simple — just read them |

```typescript
// OLD: ngOnChanges — verbose, only for @Input
ngOnChanges(changes: SimpleChanges) {
  if (changes['userId']) {
    this.loadUser(changes['userId'].currentValue);
  }
}

// NEW: effect() — clean, works with any signal
constructor() {
  effect(() => {
    this.loadUser(this.userId()); // re-runs when userId signal changes
  });
}
```

### Cleanup inside `effect()`

If your effect creates a resource (timer, subscription), clean it up with `onCleanup`:

```typescript
effect((onCleanup) => {
  const timer = setInterval(() => console.log(this.count()), 1000);
  onCleanup(() => clearInterval(timer)); // runs before next effect run or on destroy
});
```

### Common use cases for `effect()`

```typescript
// 1. Sync to localStorage
effect(() => {
  localStorage.setItem('theme', this.theme());
});

// 2. Log state changes during development
effect(() => {
  console.log('[Debug] cart changed:', this.cart());
});

// 3. Scroll to top when route signal changes
effect(() => {
  const _ = this.currentPage(); // read signal to track it
  window.scrollTo(0, 0);
});

// 4. Bridge signal to RxJS (for services that need Observables)
effect(() => {
  this.searchSubject$.next(this.searchQuery());
});
```

---

## `viewChild()` — signal-based ViewChild

### What is `viewChild()`?

`viewChild()` is the signal-based replacement for the old `@ViewChild()` decorator. It gives you a reference to an element or child component in the template as a **signal**.

```typescript
// OLD way
@ViewChild('myInput') myInput!: ElementRef;

ngAfterViewInit() {
  this.myInput.nativeElement.focus(); // only safe here
}

// NEW way — signal
import { viewChild, ElementRef } from '@angular/core';

myInput = viewChild<ElementRef>('myInput'); // signal
// OR required variant — throws if not found
myInput = viewChild.required<ElementRef>('myInput');
```

### Why `viewChild()` is better

- The signal is available after view init automatically — no lifecycle hook needed
- Type-safe: `viewChild()` returns `Signal<ElementRef | undefined>`, `viewChild.required()` returns `Signal<ElementRef>`
- Works with `computed()` and `effect()` naturally

### Example — auto-focus an input

```typescript
import { Component, viewChild, ElementRef, effect } from '@angular/core';

@Component({
  selector: 'app-search',
  template: `<input #searchBox type="text" placeholder="Search...">`
})
export class SearchComponent {
  searchBox = viewChild.required<ElementRef>('searchBox');

  constructor() {
    effect(() => {
      // Runs after view is ready because signal becomes defined then
      this.searchBox().nativeElement.focus();
    });
  }
}
```

### Example — access a child component

```typescript
import { Component, viewChild } from '@angular/core';
import { ChartComponent } from './chart.component';

@Component({
  selector: 'app-dashboard',
  template: `<app-chart #chart />`
})
export class DashboardComponent {
  chart = viewChild.required(ChartComponent);

  refreshChart() {
    this.chart().refresh(); // call a method on the child
  }
}
```

### Use cases for `viewChild()`

| Use case | Example |
|----------|---------|
| Auto-focus an input on load | `searchBox().nativeElement.focus()` |
| Call a method on a child component | `chart().refresh()` |
| Read a DOM element's dimensions | `box().nativeElement.getBoundingClientRect()` |
| Integrate third-party libraries | Pass DOM node to a chart/map library |
| Scroll to a section | `section().nativeElement.scrollIntoView()` |

### `viewChildren()` — query multiple elements

```typescript
import { viewChildren } from '@angular/core';

items = viewChildren<ElementRef>('item'); // Signal<readonly ElementRef[]>
```

---

## Signal Forms (Angular 21+)

Angular 21 introduced a native signal-based forms API, and Angular v22 made it stable. It lives in `@angular/forms/signals` and is separate from `FormControl`/`FormGroup`. You define your data model as a plain signal, then Angular does the rest.

---

### How it works — 5-step mental model

1. **Create a model signal** — a regular `signal<T>()` holding your form's data shape
2. **Call `form(modelSignal)`** — get back a **FieldTree** that mirrors your model's structure
3. **Bind inputs with `[formField]`** — the directive does two-way sync between the input and the field
4. **Read state via `field()`** — calling a field returns a `FieldState` object with reactive signals
5. **Add validation in the schema** — pass a schema function as the second arg to `form()`

---

### Basic example — login form

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';

interface LoginData {
  email:    string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormField],  // must import FormField directive
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (ngSubmit)="onSubmit()">
      <input type="email"    [formField]="loginForm.email"    />
      <input type="password" [formField]="loginForm.password" />

      <!-- read validation state -->
      @if (loginForm.email().touched() && !loginForm.email().valid()) {
        @for (err of loginForm.email().errors(); track err.kind) {
          <p class="error">{{ err.message }}</p>
        }
      }

      <button type="submit" [disabled]="!loginForm.email().valid() || !loginForm.password().valid()">
        Log in
      </button>
    </form>

    <!-- read the live value -->
    <p>Email: {{ loginForm.email().value() }}</p>
  `
})
export class LoginComponent {
  // 1. plain signal for the data model
  loginModel = signal<LoginData>({ email: '', password: '' });

  // 2. form() creates the FieldTree
  loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email,    { message: 'Email is required' });
    email(schemaPath.email,       { message: 'Enter a valid email address' });
    required(schemaPath.password, { message: 'Password is required' });
  });

  onSubmit() {
    const credentials = this.loginModel(); // just read the signal
    console.log('Submitting', credentials);
  }
}
```

---

### `FieldState` — what signals are on each field

When you call a field as a function (e.g. `loginForm.email()`), you get a `FieldState` object:

| Signal | What it tells you |
|--------|-------------------|
| `value()` | Current field value |
| `valid()` | `true` if all validators pass |
| `touched()` | `true` if user focused + blurred the field |
| `dirty()` | `true` if user changed the value |
| `disabled()` | `true` if field is disabled |
| `readonly()` | `true` if field is readonly |
| `pending()` | `true` if async validation in progress |
| `errors()` | Array of `{ kind, message }` validation errors |

```typescript
// Programmatically set a value
loginForm.email().value.set('alice@example.com');

// The model signal also updates automatically
console.log(this.loginModel().email); // 'alice@example.com'
```

---

### Validators available

Import them from `@angular/forms/signals`:

```typescript
import {
  required, email, min, max, minLength, maxLength, pattern, debounce
} from '@angular/forms/signals';

loginForm = form(this.model, (s) => {
  required(s.name);
  minLength(s.name, 2);
  maxLength(s.name, 50);
  required(s.age);
  min(s.age, 18);
  max(s.age, 120);
  email(s.email);
  pattern(s.phone, /^\d{10}$/);
  debounce(s.email, 500); // debounce validation by 500ms
});
```

---

### Supported input types

`[formField]` works with all standard HTML inputs out of the box:

```html
<!-- text, email, password, etc. -->
<input type="text"     [formField]="form.name" />
<input type="email"    [formField]="form.email" />

<!-- number — auto converts string ↔ number -->
<input type="number"   [formField]="form.age" />

<!-- checkbox — binds to boolean -->
<input type="checkbox" [formField]="form.agreeToTerms" />

<!-- radio — binds to the value attribute of the selected button -->
<input type="radio" value="free"    [formField]="form.plan" />
<input type="radio" value="premium" [formField]="form.plan" />

<!-- select -->
<select [formField]="form.country">
  <option value="">Choose...</option>
  <option value="us">United States</option>
</select>

<!-- textarea -->
<textarea [formField]="form.message"></textarea>
```

---

### The `toSignal()` bridge (for reactive forms you already have)

If you still use `FormControl`/`FormGroup` (reactive forms), bridge to signals with `toSignal()`:

```typescript
form = inject(FormBuilder).group({
  query:    ['', [Validators.required, Validators.minLength(2)]],
  category: ['all']
});

// ONE signal for all form values
formValue = toSignal(this.form.valueChanges, {
  initialValue: this.form.value
});

formValid = toSignal(
  this.form.statusChanges.pipe(map(s => s === 'VALID')),
  { initialValue: this.form.valid }
);
```

```html
<p>Query: {{ formValue().query }}</p>
<button [disabled]="!formValid()">Submit</button>
```

---

### `toObservable()` — signal → Observable (for RxJS pipelines)

```typescript
import { toObservable } from '@angular/core/rxjs-interop';

searchQuery = signal('');

results = toSignal(
  toObservable(this.searchQuery).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q => this.http.get<Result[]>(`/api/search?q=${q}`))
  ),
  { initialValue: [] }
);
```

---

### Quick decision guide

| Your situation | What to use |
|---------------|------------|
| New app on Angular 22+ | Signal Forms (`@angular/forms/signals`) |
| Existing app with reactive forms | Reactive forms + `toSignal(form.valueChanges, { initialValue: form.value })` |
| Simple UI with no validators needed | Pure signals + event binding |
| Need RxJS pipeline (debounce, switchMap) | `toObservable(signal).pipe(...)` → `toSignal()` |

---

## Real-world signal examples

### 1. Shopping cart

```typescript
import { signal, computed, effect, inject } from '@angular/core';
import { Injectable } from '@angular/core';

interface CartItem { id: number; name: string; price: number; qty: number; }

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>([]);

  // Derived signals — auto-update when items changes
  itemCount  = computed(() => this.items().reduce((sum, i) => sum + i.qty, 0));
  subtotal   = computed(() => this.items().reduce((sum, i) => sum + i.price * i.qty, 0));
  isEmpty    = computed(() => this.items().length === 0);

  constructor() {
    // Persist cart to localStorage automatically
    effect(() => {
      localStorage.setItem('cart', JSON.stringify(this.items()));
    });
  }

  addItem(item: CartItem) {
    this.items.update(cart => {
      const existing = cart.find(i => i.id === item.id);
      if (existing) {
        return cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...cart, item];
    });
  }

  removeItem(id: number) {
    this.items.update(cart => cart.filter(i => i.id !== id));
  }
}
```

```typescript
// cart-icon.component.ts — reads from the service
@Component({
  selector: 'app-cart-icon',
  template: `
    <button>
      🛒 <span class="badge">{{ cart.itemCount() }}</span>
    </button>
  `
})
export class CartIconComponent {
  cart = inject(CartService);
}
```

---

### 2. Dark mode toggle

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = signal<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
  );

  readonly theme = this._theme.asReadonly(); // expose as read-only to outside
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this._theme());
      localStorage.setItem('theme', this._theme());
    });
  }

  toggle() {
    this._theme.update(t => t === 'light' ? 'dark' : 'light');
  }
}
```

```typescript
@Component({
  selector: 'app-theme-toggle',
  template: `
    <button (click)="theme.toggle()">
      {{ theme.isDark() ? '☀️ Light' : '🌙 Dark' }}
    </button>
  `
})
export class ThemeToggleComponent {
  theme = inject(ThemeService);
}
```

---

### 3. Pagination with computed signals

```typescript
@Component({
  selector: 'app-user-list',
  template: `
    <div *ngFor="let user of paginatedUsers()">{{ user.name }}</div>

    <div class="pagination">
      <button (click)="prevPage()" [disabled]="currentPage() === 1">Prev</button>
      <span>Page {{ currentPage() }} of {{ totalPages() }}</span>
      <button (click)="nextPage()" [disabled]="currentPage() === totalPages()">Next</button>
    </div>
  `
})
export class UserListComponent {
  allUsers  = signal<User[]>([]);
  pageSize  = signal(10);
  currentPage = signal(1);

  totalPages = computed(() =>
    Math.ceil(this.allUsers().length / this.pageSize())
  );

  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.allUsers().slice(start, start + this.pageSize());
  });

  nextPage() {
    this.currentPage.update(p => Math.min(p + 1, this.totalPages()));
  }
  prevPage() {
    this.currentPage.update(p => Math.max(p - 1, 1));
  }
}
```

---

### 4. Real-time form validation feedback

```typescript
@Component({
  selector: 'app-register',
  template: `
    <input [value]="username()" (input)="username.set($any($event.target).value)">
    <input [value]="password()" (input)="password.set($any($event.target).value)" type="password">
    <input [value]="confirm()"  (input)="confirm.set($any($event.target).value)"  type="password">

    @if (usernameTaken()) {
      <p class="error">Username is already taken</p>
    }
    @if (passwordStrength() < 3) {
      <p class="warning">Weak password</p>
    }
    @if (!passwordsMatch()) {
      <p class="error">Passwords do not match</p>
    }

    <button [disabled]="!canSubmit()">Register</button>
  `
})
export class RegisterComponent {
  username = signal('');
  password = signal('');
  confirm  = signal('');

  usernameTaken = signal(false); // set by async check in effect

  passwordStrength = computed(() => {
    const p = this.password();
    let strength = 0;
    if (p.length >= 8) strength++;
    if (/[A-Z]/.test(p)) strength++;
    if (/[0-9]/.test(p)) strength++;
    if (/[^A-Za-z0-9]/.test(p)) strength++;
    return strength;
  });

  passwordsMatch = computed(() =>
    this.password() === this.confirm() && this.confirm().length > 0
  );

  canSubmit = computed(() =>
    this.username().length > 2 &&
    !this.usernameTaken() &&
    this.passwordStrength() >= 3 &&
    this.passwordsMatch()
  );
}
```

---

### 5. Signals in a service (shared state)

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);

  // Public read-only views
  readonly user        = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._user() !== null);
  readonly userName    = computed(() => this._user()?.name ?? 'Guest');
  readonly isAdmin     = computed(() => this._user()?.role === 'admin');

  login(credentials: Credentials) {
    this.http.post<User>('/api/login', credentials).subscribe(user => {
      this._user.set(user);
    });
  }

  logout() {
    this._user.set(null);
  }

  private http = inject(HttpClient);
}
```

```typescript
// Any component in the app reads from AuthService
@Component({
  template: `
    @if (auth.isLoggedIn()) {
      <p>Welcome, {{ auth.userName() }}</p>
      @if (auth.isAdmin()) {
        <a routerLink="/admin">Admin Panel</a>
      }
    } @else {
      <a routerLink="/login">Login</a>
    }
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
}
```

---

## API calls with signals

Yes — signals can handle API calls, and it is done in real-world apps. There are three approaches depending on which Angular version you're on.

---

### Approach 1 — `toSignal()` (most common today)

`toSignal()` converts any Observable (including HTTP calls) into a read-only signal. This is the bread-and-butter approach used in production apps right now.

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

interface User { id: number; name: string; email: string; }

@Component({
  selector: 'app-users',
  template: `
    @if (users().length) {
      @for (user of users(); track user.id) {
        <p>{{ user.name }}</p>
      }
    } @else {
      <p>Loading...</p>
    }
  `
})
export class UsersComponent {
  private http = inject(HttpClient);

  // HTTP Observable → signal. No subscribe, no async pipe, no unsubscribe.
  users = toSignal(
    this.http.get<User[]>('/api/users'),
    { initialValue: [] }
  );
}
```

**`initialValue`** — what the signal holds before the HTTP response arrives. Without it the signal is `undefined` until the request completes.

---

### Approach 2 — `toSignal()` + reactive params (re-fetch when ID changes)

This is the real-world pattern for a detail page where the ID comes from a signal:

```typescript
import { Component, inject, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-user-detail',
  template: `
    @if (user()) {
      <h2>{{ user()!.name }}</h2>
      <p>{{ user()!.email }}</p>
    } @else {
      <p>Loading...</p>
    }
  `
})
export class UserDetailComponent {
  userId = input.required<string>(); // route param via withComponentInputBinding

  private http = inject(HttpClient);

  // When userId changes → cancel previous request → fetch new user
  user = toSignal(
    toObservable(this.userId).pipe(
      switchMap(id => this.http.get<User>(`/api/users/${id}`))
    )
  );
}
```

**What happens here:**
1. `userId` is a signal (from a route input)
2. `toObservable()` turns it into an Observable
3. `switchMap` cancels the previous request and fires a new one every time `userId` changes
4. `toSignal()` converts the result back into a signal for the template

This pattern replaces the old `ngOnChanges` + subscribe boilerplate entirely.

---

### Approach 3 — `resource()` (Angular 19+, modern)

Angular 19 introduced `resource()` — a first-class API for async data fetching with signals. It is built specifically for API calls.

```typescript
import { Component, signal, resource, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-user-detail',
  template: `
    @if (userResource.isLoading()) {
      <p>Loading...</p>
    } @else if (userResource.error()) {
      <p>Error: {{ userResource.error() }}</p>
    } @else {
      <h2>{{ userResource.value()?.name }}</h2>
    }
  `
})
export class UserDetailComponent {
  userId = signal('1');

  private http = inject(HttpClient);

  userResource = resource({
    request: () => this.userId(),   // reactive — re-runs when userId changes
    loader: ({ request: id }) =>
      firstValueFrom(this.http.get<User>(`/api/users/${id}`))
  });
}
```

`resource()` automatically gives you:
- `resource.value()` — the fetched data as a signal
- `resource.isLoading()` — boolean signal, true while fetching
- `resource.error()` — error signal if request failed
- `resource.status()` — `'idle' | 'loading' | 'resolved' | 'error' | 'reloading'`
- `resource.reload()` — method to re-trigger the fetch manually

### `httpResource()` — Angular 19.2+

`httpResource()` is `resource()` but wired directly to `HttpClient` — no need for `firstValueFrom`:

```typescript
import { httpResource } from '@angular/common/http';

@Component({ ... })
export class UserDetailComponent {
  userId = signal('1');

  // Cleaner — no firstValueFrom needed
  userResource = httpResource<User>(
    () => `/api/users/${this.userId()}`  // URL re-computed when userId changes
  );
}
```

```html
@if (userResource.isLoading()) {
  <app-skeleton />
} @else if (userResource.error()) {
  <p>Failed to load. <button (click)="userResource.reload()">Retry</button></p>
} @else {
  <h2>{{ userResource.value()?.name }}</h2>
}
```

---

### Full real-world service example — signals + HTTP

```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, switchMap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

interface Product { id: number; name: string; price: number; category: string; }

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  // Reactive filters — changing these re-fetches automatically
  category   = signal('all');
  searchQuery = signal('');

  // When either filter changes, re-fetch
  products = toSignal(
    toObservable(
      // computed signal: re-emits whenever category or searchQuery changes
      computed(() => ({ category: this.category(), q: this.searchQuery() }))
    ).pipe(
      switchMap(filters =>
        this.http.get<Product[]>('/api/products', { params: filters }).pipe(
          catchError(() => of([]))  // fallback on error
        )
      )
    ),
    { initialValue: [] as Product[] }
  );

  // Derived signals from the products list
  totalCount = computed(() => this.products().length);
  hasResults = computed(() => this.products().length > 0);
}
```

```typescript
// In any component — reads reactively
@Component({
  template: `
    <input [value]="products.searchQuery()"
           (input)="products.searchQuery.set($any($event.target).value)">

    <select (change)="products.category.set($any($event.target).value)">
      <option value="all">All</option>
      <option value="electronics">Electronics</option>
    </select>

    <p>{{ products.totalCount() }} results</p>

    @for (p of products.products(); track p.id) {
      <app-product-card [product]="p" />
    }
  `
})
export class ProductListComponent {
  products = inject(ProductService);
}
```

---

### Is it done in real-world apps?

Yes. Here is how the industry is moving:

| Angular version | Common pattern |
|----------------|---------------|
| Before v16 | Subscribe + async pipe + BehaviorSubject |
| v16–v18 | `toSignal()` wrapping HTTP Observables |
| v19+ | `resource()` / `httpResource()` for new code |

The `toSignal()` approach is already mainstream in 2025/2026 production apps. `resource()` / `httpResource()` are newer and you will see them increasingly in new projects. The old subscribe-and-assign pattern still works but is considered legacy.

---

### Which approach to use

| Scenario | Use |
|----------|-----|
| Simple fetch on component load | `toSignal(this.http.get(...))` |
| Re-fetch when a signal/param changes | `toObservable(signal).pipe(switchMap(...))` wrapped in `toSignal()` |
| Full loading/error/reload state needed | `resource()` or `httpResource()` (Angular 19+) |
| Complex pipe chain (retry, cache, transform) | RxJS pipe + `toSignal()` at the end |

---

## Summary

| Concept | What it does | When to use |
|---------|-------------|-------------|
| `signal()` | Writable reactive value | Local state, shared service state |
| `computed()` | Derived read-only signal | Any value that depends on other signals |
| `model()` | Two-way signal between parent/child; also usable as local state, one-way binding, and in `computed()`/`effect()` | Custom form controls, reusable inputs, any component that exposes a value the parent *may* want to control |
| `effect()` | Side effect when signals change | localStorage, logging, DOM operations, bridging to RxJS |
| `viewChild()` | DOM/component reference as signal | Auto-focus, calling child methods, DOM measurements |
| `toSignal()` | Observable → signal | Using RxJS streams in templates without `async` pipe |
| `toObservable()` | Signal → Observable | Passing signal value to a service that needs Observable |
| `resource()` | Async data fetch with built-in loading/error signals | API calls in Angular 19+ |
| `httpResource()` | `resource()` wired to HttpClient directly | Simple API calls in Angular 19.2+ |

## Quick memory line
Signals = reactive values Angular tracks precisely. `signal` reads/writes, `computed` derives, `model` syncs parent-child, `effect` runs side effects, `viewChild` queries the DOM — all automatic, no Zone.js needed.

## Common mistakes
- Calling `effect()` in `ngOnInit` — it must be in the constructor or field initializer
- Forgetting to call a signal as a function: `count` vs `count()` — the latter is the value
- Using `effect()` to update another signal (causes circular updates) — use `computed()` instead
- Mutating a signal's object directly without calling `.set()` or `.update()` — Angular won't detect it
- Using `@ViewChild` (old) and `viewChild()` (new) in the same component — pick one style
