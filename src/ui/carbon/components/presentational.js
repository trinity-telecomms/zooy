/**
 * Carbon Presentational Components
 *
 * Components that have no event handling, used purely for presentation.
 */

const formImport = () => import('@carbon/web-components/es/components/form/index.js');
const formGroupImport = () => import('@carbon/web-components/es/components/form-group/index.js');
const stackImport = () => import('@carbon/web-components/es/components/stack/index.js');
const headingImport = () => import('@carbon/web-components/es/components/heading/index.js');
const iconImport = () => import('@carbon/web-components/es/components/icon/index.js');
const iconIndicatorImport = () => import('@carbon/web-components/es/components/icon-indicator/index.js');
const loadingImport = () => import('@carbon/web-components/es/components/loading/index.js');
const skeletonTextImport = () => import('@carbon/web-components/es/components/skeleton-text/index.js');
const skeletonPlaceholderImport = () => import('@carbon/web-components/es/components/skeleton-placeholder/index.js');
const badgeIndicatorImport = () => import('@carbon/web-components/es/components/badge-indicator/index.js');

// All presentational components (no event handling, import only)
export const presentationalComponents = {
  // Form structure components (presentational only - no event handling needed)
  'cds-form': {
    import: formImport
    // No event handling - wraps native <form> which works naturally
  },

  'cds-form-item': {
    import: formImport
    // No event handling - presentational wrapper for form fields
  },

  'cds-form-group': {
    import: formGroupImport
    // No event handling - presentational fieldset wrapper
  },

  'cds-stack': {
    import: stackImport
    // No event handling - layout utility for spacing items vertically or horizontally
  },

  // Typography & Icons (Presentational)
  'cds-heading': {
    import: headingImport
    // No event handling - semantic heading component
  },

  'cds-icon': {
    import: iconImport
    // No event handling - icon display component
  },

  'cds-icon-indicator': {
    import: iconIndicatorImport
    // No event handling - status indicator icon
  },

  // Badge Indicator - Status badge component (typically used in tabs/icons)
  'cds-badge-indicator': {
    import: badgeIndicatorImport
    // No event handling - presentational status indicator
    // Typically appears as a dot on tabs or icons to show notifications/status
  },

  // Loading - Full-page or section loading spinner
  'cds-loading': {
    import: loadingImport
    // No event handling - presentational loading spinner
  },

  // Skeleton components - Loading placeholders
  'cds-skeleton-text': {
    import: skeletonTextImport
    // No event handling - presentational loading placeholder
  },

  'cds-skeleton-placeholder': {
    import: skeletonPlaceholderImport
    // No event handling - presentational loading placeholder
  }
};
