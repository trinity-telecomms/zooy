/**
 * Carbon Design System Library Registration
 *
 * This module provides the registration function for integrating Carbon Design System
 * with the Zooy framework's pluggable component architecture.
 *
 * Usage:
 *   import { registerCarbonLibrary } from './ui/carbon/register.js';
 *   registerCarbonLibrary();
 *
 *   // With preloaded components (for programmatic use):
 *   registerCarbonLibrary({
 *     preload: ['cds-toast-notification', 'cds-actionable-notification']
 *   });
 */

import {ComponentLibraryRegistry} from '../component-library-registry.js';
import {renderCarbonComponents} from './renderers.js';
import {imports} from './imports.js';


/**
 * Registers the Carbon Design System library with the ComponentLibraryRegistry.
 * This enables automatic lazy-loading of Carbon components in panels.
 *
 * Call this once at application startup.
 *
 * @param {Object} [options={}] - Configuration options
 * @param {string[]} [options.preload=[]] - Component selectors to load immediately.
 *   Use this for components you'll create programmatically (e.g., notifications).
 *   These won't need to wait for lazy-loading when created via JavaScript.
 *
 * @example
 * // Basic registration (all components lazy-loaded)
 * registerCarbonLibrary();
 *
 * @example
 * // With preloaded components for programmatic use
 * registerCarbonLibrary({
 *   preload: ['cds-toast-notification', 'cds-actionable-notification']
 * });
 */
const registerCarbonLibrary = (options = {}) => {
  const {preload = []} = options;

  // Preload specified components immediately (fire-and-forget)
  if (preload.length > 0) {
    const validSelectors = preload.filter(selector => {
      if (!imports[selector]) {
        console.warn(`[Carbon] No import found for selector: ${selector}`);
        return false;
      }
      return true;
    });

    const preloadPromises = validSelectors
      .flatMap(selector => imports[selector].map(fn => fn()));

    Promise.all(preloadPromises)
      .then(() => console.debug(`[Carbon] Preloaded: ${validSelectors.join(', ')}`))
      .catch(err => console.warn('[Carbon] Preload error:', err));
  }
  ComponentLibraryRegistry.register('carbon', {
    /**
     * Main render function that orchestrates Carbon component initialization.
     * Called by Panel.parseContent() for each panel that enters the document.
     *
     * @param {Element} panel - The panel DOM element to scan and initialize
     * @param {Map} cache - Import cache to prevent duplicate module loads
     * @returns {Promise<void>}
     */
    render: async function (panel, cache) {
      try {
        // Scan, collect, load, and attach Carbon Web Components
        await renderCarbonComponents.call(this, panel, cache);
      } catch (error) {
        console.error('[Carbon] Initialization error:', error);
        // Fail gracefully - panel should still work without Carbon components
      }
    },

    /**
     * Cleans up Carbon components when a component is disposed.
     * Carbon Web Components (native web components) automatically cleanup when
     * removed from the DOM, so this is primarily here for completeness and
     * future extensibility.
     *
     * @param {Element} _element - The element being disposed
     */
    dispose: function (_element) {
      // Carbon Web Components are native web components and handle their own
      // cleanup via disconnectedCallback(). No manual cleanup needed.
      //
      // Future: If we add event listeners outside the components, clean them here
    },

    config: {
      version: '2.0',
      description: 'IBM Carbon Design System Web Components'
    }
  });

  console.debug('[Zooy] Carbon Design System library registered');
}

export {
  registerCarbonLibrary,
}
