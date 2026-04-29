# Angular Code Conventions

A personal reference for naming, structure, and style decisions in Angular projects.

---

## Output (Event Emitter) Naming

### The debate

You have two common patterns in the wild:

```html
<!-- Pattern A — name describes the emitter mechanism -->
<app-listing [car]="carItem" [carIndex]="$index" (saveCarEmitter)="saveCar($event)" />

<!-- Pattern B — name describes the event that happened -->
<app-listing [car]="carItem" [carIndex]="$index" (carSaved)="addCarToSaved($event)" />
```

### Your take (and why it is understandable)

You prefer **Pattern A** (`saveCarEmitter`) because:
- The `Emitter` suffix makes it obvious at a glance that this is an event binding, not an input
- The handler name `saveCar` then cleanly says what it *does*
- Clear separation: "this thing emits" vs "this thing handles"

That instinct is valid — **clarity at the call site** is a real concern.

### The Angular community / style guide take

The Angular style guide and the broader community convention land on **Pattern B** — and here is the reasoning:

**1. Outputs describe events, not mechanisms.**  
Angular's own built-in events follow this: `(click)`, `(keyup)`, `(valueChange)`, `(selectionChange)` — not `clickEmitter` or `keyupOutputEmitter`. They all describe *what happened*, not *how it is wired*.

**2. The template syntax `( )` already tells you it is an event.**  
When you write `(carSaved)`, the parentheses `()` are the visual signal that this is an output/event. Adding `Emitter` is redundant — the syntax communicates it.

**3. The component class surface reads more naturally.**  
```typescript
// Pattern B — reads like "car was saved"
carSaved = output<Car>();

// Pattern A — reads like an implementation detail, not a domain event
saveCarEmitter = output<Car>();
```

**4. Past tense names (`carSaved`, `formSubmitted`, `userDeleted`) are the cleanest.**  
They express domain facts: "a car was saved", "a form was submitted". They are not tied to what the parent does with the data.

### The verdict (opinionated)

| Decision | Preferred | Reason |
|---|---|---|
| Output naming | `carSaved` (past-tense event name) | Matches Angular's own API, `()` already signals it's an event |
| Handler naming | `onCarSaved` or `addCarToSaved` | Handler name describes *what the parent does*, independent of the child |
| Avoid | `saveCarEmitter`, `carOutputEmitter` | Redundant with `()` syntax, leaks implementation detail |

**Best practice template:**
```html
<app-listing
  [car]="carItem"
  [carIndex]="$index"
  (carSaved)="onCarSaved($event)"
/>
```

```typescript
// Child — output describes the event
carSaved = output<Car>();

// Parent — handler describes parent's reaction
onCarSaved(car: Car): void {
  this.savedCars.push(car);
}
```

> **Note on your preference:** There is nothing *wrong* with `saveCarEmitter` for a personal/team project if your team agrees on it. Conventions only matter for consistency. But if you ever open-source a library or work in a team that follows the Angular style guide, Pattern B will be expected.

---

## Input Naming

### Rules
- Use **noun** names: `car`, `userId`, `products`, `isDisabled`
- Avoid action/verb names for inputs: `loadCar`, `fetchUser` — those sound like methods, not data
- Required inputs vs optional: naming is the same, but document with a comment if needed

```typescript
// Good
product = input.required<Product>();
isExpanded = input(false);
maxItems = input<number>(10);

// Bad — sounds like a method
loadProduct = input.required<Product>();
```

---

## Component Selector Naming

### Rule
Always prefix selectors with your app or feature prefix. Default is `app-`.

```typescript
// Good
selector: 'app-user-card'
selector: 'app-product-list'

// Bad — no prefix, collides with HTML elements or other libraries
selector: 'user-card'
selector: 'list'
```

---

## File and Class Naming

| Thing | File name | Class name |
|---|---|---|
| Component | `user-card.component.ts` | `UserCardComponent` |
| Service | `auth.service.ts` | `AuthService` |
| Guard | `auth.guard.ts` | `authGuard` (functional) |
| Pipe | `truncate.pipe.ts` | `TruncatePipe` |
| Directive | `highlight.directive.ts` | `HighlightDirective` |
| Routes file | `app.routes.ts` | `routes` (const) |

---

## Method Naming

| Action | Preferred name pattern | Example |
|---|---|---|
| Handle a DOM event | `on` + event | `onClick()`, `onKeyUp()` |
| Handle a child output | `on` + event name | `onCarSaved()`, `onFormSubmit()` |
| Fetch data | `load` + noun | `loadUsers()`, `loadCarDetails()` |
| Compute/derive | verb + noun | `buildUrl()`, `formatPrice()` |
| Toggle state | `toggle` + noun | `toggleMenu()`, `toggleExpanded()` |

---

## Signal Naming

```typescript
// State signals — noun (describes the data)
readonly cars = signal<Car[]>([]);
readonly isLoading = signal(false);
readonly selectedCar = signal<Car | null>(null);

// Computed signals — noun or noun phrase (describes the derived value)
readonly totalPrice = computed(() => this.cars().reduce(...));
readonly hasSelection = computed(() => this.selectedCar() !== null);
```

---

## Template Conventions

### Class bindings — not `ngClass`

```html
<!-- ✅ Modern — direct class binding -->
<div [class.active]="isActive()" [class.disabled]="isDisabled()">

<!-- ❌ Old — avoid ngClass -->
<div [ngClass]="{ active: isActive(), disabled: isDisabled() }">
```

### Style bindings — not `ngStyle`

```html
<!-- ✅ Modern -->
<div [style.color]="brandColor()">

<!-- ❌ Old -->
<div [ngStyle]="{ color: brandColor() }">
```

### Control flow — not structural directives

```html
<!-- ✅ Modern control flow -->
@if (isLoggedIn()) { <app-dashboard /> }
@for (car of cars(); track car.id) { <app-car-card [car]="car" /> }

<!-- ❌ Old structural directives (still work but avoid in new code) -->
<app-dashboard *ngIf="isLoggedIn" />
<app-car-card *ngFor="let car of cars" [car]="car" />
```

---

## Quick memory lines

- Output names = **past-tense events** (`carSaved`), not mechanism names (`saveCarEmitter`)
- `()` in template already signals it is an event — no need for `Emitter` suffix
- Method handlers use `on` prefix: `onCarSaved()`, `onClick()`
- Signal state = noun; computed = noun phrase
