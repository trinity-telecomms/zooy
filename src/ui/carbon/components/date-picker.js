/**
 * Carbon Date Picker and Time Picker Components
 *
 * Handles date and time selection with support for range pickers.
 */

import { getSemanticAttributes } from '../../zoo/index.js';

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/date-picker/date-picker.js').default} CDSDatePicker
 * @typedef {import('@carbon/web-components/es/components/date-picker/date-picker-input.js').default} CDSDatePickerInput
 * @typedef {import('@carbon/web-components/es/components/time-picker/time-picker.js').default} CDSTimePicker
 */

// noinspection JSFileReferences
const datePickerImport = () => import('@carbon/web-components/es/components/date-picker/index.js');
// noinspection JSFileReferences
const timePickerImport = () => import('@carbon/web-components/es/components/time-picker/index.js');

// Date Picker
export default {
  selector: 'cds-date-picker',
  import: datePickerImport,
  /**
   * @param {CDSDatePicker} datePicker - The CDSDatePicker custom element instance
   * @this {Panel} The panel instance
   */
  init: function (datePicker) {
    const CDSDatePicker = customElements.get('cds-date-picker');
    const attrs = getSemanticAttributes(datePicker);

    // Detect if this is a range picker (has both "from" and "to" inputs)
    const fromInput = datePicker.querySelector('cds-date-picker-input[kind="from"]');
    const toInput = datePicker.querySelector('cds-date-picker-input[kind="to"]');
    const isRangePicker = fromInput && toInput;

    // Value change event (when date is selected)
    const changeEvent = attrs.event;
    if (changeEvent) {
      this.listen(datePicker, CDSDatePicker.eventChange, _ => {
        let value;
        if (isRangePicker) {
          // For range pickers, return both dates as an object
          value = {
            from: fromInput.value || '',
            to: toInput.value || ''
          };
        } else {
          // For single date pickers, return the value as before
          value = datePicker.value;
        }

        this.dispatchPanelEvent(changeEvent, {
          ...attrs,
          value: value
        });
      });
    }

    // Error event (when Flatpickr encounters an error)
    const errorEvent = datePicker.getAttribute('error-event');
    if (errorEvent) {
      this.listen(datePicker, CDSDatePicker.eventFlatpickrError, e => {
        this.dispatchPanelEvent(errorEvent, {
          ...attrs,
          error: e.detail
        });
      });
    }
  }
};

// Time Picker component
export const timePickerComponent = {
  'cds-time-picker': {
    import: timePickerImport,
    event: 'cds-time-picker-changed',
    getData: (e, attrs, element) => ({
      ...attrs,
      value: element.value
    })
  }
};
