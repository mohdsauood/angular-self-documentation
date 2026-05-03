# Documentation Tone & Style Guide


## Table of Contents

- [Writing Style](#writing-style)
  - [Use Direct, Simple Language](#use-direct-simple-language)
  - [Use Action-Oriented Explanations](#use-action-oriented-explanations)
  - [Explain "What It Does" Not Just "What It Is"](#explain-what-it-does-not-just-what-it-is)
  - [Keep Sentences Short and Clear](#keep-sentences-short-and-clear)
- [Structure Template](#structure-template)
  - [1. What is [Topic]?](#1-what-is-topic)
- [What is routing?](#what-is-routing)
  - [2. Core Concepts (if applicable)](#2-core-concepts-if-applicable)
  - [Interpolation `{{ }}`](#interpolation)
  - [3. Why It Matters](#3-why-it-matters)
- [Why it matters](#why-it-matters)
  - [4. Quick Memory Line](#4-quick-memory-line)
- [Quick memory line](#quick-memory-line)
  - [5. Common Mistakes](#5-common-mistakes)
- [Common mistakes](#common-mistakes)
- [Tone Principles](#tone-principles)
  - [Be Conversational](#be-conversational)
  - [Assume Zero Prior Knowledge](#assume-zero-prior-knowledge)
  - [Use Examples](#use-examples)
  - [Be Specific, Not Abstract](#be-specific-not-abstract)
  - [Use Analogies When Helpful](#use-analogies-when-helpful)
- [Formatting Rules](#formatting-rules)
  - [Code Examples](#code-examples)
  - [Lists](#lists)
  - [Headings](#headings)
  - [Emphasis](#emphasis)
- [Example Content Comparison](#example-content-comparison)
  - [Before (Too Formal)](#before-too-formal)
- [Definition](#definition)
  - [After (Simple & Direct)](#after-simple-direct)
- [What is Dependency Injection?](#what-is-dependency-injection)
- [Real Examples from This Workspace](#real-examples-from-this-workspace)
  - [Example 1: Interpolation](#example-1-interpolation)
  - [Interpolation `{{ }}`](#interpolation-1)
  - [Example 2: Property Binding](#example-2-property-binding)
  - [Property Binding `[ ]`](#property-binding)
  - [Example 3: Event Binding](#example-3-event-binding)
  - [Event Binding `( )`](#event-binding)
- [Key Phrases to Use](#key-phrases-to-use)
  - [Good Phrases](#good-phrases)
  - [Avoid These Phrases](#avoid-these-phrases)
- [Writing Process](#writing-process)
- [Testing Your Writing](#testing-your-writing)

This file defines how all Angular documentation in this workspace should be written. Use this as a reference before creating or updating any documentation.

## Writing Style

### Use Direct, Simple Language
❌ Bad: "Angular leverages TypeScript to facilitate the development of sophisticated web applications."
✅ Good: "Angular is a TypeScript-based framework used to build web applications."

### Use Action-Oriented Explanations
❌ Bad: "Interpolation is a template syntax feature."
✅ Good: "Interpolation is how we show dynamic data from the component to the template."

### Explain "What It Does" Not Just "What It Is"
❌ Bad: "Property binding is a feature in Angular templates."
✅ Good: "Property binding is binding a value from the component to an element attribute or component input."

### Keep Sentences Short and Clear
- One idea per sentence
- Avoid complex nested clauses
- Use simple words over fancy vocabulary

## Structure Template

Every topic file should follow this structure:

### 1. What is [Topic]?
Start with a direct definition of what it is.

Example:
```markdown
## What is routing?
Routing is how you navigate between different views/pages in your Angular app without reloading the entire browser page.
```

### 2. Core Concepts (if applicable)
Break down into sub-topics with clear headings.
Each sub-topic should explain:
- What it is
- What it does
- A simple example

Example:
```markdown
### Interpolation `{{ }}`
Interpolation is how we show dynamic data from the component to the template.
- Example: `{{ userName }}` displays the `userName` property from component
- One-way: component → template
```

### 3. Why It Matters
Explain the practical benefits in simple terms.

Example:
```markdown
## Why it matters
- Creates multi-page feel in single-page app (SPA)
- Better app structure (each feature has its own route)
- Faster app with lazy loading
```

### 4. Quick Memory Line
One sentence that summarizes the entire concept for quick recall.

Example:
```markdown
## Quick memory line
Routing = URL paths that show different components.
```

### 5. Common Mistakes
List mistakes beginners make with this topic.

Example:
```markdown
## Common mistakes
- Wrong route order (specific routes should come before generic ones)
- Not using lazy loading for big features
- Forgetting to add `RouterModule.forRoot(routes)` in app config
```

## Tone Principles

### Be Conversational
Write like you're explaining to a friend, not writing a textbook.

### Assume Zero Prior Knowledge
Don't assume the reader knows technical terms. Explain them simply.

### Use Examples
Every concept should have at least one concrete example.

### Be Specific, Not Abstract
❌ Bad: "Components facilitate UI composition."
✅ Good: "Components break big UI into small reusable pieces."

### Use Analogies When Helpful
But keep them optional, not required to understand the concept.

## Formatting Rules

### Code Examples
- Always use syntax highlighting with language tags
- Keep examples minimal and focused
- Add comments when needed

### Lists
- Use bullet points for features, benefits, examples
- Keep each point to one line when possible
- Be consistent with punctuation (either all have periods or none)

### Headings
- Use `##` for main sections
- Use `###` for sub-sections
- Keep heading text short and descriptive

### Emphasis
- Use **bold** for key terms on first mention
- Use `code formatting` for Angular syntax, class names, properties
- Use italics sparingly

## Example Content Comparison

### Before (Too Formal)
```markdown
## Definition
Dependency Injection is a software design pattern that implements Inversion of Control for resolving dependencies. It enables loose coupling between classes and their dependencies.
```

### After (Simple & Direct)
```markdown
## What is Dependency Injection?
Dependency Injection is how Angular provides services to components automatically, instead of you creating them manually.
```

## Real Examples from This Workspace

### Example 1: Interpolation
```markdown
### Interpolation `{{ }}`
Interpolation is how we show dynamic data from the component to the template.
- Example: `{{ userName }}` displays the `userName` property from component
- One-way: component → template
```

### Example 2: Property Binding
```markdown
### Property Binding `[ ]`
Property binding is binding a value from the component to an element attribute or component input.
- Example: `[disabled]="isLoading"` binds component property to button's disabled attribute
- Example: `[value]="userName"` sets input value from component
- One-way: component → template
```

### Example 3: Event Binding
```markdown
### Event Binding `( )`
Event binding is used to capture user events in the browser and handle them in the component.
- Example: `(click)="handleClick()"` calls component method when button is clicked
- Example: `(input)="onInput($event)"` captures input changes
- One-way: template → component
```

## Key Phrases to Use

### Good Phrases
- "is how we..."
- "is used to..."
- "means that..."
- "this does..."
- "Example:"
- "In other words:"

### Avoid These Phrases
- "leverages"
- "facilitates"
- "utilizes"
- "implements the paradigm of"
- "provides a mechanism for"
- "enables developers to"

## Writing Process

1. **Start with the raw concept**: What does this thing do?
2. **Write it simply**: How would you explain it to a beginner?
3. **Add an example**: Show concrete usage
4. **Explain why it matters**: What problem does it solve?
5. **List common mistakes**: What do beginners get wrong?

## Testing Your Writing

Before finalizing any documentation, ask yourself:

1. ✅ Can a beginner understand this without prior Angular knowledge?
2. ✅ Did I use simple, direct language?
3. ✅ Did I include at least one concrete example?
4. ✅ Did I explain what it DOES, not just what it IS?
5. ✅ Would I understand this if I read it a year from now?

If you answer "no" to any question, revise that section.
