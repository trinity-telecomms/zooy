import UserManager from '../user/usermanager.js';
import Evt from './evt.js';
import View from './view.js';

/**
 * The Conductor orchestrates view management and navigation in the application.
 * It maintains the active view, manages view transitions, handles browser history,
 * and coordinates communication between views via events.
 *
 * @extends {Evt}
 */
export default class Conductor extends Evt {

  #viewConstructorMap = new Map();

  #activeView = null;

  /**
   * @type {!UserManager|undefined}
   * @private
   */
  #user = void 0;


  #split = void 0;

  #viewEventMap = new Map();

  /**
   * Creates a new Conductor instance. Sets up browser history listening
   * and initializes view event handling.
   */
  constructor() {
    super();

    this.#viewEventMap = this.#initViewEventsInternal();

    window.addEventListener('popstate', (event) => {
      if (event.state === null) {
        return;
      }
      this.navTo(event.state);
    });

    // Emit time ticks every 60 seconds for time-based components
    this.doOnBeat(() => {
      document.dispatchEvent(new CustomEvent('zoo-tick-60', {
        detail: { timestamp: Date.now() }
      }));
    }, 60000);

  };

  set split(split) {
    this.#split = split;
  }

  get split() {
    if (!this.#split) {
      throw new Error('No SPLIT component available');
    }
    return this.#split;
  }


  /**
   * @param {!UserManager} user
   */
  set user(user) {
    this.#user = user;
    if (this.#activeView) {
      this.#activeView.user = this.user;
    }
  };


  /**
   * @return {!UserManager}
   */
  get user() {
    if (!this.#user) {
      this.#user = new UserManager();
    }
    return this.#user;
  };

  /**
   * Initializes the internal view event map with default event handlers.
   * Sets up handlers for common view events like 'switch_view'.
   * @return {!Map<string, !Function>} Map of event names to handler functions
   * @private
   */
  #initViewEventsInternal() {
    return new Map()
      .set('switch_view', (eventData, _eView) => {
        if (this.#viewConstructorMap.has(eventData.view)) {
          const view = this.#viewConstructorMap.get(eventData.view)(
            eventData.pk || eventData.recordId, eventData);
          this.switchView(view);
        }
      });
  };

  /**
   * Maps a view event name to a handler function. Allows dynamic registration
   * of custom view event handlers at runtime.
   * @param {string} s The event name to map
   * @param {!Function} func The handler function that receives (eventData, eView)
   */
  mapViewEv(s, func) {
    this.#viewEventMap.set(s, func);
  }

  /**
   * Registers a view constructor function that can be used to create instances
   * of a specific view type.
   * @param {string} s The view type identifier
   * @param {!Function} f Constructor function that receives (pk, data) and returns a View
   */
  registerViewConstructor(s, f) {
    this.#viewConstructorMap.set(s, f);
  }

  /**
   * @param {!CustomEvent} e Event object.
   */
  onViewEvent(e) {
    const eventValue = e.detail.getValue();
    const eventData = e.detail.getData();
    const eView = /** @type {Panel} */ (e.target);
    if (this.#viewEventMap.has(eventValue)) {
      this.#viewEventMap.get(eventValue)(eventData, eView);
    } else {
      console.warn('Unhandled VIEW Event:', e, eventValue, eventData, eView);
    }
  };

  /**
   * Make the given view active.
   * @param {!View} view
   */
  setActiveView(view) {
    if (this.#activeView) {
      this.stopListeningTo(this.#activeView);
      this.#activeView.dispose();
      this.#activeView = null;
    }
    this.#activeView = view;
    this.#activeView.render();
  };

  /**
   * @param {!View} view
   * @returns {!View}
   */
  initView(view) {
    view.user = this.user;
    view.split = this.split;
    view.recordHistory = this.recordHistory.bind(this);
    view.registerViewConstructor = this.registerViewConstructor.bind(this);
    this.listen(view, View.viewEventCode(), this.onViewEvent.bind(this));
    return view;
  }

  //--[ Views Utilities ]--
  /**
   * @param {!View} view The view we want active.
   */
  switchView(view) {
    this.setActiveView(this.initView(view));
  };

  //--[ History and Navigation ]--
  /**
   * Records the given item in browser history. If item.init is true, replaces
   * the current history state. Otherwise, pushes a new history state unless
   * item.history is true.
   * @param {!Object} item The history item containing view state
   */
  recordHistory(item) {
    this.debugMe('HISTORY', item);
    if (item.init) {
      history.replaceState(item, '', document.location.href);
    } else if (!item.history) {
      history.pushState(item, '', null);
    }
  }

  /**
   * Navigates to a specific view based on the history item. Attempts to use
   * the active view's switchViewMap first, falling back to registered view
   * constructors if needed.
   * @param {!Object} item History item containing {view, pk, ...} properties
   */
  navTo = (item) => {
    item.history = true;
    const view = item.view;
    const activeView = this.#activeView;

    if (activeView.switchViewMap_.has(view)) {
      this.debugMe('NAV:VIEW:MAP', item);
      activeView.switchViewMap_.get(view)(item);
    } else if (this.#viewConstructorMap.has(view)) {
      const targetView = this.#viewConstructorMap.get(view)(item.pk, item);
      this.debugMe('NAV:NEW:VIEW', item);
      this.switchView(targetView);
    }
  };
};
