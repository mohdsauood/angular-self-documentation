# What is Angular?


## Table of Contents

- [What is Angular?](#what-is-angular)
- [What Angular does](#what-angular-does)
- [Key point](#key-point)
- [What version does this documentation cover?](#what-version-does-this-documentation-cover)
- [Quick memory line](#quick-memory-line)
- [Common mistakes](#common-mistakes)

## What is Angular?
Angular is a TypeScript-based framework used to build frontend web applications.

## What Angular does
- Helps you organize large applications with clear structure
- Provides built-in tools for common needs (routing, forms, HTTP calls, dependency injection, testing)
- Makes it easier to build scalable apps that many developers can work on together

## Key point
Angular is a **framework**, not a library. It gives you a complete structure and set of rules to follow.

## What version does this documentation cover?
This documentation targets **Angular 21** (the version in use as of 2026). All examples and APIs reflect the current stable and experimental Angular 21 surface.

Key milestones:
- **Angular 2** (2016) — complete rewrite from AngularJS, TypeScript-first
- **Angular 14** (2022) — `inject()` function, standalone components preview
- **Angular 15** (2022) — standalone components stable, functional route guards
- **Angular 16** (2023) — Signals introduced (developer preview)
- **Angular 17** (2023) — Signals stable, new `@if` / `@for` template syntax, `@defer`, `loadComponent` lazy loading
- **Angular 18** (2024) — zoneless change detection experimental, incremental hydration preview
- **Angular 19** (2024) — `standalone: true` is the **default** (no need to write it), `resource()` / `rxResource()` experimental async API, `linkedSignal()` introduced, `input()` / `output()` / `model()` APIs stable
- **Angular 20** (2025) — zoneless change detection **dev preview**, `linkedSignal` / `toSignal` / `toObservable` stable, `afterEveryRender` renamed & stable, incremental hydration stable, `*ngIf`/`*ngFor` officially deprecated
- **Angular 21** (2025) — **Signal Forms** experimental (`@angular/forms/signals`), `lastSuccessfulNavigation` is now a signal, `httpResource()` experimental, arrow functions in templates

If you see `input()`, `output()`, `signal()`, `@if`, `@for`, `@defer`, or `loadComponent` in examples — that is Angular 17+. If you see `form()` / `FormField` — that is Angular 21.

## Quick memory line
Angular = framework for building structured web apps using TypeScript.

## Common mistakes
- Saying Angular is JavaScript (modern Angular is TypeScript-first)
- Calling it a library (it's a full framework with structure and rules)
- Confusing AngularJS (old version, abandoned) with Angular (modern version)
