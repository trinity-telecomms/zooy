/**
 * Carbon Dropdown, Combo Box, and Multi Select Components
 *
 * Handles dropdown selection components and their variations.
 */

import { getSemanticAttributes } from '../../zoo/index.js';

const dropdownImport = () => import('@carbon/web-components/es/components/dropdown/index.js');
const comboBoxImport = () => import('@carbon/web-components/es/components/combo-box/index.js');
const multiSelectImport = () => import('@carbon/web-components/es/components/multi-select/index.js');

// Dropdown
export default {
  selector: 'cds-dropdown',
  import: dropdownImport,
  init: function (dropdown) {
    const attrs = getSemanticAttributes(dropdown);

    // Selection event (when item is selected)
    const selectionEvent = attrs.event;
    if (selectionEvent) {
      this.listen(dropdown, 'cds-dropdown-selected', e => {
        this.dispatchPanelEvent(selectionEvent, {
          ...attrs,
          value: dropdown.value,
          selectedValue: e.detail?.item?.value,
          selectedText: e.detail?.item?.textContent?.trim()
        });
      });
    }

    // Toggle event (when dropdown opens/closes)
    const toggleEvent = dropdown.getAttribute('toggle-event');
    if (toggleEvent) {
      this.listen(dropdown, 'cds-dropdown-toggled', _ => {
        this.dispatchPanelEvent(toggleEvent, {
          ...attrs,
          open: dropdown.hasAttribute('open')
        });
      });
    }
  }
};

// Related dropdown components
export const dropdownComponents = {
  // Combo Box
  'cds-combo-box': {
    import: comboBoxImport,
    init: function (comboBox) {
      const attrs = getSemanticAttributes(comboBox);

      // Selection event (when item is selected)
      const selectionEvent = attrs.event;
      if (selectionEvent) {
        this.listen(comboBox, 'cds-combo-box-selected', e => {
          const item = e.detail?.item;
          this.dispatchPanelEvent(selectionEvent, {
            ...attrs,
            value: comboBox.value,
            selectedValue: item?.value,
            selectedText: item?.textContent?.trim()
          });
        });
      }

      // Toggle event (when combo box opens/closes)
      const toggleEvent = comboBox.getAttribute('toggle-event');
      if (toggleEvent) {
        this.listen(comboBox, 'cds-combo-box-toggled', _ => {
          this.dispatchPanelEvent(toggleEvent, {
            ...attrs,
            open: comboBox.hasAttribute('open')
          });
        });
      }
    }
  },

  // Multi Select
  'cds-multi-select': {
    import: multiSelectImport,
    init: function (multiSelect) {
      const attrs = getSemanticAttributes(multiSelect);

      // Selection event (when items are selected/deselected)
      const selectionEvent = attrs.event;
      if (selectionEvent) {
        this.listen(multiSelect, 'cds-multi-select-selected', _ => {
          // Convert comma-separated value string to array
          const selectedItems = multiSelect.value ? multiSelect.value.split(',') : [];
          this.dispatchPanelEvent(selectionEvent, {
            ...attrs,
            selectedItems: selectedItems
          });
        });
      }

      // Toggle event (when multi-select opens/closes)
      const toggleEvent = multiSelect.getAttribute('toggle-event');
      if (toggleEvent) {
        this.listen(multiSelect, 'cds-multi-select-toggled', _ => {
          this.dispatchPanelEvent(toggleEvent, {
            ...attrs,
            open: multiSelect.hasAttribute('open')
          });
        });
      }
    }
  }
};
