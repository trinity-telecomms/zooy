// noinspection JSFileReferences,JSUnusedLocalSymbols

/**
 * Generic Carbon Design System Component Renderer
 *
 * Configuration-driven approach to attach event listeners to Carbon components.
 * This single renderer replaces 18 individual component renderers with a
 * declarative configuration.
 *
 * Features:
 * - Single source of truth for all Carbon component integrations
 * - Lazy loading - only imports components that are actually used in the panel
 * - Automatic import caching - modules loaded once, shared across all panels
 * - Easy to add new components - just add configuration
 * - Consistent event handling patterns
 * - Reduced code duplication
 * - Future-proof - doesn't depend on Carbon internals
 *
 * @see https://web-components.carbondesignsystem.com/
 */

import {getSemanticAttributes, getEventAttribute} from '../zoo/index.js';
import { buildComponentMap } from './components/index.js';

//--[ Component Imports ]--
// All component configurations have been extracted to components/ directory
// No import declarations needed here - components manage their own imports

//--[ Helper Functions ]--

/**
 * Scans panel DOM once and categorizes all Carbon elements by their config selector.
 * This single-pass approach is much faster than calling querySelectorAll for each selector.
 *
 * @param {Element} panel - The panel element to scan
 * @returns {Map<string, Element[]>} Map of selector → matching elements
 * @export For unit testing
 */
export function scanForCarbonComponents(panel) {
  const elementMap = new Map();

  // Guard against invalid panel parameter (null, undefined, non-Element nodes)
  if (!panel || !(panel instanceof Element)) {
    return elementMap;
  }

  // Initialize map with all selectors
  for (const selector of Object.keys(COMPONENT_CONFIG)) {
    elementMap.set(selector, []);
  }

  // Check the panel element itself first (it might be a Carbon component)
  for (const [selector, config] of Object.entries(COMPONENT_CONFIG)) {
    if (panel.matches(selector)) {
      elementMap.get(selector).push(panel);
    }
  }

  // Single DOM traversal - categorize descendant elements by matching selectors
  const allElements = panel.querySelectorAll('*');
  for (const element of allElements) {
    for (const [selector, config] of Object.entries(COMPONENT_CONFIG)) {
      if (element.matches(selector)) {
        elementMap.get(selector).push(element);
      }
    }
  }

  // Remove empty entries
  for (const [selector, elements] of elementMap.entries()) {
    if (elements.length === 0) {
      elementMap.delete(selector);
    }
  }

  return elementMap;
}

/**
 * Collects unique import functions needed based on scanned elements.
 * Supports both single imports and arrays of imports for components with dependencies.
 *
 * @param {Map<string, Element[]>} elementMap - Map from scanForCarbonComponents
 * @returns {Set<Function>} Set of unique import functions to load
 * @export For unit testing
 */
export function collectImportsNeeded(elementMap) {
  const importsNeeded = new Set();

  for (const [selector, elements] of elementMap.entries()) {
    const config = COMPONENT_CONFIG[selector];
    if (config && config.import && elements.length > 0) {
      // Handle both single import and array of imports
      const imports = Array.isArray(config.import) ? config.import : [config.import];
      imports.forEach(importFn => importsNeeded.add(importFn));
    }
  }

  return importsNeeded;
}

/**
 * Loads component imports in parallel with caching.
 *
 * @param {Set<Function>} importFunctions - Set of import functions to load
 * @param {Map<Function, Promise>} cache - External cache for imports (from Conductor)
 * @returns {Promise<void>}
 * @export For unit testing
 */
export async function loadComponentImports(importFunctions, cache) {
  if (importFunctions.size === 0) {
    return;
  }

  const loadPromises = Array.from(importFunctions).map(async (importFn) => {
    // Check cache first
    if (!cache.has(importFn)) {
      // Not cached - load and cache the promise
      cache.set(importFn, importFn());
    }
    // Return cached promise (may be in-flight or completed)
    return cache.get(importFn);
  });

  await Promise.all(loadPromises);
}

/**
 * Attaches event listeners to Carbon components based on their configuration.
 *
 * @param {Map<string, Element[]>} elementMap - Map of selector → elements
 * @param {Panel} panel - The panel instance for event dispatching
 * @returns {number} Total number of components initialized
 * @export For unit testing
 */
export function attachEventListeners(elementMap, panel) {
  let totalInitialized = 0;

  for (const [selector, elements] of elementMap.entries()) {
    const config = COMPONENT_CONFIG[selector];

    elements.forEach(element => {
      // Custom initialization (for complex components)
      if (config.init) {
        config.init.call(panel, element);
        return;
      }

      // Multi-event components (e.g., text-input with input + change)
      if (config.multiEvent) {
        const attrs = getSemanticAttributes(element);
        config.events.forEach(eventConfig => {
          const eventName = getEventAttribute(element, eventConfig.attrName, 'event');
          if (eventName) {
            panel.listen(element, eventConfig.type, e => {
              panel.dispatchPanelEvent(eventName, eventConfig.getData(e, attrs, element));
            });
          }
        });
        return;
      }

      // Standard single-event components
      const attrs = getSemanticAttributes(element);
      const eventName = attrs.event;

      if (eventName) {
        panel.listen(element, config.event, e => {
          e.stopPropagation();
          const data = config.getData(e, attrs, element);

          // Handle event override (e.g., menu items with their own event names)
          const finalEventName = data._eventOverride || eventName;
          delete data._eventOverride;

          panel.dispatchPanelEvent(finalEventName, data);
        });
      }
    });

    totalInitialized += elements.length;
  }

  return totalInitialized;
}

/**
 * Component configuration
 *
 * All Carbon component configurations have been extracted to the components/ directory.
 * This object simply merges them all together for the renderer to use.
 */
const COMPONENT_CONFIG = {
  ...Object.fromEntries(buildComponentMap())
};

/**
 * Generic Carbon component renderer with lazy loading.
 * Orchestrates the scanning, loading, and initialization of Carbon components.
 *
 * Flow:
 * 1. Scan panel DOM once for all Carbon components
 * 2. Store component references in panel for later access
 * 3. Collect unique import functions needed
 * 4. Load all imports in parallel (with caching)
 * 5. Attach event listeners to components
 *
 * @param {Element} panel - The panel element to search for components
 * @param {Map<Function, Promise>} cache - Import cache from Conductor
 * @this {Panel} - The panel instance (bound via .call())
 * @returns {Promise<void>}
 */
export const renderCarbonComponents = async function (panel, cache) {

  const elementMap = scanForCarbonComponents(panel);

  if (elementMap.size === 0) {
    this.debugMe('[Carbon] No Carbon components found in panel');
    return;
  }

  // Step 2: Store component references in panel for later access
  if (!this.carbonComponents) {
    this.carbonComponents = new Map();
  }
  // Merge scanned components into panel's component map
  for (const [selector, elements] of elementMap.entries()) {
    this.carbonComponents.set(selector, elements);
  }

  // Step 3: Determine which imports are needed
  const importsNeeded = collectImportsNeeded(elementMap);

  // Step 4: Load all needed components in parallel (with caching)
  if (importsNeeded.size > 0) {
    try {
      await loadComponentImports(importsNeeded, cache);
    } catch (error) {
      console.error('[Carbon] Failed to load some component modules:', error);
      // Continue anyway - some components may have loaded successfully
    }
  }

  // Step 5: Attach event listeners using the scanned element map
  const totalInitialized = attachEventListeners(elementMap, this);

  if (totalInitialized > 0) {
    this.debugMe(`[Carbon] Total components initialized: ${totalInitialized}`);
  }
};
