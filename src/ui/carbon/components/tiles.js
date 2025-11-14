/**
 * Carbon Tile Components
 *
 * Handles clickable, expandable, selectable, and radio tiles.
 */

import { getSemanticAttributes } from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/tile/clickable-tile.js').default} CDSClickableTile
 * @typedef {import('@carbon/web-components/es/components/tile/expandable-tile.js').default} CDSExpandableTile
 * @typedef {import('@carbon/web-components/es/components/tile/selectable-tile.js').default} CDSSelectableTile
 * @typedef {import('@carbon/web-components/es/components/tile/radio-tile.js').default} CDSRadioTile
 */
// noinspection JSFileReferences
const tileImport = () => import('@carbon/web-components/es/components/tile/index.js');

// Clickable Tile
export default {
  selector: 'cds-clickable-tile',
  import: tileImport,
  event: 'click',
  getData: (e, attrs) => ({
    ...attrs,
    href: e.currentTarget.getAttribute('href')
  })
};

// Other tile components
export const tileComponents = {
  // Expandable Tile
  'cds-expandable-tile': {
    import: tileImport,
    /**
     * @param {CDSExpandableTile} tile - The CDSExpandableTile custom element instance
     * @this {Panel} The panel instance
     */
    init: function (tile) {
      const attrs = getSemanticAttributes(tile);

      // Before toggle event (cancelable)
      const beforeToggleEvent = tile.getAttribute('before-toggle-event');
      if (beforeToggleEvent) {
        this.listen(tile, 'cds-expandable-tile-beingtoggled', e => {
          this.dispatchPanelEvent(beforeToggleEvent, {
            ...attrs,
            expanded: e.detail.expanded,
            cancelable: true
          });
        });
      }

      // After toggle event
      const toggleEvent = attrs.event;
      if (toggleEvent) {
        this.listen(tile, 'cds-expandable-tile-toggled', e => {
          this.dispatchPanelEvent(toggleEvent, {
            ...attrs,
            expanded: e.detail.expanded
          });
        });
      }
    }
  },

  // Selectable Tile
  'cds-selectable-tile': {
    import: tileImport,
    event: 'cds-selectable-tile-changed',
    getData: (e, attrs, element) => ({
      ...attrs,
      selected: e.detail.selected,
      value: element.value
    })
  },

  // Radio Tile
  'cds-radio-tile': {
    import: tileImport,
    event: 'cds-selectable-tile-changed',
    getData: (e, attrs, element) => ({
      ...attrs,
      selected: e.detail.selected,
      value: element.value
    })
  }
};
