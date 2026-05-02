# Shadow DOM in Angular

## What is Shadow DOM?
Shadow DOM is a browser feature that lets an element have its own hidden, isolated piece of the DOM tree. CSS and HTML inside a Shadow DOM don't leak out to the rest of the page, and styles from outside don't leak in.

Think of it like a component with its own private room — what happens inside stays inside.

---

## Why does Angular use it?
Angular uses Shadow DOM (or a simulation of it) to give each component its own **style encapsulation**. This means the CSS you write for one component doesn't accidentally affect another component.

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

`:host` is a special CSS selector that targets the component's own element — the outer tag.

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
```

This works in both `Emulated` and `ShadowDom` modes.

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

---

## Quick comparison table

| Mode | Real Shadow DOM? | Global styles leak in? | Component styles leak out? |
|------|-----------------|----------------------|---------------------------|
| `Emulated` (default) | No | Yes | No |
| `ShadowDom` | Yes | No | No |
| `None` | No | Yes | Yes |

---

## Why it matters
- Prevents CSS collisions between components — no more "why is this style broken?"
- Makes components truly portable — drop one anywhere without worrying about global styles
- Understanding Shadow DOM helps you debug styling issues with third-party component libraries

---

## Quick memory line
Shadow DOM = a component's own private DOM + CSS bubble. `Emulated` fakes it. `ShadowDom` uses the real thing. `None` turns it off.

---

## Common mistakes
- Expecting global styles from `styles.css` to work inside a `ShadowDom` component — they won't, use CSS variables instead
- Overusing `::ng-deep` to fix a styling problem instead of understanding encapsulation
- Forgetting that `Emulated` is the default — you don't need to set it manually
- Confusing Shadow DOM with `*ngContent` / content projection (they're different concepts)
