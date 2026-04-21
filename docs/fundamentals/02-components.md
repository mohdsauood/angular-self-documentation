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

## Common mistakes
- Making one huge component instead of breaking it into smaller reusable ones
- Putting business logic in component (use services instead)
- Not making components reusable enough
