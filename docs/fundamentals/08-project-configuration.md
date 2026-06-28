# Project Configuration

## What is the .angular Folder?

### What is it?
The `.angular` folder is a hidden cache folder that Angular CLI creates to speed up builds.

### What it does
- Stores temporary build files
- Caches compiled TypeScript and other assets
- Speeds up subsequent builds (doesn't recompile unchanged files)

### Important notes
- **Don't commit** this to Git (it's in `.gitignore`)
- **Safe to delete** if you have build issues (Angular will recreate it)
- Located at `.angular/cache/` in your project root

### Quick memory line
`.angular` = cache folder that makes builds faster.

---

## What is angular.json?

### What is it?
`angular.json` is the main configuration file for your Angular project.

### What it does
- Defines project structure (where source files, assets, styles are)
- Configures build settings (output folder, optimization options)
- Sets up different environments (development, production)
- Configures CLI commands (`build`, `serve`, `test`)

### Key sections
```json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": { /* build settings */ },
        "serve": { /* dev server settings */ },
        "test": { /* testing settings */ }
      }
    }
  }
}
```

### What you configure here
- Output folder (`dist/`)
- Asset files (images, fonts)
- Global styles (styles.css)
- Scripts to include
- Build optimizations

### Quick memory line
`angular.json` = main config file that tells Angular CLI how to build and run your app.

---

## What is tsconfig.json?

### What is it?
`tsconfig.json` is the TypeScript compiler configuration file.

### What it does
- Tells TypeScript compiler how to compile `.ts` files to JavaScript
- Sets TypeScript rules and strictness level
- Defines where to find files and where to output compiled files

### Important settings
```json
{
  "compilerOptions": {
    "target": "ES2022",           // JavaScript version to compile to
    "module": "ES2022",            // Module system to use
    "strict": true,                // Enable strict type checking
    "esModuleInterop": true,       // Better module compatibility
    "skipLibCheck": true           // Skip type checking of .d.ts files
  }
}
```

### Angular specific
Angular projects usually have multiple tsconfig files:
- `tsconfig.json` - base configuration
- `tsconfig.app.json` - app-specific settings
- `tsconfig.spec.json` - testing settings

### Quick memory line
`tsconfig.json` = tells TypeScript how to compile your code.

---

## What is Monorepo?

### What is it?
A monorepo is one Git repository that contains multiple related projects or apps.

### Structure example
```
my-workspace/
  ├── apps/
  │   ├── customer-app/     (Angular app 1)
  │   ├── admin-app/        (Angular app 2)
  ├── libs/
  │   ├── shared-ui/        (shared component library)
  │   ├── auth/             (shared auth service)
```

### Why use monorepo
- Share code easily between apps (one change updates all apps)
- One `node_modules` folder for all projects
- Easier to keep dependencies in sync
- Better for large organizations with multiple apps

### Tools for Angular monorepo
- **Nx** - most popular (adds extra features)
- **Angular CLI Workspaces** - built-in (simpler)

### Quick memory line
Monorepo = one repository with multiple apps/libraries inside.

---

## What is `app.config.ts`?

### Is it a new file? (Yes — standalone era)

`app.config.ts` was introduced with **standalone components** in Angular v14–v15 and became the standard in v17+. It does **not** exist in old NgModule-based Angular apps — those used `app.module.ts` instead.

| Era | Configuration file | Bootstrap approach |
|---|---|---|
| Old (NgModule) | `app.module.ts` + `@NgModule` | `platformBrowserDynamic().bootstrapModule(AppModule)` |
| New (standalone) | `app.config.ts` + `ApplicationConfig` | `bootstrapApplication(AppComponent, appConfig)` |

`app.config.ts` is the **application-level configuration object** for standalone apps. It is where you configure everything that the entire app needs — router, HTTP client, animations, etc.

### What does it look like?
```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(),
  ]
};
```

```typescript
// main.ts — uses it to bootstrap the app
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig);
```

### What are `providers`?

`providers` is the array where you register **app-level services and features**.

A **provider** is Angular's way of saying "make this available for injection anywhere in the app". When you call `provideRouter(routes)`, you are registering the Router service and all its internals so any component can inject `Router` or `ActivatedRoute`.

Without `provideRouter(routes)` in providers → injecting `Router` anywhere throws an error.

**Common providers:**

| Provider function | What it gives you |
|---|---|
| `provideRouter(routes)` | `Router`, `ActivatedRoute`, routing system |
| `provideHttpClient()` | `HttpClient` for API calls |
| `provideAnimations()` | Angular animation system |
| `provideNoopAnimations()` | Disables animations (useful for tests) |
| `provideStore()` (NgRx) | Global state management |

### What are `provideRouter` feature flags?

`provideRouter()` accepts optional **feature functions** as additional arguments:

```typescript
provideRouter(
  routes,
  withComponentInputBinding(),  // bind :id param to @Input() id
  withViewTransitions(),         // page-change animations
  withPreloading(PreloadAllModules), // preload lazy routes in background
  withHashLocation(),            // use #hash in URL instead of /path
  withDebugTracing()             // console log every navigation event (dev only)
)
```

These are modular capabilities you opt into — only the ones you add get bundled.

### Should `provideRouter` always be in `app.config.ts`?

**Yes, for the vast majority of apps.** `app.config.ts` is the right place because the router is an app-level concern — every part of the app can navigate.

**Edge cases where it might be elsewhere:**

| Situation | Where provider goes |
|---|---|
| Normal app | `app.config.ts` ✅ |
| Testing a component | `TestBed.configureTestingModule({ providers: [provideRouter([])] })` |
| Micro-frontend / shell | Could be in a sub-app config, but still app-level |
| Server-side rendering (SSR) | `app.config.server.ts` (separate config for server) |

For SSR, Angular generates two config files:
- `app.config.ts` — browser providers
- `app.config.server.ts` — server-specific providers (merges with browser config)

**Never put `provideRouter()` inside a component's `providers` array** — the router must be registered at the application level, not per-component.

### Quick memory line
`app.config.ts` = new file (standalone era), replaces `app.module.ts` for app configuration. `providers` = register what the whole app needs. `provideRouter(routes)` = always in `app.config.ts`.

---

## What is App Config (Providers)?

### What is it?
App config is where you configure your entire Angular application and register services/providers.

### In modern Angular (standalone)
```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig);
```

### What providers do
Providers tell Angular what services are available in your app.
- `provideRouter(routes)` - enables routing
- `provideHttpClient()` - enables HTTP calls
- Custom providers - your own services

### Quick memory line
App config = central place to configure app and register all services (providers).

---

## Angular v22 updates

### `strictTemplates` now defaults to `true`

After upgrading to Angular v22, template type-checking is stricter by default.

If your codebase needs temporary fallback while fixing errors:

```json
{
  "angularCompilerOptions": {
    "strictTemplates": false
  }
}
```

Angular migrations can auto-add compatibility diagnostics for noisy checks like:
- `nullishCoalescingNotNullable`
- `optionalChainNotNullable`

### Platform requirements for Angular 22

- Node.js: `^22.22.3` or `^24.15.0` or `^26.0.0`
- TypeScript: `>=6.0.0 <6.1.0`

Always align Node and TypeScript before running `ng update` to avoid migration failures.

---

## Common mistakes
- Deleting `.angular` folder thinking it's important (it's just cache)
- Editing `angular.json` incorrectly and breaking builds
- Setting `strict: false` in tsconfig (keep it strict for better code)
- Not understanding monorepo before trying to use it
- Forgetting to add providers in app config for new features
- Putting `provideRouter()` inside a component — always at app level (`app.config.ts`)

