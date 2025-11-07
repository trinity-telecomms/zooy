/**
 * Carbon Breadcrumb and Pagination Components
 *
 * Handles navigation breadcrumbs and page navigation.
 */

import { getSemanticAttributes } from '../../zoo/index.js';

const breadcrumbImport = () => import('@carbon/web-components/es/components/breadcrumb/index.js');
const paginationImport = () => import('@carbon/web-components/es/components/pagination/index.js');

// Breadcrumb - Navigation trail component
export default {
  selector: 'cds-breadcrumb',
  import: breadcrumbImport,
  init: function(breadcrumb) {
    const breadcrumbAttrs = getSemanticAttributes(breadcrumb);
    const eventName = breadcrumbAttrs.event;

    if (eventName) {
      // Helper to dispatch breadcrumb event
      const dispatchBreadcrumbEvent = (itemAttrs) => {
        this.dispatchPanelEvent(eventName, {
          ...breadcrumbAttrs,
          ...itemAttrs
        });
      };

      // Listen for breadcrumb link clicks (event delegation)
      this.listen(breadcrumb, 'click', e => {
        const link = e.target.closest('cds-breadcrumb-link');
        if (link) {
          e.preventDefault();
          e.stopPropagation();
          const linkAttrs = getSemanticAttributes(link);
          dispatchBreadcrumbEvent(linkAttrs);
        }
      });

      // Listen for overflow menu item clicks (for collapsed breadcrumbs)
      const overflowMenuBody = breadcrumb.querySelector('cds-overflow-menu-body');
      if (overflowMenuBody) {
        this.listen(overflowMenuBody, 'cds-overflow-menu-item-clicked', e => {
          e.stopPropagation();
          const itemAttrs = getSemanticAttributes(e.target);
          dispatchBreadcrumbEvent(itemAttrs);
        });
      }
    }
  }
};

// Breadcrumb sub-components
export const breadcrumbComponents = {
  // Breadcrumb Item - Wrapper for breadcrumb links
  'cds-breadcrumb-item': {
    import: breadcrumbImport
    // No event handling - presentational wrapper
  },

  // Breadcrumb Link - Individual breadcrumb link
  'cds-breadcrumb-link': {
    import: breadcrumbImport,
    event: 'click',
    getData: (e, attrs, element) => {
      e.preventDefault();
      return {
        ...attrs,
        href: element.getAttribute('href')
      };
    }
  }
};

// Pagination component
export const paginationComponent = {
  'cds-pagination': {
    import: paginationImport,
    init: function (pagination) {
      const paginationEventName = pagination.getAttribute('data-pagination-event');

      if (!paginationEventName) {
        // No event matching configured, skip initialization
        this.debugMe('[Pagination] No data-pagination-event attribute, skipping initialization');
        return;
      }

      // Listen for pagination metadata events (from DataBinder via table)
      this.listen(document, paginationEventName, e => {
        const { count, limit, page, next, previous } = e.detail;

        // Update pagination component properties
        pagination.totalItems = count;
        pagination.pageSize = limit;
        pagination.page = page;

        // Store URLs for reference (not used currently, but available)
        pagination.dataset.nextUrl = next || '';
        pagination.dataset.previousUrl = previous || '';

        this.debugMe(`[Pagination] Updated: page ${page}, size ${limit}, total ${count}`);
      });

      // Listen for user navigation and dispatch navigation events
      this.listen(pagination, 'cds-pagination-changed-current', e => {
        document.dispatchEvent(new CustomEvent(`${paginationEventName}-navigate`, {
          detail: {
            page: e.detail.page,
            pageSize: pagination.pageSize,
            action: 'page-change'
          },
          bubbles: true
        }));
        this.debugMe(`[Pagination] Navigate to page ${e.detail.page}`);
      });

      // Listen for page size changes and dispatch navigation events
      this.listen(pagination, 'cds-page-sizes-select-changed', e => {
        // Read the updated pageSize directly from the pagination component
        // (more reliable than event.detail which may vary between Carbon versions)
        const newPageSize = pagination.pageSize;

        this.debugMe(`[Pagination] Page size change event, new size: ${newPageSize}, event detail:`, e.detail);

        document.dispatchEvent(new CustomEvent(`${paginationEventName}-navigate`, {
          detail: {
            page: 1, // Reset to page 1 when changing size
            pageSize: newPageSize,
            action: 'page-size-change'
          },
          bubbles: true
        }));
      });
    }
  }
};
