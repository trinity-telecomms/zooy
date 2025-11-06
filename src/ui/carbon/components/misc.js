/**
 * Carbon Miscellaneous Components
 *
 * Handles links, code snippets, and other standalone components.
 */

import { getSemanticAttributes } from '../../zoo/index.js';

const linkImport = () => import('@carbon/web-components/es/components/link/index.js');
const codeSnippetImport = () => import('@carbon/web-components/es/components/code-snippet/index.js');

// Link
export default {
  selector: 'cds-link',
  import: linkImport,
  event: 'click',
  getData: (e, attrs, element) => ({
    ...attrs,
    href: element.getAttribute('href')
  })
};

// Other misc components
export const miscComponents = {
  // Code Snippet
  'cds-code-snippet': {
    import: codeSnippetImport,
    event: 'cds-copy-button-clicked',
    getData: (e, attrs) => ({
      ...attrs,
      action: 'copied'
    })
  }
};
