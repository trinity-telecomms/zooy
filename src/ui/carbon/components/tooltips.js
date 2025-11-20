/**
 * Carbon Tooltip Components
 *
 * Handles tooltips, popovers, and toggletips.
 */

import {getSemanticAttributes, getEventAttribute} from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/tooltip/tooltip.js').default} CDSTooltip
 * @typedef {import('@carbon/web-components/es/components/popover/popover.js').default} CDSPopover
 * @typedef {import('@carbon/web-components/es/components/toggle-tip/toggletip.js').default} CDSToggletip
 */


/**
 * Tool Tip
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSTooltip): void}}
 */
export const cdsTooltipWrap = {
  selector: 'cds-tooltip',

  /**
   * @param {CDSTooltip} tooltip - The CDSTooltip custom element instance
   * @this {Panel} The panel instance
   */
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

/**
 * Popover
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSPopover): void}}
 */
export const cdsPopoverWrap = {
  selector: 'cds-popover',

  /**
   * @param {CDSPopover} popover - The CDSPopover custom element instance
   * @this {Panel} The panel instance
   */
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
}


/**
 * Toggletip - tooltip that stays open until dismissed
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSToggletip): void}}
 */
export const cdsToggletipWrap = {
  selector: 'cds-toggletip',

  /**
   * @param {CDSToggletip} toggletip - The CDSToggletip custom element instance
   * @this {Panel} The panel instance
   */
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
