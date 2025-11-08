# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1-beta.4] - 2025-11-09

### Fixed
- **Pagination Performance for Large Datasets**: Fixed browser freeze when paginating tables with tens of thousands of pages
  - Carbon pagination component was generating 33k+ `<option>` elements for the page dropdown
  - Now automatically uses `pagesUnknown` mode for datasets with >100 pages
  - In `pagesUnknown` mode, shows simple text display instead of dropdown
  - Previous/Next buttons still work normally
  - Significantly improves performance for large datasets (e.g., 332,550 items = 33,255 pages)

### Changed
- **Pagination Page Dropdown**: Adaptive behavior based on dataset size
  - Small datasets (≤100 pages): Full dropdown with all page numbers
  - Large datasets (>100 pages): Text display showing current page and total pages
  - Threshold configurable via `MAX_PAGES_FOR_DROPDOWN` constant

## [1.0.1-beta.3] - 2025-11-08

### Added
- **Automatic Table Pagination**: Tables with `data-api-url` now automatically create and configure pagination components
  - Pagination component created dynamically when table has paginated data
  - Automatically wired to DataBinder for page navigation
  - Supports page size selection (10, 25, 50, 100, 500 items per page)
  - Updates total items, total pages, and current page from API response
  - No manual configuration required - fully automatic
- **Component Import Dependencies**: Component system now supports arrays of imports
  - Components can declare multiple import dependencies: `import: [tableImport, paginationImport]`
  - All imports loaded in parallel before component initialization
  - Declarative dependency management - no manual import calls needed
  - Uses application-level cache (Conductor) and browser module cache

### Changed
- **Automatic Server-Side Sorting**: DataBinder tables now automatically sort on the backend
  - No longer requires `sort-event` attribute on table
  - Tables with `data-api-url` automatically do server-side sorting
  - Sends `ordering` parameter to Django REST Framework API
  - Prevents Carbon's client-side alphabetic DOM sorting
  - Client-side sorting event dispatch still available via `sort-event` attribute for non-DataBinder tables
- **Carbon Table Component**: Improved code organization and clarity
  - Pagination event listeners moved into `createPagination()` function
  - Better separation of concerns - pagination logic encapsulated
  - Table init function simplified and more readable
- **Component Renderer**: Enhanced to support array imports
  - `collectImportsNeeded()` now handles both single imports and arrays
  - Automatically flattens import arrays into unique set
  - Backward compatible - single imports still work

### Fixed
- **Numeric Column Sorting**: Fixed tables sorting numeric columns alphabetically
  - Server-side sorting now properly enabled for DataBinder tables
  - Django backend performs correct numeric/text sorting based on field type
  - Removed client-side sorting that was treating numbers as strings

### Removed
- **Debug Logging**: Removed all debug console.log statements from production code
  - Cleaned up DataBinder debug logs (`templateId`, `dataPath`, etc.)
  - Cleaned up table pagination debug logs (`DING`, `DONG`)
  - Error logging (console.error/warn) retained for legitimate issues

## [1.0.1-beta.2] - 2025-11-07

### Changed
- **DataBinder Architecture**: Complete refactor to single-binder pattern (BREAKING CHANGE)
  - Constructor now requires URL and root element: `new DataBinder(url, root, options)`
  - One binder instance per root element (stored on `element.dataBinder`)
  - Binder systematically walks root to find all consumers with `data-bind-template`
  - Consumers specify `data-path` attribute for slicing JSON response
  - Binder instance is reused for sort, search, pagination operations
  - `getData(params)` method fetches data with query parameters and renders all consumers
  - `setData(data)` is convergence point, stores full JSON object and calls render()
  - `render()` walks root for consumers and renders each with appropriate data slice
  - `render()` now supports both simple property binding AND template-based rendering
- **DataBinder Rendering Logic**: Unified rendering implementation for code quality
  - `#renderSimpleBindings()` is now parameterized and reusable
  - Accepts `(element, data, index, options)` parameters
  - Options control behavior: `removeOnCondition` and `removeAttributes` flags
  - Same method serves both root-level simple bindings and template item rendering
  - Eliminated duplicate methods: `#bindContent()` and `#bindAttributes()` removed
- **DataBinder Pagination Support**: Full Django REST Framework pagination integration
  - Automatic detection of DRF pagination format (`{count, next, previous, results}`)
  - Parses `offset` from URL for pagination-aware row numbering
  - Dispatches custom pagination events with metadata (count, limit, offset, page, etc.)
  - `$index` and `$index1` now account for offset across pages
  - Page 1 (offset=0): rows 1-10, Page 2 (offset=10): rows 11-20, etc.
- **Carbon Table Integration**: Updated to use new DataBinder API
  - Sort handler calls `table.dataBinder.getData({ordering})`
  - Search handler calls `table.dataBinder.getData({q})`
  - Pagination handler calls `table.dataBinder.getData({limit, offset})`
  - Single binder instance handles all table operations
- **Carbon Pagination Component**: Two-way event communication with DataBinder
  - Listens for pagination metadata from DataBinder
  - Dispatches navigation events on user interaction
  - Supports `data-pagination-event` attribute for event matching

### Added
- **Simple Property Binding**: DataBinder now supports direct property binding without templates
  - Use `data-bind` on existing elements to bind JSON properties to textContent
  - Use `data-bind-attr` to bind properties to element attributes
  - Use `data-bind-show-if` / `data-bind-hide-if` for conditional rendering
  - Binding attributes are preserved for re-rendering when `getData()` is called again
  - Enables 4 use cases: simple binding, template repetition, multiple consumers, mixed mode
- **Pagination-Aware Row Numbering**: `$index` and `$index1` special variables now account for pagination offset
  - Enables continuous row numbering across paginated data
  - Example: Page 1 shows rows 1-10, Page 2 shows rows 11-20, etc.
- **DataBinder Documentation**: Comprehensive documentation rewrite
  - File-level JSDoc organized by 4 use cases with complete HTML + JavaScript examples
  - Reference sections: binding attributes, special variables, DRF pagination, custom fetch
  - Shows conditional rendering, formatters, and mixed simple/template binding patterns
  - Updated `.claude/databinder-architecture.md` with current API
  - Documented pagination support and event flow

### Removed
- **DataBinder Static Methods**: Removed deprecated provider/consumer pattern methods (BREAKING CHANGE)
  - `DataBinder.initializeFromProvider()` - replaced by `new DataBinder(url, root, options)`
  - `DataBinder.initializeAll()` - no longer needed with new architecture
  - Component integrations now create single binder instance directly

### Fixed
- **Carbon Table Interactions**: Fixed table sorting, searching, and pagination after refactor
  - Handlers now use stored `table.dataBinder` instance instead of static methods
  - All table operations work correctly with new single-binder pattern

## [1.0.1-beta.1] - 2025-11-06

### Added
- **Zoo Components**: New namespace for native zooy components styled via CSS custom properties
  - `zoo-tag` - Generic tag/badge component with token-based styling
  - Components organized in `src/ui/zoo/components/` directory
  - Exported via `zooy.zoo` namespace
- **Design Token System**: CSS custom property-based theming
  - Applications define tokens in their own stylesheets
  - Zoo components consume tokens via `--zoo-tag-{token}-bg/fg` pattern
  - No framework-provided base tokens (application responsibility)
- **Zoo Interactive Pattern Documentation**: Future design pattern for panel-aware components
  - Documented in `.claude/zoo-interactive-components-pattern.md`
  - Native components with built-in panel awareness
  - No registration required (unlike third-party libraries)

### Changed
- **Zoo Tag Token Type**: Changed from `Number` to `String` for maximum flexibility
  - Supports numeric tokens: `<zoo-tag token="52">`
  - Supports named tokens: `<zoo-tag token="error">`
  - Supports any string value for token attribute
- **Project Structure**: Aligned zoo folder structure with carbon conventions
  - `src/ui/zoo/components/tag.js` (was `zoo-tag.js`)
  - `src/ui/zoo/components/index.js` exports all components
- **Carbon Data Table**: Enhanced table component with semantic attributes support
  - Table skeleton now matches table `size` property (xs, sm, md, lg, xl)
  - Table-level semantic attributes now passed to row click events
  - `row-click-event` attribute enables clickable rows with data from `data-bind-attr`
  - Improved integration with DataBinder for dynamic table content
- **Carbon Semantic Attributes**: Enhanced semantic attribute handling across components
  - `getSemanticAttributes()` utility properly extracts framework and custom attributes
  - Consistent attribute merging pattern across all Carbon components
  - Better separation between framework attributes (event, record-id) and data-* attributes
- **Documentation**: Major cleanup of README.md
  - Removed non-technical content, history, and editorial commentary
  - Focused on developer-centric documentation
  - Improved scannability with consistent formatting

### Fixed
- **Carbon Overflow Menu**: Fixed variable shadowing bug in overflow menu handler
  - Menu-level attributes now properly merge with item-level attributes
  - Changed `menuAttr` to `menuAttrs` and added `itemAttrs` for clarity
  - Overflow menu items now properly include both menu-level and item-level semantic attributes in events
- **DataBinder Nested Templates**: DataBinder now correctly handles data-bind attributes at any depth
  - Templates can have nested structure (e.g., tags inside table cells)
  - `renderItem()` walks DOM tree to find all data-bind elements, not just direct children
  - Enables complex cell layouts with multiple bindable elements

### Removed
- **Unused CSS Build Scripts**: Removed `build_css` and `dev_watch_sass` npm scripts
  - Zooy exports source SASS files, not compiled CSS
  - Applications compile SASS themselves
- **Framework Base Tokens**: Removed unused design-tokens directory from zooy
  - `src/sass/design-tokens/tag-tokens.scss` deleted
  - Applications define all tokens in their own stylesheets
  - Cleaner separation of concerns

## [36.1.0] - 2025-10-31

### Added
- Icon toggle support for Carbon icon buttons via CSS classes
- New `carbon-icons.scss` with `.off-icon` and `.on-icon` classes for icon visibility toggling
- Enhanced `cds-icon-button[data-toggle="true"]` handler to detect and support icon-swap mode
- When `.icon-toggle-wrapper` is present, toggles between two icons via CSS display property
- Maintains backward compatibility with original color/opacity toggle mode

### Changed
- Icon toggle buttons now use CSS-driven visibility toggling instead of DOM manipulation
- JavaScript only manages `is-selected` attribute, CSS handles all visual changes

## [35.3.0] - 2025-10-22

### Changed
- **Build System Migration**: Migrated from Rollup to Vite for faster builds and better DX
  - Build time improved by 44% (2.91s → 1.63s)
  - Simplified configuration with modern defaults
- **Minification**: Replaced Terser with esbuild
  - Faster minification with better tree-shaking
  - Bundle sizes reduced by 14-27% across all outputs
  - Removed 10 unnecessary dependencies
- **Project Structure**: Modernized output directory structure
  - Build outputs now go to `dist/` directory (not committed to git)
  - Dual format support: `dist/zooy.es.js` (ES modules) and `dist/zooy.cjs.js` (CommonJS)
  - Updated `package.json` with proper `exports` field for Node.js compatibility
  - Added `files` field to control npm package contents
- **Documentation**: Updated all documentation to reflect new build system
  - Updated README.md with correct paths and bundle sizes
  - Cleaned up project structure documentation
  - Removed obsolete build scripts

### Removed
- Rollup and related plugins (`@rollup/plugin-*`)
- Terser minifier (replaced by esbuild)
- `build/` directory containing obsolete linting scripts
- `rollup.config.js` (replaced by `vite.config.js`)

### Added
- Vite build system with library mode configuration
- Modern package.json exports for better module resolution
- Updated bundle size metrics:
  - Core framework: ~101KB (~27KB gzipped)
  - MDC library: ~463KB (~62KB gzipped)
  - Carbon library: ~34KB (~7KB gzipped)

## [35.2.0] - 2025-10-16

### Fixed
- **Carbon Modal Component Detection**: Fixed `scanForCarbonComponents()` to check the panel element itself, not just descendants. Previously, when a panel WAS a Carbon component (e.g., `<cds-modal>`), it would not be initialized because `querySelectorAll()` only finds descendants.
- **Carbon Modal Close Events**: Carbon modals now properly emit `destroy_me` event on all close methods (close button, ESC key, backdrop click). Fixed by always emitting `destroy_me` regardless of template attributes.
- **Form Submission with Footer Buttons**: Submit buttons can now be placed outside forms using HTML5 `form` attribute. Button renderer now checks both `button.closest('form')` and `button.getAttribute('form')` to find associated forms.

### Added
- **Carbon Modal Footer Support**: Added initialization for `cds-modal-footer-button` with same form submission handling as `cds-button`
- **HTML5 Form Association**: Carbon buttons now support HTML5 `form="form-id"` attribute for buttons outside form elements
- **Debug Logging**: Added comprehensive console logging for Carbon modal initialization and event handling (temporary, for development)

### Changed
- Carbon button renderer now handles buttons outside form boundaries via HTML5 form attribute
- Modal close events are no longer configurable - modals MUST destroy their panel when closed

## [35.1.1] - 2025-10-16

### Removed
- Removed unused panel event handlers:
  - `search_by_qdict` from SearchHandlers
  - `add_q_dict_kv` from QueryParamHandlers
  - `remove_q_dict_k` from QueryParamHandlers
  - `nav_back` from NavigationHandlers (entire module removed)

### Added
- Added comprehensive handler migration guide (`docs/migration/HANDLER_MIGRATION.md`)
- Organized documentation into structured `docs/` directory:
  - `docs/architecture/` - Architecture documentation
  - `docs/migration/` - Migration guides
  - `docs/guides/` - Usage guides
- Added standard project files (LICENSE, CHANGELOG.md, CONTRIBUTING.md)

### Changed
- Exported handler collections through public API (`zooy.handlers`)
- Sanitized documentation files for developer use (removed progress tracking)

## [35.1.0] - 2025-10-16

### Changed
- Refactored panel event handlers into composable, opt-in collections
- Extracted MDC-specific handlers into separate modules
- Updated View class to use new handler collection pattern

### Added
- Handler collection system:
  - `MdcTreeHandlers` - MDC tree component handlers
  - `SearchHandlers` - Search and filter handlers
  - `QueryParamHandlers` - URL query parameter handlers
  - `DialogHandlers` - Dialog/modal handlers
  - `FormHandlers` - Form submission handlers
- `addHandlers()` helper method for composing handler collections

## [35.0.0] - 2025

### Added
- Component Library Registry system for pluggable UI libraries
- Carbon Design System integration (IBM Carbon Web Components)
- Lazy-loading support for component libraries
- Dynamic component imports with caching
- Carbon icon sprite management
- Programmatic icon API

### Changed
- Refactored Panel to be component-library-agnostic
- Migrated from MDC-only to multi-library support
- Updated build system for code-splitting (Rollup)
- Improved bundling strategy (reduced initial bundle size)

### Deprecated
- Direct MDC integration (now isolated in `mdc/` modules)
- Tight coupling between Panel and component libraries

## Earlier Versions

Previous versions focused on MDC (Material Design Components) integration
and core framework features. See git history for detailed changes.

---

## Migration Guides

- **Handler Migration**: See `docs/migration/HANDLER_MIGRATION.md` for breaking changes in v35.1.0+
- **Carbon Migration**: See `docs/migration/CARBON_MIGRATION.md` for migrating from MDC to Carbon

## Links

- [Repository](https://github.com/gumm/zooy)
- [Issue Tracker](https://github.com/gumm/zooy/issues)
