# Forms


## Table of Contents

- [What are forms?](#what-are-forms)
  - [Your instinct — and the correction](#your-instinct-and-the-correction)
- [Three approaches to Angular forms (as of Angular 21)](#three-approaches-to-angular-forms-as-of-angular-21)
  - [1. Template-Driven Forms](#1-template-driven-forms)
  - [2. Reactive Forms (Widely used)](#2-reactive-forms-widely-used)
  - [3. Signal Forms — Angular 21 experimental](#3-signal-forms-angular-21-experimental)
- [Important form concepts](#important-form-concepts)
  - [Form Controls](#form-controls)
  - [Form Groups](#form-groups)
  - [Validation](#validation)
  - [Error Display](#error-display)
- [Why it matters](#why-it-matters)
- [Quick memory line](#quick-memory-line)
- [Common mistakes](#common-mistakes)

## What are forms?

### Your instinct — and the correction
You said: *"forms are input fields in the UI, it can be a text area, checkbox, button, and in a group they are called forms."*

That is mostly right, but here is the precise definition:

A **form** is a **group of one or more input controls** (text inputs, textareas, checkboxes, radio buttons, dropdowns, etc.) that together collect related data from the user, validate that data, and submit it somewhere.

The individual elements (text input, checkbox, etc.) are the **controls**. The **form** is the container that groups them and gives them meaning together.

> **Example:** A "login form" groups a username input + a password input + a submit button. None of those alone is "a form" — together they make one.

A button on its own is not an input control in the form sense (it is a trigger). But a submit button *inside* a form is part of the form flow.

**So your definition was close — the only correction:** a single text area by itself is a *control*, not a form. A *form* is when you group one or more controls together with a purpose (collect, validate, submit).

Forms are also how you collect user input, validate it, and send it to your application or server.

## Three approaches to Angular forms (as of Angular 21)

### 1. Template-Driven Forms
Template-driven forms put most logic in the template.
- Easier for simple forms
- Use `[(ngModel)]` for two-way binding
- Example: login form with username and password
- **Note**: Less common in modern Angular (prefer Reactive Forms or Signal Forms)

### 2. Reactive Forms (Widely used)
Reactive forms put logic in the component class.
- Better for complex forms with lots of validation
- More control and easier to test
- Type-safe with TypeScript
- Example: registration form with many fields and custom validators

### 3. Signal Forms — Angular 21 experimental
Angular 21 introduced **Signal Forms** — a new experimental API in `@angular/forms/signals` that replaces `FormGroup`/`FormControl` with a fully signal-based approach.

```typescript
import { form, field } from '@angular/forms/signals';
import { required, minLength } from '@angular/forms/signals/validators';

export class LoginComponent {
  loginForm = form({
    email: field('', { validators: [required, minLength(5)] }),
    password: field('', { validators: [required] }),
  });

  submit() {
    if (this.loginForm.valid()) {
      console.log(this.loginForm.value()); // { email: '...', password: '...' }
    }
  }
}
```

> This is **experimental** in Angular 21. For full Signal Forms documentation including `FieldState`, validators, and async validation, see [20-signals.md](20-signals.md#signal-forms-angular-21-experimental).

## Important form concepts

### Form Controls
Form controls represent individual input fields.
- Example: a text input, checkbox, or dropdown

### Form Groups
Form groups bundle multiple controls together.
- Example: group firstName and lastName into a "name" group

### Validation
Validation checks if user input is correct before submitting.
- Built-in: `required`, `minLength`, `maxLength`, `email`, `pattern`
- Custom: you write your own validation logic
- Example: check if password has at least 8 characters

### Error Display
Show errors to users when validation fails.
- Example: "Password is required" or "Email format is invalid"

## Why it matters
- Ensures data quality before sending to server
- Better user experience (users see errors immediately)
- Prevents bad or dangerous input

## Quick memory line
Forms = capture input + validate it + submit to app.

## Common mistakes
- Only validating on client side (always validate on server too)
- Using template-driven forms for complex scenarios (use reactive forms)
- Not showing clear error messages to users
- Forgetting to import `FormsModule` (for template-driven) or `ReactiveFormsModule` (for reactive)
- Using `ngModel` in reactive forms (don't mix the two approaches)
