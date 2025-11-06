/**
 * DataBinder - Generic data binding for template-based rendering
 *
 * A lightweight, standards-compliant data binding solution that fetches JSON
 * from an API endpoint and renders it using native HTML <template> elements.
 *
 * Features:
 * - Native <template> element support
 * - Standard data-* attributes for binding
 * - Nested property access (e.g., "profile.name")
 * - Extensible formatter system
 * - Attribute binding
 * - Conditional rendering
 * - Standard DOM events for lifecycle
 *
 * @example
 * const binder = new DataBinder({
 *   url: '/api/users/',
 *   template: 'user-row-template',
 *   container: document.getElementById('user-list')
 * });
 *
 * await binder.load({ status: 'active' });
 */

import {isDefAndNotNull} from 'badu';


/**
 * Default formatters (minimal - add as needed).
 * @type {Object<string, Function>}
 */
const DEFAULT_FORMATTERS = {
  /**
   * Format as JSON (useful for debugging)
   */
  json: (value) => {
    return JSON.stringify(value, null, 2);
  }
};

export class DataBinder {
  #url;
  #template;
  #container;
  #data = [];
  #formatters;
  #dataPath;
  #fetchFn;

  /**
   * Creates a new DataBinder instance.
   *
   * @param {Object} options - Configuration options
   * @param {string} [options.url] - API endpoint URL (optional if using setData)
   * @param {string|HTMLTemplateElement} options.template - Template ID or element
   * @param {Element} options.container - Container element for rendered items
   * @param {string} [options.dataPath] - JSON path to data array (auto-detected if omitted)
   * @param {Function} [options.fetchFn] - Custom fetch function (for authentication, etc.)
   * @param {Object<string, Function>} [options.formatters] - Custom formatters
   * @throws {Error} If template or container is missing/invalid
   */
  constructor(options = {}) {
    // Validate required options
    if (!options.template) {
      throw new Error('DataBinder requires options.template');
    }
    if (!options.container) {
      throw new Error('DataBinder requires options.container');
    }

    // Store configuration
    this.#url = options.url;
    this.#dataPath = options.dataPath;
    this.#container = options.container;
    this.#fetchFn = options.fetchFn || fetch.bind(window);

    // Resolve template
    this.#template = typeof options.template === 'string' ? document.getElementById(options.template) : options.template;

    if (!this.#template || this.#template.tagName !== 'TEMPLATE') {
      throw new Error('DataBinder template must be a <template> element or valid template ID');
    }

    // Merge formatters
    this.#formatters = {...DEFAULT_FORMATTERS, ...options.formatters};
  }

  /**
   * Loads data from the configured URL with optional query parameters.
   * Dispatches 'data-loading', 'data-loaded', and 'data-error' events.
   *
   * @param {Object} [params={}] - Query parameters to append to URL
   * @return {Promise<Array>} The loaded data array
   * @throws {Error} If fetch fails or URL is not configured
   */
  async load(params = {}) {
    if (!this.#url) {
      throw new Error('DataBinder.load() requires a configured URL');
    }

    this.#dispatch('data-loading');

    try {
      // Build URL with query parameters
      const url = new URL(this.#url, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        if (isDefAndNotNull(value)) {
          url.searchParams.set(key, value);
        }
      });

      // Fetch data using custom fetch function (supports authentication)
      // Note: fetchFn can return either a Response object or JSON directly
      const result = await this.#fetchFn(url.toString());

      // Check if result is a Response object (standard fetch) or direct data
      const json = result instanceof Response ? (result.ok ? await result.json() : Promise.reject(new Error(`HTTP ${result.status}: ${result.statusText}`))) : result;
      this.#data = this.#extractData(json);

      // Validate data is an array
      if (!Array.isArray(this.#data)) {
        throw new Error('Extracted data is not an array');
      }

      this.render();

      this.#dispatch('data-loaded', {data: this.#data});
      return this.#data;

    } catch (error) {
      this.#dispatch('data-error', {error});
      throw error;
    }
  }

  /**
   * Sets data directly without fetching from URL.
   * Useful for static data or when data is already available.
   *
   * @param {Array} data - Array of data objects
   */
  setData(data) {
    this.#data = Array.isArray(data) ? data : [];
    this.render();
  }

  /**
   * Gets the current data array.
   *
   * @return {Array} The current data
   */
  getData() {
    return this.#data;
  }

  /**
   * Re-renders all items from the current data.
   * Clears the container and renders each item using the template.
   */
  render() {
    this.#container.innerHTML = '';

    this.#data.forEach((item, index) => {
      const node = this.#renderItem(item, index);
      this.#container.appendChild(node);
    });
  }

  /**
   * Disposes of this DataBinder instance.
   * Clears data and container.
   */
  dispose() {
    this.#data = [];
    this.#container.innerHTML = '';
    this.#template = null;
    this.#container = null;
  }

  /**
   * Renders a single item from the template.
   *
   * @param {Object} item - Data object
   * @param {number} index - Item index in array
   * @return {DocumentFragment} Rendered template clone
   * @private
   */
  #renderItem(item, index) {
    // Clone template
    const clone = this.#template.content.cloneNode(true);

    // Bind attributes first (so they exist for other operations)
    this.#bindAttributes(clone, item, index);

    // Bind content to elements with data-bind
    clone.querySelectorAll('[data-bind]').forEach(el => {
      this.#bindContent(el, item, index);
    });

    // Handle conditional rendering
    clone.querySelectorAll('[data-show-if]').forEach(el => {
      const condition = el.getAttribute('data-show-if');
      const value = this.#getValue(item, condition, index);
      if (!value) {
        el.remove();
      }
    });

    // Handle inverse conditional rendering
    clone.querySelectorAll('[data-hide-if]').forEach(el => {
      const condition = el.getAttribute('data-hide-if');
      const value = this.#getValue(item, condition, index);
      if (value) {
        el.remove();
      }
    });

    // Clean up template attributes after processing
    clone.querySelectorAll('[data-bind]').forEach(el => {
      el.removeAttribute('data-bind');
      el.removeAttribute('data-format');
    });
    clone.querySelectorAll('[data-bind-attr]').forEach(el => {
      el.removeAttribute('data-bind-attr');
    });
    clone.querySelectorAll('[data-show-if]').forEach(el => {
      el.removeAttribute('data-show-if');
    });
    clone.querySelectorAll('[data-hide-if]').forEach(el => {
      el.removeAttribute('data-hide-if');
    });

    return clone;
  }

  /**
   * Binds data to element content.
   *
   * @param {Element} el - Element to bind to
   * @param {Object} item - Data object
   * @param {number} index - Item index
   * @private
   */
  #bindContent(el, item, index) {
    const path = el.getAttribute('data-bind');
    const format = el.getAttribute('data-format');

    // Get value
    let value = this.#getValue(item, path, index);

    // Apply formatter if specified
    if (format && this.#formatters[format]) {
      value = this.#formatters[format](value, item);
    }

    // Set content (safely handle null/undefined)
    el.textContent = value ?? '';
  }

  /**
   * Binds data to element attributes.
   * Supports syntax: data-bind-attr="attr1:path1, attr2:path2"
   *
   * @param {DocumentFragment} clone - Template clone
   * @param {Object} item - Data object
   * @param {number} index - Item index
   * @private
   */
  #bindAttributes(clone, item, index) {
    clone.querySelectorAll('[data-bind-attr]').forEach(el => {
      const bindings = el.getAttribute('data-bind-attr');

      // Parse bindings (comma-separated)
      bindings.split(',').forEach(binding => {
        const [attr, path] = binding.split(':').map(s => s.trim());
        if (attr && path) {
          const value = this.#getValue(item, path, index);
          if (isDefAndNotNull(value)) {
            el.setAttribute(attr, value);
          }
        }
      });
    });
  }

  /**
   * Gets a value from an object using dot notation.
   * Supports special variables: $index (0-based), $index1 (1-based)
   *
   * @param {Object} obj - Object to query
   * @param {string} path - Dot-separated path (e.g., "profile.name")
   * @param {number} index - Item index for special variables
   * @return {*} The value, or undefined if not found
   * @private
   */
  #getValue(obj, path, index) {
    // Handle special variables
    if (path === '$index') {
      return index;
    }
    if (path === '$index1') {
      return index + 1;
    }

    // Handle nested paths
    return path.split('.').reduce((current, prop) => {
      return current?.[prop];
    }, obj);
  }

  /**
   * Extracts the data array from a JSON response.
   * Tries common patterns: json.rows, json.data, json.items, or json itself.
   *
   * @param {Object|Array} json - JSON response
   * @return {Array} Extracted data array
   * @private
   */
  #extractData(json) {
    // If dataPath is configured, use it
    if (this.#dataPath) {
      return this.#dataPath.split('.').reduce((obj, key) => obj?.[key], json);
    }

    // Try common patterns
    if (json.rows) return json.rows;
    if (json.data) return json.data;
    if (json.items) return json.items;

    // Assume the JSON itself is the array
    if (Array.isArray(json)) return json;

    // No match - return empty array
    console.warn('DataBinder: Could not extract data array from response', json);
    return [];
  }

  /**
   * Dispatches a custom event on the container.
   *
   * @param {string} eventName - Event name
   * @param {Object} [detail={}] - Event detail
   * @private
   */
  #dispatch(eventName, detail = {}) {
    this.#container.dispatchEvent(new CustomEvent(eventName, {
      detail, bubbles: true
    }));
  }
}
