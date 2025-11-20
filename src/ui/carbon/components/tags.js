/**
 * Carbon Tag Components
 *
 * Handles regular tags, dismissible tags, and filter tags.
 */

import {getSemanticAttributes} from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/tag/tag.js').default} CDSTag
 * @typedef {import('@carbon/web-components/es/components/tag/dismissible-tag.js').default} CDSDismissibleTag
 * @typedef {import('@carbon/web-components/es/components/tag/filter-tag.js').default} CDSFilterTag
 */

/**
 * Tags - regular tags (click only, not closeable)
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *): *}}
 */
export const cdsTagsWrap = {
  selector: 'cds-tag',
  event: 'click',
  getData: (e, attrs) => attrs
};


/**
 * Dismissible tags (closeable tags with X button)
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSDismissibleTag): void}}
 */
export const cdsSDismissibleTagWrap = {
  selector: 'cds-dismissible-tag',

  /**
   * @param {CDSDismissibleTag} tag - The CDSDismissibleTag custom element instance
   * @this {Panel} The panel instance
   */
  init: function (tag) {
    const attrs = getSemanticAttributes(tag);

    // Click event (when tag body is clicked)
    const clickEvent = tag.getAttribute('click-event');
    if (clickEvent) {
      this.listen(tag, 'click', e => {
        // Don't fire if clicking the close button
        if (e.target.closest('button')) {
          return;
        }
        this.dispatchPanelEvent(clickEvent, {
          ...attrs
        });
      });
    }

    // Close event (when X button is clicked)
    const closeEvent = attrs.event;
    if (closeEvent) {
      this.listen(tag, 'cds-dismissible-tag-closed', _ => {
        this.dispatchPanelEvent(closeEvent, {
          ...attrs,
          action: 'closed'
        });
      });
    }
  }
}

/**
 * Filter tags (closeable tags used for filters)
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *): *&{action: string}}}
 */
export const cdsFilterTagWrap = {
    selector: 'cds-filter-tag',
    event: 'cds-filter-tag-closed',
    getData:
      (e, attrs) => ({
        ...attrs,
        action: 'remove'
      })
  }
;
