/**
 * Carbon Data Table Component
 *
 * Handles all data table initialization, events, and DataBinder integration.
 * Supports both client-side and server-side (DataBinder) data management.
 *
 * ====================================================================
 * USAGE: Server-Side Data Binding
 * ====================================================================
 * Tables with data-api-url automatically fetch and bind data from an API endpoint.
 *
 * @example
 * <cds-table data-api-url="/api/users/" data-page-size="25">
 *   <cds-table-head>
 *     <cds-table-header-row>
 *       <cds-table-header-cell data-sort-field="name">Name</cds-table-header-cell>
 *       <cds-table-header-cell data-sort-field="email">Email</cds-table-header-cell>
 *     </cds-table-header-row>
 *   </cds-table-head>
 *   <cds-table-body>
 *     <template id="user-row">
 *       <cds-table-row>
 *         <cds-table-cell data-bind="name"></cds-table-cell>
 *         <cds-table-cell data-bind="email"></cds-table-cell>
 *       </cds-table-row>
 *     </template>
 *     <cds-table-body data-bind-template="user-row" data-path="results"></cds-table-body>
 *   </cds-table-body>
 * </cds-table>
 *
 * Features:
 * - Automatic pagination component creation
 * - Skeleton loader while fetching initial data
 * - Server-side sorting (sends ordering parameter to API)
 * - Server-side search (triggers on Enter key or clear button, sends q parameter to API)
 * - Pagination navigation (sends limit/offset parameters)
 * - DataBinder stored on table.dataBinder for programmatic access
 *
 * Search Behavior:
 * - Press Enter in search box to trigger server-side search
 * - Click clear (X) button to reset search and reload full dataset
 * - Prevents API spam by not searching on every keystroke
 *
 * ====================================================================
 * USAGE: Client-Side Event Dispatch
 * ====================================================================
 * Tables without data-api-url dispatch panel events for manual handling.
 *
 * @example
 * <cds-table
 *   selection-event="user-selected"
 *   sort-event="table-sorted"
 *   search-event="table-searched">
 *   <!-- Table content -->
 * </cds-table>
 *
 * Event attributes:
 * - selection-event: Row checkbox toggled
 * - select-all-event: Select all checkbox toggled
 * - row-click-event: Row clicked (excludes checkbox clicks)
 * - expand-event: Expandable row toggled
 * - sort-event: Column header clicked
 * - search-event: Search input changed
 * - batch-cancel-event: Batch actions cancel clicked
 * - batch-select-all-event: Batch actions select all clicked
 *
 * ====================================================================
 * CARBON WEB COMPONENTS BUG WORKAROUND
 * ====================================================================
 * Carbon's cds-pagination-changed-current event fires twice per navigation
 * due to a bug in their LitElement implementation. This component includes
 * offset-based deduplication to prevent duplicate API calls.
 *
 * See: pagination event handlers in initEventHandlers() and paginationComponent
 */

import {DataBinder} from '../../data-binder.js';
import {getSemanticAttributes} from '../../zoo/index.js';
import * as R from "ramda";
import {isDefAndNotNull} from "badu";

const dataTableImport = () => import('@carbon/web-components/es/components/data-table/index.js');
const paginationImport = () => import('@carbon/web-components/es/components/pagination/index.js');


/**
 * Standalone pagination component configuration.
 *
 * Registers standalone <cds-pagination> elements (not created by tables) with the
 * component system. Includes Carbon double-fire bug workaround to prevent duplicate
 * panel event dispatches.
 *
 * This is separate from table-integrated pagination which handles data fetching.
 * Standalone pagination dispatches panel events that application code can listen to.
 */
export const paginationComponent = {
  'cds-pagination': {
    import: paginationImport, init: function (pagination) {
      const panel = this;

      // Carbon Web Components fires cds-pagination-changed-current twice per navigation.
      // Track last offset to deduplicate panel events.
      let lastNavigationOffset = null;

      // Listen for user navigation and dispatch navigation events
      panel.listen(pagination, 'cds-pagination-changed-current', e => {
        const page = e.detail.page;
        const pageSize = pagination.pageSize;
        const offset = (page - 1) * pageSize;

        // Only dispatch if we're actually navigating to a different offset
        if (offset !== lastNavigationOffset) {
          lastNavigationOffset = offset;
          panel.dispatchPanelEvent("pagination-changed-current", {
            detail: {
              page, pageSize, action: 'page-change'
            }
          });
        }
      });

      // Listen for page size changes and dispatch navigation events
      panel.listen(pagination, 'cds-page-sizes-select-changed', e => {
        const newPageSize = pagination.pageSize;
        // Reset the navigation offset when page size changes
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
};

/**
 * Initialize all event handlers for a data table.
 *
 * Sets up listeners for:
 * - Row selection (individual and select-all)
 * - Row clicks
 * - Expandable row toggles
 * - Batch actions (cancel, select-all)
 * - Sorting (server-side with DataBinder, or client-side event dispatch)
 * - Search input (server-side with DataBinder, or client-side event dispatch)
 * - Pagination navigation (when DataBinder is present)
 *
 * @param {zooy.Panel} panel - Panel instance
 * @param {HTMLElement} el - The cds-table element
 * @param {Object} attrs - Semantic attributes from the table element
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

      el.dataBinder.fetchData(params).catch(err => {
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

  // Search input - support both cds-search and cds-table-toolbar-search
  const searchElement = el.querySelector('cds-table-toolbar-search');
  if (searchElement) {
    if (el.dataBinder) {
      // Server-side search: only trigger on Enter key or clear button

      // Handle Enter key to trigger search
      panel.listen(searchElement, 'keydown', e => {
        if (e.key === 'Enter') {
          const searchValue = searchElement.value || '';
          const params = {q: searchValue};
          el.dataBinder.fetchData(params).catch(err => {
            console.error('[Carbon Table] Search load failed:', err);
          });
        }
      });

      // Handle clear button click (value becomes empty)
      panel.listen(searchElement, 'cds-search-input', e => {
        const searchValue = e.detail.value || '';
        // Only act when value is cleared (user clicked X button)
        if (searchValue === '') {
          const params = {q: ''};
          el.dataBinder.fetchData(params).catch(err => {
            console.error('[Carbon Table] Search clear failed:', err);
          });
        }
      });
    } else {
      // Client-side search: dispatch event on every keystroke (existing behavior)
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

  // Wire up pagination listeners.
  if (el.dataBinder && el.pagination) {
    // Carbon Web Components fires cds-pagination-changed-current twice per navigation.
    // This happens because the click handler sets this.page++ (triggering LitElement's
    // reactive update) and then explicitly calls _handleUserInitiatedChangeStart(),
    // and then updated() lifecycle also calls _handleUserInitiatedChangeStart() when
    // it detects the page property changed. Track last fetched offset to deduplicate.
    let lastFetchedOffset = null;

    panel.listen(el.pagination, 'cds-pagination-changed-current', e => {
      const {page} = e.detail;
      const pageSize = el.pagination.pageSize;
      const offset = (page - 1) * pageSize;

      // Only fetch if we're actually navigating to a different offset
      if (offset !== lastFetchedOffset) {
        lastFetchedOffset = offset;
        const params = {limit: pageSize, offset};
        el.dataBinder.fetchData(params).catch(err => {
          console.error('[Carbon Table] Pagination navigation failed:', err);
        });
      }
    });

    panel.listen(el.pagination, 'cds-page-sizes-select-changed', e => {
      const pageSize = el.pagination.pageSize;
      const params = {
        limit: pageSize, offset: 0 // Reset to page 1
      };
      el.dataBinder.fetchData(params).then(() => {
        el.pagination.setData(el.dataBinder.data, pageSize);
      }).catch(err => {
        console.error('[Carbon Table] Page size change failed:', err);
      });
    });
  }

};

/**
 * Create and configure a Carbon pagination component for a data-bound table.
 *
 * The pagination component:
 * - Shows page size options: 10, 25, 50, 100, 500
 * - Automatically uses pagesUnknown mode for datasets with >100 pages (prevents browser freeze)
 * - Has a custom setData() method to update pagination state from DRF API responses
 * - Stores next/previous URLs in dataset attributes
 *
 * @param {HTMLElement} el - The cds-table element
 * @param {DataBinder} dataBinder - DataBinder instance for the table
 * @return {HTMLElement} The configured cds-pagination element
 * @private
 */
const createPagination = (el, dataBinder) => {
  const pagination = document.createElement('cds-pagination');

  pagination.backwardText = 'Previous page';
  pagination.forwardText = 'Next page';
  pagination.itemsPerPageText = 'Items per page:';
  pagination.pageSize = dataBinder.limit;
  pagination.size = 'lg';

  [10, 25, 50, 100, 500].forEach(size => {
    const selectItem = document.createElement('cds-select-item');
    selectItem.value = size.toString();
    selectItem.textContent = size.toString();
    pagination.appendChild(selectItem);
  });

  /**
   * Custom method to update pagination state from DRF API response.
   * Parses count, next, previous from response and updates pagination properties.
   * Automatically enables pagesUnknown mode for large datasets (>100 pages).
   *
   * @param {Object} data - DRF API response with count, next, previous, results
   * @param {number} currentLimit - Current page size limit
   */
  pagination.setData = (data, currentLimit) => {
    if (maybePaginated(data)) {
      const {count, next, previous} = R.pick(['count', 'next', 'previous'], data);

      // Parse limit and offset from next, previous, or use current values
      const hasNextPage = isDefAndNotNull(next);
      const hasPrevPage = isDefAndNotNull(previous);

      const url = hasNextPage ? new URL(next) : (hasPrevPage ? new URL(previous) : void 0);
      const limit = url ? parseInt(url.searchParams.get('limit'), 10) : currentLimit;
      const totalPages = Math.ceil(count / limit);

      // Use pagesUnknown mode for large datasets to avoid Carbon
      // rendering thousands of <option> elements
      const MAX_PAGES_FOR_DROPDOWN = 100;
      pagination.pagesUnknown = totalPages > MAX_PAGES_FOR_DROPDOWN;
      pagination.totalItems = count;
      pagination.dataset.nextUrl = next || '';
      pagination.dataset.previousUrl = previous || '';
    }
  }
  return pagination;
}


/**
 * Create and configure a skeleton loader that matches the table structure.
 * @private
 */
const createSkeleton = (table) => {
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
    position: 'relative', zIndex: '1',
  });
  return skeleton;
};

/**
 * Set up DataBinder integration for a table with data-api-url attribute.
 *
 * Checks for data-api-url attribute and creates a DataBinder instance if present.
 * The DataBinder will fetch data from the API and bind it to the table using
 * data-bind attributes.
 *
 * @param {zooy.Panel} panel - Panel instance
 * @param {HTMLElement} el - The cds-table element
 * @return {DataBinder|undefined} DataBinder instance if data-api-url is present, undefined otherwise
 * @private
 */
const setupDataBinderIntegration = (panel, el) => {
  const apiUrl = el.getAttribute('data-api-url');
  const pageSize = parseInt(el.getAttribute('data-page-size') || 25, 10)
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
   * Initialize a Carbon data table component.
   *
   * Initialization flow:
   * 1. Extract semantic attributes from table element
   * 2. Check for data-api-url attribute to determine if DataBinder is needed
   * 3. If DataBinder:
   *    - Create DataBinder instance with configured page size
   *    - Create and show skeleton loader
   *    - Create pagination component
   *    - Fetch initial data
   *    - Remove skeleton and configure pagination when data arrives
   *    - Set up event handlers after data is loaded (prevents duplicate initial fetch)
   * 4. If no DataBinder:
   *    - Set up event handlers immediately for client-side behavior
   *
   * @param {HTMLElement} el - The cds-table element
   */
  init: function (el) {
    const attrs = getSemanticAttributes(el);
    const panel = this;

    const dataBinder = setupDataBinderIntegration(panel, el);
    if (isDefAndNotNull(dataBinder)) {
      el.dataBinder = dataBinder;
      const skeleton = createSkeleton(el);
      const pagination = createPagination(el, dataBinder);
      el.pagination = pagination;
      el.after(pagination);

      // Fetch initial data with only the page size parameter
      dataBinder.fetchData().then(_ => {
        skeleton.remove();
        pagination.setData(dataBinder.data, dataBinder.limit);
        initEventHandlers(panel, el, attrs);
      });
    } else {
      // No data binding, set up event handlers immediately
      initEventHandlers(panel, el, attrs);
    }
  }
};



