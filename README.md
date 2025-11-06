# Zooy

Event-driven JavaScript UI framework for building complex web applications.

## Installation

```bash
npm install @trintel/zooy
```

## Core Architecture

```
EVT (Event Target)
 └─ Component
     ├─ Panel
     │   └─ FormPanel
     ├─ Dragger
     └─ Split

EVT
 ├─ View
 └─ Conductor

ComponentLibraryRegistry (Static)
 ├─ MDC Library
 └─ Carbon Library
```

## Core Concepts

### EVT

Base class extending `EventTarget` with lifecycle-aware listener management.

**Features:**
- Automatic listener cleanup on disposal
- Observer pattern for component relationships
- Interval tracking with automatic cleanup

### Component

Base class for UI components with DOM lifecycle management.

**Features:**
- Parent-child hierarchy
- Target-based rendering
- Model binding
- Placeholder support for async loading

**Lifecycle:**
```javascript
const component = new Component();
component.target = document.getElementById('container');
component.render();  // Creates DOM → Enters document → Fires READY event
component.dispose(); // Exits document → Cleans up → Removes DOM
```

### Panel

Component for dynamic, URI-based content.

**Features:**
- URI-based content fetching
- Query parameter management
- Server-side HTML rendering
- Script evaluation
- Form interception
- Component library auto-initialization
- Partial DOM updates

**Usage:**
```javascript
const panel = new Panel('/api/content');
panel.addToQParams('filter', 'active');
panel.render();
```

### FormPanel

Enhanced panel for form handling.

**Features:**
- HTML5 validation
- Field-level error display
- AJAX submission
- Server response processing

**Usage:**
```javascript
const form = new FormPanel('/api/form');
form.onSubmitSuccess((panel, response) => {
  console.log('Submitted:', response);
});
form.render();
```

### View

Orchestrator for multiple panels.

**Features:**
- Panel lifecycle management
- Event routing between panels
- Split layout integration
- Browser history recording

**Usage:**
```javascript
class DashboardView extends View {
  constructor() {
    super();
    this.addPanel('main', new Panel('/dashboard'));
    this.mapPanEv('custom_action', this.handleAction);
  }

  handleAction(eventData, panel) {
    // Handle panel events
  }
}
```

### Conductor

Top-level application controller.

**Features:**
- View lifecycle management
- Browser history integration
- Navigation routing
- User session management

**Usage:**
```javascript
const conductor = new Conductor();
conductor.registerViewConstructor('dashboard', (pk) => new DashboardView(pk));
conductor.switchView(new DashboardView());
```

### Split

Resizable layout component.

**Features:**
- Horizontal (EW) and vertical (NS) orientations
- Nested splitting
- Draggable dividers
- Programmatic control
- Animated transitions

**Usage:**
```javascript
const split = new Split();
split.render(document.getElementById('app'));
split.addSplit(undefined, 'EW', 200, 200); // [A | B | C]
split.addSplit(split.getNest('A'), 'NS', 100, 100); // Split A vertically
```

### Dragger

Component for draggable elements.

**Features:**
- Constrained movement (X, Y, or both)
- Touch and mouse support
- Drag events with delta tracking

## Component Libraries

### Registration

Register component libraries at application startup:

```javascript
import { registerMdcLibrary, registerCarbonLibrary } from '@trintel/zooy';

const init = async () => {
  await registerMdcLibrary();      // Material Design Components
  await registerCarbonLibrary();   // IBM Carbon Design System

  // Render application
  const view = new MyView();
  view.render();
};
```

### ComponentLibraryRegistry

Central registry for UI libraries.

**Features:**
- Multiple library support
- Lazy loading via dynamic imports
- Import caching
- Library-specific lifecycle hooks

**Benefits:**
- No library lock-in
- Smaller initial bundles
- Gradual migration support
- Framework evolution flexibility

**Bundle Sizes:**
- Core framework: ~101KB (~27KB gzipped)
- MDC library: +463KB (~62KB gzipped, only if registered)
- Carbon library: +34KB (~7KB gzipped, only if registered)

### Material Design Components

MDC components auto-initialize when panels render:

```html
<button class="mdc-button">
  <span class="mdc-button__label">Click Me</span>
</button>

<ul class="mdc-list mdc-tree">
  <li class="mdc-list-item">Item 1</li>
</ul>
```

### Carbon Design System

Carbon Web Components load dynamically:

```html
<cds-button>Click Me</cds-button>

<cds-accordion>
  <cds-accordion-item title="Section 1">
    Content
  </cds-accordion-item>
</cds-accordion>
```

**Carbon Theming:**

If importing `@carbon/styles` for theming, configure font paths:

```scss
// Your application's theme file
@use '@carbon/styles' as * with (
  $font-path: '../path/to/node_modules/@ibm/plex'
);
```

**Required dependencies:**
```json
{
  "dependencies": {
    "@carbon/styles": "^1.x.x",
    "@ibm/plex": "^6.x.x"
  }
}
```

**Note:** Zooy imports Carbon Web Components (JavaScript only). CSS theming is the application's responsibility.

### Zoo Components

Native zooy components styled via CSS custom properties.

**Usage:**
```html
<zoo-tag token="52">Activated</zoo-tag>
```

**Styling:**
```scss
:root {
  --zoo-tag-52-bg: #4fb50b;
  --zoo-tag-52-fg: #ffffff;
}
```

## Event-Driven Architecture

Components communicate through standardized events:

```javascript
// Panel dispatches event
panel.dispatchPanelEvent('custom_action', { data: 'value' });

// View listens and handles
view.mapPanEv('custom_action', (eventData, panel) => {
  console.log('Panel action:', eventData.data);
});
```

## Declarative HTML Patterns

Zooy enhances HTML with data attributes:

```html
<!-- Button with custom event -->
<button class="zoo__button" data-zv="save" data-pk="123">Save</button>

<!-- Form interception -->
<form class="intercept_submit" data-zv="search" data-href="/api/search">
  <input name="q" />
</form>

<!-- Async content -->
<div class="zoo_async_html" data-href="/api/widget"></div>

<!-- Toggle class -->
<button class="zoo__toggle_class_driver"
        data-toggle_class_target_id="menu"
        data-toggle_class="open">
  Toggle Menu
</button>
```

## Project Structure

```
zooy/
├── src/
│   ├── ui/                          # Core UI components
│   │   ├── evt.js                   # Event system base
│   │   ├── component.js             # Component base
│   │   ├── panel.js                 # Content panel
│   │   ├── form.js                  # Form panel
│   │   ├── view.js                  # Panel orchestrator
│   │   ├── conductor.js             # Application controller
│   │   ├── split.js                 # Resizable layouts
│   │   ├── dragger.js               # Drag functionality
│   │   ├── component-library-registry.js
│   │   ├── handlers/                # Event handlers
│   │   ├── mdc/                     # MDC integration
│   │   │   ├── register.js
│   │   │   └── tree-utils.js
│   │   ├── carbon/                  # Carbon integration
│   │   │   ├── register.js
│   │   │   ├── renderers.js
│   │   │   └── components/
│   │   └── zoo/                     # Native components
│   │       ├── attributes.js
│   │       └── components/
│   ├── dom/                         # DOM utilities
│   ├── events/                      # Event types
│   ├── uri/                         # URI utilities
│   └── user/                        # User management
├── dist/                            # Build output
│   ├── zooy.es.js
│   ├── zooy.cjs.js
│   └── chunks/
└── sass/                            # SASS source files
    ├── main.scss
    ├── split.scss
    └── carbon.scss
```

## Exports

```javascript
import zooy from '@trintel/zooy';

// Main exports
zooy.EVT
zooy.Component
zooy.Panel
zooy.FormPanel
zooy.View
zooy.Conductor
zooy.Split
zooy.Dragger
zooy.UserManager
zooy.DataBinder
zooy.ComponentLibraryRegistry
zooy.registerCarbonLibrary
zooy.registerMdcLibrary
zooy.domUtils
zooy.uriUtils
zooy.handlers
zooy.zoo

// SASS exports
import '@trintel/zooy/sass';  // Main SASS entry point
```

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Linting

```bash
npm run lint        # Check
npm run lint:fix    # Auto-fix
```

### Pre-commit Hooks

Husky runs linting before commits.

## Code Quality

- ESLint with flat config
- JSDoc documentation
- Type annotations for IDE support
- Pre-commit hooks

## License

Apache-2.0
