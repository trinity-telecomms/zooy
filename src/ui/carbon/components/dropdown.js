/**
 * Carbon Dropdown, Combo Box, and Multi Select Components
 *
 * Handles dropdown selection components and their variations.
 */

import {getSemanticAttributes} from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/dropdown/dropdown.js').default} CDSDropdown
 * @typedef {import('@carbon/web-components/es/components/combo-box/combo-box.js').default} CDSComboBox
 * @typedef {import('@carbon/web-components/es/components/multi-select/multi-select.js').default} CDSMultiSelect
 */

/**
 * Dropdown
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSDropdown): void}}
 */
export const cdsDropdownWrap = {
  selector: 'cds-dropdown',

  /**
   * @param {CDSDropdown} dropdown - The CDSDropdown custom element instance
   * @this {Panel} The panel instance
   */
  init: function (dropdown) {
    const CDSDropdown = customElements.get('cds-dropdown');
    const attrs = getSemanticAttributes(dropdown);

    // Selection event (when item is selected)
    const selectionEvent = attrs.event;
    if (selectionEvent) {
      this.listen(dropdown, CDSDropdown.eventSelect, e => {
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
      this.listen(dropdown, CDSDropdown.eventToggle, _ => {
        this.dispatchPanelEvent(toggleEvent, {
          ...attrs,
          open: dropdown.hasAttribute('open')
        });
      });
    }
  }
};

/**
 * Combo Box
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSComboBox): void}}
 */
export const cdsComboBoxWrap = {
  selector: 'cds-combo-box',

  /**
   * @param {CDSComboBox} comboBox - The CDSComboBox custom element instance
   * @this {Panel} The panel instance
   */
  init: function (comboBox) {
    const CDSComboBox = customElements.get('cds-combo-box');
    const attrs = getSemanticAttributes(comboBox);

    // Selection event (when item is selected)
    const selectionEvent = attrs.event;
    if (selectionEvent) {
      this.listen(comboBox, CDSComboBox.eventSelect, e => {
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
      this.listen(comboBox, CDSComboBox.eventToggle, _ => {
        this.dispatchPanelEvent(toggleEvent, {
          ...attrs,
          open: comboBox.hasAttribute('open')
        });
      });
    }
  }
}

/**
 * Multi-Select
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSMultiSelect): void}}
 */
export const cdsMultiSelectWrap = {
  selector: 'cds-multi-select',

  /**
   * @param {CDSMultiSelect} multiSelect - The CDSMultiSelect custom element instance
   * @this {Panel} The panel instance
   */
  init: function (multiSelect) {
    const CDSMultiSelect = customElements.get('cds-multi-select');
    const attrs = getSemanticAttributes(multiSelect);

    // Selection event (when items are selected/deselected)
    const selectionEvent = attrs.event;
    if (selectionEvent) {
      this.listen(multiSelect, CDSMultiSelect.eventSelect, _ => {
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
      this.listen(multiSelect, CDSMultiSelect.eventToggle, _ => {
        this.dispatchPanelEvent(toggleEvent, {
          ...attrs,
          open: multiSelect.hasAttribute('open')
        });
      });
    }
  }
}
