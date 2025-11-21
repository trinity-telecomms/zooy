// noinspection JSValidateJSDoc

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * These are type-only imports that don't affect runtime behavior
 * @typedef {import('@carbon/web-components/es/components/pagination/pagination.js').default} CDSPagination
 */


/**
 * Standalone Table Pagination. We generate table pagination automatically on
 * the table component - so this may be dead weight.
 * @type {{selector: string, init: function(CDSPagination): void}}
 */
export const cdsPaginationWrap = {
  selector: 'cds-pagination',

  /**
   * Initialize a standalone pagination component.
   *
   * @param {CDSPagination} pagination - The CDSPagination custom element instance
   * @this {Panel} The panel instance
   */
  init: function (pagination) {
    const panel = this;
    const CDSPagination = customElements.get('cds-pagination');
    let lastNavigationOffset = null;

    panel.listen(pagination, CDSPagination.eventChangeCurrent, e => {
      const page = e.detail.page;
      const pageSize = pagination.pageSize;
      const offset = (page - 1) * pageSize;

      if (offset !== lastNavigationOffset) {
        lastNavigationOffset = offset;
        panel.dispatchPanelEvent("pagination-changed-current", {
          detail: {
            page, pageSize, action: 'page-change'
          }
        });
      }
    });

    panel.listen(pagination, CDSPagination.eventPageSizeChanged, _ => {
      const newPageSize = pagination.pageSize;
      lastNavigationOffset = null;
      panel.dispatchPanelEvent("pagination-changed-page-size", {
        detail: {
          page: 1, // Reset to page 1 when changing size
          pageSize: newPageSize, action: 'page-size-change'
        }
      });
    });
  }
}


