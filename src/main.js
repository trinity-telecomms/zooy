// Modern named exports for tree-shaking
export { default as Evt } from "./ui/evt.js";
export { default as Component } from './ui/component.js';
export { default as Dragger } from './ui/dragger.js';
export { default as Panel } from './ui/panel.js';
export { default as FormPanel } from './ui/form.js';
export { default as Split } from './ui/split.js';
export { default as UserManager } from './user/usermanager.js';
export { default as View } from './ui/view.js';
export { UiEventType } from './events/uieventtype.js';
export { default as Conductor } from './ui/conductor.js';
export {DataBinder} from './ui/data-binder.js'
export * as domUtils from './dom/utils.js';
export * as uriUtils from './uri/uri.js';
export { ComponentLibraryRegistry } from './ui/component-library-registry.js';
export * as handlers from './ui/handlers/index.js';
export * as zoo from './ui/zoo/index.js';

/**
 * Lazy-loads and registers the Carbon Design System library.
 * Uses dynamic import to avoid bundling Carbon code in main bundle.
 * Carbon code is only loaded when this function is called.
 *
 * @returns {Promise<void>}
 */
export async function registerCarbonLibrary() {
  const { registerCarbonLibrary: register } = await import('./ui/carbon/register.js');
  return register();
}

/**
 * Lazy-loads and registers the Material Design Components library.
 * Uses dynamic import to avoid bundling MDC code in main bundle.
 * MDC code (including tree-utils) is only loaded when this function is called.
 *
 * @returns {Promise<void>}
 */
export async function registerMdcLibrary() {
  const { registerMdcLibrary: register } = await import('./ui/mdc/register.js');
  return register();
}

// Legacy default export for backward compatibility
// Modern code should use named imports instead
import Evt from "./ui/evt.js";
import Component from './ui/component.js';
import Dragger from './ui/dragger.js';
import Panel from './ui/panel.js';
import FormPanel from './ui/form.js';
import Split from './ui/split.js';
import UserManager from './user/usermanager.js';
import View from './ui/view.js';
import {UiEventType} from './events/uieventtype.js';
import Conductor from './ui/conductor.js';
import {DataBinder} from './ui/data-binder.js';
import * as domUtils from './dom/utils.js';
import * as uriUtils from './uri/uri.js';
import { ComponentLibraryRegistry } from './ui/component-library-registry.js';
import * as handlers from './ui/handlers/index.js';
import * as zoo from './ui/zoo/index.js';

const zooy = {
  Evt,
  Component,
  Dragger,
  Panel,
  FormPanel,
  Split,
  UserManager,
  View,
  Conductor,
  DataBinder,
  UiEventType,
  domUtils,
  uriUtils,
  registerCarbonLibrary,
  registerMdcLibrary,
  ComponentLibraryRegistry,
  handlers,
  zoo,
};

export default zooy;
