// noinspection JSFileReferences

/**
 * Selector to Imports Mapping
 *
 * Central registry mapping CSS selectors to their required Carbon Web Component imports.
 * This separates dependency management from component behavior configuration.
 *
 * Usage:
 *   const imports = imports['cds-button'];
 *   await Promise.all(imports.map(fn => fn()));
 */
// Layout & Structure
const accordionImport = () => import('@carbon/web-components/es/components/accordion/index.js');
const breadcrumbImport = () => import('@carbon/web-components/es/components/breadcrumb/index.js');
const stackImport = () => import('@carbon/web-components/es/components/stack/index.js');
const structuredListImport = () => import('@carbon/web-components/es/components/structured-list/index.js');
const tileImport = () => import('@carbon/web-components/es/components/tile/index.js');
const treeViewImport = () => import('@carbon/web-components/es/components/tree-view/index.js');

// Navigation
const linkImport = () => import('@carbon/web-components/es/components/link/index.js');
const tabsImport = () => import('@carbon/web-components/es/components/tabs/index.js');
const contentSwitcherImport = () => import('@carbon/web-components/es/components/content-switcher/index.js');
const menuImport = () => import('@carbon/web-components/es/components/menu/index.js');
const overflowMenuImport = () => import('@carbon/web-components/es/components/overflow-menu/index.js');

// Buttons & Actions
const buttonImport = () => import('@carbon/web-components/es/components/button/index.js');
const iconButtonImport = () => import('@carbon/web-components/es/components/icon-button/index.js');
const comboButtonImport = () => import('@carbon/web-components/es/components/combo-button/index.js');
const copyButtonImport = () => import('@carbon/web-components/es/components/copy-button/index.js');

// Form Controls
const checkboxImport = () => import('@carbon/web-components/es/components/checkbox/index.js');
const radioButtonImport = () => import('@carbon/web-components/es/components/radio-button/index.js');
const toggleImport = () => import('@carbon/web-components/es/components/toggle/index.js');
const selectImport = () => import('@carbon/web-components/es/components/select/index.js');
const sliderImport = () => import('@carbon/web-components/es/components/slider/index.js');

// Form Inputs
const textInputImport = () => import('@carbon/web-components/es/components/text-input/index.js');
const textareaImport = () => import('@carbon/web-components/es/components/textarea/index.js');
const numberInputImport = () => import('@carbon/web-components/es/components/number-input/index.js');
const passwordInputImport = () => import('@carbon/web-components/es/components/password-input/index.js');
const searchImport = () => import('@carbon/web-components/es/components/search/index.js');
const comboBoxImport = () => import('@carbon/web-components/es/components/combo-box/index.js');
const dropdownImport = () => import('@carbon/web-components/es/components/dropdown/index.js');
const multiSelectImport = () => import('@carbon/web-components/es/components/multi-select/index.js');
const datePickerImport = () => import('@carbon/web-components/es/components/date-picker/index.js');
const timePickerImport = () => import('@carbon/web-components/es/components/time-picker/index.js');
const fileUploaderImport = () => import('@carbon/web-components/es/components/file-uploader/index.js');

// Form Structure
const formImport = () => import('@carbon/web-components/es/components/form/index.js');
const formGroupImport = () => import('@carbon/web-components/es/components/form-group/index.js');

// Data Display
const dataTableImport = () => import('@carbon/web-components/es/components/data-table/index.js');
const paginationImport = () => import('@carbon/web-components/es/components/pagination/index.js');
const codeSnippetImport = () => import('@carbon/web-components/es/components/code-snippet/index.js');
const tagImport = () => import('@carbon/web-components/es/components/tag/index.js');
const badgeIndicatorImport = () => import('@carbon/web-components/es/components/badge-indicator/index.js');

// Feedback & Status
const notificationImport = () => import('@carbon/web-components/es/components/notification/index.js');
const loadingImport = () => import('@carbon/web-components/es/components/loading/index.js');
const inlineLoadingImport = () => import('@carbon/web-components/es/components/inline-loading/index.js');
const progressBarImport = () => import('@carbon/web-components/es/components/progress-bar/index.js');
const progressIndicatorImport = () => import('@carbon/web-components/es/components/progress-indicator/index.js');
const skeletonPlaceholderImport = () => import('@carbon/web-components/es/components/skeleton-placeholder/index.js');
const skeletonTextImport = () => import('@carbon/web-components/es/components/skeleton-text/index.js');

// Overlays & Popovers
const modalImport = () => import('@carbon/web-components/es/components/modal/index.js');
const tooltipImport = () => import('@carbon/web-components/es/components/tooltip/index.js');
const popoverImport = () => import('@carbon/web-components/es/components/popover/index.js');
const toggleTipImport = () => import('@carbon/web-components/es/components/toggle-tip/index.js');

// Typography & Icons
const headingImport = () => import('@carbon/web-components/es/components/heading/index.js');
const iconImport = () => import('@carbon/web-components/es/components/icon/index.js');
const iconIndicatorImport = () => import('@carbon/web-components/es/components/icon-indicator/index.js');


/**
 * Map of CSS selector to array of import functions
 * @type {Object<string, Function[]>}
 */
export const imports = {
  // Tables & Pagination
  'cds-table': [tooltipImport, buttonImport, textInputImport, searchImport, selectImport, paginationImport, dataTableImport],
  'cds-pagination': [selectImport, textInputImport, paginationImport],

  // Buttons
  'cds-button': [tooltipImport, buttonImport],
  'cds-icon-button:not([data-toggle])': [tooltipImport, iconButtonImport],
  'cds-icon-button[data-toggle]': [tooltipImport, iconButtonImport],
  'cds-button[data-fab]': [tooltipImport, buttonImport],
  'cds-copy-button': [tooltipImport, copyButtonImport],
  'cds-combo-button': [tooltipImport, comboButtonImport],

  // Form Controls
  'cds-checkbox': [checkboxImport],
  'cds-radio-button-group': [radioButtonImport],
  'cds-toggle': [toggleImport],
  'cds-select': [selectImport],
  'cds-slider': [sliderImport],

  // Form Inputs
  'cds-text-input': [textInputImport],
  'cds-textarea': [textareaImport],
  'cds-number-input': [numberInputImport],
  'cds-password-input': [tooltipImport, passwordInputImport],
  'cds-search': [searchImport],

  // Dropdown Components
  'cds-dropdown': [dropdownImport],
  'cds-combo-box': [comboBoxImport],
  'cds-multi-select': [multiSelectImport],

  // Date & Time
  'cds-date-picker': [datePickerImport],
  'cds-time-picker': [timePickerImport],

  // File Upload
  'cds-file-uploader': [fileUploaderImport],

  // Navigation - Tabs
  'cds-tabs': [tabsImport],
  'cds-accordion': [accordionImport],
  'cds-content-switcher': [contentSwitcherImport],

  // Navigation - Breadcrumbs
  'cds-breadcrumb': [breadcrumbImport],
  'cds-breadcrumb-item': [breadcrumbImport],
  'cds-breadcrumb-link': [breadcrumbImport],

  // Navigation - Menus
  'cds-menu': [menuImport],
  'cds-menu-button': [menuImport],

  // Lists
  'cds-overflow-menu': [overflowMenuImport],
  'cds-structured-list': [structuredListImport],
  'cds-tree-view': [treeViewImport],

  // Modals
  'cds-modal': [modalImport],
  'cds-modal-header': [modalImport],
  'cds-modal-heading': [modalImport],
  'cds-modal-label': [modalImport],
  'cds-modal-close-button': [modalImport],
  'cds-modal-body': [modalImport],
  'cds-modal-body-content': [modalImport],
  'cds-modal-footer': [modalImport],
  'cds-modal-footer-button': [modalImport],

  // Notifications
  'cds-toast-notification': [notificationImport],
  'cds-inline-notification': [notificationImport],
  'cds-actionable-notification': [notificationImport],

  // Tiles
  'cds-clickable-tile': [tileImport],
  'cds-expandable-tile': [tileImport],
  'cds-selectable-tile': [tileImport],
  'cds-radio-tile': [tileImport],

  // Progress
  'cds-progress-bar': [progressBarImport],
  'cds-progress-indicator': [progressIndicatorImport],
  'cds-inline-loading': [inlineLoadingImport],

  // Tooltips & Popovers
  'cds-tooltip': [tooltipImport],
  'cds-popover': [popoverImport],
  'cds-toggletip': [toggleTipImport],

  // Tags
  'cds-tag': [tagImport],
  'cds-dismissible-tag': [tagImport],
  'cds-filter-tag': [tagImport],

  // Miscellaneous
  'cds-link': [linkImport],
  'cds-code-snippet': [codeSnippetImport],

  // Presentational - Form Structure
  'cds-form': [formImport],
  'cds-form-item': [formImport],
  'cds-form-group': [formGroupImport],

  // Presentational - Layout
  'cds-stack': [stackImport],

  // Presentational - Typography & Icons
  'cds-heading': [headingImport],
  'cds-icon': [iconImport],
  'cds-icon-indicator': [iconIndicatorImport],
  'cds-badge-indicator': [badgeIndicatorImport],

  // Presentational - Loading States
  'cds-loading': [loadingImport],
  'cds-skeleton-text': [skeletonTextImport],
  'cds-skeleton-placeholder': [skeletonPlaceholderImport],
};
