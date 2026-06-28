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

## Confusing Vite (dev server) with the production build

This is one of the most common misunderstandings. **Vite is only used during development.** When you run `ng serve`, Vite starts a local server that keeps your code in memory and serves it on the fly — it doesn't write any files to disk.

But when you run `ng build` (especially with `--prod` or `--configuration production`), Angular completely switches gears.

### What happens during development (`ng serve` via Vite)
- **esbuild** compiles your TypeScript, components, and templates as fast as possible
- Files stay **unminified** so you can debug with readable error messages and source maps
- Changes are hot-reloaded (HMR) — only the changed files are recompiled
- No tree-shaking, no dead code elimination, no optimization
- Builds are stored in **memory**, not on disk
- Goal: **developer speed**

### What happens in production (`ng build`)
Production build uses the same bundler (esbuild), but now it does the **real work**:

1. **AOT compilation** — Templates are compiled ahead-of-time into JavaScript. Angular knows your entire app structure and can generate highly optimized code. No compiler is shipped to the browser.

2. **Tree-shaking** — All unused code is removed. If you imported a utility function but never called it, it's gone. Same for unused Angular features, components, directives, pipes.

3. **Minification** — Variable names are shortened (e.g., `userName` → `a`), whitespace is stripped, comments removed. This makes the file much smaller and harder to reverse-engineer.

4. **Dead code elimination** — Angular's compiler knows which parts of the framework you actually use. If you never use `ngSwitch`, the switch-related code is stripped out.

5. **CSS optimization** — Inline styles are extracted, unused CSS is removed, and styles are minified.

6. **Code splitting / Lazy loading** — If you have lazy-loaded routes, each route becomes a separate `.js` file. The browser only downloads the chunk needed for the current page.

7. **File hashing** — Production files get a content hash in the filename (e.g., `main.abc123.js`). This enables long-term caching — the browser can cache the file forever, and when the content changes, the hash changes and the browser downloads the new version.

8. **Differential loading** — Angular generates two bundles: one for modern browsers (ES2022) and one for legacy browsers (ES5/ES2015). Modern browsers get the smaller, faster bundle.

9. **Output to disk** — All optimized files are written to the `dist/` folder, ready to be deployed to a web server, CDN, or cloud host.

### Visual comparison

| Phase | Tool | Speed | Optimization | Output |
|-------|------|-------|-------------|--------|
| `ng serve` (dev) | Vite + esbuild | Instant | None (kept readable) | In memory only |
| `ng build` (prod) | esbuild + Angular compiler | Slower (minutes) | Full (minified, tree-shaken) | Files in `dist/` |

### Why the confusion happens
- Both `ng serve` and `ng build` use **esbuild** under the hood
- The dev server is so fast it feels like the production build would be trivial
- People assume "compile once, use everywhere" — but dev and prod have completely different goals (speed vs size/performance)

### Quick memory line
Vite is for **you** while coding; production build is for your **users** — it strips everything unnecessary to make the app as small and fast as possible.

---

## Angular v22 updates

### Webpack builder migration in v22

Angular v22 completes the move away from legacy webpack builders.

What changed:
- `@angular-devkit/build-angular:browser` is removed
- `@angular-devkit/build-angular:browser-esbuild` and `ng build --watch` are deprecated in favor of `application`

Recommended action:
- migrate to `@angular/build:application`
- use the modern dev/build flow (Vite + esbuild under the hood)

If your workspace still uses old builder targets, update `angular.json` as part of the upgrade.

---

## Other common mistakes
- Thinking Vite is only for Angular (it works with React, Vue, Svelte, etc.)
- Not understanding that `ng serve` now uses Vite under the hood (it used to use Webpack)
- Running `ng serve` in production — never do this. `ng serve` is insecure and unoptimized, meant only for local development.
