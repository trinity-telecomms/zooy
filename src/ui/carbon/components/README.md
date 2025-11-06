# Carbon Component Modules

This directory contains extracted Carbon Design System component configurations.

## Why?

The original `renderers.js` file was over 1000 lines and growing. Extracting components into separate files makes the codebase:
- **More maintainable** - Each component is self-contained
- **Easier to test** - Components can be tested independently
- **Easier to navigate** - Find component logic quickly
- **Easier to extend** - Add new components without modifying a huge file

## Structure

Each component file exports a standard configuration object:

```javascript
export default {
  selector: 'cds-table',           // CSS selector for the component
  import: importFunction,          // Dynamic import for Carbon web component
  init: function(element) {        // Initialization function (optional)
    // Component-specific logic here
    // `this` refers to the CarbonRenderer instance
    // Access: this.listen(), this.dispatchPanelEvent(), this.user, etc.
  }
};
```

## How to Extract a Component

1. **Create new file**: `components/your-component.js`

2. **Copy the component config** from `renderers.js`

3. **Import dependencies** at the top:
   ```javascript
   import { getSemanticAttributes } from '../../zoo/index.js';
   const yourComponentImport = () => import('@carbon/web-components/es/components/your-component/index.js');
   ```

4. **Export the config**:
   ```javascript
   export default {
     selector: 'cds-your-component',
     import: yourComponentImport,
     init: function(element) {
       // ... initialization logic
     }
   };
   ```

5. **Add to** `components/index.js`:
   ```javascript
   import yourComponent from './your-component.js';

   export const components = [
     tableComponent,
     yourComponent,  // Add here
   ];
   ```

6. **Remove from** `renderers.js`:
   - Delete the component config entry
   - Delete the import function (if not used elsewhere)
   - Add a comment: `// your-component - extracted to components/your-component.js`

7. **Test**: Run `npm run build` and verify everything works

## Extracted Components

All Carbon components have been extracted into individual module files:

### Complex Interactive Components
- ✅ **table.js** - Data table with DataBinder integration, sorting, selection, batch actions
- ✅ **modal.js** - Modal dialogs with all sub-components (header, body, footer, buttons)
- ✅ **menu.js** - Menu and menu-button components with item selection
- ✅ **button.js** - All button variants (button, icon-button, copy-button, combo-button, fab, toggles)
- ✅ **dropdown.js** - Dropdown, combo-box, and multi-select components
- ✅ **date-picker.js** - Date picker (with range support) and time picker
- ✅ **file-uploader.js** - File upload with selection and deletion events
- ✅ **tabs.js** - Tabs, accordion, and content-switcher navigation components
- ✅ **breadcrumb.js** - Breadcrumb navigation and pagination

### Form Components
- ✅ **form-inputs.js** - Text input, textarea, number input, password input, search
- ✅ **form-controls.js** - Checkbox, radio button group, toggle, select, slider

### UI Components
- ✅ **tags.js** - Tag, dismissible tag, filter tag
- ✅ **lists.js** - Overflow menu, structured list, tree view
- ✅ **notifications.js** - Toast, inline, and actionable notifications
- ✅ **tiles.js** - Clickable, expandable, selectable, and radio tiles
- ✅ **progress.js** - Progress bar, progress indicator, inline loading
- ✅ **tooltips.js** - Tooltip, popover, toggletip

### Misc & Presentational
- ✅ **misc.js** - Link, code snippet
- ✅ **presentational.js** - Form structure (form, form-item, form-group, stack), typography (heading), icons (icon, icon-indicator, badge-indicator), loading (loading, skeleton-text, skeleton-placeholder)

## renderers.js

The `renderers.js` file now contains ONLY the framework code:
- Helper functions (scanForCarbonComponents, collectImportsNeeded, loadComponentImports, attachEventListeners)
- Component config merge (COMPONENT_CONFIG object that merges all extracted components)
- Main renderer (renderCarbonComponents function)

All component-specific logic has been extracted to individual files in this directory.

## Example: Table Component

See `table.js` for a complete example of an extracted component with:
- Multiple event handlers
- DataBinder integration
- Event delegation for dynamic content
- Search and sort integration
