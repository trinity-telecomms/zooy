/**
 * Carbon Form Input Components
 *
 * Handles text-based form inputs and search.
 */


/**
 * Text Input
 * @type {{selector: string, import: (function(): Promise<*>)|*, multiEvent: boolean, events: [{type: string, attrName: string, getData: function(*, *): *&{value: *}},{type: string, attrName: string, getData: function(*, *): *&{value: *}}]}}
 */
export const cdsTextInputWrap = {
  selector: 'cds-text-input',
  multiEvent: true,
  events: [
    {
      type: 'input',
      attrName: 'event',
      getData: (e, attrs) => ({
        ...attrs, value: e.currentTarget.value
      })
    },
    {
      type: 'change',
      attrName: 'change-event',
      getData: (e, attrs) => ({
        ...attrs, value: e.currentTarget.value
      })
    }]
};

/**
 * TextArea
 * @type {{selector: string, import: (function(): Promise<*>)|*, multiEvent: boolean, events: [{type: string, attrName: string, getData: function(*, *): *&{value: *}},{type: string, attrName: string, getData: function(*, *): *&{value: *}}]}}
 */
export const cdsTextAreaWrap = {
  selector: 'cds-textarea',
  multiEvent: true,
  events: [
    {
      type: 'input',
      attrName: 'event',
      getData: (e, attrs) => ({
        ...attrs, value: e.currentTarget.value
      })
    },
    {
      type: 'change',
      attrName: 'change-event',
      getData: (e, attrs) => ({
        ...attrs, value: e.currentTarget.value
      })
    }]
}

/**
 * Number Input
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *, *): *&{value: *, direction: *}}}
 */
export const cdsNumberInputWrap = {
  selector: 'cds-number-input',
  event: 'cds-number-input',
  getData: (e, attrs, _) => ({
    ...attrs, value: e.detail.value, direction: e.detail.direction  // 'up' or 'down' when using steppers
  })

}

/**
 * Password Input
 * @type {{selector: string, import: ((function(): Promise<*>)|*|(function(): Promise<*>))[], multiEvent: boolean, events: [{type: string, attrName: string, getData: function(*, *): *&{value: *}},{type: string, attrName: string, getData: function(*, *): *&{value: *}}]}}
 */
export const cdsPasswordInputWrap = {
  selector: 'cds-password-input',
  multiEvent: true,
  events: [
    {
      type: 'input',
      attrName: 'event',
      getData: (e, attrs) => ({
        ...attrs, value: e.currentTarget.value
      })
    },
    {
      type: 'change',
      attrName: 'change-event',
      getData: (e, attrs) => ({
        ...attrs, value: e.currentTarget.value
      })
    }]

}

/**
 * Search Input
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *, *): *&{value: *}}}
 */
export const cdsSearchWrap = {
    selector: 'cds-search',
    event: 'cds-search-input',
    getData: (e, attrs, element) => ({
      ...attrs, value: element.value
    })
  }

