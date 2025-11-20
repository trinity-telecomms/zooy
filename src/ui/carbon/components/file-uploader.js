/**
 * Carbon File Uploader Component
 *
 * Handles file selection and deletion events.
 */

import { getSemanticAttributes } from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/file-uploader/file-uploader.js').default} CDSFileUploader
 */


/**
 * File Uploader
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSFileUploader): void}}
 */
export const cdsFileUploaderWrap = {
  selector: 'cds-file-uploader',

  /**
   * @param {CDSFileUploader} uploader - The CDSFileUploader custom element instance
   * @this {Panel} The panel instance
   */
  init: function (uploader) {
    const attrs = getSemanticAttributes(uploader);

    // File selection event (when files are added via file dialog)
    const changeEvent = attrs.event;
    if (changeEvent) {
      // Listen for native change event on the input element
      const input = uploader.querySelector('input[type="file"]');
      if (input) {
        this.listen(input, 'change', e => {
          this.dispatchPanelEvent(changeEvent, {
            ...attrs,
            files: Array.from(e.target.files || [])
          });
        });
      }
    }

    // File deletion event (when individual file items are deleted)
    const deleteEvent = uploader.getAttribute('delete-event');
    if (deleteEvent) {
      this.listen(uploader, 'cds-file-uploader-item-deleted', e => {
        this.dispatchPanelEvent(deleteEvent, {
          ...attrs,
          fileName: e.detail?.fileName,
          fileId: e.detail?.fileId
        });
      });
    }
  }
}
