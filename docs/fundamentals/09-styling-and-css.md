# Styling and CSS Concepts

## CSS vs SCSS vs Sass (Preprocessors)

### What is a CSS Preprocessor?
A CSS preprocessor is a tool that extends CSS with extra features, then compiles it to regular CSS.

### Regular CSS
```css
.button {
  background: blue;
  color: white;
}
```

### SCSS (Sassy CSS)
SCSS adds features like variables, nesting, functions.
```scss
$primary-color: blue;

.button {
  background: $primary-color;
  color: white;
  
  &:hover {
    background: darken($primary-color, 10%);
  }
}
```

### Sass (indented syntax)
Sass is older syntax without braces and semicolons.
```sass
$primary-color: blue

.button
  background: $primary-color
  color: white
  
  &:hover
    background: darken($primary-color, 10%)
```

### Key differences

| Feature | CSS | SCSS | Sass |
|---------|-----|------|------|
| Syntax | Standard | CSS + extras | Indented |
| Variables | `--var` | `$var` | `$var` |
| Nesting | Limited | Yes | Yes |
| Functions | No | Yes | Yes |
| Mixins | No | Yes | Yes |
| File extension | `.css` | `.scss` | `.sass` |

### Which to use?
- **SCSS** is most popular (looks like CSS, easy to learn)
- **Sass** is less common (fewer people use indented syntax)
- **CSS** is native (modern CSS has variables now)

### Quick memory line
SCSS = CSS with superpowers (variables, nesting, functions).

---

## CSS Encapsulation in Angular

### What is CSS encapsulation?
CSS encapsulation is how Angular keeps component styles isolated so they don't leak to other components.

### The problem without encapsulation
```css
/* In UserComponent */
.title {
  color: red;
}

/* This would affect ALL .title elements in the entire app! */
```

### How Angular solves it
Angular adds unique attributes to elements and CSS selectors.

#### Your code
```typescript
@Component({
  selector: 'app-user',
  template: '<h1 class="title">Hello</h1>',
  styles: ['.title { color: red; }']
})
```

#### What Angular generates
```html
<!-- HTML gets unique attribute -->
<h1 class="title" _ngcontent-abc-123>Hello</h1>
```

```css
/* CSS gets unique attribute selector */
.title[_ngcontent-abc-123] { color: red; }
```

Now `.title` only affects elements inside `app-user` component!

### Encapsulation modes

#### 1. Emulated (default)
```typescript
@Component({
  encapsulation: ViewEncapsulation.Emulated  // default
})
```
- Adds unique attributes to scope styles
- Most common and recommended

#### 2. None
```typescript
@Component({
  encapsulation: ViewEncapsulation.None
})
```
- No encapsulation (styles are global)
- Use for global styles or third-party components

#### 3. ShadowDom
```typescript
@Component({
  encapsulation: ViewEncapsulation.ShadowDom
})
```
- Uses browser's Shadow DOM API
- True isolation (strongest but has compatibility issues)

### How to affect global styles from component

#### Option 1: Use `::ng-deep` (deprecated but works)
```scss
::ng-deep .global-class {
  color: red;
}
```

#### Option 2: Put styles in global styles.css
```css
/* src/styles.css */
.global-class {
  color: red;
}
```

#### Option 3: Use :host-context
```scss
:host-context(.theme-dark) {
  background: black;
}
```

### Quick memory line
CSS encapsulation = Angular's way to keep component styles isolated using unique attributes.

---

## What is :host in CSS?

### What is it?
`:host` is used to style the **component element itself** — the tag that wraps your entire component in the parent's HTML.

### The host element
When you write `<app-user></app-user>`, that `<app-user>` tag is the **host element**. It exists in the parent's DOM, not inside your component.

### The mental model

This is the most important thing to understand:

| What you want to style | How to target it |
|---|---|
| Elements **inside** the component | Normal selectors: `.title`, `p`, `.container` |
| The **component tag itself** (`<app-user>`) | `:host` |

You style **inside** the component 95% of the time. `:host` is for the rare but important cases where the **wrapper tag itself** needs styling.

### Why does :host even come into play?

The reason `:host` matters is a browser default: **custom HTML elements are `display: inline` by default**.

This means `<app-user>` behaves like a `<span>` — not a `<div>`. If you put a component inside a flex or grid container expecting it to stretch and fill, it won't behave the way you expect.

**The fix** — and the #1 real-world use of `:host`:
```scss
:host {
  display: block;  // make the component behave like a block element
}
```

Without this, your component layout can break in unexpected ways when used inside flex or grid containers.

### Common :host use cases

#### 1. Set the display type (most common)
```scss
:host {
  display: block;
}
```

#### 2. Make the component fill its parent
```scss
:host {
  display: block;
  width: 100%;
  height: 100%;
}
```

Useful when a component is inside a flex container and should stretch to fill available space.

#### 3. Style the component as a card or widget
```scss
:host {
  display: block;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
}
```

The border and card shape live on the wrapper tag, not on an inner element.

### Without :host
```scss
// This styles elements INSIDE the component
.container {
  padding: 20px;
}
```

### With :host
```scss
// This styles the <app-user> element itself
:host {
  display: block;
  border: 1px solid black;
  padding: 10px;
}
```

### :host variants

#### :host with class (conditional theming)
```scss
:host(.active) {
  background: yellow;
}
```
Applied when the parent adds a class from outside: `<app-user class="active"></app-user>`

This lets the parent control the component's appearance by adding a class to the tag.

#### :host-context
```scss
:host-context(.theme-dark) {
  background: black;
  color: white;
}
```
Applied when component is inside an element with `.theme-dark` class.

### Quick memory line
`:host` = style the component wrapper tag itself, not elements inside it. Use it when the tag's own layout or appearance needs to be set.

---

## Common mistakes
- Using Sass syntax instead of SCSS (most projects use SCSS)
- Using `ViewEncapsulation.None` for everything (breaks encapsulation)
- Overusing `::ng-deep` (it's deprecated, use global styles instead)
- Not understanding `:host` targets the component wrapper, not inner elements
- Forgetting that component styles are scoped by default
