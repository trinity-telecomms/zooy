/**
 * Carbon Breadcrumb and Pagination Components
 *
 * Handles navigation breadcrumbs and page navigation.
 */

import {getSemanticAttributes} from '../../zoo/index.js';

const breadcrumbImport = () => import('@carbon/web-components/es/components/breadcrumb/index.js');

// Breadcrumb - Navigation trail component
export default {
  selector: 'cds-breadcrumb', import: breadcrumbImport, init: function (breadcrumb) {
    const breadcrumbAttrs = getSemanticAttributes(breadcrumb);
    const eventName = breadcrumbAttrs.event;

    if (eventName) {
      // Helper to dispatch breadcrumb event
      const dispatchBreadcrumbEvent = (itemAttrs) => {
        this.dispatchPanelEvent(eventName, {
          ...breadcrumbAttrs, ...itemAttrs
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
        ...attrs, href: element.getAttribute('href')
      };
    }
  }
};


