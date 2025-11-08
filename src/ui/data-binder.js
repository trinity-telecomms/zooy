/**
 * DataBinder - Lightweight data binding for modern web components
 *
 * A standards-compliant data binding solution that fetches JSON from an API
 * endpoint and renders it using standard HTML attributes and native <template> elements.
 *
 * Key Features:
 * - Simple property binding for single objects
 * - Template-based rendering for arrays
 * - Nested property access (e.g., "profile.name")
 * - Pagination-aware row numbering ($index, $index1)
 * - Django REST Framework pagination support
 * - Conditional rendering (show-if, hide-if)
 * - Extensible formatter system
 * - Standard DOM events for lifecycle
 *
 * Architecture:
 * - One DataBinder instance per root element
 * - Binder walks root to find all bindings (simple and template-based)
 * - Each template consumer can specify a data path to slice JSON response
 * - Binder instance is reused for subsequent operations (sort, search, pagination)
 *
 * ====================================================================
 * USE CASE 1: Simple property binding (no template duplication)
 * ====================================================================
 * Bind JSON properties directly to existing elements. Values update when
 * getData() is called again with new data.
 *
 * @example
 * // HTML
 * <div id="user-profile">
 *   <h1 data-bind="name"></h1>
 *   <p data-bind="email"></p>
 *   <span data-bind="profile.role"></span>
 *   <img data-bind-attr="src:avatarUrl, alt:name">
 *   <div data-bind-show-if="isActive">Active User</div>
 * </div>
 *
 * // JavaScript
 * const root = document.getElementById('user-profile');
 * const binder = new DataBinder('/api/user/123/', root);
 * await binder.getData();
 *
 * // Later, refresh with new data
 * await binder.getData(); // Re-binds to same elements
 *
 * ====================================================================
 * USE CASE 2: Template repetition for arrays
 * ====================================================================
 * Duplicate a template for each item in an array. Templates are cloned
 * and populated, then inserted into the consumer element.
 *
 * @example
 * // HTML
 * <div id="users-list">
 *   <ul data-bind-template="user-item" data-path="results"></ul>
 * </div>
 *
 * <template id="user-item">
 *   <li data-bind-attr="data-id:id">
 *     <strong data-bind="name"></strong>
 *     <span data-bind="email"></span>
 *     <span data-bind-show-if="isActive">✓</span>
 *   </li>
 * </template>
 *
 * // JavaScript
 * const root = document.getElementById('users-list');
 * const binder = new DataBinder('/api/users/', root);
 * await binder.getData({ limit: 10 });
 *
 * // API Response: { count: 100, results: [...] }
 * // Template duplicated once per item in results array
 *
 * ====================================================================
 * USE CASE 3: Multiple consumers from same fetch
 * ====================================================================
 * One API call, multiple parts of the page rendered from different slices
 * of the JSON response using data-path attribute.
 *
 * @example
 * // HTML
 * <div id="dashboard">
 *   <ul data-bind-template="item-tpl" data-path="results"></ul>
 *   <div data-bind-template="stats-tpl" data-path="stats"></div>
 *   <div data-bind-template="alert-tpl" data-path="alerts"></div>
 * </div>
 *
 * <template id="item-tpl"><li data-bind="name"></li></template>
 * <template id="stats-tpl"><p data-bind="total"></p></template>
 * <template id="alert-tpl"><div data-bind="message"></div></template>
 *
 * // JavaScript
 * const root = document.getElementById('dashboard');
 * const binder = new DataBinder('/api/dashboard/', root);
 * await binder.getData();
 *
 * // API Response: { results: [...], stats: {...}, alerts: [...] }
 * // Each consumer renders its data-path slice
 *
 * ====================================================================
 * USE CASE 4: Mixing simple bindings with template consumers
 * ====================================================================
 * Combine simple property binding (for header/metadata) with template
 * repetition (for lists) in the same root element.
 *
 * @example
 * // HTML
 * <div id="product-page">
 *   <!-- Simple bindings for page header -->
 *   <h1 data-bind="productName"></h1>
 *   <p data-bind="description"></p>
 *
 *   <!-- Template consumer for reviews list -->
 *   <div data-bind-template="review-tpl" data-path="reviews"></div>
 * </div>
 *
 * <template id="review-tpl">
 *   <div class="review">
 *     <strong data-bind="author"></strong>
 *     <p data-bind="text"></p>
 *     <span data-bind="rating" data-bind-format="stars"></span>
 *   </div>
 * </template>
 *
 * // JavaScript
 * const root = document.getElementById('product-page');
 * const binder = new DataBinder('/api/product/456/', root, {
 *   formatters: {
 *     stars: (rating) => '⭐'.repeat(rating)
 *   }
 * });
 * await binder.getData();
 *
 * // API Response: { productName: "...", description: "...", reviews: [...] }
 * // Simple bindings populate header, template duplicates for each review
 *
 * ====================================================================
 * BINDING ATTRIBUTES
 * ====================================================================
 * - data-bind="path" - Binds property to element's textContent
 * - data-bind-attr="attr1:path1, attr2:path2" - Binds properties to attributes
 * - data-bind-format="formatterName" - Applies formatter to value
 * - data-bind-show-if="path" - Shows element if truthy
 * - data-bind-hide-if="path" - Hides element if truthy
 * - data-bind-template="templateId" - Marks element as template consumer
 * - data-path="path.to.array" - Slices JSON for this consumer
 *
 * ====================================================================
 * SPECIAL VARIABLES (pagination-aware)
 * ====================================================================
 * - $index - 0-based row number (accounts for offset)
 * - $index1 - 1-based row number (accounts for offset)
 *
 * @example
 * // Page 1 (offset=0): $index=0-9, $index1=1-10
 * // Page 2 (offset=10): $index=10-19, $index1=11-20
 * <td data-bind="$index1"></td>
 *
 * ====================================================================
 * DJANGO REST FRAMEWORK PAGINATION
 * ====================================================================
 * DataBinder automatically detects DRF pagination format and dispatches
 * a pagination event with metadata.
 *
 * @example
 * // JavaScript
 * const binder = new DataBinder('/api/items/', root);
 * root.addEventListener('data-pagination', e => {
 *   console.log(e.detail); // { count, next, previous, limit, offset, page, totalPages }
 * });
 * await binder.getData({ limit: 25, offset: 0 });
 *
 * ====================================================================
 * CUSTOM FETCH FUNCTION (authentication, etc.)
 * ====================================================================
 * @example
 * const binder = new DataBinder(apiUrl, root, {
 *   fetchFn: (url) => userManager.fetchJson(url, abortSignal)
 * });
 *
 * ====================================================================
 * COMPONENT INTEGRATION (Carbon Table)
 * ====================================================================
 * Carbon components create and manage DataBinder instances internally.
 * The binder is stored on the element for subsequent operations.
 *
 * @example
 * // Carbon table component creates binder internally from data-api-url
 * // Then stores it for sort/search/pagination operations
 * const table = document.getElementById('my-table');
 *
 * // Later, programmatically trigger operations
 * table.dataBinder.getData({ limit: 50, ordering: '-created' });
 */

import {isDefAndNotNull} from 'badu';
import * as R from 'ramda';


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
  #component;
  #baseUrl;
  #url;
  #root;
  #data = null;
  #formatters;
  #offset = 0;

  /**
   * Creates a new DataBinder instance.
   *
   * @param component
   * @param {string} url - API endpoint URL
   * @param {Element} root - Root element to walk for bindings
   * @param {{urlParams: {limit: number}|{}, abortController: *|AbortController}} [options={}] - Configuration options
   * @param {Function} [options.fetchFn] - Custom fetch function (for authentication, etc.)
   * @param {Object<string, Function>} [options.formatters] - Custom formatters
   * @throws {Error} If url or root is missing/invalid
   */
  constructor(component, url, root, options = {}) {
    // Validate required parameters
    if (!url) {
      throw new Error('DataBinder requires a URL');
    }
    if (!root || !(root instanceof Element)) {
      throw new Error('DataBinder requires a valid root Element');
    }

    // Store configuration
    this.#component = component;
    this.#baseUrl = new URL(url, window.location.origin);
    this.#url = this.#baseUrl;
    this.#root = root;
    this.#formatters = {...DEFAULT_FORMATTERS, ...options.formatters};
  }

  get url() {
    return this.#url;
  }

  get data() {
    return this.#data;
  }

  get offset() {
    return this.#offset;
  }

  get limit() {
    return parseInt(this.#url.searchParams.get('limit') || '0', 10);
  }

  /**
   * Fetches data from the configured URL with optional query parameters.
   *
   * Behavior:
   * - Builds URL with query parameters (limit, offset, ordering, q, etc.)
   * - Parses offset from URL for pagination-aware row numbering
   * - Detects Django REST Framework pagination format
   * - Dispatches custom pagination event with metadata if paginated
   * - Calls setData() with full JSON response
   * - Dispatches lifecycle events: 'data-loading', 'data-loaded', 'data-error'
   *
   * @param {Object} [urlParams={}] - Query parameters to append to URL (e.g., {limit: 25, offset: 0, ordering: 'name'})
   * @return {Promise<Object>} The full JSON response from the server
   * @throws {Error} If fetch fails or response is invalid
   */
  async getData(urlParams = {}) {
    this.#dispatch('data-loading');

    try {
      // Build URL with query parameters
      this.#url = new URL(this.#baseUrl, window.location.origin);
      Object.entries(urlParams).forEach(([key, value]) => {
        if (isDefAndNotNull(value)) {
          this.#url.searchParams.set(key, value);
        }
      });

      // Track offset for pagination-aware row numbering ($index, $index1)
      this.#offset = parseInt(this.#url.searchParams.get('offset') || '0', 10);

      const json = await this.#component.user.fetchJson(
        this.#url.toString(), this.#component.abortController.signal);

      this.#dispatch('data-loaded', {data: json});
      this.setData(json);
    } catch (error) {
      this.#dispatch('data-error', {error});
      throw error;
    }
  }

  /**
   * Sets data directly without fetching from URL.
   * This is the convergence point for all data updates (from getData() or external sources).
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
   * Renders data by walking the root element and processing all bindings.
   *
   * Supports two binding patterns:
   * 1. Simple property binding - Direct data-bind attributes on elements (no templates)
   * 2. Template rendering - Elements with data-bind-template duplicate for arrays
   *
   * Algorithm:
   * 1. Process simple bindings (data-bind, data-bind-attr outside template consumers)
   * 2. Process template consumers (elements with data-bind-template attribute)
   *    - Get template ID and optional data-path
   *    - Extract data slice using Ramda's R.path()
   *    - Clear consumer and clone template for each item
   *
   * Multiple consumers can exist in the same root, each rendering different slices
   * of the same JSON response (e.g., results, metadata, alerts).
   */
  render() {
    if (!isDefAndNotNull(this.#data)) {
      console.warn('[DataBinder] No data to render');
      return;
    }

    this.#renderSimpleBindings(this.#root, this.#data, 0);
    this.#renderTemplateConsumers();
  }

  /**
   * Renders simple property bindings directly to existing elements.
   * Processes data-bind-attr, data-bind, and conditional rendering attributes.
   *
   * This method is reusable and can be called with different elements and data objects.
   * Used for both root-level simple bindings and template item rendering.
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
    const removeOnCondition = options.removeOnCondition ?? false;
    const removeAttributes = options.removeAttributes ?? false;

    element.querySelectorAll('[data-bind-attr]').forEach(el => {
      if (el.closest('[data-bind-template]')) return;

      const bindings = el.getAttribute('data-bind-attr');
      bindings.split(',').forEach(binding => {
        const [attr, path] = binding.split(':').map(s => s.trim());
        const value = this.#getValue(data, path, index);
        if (isDefAndNotNull(value)) {
          el.setAttribute(attr, value);
        }
      });

      if (removeAttributes) {
        el.removeAttribute('data-bind-attr');
      }
    });

    element.querySelectorAll('[data-bind]').forEach(el => {
      if (el.closest('[data-bind-template]')) return;

      const path = el.getAttribute('data-bind');
      const format = el.getAttribute('data-bind-format');
      let value = this.#getValue(data, path, index);

      if (format && this.#formatters[format]) {
        value = this.#formatters[format](value, data);
      }

      el.textContent = value ?? '';

      if (removeAttributes) {
        el.removeAttribute('data-bind');
        el.removeAttribute('data-bind-format');
      }
    });

    element.querySelectorAll('[data-bind-show-if]').forEach(el => {
      if (el.closest('[data-bind-template]')) return;

      const condition = el.getAttribute('data-bind-show-if');
      const value = this.#getValue(data, condition, index);
      if (!value) {
        if (removeOnCondition) {
          el.remove();
        } else {
          el.style.display = 'none';
        }
      } else if (!removeOnCondition) {
        el.style.display = '';
      }

      if (removeAttributes && el.isConnected) {
        el.removeAttribute('data-bind-show-if');
      }
    });

    element.querySelectorAll('[data-bind-hide-if]').forEach(el => {
      if (el.closest('[data-bind-template]')) return;
      const condition = el.getAttribute('data-bind-hide-if');
      const value = this.#getValue(data, condition, index);

      if (value) {
        if (removeOnCondition) {
          el.remove();
        } else {
          el.style.display = 'none';
        }
      } else if (!removeOnCondition) {
        el.style.display = '';
      }

      if (removeAttributes && el.isConnected) {
        el.removeAttribute('data-bind-hide-if');
      }
    });
  }

  /**
   * Renders template consumers by duplicating templates for array data.
   *
   * @private
   */
  #renderTemplateConsumers() {
    const consumers = this.#root.querySelectorAll('[data-bind-template]');

    consumers.forEach(consumer => {
      const templateId = consumer.getAttribute('data-bind-template');
      const dataPath = consumer.getAttribute('data-path');

      if (!templateId) {
        console.warn('[DataBinder] Consumer missing template ID', consumer);
        return;
      }

      // Get template element
      const template = this.#root.querySelector(`#${templateId}`);
      if (!template || template.tagName !== 'TEMPLATE') {
        console.error(`[DataBinder] Template not found or invalid: ${templateId}`);
        return;
      }

      // Extract data slice for this consumer
      const dataSlice = dataPath ?
        R.path(dataPath.split('.'), this.#data) :
        this.#data;

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
    // - removeOnCondition: true (remove elements that fail conditionals)
    // - removeAttributes: true (clean up binding attributes after processing)
    this.#renderSimpleBindings(clone, item, index, {
      removeOnCondition: true,
      removeAttributes: true
    });

    return clone;
  }

  /**
   * Gets a value from an object using dot notation.
   *
   * Special Variables (pagination-aware):
   * - $index: 0-based row number (offset + index)
   * - $index1: 1-based row number (offset + index + 1)
   *
   * Pagination Examples:
   * - Page 1 (offset=0, limit=10): $index=0-9, $index1=1-10
   * - Page 2 (offset=10, limit=10): $index=10-19, $index1=11-20
   * - Page 3 (offset=20, limit=10): $index=20-29, $index1=21-30
   *
   * @param {Object} obj - Object to query
   * @param {string} path - Dot-separated path (e.g., "profile.name") or special variable ($index, $index1)
   * @param {number} index - Item index in current data array (0-based)
   * @return {*} The value, or undefined if not found
   * @private
   */
  #getValue(obj, path, index) {
    // Handle special variables (pagination-aware)
    if (path === '$index') {
      return this.#offset + index;
    }
    if (path === '$index1') {
      return this.#offset + index + 1;
    }

    // Handle nested paths using Ramda
    return R.path(path.split('.'), obj);
  }


  /**
   * Dispatches a custom event on the root element.
   *
   * @param {string} eventName - Event name
   * @param {Object} [detail={}] - Event detail
   * @private
   */
  #dispatch(eventName, detail = {}) {
    this.#root.dispatchEvent(new CustomEvent(eventName, {
      detail, bubbles: true
    }));
  }

  /**
   * Disposes of this DataBinder instance.
   * Clears data and root.
   */
  dispose() {
    this.#data = null;
    // Find all consumers and clear them
    const consumers = this.#root.querySelectorAll('[data-bind-template]');
    consumers.forEach(consumer => consumer.innerHTML = '');
  }
}
