/**
 * Carbon Progress Components
 *
 * Handles progress bars, progress indicators, and inline loading.
 */

import { getSemanticAttributes } from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/progress-bar/progress-bar.js').default} CDSProgressBar
 * @typedef {import('@carbon/web-components/es/components/progress-indicator/progress-indicator.js').default} CDSProgressIndicator
 * @typedef {import('@carbon/web-components/es/components/inline-loading/inline-loading.js').default} CDSInlineLoading
 */
// noinspection JSFileReferences
const progressBarImport = () => import('@carbon/web-components/es/components/progress-bar/index.js');
// noinspection JSFileReferences
const progressIndicatorImport = () => import('@carbon/web-components/es/components/progress-indicator/index.js');
// noinspection JSFileReferences
const inlineLoadingImport = () => import('@carbon/web-components/es/components/inline-loading/index.js');

// Progress Bar - monitors for completion
export default {
  selector: 'cds-progress-bar',
  import: progressBarImport,
  /**
   * @param {CDSProgressBar} progressBar - The CDSProgressBar custom element instance
   * @this {Panel} The panel instance
   */
  init: function (progressBar) {
    const attrs = getSemanticAttributes(progressBar);

    if (attrs.event) {
      const observer = new MutationObserver(() => {
        const value = parseFloat(progressBar.getAttribute('value') || '0');
        const max = parseFloat(progressBar.getAttribute('max') || '100');

        if (value >= max) {
          this.dispatchPanelEvent(attrs.event, {
            ...attrs,
            value: value,
            status: 'complete'
          });
        }
      });

      observer.observe(progressBar, {
        attributes: true,
        attributeFilter: ['value']
      });

      progressBar._progressObserver = observer;
    }
  }
};

// Other progress components
export const progressComponents = {
  // Progress Indicator
  'cds-progress-indicator': {
    import: progressIndicatorImport,
    /**
     * @param {CDSProgressIndicator} indicator - The CDSProgressIndicator custom element instance
     * @this {Panel} The panel instance
     */
    init: function (indicator) {
      const attrs = getSemanticAttributes(indicator);

      // Listen for step clicks
      this.listen(indicator, 'cds-progress-step-click', e => {
        // Get attributes from the clicked step
        const step = e.target;
        const stepAttrs = getSemanticAttributes(step);
        const eventName = stepAttrs.event || attrs.event;

        if (eventName) {
          this.dispatchPanelEvent(eventName, {
            ...attrs,
            ...stepAttrs,
            stepIndex: step.getAttribute('data-index'),
            stepLabel: step.getAttribute('label')
          });
        }
      });
    }
  },

  // Inline Loading - Loading indicator for inline actions (e.g., form submit)
  'cds-inline-loading': {
    import: inlineLoadingImport,
    /**
     * @param {CDSInlineLoading} inlineLoading - The CDSInlineLoading custom element instance
     * @this {Panel} The panel instance
     */
    init: function(inlineLoading) {
      const attrs = getSemanticAttributes(inlineLoading);

      // Success event - fires when status changes to 'finished'
      const successEvent = attrs.event;
      if (successEvent) {
        this.listen(inlineLoading, 'cds-inline-loading-onsuccess', _ => {
          this.dispatchPanelEvent(successEvent, {
            ...attrs,
            status: 'finished'
          });
        });
      }

      // Status change event (optional) - fires on any status change
      const statusEvent = inlineLoading.getAttribute('status-event');
      if (statusEvent) {
        // Monitor status attribute changes
        const observer = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.attributeName === 'status') {
              const status = inlineLoading.getAttribute('status');
              this.dispatchPanelEvent(statusEvent, {
                ...attrs,
                status: status
              });
            }
          });
        });

        observer.observe(inlineLoading, {
          attributes: true,
          attributeFilter: ['status']
        });

        inlineLoading._statusObserver = observer;
      }
    }
  }
};
