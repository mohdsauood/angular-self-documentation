# Angular v22 - What's New (Overview)

Angular v22 was released in June 2026. It is mostly a stabilization release: APIs that were experimental in v21 are now stable, and some breaking changes became the new defaults.

This page is an overview only. Detailed explanations are moved to dedicated topic files.

---

## Stable in v22

- Signal Forms are stable: see [05-forms.md](05-forms.md#angular-v22-updates)
- Resource APIs (`resource()`, `httpResource()`) are stable: see [26-injectAsync-and-resource-api.md](26-injectAsync-and-resource-api.md#angular-v22-updates)
- Angular Aria packages are stable: see [25-aria-accessibility.md](25-aria-accessibility.md#angular-v22-updates)

## New APIs in v22

- `injectAsync()`, `onIdle()`, `IdleService`, and WebMCP updates: see [26-injectAsync-and-resource-api.md](26-injectAsync-and-resource-api.md#angular-v22-updates)
- `@Service()` decorator: see [16-services.md](16-services.md#angular-v22-updates)
- Programmatic binding helpers (`inputBinding`, `outputBinding`, `twoWayBinding`): see [13-inputs-outputs.md](13-inputs-outputs.md#angular-v22-updates)
- `ComponentMirror` notes: see [02-components.md](02-components.md#angular-v22-updates)

## Breaking changes and migrations

- `OnPush` is now default: see [24-change-detection.md](24-change-detection.md#angular-v22-updates)
- Router changes (`provideRoutes` removal, params inheritance default, stricter `CanMatch`): see [04-routing.md](04-routing.md#angular-v22-updates)
- Forms migration notes (`min`/`max` no longer accept strings): see [05-forms.md](05-forms.md#angular-v22-updates)
- HTTP changes (`reportProgress` deprecation, fetch backend, `withFetch`): see [17-interceptors.md](17-interceptors.md#angular-v22-updates)
- Tooling and builder migrations: see [07-build-and-dev-tools.md](07-build-and-dev-tools.md#angular-v22-updates)
- Config and platform requirements (`strictTemplates`, Node, TypeScript): see [08-project-configuration.md](08-project-configuration.md#angular-v22-updates)

---

## Quick memory line

Angular v22 = stabilization + stricter defaults. Use this page as an index and read each dedicated section for implementation details.

## Common upgrade mistakes

- Trying to keep all v22 details in one page instead of topic-specific docs
- Missing `OnPush` default behavior changes after upgrade
- Missing router and forms breaking changes during migration
- Forgetting TypeScript and Node version requirements before running update
