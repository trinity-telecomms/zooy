/**
 * Carbon Notification Components
 *
 * Handles toast, inline, and actionable notifications.
 */

import { getSemanticAttributes, getEventAttribute } from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/notification/toast-notification.js').default} CDSToastNotification
 * @typedef {import('@carbon/web-components/es/components/notification/inline-notification.js').default} CDSInlineNotification
 * @typedef {import('@carbon/web-components/es/components/notification/actionable-notification.js').default} CDSActionableNotification
 */
// noinspection JSFileReferences
const notificationImport = () => import('@carbon/web-components/es/components/notification/index.js');

// Toast Notification
export default {
  selector: 'cds-toast-notification',
  import: notificationImport,
  event: 'cds-notification-closed',
  getData: (e, attrs) => ({
    ...attrs,
    action: 'closed'
  })
};

// Other notification components
export const notificationComponents = {
  // Inline Notification
  'cds-inline-notification': {
    import: notificationImport,
    event: 'cds-notification-closed',
    getData: (e, attrs) => ({
      ...attrs,
      action: 'closed'
    })
  },

  // Actionable Notification
  'cds-actionable-notification': {
    import: notificationImport,
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
            ...attrs,
            action: 'closed'
          });
        });
      }

      // Action button event
      const actionEvent = getEventAttribute(notification, 'action-event');
      if (actionEvent) {
        this.listen(notification, 'cds-notification-actioned', _ => {
          this.dispatchPanelEvent(actionEvent, {
            ...attrs,
            action: 'actioned'
          });
        });
      }
    }
  }
};
