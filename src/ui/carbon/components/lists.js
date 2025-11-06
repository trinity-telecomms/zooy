/**
 * Carbon List Components
 *
 * Handles overflow menus, structured lists, and tree views.
 */

import { getSemanticAttributes, getEventAttribute } from '../../zoo/index.js';

const overflowMenuImport = () => import('@carbon/web-components/es/components/overflow-menu/index.js');
const structuredListImport = () => import('@carbon/web-components/es/components/structured-list/index.js');
const treeViewImport = () => import('@carbon/web-components/es/components/tree-view/index.js');

// Overflow Menu
export default {
  selector: 'cds-overflow-menu',
  import: overflowMenuImport,
  // We collect the menu attributes from the menu, but we listen for the
  // events on the menu body.
  init: function (overflowMenu) {
    const menuAttrs = getSemanticAttributes(overflowMenu);
    const eventName = menuAttrs.event;
    const menuBody = overflowMenu.querySelector('cds-overflow-menu-body');
    if (eventName && menuBody) {
      this.listen(menuBody, 'cds-overflow-menu-item-clicked', e => {
        e.stopPropagation();
        const itemAttrs = getSemanticAttributes(e.target);
        this.dispatchPanelEvent(eventName, {
          ...menuAttrs,
          ...itemAttrs
        });
      });
    }
  }
};

// Other list components
export const listComponents = {
  // Structured List
  'cds-structured-list': {
    import: structuredListImport,
    init: function (list) {
      const listAttrs = getSemanticAttributes(list);

      // Row clicks
      const rows = [...list.querySelectorAll('cds-structured-list-row')];
      rows.forEach(row => {
        const rowAttrs = getSemanticAttributes(row);
        const eventName = rowAttrs.event || listAttrs.event;

        if (eventName) {
          this.listen(row, 'click', e => {
            e.stopPropagation();
            this.dispatchPanelEvent(eventName, {
              ...listAttrs,
              ...rowAttrs
            });
          });
        }
      });

      // Selection changes (if selection enabled)
      if (list.hasAttribute('selection')) {
        this.listen(list, 'cds-structured-list-selected', e => {
          const selectedRow = e.detail.row;
          const rowAttrs = getSemanticAttributes(selectedRow);
          const selectionEvent = listAttrs.event;

          if (selectionEvent) {
            this.dispatchPanelEvent(selectionEvent, {
              ...listAttrs,
              ...rowAttrs
            });
          }
        });
      }
    }
  },

  // Tree View
  'cds-tree-view': {
    import: treeViewImport,
    init: function (tree) {
      const attrs = getSemanticAttributes(tree);

      // Listen for node selection
      this.listen(tree, 'cds-tree-node-selected', e => {
        const node = e.detail.node;
        const nodeAttrs = getSemanticAttributes(node);
        const eventName = nodeAttrs.event || attrs.event;

        if (eventName) {
          this.dispatchPanelEvent(eventName, {
            ...attrs,
            ...nodeAttrs,
            nodeId: node.id,
            label: node.getAttribute('label')
          });
        }
      });

      // Listen for node expansion
      const expandEvent = getEventAttribute(tree, 'expand-event');
      if (expandEvent) {
        this.listen(tree, 'cds-tree-node-expanded', e => {
          this.dispatchPanelEvent(expandEvent, {
            ...attrs,
            nodeId: e.detail.node.id,
            expanded: e.detail.expanded
          });
        });
      }
    }
  }
};
