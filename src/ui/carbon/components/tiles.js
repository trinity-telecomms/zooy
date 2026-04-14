/**
 * Carbon Tile Components
 *
 * Handles base tiles, clickable, expandable, selectable, radio tiles, and tile groups.
 */

import { getSemanticAttributes } from "../../zoo/index.js";

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/tile/tile.js').default} CDSTile
 * @typedef {import('@carbon/web-components/es/components/tile/clickable-tile.js').default} CDSClickableTile
 * @typedef {import('@carbon/web-components/es/components/tile/expandable-tile.js').default} CDSExpandableTile
 * @typedef {import('@carbon/web-components/es/components/tile/selectable-tile.js').default} CDSSelectableTile
 * @typedef {import('@carbon/web-components/es/components/tile/radio-tile.js').default} CDSRadioTile
 * @typedef {import('@carbon/web-components/es/components/tile/tile-group.js').default} CDSTileGroup
 */

/**
 * Base Tile (presentational)
 * @type {{selector: string}}
 */
export const cdsTileWrap = {
  selector: "cds-tile",
};

/**
 * Clickable Tile
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *): *&{href: *}}}
 */
export const cdsClickableTileWrap = {
  selector: "cds-clickable-tile",

  /**
   * @param {CDSClickableTile} tile - The CDSClickableTile custom element instance
   * @this {Panel} The panel instance
   */
  init: function (tile) {
    const attrs = getSemanticAttributes(tile);
    const eventName = attrs.event;

    if (eventName) {
      // Capture the intended href before removing it from the tile.
      // cds-clickable-tile extends CDSLink which renders a shadow <a> —
      // the reflected href property feeds into that anchor and causes
      // navigation even when we preventDefault on the host click.
      const href = attrs.href || tile.getAttribute("href") || "";
      tile.removeAttribute("href");

      // Use capture phase to intercept before the shadow anchor acts.
      tile.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dispatchPanelEvent(eventName, { ...attrs, href });
        },
        true,
      );
    }
  },
};

/**
 * Expandable Tile
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSExpandableTile): void}}
 */
export const cdsExpandableTileWrap = {
  selector: "cds-expandable-tile",

  /**
   * @param {CDSExpandableTile} tile - The CDSExpandableTile custom element instance
   * @this {Panel} The panel instance
   */
  init: function (tile) {
    const attrs = getSemanticAttributes(tile);

    // Before toggle event (cancelable)
    const beforeToggleEvent = tile.getAttribute("before-toggle-event");
    if (beforeToggleEvent) {
      this.listen(tile, "cds-expandable-tile-beingtoggled", (e) => {
        this.dispatchPanelEvent(beforeToggleEvent, {
          ...attrs,
          expanded: e.detail.expanded,
          cancelable: true,
        });
      });
    }

    // After toggle event
    const toggleEvent = attrs.event;
    if (toggleEvent) {
      this.listen(tile, "cds-expandable-tile-toggled", (e) => {
        this.dispatchPanelEvent(toggleEvent, {
          ...attrs,
          expanded: e.detail.expanded,
        });
      });
    }
  },
};

/**
 * Selectable Tile
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *, *): *&{selected: *, value: *}}}
 */
export const cdsSelectableTileWrap = {
  selector: "cds-selectable-tile",
  event: "cds-selectable-tile-changed",
  getData: (e, attrs, element) => ({
    ...attrs,
    selected: e.detail.selected,
    value: element.value,
  }),
};

/**
 * Radio Tile
 * @type {{selector: string, event: string, getData: function(*, *, *): *&{selected: *, name: *, value: *}}}
 */
export const cdsRadioTileWrap = {
  selector: "cds-radio-tile",
  event: "cds-radio-tile-selected",
  getData: (e, attrs, element) => ({
    ...attrs,
    selected: e.detail.selected,
    name: e.detail.name,
    value: element.value,
  }),
};

/**
 * Tile Group
 *
 * Container that manages groups of selectable or radio tiles.
 * Handles mutual exclusivity for radio tiles and multi-selection for selectable tiles.
 * Dispatches group-level events with the selected tile(s) value and name.
 *
 * @type {{selector: string, init: function(CDSTileGroup): void}}
 */
export const cdsTileGroupWrap = {
  selector: "cds-tile-group",

  /**
   * @param {CDSTileGroup} group - The CDSTileGroup custom element instance
   * @this {Panel} The panel instance
   */
  init: function (group) {
    const attrs = getSemanticAttributes(group);
    const eventName = attrs.event;

    if (!eventName) {
      return;
    }

    // Radio tile selection — single value
    this.listen(group, "cds-current-radio-tile-selection", (e) => {
      const tile = e.detail.target;
      this.dispatchPanelEvent(eventName, {
        ...attrs,
        value: tile?.value,
        name: tile?.name,
        selected: tile?.selected,
      });
    });

    // Selectable tile selections — array of values
    this.listen(group, "cds-current-selectable-tile-selections", (e) => {
      const tiles = e.detail.currentSelections || [];
      this.dispatchPanelEvent(eventName, {
        ...attrs,
        values: tiles.map((t) => t.value),
        names: tiles.map((t) => t.name),
        count: tiles.length,
      });
    });
  },
};
