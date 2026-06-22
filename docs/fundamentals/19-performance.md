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

## 7. `resource()`, `rxResource()` & `httpResource()` — signal-based async data (stable since Angular 22)

### What it is
`resource()`, `rxResource()`, and `httpResource()` are built-in Angular APIs for fetching and managing async data using signals. They give you a reactive wrapper around any async operation (HTTP calls, localStorage reads, etc.) with built-in loading, error, and status tracking — no manual Observable pipelining or state variables needed.

| API | Package | When to use |
|-----|---------|------------|
| `resource()` | `@angular/core` | `fetch`, `localStorage`, or any `Promise`-based async operation |
| `rxResource()` | `@angular/core/rxjs-interop` | WebSocket streams, timers, or custom RxJS `Observable`-based operations |
| `httpResource()` | `@angular/common/http` | **HTTP calls** via `HttpClient` (interceptors, testing, transfer cache) — the recommended choice for HTTP |

### `resource()` — Promise-based async data

```typescript
import { Component, resource } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  template: `
    @if (userProfile.isLoading()) {
      <p>Loading…</p>
    } @else if (userProfile.error()) {
      <p>Error: {{ userProfile.error() }}</p>
    } @else {
      <p>{{ userProfile.value().name }}</p>
    }
  `
})
export class UserProfileComponent {
  userProfile = resource({
    request: () => ({ id: this.userId }),          // reactive request params
    loader: ({ request, abortSignal }) =>           // receives request + AbortSignal
      fetch(`/api/users/${request.id}`, { signal: abortSignal })
        .then(res => res.json())
  });
}
```

**Key properties on the returned `ResourceRef`:**
- `value` — signal of the current data (or `undefined` initially)
- `isLoading` — signal: `true` while a request is in-flight
- `error` — signal: the last error, or `undefined`
- `status()` — signal returning a `ResourceStatus` enum (`Idle`, `Loading`, `Resolved`, `Reloading`, `Error`, `Local`)
- `reload()` — manually re-trigger the loader
- `asReadonly()` — expose a read-only version to templates

### `rxResource()` — RxJS-based async data (general-purpose)

Best for non-HTTP Observable-based operations like WebSocket streams, timers, or custom event sources:

```typescript
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-live-feed',
  template: `
    @if (feed.isLoading()) {
      <p>Connecting…</p>
    } @else {
      <p>{{ feed.value() }}</p>
    }
  `
})
export class LiveFeedComponent {
  private wsService = inject(WebSocketService);

  feed = rxResource({
    loader: () => this.wsService.listen()   // returns Observable<string>
  });
}
```

> **For HTTP calls**, prefer `httpResource()` instead (see below) — it integrates with Angular's `HttpClient` interceptors, testing utilities, and transfer cache.

### `httpResource()` — HTTP-specific async data (recommended for HTTP)

`httpResource()` is a reactive wrapper around `HttpClient` that exposes the request status and response as signals. It's the **recommended choice** for all HTTP data fetching because it integrates with the full `HttpClient` ecosystem (interceptors, testing, transfer cache, etc.).

### Full in-depth example — `httpResource()` with params, loading, errors & auto-cancellation

```typescript
import { Component, signal, inject, ResourceStatus } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

interface SearchResult {
  items: { id: number; name: string; price: number }[];
  total: number;
}

@Component({
  selector: 'app-search-products',
  template: `
    <!-- Search input — reactive param source -->
    <input
      type="text"
      [value]="query()"
      (input)="query.set($any($event.target).value)"
      placeholder="Search products…"
    />

    <!-- Loading state — fine-grained status using the enum -->
    @switch (products.status()) {
      @case (ResourceStatus.Idle) {
        <p>🔍 Start typing to search products</p>
      }
      @case (ResourceStatus.Loading) {
        <div class="loader">
          <span class="spinner"></span> Searching…
        </div>
      }
      @case (ResourceStatus.Reloading) {
        <div class="loader">
          <span class="spinner"></span> Updating results…
        </div>
        <!-- Keep showing previous results while reloading -->
        <div class="results">
          @for (item of products.value().items; track item.id) {
            <div class="card"> {{ item.name }} — \${{ item.price }} </div>
          }
        </div>
      }
      @case (ResourceStatus.Error) {
        <div class="error">
          ❌ {{ products.error()?.message ?? 'Something went wrong' }}
          <button (click)="products.reload()">Retry</button>
        </div>
      }
      @case (ResourceStatus.Resolved) {
        <p>Found {{ products.value().total }} results</p>
        <div class="results">
          @for (item of products.value().items; track item.id) {
            <div class="card"> {{ item.name }} — \${{ item.price }} </div>
          }
        </div>
      }
    }
  `
})
export class SearchProductsComponent {
  // ─── Reactive params (signal-based) ───────────────────────────
  query = signal('');
  pageSize = signal(20);
  categoryFilter = signal('electronics');

  // ─── httpResource — fully reactive ────────────────────────────
  products = httpResource<SearchResult>(() => {
    const q = this.query().trim();
    // Return undefined → loader won't run → status becomes 'idle'
    if (q.length < 2) return undefined;

    return {
      url: '/api/products/search',
      params: {
        q,                                    // search term
        limit: this.pageSize().toString(),    // reactive page size
        category: this.categoryFilter()       // reactive filter
      },
      headers: {
        'X-Cache-Buster': Date.now().toString()
      },
      reportProgress: false                    // don't emit progress events
    };
  }, {
    // ─── Optional: parse & validate response ────────────────────
    // parse: (body) => searchResultSchema.parse(body),

    // ─── Default value while loading ────────────────────────────
    defaultValue: { items: [], total: 0 }
  });

  // ─── Status shortcuts ─────────────────────────────────────────
  readonly ResourceStatus = ResourceStatus;  // expose enum to template
  isLoading = this.products.isLoading;       // true on Loading OR Reloading
  error = this.products.error;

  // ─── Debounced search (optional) ──────────────────────────────
  constructor() {
    // Convert query signal → observable → debounce → trigger via effect
    toObservable(this.query).pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      // httpResource reacts automatically — no manual call needed
    });
  }
}
```

#### 🧠 How auto-cancellation prevents memory leaks

The key difference from manual `HttpClient` + `subscribe()`:

```typescript
// ❌ OLD WAY — manual subscribe (leak-prone)
export class OldComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private data = signal<Data | undefined>(undefined);

  ngOnInit() {
    this.http.get<Data>('/api/data').pipe(
      takeUntil(this.destroy$)                // MUST remember to add this
    ).subscribe(data => this.data.set(data));
  }

  ngOnDestroy() {
    this.destroy$.next();                     // MUST remember to call this
  }
}
```

```typescript
// ✅ NEW WAY — httpResource (auto-cancels on destroy OR param change)
export class NewComponent {
  data = httpResource(() => '/api/data');
  // No ngOnInit, no OnDestroy, no takeUntil, no Subject — nothing!
  // Angular auto-cancels:
  //   1. When the component is destroyed (prevents memory leaks)
  //   2. When request params change (prevents stale responses)
  //   3. When a new request starts (aborts the in-flight one via AbortController)
}
```

#### 🧪 See the race-condition fix in action

```typescript
// Scenario: user types "a" → "ap" → "app" quickly
products = httpResource(() => `/api/search?q=${this.query()}`);

// What happens under the hood:
// 1. query → "a"    → httpResource fires GET /api/search?q=a
// 2. query → "ap"   → HTTP call #1 is ABORTED automatically
//                      → httpResource fires GET /api/search?q=ap
// 3. query → "app"  → HTTP call #2 is ABORTED automatically
//                      → httpResource fires GET /api/search?q=app
//
// ✅ Only "app" result reaches the template
// ❌ Without this, all 3 responses arrive — and the last one wins,
//    but the user might see "a" results flickering before "app" arrives
```

#### 🎛️ Available statuses (from `ResourceStatus` enum)

| Status | When it happens | `value()` | `error()` |
|--------|----------------|-----------|-----------|
| `Idle` | Params returned `undefined` — loader never ran | `defaultValue` | `undefined` |
| `Loading` | First request in-flight | `defaultValue` | `undefined` |
| `Reloading` | Re-fetching (via param change or `.reload()`) | **Previous value** | `undefined` |
| `Resolved` | Loader completed successfully | Response data | `undefined` |
| `Error` | Loader threw / HTTP error | Throws on read | Error object |
| `Local` | Value was set via `.set()` or `.update()` | Manually set value | `undefined` |

#### 🔁 Helpful signals on the resource

| Signal | Returns | Use case |
|--------|---------|----------|
| `.value()` | Data or `defaultValue` | Read the current data |
| `.hasValue()` | `boolean` | Guard before reading `.value()` in error state |
| `.isLoading()` | `boolean` | `true` during `Loading` or `Reloading` |
| `.error()` | `unknown` | The error object, or `undefined` |
| `.status()` | `ResourceStatus` enum | Fine-grained UI control |
| `.isLoading()` | `boolean` | True when any request is pending |
| `.error()` | `unknown` | The error object, or `undefined` |

#### 📦 Response type variants

| Function | Returns | Use case |
|----------|---------|----------|
| `httpResource()` | JSON (parsed) | Most APIs |
| `httpResource.text()` | `string` | HTML, CSV, plain text |
| `httpResource.blob()` | `Blob` | Images, PDFs, file downloads |
| `httpResource.arrayBuffer()` | `ArrayBuffer` | Binary data, WebAssembly |

#### ✅ Key advantage vs `rxResource()`

`httpResource()` returns a **`WritableResource`** — you can locally set or update the value:

```typescript
products = httpResource(() => '/api/products');

// Optimistic update — immediately show the change, then re-fetch
addProduct(newProduct: Product) {
  this.products.update(prev => ({
    ...prev,
    items: [...prev.items, newProduct]
  }));
  this.products.reload();  // re-fetch from server in background
}
```

### Why it helps performance
- **Automatic cancellation** — if the request params change before the previous request completes, the old request is automatically aborted via `AbortController`. No stale responses overwriting newer data.
- **No manual cleanup** — the subscription lifecycle is managed by Angular; no `ngOnDestroy`, no `takeUntil`, no leaking subscriptions.
- **Reactive by nature** — changes to `request` dependencies automatically trigger a new load, just like `computed()`.
- **Less boilerplate** — replaces the common pattern of: `signal` for data + `signal` for loading + `signal` for error + manual subscription + manual cancellation.

### Comparison with older patterns

```typescript
// OLD: manual state signals + HttpClient subscription (lots of boilerplate)
data = signal<Data | undefined>(undefined);
isLoading = signal(false);
error = signal<unknown>(undefined);
private sub = this.http.get<Data>('/api/data').subscribe({
  next: d => { this.data.set(d); this.isLoading.set(false); },
  error: e => { this.error.set(e); this.isLoading.set(false); }
});

// NEW: single httpResource() call
data = httpResource(() => '/api/data');
```

> **Note:** `resource()`, `rxResource()`, and `httpResource()` are all **stable** as of Angular 22.

---

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

## 9. Preloading strategies

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

## 10. Image optimization with `NgOptimizedImage`

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

## 11. Zoneless change detection (Angular 20+ dev preview)

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
| `resource()` / `rxResource()` / `httpResource()` | Signal-based async data with auto-cancellation | Less boilerplate, no stale responses |
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
- Managing async state manually (separate signals for data, loading, error) — use `resource()`, `rxResource()`, or `httpResource()` instead
- Using `rxResource()` for HTTP calls when `httpResource()` is the simpler, more integrated option
