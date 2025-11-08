/**
 * Carbon Data Table Component
 *
 * Handles all data table initialization, events, and DataBinder integration.
 * Supports both client-side and server-side (DataBinder) data management.
 */

import {DataBinder} from '../../data-binder.js';
import {getSemanticAttributes} from '../../zoo/index.js';
import * as R from "ramda";
import {isDefAndNotNull} from "badu";

const dataTableImport = () => import('@carbon/web-components/es/components/data-table/index.js');
const paginationImport = () => import('@carbon/web-components/es/components/pagination/index.js');


// Pagination component
export const paginationComponent = {
  'cds-pagination': {
    import: paginationImport, init: function (pagination) {
      const panel = this;

      // Listen for user navigation and dispatch navigation events
      panel.listen(pagination, 'cds-pagination-changed-current', e => {
        panel.dispatchPanelEvent("pagination-changed-current", {
          detail: {
            page: e.detail.page, pageSize: pagination.pageSize, action: 'page-change'
          }
        });
      });

      // Listen for page size changes and dispatch navigation events
      panel.listen(pagination, 'cds-page-sizes-select-changed', e => {
        const newPageSize = pagination.pageSize;
        panel.dispatchPanelEvent("pagination-changed-page-size", {
          detail: {
            page: 1, // Reset to page 1 when changing size
            pageSize: newPageSize, action: 'page-size-change'
          }
        });
      });
    }
  }
};

/**
 * Setup row selection event handlers (individual rows and select-all).
 * @private
 */
const initEventHandlers = (panel, el, attrs) => {
  const selectionEvent = el.getAttribute('selection-event') || attrs.event;
  if (selectionEvent) {
    panel.listen(el, 'cds-table-row-change-selection', e => {
      panel.dispatchPanelEvent(selectionEvent, {
        ...attrs, selected: e.detail.selected, rowId: e.target.id
      });
    });
  }

  // Select all checkbox
  const selectAllEvent = el.getAttribute('select-all-event');
  if (selectAllEvent) {
    panel.listen(el, 'cds-table-change-selection-all', e => {
      panel.dispatchPanelEvent(selectAllEvent, {
        ...attrs, selected: e.detail.selected
      });
    });
  }

  // High-level synthetic event for row selection
  const rowSelectedEvent = el.getAttribute('row-selected-event');
  if (rowSelectedEvent) {
    panel.listen(el, 'cds-table-row-selected', e => {
      panel.dispatchPanelEvent(rowSelectedEvent, {
        ...attrs, selectedRows: e.detail.selectedRows || []
      });
    });
  }

  // High-level synthetic event for select-all
  const allSelectedEvent = el.getAttribute('all-selected-event');
  if (allSelectedEvent) {
    panel.listen(el, 'cds-table-row-all-selected', e => {
      panel.dispatchPanelEvent(allSelectedEvent, {
        ...attrs, selected: e.detail.selected
      });
    });
  }

  // Row click events
  const rowClickEvent = el.getAttribute('row-click-event');
  if (rowClickEvent) {
    panel.listen(el, 'click', e => {
      const row = e.target.closest('cds-table-row');
      if (!row || e.target.matches('cds-table-header-cell-checkbox, cds-table-cell-checkbox')) {
        return;
      }
      e.stopPropagation();
      const rowAttrs = getSemanticAttributes(row);
      panel.dispatchPanelEvent(rowClickEvent, {
        ...attrs, ...rowAttrs, rowId: row.id
      });
    });
  }

  // Expandable row toggle events
  const expandEvent = el.getAttribute('expand-event');
  if (expandEvent) {
    panel.listen(el, 'cds-table-row-expando-toggled', e => {
      panel.dispatchPanelEvent(expandEvent, {
        ...attrs, rowId: e.target.id, expanded: e.detail.expanded
      });
    });
  }

  const batchActionsElement = el.querySelector('cds-table-batch-actions');
  if (batchActionsElement) {
    const batchCancelEvent = el.getAttribute('batch-cancel-event');
    if (batchCancelEvent) {
      panel.listen(batchActionsElement, 'cds-table-batch-actions-cancel-clicked', _ => {
        panel.dispatchPanelEvent(batchCancelEvent, {
          ...attrs, action: 'cancel'
        });
      });
    }
    const batchSelectAllEvent = el.getAttribute('batch-select-all-event');
    if (batchSelectAllEvent) {
      panel.listen(batchActionsElement, 'cds-table-batch-actions-select-all-clicked', _ => {
        panel.dispatchPanelEvent(batchSelectAllEvent, {
          ...attrs, action: 'select-all'
        });
      });
    }
  }

  // Server-side sorting with DataBinder
  if (el.dataBinder) {
    el.addEventListener('cds-table-header-cell-sort', e => {
      // Prevent Carbon's client-side DOM sorting
      e.stopPropagation();
      e.preventDefault();

      const headerRow = el.querySelector('cds-table-header-row');
      const columns = [...headerRow.children];
      const columnIndex = columns.indexOf(e.target);
      const sortField = e.target.getAttribute('data-sort-field') || e.target.textContent.trim();

      // Manually update column sort states (since we prevented Carbon's handler)
      columns.forEach((col, idx) => {
        if (idx === columnIndex) {
          col.setAttribute('sort-active', 'true');
          col.setAttribute('sort-direction', e.detail.sortDirection);
        } else {
          col.removeAttribute('sort-active');
          col.setAttribute('sort-direction', 'none');
        }
      });

      // Reload data with DRF ordering parameter (e.g., ?ordering=name or ?ordering=-name)
      const ordering = e.detail.sortDirection === 'descending' ? `-${sortField}` : sortField;
      const params = {ordering};

      // Preserve current page size
      const pageSize = el.getAttribute('data-page-size');
      if (pageSize) {
        params.limit = parseInt(pageSize, 10);
      }

      el.dataBinder.getData(params).catch(err => {
        console.error('[Carbon Table] Sort load failed:', err);
      });
    }, {capture: true});
  } else {
    // Client-side sorting event dispatch (only if sort-event attribute is set)
    const sortEvent = el.getAttribute('sort-event');
    if (sortEvent) {
      panel.listen(el, 'cds-table-header-cell-sort', e => {
        panel.dispatchPanelEvent(sortEvent, {
          ...attrs, sortColumn: e.detail.columnId, sortDirection: e.detail.sortDirection
        });
      });
    }
  }

  // High-level sorted event (fires after sorting is complete)
  const sortedEvent = el.getAttribute('sorted-event');
  if (sortedEvent) {
    panel.listen(el, 'cds-table-sorted', e => {
      panel.dispatchPanelEvent(sortedEvent, {
        ...attrs, sortColumn: e.detail.columnId, sortDirection: e.detail.sortDirection
      });
    });
  }

  const searchElement = el.querySelector('cds-search');
  if (searchElement) {
    if (el.dataBinder) {
      panel.listen(searchElement, 'cds-search-input', e => {
        const params = {q: e.target.value};

        // Preserve custom page size if set
        const pageSize = el.getAttribute('data-page-size');
        if (pageSize) {
          params.limit = parseInt(pageSize, 10);
        }

        el.dataBinder.getData(params).catch(err => {
          console.error('[Carbon Table] Search load failed:', err);
        });
      });
    } else {
      const searchEvent = el.getAttribute('search-event');
      if (searchEvent) {
        panel.listen(searchElement, 'cds-search-input', e => {
          panel.dispatchPanelEvent(searchEvent, {
            ...attrs, searchTerm: e.target.value
          });
        });
      }
    }
  }

  // High-level filtered event
  const filteredEvent = el.getAttribute('filtered-event');
  if (filteredEvent) {
    panel.listen(el, 'cds-table-filtered', e => {
      panel.dispatchPanelEvent(filteredEvent, {
        ...attrs, searchTerm: e.detail.searchTerm
      });
    });
  }
};

const createPagination = (el, panel, dataBinder) => {
  const pagination = document.createElement('cds-pagination');

  pagination.backwardText = 'Previous page';
  pagination.forwardText = 'Next page';
  pagination.itemsPerPageText = 'Items per page:';
  pagination.pageSize = parseInt(el.getAttribute('data-page-size') || 0, 10);
  pagination.size = 'lg';

  const legalPageSizes = [10, 25, 50, 100, 500];
  legalPageSizes.forEach(size => {
    const selectItem = document.createElement('cds-select-item');
    selectItem.value = size.toString();
    selectItem.textContent = size.toString();
    pagination.appendChild(selectItem);
  });

  pagination.setData = (data, currentLimit, currentOffset) => {
    if (maybePaginated(data)) {
      const {count, next, previous} = R.pick(['count', 'next', 'previous'], data);

      // Parse limit and offset from next, previous, or use current values
      const hasNextPage = isDefAndNotNull(next);
      const hasPrevPage = isDefAndNotNull(previous);

      const url = hasNextPage ? new URL(next) : (hasPrevPage ? new URL(previous) : void 0);
      const limit = url ? parseInt(url.searchParams.get('limit'), 10) : currentLimit;
      const nowOffset = url ? parseInt(url.searchParams.get('offset'), 10) : currentOffset;
      const offset = hasNextPage ? nowOffset - limit : (currentOffset ? nowOffset + limit : currentOffset);

      const totalPages = Math.ceil(count / limit);
      const currentPage = Math.floor(offset / limit) + 1;

      // Use pagesUnknown mode for large datasets to avoid Carbon
      // rendering thousands of <option> elements
      const MAX_PAGES_FOR_DROPDOWN = 100;
      pagination.pagesUnknown = totalPages > MAX_PAGES_FOR_DROPDOWN;
      pagination.totalItems = count;
      pagination.totalPages = totalPages;
      pagination.pageSize = limit;
      pagination.page = currentPage;
      pagination.dataset.nextUrl = next || '';
      pagination.dataset.previousUrl = previous || '';
    }
  }

  // Listen for Carbon's native pagination events
  panel.listen(pagination, 'cds-pagination-changed-current', e => {
    const {page} = e.detail;
    const pageSize = pagination.pageSize;
    const params = {
      limit: pageSize, offset: (page - 1) * pageSize
    };
    dataBinder.getData(params).catch(err => {
      console.error('[Carbon Table] Pagination navigation failed:', err);
    });
  });

  panel.listen(pagination, 'cds-page-sizes-select-changed', e => {
    const pageSize = pagination.pageSize;
    const params = {
      limit: pageSize, offset: 0 // Reset to page 1
    };
    dataBinder.getData(params).then(() => {
      const {count} = dataBinder.data;
      if (count) {
        pagination.totalItems = count;
        pagination.totalPages = Math.ceil(count / pageSize);
      }
    }).catch(err => {
      console.error('[Carbon Table] Page size change failed:', err);
    });
  });

  el.after(pagination);
  return pagination;
}


/**
 * Create and configure a skeleton loader that matches the table structure.
 * @private
 */
const createSkeletonForTable = (panel, table) => {
  // Verify parent exists
  if (!table.parentNode) {
    console.error('[Carbon Table] Cannot create skeleton: table has no parent node');
    return;
  }

  // Interrogate table structure
  const hasTitle = !!table.querySelector('cds-table-header-title');
  const hasDescription = !!table.querySelector('cds-table-header-description');
  const hasToolbar = !!table.querySelector('cds-table-toolbar');
  const colCount = [...table.querySelectorAll('cds-table-header-cell')].length;
  const hasZebra = table.hasAttribute('zebra');
  const size = table.getAttribute('size');

  const skeleton = document.createElement('cds-table-skeleton');
  skeleton.showHeader = hasTitle || hasDescription;
  skeleton.showToolbar = hasToolbar;
  skeleton.zebra = hasZebra;
  skeleton.classList.add('fade-in');
  skeleton.columnCount = colCount;
  skeleton.size = size;

  // Create wrapper and overlay skeleton behind table
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  table.parentNode.insertBefore(wrapper, table);
  wrapper.appendChild(skeleton);
  wrapper.appendChild(table);

  // Position skeleton behind table
  Object.assign(skeleton.style, {
    position: 'absolute', top: '0', left: '0', width: '100%', zIndex: '0'
  });
  Object.assign(table.style, {
    position: 'relative', zIndex: '1', backgroundColor: 'transparent'
  });
  return skeleton;
};

/**
 * When a table defines a data-api-url attribute in its root element, we need to
 * fetch and bind the data to that element.
 * While we wait for the data, we render a placeholder component in the
 * dom, to let the user know we are still waiting for data.
 * @private
 */
const setupDataBinderIntegration = (panel, el) => {
  const apiUrl = el.getAttribute('data-api-url');
  const pageSize = parseInt(el.getAttribute('data-page-size') || 0, 10)
  if (apiUrl) {
    return new DataBinder(panel, apiUrl, el, {
      urlParams: {limit: pageSize},
    });
  }
}

/**
 * Check if response has DRF pagination structure (count + results keys)
 * @param {Object} json - Response object
 * @return {boolean}
 */
const maybePaginated = R.both(R.has('count'), R.has('results'));


export default {
  selector: 'cds-table', import: [dataTableImport, paginationImport],

  /**
   * Initialize the table component with event handlers and optional DataBinder.
   * @param {HTMLElement} el - The cds-table element
   */
  init: function (el) {
    const attrs = getSemanticAttributes(el);
    const panel = this;

    const dataBinder = setupDataBinderIntegration(panel, el);
    if (isDefAndNotNull(dataBinder)) {
      el.dataBinder = dataBinder;
      const skeleton = createSkeletonForTable(panel, el);
      const paginator = createPagination(el, panel, dataBinder);
      attrs.limit = paginator.pageSize;
      dataBinder.getData(attrs).then(_ => {
        skeleton.remove();
        paginator.setData(dataBinder.data, dataBinder.limit, dataBinder.offset);
      });
    }
    initEventHandlers(panel, el, attrs);
  }
};



