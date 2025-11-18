/**
 * Semantic Attributes for Zooy Components
 *
 * This module defines the vocabulary and provides helpers for reading them.
 */

import {assocPath} from 'ramda';

const SEMANTIC_ATTRS = new Map(Object.entries({
  "event": "event",
  "endpoint": "endpoint",
  "href": "href",
  "url": "url",
  "target": "target",
  "record-id": "recordId",
  "zoo-sort-field": "sortField",
  "zoo-view": "view",
  "zoo-event": "event",
  "zoo-href": "href",
}));


/**
 * Get all semantic attributes from an element.
 * Returns an object with camelCase property names.
 *
 * Also includes any data-* attributes for app-specific custom data.
 *
 * @param {Element} element - The element to read attributes from
 * @returns {Object} Object with semantic attributes and data-* attributes
 *
 * @example
 * <zoo-button zoo-event="save" record-id="123" endpoint="/api/save" data-category="admin">
 *
 * getSemanticAttributes(el) =>
 * {
 *   zoo: {
 *      event: 'save'
 *   },
 *   record: {
 *      id: '123'
 *   },
 *   endpoint: '/api/save',
 *   data: {
 *     category: 'admin'  // from data-category
 *   }
 * }
 */
export const getSemanticAttributes = (element) => {
  let attrs = {};
  Array.from(element.attributes).forEach(attr => {
    const name = attr.name;
    const value = attr.value;
    if (SEMANTIC_ATTRS.has(name)) {
      attrs[SEMANTIC_ATTRS.get(name)] = value;
    } else if (name.startsWith('data-') || name.startsWith('zoo-')) {
      attrs = assocPath(name.split('-'), value, attrs)
    }
  });
  return attrs;
};

/**
 * Get a specific event attribute (event, change-event, open-event, etc.)
 *
 * @param {Element} element - The element to read from
 * @param {string} eventType - Type of zoo-event__ 'event', 'change-event', 'open-event', etc.
 * @param {string} [fallback='event'] - Fallback to check if eventType not found
 * @returns {string|null} Event name or null if not found
 */
export const getEventAttribute = (element, eventType, fallback = 'event') => {
  return element.getAttribute(eventType) || element.getAttribute(fallback);
};
