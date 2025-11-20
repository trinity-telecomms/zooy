/**
 * Carbon Miscellaneous Components
 *
 * Handles links, code snippets, and other standalone components.
 */


/**
 * Link
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *, *): *&{href: *}}}
 */
export const cdsLinkWrap = {
  selector: 'cds-link',
  event: 'click',
  getData: (e, attrs, element) => ({
    ...attrs,
    href: element.getAttribute('href')
  })
}

/**
 * Code Snippet
 * @type {{selector: string, import: (function(): Promise<*>)|*, event: string, getData: function(*, *): *&{action: string}}}
 */
export const cdsCodeSnipWrap = {
  selector: 'cds-code-snippet',
  event: 'cds-copy-button-clicked',
  getData: (e, attrs) => ({
    ...attrs,
    action: 'copied'
  })
}
