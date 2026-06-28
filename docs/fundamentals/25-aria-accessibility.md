# ARIA & Accessibility in Angular

## What is ARIA?

**ARIA** (Accessible Rich Internet Applications) is a set of HTML attributes that make web apps more accessible to people using assistive technologies like screen readers. They fill the gap where native HTML semantics aren't enough.

Think of it this way: a native `<button>` already says "I'm a button" to screen readers. But a `<div>` styled to look like a button says nothing — ARIA is how you give it a voice.

```html
<!-- Native — screen reader knows this is a button -->
<button>Submit</button>

<!-- Custom — screen reader has no idea what this is -->
<div class="fancy-btn" (click)="submit()">Submit</div>

<!-- Fixed with ARIA — now the screen reader understands -->
<div class="fancy-btn" (click)="submit()" role="button" tabindex="0"
     (keydown.enter)="submit()" [attr.aria-label]="'Submit form'">
  Submit
</div>
```

---

## What does Angular offer for ARIA & Accessibility?

Angular doesn't have a single "ARIA module" — instead, accessibility support is baked into multiple layers of the framework.

### 1. Direct ARIA attribute binding

You can bind to **any** `aria-*` attribute directly in templates using `[attr.aria-*]`:

```typescript
@Component({
  selector: 'app-user-card',
  template: `
    <div [attr.aria-label]="'User card for ' + userName()">
      <span [attr.aria-describedby]="descriptionId">{{ userName() }}</span>
      <p [id]="descriptionId">{{ userBio() }}</p>
    </div>
  `
})
export class UserCardComponent {
  userName = input.required<string>();
  userBio = input.required<string>();
  descriptionId = 'user-description';
}
```

Common ARIA attributes used in Angular apps:

| Attribute | Purpose |
|-----------|---------|
| `[attr.aria-label]` | Overrides the element's accessible name |
| `[attr.aria-labelledby]` | Points to another element that labels this one |
| `[attr.aria-describedby]` | Points to another element with a longer description |
| `[attr.aria-expanded]` | Whether a collapsible section is open |
| `[attr.aria-controls]` | Which element this control manages |
| `[attr.aria-hidden]` | Hides an element from screen readers (not the same as `visibility: hidden`) |
| `[attr.aria-current]` | Indicates the current item in a list / nav / step |
| `[attr.aria-live]` | Announces dynamic content changes (polite / assertive) |
| `[attr.aria-required]` | Marks a field as required (screen reader will announce it) |

### 2. Angular CDK `a11y` package (`@angular/cdk/a11y`)

The Angular CDK (Component Dev Kit) has a dedicated `a11y` package with powerful tools for accessibility. This is separate from the core Angular framework and needs to be installed:

```bash
npm install @angular/cdk
```

Key features:

#### `LiveAnnouncer`
Announces messages to screen readers without visual changes — great for loading states, errors, or dynamic updates:

```typescript
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({...})
export class SaveComponent {
  private announcer = inject(LiveAnnouncer);

  saveSuccess() {
    this.announcer.announce('File saved successfully', 'polite');
  }

  saveError() {
    this.announcer.announce('Error saving file', 'assertive');
  }
}
```

- `'polite'` — screen reader waits until idle (for non-urgent updates)
- `'assertive'` — screen reader interrupts immediately (for errors / warnings)

#### `FocusMonitor`
Tracks and manages focus on elements programmatically:

```typescript
import { FocusMonitor } from '@angular/cdk/a11y';

@Component({...})
export class MyComponent implements AfterViewInit, OnDestroy {
  private focusMonitor = inject(FocusMonitor);
  private elementRef = inject(ElementRef);

  ngAfterViewInit() {
    // Monitors focus on this component's host element
    this.focusMonitor.monitor(this.elementRef).subscribe(origin => {
      console.log('Focus origin:', origin); // 'mouse', 'keyboard', 'touch', 'program', null
    });
  }

  ngOnDestroy() {
    this.focusMonitor.stopMonitoring(this.elementRef);
  }
}
```

This is useful for showing focus styles only when the user navigates with the keyboard (not when clicking with a mouse).

#### `InteractivityChecker`
Checks whether an element is visible / focusable / tappable:

```typescript
import { InteractivityChecker } from '@angular/cdk/a11y';

const checker = inject(InteractivityChecker);
const el = someElement.nativeElement;

checker.isVisible(el);      // is the element visible?
checker.isFocusable(el);    // can the element receive focus?
checker.isTabbable(el);     // can the element be tabbed to?
```

#### `cdkTrapFocus` directive
Traps focus inside a modal / dialog — essential for accessible modals:

```html
<div class="modal-backdrop" (click)="close()">
  <div class="modal" cdkTrapFocus (click)="$event.stopPropagation()">
    <h2>Confirm Delete</h2>
    <p>Are you sure you want to delete this item?</p>
    <button (click)="confirm()">Delete</button>
    <button (click)="close()">Cancel</button>
  </div>
</div>
```

When the modal opens, Tab / Shift+Tab cycles **only** within the modal. Focus cannot escape to the background until the modal closes.

#### `AriaDescriber` / `AriaRef` (lower-level utilities)
Used internally by Angular Material to associate descriptions with elements. Most apps won't need these directly.

### 3. Angular Forms accessibility

Angular's reactive and template-driven forms add basic ARIA attributes automatically:

- Form controls with validation errors get `aria-invalid` automatically when marked as invalid and touched
- Required validators add `aria-required`
- Error messages linked via `aria-describedby` when using the right template patterns

```html
<form [formGroup]="loginForm">
  <label for="email">Email</label>
  <input id="email" formControlName="email" type="email"
         [attr.aria-describedby]="emailErrorId" />

  @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
    <div [id]="emailErrorId" role="alert">
      Please enter a valid email address.
    </div>
  }
</form>
```

### 4. Angular Material components

If you're using Angular Material, all components are built with WCAG AA compliance in mind. They handle:

- Proper `role` attributes
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus management (auto-focus on dialogs, trap focus in modals)
- `aria-live` regions for dynamic content
- Color contrast ratios

This means you get a lot of accessibility "for free" just by using Material components instead of building custom ones.

### 5. Router accessibility

Angular's router sends focus to the top of the page on navigation by default. This is important because without it, screen reader users would have no idea the page changed.

```typescript
// app.config.ts
provideRouter(routes, withRouterConfig({ scrollPositionRestoration: 'enabled' }))
```

You can also use the `ActivatedRoute` to reset focus after route changes for a better experience.

---

## Why it matters

- **Legal compliance** — WCAG AA is required by law in many countries (Section 508 in US, EN 301 549 in EU, ADA lawsuits)
- **Larger audience** — ~15% of the world's population has some form of disability
- **SEO benefit** — Accessibility improvements often improve search rankings
- **Better UX for everyone** — Keyboard support, good focus management, and clear labels help all users, not just those with disabilities
- **`@angular/cdk/a11y` is free** — these tools are maintained by the Angular team and don't require any third-party libraries

---

## Common mistakes

| Mistake | Why it's wrong | What to do instead |
|---------|---------------|-------------------|
| Using `aria-label` on a `<div>` that isn't focusable | Screen readers can't focus it — the label is invisible | Add `role="button"` + `tabindex="0"` + keyboard handler |
| Forgetting `aria-expanded` on accordions / menus | Screen reader users don't know if the section is open or closed | Bind `[attr.aria-expanded]="isOpen()"` |
| Putting `aria-hidden` on focusable elements | The element is hidden from screen readers but still reachable via Tab — confusing | Don't hide focusable elements; use `display: none` or `visibility: hidden` instead |
| Not connecting error messages with inputs | Screen reader users don't hear validation errors | Use `[attr.aria-describedby]="errorId"` linking input to error message |
| Using `assertive` for everything | Screen reader constantly interrupts — annoying | Use `'polite'` for most updates, `'assertive'` only for urgent errors |
| Not testing with a real screen reader | Automated tools miss ~70% of accessibility issues | Test with NVDA (Windows) or VoiceOver (Mac) at least once |

---

## Quick memory line

ARIA = giving HTML elements a voice so assistive technology understands what they do, and Angular CDK `a11y` gives you the tools to manage focus, announcements, and keyboard traps declaratively.

---

## Angular v22 updates

### Angular Aria package family is stable

In Angular v22, Angular Aria package support is stable.

What this means:
- no need to keep "experimental" warnings for Angular Aria usage
- accessibility APIs are safe to teach as production-ready
- semantic HTML and keyboard testing are still mandatory

---

## Where to go next

- Install `@angular/cdk` and try `LiveAnnouncer` for loading states
- Add `cdkTrapFocus` to your next modal / dialog
- Audit an existing component with Chrome's built-in Lighthouse accessibility check
- Read the [Angular Accessibility guide](https://angular.dev/best-practices/a11y) on angular.dev
