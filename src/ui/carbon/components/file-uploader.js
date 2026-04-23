/**
 * Carbon File Uploader Component
 *
 * Handles file selection and deletion events.
 */

import { getSemanticAttributes } from "../../zoo/index.js";

/**
 * Make Carbon's `cds-file-uploader-*` `accept` tolerant of comma- OR
 * space-separated values.
 *
 * This is an intentional UX override of Carbon's default, not a bug fix.
 * Carbon's design is: pass `accept` as a space-separated string, the
 * native OS picker is a permissive "show all", and `_getFiles`
 * post-filters silently — so picking a non-matching file is
 * indistinguishable from clicking Cancel. That silent-drop is the
 * actual UX problem; consumers can't easily get the picker to filter
 * because the same string is forwarded to a native `<input type="file">`
 * inside the shadow DOM, whose accept is parsed per the HTML spec
 * (commas).
 *
 * By making Carbon's filter accept either separator, zooy consumers can
 * pass standard HTML-spec comma-separated values and get OS-picker
 * filtering AND Carbon's post-filter working in tandem — making "wrong
 * file type" a state the OS picker prevents in the first place,
 * instead of one Carbon swallows in silence.
 *
 * Idempotent (safe across multiple mounts / HMR) and fail-open: logs
 * a warning instead of crashing if Carbon ever renames `_getFiles`.
 *
 * @param {string} tagName Custom element tag to patch.
 */
function _patchCarbonAcceptSplit(tagName) {
  customElements.whenDefined(tagName).then((Cls) => {
    if (!Cls || Cls.prototype.__zooyAcceptPatched) return;
    if (typeof Cls.prototype._getFiles !== "function") {
      console.warn(
        `[Zooy] ${tagName}._getFiles missing; accept-split patch skipped (Carbon may have refactored).`,
      );
      return;
    }
    Cls.prototype._getFiles = function (event, files) {
      // The drop container calls `_getFiles(event, files)`; the button
      // calls `_getFiles(event)` and reads files from the event itself.
      if (files === undefined) {
        files = (event.type === "drop" ? event.dataTransfer : event.target)?.files;
      }
      if (!this.accept || !/^(change|drop)$/.test(event.type)) {
        return Array.from(files ?? []);
      }
      const tokens = new Set(this.accept.split(/[\s,]+/).filter(Boolean));
      return Array.prototype.filter.call(files ?? [], ({ name, type = "" }) => {
        const m = name.match(/\.[^.]+$/);
        const ext = m ? m[0].toLowerCase() : undefined;
        return tokens.has(type) || (ext && tokens.has(ext));
      });
    };
    Cls.prototype.__zooyAcceptPatched = true;
  });
}

_patchCarbonAcceptSplit("cds-file-uploader-drop-container");
_patchCarbonAcceptSplit("cds-file-uploader-button");

/**
 * Type definitions for Carbon Web Components (for IDE intellisense)
 * @typedef {import('@carbon/web-components/es/components/file-uploader/file-uploader.js').default} CDSFileUploader
 */

/**
 * File Uploader
 * @type {{selector: string, import: (function(): Promise<*>)|*, init: function(CDSFileUploader): void}}
 */
export const cdsFileUploaderWrap = {
  selector: "cds-file-uploader",

  /**
   * @param {CDSFileUploader} uploader - The CDSFileUploader custom element instance
   * @this {Panel} The panel instance
   */
  init: function (uploader) {
    const attrs = getSemanticAttributes(uploader);

    // File selection event (when files are added via file dialog)
    const changeEvent = attrs.event;
    if (changeEvent) {
      // Listen for native change event on the input element
      const input = uploader.querySelector('input[type="file"]');
      if (input) {
        this.listen(input, "change", (e) => {
          this.dispatchPanelEvent(changeEvent, {
            ...attrs,
            files: Array.from(e.target.files || []),
          });
        });
      }
    }

    // File deletion event (when individual file items are deleted)
    const deleteEvent = uploader.getAttribute("delete-event");
    if (deleteEvent) {
      this.listen(uploader, "cds-file-uploader-item-deleted", (e) => {
        this.dispatchPanelEvent(deleteEvent, {
          ...attrs,
          fileName: e.detail?.fileName,
          fileId: e.detail?.fileId,
        });
      });
    }
  },
};

/**
 * Copy a FileList-like array into a target <input type="file"> via DataTransfer
 * so a normal form submit (or FormPanel) carries the file. Carbon's button /
 * drop-container keep their own <input> in shadow DOM and do NOT participate
 * in form submission, so this glue is required.
 *
 * @param {HTMLInputElement} targetInput
 * @param {FileList|File[]} files
 */
function _copyFilesToInput(targetInput, files) {
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  targetInput.files = dt.files;
  targetInput.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Resolve the target <input type="file"> for a Carbon file-picker host element.
 * Convention: the host carries a `for="<input-id>"` attribute pointing at a
 * sibling/light-DOM hidden file input.
 *
 * @param {Element} host
 * @returns {HTMLInputElement|null}
 */
function _resolveTargetInput(host) {
  const forId = host.getAttribute("for");
  if (!forId) {
    console.warn(
      `[Zooy] ${host.tagName.toLowerCase()} missing 'for' attribute; cannot bind to a form input.`,
      host,
    );
    return null;
  }
  const input = host.ownerDocument.getElementById(forId);
  if (!input || input.tagName !== "INPUT" || input.type !== "file") {
    console.warn(`[Zooy] 'for=${forId}' did not resolve to an <input type="file">.`, host);
    return null;
  }
  return input;
}

/**
 * Carbon File Uploader Button — picker that fires
 * `cds-file-uploader-button-changed` when files are picked. Bridges the picked
 * files into a light-DOM <input type="file"> identified by the host's `for`
 * attribute, and (optionally) dispatches a panel event named by `event=`.
 *
 * @type {{selector: string, init: function(Element): void}}
 */
export const cdsFileUploaderButtonWrap = {
  selector: "cds-file-uploader-button",

  /**
   * @this {Panel} The panel instance
   */
  init: function (host) {
    const targetInput = _resolveTargetInput(host);
    const attrs = getSemanticAttributes(host);
    const eventName = attrs.event;

    this.listen(host, "cds-file-uploader-button-changed", (e) => {
      const files = e.detail?.addedFiles || [];
      if (targetInput) _copyFilesToInput(targetInput, files);
      if (eventName) {
        this.dispatchPanelEvent(eventName, { ...attrs, files: Array.from(files) });
      }
    });
  },
};

/**
 * Render (or clear) the `cds-file-uploader-item` rows that visually represent
 * the picked files, inside the host's wrapping `<div>`. The widget template
 * provides a `[data-file-list-for="<input-id>"]` element to host the items;
 * if it isn't present, we skip rendering (form-submit still works).
 *
 * @param {Document} doc
 * @param {string} forId - id of the target input
 * @param {File[]} files
 * @param {Function} onItemDeleted - called with the deleted file's name
 */
function _renderFileItems(doc, forId, files, onItemDeleted) {
  const list = doc.querySelector(`[data-file-list-for="${forId}"]`);
  if (!list) return;
  list.replaceChildren();
  for (const f of files) {
    const item = doc.createElement("cds-file-uploader-item");
    item.setAttribute("state", "edit");
    item.textContent = f.name;
    item.addEventListener("cds-file-uploader-item-deleted", () => {
      onItemDeleted(f.name);
    });
    list.appendChild(item);
  }
}

/**
 * Remove a file from a target input by name, returning the new FileList.
 *
 * @param {HTMLInputElement} targetInput
 * @param {string} name
 */
function _removeFileFromInput(targetInput, name) {
  const dt = new DataTransfer();
  for (const f of targetInput.files) {
    if (f.name !== name) dt.items.add(f);
  }
  targetInput.files = dt.files;
  targetInput.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Carbon File Uploader Drop Container — drag-and-drop target. Same bridge as
 * the button wrap, but listens for `cds-file-uploader-drop-container-changed`,
 * and (if the widget template provides a `[data-file-list-for]` host) renders
 * a `cds-file-uploader-item` per picked file with a delete affordance.
 *
 * @type {{selector: string, init: function(Element): void}}
 */
export const cdsFileUploaderDropContainerWrap = {
  selector: "cds-file-uploader-drop-container",

  /**
   * @this {Panel} The panel instance
   */
  init: function (host) {
    const targetInput = _resolveTargetInput(host);
    const attrs = getSemanticAttributes(host);
    const eventName = attrs.event;
    const forId = host.getAttribute("for");

    /** Re-render the file-item list from whatever's currently in the input. */
    const renderFromInput = () => {
      if (!forId || !targetInput) return;
      const files = Array.from(targetInput.files);
      _renderFileItems(host.ownerDocument, forId, files, (name) => {
        _removeFileFromInput(targetInput, name);
        renderFromInput();
      });
      // In single-file mode hide the drop area once a file is picked;
      // restore it when the user clears the selection. Multi-file mode
      // keeps the drop area visible so more files can be added.
      if (!host.multiple) {
        host.style.display = files.length > 0 ? "none" : "";
      }
    };

    this.listen(host, "cds-file-uploader-drop-container-changed", (e) => {
      // Carbon's drop container reports every dropped file regardless of its
      // `multiple` property (the property only controls the click-to-browse
      // picker). When the host isn't `multiple`, drop extras here so the
      // hidden input and visible item list both reflect single-file mode.
      const allFiles = e.detail?.addedFiles || [];
      const files = host.multiple ? allFiles : allFiles.slice(0, 1);
      if (targetInput) _copyFilesToInput(targetInput, files);
      renderFromInput();
      if (eventName) {
        this.dispatchPanelEvent(eventName, { ...attrs, files: Array.from(files) });
      }
    });
  },
};
