# Routing

## What is routing?
Routing is how you navigate between different views/pages in your Angular app without reloading the entire browser page.

## Core routing concepts

### Routes
Routes map URL paths to components.
- Example: `/home` → HomeComponent, `/profile` → ProfileComponent
- When user goes to `/home`, Angular shows HomeComponent

### Router Outlet
Router outlet is the placeholder where the routed component appears.
- Add `<router-outlet></router-outlet>` in your template
- Angular puts the component for current route inside this outlet

### Navigation
Navigation is how users move between routes.
- Using links: `<a routerLink="/home">Home</a>`
- Using code: `this.router.navigate(['/home'])`

### Route Guards
Guards control who can access a route.
- Example: only logged-in users can access `/dashboard`
- Guard checks condition, then allows or blocks navigation

### Lazy Loading
Lazy loading loads feature modules only when user visits that route.
- Improves initial load time (don't load everything at once)
- Example: load admin module only when user goes to `/admin`

## Why it matters
- Creates multi-page feel in single-page app (SPA)
- Better app structure (each feature has its own route)
- Faster app with lazy loading

## Quick memory line
Routing = URL paths that show different components.

## Common mistakes
- Wrong route order (specific routes should come before generic ones)
- Not using lazy loading for big features
- Forgetting to add `RouterModule.forRoot(routes)` in app config
