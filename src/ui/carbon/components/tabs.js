/**
 * Carbon Tabs, Accordion, and Content Switcher Components
 *
 * Handles tabbed navigation, expandable accordions, and content switching.
 */

import { getSemanticAttributes } from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/tabs/tabs.js').default} CDSTabs
 * @typedef {import('@carbon/web-components/es/components/accordion/accordion.js').default} CDSAccordion
 * @typedef {import('@carbon/web-components/es/components/accordion/accordion-item.js').default} CDSAccordionItem
 * @typedef {import('@carbon/web-components/es/components/content-switcher/content-switcher.js').default} CDSContentSwitcher
 */

// noinspection JSFileReferences
const tabsImport = () => import('@carbon/web-components/es/components/tabs/index.js');
// noinspection JSFileReferences
const accordionImport = () => import('@carbon/web-components/es/components/accordion/index.js');
// noinspection JSFileReferences
const contentSwitcherImport = () => import('@carbon/web-components/es/components/content-switcher/index.js');

// Tabs
export default {
  selector: 'cds-tabs',
  import: tabsImport,
  /**
   * @param {CDSTabs} tabs - The CDSTabs custom element instance
   * @this {Panel} The panel instance
   */
  init: function (tabs) {
    const CDSTabs = customElements.get('cds-tabs');
    const attrs = getSemanticAttributes(tabs);

    // Before selection event (cancelable)
    const beforeSelectEvent = tabs.getAttribute('before-select-event');
    if (beforeSelectEvent) {
      this.listen(tabs, CDSTabs.eventBeforeSelect, e => {
        this.dispatchPanelEvent(beforeSelectEvent, {
          ...attrs,
          tabValue: e.detail.value,
          cancelable: true
        });
      });
    }

    // After selection event
    const selectEvent = attrs.event;
    if (selectEvent) {
      this.listen(tabs, CDSTabs.eventSelect, e => {
        const selectedTab = e.detail.item;
        const tabAttrs = getSemanticAttributes(selectedTab);
        this.dispatchPanelEvent(selectEvent, {
          ...attrs,
          ...tabAttrs,
          tabValue: e.detail.value
        });
      });
    }
  }
};

// Related navigation components
export const navigationComponents = {
  // Accordion
  'cds-accordion': {
    import: accordionImport,
    /**
     * @param {CDSAccordion} accordion - The CDSAccordion custom element instance
     * @this {Panel} The panel instance
     */
    init: function (accordion) {
      const CDSAccordionItem = customElements.get('cds-accordion-item');
      const attrs = getSemanticAttributes(accordion);

      // Listen for accordion item toggles
      const items = [...accordion.querySelectorAll('cds-accordion-item')];
      items.forEach(item => {
        const itemAttrs = getSemanticAttributes(item);
        const eventName = itemAttrs.event || attrs.event;

        if (eventName) {
          this.listen(item, CDSAccordionItem.eventToggle, e => {
            this.dispatchPanelEvent(eventName, {
              ...attrs,
              ...itemAttrs,
              open: e.detail.open
            });
          });
        }
      });
    }
  },

  // Content Switcher
  'cds-content-switcher': {
    import: contentSwitcherImport,
    /**
     * @param {CDSContentSwitcher} switcher - The CDSContentSwitcher custom element instance
     * @this {Panel} The panel instance
     */
    init: function (switcher) {
      const CDSContentSwitcher = customElements.get('cds-content-switcher');
      const attrs = getSemanticAttributes(switcher);

      // Before selection event (cancelable)
      const beforeSelectEvent = switcher.getAttribute('before-select-event');
      if (beforeSelectEvent) {
        this.listen(switcher, CDSContentSwitcher.eventBeforeSelect, e => {
          this.dispatchPanelEvent(beforeSelectEvent, {
            ...attrs,
            value: e.detail.value,
            cancelable: true
          });
        });
      }

      // After selection event
      const selectEvent = attrs.event;
      if (selectEvent) {
        this.listen(switcher, CDSContentSwitcher.eventSelect, e => {
          const selectedItem = e.detail.item;
          const itemAttrs = getSemanticAttributes(selectedItem);
          this.dispatchPanelEvent(selectEvent, {
            ...attrs,
            ...itemAttrs,
            value: selectedItem.getAttribute('value')
          });
        });
      }
    }
  }
};
