/**
 * Carbon Modal Component
 *
 * Handles modal dialogs with open/close events and form submission.
 */

import {getSemanticAttributes, getEventAttribute} from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/modal/modal.js').default} CDSModal
 * @typedef {import('@carbon/web-components/es/components/modal/modal-header.js').default} CDSModalHeader
 * @typedef {import('@carbon/web-components/es/components/modal/modal-heading.js').default} CDSModalHeading
 * @typedef {import('@carbon/web-components/es/components/modal/modal-label.js').default} CDSModalLabel
 * @typedef {import('@carbon/web-components/es/components/modal/modal-close-button.js').default} CDSModalCloseButton
 * @typedef {import('@carbon/web-components/es/components/modal/modal-body.js').default} CDSModalBody
 * @typedef {import('@carbon/web-components/es/components/modal/modal-body-content.js').default} CDSModalBodyContent
 * @typedef {import('@carbon/web-components/es/components/modal/modal-footer.js').default} CDSModalFooter
 * @typedef {import('@carbon/web-components/es/components/modal/modal-footer-button.js').default} CDSModalFooterButton
 */


/**
 * Modal
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSModal): void}}
 */
export const cdsModalWrap = {
  selector: 'cds-modal',

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
}

/**
 * Modal Header
 * @type {{selector: string, import: (function(): Promise<*>)|*}}
 */
export const cdsModalHeaderWrap = {
  selector: 'cds-modal-header',
}

/**
 * Modal Heading
 * @type {{selector: string, import: (function(): Promise<*>)|*}}
 */
export const cdsModalHeadingWrap = {
  selector: 'cds-modal-heading',
}

/**
 * Modal Label
 * @type {{selector: string, import: (function(): Promise<*>)|*}}
 */
export const cdsModalLabelWrap = {
  selector: 'cds-modal-label',
}

/**
 * Modal Close Button
 * @type {{selector: string, import: (function(): Promise<*>)|*}}
 */
export const cdsModalCloseButWrap = {
  selector: 'cds-modal-close-button',
}

/**
 * Modal Body
 * @type {{selector: string, import: (function(): Promise<*>)|*}}
 */
export const cdsModalBodyWrap = {
  selector: 'cds-modal-body',
}

/**
 * Modal Body Content
 * @type {{selector: string, import: (function(): Promise<*>)|*}}
 */
export const cdsModalBodyContentWrap = {
  selector: 'cds-modal-body-content',
}

/**
 * Modal Footer
 * @type {{selector: string, import: (function(): Promise<*>)|*}}
 */
export const cdsModalFooterWrap = {
  selector: 'cds-modal-footer',
}

/**
 * Modal Footer Buttons
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(*): void}}
 */
export const cdsModalFooterButWrap = {
  selector: 'cds-modal-footer-button',

  /**
   * @param {CDSModalFooterButton} button - The CDSModal custom element instance
   * @this {Panel} The panel instance
   */
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
