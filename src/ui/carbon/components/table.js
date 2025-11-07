/**
 * Carbon Data Table Component
 *
 * Handles all data table initialization, events, and DataBinder integration.
 * Supports both client-side and server-side (DataBinder) data management.
 */

import {DataBinder} from '../../data-binder.js';
import { getSemanticAttributes } from '../../zoo/index.js';

const dataTableImport = () => import('@carbon/web-components/es/components/data-table/index.js');

/**
 * Setup row selection event handlers (individual rows and select-all).
 * @private
 */
const setupSelectionEvents = (component, table, attrs) => {
  // Individual row selection
  const selectionEvent = table.getAttribute('selection-event') || attrs.event;
  if (selectionEvent) {
    component.listen(table, 'cds-table-row-change-selection', e => {
      component.dispatchPanelEvent(selectionEvent, {
        ...attrs,
        selected: e.detail.selected,
        rowId: e.target.id
      });
    });
  }

  // Select all checkbox
  const selectAllEvent = table.getAttribute('select-all-event');
  if (selectAllEvent) {
    component.listen(table, 'cds-table-change-selection-all', e => {
      component.dispatchPanelEvent(selectAllEvent, {
        ...attrs,
        selected: e.detail.selected
      });
    });
  }

  // High-level synthetic event for row selection
  const rowSelectedEvent = table.getAttribute('row-selected-event');
  if (rowSelectedEvent) {
    component.listen(table, 'cds-table-row-selected', e => {
      component.dispatchPanelEvent(rowSelectedEvent, {
        ...attrs,
        selectedRows: e.detail.selectedRows || []
      });
    });
  }

  // High-level synthetic event for select-all
  const allSelectedEvent = table.getAttribute('all-selected-event');
  if (allSelectedEvent) {
    component.listen(table, 'cds-table-row-all-selected', e => {
      component.dispatchPanelEvent(allSelectedEvent, {
        ...attrs,
        selected: e.detail.selected
      });
    });
  }
};

/**
 * Setup row interaction event handlers (clicks and expand/collapse).
 * @private
 */
const setupRowInteractionEvents = (component, table, attrs) => {
  // Row click events
  const rowClickEvent = table.getAttribute('row-click-event');
  if (rowClickEvent) {
    component.listen(table, 'click', e => {
      const row = e.target.closest('cds-table-row');

      // Ignore clicks on checkboxes or non-row elements
      if (!row || e.target.matches('cds-table-header-cell-checkbox, cds-table-cell-checkbox')) {
        return;
      }

      e.stopPropagation();
      const rowAttrs = getSemanticAttributes(row);
      component.dispatchPanelEvent(rowClickEvent, {
        ...attrs,
        ...rowAttrs,
        rowId: row.id
      });
    });
  }

  // Expandable row toggle events
  const expandEvent = table.getAttribute('expand-event');
  if (expandEvent) {
    component.listen(table, 'cds-table-row-expando-toggled', e => {
      component.dispatchPanelEvent(expandEvent, {
        ...attrs,
        rowId: e.target.id,
        expanded: e.detail.expanded
      });
    });
  }
};

/**
 * Setup sort event handlers for client-side sorting.
 * @private
 */
const setupSortEvents = (component, table, attrs) => {
  const sortEvent = table.getAttribute('sort-event');
  if (sortEvent) {
    component.listen(table, 'cds-table-header-cell-sort', e => {
      component.dispatchPanelEvent(sortEvent, {
        ...attrs,
        sortColumn: e.detail.columnId,
        sortDirection: e.detail.sortDirection
      });
    });
  }

  // High-level sorted event (fires after sorting is complete)
  const sortedEvent = table.getAttribute('sorted-event');
  if (sortedEvent) {
    component.listen(table, 'cds-table-sorted', e => {
      component.dispatchPanelEvent(sortedEvent, {
        ...attrs,
        sortColumn: e.detail.columnId,
        sortDirection: e.detail.sortDirection
      });
    });
  }
};

/**
 * Setup batch action event handlers.
 * @private
 */
const setupBatchActionEvents = (component, table, attrs) => {
  const batchActionsElement = table.querySelector('cds-table-batch-actions');
  if (!batchActionsElement) {
    return;
  }

  const batchCancelEvent = table.getAttribute('batch-cancel-event');
  if (batchCancelEvent) {
    component.listen(batchActionsElement, 'cds-table-batch-actions-cancel-clicked', _ => {
      component.dispatchPanelEvent(batchCancelEvent, {
        ...attrs,
        action: 'cancel'
      });
    });
  }

  const batchSelectAllEvent = table.getAttribute('batch-select-all-event');
  if (batchSelectAllEvent) {
    component.listen(batchActionsElement, 'cds-table-batch-actions-select-all-clicked', _ => {
      component.dispatchPanelEvent(batchSelectAllEvent, {
        ...attrs,
        action: 'select-all'
      });
    });
  }
};

/**
 * Setup search/filter event handlers for client-side filtering.
 * @private
 */
const setupSearchEvents = (component, table, attrs) => {
  const searchElement = table.querySelector('cds-search');
  if (!searchElement) {
    return;
  }

  const searchEvent = table.getAttribute('search-event');
  if (searchEvent) {
    component.listen(searchElement, 'cds-search-input', e => {
      component.dispatchPanelEvent(searchEvent, {
        ...attrs,
        searchTerm: e.target.value
      });
    });
  }

  // High-level filtered event
  const filteredEvent = table.getAttribute('filtered-event');
  if (filteredEvent) {
    component.listen(table, 'cds-table-filtered', e => {
      component.dispatchPanelEvent(filteredEvent, {
        ...attrs,
        searchTerm: e.detail.searchTerm
      });
    });
  }
};

/**
 * Disable sorting on all header cells (used while table is empty/loading).
 * @private
 */
const disableTableSorting = (table) => {
  const headerRow = table.querySelector('cds-table-header-row');
  if (!headerRow) return;

  const headerCells = [...headerRow.children];
  headerCells.forEach(cell => {
    if (cell.isSortable) {
      cell.isSortable = false;
      cell.setAttribute('data-was-sortable', 'true'); // Remember it was sortable
    }
  });
};

/**
 * Enable sorting on header cells that were previously sortable.
 * @private
 */
const enableTableSorting = (table) => {
  const headerRow = table.querySelector('cds-table-header-row');
  if (!headerRow) return;

  const headerCells = [...headerRow.children];
  headerCells.forEach(cell => {
    if (cell.getAttribute('data-was-sortable') === 'true') {
      cell.isSortable = true;
      cell.removeAttribute('data-was-sortable');
    }
  });
};

/**
 * Create and configure a skeleton loader that matches the table structure.
 * @private
 */
const createSkeletonForTable = (component, table) => {
  // Verify parent exists
  if (!table.parentNode) {
    console.error('[Carbon Table] Cannot create skeleton: table has no parent node');
    return;
  }

  const skeleton = document.createElement('cds-table-skeleton');
  skeleton.classList.add('fade-in');

  // Interrogate table structure
  const hasTitle = !!table.querySelector('[slot="title"]');
  const hasDescription = !!table.querySelector('[slot="description"]');
  const hasToolbar = !!table.querySelector('cds-table-toolbar, [slot="toolbar"]');
  const headerRow = table.querySelector('cds-table-header-row');

  // Configure skeleton to match table
  // Note: Carbon skeleton defaults to showHeader=true and showToolbar=true
  skeleton.showHeader = hasTitle || hasDescription;
  skeleton.showToolbar = hasToolbar;
  skeleton.zebra = table.hasAttribute('zebra');

  // Set column count from actual table headers
  if (headerRow) {
    skeleton.columnCount = headerRow.children.length;
  }

  // Match table size attribute
  const size = table.getAttribute('size');
  if (size && ['xs', 'sm', 'md', 'lg', 'xl'].includes(size)) {
    skeleton.size = size;
  }

  component.debugMe(
    `[Carbon Table] Skeleton created: columns=${skeleton.columnCount}, ` +
    `showHeader=${skeleton.showHeader}, showToolbar=${skeleton.showToolbar}, ` +
    `size=${skeleton.size || 'default'}, zebra=${skeleton.zebra}`
  );

  // Create wrapper and overlay skeleton behind table
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';

  // Insert wrapper before table
  table.parentNode.insertBefore(wrapper, table);

  // Add both elements to wrapper
  wrapper.appendChild(skeleton);
  wrapper.appendChild(table);

  // Position skeleton behind table
  Object.assign(skeleton.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    zIndex: '0'
  });

  // Position table on top with transparent background
  Object.assign(table.style, {
    position: 'relative',
    zIndex: '1',
    backgroundColor: 'transparent'
  });

  // Disable sorting while table is empty
  disableTableSorting(table);

  // Log to help debug
  console.log('[Carbon Table] Skeleton element:', skeleton);
  console.log('[Carbon Table] Skeleton in DOM:', document.body.contains(skeleton));

  // Return skeleton so caller can remove it later
  return skeleton;
};

/**
 * Setup server-side sort handler for DataBinder tables (provider/consumer pattern).
 * @private
 */
const setupDataBinderSortHandler = (component, provider) => {
  provider.addEventListener('cds-table-header-cell-sort', e => {
    // Prevent Carbon's client-side DOM sorting
    e.stopPropagation();
    e.preventDefault();

    const headerRow = provider.querySelector('cds-table-header-row');
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

    // Disable sorting during reload to prevent rapid clicks
    disableTableSorting(provider);

    // Reload data with DRF ordering parameter (e.g., ?ordering=name or ?ordering=-name)
    const ordering = e.detail.sortDirection === 'descending' ? `-${sortField}` : sortField;
    const params = { ordering };

    // Preserve custom page size if set
    const pageSize = provider.getAttribute('data-page-size');
    if (pageSize) {
      params.limit = parseInt(pageSize, 10);
    }

    // Refetch using existing binder instance
    if (!provider.dataBinder) {
      console.error('[Carbon Table] No dataBinder found on table');
      enableTableSorting(provider);
      return;
    }

    provider.dataBinder.getData(params)
      .then(() => {
        // Re-enable sorting when new data arrives
        enableTableSorting(provider);
      })
      .catch(err => {
        console.error('[Carbon Table] Sort load failed:', err);
        // Re-enable even on error
        enableTableSorting(provider);
      });
  }, { capture: true });
}

/**
 * Setup server-side search handler for DataBinder tables (provider/consumer pattern).
 * @private
 */
const setupDataBinderSearchHandler = (component, provider) => {
  const searchElement = provider.querySelector('cds-search');
  if (!searchElement) {
    return;
  }

  component.listen(searchElement, 'cds-search-input', e => {
    const params = { q: e.target.value };

    // Preserve custom page size if set
    const pageSize = provider.getAttribute('data-page-size');
    if (pageSize) {
      params.limit = parseInt(pageSize, 10);
    }

    // Refetch using existing binder instance
    if (!provider.dataBinder) {
      console.error('[Carbon Table] No dataBinder found on table');
      return;
    }

    provider.dataBinder.getData(params).catch(err => {
      console.error('[Carbon Table] Search load failed:', err);
    });
  });
};

/**
 * Setup pagination navigation handler for DataBinder tables.
 * Listens for pagination navigation events (dispatched by pagination component)
 * and refetches data with new page/size parameters.
 * @private
 */
const setupPaginationNavigationHandler = (component, table) => {
  // Get pagination event name from table, or use default
  const paginationEventName = table.getAttribute('data-pagination-event');
  if (!paginationEventName) {
    return; // No pagination event configured
  }

  // Listen for pagination navigation events
  component.listen(document, `${paginationEventName}-navigate`, e => {
    const { page, pageSize, action } = e.detail;

    // Build params object for getData()
    const params = { limit: pageSize };

    if (action === 'page-change') {
      // Calculate offset for requested page
      params.offset = (page - 1) * pageSize;
      component.debugMe(`[Carbon Table] Pagination navigate to page ${page} (offset=${params.offset})`);
    } else if (action === 'page-size-change') {
      // Change page size, reset to page 1
      params.offset = 0;
      component.debugMe(`[Carbon Table] Page size changed to ${pageSize}`);
    }

    // Refetch using existing binder instance
    if (!table.dataBinder) {
      console.error('[Carbon Table] No dataBinder found on table');
      return;
    }

    table.dataBinder.getData(params).catch(err => {
      console.error('[Carbon Table] Pagination navigation failed:', err);
    });
  });
};

/**
 * Setup DataBinder integration using provider/consumer pattern.
 * Tables with data-api-url act as providers, their descendants with
 * data-bind-template act as consumers.
 * @private
 */
const setupDataBinderIntegration = async (component, table, attrs) => {
  // Check if this table has a data-api-url
  const apiUrl = table.getAttribute('data-api-url');
  if (!apiUrl) {
    return; // Not a DataBinder table
  }

  // Check if table has any consumers (descendants with data-bind-template)
  const consumers = table.querySelectorAll('[data-bind-template]');
  if (consumers.length === 0) {
    component.debugMe('[Carbon Table] Table has no consumers with data-bind-template');
    return;
  }

  try {
    // Create and overlay skeleton loader
    const skeleton = createSkeletonForTable(component, table);

    // Create ONE DataBinder for the table
    const binder = new DataBinder(apiUrl, table, {
      fetchFn: (url) => component.user.fetchJson(url, component.abortController.signal)
    });

    // Get custom page size if specified
    const pageSize = table.getAttribute('data-page-size');
    const params = pageSize ? { limit: parseInt(pageSize, 10) } : {};

    // Fetch data - binder will walk table and render all consumers
    await binder.getData(params);

    // Hide skeleton loader now that data has loaded
    if (skeleton) {
      skeleton.style.display = 'none';
    }

    // Re-enable sorting now that we have data
    enableTableSorting(table);

    // Store binder on table for Panel access
    table.dataBinder = binder;

    // Setup server-side sorting, searching, and pagination
    setupDataBinderSortHandler(component, table);
    setupDataBinderSearchHandler(component, table);
    setupPaginationNavigationHandler(component, table);

    component.debugMe(`[Carbon Table] DataBinder initialized for table: ${table.id || '(no id)'}`);

  } catch (error) {
    console.error('[Carbon Table] Failed to initialize DataBinder:', error);

    // Hide skeleton even on error
    const skeleton = table.parentNode?.querySelector('cds-table-skeleton');
    if (skeleton) {
      skeleton.style.display = 'none';
    }

    // Still enable sorting even on error, so user can retry
    enableTableSorting(table);
  }
}

export default {
  selector: 'cds-table',
  import: dataTableImport,

  /**
   * Initialize the table component with event handlers and optional DataBinder.
   * @param {HTMLElement} table - The cds-table element
   */
  init: function (table) {
    const attrs = getSemanticAttributes(table);

    setupSelectionEvents(this, table, attrs);
    setupRowInteractionEvents(this, table, attrs);
    setupSortEvents(this, table, attrs);
    setupBatchActionEvents(this, table, attrs);
    setupSearchEvents(this, table, attrs);
    setupDataBinderIntegration(this, table, attrs);
  }
};
