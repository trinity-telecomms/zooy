/**
 * Zoo Timestamp Component
 *
 * A native web component that displays timestamps in various modes including
 * relative time (e.g., "5 minutes ago") and static datetime displays.
 * Intelligently listens to Conductor time ticks only when displaying relative time.
 *
 *  Kind Options
 *
 *   | Kind       | Output               | Updates? |
 *   |------------|----------------------|----------|
 *   | 'relative' | "5 minutes ago"      | Yes      |
 *   | 'datetime' | "05 Jan 21 14:30:22" | No       |
 *   | 'date'     | "05 Jan 21"          | No       |
 *   | 'both'     | Controlled by concat | Yes      |
 *
 *   Concat Placeholders (explicit)
 *
 *   - r = relative time
 *   - s = static datetime
 *   - Default: "r (s)"
 *
 * Basic Usage:
 *   <zoo-timestamp timestamp="1637251200000"></zoo-timestamp>
 *   // Displays: "5 minutes ago (05 Jan 21 14:30:22)"
 *
 * Kind Options:
 *   <zoo-timestamp timestamp="1637251200000" kind="relative"></zoo-timestamp>
 *   // Displays: "5 minutes ago" (updates on beat)
 *
 *   <zoo-timestamp timestamp="1637251200000" kind="datetime"></zoo-timestamp>
 *   // Displays: "05 Jan 21 14:30:22" (static, no updates)
 *
 *   <zoo-timestamp timestamp="1637251200000" kind="date"></zoo-timestamp>
 *   // Displays: "05 Jan 21" (static, no updates)
 *
 *   <zoo-timestamp timestamp="1637251200000" kind="both"></zoo-timestamp>
 *   // Displays: "5 minutes ago (05 Jan 21 14:30:22)" (updates on beat)
 *
 * Custom Concatenation (kind="both" only):
 *   <zoo-timestamp timestamp="1637251200000" kind="both" concat="r (s)"></zoo-timestamp>
 *   // Displays: "5 minutes ago (05 Jan 21 14:30:22)"
 *
 *   <zoo-timestamp timestamp="1637251200000" kind="both" concat="s | r"></zoo-timestamp>
 *   // Displays: "05 Jan 21 14:30:22 | 5 minutes ago"
 *
 *   <zoo-timestamp timestamp="1637251200000" kind="both" concat="r - s"></zoo-timestamp>
 *   // Displays: "5 minutes ago - 05 Jan 21 14:30:22"
 *
 * With Binder:
 *   <zoo-timestamp zoo-bind-attr="timestamp:createdAt" kind="relative"></zoo-timestamp>
 *
 * Styling with CSS Custom Properties:
 *   The component renders with semantic class names for flexible styling:
 *   - .relative: Wraps the relative time portion
 *   - .static: Wraps the static datetime portion
 *   - .separator: Wraps any text between relative and static portions
 *
 *   Example - Emphasize relative time:
 *   zoo-timestamp .relative { font-weight: bold; }
 *   zoo-timestamp .static { opacity: 0.6; font-size: 0.875em; }
 *
 *   Example - Emphasize static time:
 *   zoo-timestamp .static { font-weight: bold; }
 *   zoo-timestamp .relative { opacity: 0.6; font-size: 0.875em; }
 *
 *   CSS Custom Properties:
 *   - --zoo-timestamp-relative-color: Color for relative time
 *   - --zoo-timestamp-relative-weight: Font weight for relative time
 *   - --zoo-timestamp-relative-size: Font size for relative time
 *   - --zoo-timestamp-static-color: Color for static time
 *   - --zoo-timestamp-static-weight: Font weight for static time
 *   - --zoo-timestamp-static-size: Font size for static time
 *   - --zoo-timestamp-separator-color: Color for separator text
 *
 * Attributes:
 *   - timestamp: Unix timestamp in milliseconds (or seconds if < 946684800000)
 *   - kind: Display mode - 'both' (default), 'relative', 'datetime', 'date'
 *   - concat: Template for combining relative and datetime when kind="both"
 *             Default: "r (s)"
 *             Use 'r' for relative time, 's' for static datetime
 *
 * Updates:
 *   - Only listens to 'zoo-tick-60' events when kind is 'relative' or 'both'
 *   - Static kinds (datetime, date) never update
 *   - All instances update in sync with a single app-wide timer
 *   - No per-component timers = efficient at scale
 */

import { LitElement, html, css } from 'lit';

/**
 * Native implementation to format a date as relative time (e.g., "5 minutes ago")
 * Uses Intl.RelativeTimeFormat API
 * @param {Date} date - The date to format
 * @returns {string} Formatted relative time string
 */
const formatRelativeTime = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  const units = [
    { name: 'year', seconds: 31536000 },
    { name: 'month', seconds: 2592000 },
    { name: 'week', seconds: 604800 },
    { name: 'day', seconds: 86400 },
    { name: 'hour', seconds: 3600 },
    { name: 'minute', seconds: 60 },
    { name: 'second', seconds: 1 }
  ];

  // Handle future dates
  if (diffInSeconds < 0) {
    const absDiff = Math.abs(diffInSeconds);
    for (const unit of units) {
      const value = Math.floor(absDiff / unit.seconds);
      if (value >= 1) {
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        return rtf.format(value, unit.name);
      }
    }
    return 'just now';
  }

  // Handle past dates
  for (const unit of units) {
    const value = Math.floor(diffInSeconds / unit.seconds);
    if (value >= 1) {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      return rtf.format(-value, unit.name);
    }
  }

  return 'just now';
};

/**
 * Formats a date to zooy standard datetime string
 * @param {Date} d - The date to format
 * @returns {string} Formatted datetime string (e.g., "05 Jan 21 14:30:22")
 */
const formatDatetime = d => {
  const dtf = new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });

  const [{value: mo}, , {value: da}, , {value: ye}, , {value: hr}, , {value: mn}, , {value: sc}] = dtf.formatToParts(d);
  return `${da} ${mo} ${ye} ${hr}:${mn}:${sc}`;
};

/**
 * Formats a date to zooy standard date string (no time)
 * @param {Date} d - The date to format
 * @returns {string} Formatted date string (e.g., "05 Jan 21")
 */
const formatDate = d => {
  const dtf = new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });

  const [{value: mo}, , {value: da}, , {value: ye}] = dtf.formatToParts(d);
  return `${da} ${mo} ${ye}`;
};

export class ZooTimestamp extends LitElement {
  static properties = {
    timestamp: { type: Number },
    kind: { type: String },
    concat: { type: String }
  };

  static styles = css`
    :host {
      display: inline;
    }

    .relative {
      color: var(--zoo-timestamp-relative-color, inherit);
      font-weight: var(--zoo-timestamp-relative-weight, inherit);
      font-size: var(--zoo-timestamp-relative-size, inherit);
    }

    .static {
      color: var(--zoo-timestamp-static-color, inherit);
      font-weight: var(--zoo-timestamp-static-weight, inherit);
      font-size: var(--zoo-timestamp-static-size, inherit);
    }

    .separator {
      color: var(--zoo-timestamp-separator-color, inherit);
    }
  `;

  constructor() {
    super();
    this.timestamp = Date.now();
    this.kind = 'both';
    this.concat = 'r (s)'; // Default concat template
    this._boundTickHandler = this._onTimeTick.bind(this);
    this._isListening = false;
  }

  /**
   * Determines if the current kind requires listening to time ticks
   * @returns {boolean}
   */
  _shouldListenToTicks() {
    return this.kind === 'relative' || this.kind === 'both';
  }

  connectedCallback() {
    super.connectedCallback();
    this._updateTickListener();
  }

  disconnectedCallback() {
    this._removeTickListener();
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    // If kind changed, update tick listener
    if (changedProperties.has('kind')) {
      this._updateTickListener();
    }
  }

  /**
   * Add or remove tick listener based on kind
   */
  _updateTickListener() {
    const shouldListen = this._shouldListenToTicks();

    if (shouldListen && !this._isListening) {
      document.addEventListener('zoo-tick-60', this._boundTickHandler);
      this._isListening = true;
    } else if (!shouldListen && this._isListening) {
      this._removeTickListener();
    }
  }

  /**
   * Remove tick listener
   */
  _removeTickListener() {
    if (this._isListening) {
      document.removeEventListener('zoo-tick-60', this._boundTickHandler);
      this._isListening = false;
    }
  }

  _onTimeTick() {
    // Trigger re-render when time tick occurs
    this.requestUpdate();
  }

  /**
   * Parses the concat template and splits it into parts
   * @param {string} template - Template string with 'r' and 's' placeholders
   * @returns {Array} Array of objects with {type: 'text'|'relative'|'static', value: string}
   */
  _parseTemplate(template) {
    const parts = [];
    let remaining = template;

    while (remaining.length > 0) {
      const rIndex = remaining.indexOf('r');
      const sIndex = remaining.indexOf('s');

      // Find which placeholder comes first
      const nextIndex = [rIndex, sIndex]
        .filter(i => i !== -1)
        .sort((a, b) => a - b)[0];

      if (nextIndex === undefined) {
        // No more placeholders, add remaining as text
        if (remaining.length > 0) {
          parts.push({ type: 'text', value: remaining });
        }
        break;
      }

      // Add text before placeholder
      if (nextIndex > 0) {
        parts.push({ type: 'text', value: remaining.substring(0, nextIndex) });
      }

      // Add placeholder
      if (nextIndex === rIndex) {
        parts.push({ type: 'relative', value: '' });
      } else {
        parts.push({ type: 'static', value: '' });
      }

      // Move past the placeholder
      remaining = remaining.substring(nextIndex + 1);
    }

    return parts;
  }

  _getFormattedParts() {
    let ts = this.timestamp;

    // Convert seconds to milliseconds if needed
    if (ts < 946684800000) {
      ts = ts * 1000;
    }

    const date = new Date(ts);
    const relative = formatRelativeTime(date);
    const staticTime = formatDatetime(date);
    const dateOnly = formatDate(date);

    switch (this.kind) {
      case 'relative':
        return [{ type: 'relative', value: relative }];

      case 'datetime':
        return [{ type: 'static', value: staticTime }];

      case 'date':
        return [{ type: 'static', value: dateOnly }];

      case 'both':
        const parts = this._parseTemplate(this.concat);
        return parts.map(part => {
          if (part.type === 'relative') {
            return { type: 'relative', value: relative };
          } else if (part.type === 'static') {
            return { type: 'static', value: staticTime };
          } else {
            return part;
          }
        });

      default:
        // Default to 'both'
        const defaultParts = this._parseTemplate(this.concat);
        return defaultParts.map(part => {
          if (part.type === 'relative') {
            return { type: 'relative', value: relative };
          } else if (part.type === 'static') {
            return { type: 'static', value: staticTime };
          } else {
            return part;
          }
        });
    }
  }

  render() {
    let ts = this.timestamp;
    if (ts < 946684800000) {
      ts = ts * 1000;
    }
    const date = new Date(ts);
    const parts = this._getFormattedParts();

    return html`<time datetime="${date.toISOString()}">
      ${parts.map(part => {
        if (part.type === 'relative') {
          return html`<span class="relative">${part.value}</span>`;
        } else if (part.type === 'static') {
          return html`<span class="static">${part.value}</span>`;
        } else {
          return html`<span class="separator">${part.value}</span>`;
        }
      })}
    </time>`;
  }
}

// Auto-register if not already defined
if (!customElements.get('zoo-timestamp')) {
  customElements.define('zoo-timestamp', ZooTimestamp);
}
