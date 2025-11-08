/**
 * Carbon Component Configurations
 *
 * Each component exports:
 * - selector: CSS selector for the component
 * - import: Dynamic import function for Carbon web component
 * - init: Initialization function called by CarbonRenderer
 */

// Complex components
import tableComponent, {paginationComponent} from './table.js';
import modalComponent, { modalSubComponents } from './modal.js';
import menuComponent, { menuButtonComponent } from './menu.js';
import buttonComponent, { buttonComponents } from './button.js';
import dropdownComponent, { dropdownComponents } from './dropdown.js';
import datePickerComponent, { timePickerComponent } from './date-picker.js';
import fileUploaderComponent from './file-uploader.js';
import tabsComponent, { navigationComponents } from './tabs.js';
import breadcrumbComponent, { breadcrumbComponents } from './breadcrumb.js';

// Form components
import formInputComponent, { formInputComponents } from './form-inputs.js';
import formControlComponent, { formControlComponents } from './form-controls.js';

// UI components
import tagComponent, { tagComponents } from './tags.js';
import listComponent, { listComponents } from './lists.js';
import notificationComponent, { notificationComponents } from './notifications.js';
import tileComponent, { tileComponents } from './tiles.js';
import progressComponent, { progressComponents } from './progress.js';
import tooltipComponent, { tooltipComponents } from './tooltips.js';
import miscComponent, { miscComponents } from './misc.js';

// Presentational components
import { presentationalComponents } from './presentational.js';

// Collect all primary component configs
export const components = [
  tableComponent,
  modalComponent,
  menuComponent,
  buttonComponent,
  dropdownComponent,
  datePickerComponent,
  fileUploaderComponent,
  tabsComponent,
  breadcrumbComponent,
  formInputComponent,
  formControlComponent,
  tagComponent,
  listComponent,
  notificationComponent,
  tileComponent,
  progressComponent,
  tooltipComponent,
  miscComponent
];

// Build the component map including all sub-components and variants
export function buildComponentMap() {
  const componentMap = new Map();

  // Add primary components
  components.forEach(component => {
    componentMap.set(component.selector, component);
  });

  // Add all component variants and sub-components
  const componentCollections = [
    modalSubComponents,
    menuButtonComponent,
    buttonComponents,
    dropdownComponents,
    timePickerComponent,
    navigationComponents,
    breadcrumbComponents,
    paginationComponent,
    formInputComponents,
    formControlComponents,
    tagComponents,
    listComponents,
    notificationComponents,
    tileComponents,
    progressComponents,
    tooltipComponents,
    miscComponents,
    presentationalComponents
  ];

  componentCollections.forEach(collection => {
    Object.entries(collection).forEach(([selector, config]) => {
      componentMap.set(selector, config);
    });
  });

  return componentMap;
}
