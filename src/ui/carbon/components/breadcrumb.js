/**
 * Carbon Breadcrumb and Pagination Components
 *
 * Handles navigation breadcrumbs and page navigation.
 */

import {getSemanticAttributes} from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/breadcrumb/breadcrumb.js').default} CDSBreadcrumb
 * @typedef {import('@carbon/web-components/es/components/breadcrumb/breadcrumb-item.js').default} CDSBreadcrumbItem
 * @typedef {import('@carbon/web-components/es/components/breadcrumb/breadcrumb-link.js').default} CDSBreadcrumbLink
 */


/**
 * Breadcrumb sub-components
 * @type {{selector: string, import: ((function(): Promise<*>)|*)[]}}
 */
export const cdsBreadcrumbItemWrap = {
  selector: 'cds-breadcrumb-item',
}

/**
 * Breadcrumb sub-components
 * @type {{selector: string, import: ((function(): Promise<*>)|*)[], event: string, getData: function(*, *, *): *&{href: *}}}
 */
export const cdsBreadcrumbLinkWrap = {
  selector: 'cds-breadcrumb-link',
  event: 'click',
  getData: (e, attrs, element) => {
    e.preventDefault();
    return {
      ...attrs, href: element.getAttribute('href')
    };
  }
}


/**
 * Breadcrumb - Navigation trail component
 * @type {{selector: string, import: ((function(): Promise<*>)|*)[], init: function(CDSBreadcrumb): void}}
 */
export const cdsBreadCrumbWrap = {
  selector: 'cds-breadcrumb',

  /**
   * @param {CDSBreadcrumb} breadcrumb - The CDSBreadcrumb custom element instance
   * @this {Panel} The panel instance
   */
  init: function (breadcrumb) {
    const panel = this;
    const breadcrumbAttrs = getSemanticAttributes(breadcrumb);
    const eventName = breadcrumbAttrs.event;

    if (eventName) {
      // Helper to dispatch breadcrumb event
      const dispatchBreadcrumbEvent = (itemAttrs) => {
        panel.dispatchPanelEvent(eventName, {
          ...breadcrumbAttrs, ...itemAttrs
        });
      };

      // Listen for breadcrumb link clicks (event delegation)
      panel.listen(breadcrumb, 'click', e => {
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
        panel.listen(overflowMenuBody, 'cds-overflow-menu-item-clicked', e => {
          e.stopPropagation();
          const itemAttrs = getSemanticAttributes(e.target);
          dispatchBreadcrumbEvent(itemAttrs);
        });
      }
    }
  }
}

