/**
 * Carbon Button Components
 *
 * Handles various button types including standard buttons, icon buttons, and combo buttons.
 */

import { getSemanticAttributes, getEventAttribute } from '../../zoo/index.js';

const buttonImport = () => import('@carbon/web-components/es/components/button/index.js');
const iconButtonImport = () => import('@carbon/web-components/es/components/icon-button/index.js');
const comboButtonImport = () => import('@carbon/web-components/es/components/combo-button/index.js');
const copyButtonImport = () => import('@carbon/web-components/es/components/copy-button/index.js');

// Standard Button
export default {
  selector: 'cds-button',
  import: buttonImport,
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
};

// Button-related components configuration
export const buttonComponents = {
  // Icon Button (non-toggle)
  'cds-icon-button:not([data-toggle])': {
    import: iconButtonImport,
    event: 'click',
    getData: (e, attrs) => attrs
  },

  // Icon Toggle - Toggles Carbon's built-in isSelected state for ghost icon buttons
  // Visual styling (subtle background change) is handled by Carbon's CSS
  'cds-icon-button[data-toggle]': {
    import: iconButtonImport,
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
  },

  // FAB (Floating Action Button) - just a styled button
  'cds-button[data-fab]': {
    import: buttonImport,
    event: 'click',
    getData: (e, attrs) => attrs
  },

  // Copy Button - Button that copies text to clipboard
  'cds-copy-button': {
    import: copyButtonImport,
    init: function(copyButton) {
      const attrs = getSemanticAttributes(copyButton);

      // Click event - fires when button is clicked (before copy)
      const clickEvent = attrs.event;
      if (clickEvent) {
        this.listen(copyButton, 'click', e => {
          e.stopPropagation();
          this.dispatchPanelEvent(clickEvent, {
            ...attrs,
            action: 'copy'
          });
        });
      }

      // Success event - fires after successful copy (if specified separately)
      const successEvent = copyButton.getAttribute('success-event');
      if (successEvent) {
        // Monitor for the feedback text to appear (indicates successful copy)
        const observer = new MutationObserver(() => {
          if (copyButton.hasAttribute('feedback-shown')) {
            this.dispatchPanelEvent(successEvent, {
              ...attrs,
              action: 'copied'
            });
          }
        });

        observer.observe(copyButton, {
          attributes: true,
          attributeFilter: ['feedback-shown']
        });

        copyButton._copyObserver = observer;
      }
    }
  },

  // Combo Button - composed of button + menu
  'cds-combo-button': {
    import: comboButtonImport,
    init: function (comboButton) {
      const attrs = getSemanticAttributes(comboButton);

      // Listen for clicks on the combo button itself
      // The click event bubbles up from the shadow DOM button
      if (attrs.event) {
        this.listen(comboButton, 'click', e => {
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
      const menu = comboButton.querySelector('cds-menu');
      if (menu) {
        this.listen(menu, 'click', e => {
          if (e.target.tagName === 'CDS-MENU-ITEM') {
            const menuItemAttrs = getSemanticAttributes(e.target);
            const menuEventName = menuItemAttrs.event || getEventAttribute(comboButton, 'menu-event', 'event');

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
};
