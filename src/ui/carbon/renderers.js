// noinspection JSFileReferences,JSUnusedLocalSymbols

/**
 * Generic Carbon Design System Component Renderer
 *
 * @see https://web-components.carbondesignsystem.com/
 */

import {getSemanticAttributes, getEventAttribute} from '../zoo/index.js';
import { buildComponentMap } from './components/index.js';

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

  if (!panel || !(panel instanceof Element)) {
    return elementMap;
  }

  for (const selector of Object.keys(COMPONENT_CONFIG)) {
    elementMap.set(selector, []);
  }

  for (const [selector, config] of Object.entries(COMPONENT_CONFIG)) {
    if (panel.matches(selector)) {
      elementMap.get(selector).push(panel);
    }
  }

  const allElements = panel.querySelectorAll('*');
  for (const element of allElements) {
    for (const [selector, config] of Object.entries(COMPONENT_CONFIG)) {
      if (element.matches(selector)) {
        elementMap.get(selector).push(element);
      }
    }
  }

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
    if (!cache.has(importFn)) {
      cache.set(importFn, importFn());
    }
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
      if (config.init) {
        config.init.call(panel, element);
        return;
      }

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
