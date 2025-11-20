/**
 * Carbon Notification Components
 *
 * Handles toast, inline, and actionable notifications.
 */

import {getSemanticAttributes, getEventAttribute} from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/notification/toast-notification.js').default} CDSToastNotification
 * @typedef {import('@carbon/web-components/es/components/notification/inline-notification.js').default} CDSInlineNotification
 * @typedef {import('@carbon/web-components/es/components/notification/actionable-notification.js').default} CDSActionableNotification
 */


/**
 * Toast Notification
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *): *&{action: string}}}
 */
export const cdsToastNotificationWrap = {
  selector: 'cds-toast-notification',
  event: 'cds-notification-closed',
  getData: (e, attrs) => ({
    ...attrs, action: 'closed'
  })
};


/**
 * Inline Notification
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *): *&{action: string}}}
 */
export const cdsInlineNotificationWrap = {
  selector: 'cds-inline-notification',
  event: 'cds-notification-closed',
  getData: (e, attrs) => ({
    ...attrs, action: 'closed'
  })
}

/**
 * Actionable Notification
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSActionableNotification): void}}
 */
export const cdsActionableNotificationWrap = {
  selector: 'cds-actionable-notification',

  /**
   * @param {CDSActionableNotification} notification - The CDSActionableNotification custom element instance
   * @this {Panel} The panel instance
   */
  init: function (notification) {
    const attrs = getSemanticAttributes(notification);

    // Close event
    const closeEvent = getEventAttribute(notification, 'close-event', 'event');
    if (closeEvent) {
      this.listen(notification, 'cds-notification-closed', _ => {
        this.dispatchPanelEvent(closeEvent, {
          ...attrs, action: 'closed'
        });
      });
    }

    // Action button event
    const actionEvent = getEventAttribute(notification, 'action-event');
    if (actionEvent) {
      this.listen(notification, 'cds-notification-actioned', _ => {
        this.dispatchPanelEvent(actionEvent, {
          ...attrs, action: 'actioned'
        });
      });
    }
  }
}

