# Templating

## What is templating?
Templating is how Angular displays data and connects UI events using HTML + Angular syntax.

## Core template features

### Interpolation `{{ }}`
Interpolation is how we show dynamic data from the component to the template.
- Example: `{{ userName }}` displays the `userName` property from component
- One-way: component → template

### Property Binding `[ ]`
Property binding is binding a value from the component to an element attribute or component input.
- Example: `[disabled]="isLoading"` binds component property to button's disabled attribute
- Example: `[value]="userName"` sets input value from component
- One-way: component → template

### Event Binding `( )`
Event binding is used to capture user events in the browser and handle them in the component.
- Example: `(click)="handleClick()"` calls component method when button is clicked
- Example: `(input)="onInput($event)"` captures input changes
- One-way: template → component

### Two-Way Binding `[( )]`
Two-way binding combines property and event binding to sync data both ways.
- Example: `[(ngModel)]="userName"` - changes in input update component, changes in component update input
- Banana in a box syntax: `[()]`
- Two-way: component ↔ template

#### Is two-way binding still relevant with signals?
**Yes, but with signals you have better alternatives.**

**Old approach (two-way binding):**
```typescript
// Component
username = '';
```
```html
<!-- Template -->
<input [(ngModel)]="username">
```

**Modern approach (signals):**
```typescript
// Component
import { signal } from '@angular/core';
username = signal('');
```
```html
<!-- Template -->
<input [value]="username()" (input)="username.set($event.target.value)">
<!-- Or use model() for two-way -->
<input [(ngModel)]="username()">
```

**New best approach (Angular 19+ — `model()` is fully stable):**
```typescript
// Component
import { model } from '@angular/core';
username = model('');  // Two-way signal!
```
```html
<!-- Template -->
<input [(ngModel)]="username">
```

**Summary:**
- `[(ngModel)]` still works and is fine for forms
- Signals give you better reactivity and computed values
- `model()` combines signals with two-way binding (best of both)
- Use signals for component state, `[(ngModel)]` for simple form inputs

### Control Flow (Modern Syntax)
Control flow syntax controls what elements appear in the DOM.

#### @if (conditional rendering)
```html
@if (isLoggedIn) {
  <p>Welcome back!</p>
} @else {
  <p>Please log in</p>
}
```

#### @for (loops)
```html
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <p>No items found</p>
}
```

#### @switch (multiple conditions)
```html
@switch (status) {
  @case ('active') { <span>Active</span> }
  @case ('inactive') { <span>Inactive</span> }
  @default { <span>Unknown</span> }
}
```

#### Old syntax (still works but avoid in new code)
- `*ngIf="condition"` → use `@if` instead
- `*ngFor="let item of items"` → use `@for` instead
- `*ngSwitch` → use `@switch` instead

### Quick comparison: Old vs New

| Old (before v17) | New (v17+) |
|------------------|------------|
| `<div *ngIf="show">Hi</div>` | `@if (show) { <div>Hi</div> }` |
| `<div *ngFor="let x of items">{{x}}</div>` | `@for (x of items; track x.id) { <div>{{x}}</div> }` |
| `<div [ngSwitch]="status">` | `@switch (status) { }` |

**Why the new syntax is better:**
- No need to import `CommonModule` for control flow
- Cleaner, more readable
- Better TypeScript support
- `track` is built-in (better performance)

### Angular 21 template enhancements

**Arrow functions in templates (Angular 21.2+)**

You can now use arrow functions directly inside template expressions:

```html
<!-- Filter inline without a component method -->
@for (user of users().filter(u => u.active); track user.id) {
  <span>{{ user.name }}</span>
}

<!-- Inline transform -->
{{ items().map(i => i.label).join(', ') }}
```

**`instanceof` in templates (Angular 21.2+)**

```html
@if (value instanceof MyClass) {
  <!-- value is narrowed to MyClass here -->
  <app-my-thing [item]="value" />
}
```

**Exhaustive `@switch` type checking (Angular 21.2+)**

The compiler now validates that `@switch` blocks cover all possible values when switching on a union type, catching unhandled cases at build time.

## Why it matters
- Keeps UI dynamic and connected to component data
- Captures user actions and sends them to component logic
- Makes the app interactive and responsive

## Quick memory line
Template = HTML that displays component data and sends user events back to component.

## Common mistakes
- Putting complex logic directly in template (keep templates clean, logic in component)
- Confusing `[]` (property binding) with `()` (event binding)
- Forgetting to import `FormsModule` when using `[(ngModel)]`
- Using old `*ngIf`, `*ngFor` syntax in new projects (use `@if`, `@for` instead)
- Forgetting `track` in `@for` loops (required for performance)
