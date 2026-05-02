# Quick Topic Index

This file helps you find topics quickly.

## Files in fundamentals/

### Core Concepts (01-06)
- [01-what-is-angular.md](fundamentals/01-what-is-angular.md) - What Angular is
- [02-components.md](fundamentals/02-components.md) - Components basics
- [03-templating.md](fundamentals/03-templating.md) - Interpolation, binding, directives
- [04-routing.md](fundamentals/04-routing.md) - Navigation and routes
  - Basic routes, child routes, route parameters, lazy loading
  - **`loadComponent` vs old `loadChildren` + NgModule**
  - **`withComponentInputBinding()` — bind `:id` param directly to `@Input()`**
  - **Route `data` — attach static data to specific routes**
  - **`resolve` — pre-fetch data before route loads**
  - **`toSignal()` — route params as signals**
  - **View Transitions — `withViewTransitions()` for page animations**
- [05-forms.md](fundamentals/05-forms.md) - User input and validation
  - **Corrected definition: what a form is vs what a control is**
- [06-dependency-injection.md](fundamentals/06-dependency-injection.md) - Services and DI
  - **`inject()` vs constructor injection — old and new, full comparison**
  - Why `inject()` is better (base classes, functional guards, etc.)

### Build & Configuration (07-08)
- [07-build-and-dev-tools.md](fundamentals/07-build-and-dev-tools.md)
  - What is Vite?
  - What was before Vite? (Webpack)
  
- [08-project-configuration.md](fundamentals/08-project-configuration.md)
  - What is `.angular` folder?
  - What is `angular.json`?
  - What is `tsconfig.json`?
  - What is monorepo?
  - **What is `app.config.ts`? (new — standalone era)**
  - **What are `providers` and `provideRouter`?**
  - **Where should `provideRouter` live?**

### Styling (09)
- [09-styling-and-css.md](fundamentals/09-styling-and-css.md)
  - CSS vs SCSS vs Sass
  - CSS encapsulation in Angular
  - What is `:host` in CSS?
  - **Why `:host` exists — custom elements default to `display: inline`**
  - **Mental model: inner elements vs the component wrapper tag**
  - **`:host` use cases — display, sizing, theming, card styling**

### Architecture (10)
- [10-modules-and-architecture.md](fundamentals/10-modules-and-architecture.md)
  - What are Angular modules (NgModule)?
  - Why standalone components (`standalone: true`)?
  - **Why do we still import `CommonModule` / `RouterModule` in standalone components?**
  - What is CommonModule?
  - What is ECMAScript module?
  - Difference between module types

### TypeScript (11)
- [11-typescript-basics.md](fundamentals/11-typescript-basics.md)
  - Primitive types in TypeScript
  - Value vs reference types

### Events & DOM (12)
- [12-events-and-dom.md](fundamentals/12-events-and-dom.md)
  - How `trackBy` works in `*ngFor`
  - What is EventEmitter (vanilla JS)?
  - All HTML event types

### Inputs & Outputs (13) — new
- [13-inputs-outputs.md](fundamentals/13-inputs-outputs.md)
  - `input()` signal — modern inputs
  - `input.required<T>()` — required inputs (compile-time error if not passed)
  - `@Input({ required: true })` — old way
  - `output()` — modern outputs
  - `@Output()` + `EventEmitter` — old way
  - **Why `$event` exists — AngularJS history**
  - Input transforms (`booleanAttribute`, `numberAttribute`)
  - `model()` — two-way binding

### Code Conventions (14) — new
- [14-code-conventions.md](fundamentals/14-code-conventions.md)
  - **Output naming: `carSaved` vs `saveCarEmitter` — full breakdown**
  - Input naming rules
  - Component selector naming

### Lifecycle Hooks (15)
- [15-lifecycle-hooks.md](fundamentals/15-lifecycle-hooks.md)
  - All 8 lifecycle hooks and when they run
  - `ngOnInit` — initialization, data fetching
  - `ngOnChanges` — react to `@Input()` changes
  - `ngOnDestroy` — cleanup, prevent memory leaks
  - `ngAfterViewInit` — access DOM / `@ViewChild`
  - Constructor vs `ngOnInit` — when to use which
  - `effect()` — signal alternative to `ngOnChanges`

### Services (16)
- [16-services.md](fundamentals/16-services.md)
  - What a service is and why to use one
  - Creating a service with Angular CLI
  - `@Injectable({ providedIn: 'root' })` — singleton
  - Using a service in a component with `inject()`
  - Services for sharing data between sibling components

### HTTP Interceptors (17)
- [17-interceptors.md](fundamentals/17-interceptors.md)
  - What an interceptor is and how it works
  - Modern functional interceptors (`HttpInterceptorFn`)
  - Registering with `withInterceptors()`
  - Old class-based interceptors (`HttpInterceptor`)
  - Why requests are immutable — using `.clone()`
  - Error handling interceptor (global 401 redirect)
  - Chaining multiple interceptors

### RxJS (18)
- [18-rxjs.md](fundamentals/18-rxjs.md)
  - What RxJS is and why Angular uses it
  - Observable, subscribe, Subject, BehaviorSubject
  - Common operators: `map`, `filter`, `tap`, `catchError`, `debounceTime`, `distinctUntilChanged`, `takeUntil`, `forkJoin`
  - **`switchMap` — cancel previous, keep latest (search)**
  - **`mergeMap` — all in parallel (independent requests)**
  - **`concatMap` — one at a time, in order (sequential)**
  - Quick comparison table

### Performance Optimization (19)
- [19-performance.md](fundamentals/19-performance.md)
  - Lazy loading routes (`loadComponent`, `loadChildren`)
  - `OnPush` change detection
  - `track` in `@for` / `trackBy` in `*ngFor`
  - Signals for fine-grained updates
  - `async` pipe and `toSignal()` — auto-unsubscribe
  - Avoid functions in templates — use `computed()`
  - Preloading strategies (`PreloadAllModules`)
  - `NgOptimizedImage` for image performance
  - File and class naming table
  - Method naming patterns
  - Signal naming conventions
  - Template conventions (class binding, style binding, control flow)

## Other Files
- [00-your-definitions-corrected.md](fundamentals/00-your-definitions-corrected.md) - Your original definitions (corrected)
- [DOCUMENTATION-TONE-GUIDE.md](DOCUMENTATION-TONE-GUIDE.md) - Writing style guide

## Roadmap
- [roadmap/roadmap-beginner-to-6-year-developer.md](roadmap/roadmap-beginner-to-6-year-developer.md) - Complete learning path

## How to Use
1. Pick a topic from above
2. Read the file
3. Rewrite key points in your own words
4. Add real examples from your projects
5. Come back and review regularly
