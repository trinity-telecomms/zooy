/**
 * Carbon Form Input Components
 *
 * Handles text-based form inputs and search.
 */

// noinspection JSFileReferences
const tooltipImport = () => import('@carbon/web-components/es/components/tooltip/index.js');
// noinspection JSFileReferences
const textInputImport = () => import('@carbon/web-components/es/components/text-input/index.js');
// noinspection JSFileReferences
const textareaImport = () => import('@carbon/web-components/es/components/textarea/index.js');
// noinspection JSFileReferences
const numberInputImport = () => import('@carbon/web-components/es/components/number-input/index.js');
// noinspection JSFileReferences
const passwordInputImport = () => import('@carbon/web-components/es/components/password-input/index.js');
// noinspection JSFileReferences
const searchImport = () => import('@carbon/web-components/es/components/search/index.js');

// Text Input
export default {
  selector: 'cds-text-input',
  import: textInputImport,
  multiEvent: true,
  events: [
    {
      type: 'input',
      attrName: 'event',
      getData: (e, attrs) => ({
        ...attrs,
        value: e.currentTarget.value
      })
    },
    {
      type: 'change',
      attrName: 'change-event',
      getData: (e, attrs) => ({
        ...attrs,
        value: e.currentTarget.value
      })
    }
  ]
};

// Related input components
export const formInputComponents = {
  // Text Area
  'cds-textarea': {
    import: textareaImport,
    multiEvent: true,
    events: [
      {
        type: 'input',
        attrName: 'event',
        getData: (e, attrs) => ({
          ...attrs,
          value: e.currentTarget.value
        })
      },
      {
        type: 'change',
        attrName: 'change-event',
        getData: (e, attrs) => ({
          ...attrs,
          value: e.currentTarget.value
        })
      }
    ]
  },

  // Number Input
  'cds-number-input': {
    import: numberInputImport,
    event: 'cds-number-input',
    getData: (e, attrs, element) => ({
      ...attrs,
      value: e.detail.value,
      direction: e.detail.direction  // 'up' or 'down' when using steppers
    })
  },

  // Password Input
  'cds-password-input': {
    import: [tooltipImport, passwordInputImport],
    multiEvent: true,
    events: [
      {
        type: 'input',
        attrName: 'event',
        getData: (e, attrs) => ({
          ...attrs,
          value: e.currentTarget.value
        })
      },
      {
        type: 'change',
        attrName: 'change-event',
        getData: (e, attrs) => ({
          ...attrs,
          value: e.currentTarget.value
        })
      }
    ]
  },

  // Search
  'cds-search': {
    import: searchImport,
    event: 'cds-search-input',
    getData: (e, attrs, element) => ({
      ...attrs,
      value: element.value
    })
  }
};
