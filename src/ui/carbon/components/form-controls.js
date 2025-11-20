/**
 * Carbon Form Control Components
 *
 * Handles checkboxes, radio buttons, toggles, selects, and sliders.
 */

import {getSemanticAttributes} from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/checkbox/checkbox.js').default} CDSCheckbox
 * @typedef {import('@carbon/web-components/es/components/radio-button/radio-button-group.js').default} CDSRadioButtonGroup
 * @typedef {import('@carbon/web-components/es/components/toggle/toggle.js').default} CDSToggle
 * @typedef {import('@carbon/web-components/es/components/select/select.js').default} CDSSelect
 * @typedef {import('@carbon/web-components/es/components/slider/slider.js').default} CDSSlider
 */

/**
 * Checkbox
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *, *): *&{checked: *, value: *}}}
 */
export const cdsCheckboxWrap = {
  selector: 'cds-checkbox',
  event: 'cds-checkbox-changed',
  getData: (e, attrs, element) => ({
    ...attrs, checked: e.detail.checked, value: element.value
  })
}

/**
 * Radio Group
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *): *&{value: *}}}
 */
export const cdsRadioButGroupWrap = {
  selector: 'cds-radio-button-group',
  event: 'cds-radio-button-group-changed',
  getData: (e, attrs) => ({
    ...attrs, value: e.detail?.value
  })
}

/**
 * Toggle
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *): *&{isOn: *, value: *}}}
 */
export const cdsToggleWrap = {
  selector: 'cds-toggle',
  event: 'cds-toggle-changed',
  getData: (e, attrs) => ({
    ...attrs, isOn: e.detail.checked, value: e.detail.checked
  })
}

/**
 * Select
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *): *&{value: *}}}
 */
export const cdsSelectWrap = {
  selector: 'cds-select',
  event: 'cds-select-selected',
  getData: (e, attrs) => ({
    ...attrs, value: e.detail.value
  })
}

/**
 * Slider
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSSlider): void}}
 */
export const cdsSliderWrap = {
  selector: 'cds-slider',

  /**
   * @param {CDSSlider} slider - The CDSSlider custom element instance
   * @this {Panel} The panel instance
   */
  init: function (slider) {
    const attrs = getSemanticAttributes(slider);

    // Slider change event (when slider handle is moved)
    const changeEvent = attrs.event;
    if (changeEvent) {
      this.listen(slider, 'cds-slider-changed', e => {
        this.dispatchPanelEvent(changeEvent, {
          ...attrs, value: e.detail.value
        });
      });
    }

    // Input change event (when slider's text input is changed)
    const inputEvent = slider.getAttribute('input-event');
    if (inputEvent) {
      this.listen(slider, 'cds-slider-input-changed', e => {
        this.dispatchPanelEvent(inputEvent, {
          ...attrs, value: e.detail.value
        });
      });
    }
  }
}
