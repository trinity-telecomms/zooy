import {isDefAndNotNull} from 'badu';
import {both, has, path} from 'ramda';
import {dateToZooyStdTimeString} from '../dom/utils.js';

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
  },

  /**
   * Format date as "DD MMM YY HH:mm:ss" (e.g., "10 Nov 25 11:27:49")
   * Accepts ISO date strings, timestamps, or Date objects.
   * Returns empty string for null/undefined values.
   */
  date: (value) => {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);

    // Validate date
    if (isNaN(date.getTime())) {
      console.warn('[Binder] Invalid date value:', value);
      return '';
    }

    return dateToZooyStdTimeString(date);
  }
};

export class Binder {
  #panel;
  #url;
  #rootEl;
  #data = null;
  #formatters;

  /**
   * Creates a new Binder instance.
   *
   * @param {zooy.Panel} panel
   * @param {string} url - API endpoint URL
   * @param {Element} rootEl - Root element to walk for bindings
   * @param options
   * @param {Object<string, string|number>} [options.urlParams] - Configuration options
   * @param {Object<string, Function>} [options.formatters] - Custom formatters
   * @throws {Error} If url or rootEl is missing/invalid
   */
  constructor(panel, url, rootEl, options = {}) {
    // Validate required parameters
    if (!url) {
      throw new Error('Binder requires a URL');
    }
    if (!rootEl || !(rootEl instanceof Element)) {
      throw new Error('Binder requires a valid rootEl Element');
    }

    // Store configuration
    this.#panel = panel;
    this.#url = new URL(url, window.location.origin);
    this.#rootEl = rootEl;
    this.#formatters = {...DEFAULT_FORMATTERS, ...options.formatters};

    // Apply initial URL params if provided
    if (options.urlParams) {
      this.#setUrlParams(options.urlParams);
    }
  }

  get url() {
    return this.#url;
  }

  get data() {
    return this.#data;
  }

  get limit() {
    return parseInt(this.#url.searchParams.get('limit') || '0', 10);
  }

  get offset() {
    return parseInt(this.#url.searchParams.get('offset') || '0', 10);
  }

  get isPaginated() {
    return both(has('count'), has('results'))(this.#data);
  }


  #setUrlParams(params) {
    console.log(this.#url.searchParams);
    Object.entries(params).forEach(([key, value]) => {

      // Remove param if null, undefined, or empty string
      // eslint-disable-next-line eqeqeq
      if (value == null || value === '' || (Array.isArray(value) && value.length < 1)) {
        this.#url.searchParams.delete(key);
        return;
      }

      if (Array.isArray(value)) {
        // value.forEach(v => this.#url.searchParams.append(key, v));
        this.#url.searchParams.set(key, value.join(','));
        return;
      }

      // Set normal values
      this.#url.searchParams.set(key, value);
    });
    console.log(this.#url.searchParams);
    return this.#url;
  }

  /**
   * Fetches data from the configured URL with optional query parameters.
   * Data is automatically bound to the DOM via setData() after fetch completes.
   *
   * @param {Object} [urlParams={}] - Query parameters to append to URL (e.g., {limit: 25, offset: 0, ordering: 'name'})
   * @return {Promise<void>}
   * @throws {Error} If fetch fails or response is invalid
   */
  async fetchData(urlParams = {}) {
    const json = await this.#panel.user.fetchJson(
      this.#setUrlParams(urlParams).toString(), this.#panel.abortController.signal);
    this.setData(json);
  }

  /**
   * Sets data directly without fetching from URL.
   * This is the convergence point for all data updates (from fetchData() or external sources).
   *
   * Behavior:
   * - Stores full JSON object (not just arrays)
   * - Calls render() to update the DOM
   * - render() extracts appropriate slices for each consumer
   *
   * @param {Object} data - Full JSON response object
   */
  setData(data) {
    this.#data = data;
    this.render();
  }

  /**
   * Renders data by walking the rootEl element and processing all bindings.
   *
   * Supports two binding patterns:
   * 1. Simple property binding - Direct zoo-bind attributes on elements (no templates)
   * 2. Template rendering - Elements with zoo-template duplicate for arrays
   *
   * Algorithm:
   * 1. Process simple bindings (zoo-bind, zoo-bind-attr outside template consumers)
   * 2. Process template consumers (elements with zoo-template attribute)
   *    - Get template ID and optional zoo-template-bind
   *    - Extract data slice using Ramda's R.path()
   *    - Clear consumer and clone template for each item
   *
   * Multiple consumers can exist in the same rootEl, each rendering different slices
   * of the same JSON response (e.g., results, metadata, alerts).
   */
  render() {
    if (!isDefAndNotNull(this.#data)) {
      console.warn('[Binder] No data to render');
      return;
    }

    this.#renderSimpleBindings(this.#rootEl, this.#data, 0);
    this.#renderTemplateConsumers();
  }

  /**
   * Renders simple property bindings directly to existing elements.
   * Processes zoo-bind-attr, zoo-bind, and conditional rendering attributes.
   *
   * This method is reusable and can be called with different elements and data objects.
   * Used for both rootEl-level simple bindings and template item rendering.
   *
   * @param {Element|DocumentFragment} element - Root element to search for bindings
   * @param {Object} data - Data object to bind
   * @param {number} [index=0] - Current index (for $index and $index1 special variables)
   * @param {Object} [options={}] - Rendering options
   * @param {boolean} [options.removeOnCondition=false] - Remove elements on failed conditions (vs hiding with display:none)
   * @param {boolean} [options.removeAttributes=false] - Remove binding attributes after processing (vs keeping for re-render)
   * @private
   */
  #renderSimpleBindings(element, data, index = 0, options = {}) {
    const removeAttributes = options.removeAttributes ?? false;

    element.querySelectorAll('[zoo-bind-attr]').forEach(el => {
      if (el.closest('[zoo-template]')) return;

      const bindings = el.getAttribute('zoo-bind-attr');
      bindings.split(',').forEach(binding => {
        const [attr, path] = binding.split(':').map(s => s.trim());
        const value = this.#getValue(data, path, index);
        if (isDefAndNotNull(value)) {
          el.setAttribute(attr, value);
        }
      });

      if (removeAttributes) {
        el.removeAttribute('zoo-bind-attr');
      }
    });

    element.querySelectorAll('[zoo-bind]').forEach(el => {
      if (el.closest('[zoo-template]')) return;

      const path = el.getAttribute('zoo-bind');
      const format = el.getAttribute('zoo-bind-format');
      let value = this.#getValue(data, path, index);
      if (format && this.#formatters[format]) {
        value = this.#formatters[format](value, data);
      }
      el.textContent = value ?? '';

      if (removeAttributes) {
        el.removeAttribute('zoo-bind');
        el.removeAttribute('zoo-bind-format');
      }
    });

  }

  /**
   * Renders template consumers by duplicating templates for array data.
   *
   * @private
   */
  #renderTemplateConsumers() {
    const consumers = this.#rootEl.querySelectorAll('[zoo-template]');

    consumers.forEach(consumer => {
      const templateId = consumer.getAttribute('zoo-template');
      const dataPath = consumer.getAttribute('zoo-template-bind');

      if (!templateId) {
        console.warn('[Binder] Consumer missing template ID', consumer);
        return;
      }

      // Get template element
      const template = this.#rootEl.querySelector(`#${templateId}`);
      if (!template || template.tagName !== 'TEMPLATE') {
        console.error(`[DataBinder] Template not found or invalid: ${templateId}`);
        return;
      }

      // Extract data slice for this consumer
      const dataSlice = dataPath ?
        path(dataPath.split('.'), this.#data) :
        this.#data;

      // Validate it's defined
      if (!dataSlice) {
        console.warn(`[DataBinder] Data slice is undefined. Path: ${dataPath}. Skipping render for this consumer.`);
        return;
      }

      // Validate it's an array
      if (!Array.isArray(dataSlice)) {
        console.error(`[DataBinder] Data slice is not an array. Path: ${dataPath}`, dataSlice);
        return;
      }

      // Clear consumer and render items
      consumer.innerHTML = '';

      dataSlice.forEach((item, index) => {
        const clone = this.#renderTemplateItem(template, item, index);
        consumer.appendChild(clone);
      });
    });
  }

  /**
   * Renders a single item from a template.
   * Uses the unified rendering method with options for template-specific behavior.
   *
   * @param {HTMLTemplateElement} template - Template element
   * @param {Object} item - Data object
   * @param {number} index - Item index in array
   * @return {DocumentFragment} Rendered template clone
   * @private
   */
  #renderTemplateItem(template, item, index) {
    const clone = template.content.cloneNode(true);

    // Use unified rendering with template-specific options:
    // - removeAttributes: true (clean up binding attributes after processing)
    this.#renderSimpleBindings(clone, item, index, {
      removeAttributes: true
    });

    return clone;
  }

  /**
   * Gets a value from an object using dot notation.
   *
   * Special Variables:
   * - $index: 0-based row number (within current page)
   * - $index1: 1-based row number (within current page)
   * - $index__paged: 0-based row number (accounts for pagination offset)
   * - $index1__paged: 1-based row number (accounts for pagination offset)
   *
   * @param {Object} obj - Object to query
   * @param {string} pathString - Dot-separated path (e.g., "profile.name") or special variable ($index, $index1, $index__paged, $index1__paged)
   * @param {number} index - Item index in current data array (0-based)
   * @return {*} The value, or undefined if not found
   * @private
   */
  #getValue(obj, pathString, index) {
    const specialVars = {
      '$index': () => index,
      '$index__paged': () => this.offset + index,
      '$index1': () => index + 1,
      '$index1__paged': () => this.offset + index + 1
    };

    if (specialVars[pathString]) {
      return specialVars[pathString]();
    }

    return path(pathString.split('.'), obj);
  }
}
