# Components

## What is a component?
A component is the basic building block of an Angular app. It controls one specific part of the screen (UI) and the logic for that part.

## What a component contains

### Template (HTML)
The template is the view/UI that users see.
- Example: HTML with Angular syntax like `{{ userName }}`

### Class (TypeScript)
The class contains the data and logic for the component.
- Example: properties like `userName = 'John'` and methods like `handleClick()`

### Styles (CSS/SCSS)
The styles make the component look good.
- Component styles are scoped (they only affect this component)

### Metadata (`@Component`)
The decorator that tells Angular this is a component.
- Links template, styles, and class together
- Example: `@Component({ selector: 'app-user', templateUrl: './user.component.html' })`

## Why components matter
- Break big UI into small reusable pieces
- Each piece manages its own logic and view
- Easier to test, debug, and maintain

## Quick memory line
Component = UI block + data + logic for that block.

---

## Dynamic Components with `ViewContainerRef`

### What is this?

Normally you use components in templates — you write `<app-modal>` in HTML and Angular renders it. But sometimes you need to create a component **at runtime in TypeScript**, not in HTML — when you don't know ahead of time whether or how many of them you'll need.

`ViewContainerRef` is Angular's way to do exactly that. It represents a **slot in the DOM** where you can programmatically insert components.

---

### Real-world use cases

- **Toast / notification system** — show a notification anywhere on screen when something happens, not tied to a specific template location
- **Modal / dialog** — open a modal from a service call, not by toggling an `*ngIf`
- **Dynamic form builder** — render different field components based on a config array from an API
- **Lazy-loaded panels** — only create a heavy component when the user actually opens a section

---

### How it works — step by step

#### Step 1: Mark a spot in the DOM with `@ViewChild` + a template ref

```html
<!-- parent.component.html -->
<div>
  <h1>Dashboard</h1>

  <!-- This is the slot where dynamic components will be inserted -->
  <ng-container #dynamicSlot></ng-container>
</div>
```

```typescript
import { Component, ViewChild, ViewContainerRef } from '@angular/core';

@Component({ selector: 'app-dashboard', templateUrl: './dashboard.component.html' })
export class DashboardComponent {
  @ViewChild('dynamicSlot', { read: ViewContainerRef })
  slot!: ViewContainerRef;
}
```

`@ViewChild('dynamicSlot', { read: ViewContainerRef })` says: find `#dynamicSlot` in the template and give me a `ViewContainerRef` for that location.

---

#### Step 2: Create the component you want to insert dynamically

```typescript
// notification.component.ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-notification',
  standalone: true,
  template: `<div class="toast">{{ message() }}</div>`
})
export class NotificationComponent {
  message = input<string>('');
}
```

---

#### Step 3: Create and insert it at runtime

```typescript
import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { NotificationComponent } from './notification.component';

@Component({ selector: 'app-dashboard', templateUrl: './dashboard.component.html' })
export class DashboardComponent {
  @ViewChild('dynamicSlot', { read: ViewContainerRef })
  slot!: ViewContainerRef;

  showNotification(msg: string) {
    // Clear any previous component in the slot
    this.slot.clear();

    // Create and insert NotificationComponent into the slot
    const ref = this.slot.createComponent(NotificationComponent);

    // Pass data into it — equivalent to setting @Input()
    ref.setInput('message', msg);

    // Optionally destroy it after 3 seconds
    setTimeout(() => ref.destroy(), 3000);
  }
}
```

`createComponent()` returns a `ComponentRef` — a handle to the live instance. You use it to pass inputs, read the instance's properties, or destroy it later.

---

### What `ComponentRef` gives you

```typescript
const ref = this.slot.createComponent(NotificationComponent);

ref.setInput('message', 'Saved!');   // set an @Input()
ref.instance.message;                // access the component instance directly
ref.changeDetectorRef.detectChanges(); // force an immediate render (if OnPush)
ref.destroy();                       // remove the component from the DOM
```

---

### The toast notification service pattern

A common real-world pattern — a service that creates toast notifications anywhere in the app without any template:

```typescript
// toast.service.ts
import { Injectable, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { ToastComponent } from './toast.component';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {}

  show(message: string) {
    // Create a standalone host element
    const hostEl = document.createElement('div');
    document.body.appendChild(hostEl);

    // Create the component
    const ref = createComponent(ToastComponent, {
      hostElement: hostEl,
      environmentInjector: this.injector
    });

    // Pass the message
    ref.setInput('message', message);

    // Attach to Angular's change detection
    this.appRef.attachView(ref.hostView);

    // Auto-destroy after 3s
    setTimeout(() => {
      this.appRef.detachView(ref.hostView);
      ref.destroy();
      hostEl.remove();
    }, 3000);
  }
}
```

Usage from anywhere in the app:

```typescript
export class ProductComponent {
  private toast = inject(ToastService);

  save() {
    // ... save logic
    this.toast.show('Product saved!');
  }
}
```

No `<app-toast>` in any template. The notification just appears.

---

### `ViewContainerRef` methods you'll use

| Method | What it does |
|---|---|
| `createComponent(ComponentClass)` | Creates and inserts a component, returns `ComponentRef` |
| `clear()` | Removes all dynamically inserted components from this slot |
| `remove(index?)` | Removes a component at a specific index |
| `length` | How many components are currently in this container |

---

### `ViewContainerRef` vs just using `*ngIf`

| | `*ngIf` / template | `ViewContainerRef` |
|---|---|---|
| Component decided at build time | ✅ | ✅ |
| Component decided at runtime | ❌ | ✅ |
| Create from a service (no template) | ❌ | ✅ |
| Create N copies dynamically | Awkward | ✅ |
| Typical use | 90% of cases | Modals, toasts, dynamic forms |

---

### Quick memory line
`ViewContainerRef` = a slot in the DOM where you can insert components from TypeScript at runtime. Use it when you need to create components on the fly — modals, toasts, dynamic forms — rather than declaring them upfront in a template.

---

---

## Content Projection — `ng-content`

### What is content projection?

Normally a component fully owns its template. But sometimes you want to build a **wrapper component** — a card, a modal, a panel — where the *caller* gets to decide what goes inside.

Content projection lets you write `<app-card>some content here</app-card>` and have "some content here" appear inside the component's template at a slot you define with `<ng-content>`.

Without it, the content between a component's tags is simply ignored by Angular.

---

### Basic example — single slot

```typescript
// card.component.ts
@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="card">
      <ng-content></ng-content>   ← whatever the parent puts inside <app-card> appears here
    </div>
  `
})
export class CardComponent {}
```

```html
<!-- parent template -->
<app-card>
  <p>This paragraph is projected into the card.</p>
  <button>Click me</button>
</app-card>
```

**Rendered HTML:**
```html
<div class="card">
  <p>This paragraph is projected into the card.</p>
  <button>Click me</button>
</div>
```

The `<p>` and `<button>` were written in the parent but rendered inside `CardComponent`.

---

### Multi-slot projection — `select`

You can have multiple named slots using the `select` attribute. `select` accepts any CSS selector — an element name, a class, or an attribute.

```typescript
// panel.component.ts
@Component({
  selector: 'app-panel',
  standalone: true,
  template: `
    <div class="panel">
      <header>
        <ng-content select="[slot=header]"></ng-content>
      </header>
      <main>
        <ng-content select="[slot=body]"></ng-content>
      </main>
      <footer>
        <ng-content select="[slot=footer]"></ng-content>
      </footer>
    </div>
  `
})
export class PanelComponent {}
```

```html
<!-- parent template -->
<app-panel>
  <h2 slot="header">My Panel Title</h2>
  <p slot="body">This is the main content.</p>
  <button slot="footer">Close</button>
</app-panel>
```

Each element lands in the matching `<ng-content select>` slot. Angular routes them by selector at render time.

---

### Default (catch-all) slot

If you have a `<ng-content>` with no `select`, it catches everything that didn't match a named slot:

```typescript
template: `
  <div class="card">
    <ng-content select=".card-title"></ng-content>   ← only .card-title elements
    <ng-content></ng-content>                        ← everything else
  </div>
`
```

---

### `ngProjectAs` — project as a different selector

Sometimes your projected content is wrapped in a container that won't match the selector. `ngProjectAs` tells Angular to treat that element as if it were a different selector.

```html
<app-panel>
  <!-- This <ng-container> has no slot attribute, but ngProjectAs makes it match -->
  <ng-container ngProjectAs="[slot=header]">
    <h2>Dynamic Title</h2>
  </ng-container>
</app-panel>
```

---

### Accessing projected content in TypeScript — `@ContentChild` / `@ContentChildren`

Just like `@ViewChild` lets you access elements in your own template, `@ContentChild` lets you access elements that were projected into your component.

```typescript
import { Component, ContentChild, ElementRef, AfterContentInit } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `<div class="card"><ng-content></ng-content></div>`
})
export class CardComponent implements AfterContentInit {
  @ContentChild('cardTitle') titleEl!: ElementRef;

  ngAfterContentInit() {
    // Projected content is available here — NOT in ngOnInit
    console.log(this.titleEl.nativeElement.textContent);
  }
}
```

```html
<app-card>
  <h2 #cardTitle>Hello</h2>
</app-card>
```

Use `@ContentChildren` to get a `QueryList` of multiple projected elements matching a selector.

---

### Lifecycle hooks for projected content

| Hook | When it runs |
|---|---|
| `ngAfterContentInit` | Once, after projected content is first inserted |
| `ngAfterContentChecked` | After every change detection check on the projected content |

Projected content is only available **after** `ngAfterContentInit`. Trying to access `@ContentChild` in `ngOnInit` gives `undefined`.

---

### Content projection vs ViewContainerRef

Both put content inside a component — but they are fundamentally different:

| | `ng-content` | `ViewContainerRef` |
|---|---|---|
| Who provides the content? | The **parent** (caller) passes HTML | **TypeScript code** creates a component |
| Decided at | Template (compile time) | Runtime (code runs) |
| Content type | Any HTML, text, or components | Only Angular components |
| Use case | Wrapper components (cards, panels, modals shell) | Dynamic creation (toasts, dynamic forms) |

```html
<!-- ng-content: parent decides what goes in -->
<app-card>
  <p>I was written by the parent</p>
</app-card>

<!-- ViewContainerRef: TypeScript decides what goes in -->
this.slot.createComponent(NotificationComponent);
```

---

### Real-world patterns

#### Reusable card with title and body slots
```typescript
@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="card">
      <div class="card-header">
        <ng-content select=".card-title"></ng-content>
      </div>
      <div class="card-body">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class CardComponent {}
```

```html
<app-card>
  <h3 class="card-title">User Profile</h3>
  <p>Name: John</p>
  <p>Email: john@example.com</p>
</app-card>
```

#### Modal shell with header/body/footer
```typescript
@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-header"><ng-content select="[modal-header]"></ng-content></div>
        <div class="modal-body"><ng-content select="[modal-body]"></ng-content></div>
        <div class="modal-footer"><ng-content select="[modal-footer]"></ng-content></div>
      </div>
    </div>
  `
})
export class ModalComponent {}
```

```html
<app-modal>
  <h2 modal-header>Confirm Delete</h2>
  <p modal-body>Are you sure you want to delete this item?</p>
  <div modal-footer>
    <button (click)="cancel()">Cancel</button>
    <button (click)="confirm()">Delete</button>
  </div>
</app-modal>
```

---

### Quick memory line
`ng-content` = let the parent decide what goes inside your component. The parent writes the HTML, your component decides where it appears using `<ng-content>` slots. Use `select` for named slots, `@ContentChild` to access projected elements in TypeScript.

---

## Common mistakes
- Making one huge component instead of breaking it into smaller reusable ones
- Putting business logic in component (use services instead)
- Not making components reusable enough
- Forgetting to call `slot.clear()` before creating a new dynamic component — causes duplicates
- Not calling `ref.destroy()` when done — causes memory leaks
- Trying to access `@ViewChild` slot in `ngOnInit` — it's only available in `ngAfterViewInit`
- Trying to access `@ContentChild` in `ngOnInit` — it's only available in `ngAfterContentInit`
- Confusing content projection (`ng-content`) with `ViewContainerRef` — they solve different problems
