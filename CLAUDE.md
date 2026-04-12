# Zooy — CLAUDE.md

## What Is This

Zooy (`@trintel/zooy`) is an event-driven JavaScript UI framework for building complex, Django-backed web applications. It is an internal framework for Trinity Telecomms, consumed primarily by the **z2** project.

It is **not** a general-purpose frontend framework. It is purpose-built for server-rendered Django apps that need rich client-side interaction: split-pane layouts, URI-based panels, form interception, and pluggable component libraries.

**Key design decisions:**

- Opinionated for Django + server-rendered HTML patterns
- Component-library-agnostic via a pluggable registry (currently Carbon + MDC)
- Panels fetch HTML from the server; client code handles interaction, not rendering
- EventTarget-based event system (native browser API, no custom bus)
- No build step required for consuming apps beyond importing the library

## Tech Stack

- **Language:** Vanilla JavaScript (ES modules, no TypeScript)
- **UI Libraries:** IBM Carbon Design System Web Components (`@carbon/web-components`), Material Design Components (legacy, being phased out)
- **Custom Components:** Lit (`LitElement`) for zoo-\* native components
- **Build:** Vite+ (`vp build`, library mode), esbuild minification
- **Output:** Dual format — `dist/zooy.es.js` (ESM) + `dist/zooy.cjs.js` (CJS)
- **Linting:** Oxlint via Vite+ (`vp lint`, `vp check`) with Vite+ git hooks (`.vite-hooks/`)
- **Dependencies:** badu, ramda (functional utilities)
- **License:** Apache-2.0

## Build

```bash
vp build         # production build (library mode)
vp lint          # oxlint check
vp lint --fix    # oxlint auto-fix
vp check         # format + lint (combined)
vp check --fix   # format + lint auto-fix
```

Build outputs to `dist/`. Dependencies are **externalized** in `vite.config.ts` — Carbon, Lit, badu, etc. are NOT bundled. The consuming project must have them installed.

**Bundle sizes (approximate):**

- Core framework: ~101KB (~27KB gzipped)
- MDC library chunk: ~463KB (~62KB gzipped, only if registered)
- Carbon library chunk: ~34KB (~7KB gzipped, only if registered)

**No sourcemaps** are currently generated (build.sourcemap not set in vite.config.ts).

## Architecture

### Class Hierarchy

```
Evt (EventTarget base with lifecycle-aware listener management)
 ├─ Component (DOM lifecycle: createDom → render → enterDocument → dispose)
 │   ├─ Panel (URI-based content fetching, query params, parseContent)
 │   │   └─ FormPanel (HTML5 validation, AJAX submission, error display)
 │   ├─ Dragger (constrained drag with touch/mouse support)
 │   └─ Split (resizable pane layouts, EW/NS orientations)
 ├─ View (multi-panel orchestrator, event routing between panels)
 └─ Conductor (top-level app controller, view switching, browser history)

ComponentLibraryRegistry (static, pluggable UI library system)
DataBinder (JSON-to-DOM binding via <template> elements)
```

### Event Flow

```
User interaction → Component event
  → Panel.dispatchPanelEvent(name, data)
    → View.onPanelEvent (routes via panelEventMap)
      → View.dispatchViewEvent (if needed)
        → Conductor.onViewEvent (routes via viewEventMap)
```

Built-in panel events: `destroy_me` (remove panel), `switch_view:viewName` (navigate).

### Two-Layer UI Architecture

Third-party UI libraries (Carbon, MDC) use a two-layer pattern:

1. **Component definitions** — wrappers that know about the UI library but NOT about zooy panels
2. **Renderers** — glue code that connects components to the panel event system via semantic attributes

For Carbon, this is:

- `src/ui/carbon/components/*.js` — 19 component config files (selector, events, init, getData)
- `src/ui/carbon/renderers.js` — the pipeline: scan → collect imports → load → attach listeners

For native zoo components (`zoo-tag`, `zoo-timestamp`), they extend `LitElement` directly and are self-contained.

### ComponentLibraryRegistry

Central static registry allowing multiple UI libraries to coexist:

```javascript
ComponentLibraryRegistry.register("carbon", { render, dispose, cache, config });
ComponentLibraryRegistry.register("mdc", { render, cache, config });
```

Each library gets its own import cache (Map). Panel.parseContent() iterates registered libraries and calls their render functions.

### DataBinder

Binds JSON from HTTP endpoints to DOM using `<template>` elements. Library-agnostic.

**Key attributes:**

- `zoo-url__api` — API endpoint URL (on root element)
- `zoo-template` — template ID (on consumer element)
- `zoo-template-bind` — dot-path to data array in JSON response (e.g., `"results"`)
- `zoo-bind="fieldName"` — bind textContent
- `zoo-bind-attr="attr:field, attr2:field2"` — bind attributes
- `zoo-bind-format="formatterName"` — apply formatter

**Special variables:** `$index` (0-based), `$index1` (1-based) — both pagination-aware.

**DRF pagination:** Auto-detects `{count, next, previous, results}` format and dispatches pagination events.

### Semantic Attributes

Components use self-documenting HTML attributes instead of cryptic data-\* prefixes:

| Attribute                    | Purpose                      |
| ---------------------------- | ---------------------------- |
| `event`                      | Panel event name to dispatch |
| `change-event`               | Event on change/blur         |
| `open-event` / `close-event` | Modal events                 |
| `record-id`                  | Record identifier            |
| `endpoint`                   | API endpoint URL             |
| `action`                     | Semantic action name         |

Source: `src/ui/zoo/attributes.js`

## Source Structure

```
src/
├── main.js                          # Default export (zooy object) + lazy-load functions
├── dom/
│   └── utils.js                     # DOM utilities, date formatting, form handling, evalScripts
├── events/
│   ├── uieventtype.js               # Event type constants
│   ├── zooyeventdata.js             # Event detail payload class
│   └── mouseandtouchevents.js       # Mouse/touch event handling
├── ui/
│   ├── evt.js                       # EventTarget base class (265 lines)
│   ├── component.js                 # Base UI component (535+ lines)
│   ├── panel.js                     # URI-based content panel (651 lines)
│   ├── form.js                      # FormPanel for form handling (497 lines)
│   ├── view.js                      # Multi-panel view orchestrator (438+ lines)
│   ├── conductor.js                 # App controller + navigation (236+ lines)
│   ├── split.js                     # Resizable split layouts (300+ lines)
│   ├── dragger.js                   # Drag component
│   ├── binder.js                    # DataBinder class (364 lines)
│   ├── component-library-registry.js # Pluggable library registry
│   ├── carbon/
│   │   ├── register.js              # Carbon library registration (preload support)
│   │   ├── renderers.js             # Render pipeline: scan/import/attach (221 lines)
│   │   ├── imports.js               # Selector-to-import-function mapping
│   │   ├── index.js                 # Re-exports renderCarbonComponents
│   │   └── components/              # 19 component config files
│   │       ├── index.js             # Merged component map
│   │       ├── button.js            # cds-button, cds-icon-button, cds-combo-button
│   │       ├── dropdown.js          # cds-dropdown
│   │       ├── date-picker.js       # cds-date-picker
│   │       ├── file-uploader.js     # cds-file-uploader
│   │       ├── form-inputs.js       # cds-text-input, cds-number-input
│   │       ├── form-controls.js     # cds-checkbox, cds-radio-button, cds-switch
│   │       ├── modal.js             # cds-modal
│   │       ├── table.js             # cds-table (DataBinder integration)
│   │       ├── table-pagination.js  # Pagination controls
│   │       ├── tabs.js              # cds-tabs
│   │       ├── breadcrumb.js        # cds-breadcrumb + pagination component
│   │       ├── menu.js              # cds-menu
│   │       ├── lists.js             # cds-list
│   │       ├── tags.js              # cds-tag
│   │       ├── tiles.js             # cds-tile
│   │       ├── notifications.js     # cds-inline-notification, cds-toast-notification
│   │       ├── progress.js          # cds-progress-bar, cds-progress
│   │       ├── tooltips.js          # cds-tooltip
│   │       ├── presentational.js    # Non-interactive components
│   │       └── misc.js              # Miscellaneous
│   ├── mdc/
│   │   ├── register.js              # MDC registration (CDN script loading)
│   │   ├── mdc.js                   # 21 MDC renderer functions
│   │   └── tree-utils.js            # MDC tree utilities
│   ├── handlers/
│   │   ├── index.js                 # Exports handler collections
│   │   ├── search-handlers.js       # search, reset_search
│   │   ├── query-param-handlers.js  # paginate, list_filter
│   │   └── mdc-tree-handlers.js     # toggle_tree, tree_toggle-children
│   └── zoo/
│       ├── attributes.js            # Semantic attribute utilities
│       ├── index.js                 # Zoo namespace exports
│       └── components/
│           ├── index.js             # Component exports
│           ├── tag.js               # zoo-tag (LitElement, CSS custom property styling)
│           └── timestamp.js         # zoo-timestamp (relative/static time, zoo-tick-60)
├── uri/
│   └── uri.js                       # URI parsing and query param utilities
├── user/
│   └── usermanager.js               # JWT auth, fetch wrapper, CSRF, spinner management
└── sass/
    ├── main.scss                    # SASS entry point (exported via package.json)
    ├── _zoo.scss                    # Zoo component styles
    ├── split.scss                   # Split layout styles
    ├── panels.scss                  # Panel styles
    ├── carbon.scss                  # Carbon overrides/extensions
    └── reset.scss                   # CSS reset
```

## Exports (via main.js default export)

```javascript
import zooy from "@trintel/zooy";

// Core classes
zooy.Evt; // EventTarget base
zooy.Component; // Base UI component
zooy.Panel; // URI-based content panel
zooy.FormPanel; // Form handling panel
zooy.View; // Multi-panel orchestrator
zooy.Conductor; // App controller
zooy.Split; // Resizable layouts
zooy.Dragger; // Drag component
zooy.UserManager; // Auth + fetch wrapper
zooy.DataBinder; // JSON-to-DOM binding (alias: zooy.Binder)

// Systems
zooy.ComponentLibraryRegistry; // Pluggable UI library registry
zooy.UiEventType; // Event type constants
zooy.domUtils; // DOM utility functions
zooy.uriUtils; // URI utility functions
zooy.handlers; // { SearchHandlers, QueryParamHandlers, MdcTreeHandlers }
zooy.zoo; // { ZooTag, ZooTimestamp, getSemanticAttributes, ... }

// Async registration (lazy-loads library code)
zooy.registerCarbonLibrary(options); // Register Carbon Design System
zooy.registerMdcLibrary(); // Register Material Design Components

// SASS (separate export)
import "@trintel/zooy/sass"; // → src/sass/main.scss
```

## How the Consuming App (z2) Uses Zooy

```javascript
import zooy from "@trintel/zooy";

const entryFunc = async (user) => {
  await zooy.registerCarbonLibrary();
  await zooy.registerMdcLibrary();

  const c = new zooy.Conductor();
  const u = new zooy.UserManager(user);
  const s = new zooy.Split();
  s.domFunc = () => document.getElementById("root");
  s.render();

  c.user = u;
  c.split = s;
  c.registerViewConstructor("dashboard", (pk) => new DashboardView(pk));
  c.switchView(new DashboardView());
};
```

Server-side (Django) renders HTML templates containing `<cds-*>` components and `zoo-*` attributes. Panel.renderWithTemplate() fetches this HTML, injects it into the DOM, and parseContent() initializes all component libraries.

## Migration Status (MDC to Carbon)

| Step                                                | Status      |
| --------------------------------------------------- | ----------- |
| ComponentLibraryRegistry (pluggable architecture)   | Done        |
| Carbon component configs (19 component types)       | Done        |
| Carbon render pipeline (scan/import/attach)         | Done        |
| Semantic attributes system                          | Done        |
| DataBinder (JSON-to-DOM binding)                    | Done        |
| Table with sort/search/pagination (DRF integration) | Done        |
| Zoo native components (zoo-tag, zoo-timestamp)      | Done        |
| Handler collections (composable, opt-in)            | Done        |
| Vite build system                                   | Done        |
| Django template updates (in z2)                     | In progress |
| Remove MDC dependencies                             | Pending     |
| Remove legacy MDC renderer code                     | Pending     |

## Important Patterns

### Externalize Dependencies in vite.config.ts

All third-party dependencies MUST be listed in the `external` array in `vite.config.ts`. Without this, Rollup creates wrapper chunks with side-effect imports that silently fail to execute `customElements.define()` when served by a consuming project's Vite dev server (especially with npm link). This was a hard-won lesson — the modules load (200 OK), the code is present, no errors, but web component registration never fires.

When adding new dependencies, add them to the `external` array.

### Adding a New Carbon Component

1. Create `src/ui/carbon/components/mycomponent.js` with a config object:
   ```javascript
   export const cdsMyComponent = {
     selector: "cds-my-component",
     event: "cds-my-component-changed",
     getData: (e, attrs, element) => ({ ...attrs, value: e.detail.value }),
     init: function (element) {
       /* optional setup */
     },
   };
   ```
2. Add to `src/ui/carbon/components/index.js`
3. Add the import mapping in `src/ui/carbon/imports.js`

### Adding a New Zoo Component

Zoo components are native LitElement web components styled via CSS custom properties. They self-register with `customElements.define()`.

1. Create `src/ui/zoo/components/mycomponent.js`
2. Export from `src/ui/zoo/components/index.js`
3. The consuming app defines CSS custom properties for styling

### Declarative HTML Patterns (Legacy)

These still work alongside Carbon components:

```html
<button class="zoo__button" data-zv="event_name" data-pk="123">Click</button>
<form class="intercept_submit" data-zv="search" data-href="/api/search">...</form>
<div class="zoo_async_html" data-href="/api/widget"></div>
<button
  class="zoo__toggle_class_driver"
  data-toggle_class_target_id="menu"
  data-toggle_class="open"
>
  Toggle
</button>
```

## Known Issues

- `src/user/usermanager.js:75` has a debug `console.log('Redirect detected', redirect)` that should be removed or converted to `console.debug()`
- Script execution in `src/dom/utils.js` (evalScripts) uses dynamic code evaluation — a known security concern; planned replacement with `<script type="module">` imports
- Unsanitized `innerHTML` usage in `src/dom/utils.js` (XSS risk for untrusted content)
- The `.claude/migration/CARBON_MIGRATION.md` references a `zoo/` directory with 18 wrapper components (zoo-button, zoo-text-input, etc.) that were part of an earlier architecture — these were replaced by the current `carbon/components/` approach where Carbon's `<cds-*>` elements are used directly

## Versioning

Current: **v1.3.0** (package.json)

The project uses semver. Major version jumped from 36.x to 1.x during the Vite migration and npm publishing restructure.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## CI Integration

For GitHub Actions, consider using [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) to replace separate `actions/setup-node`, package-manager setup, cache, and install steps with a single action.

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
    cache: true
- run: vp check
- run: vp test
```

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->
