# Deferrable Views (`@defer`)


## Table of Contents

- [What is `@defer`?](#what-is-defer)
- [Why it matters](#why-it-matters)
- [How the chunks work — the important question](#how-the-chunks-work-the-important-question)
- [Basic syntax](#basic-syntax)
- [Triggers](#triggers)
  - [`on idle` (default)](#on-idle-default)
  - [`on viewport`](#on-viewport)
  - [`on interaction`](#on-interaction)
  - [`on hover`](#on-hover)
  - [`on timer`](#on-timer)
  - [`when` — custom condition](#when-custom-condition)
- [Prefetching](#prefetching)
  - [Prefetch triggers](#prefetch-triggers)
  - [When to use prefetch](#when-to-use-prefetch)
- [Minimum loading time](#minimum-loading-time)
- [After how long to show placeholder](#after-how-long-to-show-placeholder)
- [Real-world examples](#real-world-examples)
  - [Comments section (lazy load on scroll)](#comments-section-lazy-load-on-scroll)
  - [Rich text editor (load on interaction)](#rich-text-editor-load-on-interaction)
  - [Admin panel (load when user is admin)](#admin-panel-load-when-user-is-admin)
  - [Dashboard widgets (staggered loading)](#dashboard-widgets-staggered-loading)
- [Why this matters for performance](#why-this-matters-for-performance)
- [Quick memory line](#quick-memory-line)
- [Common mistakes](#common-mistakes)

## What is `@defer`?

`@defer` is an Angular template block (stable since Angular 17, with enhancements in Angular 21) that lets you **lazily load a part of your template** — including the component's code — only when a certain condition is met, instead of loading everything upfront.

```html
@defer {
  <app-heavy-chart />
}
```

Angular will not download, compile, or render `<app-heavy-chart>` until the trigger condition fires.

---

## Why it matters

When a user loads your Angular app, the browser downloads a bundle of JavaScript. Without `@defer`, every component in every template is included in that bundle — even components the user might never see (a modal, a chart below the fold, a rarely-used sidebar widget).

`@defer` solves this by **splitting that component into a separate chunk** (a separate `.js` file). That chunk is only downloaded when it is actually needed.

---

## How the chunks work — the important question

> "Is the chunk already sent to the client when the page loads? Or does it get downloaded later?"

**It gets downloaded later — that is the entire point.**

Without `@defer`:
```
Page loads → browser downloads main.js (everything, all components) → done
```

With `@defer`:
```
Page loads → browser downloads main.js (without the deferred component)
                                        ↓
         User scrolls down / triggers condition
                                        ↓
         Browser makes a new request → downloads chart.chunk.js → renders component
```

The deferred chunk is **not present in `main.js`**. It lives in a separate file (e.g., `chunk-abc123.js`). That file sits on the server. When the trigger fires, Angular's runtime requests it from the server dynamically.

So to be precise:
- The chunk exists on the server at deploy time
- The browser only downloads it when the trigger fires
- Until then, that code never touches the user's device

This is exactly like lazy-loaded routes (which also produce separate chunks) but at the **template/component level**.

---

## Basic syntax

```html
@defer {
  <app-comments />
}
@loading {
  <p>Loading comments...</p>
}
@error {
  <p>Failed to load comments.</p>
}
@placeholder {
  <p>Comments will appear here</p>
}
```

| Block | When it shows |
|-------|--------------|
| `@defer` | The actual content — shown after loading |
| `@placeholder` | Shown before the defer trigger fires |
| `@loading` | Shown while the chunk is being downloaded |
| `@error` | Shown if the chunk download or rendering fails |

---

## Triggers

Triggers control when Angular downloads and renders the deferred block.

### `on idle` (default)

Downloads when the browser is idle — not busy with anything else. This is the default if you write `@defer` with no trigger.

```html
@defer (on idle) {
  <app-analytics-widget />
}
```

In **Angular 21**, you can optionally specify a timeout — if the browser never becomes idle within that time, it loads anyway:

```html
@defer (on idle(3000)) {
  <app-analytics-widget />
}
```

Good for: non-critical widgets that should load quietly in the background.

---

### `on viewport`

Downloads when the deferred block enters the user's visible area (scroll into view). Uses `IntersectionObserver` internally.

```html
@defer (on viewport) {
  <app-comments-section />
}
@placeholder {
  <div class="comments-skeleton" style="height: 400px"></div>
}
```

Good for: content below the fold — comments, related articles, charts the user hasn't scrolled to yet.

---

### `on interaction`

Downloads when the user clicks or focuses on the placeholder.

```html
@defer (on interaction) {
  <app-rich-text-editor />
}
@placeholder {
  <div class="editor-placeholder">Click to edit...</div>
}
```

Good for: rich editors, complex dropdowns, features that are optional until the user engages.

---

### `on hover`

Downloads when the user hovers over the placeholder.

```html
@defer (on hover) {
  <app-tooltip-content />
}
@placeholder {
  <span class="has-tooltip">ℹ️ Info</span>
}
```

---

### `on timer`

Downloads after a set delay (milliseconds).

```html
@defer (on timer(3000)) {
  <app-promo-banner />
}
```

Good for: non-urgent banners, upsell prompts, cookie notices.

---

### `when` — custom condition

Downloads when a boolean expression becomes `true`.

```html
@defer (when isLoggedIn()) {
  <app-user-dashboard />
}
@placeholder {
  <app-login-prompt />
}
```

```typescript
isLoggedIn = inject(AuthService).isLoggedIn; // a signal
```

Good for: showing content only for authenticated users, feature flags.

---

## Prefetching

Prefetching lets Angular **start downloading the chunk early** (before it needs to render) so rendering is instant when the trigger fires.

```html
@defer (on viewport; prefetch on idle) {
  <app-heavy-chart />
}
```

This means:
1. **Prefetch trigger (`prefetch on idle`)** — start downloading the chunk when browser is idle
2. **Render trigger (`on viewport`)** — render the component when it enters the viewport

Because the chunk was already downloaded in the background, rendering feels instant to the user.

### Prefetch triggers

```html
<!-- Prefetch when browser is idle -->
@defer (on interaction; prefetch on idle) { ... }

<!-- Prefetch when user hovers the placeholder -->
@defer (on interaction; prefetch on hover) { ... }

<!-- Prefetch immediately (but render on interaction) -->
@defer (on interaction; prefetch on immediate) { ... }

<!-- Prefetch when a custom condition is true -->
@defer (on viewport; prefetch when userIsAboutToScroll()) { ... }
```

### When to use prefetch

| Scenario | Strategy |
|----------|----------|
| Below-fold content, likely to be seen | `on viewport; prefetch on idle` |
| Optional feature most users eventually use | `on interaction; prefetch on idle` |
| Content behind a tab click | `on interaction; prefetch on hover` |
| Critical content that must render instantly | `on immediate` (no defer — just load it) |

---

## Minimum loading time

You can prevent a flash of the loading indicator for fast connections:

```html
@defer (on viewport) {
  <app-chart />
}
@loading (minimum 500ms) {
  <app-skeleton />
}
```

If the chunk loads in 100ms, the `@loading` skeleton still shows for 500ms — avoiding a jarring flash.

---

## After how long to show placeholder

```html
@defer (on viewport) {
  <app-chart />
}
@loading (after 200ms; minimum 500ms) {
  <app-skeleton />
}
```

`after 200ms` — only show the loading skeleton if loading takes longer than 200ms. Fast connections won't see it at all.

---

## Real-world examples

### Comments section (lazy load on scroll)

```html
<!-- product-detail.component.html -->
<app-product-info [product]="product()" />
<app-add-to-cart [product]="product()" />

<!-- Comments are below the fold — load when scrolled to -->
@defer (on viewport; prefetch on idle) {
  <app-comments [productId]="product().id" />
}
@placeholder {
  <div class="comments-placeholder">
    <p>Loading comments...</p>
  </div>
}
@loading (after 100ms; minimum 300ms) {
  <app-comments-skeleton />
}
@error {
  <p>Could not load comments. <button (click)="retry()">Retry</button></p>
}
```

---

### Rich text editor (load on interaction)

```html
<!-- blog-editor.component.html -->
@defer (on interaction; prefetch on hover) {
  <app-rich-editor [(content)]="postContent" />
}
@placeholder {
  <div class="editor-placeholder" tabindex="0">
    <p>Click here to start writing...</p>
  </div>
}
@loading {
  <div class="editor-loading">Loading editor...</div>
}
```

---

### Admin panel (load when user is admin)

```typescript
isAdmin = inject(AuthService).isAdmin; // computed signal
```

```html
@defer (when isAdmin()) {
  <app-admin-controls />
}
```

---

### Dashboard widgets (staggered loading)

```html
<!-- Load each widget separately, not all at once -->
@defer (on idle) {
  <app-revenue-chart />
}

@defer (on viewport) {
  <app-recent-orders />
}

@defer (on viewport) {
  <app-user-activity-map />
}
```

---

## Why this matters for performance

| Without `@defer` | With `@defer` |
|-----------------|--------------|
| Everything bundled in `main.js` | Deferred components in separate chunks |
| All code downloaded on first load | Chunks downloaded only when needed |
| Slow initial load if you have heavy components | Fast initial load |
| Rich editors, charts, maps slow down the home page | They only load when actually used |

**Lighthouse / Core Web Vitals:** `@defer` directly improves:
- **LCP (Largest Contentful Paint)** — main content renders faster because the bundle is smaller
- **TTI (Time to Interactive)** — less JavaScript to parse means faster interactivity
- **FCP (First Contentful Paint)** — same reason

---

## Quick memory line
`@defer` = split component into a separate chunk that downloads only when needed. `@placeholder` = what to show before. `@loading` = while downloading. `prefetch` = download early in background so rendering is instant.

## Common mistakes
- Using `@defer` on a tiny component (the overhead of a new chunk is not worth it for small components)
- Not providing a `@placeholder` — users see a blank space with no indication content is coming
- Using `@defer (on immediate)` — this downloads right away, same as not deferring
- Deferring components that are above the fold and visible immediately
- Forgetting that deferred components must be **standalone** (no NgModule)
