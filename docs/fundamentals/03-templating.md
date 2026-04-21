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

### Structural Directives
Structural directives add or remove elements from DOM based on conditions.
- `*ngIf="condition"` - shows/hides elements
- `*ngFor="let item of items"` - repeats elements for each item in array
- `*ngSwitch` - shows one element from multiple choices

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
