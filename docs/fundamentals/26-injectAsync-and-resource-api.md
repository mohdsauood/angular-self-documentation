# `injectAsync()` and the Resource API

## What is `injectAsync()`?

`injectAsync()` is a helper function (stable since Angular v22) that lets you **lazy-load a service** — meaning the service is only loaded when you actually need it, not at app startup.

It returns a **function** that returns a **Promise** of the service instance. You call that function and `await` the result.

```typescript
import { Component, injectAsync } from '@angular/core';

@Component({ ... })
export class MyComponent {
  // Does NOT load the service yet — just sets up the lazy loader
  someSvc = injectAsync(() => import('../heavy.service'));

  async onClick() {
    // Service is loaded NOW (on first call) and cached for subsequent calls
    const svc = await this.someSvc();
    svc.handleClick();
  }
}
```

### How `injectAsync()` works

1. You pass a **loader function** that returns `import()` — a dynamic import of the service module.
2. The service is **not loaded** at component creation time — it's loaded lazily on first use.
3. Once loaded, the instance is **cached** — subsequent calls reuse the same instance.
4. The service must be **auto-provided** with `@Injectable({ providedIn: 'root' })` or the new `@Service()` decorator.

### Prefetching

You can tell Angular to prefetch the service during idle time:

```typescript
import { Component, injectAsync, onIdle } from '@angular/core';

@Component({ ... })
export class MyComponent {
  someSvc = injectAsync(
    () => import('../heavy.service'),
    { prefetch: onIdle }  // load during browser idle time
  );

  async onClick() {
    const svc = await this.someSvc(); // likely already loaded by now
    svc.handleClick();
  }
}
```

### Why `injectAsync()` matters

- **Smaller initial bundle** — code that isn't needed immediately isn't loaded upfront.
- **Faster initial load** — your main bundle stays lean.
- **Cleaner than manual lazy DI** — no need to manage `EnvironmentInjector` or `runInInjectionContext` yourself.
- **Integrates with `onIdle`** — prefetch when the browser has free cycles.

### `injectAsync()` vs `inject()`

| | `inject()` | `injectAsync()` |
|---|---|---|
| When it loads | Immediately (synced) | Lazily (async, on first call) |
| Return type | The service instance directly | A function that returns `Promise<T>` |
| Bundle impact | Included in component's bundle | Code-split separately |
| Use case | Services needed at init time | Rarely-used or heavy services |

---

## What is the Resource API?

The **Resource API** (`resource()`, `httpResource()`) is a signal-based way to handle **asynchronous data** — like fetching from a server. It's stable since Angular v22.

All signal APIs (`signal()`, `computed()`, `input()`) are synchronous. But real apps need async data. The Resource API bridges this gap — you work with async data **as if it were synchronous** through signals.

### `resource()` — the core primitive

```typescript
import { resource, Signal } from '@angular/core';

const userId: Signal<string> = getUserId();

const userResource = resource({
  // Define a reactive params computation
  params: () => ({ id: userId() }),

  // Async loader — runs whenever params change
  loader: ({ params }) => fetchUser(params),
});

// Read the result as signals:
userResource.value();    // the fetched data (or undefined)
userResource.hasValue(); // true when data is loaded
userResource.error();    // error if loader failed
userResource.isLoading(); // true while fetching
userResource.status();   // 'idle' | 'loading' | 'reloading' | 'resolved' | 'error' | 'local'
```

### How `resource()` works

1. **`params`** — a reactive computation (like `computed()`) that produces a value. When any signal inside it changes, the loader re-runs.
2. **`loader`** — an async function that receives `{ params, previous, abortSignal }` and returns data.
3. If `params` returns `undefined`, the loader **does not run** and status becomes `'idle'`.
4. The result is exposed as **signal properties** — you read them reactively in templates or `computed()`.

### Resource status values

| Status | Value | Meaning |
|--------|-------|---------|
| `'idle'` | `undefined` | No valid request, loader not run |
| `'loading'` | `undefined` | First load in progress |
| `'reloading'` | Previous value | Reload after `.reload()` call |
| `'resolved'` | Resolved value | Loader completed successfully |
| `'error'` | `undefined` | Loader threw an error |
| `'local'` | Locally set value | Value set via `.set()` or `.update()` |

### Aborting requests

When `params` change while a loader is running, the previous loader is **aborted**:

```typescript
const userResource = resource({
  params: () => ({ id: userId() }),
  loader: ({ params, abortSignal }) => {
    return fetch(`/users/${params.id}`, { signal: abortSignal });
  },
});
```

### Reloading

You can manually trigger a reload:

```typescript
userResource.reload(); // re-runs the loader with current params
```

### SSR caching

On the server, Angular runs the loader once for initial HTML. During hydration, it normally runs again. To reuse the server result, provide an `id`:

```typescript
const userResource = resource({
  params: () => ({ id: userId() }),
  loader: ({ params }) => fetchUser(params),
  id: 'user-unique-id',  // caches result in TransferState
});
```

> ⚠️ Don't use `id` for user-specific data if your SSR HTML can be cached between users.

### `httpResource()` — HTTP-specific wrapper

`httpResource()` wraps `HttpClient` and gives you request status + response as signals. It goes through Angular's HTTP interceptors:

```typescript
import { httpResource } from '@angular/common/http';

@Component({ ... })
export class UserProfileComponent {
  userId = input.required<number>();

  user = httpResource<User>(() => `/users/${this.userId()}`);

  // Same signal API:
  // user.value(), user.isLoading(), user.error(), user.status()
}
```

### Resource composition with snapshots

Every resource has a `.snapshot` property — a signal of `ResourceSnapshot` containing `status` and `value` or `error`. Use `resourceFromSnapshots()` to compose resources:

```typescript
import { linkedSignal, resourceFromSnapshots, Resource, ResourceSnapshot } from '@angular/core';

function withPreviousValue<T>(input: Resource<T>): Resource<T> {
  const derived = linkedSignal<ResourceSnapshot<T>, ResourceSnapshot<T>>({
    source: input.snapshot,
    computation: (snap, previous) => {
      if (snap.status === 'loading' && previous?.value.status !== 'error') {
        // Keep previous value while loading
        return { status: 'loading' as const, value: previous.value.value };
      }
      return snap;
    },
  });
  return resourceFromSnapshots(derived);
}
```

### `WritableResource` — local mutation

You can create a resource that supports local `.set()` and `.update()`:

```typescript
const writable = resource({
  loader: ({ params }) => fetchSettings(params),
  defaultValue: defaultSettings,
  writable: true,
});

// Later — locally override without re-fetching
writable.set(newSettings);
// status becomes 'local'
```

---

## Quick memory line

`injectAsync()` = lazy-load services on demand. `resource()` = turn async data into signals. Both are stable since Angular v22.

---

## Angular v22 updates

### `onIdle()` and `IdleService`

Angular v22 introduces browser-idle helpers so you can schedule non-critical work safely.

- `onIdle(...)` lets you run code when the browser is idle
- `IdleService` gives a centralized way to coordinate idle scheduling
- useful for prefetching, analytics setup, and low-priority warmups

### WebMCP additions

Angular v22 adds experimental WebMCP integration helpers like `provideWebMcpTools(...)`.

Use this for browser-side tool exposure patterns where MCP-compatible tooling is needed in web contexts.

### Practical guidance

- combine `injectAsync(..., { prefetch: onIdle })` for heavy services
- keep lazy-loaded services small and focused
- treat WebMCP APIs as experimental and check release notes before production rollout

## Common mistakes

- Using `injectAsync()` for services that are always needed (use regular `inject()` instead)
- Forgetting to `await` the result of `injectAsync()`
- Not providing an `id` for SSR resources — causes double-fetching
- Ignoring `abortSignal` in resource loaders — leads to race conditions
- Using `resource()` for simple transformations (use `computed()` instead)
- Setting `id` on user-specific resources that might be cached in SSR HTML
