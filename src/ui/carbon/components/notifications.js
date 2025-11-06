/**
 * Carbon Notification Components
 *
 * Handles toast, inline, and actionable notifications.
 */

import { getSemanticAttributes, getEventAttribute } from '../../zoo/index.js';

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
