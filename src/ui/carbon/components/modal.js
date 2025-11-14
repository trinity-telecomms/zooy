/**
 * Carbon Modal Component
 *
 * Handles modal dialogs with open/close events and form submission.
 */

import { getSemanticAttributes, getEventAttribute } from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/modal/modal.js').default} CDSModal
 */
// noinspection JSFileReferences
const modalImport = () => import('@carbon/web-components/es/components/modal/index.js');

export default {
  selector: 'cds-modal',
  import: modalImport,
  /**
   * @param {CDSModal} modal - The CDSModal custom element instance
   * @this {Panel} The panel instance
   */
  init: function (modal) {
    const CDSModal = customElements.get('cds-modal');
    const attrs = getSemanticAttributes(modal);

    // Open event
    const openEvent = getEventAttribute(modal, 'open-event', 'event');
    if (openEvent) {
      this.listen(modal, 'cds-modal-beingopened', _ => {
        this.dispatchPanelEvent(openEvent, {
          ...attrs,
          action: 'opened'
        });
      });
    }

    // Before close event (cancelable)
    const beforeCloseEvent = modal.getAttribute('before-close-event');
    if (beforeCloseEvent) {
      this.listen(modal, CDSModal.eventBeforeClose, _ => {
        this.dispatchPanelEvent(beforeCloseEvent, {
          ...attrs,
          action: 'closing',
          cancelable: true
        });
      });
    }

    // Close event - Carbon's way of handling modal dismissal
    // ALWAYS emit 'destroy_me' to integrate with zooy's panel destruction
    // This is not configurable - modals MUST destroy their panel when closed
    this.listen(modal, CDSModal.eventClose, e => {
      this.dispatchPanelEvent('destroy_me', {
        ...attrs,
        action: 'closed',
        triggeredBy: e.detail?.triggeredBy
      });
    });

    // Primary button event
    const primaryEvent = getEventAttribute(modal, 'primary-event', 'event');
    if (primaryEvent) {
      this.listen(modal, 'cds-modal-primary-focus', _ => {
        this.dispatchPanelEvent(primaryEvent, {
          ...attrs,
          action: 'primary'
        });
      });
    }
  }
};

// Modal sub-components configuration
export const modalSubComponents = {
  'cds-modal-header': {
    import: modalImport
    // No event handling - presentational header wrapper
  },

  'cds-modal-heading': {
    import: modalImport
    // No event handling - presentational heading element
  },

  'cds-modal-label': {
    import: modalImport
    // No event handling - presentational label element
  },

  'cds-modal-close-button': {
    import: modalImport
    // No event handling - close button handled by modal itself via data-modal-close
  },

  'cds-modal-body': {
    import: modalImport
    // No event handling - presentational body wrapper
  },

  'cds-modal-body-content': {
    import: modalImport
    // No event handling - presentational content wrapper
  },

  'cds-modal-footer': {
    import: modalImport
    // No event handling - presentational footer wrapper
  },

  'cds-modal-footer-button': {
    import: modalImport,
    init: function (button) {
      const attrs = getSemanticAttributes(button);
      const buttonType = button.getAttribute('type');

      // Submit buttons need special handling because Carbon button's native <button>
      // is inside shadow DOM, which breaks the form submission mechanism.
      // We manually trigger form submission on the associated form.
      if (buttonType === 'submit') {
        this.listen(button, 'click', _ => {
          // Find the form - either as ancestor or via HTML5 form attribute
          let form = button.closest('form');

          // If button is outside form (e.g., in modal footer), check form attribute
          if (!form) {
            const formId = button.getAttribute('form');
            if (formId) {
              form = document.getElementById(formId);
            }
          }

          if (form) {
            // Use requestSubmit() which properly triggers validation and submit event
            // FormPanel's interceptFormSubmit() will catch this and handle it
            form.requestSubmit();
          }
        });
        return;
      }

      // Standard button event handling (for non-submit buttons)
      const eventName = attrs.event;
      if (eventName) {
        this.listen(button, 'click', e => {
          e.stopPropagation();
          this.dispatchPanelEvent(eventName, attrs);
        });
      }
    }
  }
};
