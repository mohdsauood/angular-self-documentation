# Shadow DOM in Angular

## What is Shadow DOM?
Shadow DOM is a browser feature that lets an element have its own hidden, isolated piece of the DOM tree. CSS and HTML inside a Shadow DOM don't leak out to the rest of the page, and styles from outside don't leak in.

Think of it like a component with its own private room — what happens inside stays inside.

---

## The anatomy of Shadow DOM

Before diving into Angular, it helps to understand the four things the browser actually creates when Shadow DOM is used.

### Shadow Host
The **shadow host** is the regular DOM element that owns the shadow tree. It's the element you can see in the normal DOM. In Angular terms, it's your component's selector tag, e.g. `<app-card>`.

### Shadow Root
The **shadow root** is the entry point to the shadow tree. It's not a visible element — it's more like a container the browser creates when you call `attachShadow()`. Everything inside the shadow tree hangs off this root.

### Shadow Tree
The **shadow tree** is all the HTML nodes (elements, text, etc.) that live inside the shadow root. This is the private DOM that the browser renders but keeps isolated.

### Light DOM
The **light DOM** is the regular, public DOM — the content your users or parent components put *inside* your component's tag. Example:

```html
<!-- light DOM — this is the public content passed into the component -->
<app-card>
  <p>This is light DOM content</p>
</app-card>
```

The shadow tree and the light DOM are two separate trees. The browser **merges** them visually during rendering (called *flattening*) but keeps them separate internally.

---

## How the browser builds a Shadow DOM — step by step

This is what actually happens under the hood (not Angular-specific — this is raw browser behaviour):

1. You pick a regular element as the host: `<app-card>`
2. You call `element.attachShadow({ mode: 'open' })` — this creates the shadow root
3. You add HTML into the shadow root using `.innerHTML` or `.appendChild()`
4. The browser renders the shadow tree in place of the element's normal content
5. CSS inside the shadow root is scoped there — it can't escape; global CSS can't enter

Angular does step 2 automatically when you set `encapsulation: ViewEncapsulation.ShadowDom`.

---

## Open vs closed shadow root

When you (or Angular) calls `attachShadow()`, you must choose a **mode**: `open` or `closed`.

### `open` mode
The shadow root is accessible from JavaScript outside the shadow tree.

```javascript
const host = document.querySelector('app-card');
const shadowRoot = host.shadowRoot; // ✅ this works — returns the shadow root
```

Angular's `ViewEncapsulation.ShadowDom` uses `open` mode. This means Angular itself (and DevTools) can still access and manipulate the shadow root.

### `closed` mode
The shadow root is completely hidden from outside JavaScript. `element.shadowRoot` returns `null`.

```javascript
const host = document.querySelector('app-card');
const shadowRoot = host.shadowRoot; // ❌ returns null — no access
```

**In practice:** Angular does not support `closed` mode directly. `closed` mode is mostly used for native browser built-in elements (like `<input>`, `<video>`) to protect their internal structure. You almost never need it in Angular apps.

---

## Light DOM vs Shadow DOM — side by side

| | Light DOM | Shadow DOM |
|---|---|---|
| What it is | The public content passed into the host element | The private template inside the host element |
| Who writes it | The parent component | The component itself |
| Visible in DevTools? | Yes, always | Yes if mode is `open` |
| Affected by global CSS? | Yes | No |
| Example in Angular | Content passed via `<ng-content>` | Everything in the component template |

---

## Slots — how native Shadow DOM handles projected content

In raw browser Shadow DOM (without Angular), you use `<slot>` to define where light DOM content goes inside the shadow tree.

```html
<!-- shadow tree template -->
<div class="card-wrapper">
  <slot></slot>  <!-- light DOM content gets placed here -->
</div>
```

```html
<!-- parent using the component -->
<my-card>
  <p>This paragraph is light DOM — it appears where the slot is</p>
</my-card>
```

You can also have **named slots** for multiple injection points:

```html
<!-- shadow tree -->
<div class="card">
  <header><slot name="header"></slot></header>
  <main><slot></slot></main>
  <footer><slot name="footer"></slot></footer>
</div>

<!-- parent -->
<my-card>
  <h2 slot="header">Card Title</h2>
  <p>Main body content</p>
  <small slot="footer">Footer note</small>
</my-card>
```

### How Angular does the same thing: `ng-content`
Angular doesn't use native `<slot>` — it uses `<ng-content>` instead. In `Emulated` mode, Angular simulates slotting by moving the projected nodes during compilation. In `ShadowDom` mode, Angular does use real `<slot>` under the hood.

```html
<!-- Angular component template -->
<div class="card-wrapper">
  <ng-content></ng-content>
</div>

<!-- named slots in Angular -->
<ng-content select="[card-header]"></ng-content>
<ng-content select="[card-body]"></ng-content>
```

```html
<!-- parent using the Angular component -->
<app-card>
  <h2 card-header>Title</h2>
  <p card-body>Body text</p>
</app-card>
```

---

## Event retargeting

This is one of the less-obvious things Shadow DOM does. When an event fires inside a shadow tree, the browser **retargets** it — it changes `event.target` to be the shadow host, not the actual element that was clicked.

Why? Because the shadow tree is supposed to be an implementation detail. The outside world shouldn't know which specific internal element fired the event.

```javascript
document.addEventListener('click', (event) => {
  // if the click happened inside a shadow DOM component...
  console.log(event.target); // logs <app-card> (the host), NOT the inner <button>
});
```

Inside the shadow tree itself, `event.target` is the real element that was clicked.

**In Angular:** You usually don't feel this because Angular's event binding `(click)="..."` handles events inside the component's own template, where retargeting hasn't happened yet. But if you ever listen to events at the `document` level and wonder why `event.target` is the component tag instead of the button you clicked — this is why.

---

## The three View Encapsulation modes

Angular gives you three ways to control how styles are scoped. You set this with `encapsulation` in the `@Component` decorator.

### 1. `Emulated` (default)
Angular doesn't use real Shadow DOM. Instead, it adds unique attribute selectors to your HTML and CSS so styles are scoped to that component.

```typescript
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-card',
  encapsulation: ViewEncapsulation.Emulated, // default — you don't need to write this
  template: `<p class="title">Hello</p>`,
  styles: [`
    .title { color: blue; }
  `]
})
export class CardComponent {}
```

Angular transforms the CSS to something like:
```css
.title[_ngcontent-abc-c1] { color: blue; }
```

And adds the attribute to the element:
```html
<p class="title" _ngcontent-abc-c1>Hello</p>
```

**Result:** The `.title` style only applies inside `CardComponent`, not anywhere else on the page.

---

### 2. `ShadowDom`
Angular uses the real browser Shadow DOM API. The component's template is attached to a shadow root. This is the strictest isolation.

```typescript
@Component({
  selector: 'app-card',
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `<p class="title">Hello</p>`,
  styles: [`
    .title { color: blue; }
  `]
})
export class CardComponent {}
```

**Result:** Styles are completely isolated. Global styles from `styles.css` also won't reach inside this component unless you use CSS custom properties (variables).

**Use this when:** you're building a web component or a truly reusable widget that must never be affected by outside CSS.

---

### 3. `None`
No encapsulation at all. Your component's styles are added as global CSS. They can affect every element on the page.

```typescript
@Component({
  selector: 'app-card',
  encapsulation: ViewEncapsulation.None,
  template: `<p class="title">Hello</p>`,
  styles: [`
    .title { color: blue; }
  `]
})
export class CardComponent {}
```

**Result:** `.title { color: blue }` applies to every `.title` element in the whole app.

**Use this when:** you're building global reusable styles (like a base layout component) and you intentionally want styles to bleed out.

---

## The `:host` selector

`:host` is a special CSS selector that targets the component's own element — the outer tag (the shadow host).

```css
/* targets <app-card> itself */
:host {
  display: block;
  border: 1px solid #ccc;
}

/* only when the component has class "active" */
:host(.active) {
  border-color: blue;
}

/* when the host is inside a specific parent */
:host-context(.dark-theme) {
  background: #333;
  color: white;
}
```

This works in both `Emulated` and `ShadowDom` modes.

### Why `:host` exists
In native Shadow DOM, CSS inside the shadow tree can't see the host element with a normal selector. `:host` is the only way to style the element that owns the shadow tree from inside. Angular carries this concept over — even in `Emulated` mode — because it matches how real Shadow DOM works.

---

## Styling across the shadow boundary — CSS custom properties

The only clean, standards-compliant way to pass styles into a `ShadowDom` component from outside is using **CSS custom properties** (also called CSS variables). They cross the shadow boundary.

```css
/* global styles.css — sets the variable */
app-card {
  --card-title-color: navy;
  --card-border-radius: 8px;
}
```

```css
/* inside the component's styles — consumes the variable */
:host {
  border-radius: var(--card-border-radius, 4px); /* 4px is the fallback */
}

.title {
  color: var(--card-title-color, black);
}
```

This is how design tokens work in component libraries like Angular Material. The component controls its internal layout but lets the outside world theme it via variables.

---

## The `::ng-deep` selector (use with caution)

`::ng-deep` forces a style to pierce through Angular's encapsulation and reach child components.

```css
/* styles the .mat-button inside a child component */
::ng-deep .mat-button {
  color: red;
}
```

⚠️ This is considered bad practice because it breaks encapsulation. Prefer using CSS custom properties or a `None`-encapsulated wrapper instead.

**Why it was added:** It existed to override third-party library styles that you can't control. But the CSS spec deprecated the `/deep/` combinator it's based on. Angular may remove `::ng-deep` support in a future major version.

**Better alternatives:**
- Use CSS custom properties the library exposes
- Wrap in a `ViewEncapsulation.None` component and target the class globally
- Use the library's official theming API (e.g. Angular Material themes)

---

## How to inspect Shadow DOM in Chrome DevTools

When `ViewEncapsulation.ShadowDom` is used, the browser hides the internal DOM behind a `#shadow-root` node in DevTools.

Steps:
1. Open Chrome DevTools → **Elements** tab
2. Find your component's tag, e.g. `<app-card>`
3. Click the `▶ #shadow-root (open)` node to expand it
4. You'll see the component's internal HTML
5. In the **Styles** panel, styles scoped to the shadow root show their origin as the component file

If you don't see `#shadow-root`, the component is using `Emulated` mode — Angular's scoping attributes (`_ngcontent-xxx`) are how you identify those components instead.

---

## Quick comparison table

| Mode | Real Shadow DOM? | Global styles leak in? | Component styles leak out? | CSS variables work? |
|------|-----------------|----------------------|---------------------------|---------------------|
| `Emulated` (default) | No | Yes | No | Yes |
| `ShadowDom` | Yes | No | No | Yes ✅ |
| `None` | No | Yes | Yes | Yes |

---

## When to actually use `ViewEncapsulation.ShadowDom` in Angular

Most Angular apps never need it. Use it when:

- You are building a **design system** or component library that ships to multiple teams and must survive any host app's global CSS
- You are building Angular **web components** (using `@angular/elements`) that will be embedded into non-Angular pages
- A third-party global stylesheet keeps overriding your component's styles and you can't control the global CSS

Stick with the default `Emulated` for most everyday components.

---

## Why it matters
- Prevents CSS collisions between components — no more "why is this style broken?"
- Makes components truly portable — drop one anywhere without worrying about global styles
- Understanding Shadow DOM helps you debug styling issues with third-party component libraries
- Knowing the anatomy (host, root, tree, light DOM) helps you read browser DevTools and spec docs

---

## Quick memory line
Shadow DOM = a private DOM + CSS bubble attached to an element. The host is the element. The shadow root is the entry gate. The shadow tree is what's inside. Light DOM is the public content passed in. `Emulated` fakes it. `ShadowDom` uses the real thing. `None` turns it off.

---

## Common mistakes
- Expecting global styles from `styles.css` to work inside a `ShadowDom` component — they won't, use CSS variables instead
- Overusing `::ng-deep` to fix a styling problem instead of understanding encapsulation
- Forgetting that `Emulated` is the default — you don't need to set it manually
- Confusing Shadow DOM with `ng-content` / content projection — they're related but different (`ng-content` is how you project light DOM content; Shadow DOM is the isolation mechanism)
- Assuming `event.target` always points to the element clicked — inside shadow DOM the browser retargets events to the host
- Using `closed` mode and then being surprised that Angular can't access the shadow root
