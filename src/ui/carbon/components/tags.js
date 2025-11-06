/**
 * Carbon Tag Components
 *
 * Handles regular tags, dismissible tags, and filter tags.
 */

import { getSemanticAttributes } from '../../zoo/index.js';

const tagImport = () => import('@carbon/web-components/es/components/tag/index.js');

// Tags - regular tags (click only, not closeable)
export default {
  selector: 'cds-tag',
  import: tagImport,
  event: 'click',
  getData: (e, attrs) => attrs
};

// Tag variant components
export const tagComponents = {
  // Dismissible tags (closeable tags with X button)
  'cds-dismissible-tag': {
    import: tagImport,
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
  },

  // Filter tags (closeable tags used for filters)
  'cds-filter-tag': {
    import: tagImport,
    event: 'cds-filter-tag-closed',
    getData: (e, attrs) => ({
      ...attrs,
      action: 'remove'
    })
  }
};
