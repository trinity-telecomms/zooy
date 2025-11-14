/**
 * Carbon Menu Components
 *
 * Handles menu and menu-button components with item selection.
 */

import { getSemanticAttributes, getEventAttribute } from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/menu/menu.js').default} CDSMenu
 * @typedef {import('@carbon/web-components/es/components/menu/menu-button.js').default} CDSMenuButton
 * @typedef {import('@carbon/web-components/es/components/menu/menu-item.js').default} CDSMenuItem
 */

// noinspection JSFileReferences
const menuImport = () => import('@carbon/web-components/es/components/menu/index.js');

// Main Menu component
export default {
  selector: 'cds-menu',
  import: menuImport,
  /**
   * @param {CDSMenu} menu - The CDSMenu custom element instance
   * @this {Panel} The panel instance
   */
  init: function (menu) {
    const attrs = getSemanticAttributes(menu);

    // Menu open event
    const openEvent = getEventAttribute(menu, 'open-event');
    if (openEvent) {
      this.listen(menu, 'cds-menu-opened', _ => {
        this.dispatchPanelEvent(openEvent, {
          ...attrs,
          action: 'opened'
        });
      });
    }

    // Menu close event
    const closeEvent = getEventAttribute(menu, 'close-event');
    if (closeEvent) {
      this.listen(menu, 'cds-menu-closed', _ => {
        this.dispatchPanelEvent(closeEvent, {
          ...attrs,
          action: 'closed'
        });
      });
    }

    // Menu item clicks
    this.listen(menu, 'click', e => {
      if (e.target.tagName === 'CDS-MENU-ITEM') {
        const menuItemAttrs = getSemanticAttributes(e.target);
        const eventName = menuItemAttrs.event || attrs.event;

        if (eventName) {
          e.stopPropagation();
          this.dispatchPanelEvent(eventName, {
            ...attrs,
            ...menuItemAttrs
          });
        }
      }
    });

    // Selectable menu item changes
    this.listen(menu, 'cds-item-changed', e => {
      const item = e.detail.triggeredBy;
      const itemAttrs = getSemanticAttributes(item);
      const eventName = itemAttrs.event || attrs.event;

      if (eventName) {
        this.dispatchPanelEvent(eventName, {
          ...attrs,
          ...itemAttrs,
          action: 'selection-changed'
        });
      }
    });
  }
};

// Menu Button component configuration
export const menuButtonComponent = {
  'cds-menu-button': {
    import: menuImport,
    /**
     * @param {CDSMenuButton} menuButton - The CDSMenuButton custom element instance
     * @this {Panel} The panel instance
     */
    init: function (menuButton) {
      const attrs = getSemanticAttributes(menuButton);

      // Listen for menu item selections
      const menu = menuButton.querySelector('cds-menu');
      if (menu) {
        this.listen(menu, 'click', e => {
          if (e.target.tagName === 'CDS-MENU-ITEM') {
            const menuItemAttrs = getSemanticAttributes(e.target);
            const eventName = menuItemAttrs.event || attrs.event;

            if (eventName) {
              e.stopPropagation();
              this.dispatchPanelEvent(eventName, {
                ...attrs,
                ...menuItemAttrs
              });
            }
          }
        });
      }
    }
  }
};
