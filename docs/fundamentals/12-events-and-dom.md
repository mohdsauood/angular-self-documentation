# Events and DOM


## Table of Contents

- [How trackBy Works in *ngFor](#how-trackby-works-in-ngfor)
  - [The performance problem](#the-performance-problem)
  - [With trackBy](#with-trackby)
  - [How it works under the hood](#how-it-works-under-the-hood)
  - [When to use trackBy](#when-to-use-trackby)
  - [Quick memory line](#quick-memory-line)
- [Event Emitter in Vanilla JavaScript](#event-emitter-in-vanilla-javascript)
  - [What is EventEmitter?](#what-is-eventemitter)
  - [In vanilla JavaScript (custom implementation)](#in-vanilla-javascript-custom-implementation)
  - [Usage](#usage)
  - [In Angular (built-in EventEmitter)](#in-angular-built-in-eventemitter)
  - [How it works under the hood](#how-it-works-under-the-hood-1)
  - [Quick memory line](#quick-memory-line-1)
- [All Types of HTML Events](#all-types-of-html-events)
  - [Mouse Events](#mouse-events)
  - [Keyboard Events](#keyboard-events)
  - [Form Events](#form-events)
  - [Touch Events (Mobile)](#touch-events-mobile)
  - [Window Events](#window-events)
  - [Drag Events](#drag-events)
  - [Media Events](#media-events)
  - [Clipboard Events](#clipboard-events)
  - [Angular event binding examples](#angular-event-binding-examples)
  - [Event object](#event-object)
  - [Quick memory line](#quick-memory-line-2)
- [ElementRef and Renderer2 — When @HostBinding Is Not Enough](#elementref-and-renderer2-when-hostbinding-is-not-enough)
  - [Start here: @HostBinding / @HostListener are the right default](#start-here-hostbinding-hostlistener-are-the-right-default)
  - [The 5 cases where @HostBinding can't help you](#the-5-cases-where-hostbinding-cant-help-you)
  - [Summary: what each tool is for](#summary-what-each-tool-is-for)
  - [What ElementRef actually is](#what-elementref-actually-is)
  - [What Renderer2 actually is](#what-renderer2-actually-is)
  - [Why directly using nativeElement is dangerous — the full picture](#why-directly-using-nativeelement-is-dangerous-the-full-picture)
  - [How to inject both](#how-to-inject-both)
  - [Common Renderer2 methods](#common-renderer2-methods)
  - [Quick memory line](#quick-memory-line-3)
- [Common mistakes](#common-mistakes)

## How trackBy Works in *ngFor

### The performance problem
When you use `*ngFor`, Angular re-renders the entire list when data changes.

#### Without trackBy
```typescript
items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
];

// Template
<div *ngFor="let item of items">{{ item.name }}</div>
```

If you update `items` array:
```typescript
this.items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' }  // Added new item
];
```

Angular destroys ALL DOM elements and recreates them (slow!).

### With trackBy
```typescript
items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
];

trackById(index: number, item: any) {
  return item.id;  // Unique identifier
}
```

```html
<div *ngFor="let item of items; trackBy: trackById">{{ item.name }}</div>
```

Now Angular only creates the DOM element for the new item (fast!).

### How it works under the hood

#### Step 1: Initial render
Angular calls `trackById` for each item and remembers the IDs.
```
Item 1 → tracked by ID 1
Item 2 → tracked by ID 2
```

#### Step 2: Data changes
You add item 3.

#### Step 3: Angular checks
Angular calls `trackById` on new array:
```
Item 1 → ID 1 (exists, keep existing DOM)
Item 2 → ID 2 (exists, keep existing DOM)
Item 3 → ID 3 (new, create new DOM element)
```

#### Result
Only item 3's DOM is created. Items 1 and 2 are reused!

### When to use trackBy

✅ Use trackBy when:
- Large lists (100+ items)
- List data changes frequently
- Performance is important

❌ Don't need trackBy for:
- Small lists (< 20 items)
- Static lists that never change

### Quick memory line
trackBy = tells Angular how to identify items so it reuses DOM instead of recreating everything.

---

## Event Emitter in Vanilla JavaScript

### What is EventEmitter?
EventEmitter is a pattern where an object can trigger events and other objects can listen to them.

### In vanilla JavaScript (custom implementation)
```javascript
class EventEmitter {
  constructor() {
    this.events = {};  // Store listeners
  }

  // Subscribe to event
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  // Trigger event
  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => {
        callback(data);
      });
    }
  }

  // Unsubscribe
  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  }
}
```

### Usage
```javascript
const emitter = new EventEmitter();

// Listen to event
emitter.on('userLoggedIn', (user) => {
  console.log('User logged in:', user);
});

// Trigger event
emitter.emit('userLoggedIn', { name: 'John' });
// Output: User logged in: { name: 'John' }
```

### In Angular (built-in EventEmitter)
```typescript
import { EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-child'
})
export class ChildComponent {
  @Output() userClicked = new EventEmitter<string>();

  onClick() {
    this.userClicked.emit('John');  // Send data to parent
  }
}
```

```html
<!-- Parent component -->
<app-child (userClicked)="handleUser($event)"></app-child>
```

### How it works under the hood
1. Child creates `EventEmitter`
2. Child calls `emit('data')`
3. EventEmitter triggers all subscribed callbacks
4. Parent's callback receives the data

### Quick memory line
EventEmitter = object that can trigger events and notify listeners.

---

## All Types of HTML Events

### Mouse Events
Events triggered by mouse actions.

| Event | When it fires |
|-------|---------------|
| `click` | Mouse button clicked |
| `dblclick` | Double-clicked |
| `mousedown` | Mouse button pressed down |
| `mouseup` | Mouse button released |
| `mousemove` | Mouse moves over element |
| `mouseenter` | Mouse enters element |
| `mouseleave` | Mouse leaves element |
| `mouseover` | Mouse over element (bubbles) |
| `mouseout` | Mouse leaves element (bubbles) |
| `contextmenu` | Right-click |

### Keyboard Events
Events triggered by keyboard.

| Event | When it fires |
|-------|---------------|
| `keydown` | Key is pressed down |
| `keyup` | Key is released |
| `keypress` | Key is pressed (deprecated) |

### Form Events
Events from form inputs.

| Event | When it fires |
|-------|---------------|
| `submit` | Form is submitted |
| `input` | Input value changes |
| `change` | Input loses focus after change |
| `focus` | Element gains focus |
| `blur` | Element loses focus |
| `select` | Text is selected |

### Touch Events (Mobile)
Events from touch screen.

| Event | When it fires |
|-------|---------------|
| `touchstart` | Touch begins |
| `touchend` | Touch ends |
| `touchmove` | Touch moves |
| `touchcancel` | Touch interrupted |

### Window Events
Events on window/document.

| Event | When it fires |
|-------|---------------|
| `load` | Page fully loaded |
| `DOMContentLoaded` | HTML parsed (before images) |
| `resize` | Window resized |
| `scroll` | Page scrolled |
| `unload` | Page is unloading |
| `beforeunload` | Before page unloads |

### Drag Events
Events for drag and drop.

| Event | When it fires |
|-------|---------------|
| `drag` | Element is being dragged |
| `dragstart` | Drag starts |
| `dragend` | Drag ends |
| `dragover` | Dragged over target |
| `drop` | Dropped on target |
| `dragenter` | Enters drop target |
| `dragleave` | Leaves drop target |

### Media Events
Events for video/audio.

| Event | When it fires |
|-------|---------------|
| `play` | Media starts playing |
| `pause` | Media paused |
| `ended` | Media finished |
| `volumechange` | Volume changed |
| `timeupdate` | Playback position changed |

### Clipboard Events
Copy/paste events.

| Event | When it fires |
|-------|---------------|
| `copy` | Content copied |
| `cut` | Content cut |
| `paste` | Content pasted |

### Angular event binding examples
```html
<!-- Mouse -->
<button (click)="handleClick()">Click</button>
<div (mouseenter)="onHover()">Hover me</div>

<!-- Keyboard -->
<input (keyup)="onKeyUp($event)">
<input (keydown.enter)="onEnter()">  <!-- Angular shortcut -->

<!-- Form -->
<input (input)="onInput($event)">
<form (submit)="onSubmit($event)">
<input (focus)="onFocus()" (blur)="onBlur()">

<!-- Window (use @HostListener in component) -->
@HostListener('window:resize', ['$event'])
onResize(event) { }

@HostListener('window:scroll', ['$event'])
onScroll(event) { }
```

### Event object
All events pass an object with details:
```typescript
onClick(event: MouseEvent) {
  event.target;       // Element that triggered event
  event.preventDefault();  // Prevent default behavior
  event.stopPropagation(); // Stop event bubbling
}
```

### Quick memory line
HTML events = browser notifications when user interacts with page (click, type, scroll, etc.).

---

## ElementRef and Renderer2 — When @HostBinding Is Not Enough

### Start here: @HostBinding / @HostListener are the right default

This works perfectly and you should use it for simple directive DOM changes:

```typescript
@Directive({ selector: '[appHighlight]', standalone: true })
export class HighlightDirective {
  @Input() highlightColor: string = 'yellow';

  @HostBinding('style.backgroundColor') backgroundColor = '';

  @HostListener('mouseenter') onMouseEnter() {
    this.backgroundColor = this.highlightColor;
  }
  @HostListener('mouseleave') onMouseLeave() {
    this.backgroundColor = '';
  }
}
```

This is clean, Angular-aware, SSR-safe, and requires zero `ElementRef` or `Renderer2`. **Use this when it fits.**

So why do `ElementRef` and `Renderer2` exist at all?

---

### The 5 cases where @HostBinding can't help you

`@HostBinding` has one hard limitation: **it only reaches the host element** — the element the directive is placed on. Anything beyond that, it can't do.

---

#### Case 1 — You need to touch a CHILD element, not the host

```html
<div appTooltip>        ← host element (@HostBinding reaches here)
  <span class="label">  ← child element (@HostBinding cannot reach here)
  </span>
</div>
```

`@HostBinding` can only bind properties on `<div appTooltip>` itself. If your directive needs to find and change the `<span>` inside it, you need `ElementRef` to get the host, then `querySelector` to find the child, then `Renderer2` to change it.

```typescript
@Directive({ selector: '[appTooltip]', standalone: true })
export class TooltipDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  ngOnInit() {
    const label = this.el.nativeElement.querySelector('.label');
    // ↑ @HostBinding has no way to do this — it only sees the host element
    this.renderer.setStyle(label, 'font-weight', 'bold');
  }
}
```

---

#### Case 2 — You need to READ the DOM, not just write to it

`@HostBinding` is **write-only** — you can set a property, but you can't read anything from the DOM.

What if your directive needs to know the element's current width before deciding what to do?

```typescript
@Directive({ selector: '[appShrinkOnOverflow]', standalone: true })
export class ShrinkDirective implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit() {
    const width = this.el.nativeElement.getBoundingClientRect().width;
    // ↑ @HostBinding cannot read this — it can only set values

    if (width > 300) {
      // now do something based on what you read
    }
  }
}
```

Other reads you can only get through `ElementRef`:
- `scrollTop`, `scrollHeight`
- `offsetWidth`, `clientHeight`
- current computed style
- input `.value` at a moment in time

---

#### Case 3 — You need to CREATE and INSERT new DOM nodes

`@HostBinding` sets properties on existing elements. It cannot create new elements and insert them.

Imagine a `[appSpinner]` directive that adds a loading spinner `<div>` inside the host when `@Input() loading = true`.

```typescript
@Directive({ selector: '[appSpinner]', standalone: true })
export class SpinnerDirective implements OnChanges {
  @Input() loading = false;
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private spinnerEl: any = null;

  ngOnChanges() {
    if (this.loading && !this.spinnerEl) {
      // CREATE a new element and INSERT it — @HostBinding cannot do this
      this.spinnerEl = this.renderer.createElement('div');
      this.renderer.addClass(this.spinnerEl, 'spinner');
      this.renderer.appendChild(this.el.nativeElement, this.spinnerEl);
    }

    if (!this.loading && this.spinnerEl) {
      this.renderer.removeChild(this.el.nativeElement, this.spinnerEl);
      this.spinnerEl = null;
    }
  }
}
```

```html
<button [appSpinner]="isSaving">Save</button>
```

There is no `@HostBinding` equivalent for "create a new child element and insert it". Only `Renderer2.createElement()` + `appendChild()` can do this.

---

#### Case 4 — You need to listen to an element OTHER than the host

`@HostListener` only listens to events on the host element.

What if you want to close a dropdown directive when the user clicks anywhere **outside** it? You'd need to listen to `document`, not the host.

```typescript
@Directive({ selector: '[appDropdown]', standalone: true })
export class DropdownDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private unlisten!: () => void;

  ngOnInit() {
    // Listen to document — @HostListener('document:click') technically works for this,
    // but Renderer2.listen() is the general solution for any non-host target
    this.unlisten = this.renderer.listen('document', 'click', (event) => {
      if (!this.el.nativeElement.contains(event.target)) {
        // clicked outside — close dropdown
      }
    });
  }

  ngOnDestroy() {
    this.unlisten(); // MUST clean up or it leaks
  }
}
```

`Renderer2.listen()` can target: the host element, a child element, `'document'`, or `'window'`. `@HostListener` is limited to the host (plus `document:event` and `window:event` as special shortcuts, but not arbitrary elements).

---

#### Case 5 — You need to touch an element OUTSIDE your component entirely

Tooltips, modals, and overlays are often appended to `document.body` so they appear above everything else. `@HostBinding` is locked to your component's host. Only `Renderer2` can reach `document.body`.

```typescript
@Directive({ selector: '[appModal]', standalone: true })
export class ModalDirective {
  private renderer = inject(Renderer2);
  private doc = inject(DOCUMENT); // Angular's safe reference to document

  open() {
    const overlay = this.renderer.createElement('div');
    this.renderer.addClass(overlay, 'overlay');
    this.renderer.appendChild(this.doc.body, overlay);
    // ↑ appended to document.body — completely outside this component's DOM
  }
}
```

---

### Summary: what each tool is for

| Scenario | Tool needed |
|---|---|
| Set style/class/attr on the host element | `@HostBinding` ← always prefer this first |
| Respond to events on the host element | `@HostListener` ← always prefer this first |
| Find or touch a CHILD element | `ElementRef` + `Renderer2` |
| Read DOM state (size, position, value) | `ElementRef` (read from `nativeElement`) |
| Create and insert new DOM nodes | `Renderer2.createElement()` + `appendChild()` |
| Listen to document / window / child element | `Renderer2.listen()` |
| Touch elements outside your component | `Renderer2` + `DOCUMENT` |

---

### What ElementRef actually is

`ElementRef` is an Angular wrapper that holds **one thing**: a reference to the host DOM element.

```typescript
private el = inject(ElementRef);

this.el.nativeElement  // ← this is the actual DOM element (<div>, <button>, etc.)
```

That's all it does. It's just a pointer. You use it to say "which element" — then you pass that element to `Renderer2` to do the actual work.

You can make it type-safe using TypeScript generics:

```typescript
private el = inject(ElementRef);                    // nativeElement is `any` — no autocomplete
private el = inject(ElementRef<HTMLInputElement>);  // nativeElement is typed as HTMLInputElement
```

With the generic, TypeScript knows what `.value`, `.checked`, `.placeholder` etc. are available.

---

### What Renderer2 actually is

`Renderer2` is an Angular service with methods to safely manipulate the DOM. It exists because Angular apps can run in environments where the browser DOM does not exist:

- **Browser** — DOM exists, everything works
- **Server (SSR / Angular Universal)** — `document` does not exist, `nativeElement.style.color = 'red'` crashes
- **Web Worker** — no DOM access
- **Unit tests** — no real browser

When you use `Renderer2`, Angular handles the environment for you. When you touch `nativeElement` directly, you take that responsibility yourself.

```typescript
// ❌ Crashes on SSR — you bypassed Angular
this.el.nativeElement.style.color = 'red';
this.el.nativeElement.classList.add('active');

// ✅ Works everywhere — Angular handles it
this.renderer.setStyle(this.el.nativeElement, 'color', 'red');
this.renderer.addClass(this.el.nativeElement, 'active');
```

Notice: you still pass `this.el.nativeElement` to `Renderer2` — but only as **a target reference**. `Renderer2` does the actual work, not `nativeElement`.

---

### Why directly using nativeElement is dangerous — the full picture

There are three distinct problems with bypassing Angular and touching `nativeElement` directly for writes:

#### Problem 1 — XSS security vulnerability (the most serious)

Angular's template binding and `DomSanitizer` sanitize values before inserting them into the DOM. When you write directly to `nativeElement`, you completely skip this protection.

```typescript
// ❌ UNSAFE — bypasses sanitization, opens XSS attack
this.el.nativeElement.innerHTML = this.userProvidedValue;
// If userProvidedValue is '<img src=x onerror="stealCookies()">'
// that script RUNS. Angular never had a chance to sanitize it.

// ✅ SAFE — Angular sanitizes before inserting
this.renderer.setProperty(this.el.nativeElement, 'innerHTML', this.userProvidedValue);
```

**Rule of thumb:** Any time the value being written comes from user input, an API, or a route param — never write it via `nativeElement` directly.

#### Problem 2 — Breaks SSR (Angular Universal / server-side rendering)

On the server, there is no browser DOM. `document`, `window`, and the browser APIs don't exist in Node.js. Accessing `nativeElement` properties throws at runtime.

```typescript
// ❌ Throws on the server — no DOM exists in Node.js
this.el.nativeElement.style.color = 'red'; // TypeError: Cannot set properties of undefined
```

`Renderer2` knows which environment it's running in and no-ops safely on the server.

#### Problem 3 — Breaks Web Worker compatibility

Angular is designed to support rendering outside the main thread. Direct `nativeElement` manipulation assumes a browser context, which breaks that model entirely.

---

### How to inject both

```typescript
import { Directive, ElementRef, Renderer2, inject } from '@angular/core';

@Directive({ selector: '[appExample]', standalone: true })
export class ExampleDirective {
  private el = inject(ElementRef);       // "which element"
  private renderer = inject(Renderer2);  // "do something to it"
}
```

---

### Common Renderer2 methods

#### `addClass` / `removeClass`
```typescript
this.renderer.addClass(this.el.nativeElement, 'active');
this.renderer.removeClass(this.el.nativeElement, 'active');
```

#### `setStyle` / `removeStyle`
```typescript
this.renderer.setStyle(this.el.nativeElement, 'color', 'red');
this.renderer.removeStyle(this.el.nativeElement, 'color');
```

#### `setAttribute` / `removeAttribute`
```typescript
this.renderer.setAttribute(this.el.nativeElement, 'aria-hidden', 'true');
this.renderer.removeAttribute(this.el.nativeElement, 'disabled');
```

#### `setProperty`
Sets a DOM property (not an HTML attribute):
```typescript
this.renderer.setProperty(inputEl, 'value', 'new text');
this.renderer.setProperty(checkboxEl, 'checked', true);
```

#### `createElement` / `createText` / `appendChild` / `removeChild`
```typescript
const div = this.renderer.createElement('div');
const text = this.renderer.createText('Hello world');
this.renderer.appendChild(div, text);
this.renderer.appendChild(this.el.nativeElement, div);

this.renderer.removeChild(this.el.nativeElement, div);
```

#### `listen` — attach event listeners to any element
```typescript
// Returns an unlisten function — call it in ngOnDestroy or it leaks
const unlisten = this.renderer.listen(this.el.nativeElement, 'click', (event) => {
  console.log('clicked', event);
});

ngOnDestroy() {
  unlisten();
}
```

---

### Quick memory line
`@HostBinding` / `@HostListener` = first choice — handles the host element declaratively.
`ElementRef` = the pointer — tells you *which* element.
`Renderer2` = the safe tool — does *something* to that element without breaking SSR or tests.
Use `ElementRef` + `Renderer2` when you need children, DOM reads, new nodes, or non-host listeners.

---

## Common mistakes
- Not returning item ID in trackBy (returning whole object instead)
- Using trackBy with index only (doesn't help if items are added/removed)
- Confusing `mouseover/mouseout` with `mouseenter/mouseleave` (different bubbling behavior)
- Not calling `preventDefault()` on form submit (page reloads)
- Using deprecated `keypress` event (use `keydown` or `keyup`)
- Using `nativeElement` directly for DOM manipulation instead of `Renderer2` (breaks SSR, Web Workers, and opens XSS vulnerabilities when writing user-provided values)
- Not storing and calling the `unlisten` function from `renderer.listen()` — causes memory leaks
- Using `Renderer2` for things that can be done in the template (overcomplicated)
- Forgetting that `Renderer2` is most at home in directives, not components
