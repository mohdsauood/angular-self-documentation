# Forms

## What are forms?
Forms are how you collect user input, validate it, and send it to your application or server.

## Two types of Angular forms

### Template-Driven Forms
Template-driven forms put most logic in the template.
- Easier for simple forms
- Use `[(ngModel)]` for two-way binding
- Example: login form with username and password

### Reactive Forms
Reactive forms put logic in the component class.
- Better for complex forms with lots of validation
- More control and easier to test
- Example: registration form with many fields and custom validators

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
- Using template-driven forms for complex scenarios
- Not showing clear error messages to users
- Forgetting to import `FormsModule` or `ReactiveFormsModule`
