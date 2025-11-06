/**
 * Carbon Tabs, Accordion, and Content Switcher Components
 *
 * Handles tabbed navigation, expandable accordions, and content switching.
 */

import { getSemanticAttributes } from '../../zoo/index.js';

const tabsImport = () => import('@carbon/web-components/es/components/tabs/index.js');
const accordionImport = () => import('@carbon/web-components/es/components/accordion/index.js');
const contentSwitcherImport = () => import('@carbon/web-components/es/components/content-switcher/index.js');

// Tabs
export default {
  selector: 'cds-tabs',
  import: tabsImport,
  init: function (tabs) {
    const attrs = getSemanticAttributes(tabs);

    // Before selection event (cancelable)
    const beforeSelectEvent = tabs.getAttribute('before-select-event');
    if (beforeSelectEvent) {
      this.listen(tabs, 'cds-tabs-beingselected', e => {
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
      this.listen(tabs, 'cds-tabs-selected', e => {
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
    init: function (accordion) {
      const attrs = getSemanticAttributes(accordion);

      // Listen for accordion item toggles
      const items = [...accordion.querySelectorAll('cds-accordion-item')];
      items.forEach(item => {
        const itemAttrs = getSemanticAttributes(item);
        const eventName = itemAttrs.event || attrs.event;

        if (eventName) {
          this.listen(item, 'cds-accordion-item-toggled', e => {
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
    init: function (switcher) {
      const attrs = getSemanticAttributes(switcher);

      // Before selection event (cancelable)
      const beforeSelectEvent = switcher.getAttribute('before-select-event');
      if (beforeSelectEvent) {
        this.listen(switcher, 'cds-content-switcher-beingselected', e => {
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
        this.listen(switcher, 'cds-content-switcher-selected', e => {
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
