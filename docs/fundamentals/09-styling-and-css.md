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
`:host` is an **Angular thing** (part of Shadow DOM spec) that targets the component's host element itself.

### The host element
When you use `<app-user></app-user>`, the `<app-user>` tag is the **host element**.

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

### Generated HTML
```html
<app-user style="display: block; border: 1px solid black; padding: 10px;">
  <!-- component content here -->
</app-user>
```

### :host variants

#### :host with class
```scss
:host(.active) {
  background: yellow;
}
```
Applied when: `<app-user class="active"></app-user>`

#### :host-context
```scss
:host-context(.theme-dark) {
  background: black;
  color: white;
}
```
Applied when component is inside an element with `.theme-dark` class.

### Quick memory line
`:host` = styles the component's wrapper element itself (the tag name).

---

## Common mistakes
- Using Sass syntax instead of SCSS (most projects use SCSS)
- Using `ViewEncapsulation.None` for everything (breaks encapsulation)
- Overusing `::ng-deep` (it's deprecated, use global styles instead)
- Not understanding `:host` targets the component wrapper, not inner elements
- Forgetting that component styles are scoped by default
