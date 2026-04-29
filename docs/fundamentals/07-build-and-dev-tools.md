# Build and Development Tools

## What is Vite?

### What is it?
Vite is a modern local development server that Angular uses to run your app during development.

### What it does
- Starts a local server (usually at `http://localhost:4200`)
- Watches your files and reloads the browser when you save changes
- Uses esbuild (super fast bundler) to compile your TypeScript and bundle your app
- Makes development faster with instant hot module replacement (HMR)

### Why Angular switched to Vite
- **Much faster** startup time (seconds instead of minutes for large apps)
- **Faster** file changes and reloads
- Modern bundling that handles TypeScript, CSS, images automatically

### Quick memory line
Vite = fast local dev server that runs your Angular app while you code.

---

## What Was Before Vite?

### Webpack (used before Angular v17/v18)
Before Vite, Angular used **Webpack** as the development server and bundler.

### Problems with Webpack
- **Slower** startup (had to bundle entire app before starting)
- **Slower** hot reload (re-bundled more than needed on file changes)
- More complex configuration

### The evolution
1. **AngularJS era**: Simple http-server or custom setups
2. **Angular 2-16**: Webpack (via `@angular/cli`)
3. **Angular 17+**: Vite as default (esbuild-based)

### Quick memory line
Before Vite, Angular used Webpack which was slower for development.

---

## Common mistakes
- Confusing Vite (dev server) with the final production build
- Thinking Vite is only for Angular (it works with React, Vue, etc.)
- Not understanding that `ng serve` now uses Vite under the hood
