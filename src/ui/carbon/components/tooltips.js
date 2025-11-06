/**
 * Carbon Tooltip Components
 *
 * Handles tooltips, popovers, and toggletips.
 */

import { getSemanticAttributes, getEventAttribute } from '../../zoo/index.js';

const tooltipImport = () => import('@carbon/web-components/es/components/tooltip/index.js');
const popoverImport = () => import('@carbon/web-components/es/components/popover/index.js');
const toggleTipImport = () => import('@carbon/web-components/es/components/toggle-tip/index.js');

// Tooltip
export default {
  selector: 'cds-tooltip',
  import: tooltipImport,
  init: function (tooltip) {
    const attrs = getSemanticAttributes(tooltip);

    // Listen for tooltip open/close
    const openEvent = getEventAttribute(tooltip, 'open-event');
    if (openEvent) {
      this.listen(tooltip, 'cds-tooltip-beingopened', _ => {
        this.dispatchPanelEvent(openEvent, {
          ...attrs,
          action: 'opened'
        });
      });
    }

    const closeEvent = getEventAttribute(tooltip, 'close-event');
    if (closeEvent) {
      this.listen(tooltip, 'cds-tooltip-closed', _ => {
        this.dispatchPanelEvent(closeEvent, {
          ...attrs,
          action: 'closed'
        });
      });
    }
  }
};

// Other tooltip components
export const tooltipComponents = {
  // Popover
  'cds-popover': {
    import: popoverImport,
    init: function (popover) {
      const attrs = getSemanticAttributes(popover);

      // Listen for popover open/close
      const openEvent = getEventAttribute(popover, 'open-event');
      if (openEvent) {
        this.listen(popover, 'cds-popover-beingopened', _ => {
          this.dispatchPanelEvent(openEvent, {
            ...attrs,
            action: 'opened'
          });
        });
      }

      const closeEvent = getEventAttribute(popover, 'close-event');
      if (closeEvent) {
        this.listen(popover, 'cds-popover-closed', _ => {
          this.dispatchPanelEvent(closeEvent, {
            ...attrs,
            action: 'closed'
          });
        });
      }
    }
  },

  // Toggletip - tooltip that stays open until dismissed
  'cds-toggletip': {
    import: toggleTipImport,
    init: function (toggletip) {
      const attrs = getSemanticAttributes(toggletip);

      // Monitor open/close state changes
      if (attrs.event) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.attributeName === 'open') {
              const isOpen = toggletip.hasAttribute('open');
              this.dispatchPanelEvent(attrs.event, {
                ...attrs,
                action: isOpen ? 'opened' : 'closed',
                open: isOpen
              });
            }
          });
        });

        observer.observe(toggletip, {
          attributes: true,
          attributeFilter: ['open']
        });

        toggletip._toggletipObserver = observer;
      }
    }
  }
};
