/**
 * Carbon Form Control Components
 *
 * Handles checkboxes, radio buttons, toggles, selects, and sliders.
 */

import { getSemanticAttributes } from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/checkbox/checkbox.js').default} CDSCheckbox
 * @typedef {import('@carbon/web-components/es/components/radio-button/radio-button-group.js').default} CDSRadioButtonGroup
 * @typedef {import('@carbon/web-components/es/components/toggle/toggle.js').default} CDSToggle
 * @typedef {import('@carbon/web-components/es/components/select/select.js').default} CDSSelect
 * @typedef {import('@carbon/web-components/es/components/slider/slider.js').default} CDSSlider
 */

// noinspection JSFileReferences
const checkboxImport = () => import('@carbon/web-components/es/components/checkbox/index.js');
// noinspection JSFileReferences
const radioButtonImport = () => import('@carbon/web-components/es/components/radio-button/index.js');
// noinspection JSFileReferences
const toggleImport = () => import('@carbon/web-components/es/components/toggle/index.js');
// noinspection JSFileReferences
const selectImport = () => import('@carbon/web-components/es/components/select/index.js');
// noinspection JSFileReferences
const sliderImport = () => import('@carbon/web-components/es/components/slider/index.js');

// Checkbox - Carbon uses custom event
export default {
  selector: 'cds-checkbox',
  import: checkboxImport,
  event: 'cds-checkbox-changed',
  getData: (e, attrs, element) => ({
    ...attrs,
    checked: e.detail.checked,
    value: element.value
  })
};

// Other form control components
export const formControlComponents = {
  // Radio Button Group - only listen to the group, not individual buttons
  'cds-radio-button-group': {
    import: radioButtonImport,
    event: 'cds-radio-button-group-changed',
    getData: (e, attrs) => ({
      ...attrs,
      value: e.detail?.value
    })
  },

  // Toggle
  'cds-toggle': {
    import: toggleImport,
    event: 'cds-toggle-changed',
    getData: (e, attrs) => ({
      ...attrs,
      isOn: e.detail.checked,
      value: e.detail.checked
    })
  },

  // Select
  'cds-select': {
    import: selectImport,
    event: 'cds-select-selected',
    getData: (e, attrs) => ({
      ...attrs,
      value: e.detail.value
    })
  },

  // Slider
  'cds-slider': {
    import: sliderImport,
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
            ...attrs,
            value: e.detail.value
          });
        });
      }

      // Input change event (when slider's text input is changed)
      const inputEvent = slider.getAttribute('input-event');
      if (inputEvent) {
        this.listen(slider, 'cds-slider-input-changed', e => {
          this.dispatchPanelEvent(inputEvent, {
            ...attrs,
            value: e.detail.value
          });
        });
      }
    }
  }
};
