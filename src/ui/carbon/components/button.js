/**
 * Carbon Button Components
 *
 * Handles various button types including standard buttons, icon buttons, and combo buttons.
 */

import {getSemanticAttributes, getEventAttribute} from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/button/button.js').default} CDSButton
 * @typedef {import('@carbon/web-components/es/components/icon-button/icon-button.js').default} CDSIconButton
 * @typedef {import('@carbon/web-components/es/components/combo-button/combo-button.js').default} CDSComboButton
 * @typedef {import('@carbon/web-components/es/components/copy-button/copy-button.js').default} CDSCopyButton
 */

/**
 * Standard Button
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSButton): void}}
 */
export const cdsButtonWrap = {
  selector: 'cds-button',

  /**
   * @param {CDSButton} button - The CDSButton custom element instance
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
        this.dispatchPanelEvent(eventName, getSemanticAttributes(button));
      });
    }
  }
};

/**
 * Button-related components configuration
 * Icon Button (non-toggle)
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *): *}}
 */
export const cdsIconButWrap = {
  selector: 'cds-icon-button:not([data-toggle])',
  event: 'click',
  getData: (e, attrs) => attrs
}

/**
 * Icon Toggle - Toggles Carbon's built-in isSelected state for ghost icon buttons
 * Visual styling (subtle background change) is handled by Carbon's CSS
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSIconButton): void}}
 */
export const cdsIconButToggleWrap = {
  selector: 'cds-icon-button[data-toggle]',

  /**
   * @param {CDSIconButton} button - The CDSButton custom element instance
   * @this {Panel} The panel instance
   */
  init: function (button) {
    const attrs = getSemanticAttributes(button);

    if (attrs.event) {
      this.listen(button, 'click', e => {
        e.stopPropagation();

        // Toggle Carbon's isSelected property (syncs to is-selected attribute)
        // Carbon applies cds--btn--selected class which adds a subtle background
        button.isSelected = !button.isSelected;

        this.dispatchPanelEvent(attrs.event, {
          ...attrs,
          isOn: button.isSelected
        });
      });
    }
  }
}

/**
 * FAB (Floating Action Button) - just a styled button
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *): *}}
 */
export const cdsButFabWrap = {
  selector: 'cds-button[data-fab]',
  event: 'click',
  getData: (e, attrs) => attrs
}

/**
 * Copy Button - Button that copies text to clipboard
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSCopyButton): void}}
 */
export const cdsCopyButWrap = {
  selector: 'cds-copy-button',

  /**
   * @param {CDSCopyButton} button - The CDSCopyButton custom element instance
   * @this {Panel} The panel instance
   */
  init: function (button) {
    const attrs = getSemanticAttributes(button);

    // Click event - fires when button is clicked (before copy)
    const clickEvent = attrs.event;
    if (clickEvent) {
      this.listen(button, 'click', e => {
        e.stopPropagation();
        this.dispatchPanelEvent(clickEvent, {
          ...attrs,
          action: 'copy'
        });
      });
    }

    // Success event - fires after successful copy (if specified separately)
    const successEvent = button.getAttribute('success-event');
    if (successEvent) {
      // Monitor for the feedback text to appear (indicates successful copy)
      const observer = new MutationObserver(() => {
        if (button.hasAttribute('feedback-shown')) {
          this.dispatchPanelEvent(successEvent, {
            ...attrs,
            action: 'copied'
          });
        }
      });

      observer.observe(button, {
        attributes: true,
        attributeFilter: ['feedback-shown']
      });

      button._copyObserver = observer;
    }
  }
}

/**
 * Combo Button - composed of button + menu
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSComboButton): void}}
 */
export const cdsComboButWrap = {
  selector: 'cds-combo-button',

  /**
   * @param {CDSComboButton} button - The CDSComboButton custom element instance
   * @this {Panel} The panel instance
   */
  init: function (button) {
    const attrs = getSemanticAttributes(button);

    // Listen for clicks on the combo button itself
    // The click event bubbles up from the shadow DOM button
    if (attrs.event) {
      this.listen(button, 'click', e => {
        // Check if this is a primary button click (not menu or trigger)
        const path = e.composedPath();
        const isMenuItemClick = path.some(el => el.tagName === 'CDS-MENU-ITEM');
        const isIconButtonClick = path.some(el => el.tagName === 'CDS-ICON-BUTTON');

        // Only dispatch for primary button clicks
        if (!isMenuItemClick && !isIconButtonClick) {
          e.stopPropagation();
          this.dispatchPanelEvent(attrs.event, {
            ...attrs,
            action: 'primary'
          });
        }
      });
    }

    // Listen for menu item selections
    const menu = button.querySelector('cds-menu');
    if (menu) {
      this.listen(menu, 'click', e => {
        if (e.target.tagName === 'CDS-MENU-ITEM') {
          const menuItemAttrs = getSemanticAttributes(e.target);
          const menuEventName = menuItemAttrs.event || getEventAttribute(button, 'menu-event', 'event');

          if (menuEventName) {
            this.dispatchPanelEvent(menuEventName, {
              ...attrs,
              ...menuItemAttrs,
              action: 'menu-item'
            });
          }
        }
      });
    }
  }
}
