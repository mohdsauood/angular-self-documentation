# Routing


## Table of Contents

- [What is routing?](#what-is-routing)
- [Core routing concepts](#core-routing-concepts)
  - [Routes](#routes)
  - [Child Routes](#child-routes)
  - [Router Outlet](#router-outlet)
  - [Navigation](#navigation)
  - [Route Parameters](#route-parameters)
  - [Route Guards](#route-guards)
  - [Path Matching Strategies](#path-matching-strategies)
  - [Lazy Loading](#lazy-loading)
  - [Modern vs Old Setup](#modern-vs-old-setup)
  - [`loadComponent` — Lazy Loading (Modern Way)](#loadcomponent-lazy-loading-modern-way)
  - [Route Data — Making Data Available on Specific Routes](#route-data-making-data-available-on-specific-routes)
  - [`resolve` — Pre-fetching Data Before Route Loads](#resolve-pre-fetching-data-before-route-loads)
  - [Route Parameters with `input()` (Modern Way — `withComponentInputBinding`)](#route-parameters-with-input-modern-way-withcomponentinputbinding)
  - [Route Parameters with Signals (toSignal)](#route-parameters-with-signals-tosignal)
  - [View Transitions in Router](#view-transitions-in-router)
- [Why it matters](#why-it-matters)
- [Quick memory line](#quick-memory-line)
- [Route order matters!](#route-order-matters)
- [Common mistakes](#common-mistakes)

## What is routing?
Routing is how you navigate between different views/pages in your Angular app without reloading the entire browser page.

## Core routing concepts

### Routes
Routes map URL paths to components.

#### Basic route configuration
```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },  // Default route
  { path: 'home', component: HomeComponent },            // /home → HomeComponent
  { path: 'about', component: AboutComponent },          // /about → AboutComponent
  { path: 'contact', component: ContactComponent },      // /contact → ContactComponent
  { path: '**', component: NotFoundComponent }           // Wildcard (404 page)
];
```

**How it works:**
- User visits `/home` → Angular shows `HomeComponent`
- User visits `/about` → Angular shows `AboutComponent`
- User visits `/xyz` (invalid) → Angular shows `NotFoundComponent` (404)
- User visits `/` (empty) → Angular redirects to `/home`

### Child Routes
Child routes are routes nested inside parent routes.

#### Example: User profile with tabs
```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'user/:id',
    component: UserComponent,
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: UserProfileComponent },    // /user/123/profile
      { path: 'settings', component: UserSettingsComponent },  // /user/123/settings
      { path: 'posts', component: UserPostsComponent }         // /user/123/posts
    ]
  }
];
```

**UserComponent template needs a router-outlet for child routes:**
```html
<div class="user-layout">
  <h2>User {{ userId }}</h2>
  <nav>
    <a routerLink="profile">Profile</a>
    <a routerLink="settings">Settings</a>
    <a routerLink="posts">Posts</a>
  </nav>
  <router-outlet></router-outlet>  <!-- Child component appears here -->
</div>
```

### Router Outlet
Router outlet is the placeholder where the routed component appears.
- Add `<router-outlet></router-outlet>` in your template
- Angular puts the component for current route inside this outlet
- Parent routes with children need their own `<router-outlet>` for child components

### Navigation
Navigation is how users move between routes.
- Using links: `<a routerLink="/home">Home</a>`
- Using code (modern): `private router = inject(Router); this.router.navigate(['/home'])`
- Using code (old): `constructor(private router: Router) {}`

### Route Parameters
Route parameters are dynamic values in the URL path.

#### Define route with parameter
```typescript
{ path: 'user/:id', component: UserComponent }  // :id is the parameter
// Matches: /user/123, /user/456, /user/abc
```

#### Access route parameters in component
```typescript
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user',
  template: '<h2>User ID: {{ userId }}</h2>'
})
export class UserComponent {
  private route = inject(ActivatedRoute);
  userId: string;

  constructor() {
    // Get parameter value
    this.userId = this.route.snapshot.params['id'];
    
    // Or subscribe to changes (if parameter can change while component is shown)
    this.route.params.subscribe(params => {
      this.userId = params['id'];
    });
  }
}
```

#### Navigate with parameters
```typescript
// In template
<a [routerLink]="['/user', 123]">User 123</a>

// In component
this.router.navigate(['/user', userId]);
```

#### Query parameters
```typescript
// URL: /search?q=angular&page=2
{ path: 'search', component: SearchComponent }

// Access query params
this.route.queryParams.subscribe(params => {
  const query = params['q'];      // 'angular'
  const page = params['page'];    // '2'
});

// Navigate with query params
this.router.navigate(['/search'], { queryParams: { q: 'angular', page: 2 } });
```

### Route Guards
Guards control who can access a route.
- Example: only logged-in users can access `/dashboard`
- Guard checks condition, then allows or blocks navigation

### Path Matching Strategies

#### pathMatch: 'full' vs 'prefix'

**pathMatch: 'full'** - entire URL must match exactly
```typescript
{ path: '', redirectTo: '/home', pathMatch: 'full' }
// '' matches ONLY when URL is exactly empty
// Without 'full', it would match ALL routes (because all start with '')
```

**pathMatch: 'prefix'** - URL starts with this path (default)
```typescript
{ path: 'user', component: UserComponent, pathMatch: 'prefix' }
// Matches: /user, /user/123, /user/123/profile
```

**When to use:**
- Use `pathMatch: 'full'` for empty path redirects
- Use `pathMatch: 'prefix'` (or omit, it's default) for routes with children

### Lazy Loading
Lazy loading loads feature modules only when user visits that route.

#### Lazy loading example
```typescript
export const routes: Routes = [
  { path: 'home', component: HomeComponent },  // Loaded immediately
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent)
    // AdminComponent loaded ONLY when user visits /admin
  },
  {
    path: 'products',
    loadChildren: () => import('./products/products.routes').then(m => m.PRODUCT_ROUTES)
    // Entire products feature loaded ONLY when user visits /products/*
  }
];
```

**Benefits:**
- Faster initial page load
- User only downloads code they actually use
- Example: admin panel loads only for admins

### Modern vs Old Setup

#### Modern way (standalone apps - v14+)
```typescript
// app.config.ts
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig = {
  providers: [
    provideRouter(routes)  // Modern approach
  ]
};
```

#### Old way (NgModule apps)
```typescript
// app.module.ts
@NgModule({
  imports: [
    RouterModule.forRoot(routes)  // Old approach
  ]
})
```

### `loadComponent` — Lazy Loading (Modern Way)

`loadComponent` is the **modern way** to lazy-load a single component. It only loads the component's code when the user visits that route.

#### Old way — `loadChildren` with NgModule
```typescript
// Had to have a separate module file (UserModule) just to lazy load
{
  path: 'user',
  loadChildren: () => import('./user/user.module').then(m => m.UserModule)
}
```

#### New way — `loadComponent` with standalone component (v14+)
```typescript
{
  path: 'user',
  loadComponent: () => import('./user/user.component').then(m => m.UserComponent)
}
```

No module needed. The component itself is the lazy-loaded chunk.

#### Lazy-loading an entire feature (with child routes)
```typescript
{
  path: 'products',
  loadChildren: () => import('./products/products.routes').then(m => m.PRODUCT_ROUTES)
}
// products.routes.ts exports a Routes array — no module needed
```

**Old vs New summary:**

| | Old | New |
|---|---|---|
| Lazy load single component | `loadChildren` + NgModule | `loadComponent` + standalone |
| Lazy load feature section | `loadChildren` + NgModule | `loadChildren` + routes file (no module) |

---

### Route Data — Making Data Available on Specific Routes

You can attach **static data** to any route. Children or other routes don't have this data.

```typescript
export const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    data: { requiresAdmin: true, title: 'Admin Panel' }
  },
  {
    path: 'home',
    component: HomeComponent
    // no data here — homeComponent doesn't have requiresAdmin
  }
];
```

Access in component:
```typescript
import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

export class AdminComponent {
  private route = inject(ActivatedRoute);
  readonly pageTitle = this.route.snapshot.data['title']; // 'Admin Panel'
}
```

Use case: route guards, page titles, breadcrumb labels, feature flags per route.

---

### `resolve` — Pre-fetching Data Before Route Loads

`resolve` lets you **fetch data before the component renders**, so the component always gets the data on arrival.

```typescript
export const routes: Routes = [
  {
    path: 'product/:id',
    component: ProductDetailComponent,
    resolve: {
      product: () => inject(ProductService).getProduct(/* id */)
    }
  }
];
```

More complete example with the id:
```typescript
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';

export const productResolver: ResolveFn<Product> = (route) => {
  return inject(ProductService).getProduct(route.paramMap.get('id')!);
};

// In routes:
{ path: 'product/:id', component: ProductDetailComponent, resolve: { product: productResolver } }

// In component:
private route = inject(ActivatedRoute);
product = this.route.snapshot.data['product'] as Product;
```

**Is this an Angular thing?** Yes. Other routes that don't have `resolve` simply don't have that data — it is route-specific.

---

### Route Parameters with `input()` (Modern Way — `withComponentInputBinding`)

The **old way** to read route params was via `ActivatedRoute`:
```typescript
// Old way — verbose
private route = inject(ActivatedRoute);
userId: string;

constructor() {
  this.route.params.subscribe(params => {
    this.userId = params['id'];
  });
  // or snapshot:
  this.userId = this.route.snapshot.params['id'];
}
```

The **new way** — bind the route param directly to a signal `input()` (Angular 16+, `input()` stable in Angular 19):
```typescript
// New way — super clean
@Component({ ... })
export class UserComponent {
  id = input.required<string>(); // 'id' matches the :id in the route path
}
```

But this requires **`withComponentInputBinding()`** in your `app.config.ts`:
```typescript
import { provideRouter, withComponentInputBinding } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()) // ← enable this feature
  ]
};
```

**Summary — old vs new for route params:**

| Approach | Code |
|---|---|
| Old (subscribe) | `this.route.params.subscribe(p => this.id = p['id'])` |
| Old (snapshot) | `this.id = this.route.snapshot.paramMap.get('id')` |
| New (signal input) | `id = input.required<string>()` + `withComponentInputBinding()` |

---

### Route Parameters with Signals (toSignal)

If you are *not* using `withComponentInputBinding()` and still need signals:

```typescript
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({ ... })
export class UserComponent {
  private route = inject(ActivatedRoute);

  // Convert the Observable to a Signal
  readonly userId = toSignal(
    this.route.params.pipe(map(params => params['id']))
  );
}
```

Usage in template: `{{ userId() }}`

`toSignal()` wraps an Observable into a read-only signal. No subscribe, no unsubscribe.

---

### View Transitions in Router

**What are Angular View Transitions?**

View Transitions is a browser API (CSS View Transitions API) that lets you animate between two page states. Angular's router integrates with it so navigating between routes plays a smooth animation automatically.

When you navigate from `/home` to `/about`, instead of an instant swap, you get a crossfade (or any animation you define in CSS).

**How to enable (Angular v17+):**
```typescript
import { provideRouter, withViewTransitions } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions())
  ]
};
```

That's it. Angular handles the rest — the browser's View Transitions API wraps each navigation.

**Custom animation with CSS:**
```css
/* Customize the crossfade transition */
::view-transition-old(root) {
  animation: 200ms ease-out fade-out;
}
::view-transition-new(root) {
  animation: 300ms ease-in fade-in;
}

@keyframes fade-out {
  to { opacity: 0; }
}
@keyframes fade-in {
  from { opacity: 0; }
}
```

**Named view transitions (animate specific elements):**
```css
/* In component styles */
.hero-image {
  view-transition-name: hero;
}
/* This element will animate individually across routes */
```

**Browser support:** Chromium-based browsers + Safari 18+. Angular degrades gracefully in unsupported browsers (just instant swap, no animation).

**Quick memory line:** `withViewTransitions()` in `provideRouter()` = page navigation animations for free.

---

## Why it matters
- Creates multi-page feel in single-page app (SPA)
- Better app structure (each feature has its own route)
- Faster app with lazy loading
- `withComponentInputBinding()` eliminates boilerplate for reading route params
- View transitions make navigation feel native and polished

## Quick memory line
Routing = URL paths that show different components.

## Route order matters!

❌ **Wrong order:**
```typescript
export const routes: Routes = [
  { path: '**', component: NotFoundComponent },  // This matches EVERYTHING!
  { path: 'home', component: HomeComponent }     // Never reached!
];
```

✅ **Correct order:**
```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },  // 1. Redirects first
  { path: 'home', component: HomeComponent },            // 2. Specific routes
  { path: 'about', component: AboutComponent },
  { path: 'user/:id', component: UserComponent },        // 3. Routes with params
  { path: '**', component: NotFoundComponent }           // 4. Wildcard LAST
];
```

**Rule:** Specific routes → generic routes → wildcard last

## Common mistakes
- Wrong route order (wildcard `**` should always be LAST)
- Not using lazy loading for big features
- Using old `RouterModule.forRoot(routes)` in standalone apps (use `provideRouter(routes)` instead)
- Forgetting to add `provideRouter(routes)` in app config providers
- Forgetting `pathMatch: 'full'` on empty path redirects (causes infinite redirects)
- Not adding `<router-outlet>` in parent component when using child routes
