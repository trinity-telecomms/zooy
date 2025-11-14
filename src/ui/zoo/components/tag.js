/**
 * Zoo Tag Component
 *
 * A generic tag/badge component styled via CSS custom properties (design tokens).
 * Framework-agnostic presentation component - contains no business logic.
 *
 * Basic Usage:
 *   <zoo-tag token="warning">Warning</zoo-tag>
 *   <zoo-tag token="52">State 52</zoo-tag>
 *   <zoo-tag token="error">Error</zoo-tag>
 *
 * With prefix/postfix for token namespacing:
 *   <zoo-tag token="123" prefix="state-" postfix="-active">Active</zoo-tag>
 *   // Looks for --zoo-tag-state-123-active-bg
 *
 * With Binder:
 *   <zoo-tag zoo-bind__attr="token:state" prefix="lc-" zoo-bind="description">
 *     Status
 *   </zoo-tag>
 *   // If state=52, looks for --zoo-tag-lc-52-bg
 *
 * Styling via CSS Custom Properties (Design Tokens):
 *   --zoo-tag-{prefix}{token}{postfix}-bg: Background color
 *   --zoo-tag-{prefix}{token}{postfix}-fg: Foreground (text) color
 *   --zoo-tag-default-bg: Fallback background (if token not defined)
 *   --zoo-tag-default-fg: Fallback foreground (if token not defined)
 *
 * Token values can be ANY string (numbers, names, whatever):
 *   --zoo-tag-error-bg: #d32f2f;
 *   --zoo-tag-52-bg: #4fb50b;
 *   --zoo-tag-lc-52-bg: #4fb50b;  // With prefix
 *   --zoo-tag-state-123-active-bg: #00ff00;  // With prefix and postfix
 *
 * Applications define their own tokens in their stylesheets:
 *   :root {
 *     --zoo-tag-error-bg: #ff0000;
 *     --zoo-tag-error-fg: #ffffff;
 *     --zoo-tag-lc-52-bg: #4fb50b;  // z2 LC_ACTIVATED with prefix
 *     --zoo-tag-lc-52-fg: #ffffff;
 *   }
 */

import { LitElement, html, css } from 'lit';

export class ZooTag extends LitElement {
  static properties = {
    token: { type: String },
    prefix: { type: String },
    postfix: { type: String }
  };

  static styles = css`
      :host {
          display: inline-block;
      }

      .tag {
          text-align: center;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: initial;
          width: max-content;
          padding: .2em 1em;
          border-radius: 1em;
          font-size: var(--zoo-theme-chips-font-size, 0.75rem);
          white-space: nowrap;
          word-break: break-word;
          box-sizing: border-box;
      }
  `;

  render() {
    const prefix = this.prefix ?? '';
    const token = this.token ?? 'default';
    const postfix = this.postfix ?? '';
    const fullToken = `${prefix}${token}${postfix}`;

    return html`
      <span
        class="tag"
        style="
          background-color: var(--zoo-tag-${fullToken}-bg, var(--zoo-tag-default-bg, #9e9e9e));
          color: var(--zoo-tag-${fullToken}-fg, var(--zoo-tag-default-fg, #ffffff));
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
