# Carbon Component Modules

This directory contains Carbon Design System component configurations.

## Structure
Each component file exports a standard configuration object:

```javascript
export default {
  selector: 'cds-table',                    // CSS selector for the component
  import: [importFunction, annOtherImport], // Dynamic imports for Carbon web component
  init: function(element) {                 // Initialization function (optional)
    // Component-specific logic here
    // `this` refers to the Zooy Panel instance
    // Access: this.listen(), this.dispatchPanelEvent(), this.user, etc.
  }
};
```
