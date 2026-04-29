# Events and DOM

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

## Common mistakes
- Not returning item ID in trackBy (returning whole object instead)
- Using trackBy with index only (doesn't help if items are added/removed)
- Confusing `mouseover/mouseout` with `mouseenter/mouseleave` (different bubbling behavior)
- Not calling `preventDefault()` on form submit (page reloads)
- Using deprecated `keypress` event (use `keydown` or `keyup`)
