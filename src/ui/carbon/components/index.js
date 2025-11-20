/**
 * Carbon Component Configurations
 *
 * Aggregates all component wrappers from individual files.
 * Uses namespace imports to reduce verbosity.
 */

import * as table from './table.js';
import * as modal from './modal.js';
import * as menu from './menu.js';
import * as button from './button.js';
import * as dropdown from './dropdown.js';
import * as datePicker from './date-picker.js';
import * as fileUploader from './file-uploader.js';
import * as tabs from './tabs.js';
import * as breadcrumb from './breadcrumb.js';
import * as formInputs from './form-inputs.js';
import * as formControls from './form-controls.js';
import * as tags from './tags.js';
import * as lists from './lists.js';
import * as notifications from './notifications.js';
import * as tiles from './tiles.js';
import * as progress from './progress.js';
import * as tooltips from './tooltips.js';
import * as misc from './misc.js';
import * as presentational from './presentational.js';

/**
 * Extract all component wrappers from a module.
 * Filters for objects that have a 'selector' property (component wrappers).
 *
 * @param {Object} module - Module namespace object
 * @returns {Array} Array of component wrapper objects
 */
function extractWrappers(module) {
  return Object.values(module).filter(
    item => typeof item === 'object' && item !== null && item.selector
  );
}

/**
 * All component configurations aggregated from individual files.
 * Each wrapper must have at minimum a 'selector' property.
 */
export const components = [
  ...extractWrappers(table),
  ...extractWrappers(modal),
  ...extractWrappers(menu),
  ...extractWrappers(button),
  ...extractWrappers(dropdown),
  ...extractWrappers(datePicker),
  ...extractWrappers(fileUploader),
  ...extractWrappers(tabs),
  ...extractWrappers(breadcrumb),
  ...extractWrappers(formInputs),
  ...extractWrappers(formControls),
  ...extractWrappers(tags),
  ...extractWrappers(lists),
  ...extractWrappers(notifications),
  ...extractWrappers(tiles),
  ...extractWrappers(progress),
  ...extractWrappers(tooltips),
  ...extractWrappers(misc),
  ...extractWrappers(presentational),
];

/**
 * Build a Map of selector → component config.
 * Used by renderers.js for fast component lookup.
 *
 * @returns {Map<string, Object>} Map from CSS selector to component config
 */
export function buildComponentMap() {
  const componentMap = new Map();

  components.forEach(component => {
    componentMap.set(component.selector, component);
  });

  return componentMap;
}
