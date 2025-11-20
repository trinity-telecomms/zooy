// noinspection JSValidateJSDoc

/**
 * Carbon Data Table Component
 *
 * Handles all data table initialization, events, and Binder integration.
 * Supports both client-side and server-side (Binder) data management.
 *
 * ====================================================================
 * USAGE: Server-Side Data Binding
 * ====================================================================
 * Tables with zoo-url-api automatically fetch and bind data from an API endpoint.
 *
 * @example
 * <cds-table zoo-url-api="/api/users/" data-page-size="25">
 *   <cds-table-head>
 *     <cds-table-header-row>
 *       <cds-table-header-cell data-sort-field="name">Name</cds-table-header-cell>
 *       <cds-table-header-cell data-sort-field="email">Email</cds-table-header-cell>
 *     </cds-table-header-row>
 *   </cds-table-head>
 *   <cds-table-body>
 *     <template id="user-row">
 *       <cds-table-row>
 *         <cds-table-cell zoo-bind="name"></cds-table-cell>
 *         <cds-table-cell zoo-bind="email"></cds-table-cell>
 *       </cds-table-row>
 *     </template>
 *     <cds-table-body zoo-template="user-row" zoo-template-bind="results"></cds-table-body>
 *   </cds-table-body>
 * </cds-table>
 *
 * Features:
 * - Automatic pagination component creation
 * - Skeleton loader while fetching initial data
 * - Server-side sorting (sends ordering parameter to API)
 * - Server-side search (triggers on Enter key or clear button, sends search parameter to API)
 * - Pagination navigation (sends limit/offset parameters)
 * - Binder stored on table.dataBinder for programmatic access
 *
 * Search Behavior:
 * - Press Enter in search box to trigger server-side search
 * - Click clear (X) button to reset search and reload full dataset
 * - Prevents API spam by not searching on every keystroke
 * - Uses DRF standard ?search= query parameter
 *
 * ====================================================================
 * USAGE: Client-Side Event Dispatch
 * ====================================================================
 * Tables without zoo-url-api dispatch panel events for manual handling.
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
 * - event:row-click: Row clicked (excludes checkbox clicks)
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

import {Binder} from '../../binder.js';
import {getSemanticAttributes} from '../../zoo/index.js';
import * as R from "ramda";
import {isDefAndNotNull, objToPaths} from "badu";
// noinspection JSFileReferences
import {
  TABLE_SORT_DIRECTION
} from "@carbon/web-components/lib/components/data-table/defs.js";

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * These are type-only imports that don't affect runtime behavior
 * @typedef {import('@carbon/web-components/es/components/data-table/table.js').default} CDSTable
 * @typedef {import('@carbon/web-components/es/components/pagination/pagination.js').default} CDSPagination
 * @typedef {import('@carbon/web-components/es/components/data-table/table-toolbar.js').default} CDSTableToolbar
 * @typedef {import('@carbon/web-components/es/components/data-table/table-batch-actions.js').default} CDSTableBatchActions
 * @typedef {import('@carbon/web-components/es/components/data-table/table-skeleton.js').default} CDSTableSkeleton
 * @typedef {import('@carbon/web-components/es/components/popover/index.js').default} CDSPopover
 */


/**
 * Standalone pagination component configuration.
 *
 * Registers standalone <cds-pagination> elements (not created by tables) with the
 * component system. Includes Carbon double-fire bug workaround to prevent duplicate
 * panel event dispatches.
 *
 * This is separate from table-integrated pagination which handles data fetching.
 * Standalone pagination dispatches panel events that application code can listen to.
 *
 * @type {{selector: string, import: ((function(): Promise<*>)|*|(function(): Promise<*>))[], init: function(CDSPagination): void}}
 */
export const cdsPaginationWrap = {
  selector: 'cds-pagination',

  /**
   * Initialize a standalone pagination component.
   *
   * Note: The pagination parameter is a CDSPagination instance from @carbon/web-components.
   * To access the CDSPagination class and its static properties:
   *   const CDSPagination = customElements.get('cds-pagination');
   *   // or
   *   const CDSPagination = pagination.constructor;
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

/**
 * Initialize all event handlers for a data table.
 *
 * Sets up listeners for:
 * - Row selection (individual and select-all)
 * - Row clicks
 * - Expandable row toggles
 * - Batch actions (cancel, select-all)
 * - Sorting (server-side with Binder, or client-side event dispatch)
 * - Search input (server-side with Binder, or client-side event dispatch)
 * - Pagination navigation (when Binder is present)
 *
 * @listens cds-table-header-cell-sort
 *   The name of the custom event fired before a new sort direction is set upon a user gesture.
 *   Cancellation of this event stops the user-initiated change in sort direction.
 *   We prefer this over `cds-table-sorted` the custom event fired after the
 *   table has been sorted.
 * @listens cds-search-input
 *   The name of the custom event fired during search bar input
 * @listens cds-table-batch-actions-cancel-clicked
 *   The name of the custom event fired after the Cancel button is clicked.
 * @listens cds-table-row-expando-toggled
 *   The name of the custom event fired after the expanded state of a row is toggled upon a user gesture.
 * @listens cds-table-row-selected
 *   The name of the custom event fired after a row has been selected.
 *   Preferred over `cds-table-row-change-selection` which is the custom event fired
 *   before a row is selected/unselected upon a user gesture.
 * @listens cds-table-row-all-selected
 *   The name of the custom event fired after all rows have been selected.
 *   Preferred over `cds-table-change-selection-all` which is the custom event fired
 *   before header row is selected/unselected upon a user gesture
 * @listens cds-table-filtered
 *   The name of the custom event fired after the table has been filtered containing remaining rows.
 *
 * @param {Panel} panel - Panel instance
 * @param {CDSTable} cdsTable - The cds-table element
 * @param {Object} tableAttrs - Semantic attributes from the table element
 * @private
 */
const initEventHandlers = (panel, cdsTable, tableAttrs) => {
  // Get Carbon component classes for type-safe event names
  const CDSTable = customElements.get('cds-table');
  const CDSPagination = customElements.get('cds-pagination');
  const CDSTableBatchActions = customElements.get(CDSTable.selectorTableBatchActions);
  const CDSPopover = customElements.get('cds-popover');

  const dataBinder = cdsTable.dataBinder;
  const pagination = cdsTable.pagination;
  const skeleton = cdsTable.skeleton;

  const searchElement = cdsTable.querySelector(CDSTable.selectorTableToolbarSearch);
  const batActToolbar = cdsTable.querySelector(CDSTable.selectorTableBatchActions);

  const tableBody = cdsTable.querySelector(CDSTable.selectorTableBody);
  const noNavEls = ['button', 'a', 'input', 'select', 'textarea', '[role="button"]', '.cds--table-expand', '.cds--table-column-checkbox',].join(',');
  const sortableHeaders = cdsTable.querySelectorAll(CDSTable.selectorHeaderCell + '[is-sortable]')
  const isSortable = cdsTable.isSortable || sortableHeaders.length > 0;

  // Keep a map of all the custom events we want to issue, which needs to be
  // prepped with a custom event name, but which piggyback off some event listener
  // that is already dealing with internal table logic.
  const onColSorted = Symbol();
  const onAllRowsChecked = Symbol();
  const userEventsMap = new Map();

  /**
   * Issue a user defined event when a row is clicked.
   * @param {String} customEventName
   */
  const onRowClickEvent = customEventName => {
    panel.listen(cdsTable, 'click', e => {
      const target = e.target.closest(CDSTable.selectorTableRow);
      if (!target || e.composedPath().some(el => el.matches && el.matches(noNavEls))) return;
      e.stopPropagation();
      const targetAttrs = getSemanticAttributes(target);
      panel.dispatchPanelEvent(customEventName, {
        ...targetAttrs,
      });
    });
  }

  /**
   * Issue a user defined panel event after a row was un/expanded
   * @param  {String}  customEventName
   */
  const onRowExpandEvent = customEventName => {
    panel.listen(cdsTable, CDSTable.eventExpandoToggle, e => {
      const target = e.target;
      const allRows = target.tagName === "CDS-TABLE-HEADER-ROW"
      const didExpand = e.detail.expanded;
      const targetAttrs = getSemanticAttributes(target);
      const payload = {
        tableAttrs, ...targetAttrs, target, allRows, didExpand,
      }
      panel.dispatchPanelEvent(customEventName, payload);
    });
  }

  /**
   * Issue a user defined panel event after sorting a column
   * @param  {String} customEventName
   */
  const onColSortEvent = customEventName => {
    userEventsMap.set(onColSorted, payload => {
      panel.dispatchPanelEvent(customEventName, payload);
    });
  }

  /**
   * Issue a panel event when all rows are un/checked.
   * @param {String}  customEventName
   */
  const onRowCheckAllEvent = customEventName => {
    userEventsMap.set(onAllRowsChecked, e => {
      const selectedRows = e.detail.selectedRows;
      const selectCount = Math.min(selectedRows.length, batActToolbar.totalRowsCount);
      const target = e.target;
      const targetAttrs = getSemanticAttributes(target);
      const selection = selectedRows.map(getSemanticAttributes);
      const payload = {
        tableAttrs, ...targetAttrs, target, selectCount, selection
      };
      panel.dispatchPanelEvent(customEventName, payload);
    })
  }

  /**
   * Issue a panel event when one row is un/checked
   * @param  {String}  customEventName
   */
  const onRowCheckOneEvent = customEventName => {
    // Table-level synthetic event for row selection
    // Fires with the table as the target. Contains all the selected rows, in an array
    // in the detail object. Also contains the last selected row in
    // the `selectedRow` key in the detail object.
    panel.listen(cdsTable, CDSTable.eventTableRowSelect, e => {
      const target = e.target;
      const selectedRows = e.detail.selectedRows || [];
      const selectCount = selectedRows.length;
      const selection = selectedRows.map(getSemanticAttributes);
      const targetAttrs = getSemanticAttributes(target);
      const payload = {
        tableAttrs, ...targetAttrs, selectCount, selection, target,
      };
      panel.dispatchPanelEvent(customEventName, payload);
    });
  }

  /**
   * Server side sorting is sorts on the server. Ha!
   */
  const initServerSideSorting = () => {
    panel.listen(cdsTable, CDSTable.eventBeforeSort, e => {
      const target = e.target;
      const sortWas = e.detail.oldSortDirection;
      const sortNow = e.detail.sortDirection;
      const targetAttrs = getSemanticAttributes(target);
      const sortField = targetAttrs.sortField;
      const ordering = sortNow === TABLE_SORT_DIRECTION.DESCENDING ? `-${sortField}` : sortField;

      // Prevent Carbon's client-side DOM sorting
      e.cancelBubble = true;
      e.stopPropagation();
      e.preventDefault();

      // Clear the inner
      tableBody.innerHTML = '';
      skeleton && skeleton.show();

      sortableHeaders.forEach((col, _) => {
        if (col === target) {
          col.setAttribute('sort-active', 'true');
          col.setAttribute('sort-direction', sortNow);
        } else {
          col.removeAttribute('sort-active');
          col.setAttribute('sort-direction', 'none');
        }
      })

      // Reload data with DRF ordering parameter
      // (e.g., ?ordering=name or ?ordering=-name)
      const params = {ordering};
      dataBinder.fetchData(params).then(() => {
        pagination.setData(dataBinder);
        skeleton && skeleton.hide();
      });

      // Maybe issue custom event with payload.
      userEventsMap.has(onColSorted) && userEventsMap.get(onColSorted)({
        tableAttrs, ...targetAttrs, sortNow, sortWas, sortField, ordering, target,
      });
    })

  }

  /**
   * Table-level synthetic event when all rows are checked from the header row.
   * We listen for this event regardless of whether the user has a
   * custom event to fire on this event. That is because we have housekeeping to do
   * on this to deal with the select TOTAL button
   * This is housekeeping for when the sure de-selects the *all* rows
   * checkbox AFTER the "select all (TOTAL)" button was pressed.
   * This just clears both the disabled state - set when the user selects
   * total, and clearing the checked display for all the rows.
   * Because all the rows are disabled when the user selects TOTAL, unchecking it
   * does nothing for them, and we need to uncheck them by hand here.
   */
  const initSelectAllFunctionality = () => {
    panel.listen(cdsTable, CDSTable.eventTableRowSelectAll, e => {
      if (e.detail.selectedRows.length === 0) {
        cdsTable.querySelectorAll(CDSTable.selectorTableRow).forEach((row) => {
          row.disabled = false
          row.selected = false
        })
      }
      // Maybe issue custom event.
      userEventsMap.has(onAllRowsChecked) && userEventsMap.get(onAllRowsChecked)(e);
    });
  }

  /**
   * This is only housekeeping. It listens for the synthetic event generated
   * by clicking on the TOTAL button, and then executes the callback passed
   * along in the event to disables all the checkboxes
   * on all the visible rows, and update the display of the total number of
   * selected records to the TOTAL value.
   */
  const initBatchActionHousekeeping = () => {
    panel.listen(cdsTable, CDSTable.eventBeforeChangeSelectionAll, e => {
      e.stopPropagation()
      if (e.detail.callback) {
        e.detail.callback();
      }
    });
  }

  /**
   * This listens on the batch toolbar for the TOTAL button press, and then
   * fires a synthetic "select all checkbox" event to check all the boxes.
   * There is a reciprocal housekeeping receiver that listens for this, who
   * executes the callback defined here. This callback disables all the checkboxes
   * on all the visible rows, and also updates the display of the total number of
   * selected records to the TOTAL value.
   * @param {CDSTableBatchActions} batActToolbar
   */
  const initBatchActions = (batActToolbar) => {
    const headerRow = cdsTable.querySelector("cds-table-header-row");
    panel.listen(batActToolbar, CDSTableBatchActions.eventClickSelectAll, e => {
      e.stopPropagation();
      headerRow.dispatchEvent(new CustomEvent(CDSTable.eventBeforeChangeSelectionAll, {
        bubbles: true, cancelable: true, composed: true, detail: {
          selected: true, callback: () => {
            batActToolbar.selectedRowsCount = batActToolbar.totalRowsCount;
            cdsTable.querySelectorAll(CDSTable.selectorTableRow).forEach((row) => {
              row.disabled = true
            })
          }
        }
      }));
    });
  }

  /**
   * Server-side search: Filters as the user types, and executes a server side
   * search when enter is pressed
   * @param searchElement
   */
  const initSearchOnEnter = (searchElement) => {
    panel.listen(searchElement, 'keydown', e => {
      if (e.key === 'Enter') {
        skeleton && skeleton.show();
        pagination.totalItems = 0;
        cdsTable.querySelector('cds-table-body').replaceChildren();
        const searchValue = searchElement.value || '';
        const params = {search: searchValue, offset: 0};
        dataBinder.fetchData(params).then(() => {
          pagination.setData(dataBinder);
          skeleton && skeleton.hide();
        })
      }
    });
  }

  /**
   * Handle clear button click (value becomes empty)
   * @param searchElement
   */
  const initClearSearch = (searchElement) => {
    panel.listen(searchElement, CDSTable.eventSearchInput, e => {
      const searchValue = e.detail.value || '';
      if (searchValue === '') {
        const params = {search: '', offset: 0};
        skeleton && skeleton.show();
        dataBinder.fetchData(params).then(() => {
          skeleton && skeleton.hide();
          pagination.setData(dataBinder);
        });
      }
    });
  }

  /**
   * Initialize filter popover functionality
   * Sets up the batch filter popover with proper open/close behavior and styling.
   * Uses Carbon's native .cds--overflow-menu--open class for consistent styling.
   *
   * Finds the trigger button by looking for the first cds-icon-button or button
   * element that is a direct child of the popover (not slotted content).
   *
   * Handles Reset and Apply button functionality:
   * - Reset: Unchecks all filter checkboxes and removes filter params from dataBinder URL
   * - Apply: Reads checked checkboxes, updates dataBinder URL with array params, fetches new data
   *
   * Checkbox IDs must be formatted as "field:value" (e.g., "mno:verizon", "state:52")
   * Generated URL params use repeated parameters (e.g., ?mno=verizon&mno=tmobile&state=50&state=52)
   * Passed to Binder as arrays: {mno: ['verizon', 'tmobile'], state: ['50', '52']}
   *
   * @param {CDSPopover} popover - The cds-popover element
   * @private
   */
  const initFilterPopover = (popover) => {
    popover.caret = false;

    const button = popover.querySelector('cds-icon-button, button:not([slot])');
    const checkboxes = popover.querySelectorAll('cds-checkbox');
    const actionButtons = popover.querySelectorAll('cds-modal-footer-button');
    const resetFilterParams = [...popover.querySelectorAll('cds-checkbox-group')].map(getSemanticAttributes)
      .map(R.pathOr("noop", ["zoo", "filter", "field"]))
      .reduce((p, c) => {
          p[c] = null;
          return p;
        },
        {offset: 0}
      )

    if (!button || !actionButtons) {
      console.error("Improperly configured Batch Filter popover")
      return;
    }

    // Watch for popover closing (e.g., clicking outside)
    new MutationObserver(() => {
      popover.classList.toggle('cds--overflow-menu--open', popover.open);
    }).observe(popover, {
      attributes: true,
      attributeFilter: ['open']
    });

    const actionButtonReset = Symbol();
    const actionButtonApply = Symbol();
    const actionButtonMap = [...actionButtons].reduce((p, c, _) => {
      if (c.hasAttribute('reset-filter')) {
        p.set(actionButtonReset, c);
      }
      if (c.hasAttribute('apply-filter')) {
        p.set(actionButtonApply, c);
      }
      return p;
    }, new Map());

    const buildFilterParams = () => {
      const filterMap = new Map();

      checkboxes.forEach(el => {
        const id = el.getAttribute('id');
        if (!id || !id.includes(':')) return;
        const [field, value] = id.split(':');
        if (!filterMap.has(field)) {
          filterMap.set(field, []);
        }
        if (el.checked) {
          filterMap.get(field).push(value);
        }
      });
      return filterMap
    };

    // Reset button: uncheck all checkboxes and clear filters
    if (actionButtonMap.has(actionButtonReset)) {
      const uncheck = e => e.checked = false;
      panel.listen(actionButtonMap.get(actionButtonReset), 'click', (e) => {
        e.stopPropagation();

        checkboxes.forEach(uncheck);
        skeleton && skeleton.show();
        dataBinder.fetchData(resetFilterParams).then(() => {
          pagination && pagination.setData(dataBinder);
          skeleton && skeleton.hide();
          popover.open = false;
        });
      });
    }

    if (actionButtonMap.has(actionButtonApply)) {
      panel.listen(actionButtonMap.get(actionButtonApply), 'click', (e) => {
        e.stopPropagation();

        const params = [...buildFilterParams()].reduce((p, [key, value]) => {
          p[key] = value === [] ? null : value;
          return p;
        }, {offset: 0});

        skeleton && skeleton.show();
        dataBinder.fetchData(params).then(() => {
          pagination && pagination.setData(dataBinder);
          skeleton && skeleton.hide();
          popover.open = false;
        });
      });
    }

    panel.listen(button, 'click', (e) => {
      e.stopPropagation();
      popover.open = !popover.open;
      popover.classList.toggle('cds--overflow-menu--open', popover.open);
    });
  };

  /**
   * Handel page size changes at server side
   * When page sizes change, we reset our pagination nav back to page 1
   * @private
   */
  const initPageSizeChangeFunctionality = () => {
    panel.listen(pagination, CDSPagination.eventPageSizeChanged, _ => {
      const pageSize = pagination.pageSize;
      const params = {
        limit: pageSize,
        offset: 0
      };
      dataBinder.fetchData(params).then(() => {
        pagination.setData(dataBinder);
      })
    });
  }

  /**
   * Carbon Web Components fires cds-pagination-changed-current twice per navigation.
   * This happens because the click handler sets this.page++ (triggering LitElement's
   * reactive update) and then explicitly calls _handleUserInitiatedChangeStart(),
   * and then updated() lifecycle also calls _handleUserInitiatedChangeStart() when
   * it detects the page property changed. Track last fetched offset to deduplicate.
   * @private
   */
  const initPageNavFunctionality = () => {
    let lastFetchedOffset = null;
    panel.listen(pagination, CDSPagination.eventChangeCurrent, e => {
      const {page} = e.detail;
      const pageSize = pagination.pageSize;
      const offset = (page - 1) * pageSize;

      // Only fetch if we're actually navigating to a different offset
      if (offset !== lastFetchedOffset) {
        lastFetchedOffset = offset;
        const params = {limit: pageSize, offset};
        dataBinder.fetchData(params).then(() => {
          pagination.setData(dataBinder)
          skeleton && skeleton.hide();
        });
      }
    });
  }

  // Wire up pagination listeners.
  if (dataBinder && pagination) {
    initPageSizeChangeFunctionality();
    initPageNavFunctionality();
  }

  // Search input - support both cds-search and cds-table-toolbar-search
  if (dataBinder && searchElement) {
    initSearchOnEnter(searchElement);
    initClearSearch(searchElement);
  }

  // Filter popover initialization - find popover with data-batch-filter attribute
  const tableToolbar = cdsTable.querySelector(CDSTable.selectorTableToolbarContent);
  if (tableToolbar) {
    const filterPopovers = tableToolbar.querySelectorAll('cds-popover[data-batch-filter]');
    if (dataBinder && filterPopovers) {
      filterPopovers.forEach(initFilterPopover);
    }
  }

  // If the table is selectable, then we want to listen to the batch action toolbar.
  // If the `eventClickSelectAll` event issues from the toolbar, we generate a synthetic
  // event that automatically selects all the rows (as a side effect) which we then
  // capture and use to update the total selected count on the toolbar.
  // This count will be:
  //     a: The number of selected rows
  //     b: The total number of displayed rows (if the select all checkbox on the row
  //        header is selected)
  //     c: The total count in the API result. (if the `Select all(number)` button in
  //        the toolbar is clicked.
  if (cdsTable.isSelectable) {
    initSelectAllFunctionality();
    initBatchActionHousekeeping();
    if (batActToolbar) {
      initBatchActions(batActToolbar)
    }
  }

  // Table sorting is handled when there is either a data binder, or
  // the `zoo-event-column-sort` attribute is defined on the table.
  // When a data binder is present, client side sorting is suppressed, and all sorting
  // happens server side.
  // When a `zoo-event-column-sort` attribute is present, the custom sort event is
  // dispatched by the panel, regardless of the presence of a binder or not.
  if (dataBinder && isSortable) {
    initServerSideSorting();
  }

  // This binds the user selected events to the methods that will
  // execute those events. This works by mapping the path to a function. For instance
  // if the table defined a "zoo-event-check-all='something'" attribute, then
  // this will use the function at zoo.event.check.all in the below map to issue a
  // panel event with the value "something"
  const listenMap = {
    zoo: {
      event: {
        row: {
          click: onRowClickEvent,
          expand: onRowExpandEvent,
          check: {
            one: onRowCheckOneEvent,
            all: onRowCheckAllEvent,
          }
        }, column: {
          sort: onColSortEvent,
        },
      },
    }
  }
  objToPaths(tableAttrs).forEach(([path, value]) => {
    if (R.hasPath(path, listenMap)) {
      R.path(path, listenMap)(value);
    }
  })

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
 * @param {Binder} dataBinder - Binder instance for the table
 * @return {CDSPagination} The configured cds-pagination element
 * @private
 */
const createPagination = (dataBinder) => {
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
   * @param {Binder} dataBinder - DRF API response with count, next, previous, results
   */
  pagination.setData = (dataBinder) => {
    if (dataBinder.isPaginated) {
      const {count} = R.pick(['count'], dataBinder.data);
      const totalPages = Math.ceil(count / dataBinder.limit);

      // Use pagesUnknown mode for large datasets to avoid Carbon
      // rendering thousands of <option> elements
      const MAX_PAGES_FOR_DROPDOWN = 100;
      pagination.pagesUnknown = totalPages > MAX_PAGES_FOR_DROPDOWN;
      pagination.totalItems = count;

      // When using pagesUnknown mode, override the formatter to include total count
      // Uses closure to capture 'count' from this scope
      if (pagination.pagesUnknown) {
        pagination.formatStatusWithIndeterminateTotal = ({start, end}) =>
          `${start}–${end} of ${count} item${count <= 1 ? '' : 's'}`;
      } else {
        delete pagination.formatStatusWithIndeterminateTotal;
      }
    }
  }
  return pagination;
}

/**
 * Create and configure a skeleton loader that matches the table structure.
 * @param {CDSTable} cdsTable - The table element to create a skeleton for
 * @return {CDSTableSkeleton|undefined} The skeleton element, or undefined if table has no parent
 * @private
 */
const createSkeleton = (cdsTable) => {
  // Verify parent exists
  if (!cdsTable.parentNode) {
    console.error('[Carbon Table] Cannot create skeleton: table has no parent node');
    return;
  }

  // Interrogate table structure
  const hasTitle = !!cdsTable.querySelector('cds-table-header-title');
  const hasDescription = !!cdsTable.querySelector('cds-table-header-description');
  const hasToolbar = !!cdsTable.querySelector('cds-table-toolbar');
  const colCount = [...cdsTable.querySelectorAll('cds-table-header-cell')].length;
  const hasZebra = cdsTable.hasAttribute('zebra');
  const size = cdsTable.getAttribute('size');

  const skeleton = document.createElement('cds-table-skeleton');
  skeleton.showHeader = hasTitle || hasDescription;
  skeleton.showToolbar = hasToolbar;
  skeleton.zebra = hasZebra;
  skeleton.columnCount = colCount;
  skeleton.size = size;
  skeleton.show = () => skeleton.classList.remove('hidden');
  skeleton.hide = () => skeleton.classList.add('hidden');

  // Create wrapper and overlay skeleton behind table
  const wrapper = document.createElement('div');
  wrapper.classList.add("zoo-datatable-skeleton-wrapper");
  cdsTable.parentNode.insertBefore(wrapper, cdsTable);
  wrapper.appendChild(skeleton);
  wrapper.appendChild(cdsTable);
  return skeleton;
};

/**
 * Set up Binder integration for a table with zoo-url-api attribute.
 *
 * Checks for zoo-url-api attribute and creates a Binder instance if present.
 * The Binder will fetch data from the API and bind it to the table using
 * zoo-bind attributes.
 *
 * @param {zooy.Panel} panel - Panel instance
 * @param {CDSTable} el - The cds-table element
 * @return {Binder|undefined} Binder instance if zoo-url-api is present, undefined otherwise
 * @private
 */
const setupDataBinderIntegration = (panel, el) => {
  const apiUrl = el.getAttribute('zoo-url-api');
  const pageSize = parseInt(el.getAttribute('data-page-size') || 25, 10)
  if (apiUrl) {
    return new Binder(panel, apiUrl, el, {
      urlParams: {limit: pageSize},
    });
  }
}


export const cdsTableWrap = {
  selector: 'cds-table',

  /**
   * Initialize a Carbon data table component.
   *
   * Note: The cdsTable parameter is a CDSTable instance from @carbon/web-components.
   * To access the CDSTable class and its static properties/methods, use:
   *   const CDSTable = customElements.get('cds-table');
   *   // or
   *   const CDSTable = cdsTable.constructor;
   *
   * Example - Using static event names:
   *   const CDSTable = customElements.get('cds-table');
   *   panel.listen(cdsTable, CDSTable.eventBeforeChangeSelection, e => {...});
   *
   * Initialization flow:
   * 1. Extract semantic attributes from table element
   * 2. Check for zoo-url-api attribute to determine if Binder is needed
   * 3. If Binder:
   *    - Create Binder instance with configured page size
   *    - Create and show skeleton loader
   *    - Create pagination component
   *    - Fetch initial data
   *    - Remove skeleton and configure pagination when data arrives
   *    - Set up event handlers after data is loaded (prevents duplicate initial fetch)
   * 4. If no Binder:
   *    - Set up event handlers immediately for client-side behavior
   *
   * @param {CDSTable} cdsTable - The CDSTable custom element instance (from @carbon/web-components)
   * @this {Panel} The panel instance
   */
  init: function (cdsTable) {
    const attrs = getSemanticAttributes(cdsTable);
    const panel = this;

    const dataBinder = setupDataBinderIntegration(panel, cdsTable);
    if (isDefAndNotNull(dataBinder)) {
      cdsTable.dataBinder = dataBinder;

      const skeleton = createSkeleton(cdsTable);
      cdsTable.skeleton = skeleton;

      const pagination = createPagination(dataBinder);
      cdsTable.pagination = pagination;

      cdsTable.after(pagination);
      // Fetch initial data with only the page size parameter
      dataBinder.fetchData().then(_ => {
        skeleton.hide();
        pagination.setData(dataBinder);
        initEventHandlers(panel, cdsTable, attrs);
      });
    } else {
      // No data binding, set up event handlers immediately
      initEventHandlers(panel, cdsTable, attrs);
    }
  }
};



