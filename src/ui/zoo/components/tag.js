/**
 * Zoo Tag Component
 *
 * A generic tag/badge component styled via CSS custom properties (design tokens).
 * Framework-agnostic presentation component - contains no business logic.
 *
 * Usage:
 *   <zoo-tag token="warning">Warning</zoo-tag>
 *   <zoo-tag token="52">State 52</zoo-tag>
 *   <zoo-tag token="error">Error</zoo-tag>
 *
 * Styling via CSS Custom Properties (Design Tokens):
 *   --zoo-tag-{token}-bg: Background color
 *   --zoo-tag-{token}-fg: Foreground (text) color
 *   --zoo-tag-default-bg: Fallback background (if token not defined)
 *   --zoo-tag-default-fg: Fallback foreground (if token not defined)
 *
 * Token values can be ANY string (numbers, names, whatever):
 *   --zoo-tag-error-bg: #d32f2f;
 *   --zoo-tag-52-bg: #4fb50b;
 *   --zoo-tag-blah-bg: #999999;
 *
 * Applications define their own tokens in their stylesheets:
 *   :root {
 *     --zoo-tag-error-bg: #ff0000;
 *     --zoo-tag-error-fg: #ffffff;
 *     --zoo-tag-52-bg: #4fb50b;  // z2 LC_ACTIVATED
 *     --zoo-tag-52-fg: #ffffff;
 *   }
 */

import { LitElement, html, css } from 'lit';

export class ZooTag extends LitElement {
  static properties = {
    token: { type: String }
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      min-height: 1.5rem;
      max-width: 100%;
      min-width: 2rem;
      padding: 0 0.5rem;
      border-radius: 0.9375rem;
      font-size: 0.75rem;
      font-weight: 400;
      line-height: 1.33333;
      letter-spacing: 0.32px;
      white-space: nowrap;
      word-break: break-word;
      box-sizing: border-box;
    }
  `;

  render() {
    const token = this.token ?? 'default';

    return html`
      <span
        class="tag"
        style="
          background-color: var(--zoo-tag-${token}-bg, var(--zoo-tag-default-bg, #9e9e9e));
          color: var(--zoo-tag-${token}-fg, var(--zoo-tag-default-fg, #ffffff));
        "
      >
        <slot></slot>
      </span>
    `;
  }
}

// Auto-register if not already defined
if (!customElements.get('zoo-tag')) {
  customElements.define('zoo-tag', ZooTag);
}
