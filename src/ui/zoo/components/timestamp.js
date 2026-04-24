/**
 * Zoo Timestamp Component
 *
 * A native web component that displays timestamps in various modes including
 * relative time (e.g., "5 minutes ago") and static datetime displays.
 * Intelligently listens to Conductor time ticks only when displaying relative time.
 *
 *  Kind Options
 *
 *   | Kind       | Output                              | Updates? |
 *   |------------|-------------------------------------|----------|
 *   | 'relative' | "5 minutes ago"                     | Yes      |
 *   | 'datetime' | "05 Jan 21 14:30:22"                | No       |
 *   | 'date'     | "05 Jan 21"                         | No       |
 *   | 'both'     | Inline, joined by concat template   | Yes      |
 *   | 'stack'    | Stacked (flex column), order from concat | Yes      |
 *
 *   Concat Placeholders (explicit)
 *
 *   - r = relative time
 *   - s = static datetime (full: "05 Jan 21 14:30:22")
 *   - d = static date-only (no time: "05 Jan 21")
 *   - Default: "r (s)"
 *   - In kind="stack", separator characters are discarded; only the
 *     order of the first 'r' and the first static marker ('s' or 'd',
 *     whichever appears earlier) is used.
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
 *   <zoo-timestamp timestamp="1637251200000" kind="both" concat="r (d)"></zoo-timestamp>
 *   // Displays: "5 minutes ago (05 Jan 21)"
 *
 * Stack Mode (kind="stack"):
 *   Renders relative and static times as two block-level lines.
 *   `concat` drives order only; separator characters are ignored.
 *
 *   <zoo-timestamp timestamp="1637251200000" kind="stack"></zoo-timestamp>
 *   // "5 minutes ago"
 *   // "05 Jan 21 14:30:22"
 *
 *   <zoo-timestamp timestamp="1637251200000" kind="stack" concat="sr"></zoo-timestamp>
 *   // "05 Jan 21 14:30:22"
 *   // "5 minutes ago"
 *
 *   Pair relative with date-only instead of datetime:
 *   <zoo-timestamp timestamp="1637251200000" kind="stack" concat="r d"></zoo-timestamp>
 *   // "5 minutes ago"
 *   // "05 Jan 21"
 *
 *   Toggle between inline and stacked without changing order:
 *   <zoo-timestamp kind="both"  concat="s - r"></zoo-timestamp>  // inline: "s - r"
 *   <zoo-timestamp kind="stack" concat="s - r"></zoo-timestamp>  // stacked: s on top, r below
 *
 *   Stack layout CSS custom properties:
 *   - --zoo-timestamp-stack-gap: Space between the two lines (default: 0)
 *   - --zoo-timestamp-stack-align: Cross-axis alignment — use start (left),
 *     center, or end (right). Default: stretch.
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
 *   - kind: Display mode - 'both' (default), 'relative', 'datetime', 'date', 'stack'
 *   - concat: Template for relative + static when kind="both" (inline join)
 *             or kind="stack" (order only; separators discarded).
 *             Default: "r (s)". Placeholders: 'r' = relative, 's' = datetime,
 *             'd' = date-only. In stack mode the first of 's' or 'd' wins.
 *
 * Updates:
 *   - Listens to 'zoo-tick-60' events when kind is 'relative', 'both', or 'stack'
 *   - Static kinds (datetime, date) never update
 *   - All instances update in sync with a single app-wide timer
 *   - No per-component timers = efficient at scale
 */

import { LitElement, html, css } from "lit";

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
    { name: "year", seconds: 31536000 },
    { name: "month", seconds: 2592000 },
    { name: "week", seconds: 604800 },
    { name: "day", seconds: 86400 },
    { name: "hour", seconds: 3600 },
    { name: "minute", seconds: 60 },
    { name: "second", seconds: 1 },
  ];

  // Handle future dates
  if (diffInSeconds < 0) {
    const absDiff = Math.abs(diffInSeconds);
    for (const unit of units) {
      const value = Math.floor(absDiff / unit.seconds);
      if (value >= 1) {
        const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
        return rtf.format(value, unit.name);
      }
    }
    return "just now";
  }

  // Handle past dates
  for (const unit of units) {
    const value = Math.floor(diffInSeconds / unit.seconds);
    if (value >= 1) {
      const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
      return rtf.format(-value, unit.name);
    }
  }

  return "just now";
};

/**
 * Formats a date to zooy standard datetime string
 * @param {Date} d - The date to format
 * @returns {string} Formatted datetime string (e.g., "05 Jan 21 14:30:22")
 */
const formatDatetime = (d) => {
  const dtf = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const [
    { value: mo },
    ,
    { value: da },
    ,
    { value: ye },
    ,
    { value: hr },
    ,
    { value: mn },
    ,
    { value: sc },
  ] = dtf.formatToParts(d);
  return `${da} ${mo} ${ye} ${hr}:${mn}:${sc}`;
};

/**
 * Formats a date to zooy standard date string (no time)
 * @param {Date} d - The date to format
 * @returns {string} Formatted date string (e.g., "05 Jan 21")
 */
const formatDate = (d) => {
  const dtf = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

  const [{ value: mo }, , { value: da }, , { value: ye }] = dtf.formatToParts(d);
  return `${da} ${mo} ${ye}`;
};

export class ZooTimestamp extends LitElement {
  static properties = {
    timestamp: { type: Number },
    kind: { type: String },
    concat: { type: String },
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

    :host([kind="stack"]) {
      display: inline-block;
      vertical-align: middle;
    }

    :host([kind="stack"]) time {
      display: flex;
      flex-direction: column;
      gap: var(--zoo-timestamp-stack-gap, 0);
      align-items: var(--zoo-timestamp-stack-align, stretch);
    }
  `;

  constructor() {
    super();
    this.timestamp = Date.now();
    this.kind = "both";
    this.concat = "r (s)"; // Default concat template
    this._boundTickHandler = this._onTimeTick.bind(this);
    this._isListening = false;
  }

  /**
   * Determines if the current kind requires listening to time ticks
   * @returns {boolean}
   */
  _shouldListenToTicks() {
    return this.kind === "relative" || this.kind === "both" || this.kind === "stack";
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
    if (changedProperties.has("kind")) {
      this._updateTickListener();
    }
  }

  /**
   * Add or remove tick listener based on kind
   */
  _updateTickListener() {
    const shouldListen = this._shouldListenToTicks();

    if (shouldListen && !this._isListening) {
      document.addEventListener("zoo-tick-60", this._boundTickHandler);
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
      document.removeEventListener("zoo-tick-60", this._boundTickHandler);
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
      const rIndex = remaining.indexOf("r");
      const sIndex = remaining.indexOf("s");
      const dIndex = remaining.indexOf("d");

      // Find which placeholder comes first
      const nextIndex = [rIndex, sIndex, dIndex].filter((i) => i !== -1).sort((a, b) => a - b)[0];

      if (nextIndex === undefined) {
        // No more placeholders, add remaining as text
        if (remaining.length > 0) {
          parts.push({ type: "text", value: remaining });
        }
        break;
      }

      // Add text before placeholder
      if (nextIndex > 0) {
        parts.push({ type: "text", value: remaining.substring(0, nextIndex) });
      }

      // Add placeholder
      if (nextIndex === rIndex) {
        parts.push({ type: "relative", value: "" });
      } else if (nextIndex === sIndex) {
        parts.push({ type: "static", value: "" });
      } else {
        parts.push({ type: "dateOnly", value: "" });
      }

      // Move past the placeholder
      remaining = remaining.substring(nextIndex + 1);
    }

    return parts;
  }

  /**
   * Extracts stack order from a concat template, discarding separators.
   * Only the first occurrence of 'r' and the first static marker (the
   * earlier of 's' or 'd') is considered.
   * @param {string} template - Template string with 'r', 's', 'd' placeholders
   * @returns {Array<'relative'|'static'|'dateOnly'>} Ordered list of part types
   */
  _parseStackOrder(template) {
    const rIndex = template.indexOf("r");
    const sIndex = template.indexOf("s");
    const dIndex = template.indexOf("d");

    // Pick the earlier-appearing static marker, if any
    let staticIndex = -1;
    let staticType = null;
    if (sIndex !== -1 && (dIndex === -1 || sIndex < dIndex)) {
      staticIndex = sIndex;
      staticType = "static";
    } else if (dIndex !== -1) {
      staticIndex = dIndex;
      staticType = "dateOnly";
    }

    if (rIndex !== -1 && staticIndex !== -1) {
      return rIndex < staticIndex ? ["relative", staticType] : [staticType, "relative"];
    }
    if (rIndex !== -1) return ["relative"];
    if (staticIndex !== -1) return [staticType];
    return ["relative", "static"];
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
      case "relative":
        return [{ type: "relative", value: relative }];

      case "datetime":
        return [{ type: "static", value: staticTime }];

      case "date":
        return [{ type: "static", value: dateOnly }];

      case "both": {
        const parts = this._parseTemplate(this.concat);
        return parts.map((part) => {
          if (part.type === "relative") {
            return { type: "relative", value: relative };
          } else if (part.type === "static") {
            return { type: "static", value: staticTime };
          } else if (part.type === "dateOnly") {
            return { type: "static", value: dateOnly };
          } else {
            return part;
          }
        });
      }

      case "stack": {
        const order = this._parseStackOrder(this.concat);
        return order.map((type) => {
          if (type === "relative") return { type: "relative", value: relative };
          if (type === "dateOnly") return { type: "static", value: dateOnly };
          return { type: "static", value: staticTime };
        });
      }

      default: {
        // Default to 'both'
        const defaultParts = this._parseTemplate(this.concat);
        return defaultParts.map((part) => {
          if (part.type === "relative") {
            return { type: "relative", value: relative };
          } else if (part.type === "static") {
            return { type: "static", value: staticTime };
          } else if (part.type === "dateOnly") {
            return { type: "static", value: dateOnly };
          } else {
            return part;
          }
        });
      }
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
      ${parts.map((part) => {
        if (part.type === "relative") {
          return html`<span class="relative">${part.value}</span>`;
        } else if (part.type === "static") {
          return html`<span class="static">${part.value}</span>`;
        } else {
          return html`<span class="separator">${part.value}</span>`;
        }
      })}
    </time>`;
  }
}

// Auto-register if not already defined
if (!customElements.get("zoo-timestamp")) {
  customElements.define("zoo-timestamp", ZooTimestamp);
}
