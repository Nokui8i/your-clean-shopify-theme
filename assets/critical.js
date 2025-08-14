import { DeclarativeShadowElement } from '@theme/critical';
import { requestIdleCallback } from '@theme/utilities';

/**
 * @typedef {Record<string, Element | Element[] | undefined>} Refs
 */

/**
 * @template {Refs} T
 * @typedef {T & Refs} RefsType
 */

/**
 * Base class that powers our custom web components.
 *
 * Manages references to child elements with `ref` attributes and sets up mutation observers to keep
 * the refs updated when the DOM changes. Also handles declarative event listeners using.
 *
 * @template {Refs} [T=Refs]
 * @extends {DeclarativeShadowElement}
 */
export class Component extends DeclarativeShadowElement {
  /**
   * An object holding references to child elements with `ref` attributes.
   *
   * @type {RefsType<T>}
   */
  refs = /** @type {RefsType<T>} */ ({});

  /**
   * An array of required refs. If a ref is not found, an error will be thrown.
   *
   * @type {string[] | undefined}
   */
  requiredRefs;

  /**
   * Gets the root node of the component, which is either its shadow root or the component itself.
   *
   * @returns {(ShadowRoot | Component<T>)[]} The root nodes.
   */
  get roots() {
    return this.shadowRoot ? [this, this.shadowRoot] : [this];
  }

  /**
   * Called when the element is connected to the document's DOM.
   *
   * Initializes event listeners and refs.
   */
  connectedCallback() {
    super.connectedCallback();
    registerEventListeners();

    this.#updateRefs();

    requestIdleCallback(() => {
      for (const root of this.roots) {
        this.#mutationObserver.observe(root, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['ref'],
          attributeOldValue: true,
        });
      }
    });
  }

  /**
   * Called when the element is re-rendered by the Section Rendering API.
   */
  updatedCallback() {
    this.#mutationObserver.takeRecords();
    this.#updateRefs();
  }

  /**
   * Called when the element is disconnected from the document's DOM.
   *
   * Disconnects the mutation observer.
   */
  disconnectedCallback() {
    this.#mutationObserver.disconnect();
  }

  /**
   * Updates the `refs` object by querying all descendant elements with `ref` attributes and storing references to them.
   *
   * This method is called to keep the `refs` object in sync with the DOM.
   */
  #updateRefs() {
    const refs = /** @type any */ ({});
    const elements = this.roots.reduce((acc, root) => {
      for (const element of root.querySelectorAll('[ref]')) {
        if (!this.#isDescendant(element)) continue;
        acc.add(element);
      }

      return acc;
    }, /** @type {Set<Element>} */ (new Set()));

    for (const ref of elements) {
      const refName = ref.getAttribute('ref') ?? '';
      const isArray = refName.endsWith('[]');
      const path = isArray ? refName.slice(0, -2) : refName;

      if (isArray) {
        const array = Array.isArray(refs[path]) ? refs[path] : [];

        array.push(ref);
        refs[path] = array;
      } else {
        refs[path] = ref;
      }
    }

    if (this.requiredRefs?.length) {
      for (const ref of this.requiredRefs) {
        if (!(ref in refs)) {
          throw new MissingRefError(ref, this);
        }
      }
    }

    this.refs = /** @type {RefsType<T>} */ (refs);
  }

  /**
   * MutationObserver instance to observe changes in the component's DOM subtree and update refs accordingly.
   *
   * @type {MutationObserver}
   */
  #mutationObserver = new MutationObserver((mutations) => {
    if (
      mutations.some(
        (m) =>
          (m.type === 'attributes' && this.#isDescendant(m.target)) ||
          (m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].some(this.#isDescendant))
      )
    ) {
      this.#updateRefs();
    }
  });

  /**
   * Checks if a given node is a descendant of this component.
   *
   * @param {Node} node - The node to check.
   * @returns {boolean} True if the node is a descendant of this component.
   */
  #isDescendant = (node) => getClosestComponent(getAncestor(node)) === this;
}

/**
 * Get the ancestor of a given node.
 *
 * @param {Node} node - The node to get the ancestor of.
 * @returns {Node | null} The ancestor of the node or null if none is found.
 */
function getAncestor(node) {
  if (node.parentNode) return node.parentNode;

  const root = node.getRootNode();
  if (root instanceof ShadowRoot) return root.host;

  return null;
}

/**
 * Recursively finds the closest ancestor that is an instance of `Component`.
 *
 * @param {Node | null} node - The starting node to search from.
 * @returns {HTMLElement | null} The closest ancestor `Component` instance or null if none is found.
 */
function getClosestComponent(node) {
  if (!node) return null;
  if (node instanceof Component) return node;
  if (node instanceof HTMLElement && node.tagName.toLowerCase().endsWith('-component')) return node;

  const ancestor = getAncestor(node);
  if (ancestor) return getClosestComponent(ancestor);

  return null;
}

/**
 * Initializes the event listeners for custom event handling.
 *
 * Sets up event listeners for specified events and delegates the handling of those events
 * to methods defined on the closest `Component` instance, based on custom attributes.
 */
let initialized = false;

function registerEventListeners() {
  if (initialized) return;
  initialized = true;

  const events = ['click', 'change', 'select', 'focus', 'blur', 'submit', 'input', 'keydown', 'keyup', 'toggle'];
  const shouldBubble = ['focus', 'blur'];
  const expensiveEvents = ['pointerenter', 'pointerleave'];

  for (const eventName of [...events, ...expensiveEvents]) {
    const attribute = `on:${eventName}`;

    document.addEventListener(
      eventName,
      (event) => {
        const element = getElement(event);

        if (!element) return;

        const proxiedEvent =
          event.target !== element
            ? new Proxy(event, {
                get(target, property) {
                  if (property === 'target') return element;

                  const value = Reflect.get(target, property);

                  if (typeof value === 'function') {
                    return value.bind(target);
                  }

                  return value;
                },
              })
            : event;

        const value = element.getAttribute(attribute) ?? '';
        let [selector, method] = value.split('/');
        // Extract the last segment of the attribute value delimited by `?` or `/`
        // Do not use lookback for Safari 16.0 compatibility
        const matches = value.match(/([\/\?][^\/\?]+)([\/\?][^\/\?]+)$/);
        const data = matches ? matches[2] : null;
        const instance = selector
          ? selector.startsWith('#')
            ? document.querySelector(selector)
            : element.closest(selector)
          : getClosestComponent(element);

        if (!(instance instanceof Component) || !method) return;

        method = method.replace(/\?.*/, '');

        const callback = /** @type {any} */ (instance)[method];

        if (typeof callback === 'function') {
          try {
            /** @type {(Event | Data)[]} */
            const args = [proxiedEvent];

            if (data) args.unshift(parseData(data));

            callback.call(instance, ...args);
          } catch (error) {
            console.error(error);
          }
        }
      },
      { capture: true }
    );
  }

  /** @param {Event} event */
  function getElement(event) {
    const target = event.composedPath?.()[0] ?? event.target;

    if (!(target instanceof Element)) return;

    if (target.hasAttribute(`on:${event.type}`)) {
      return target;
    }

    if (expensiveEvents.includes(event.type)) {
      return null;
    }

    return event.bubbles || shouldBubble.includes(event.type) ? target.closest(`[on\\:${event.type}]`) : null;
  }
}

/**
 * Parses a string to extract data based on a delimiter.
 *
 * @param {string} str - The string to parse.
 * @returns {Object|Array<string|number>|string} The parsed data.
 */
function parseData(str) {
  const delimiter = str[0];
  const data = str.slice(1);

  return delimiter === '?'
    ? Object.fromEntries(
        Array.from(new URLSearchParams(data).entries()).map(([key, value]) => [key, parseValue(value)])
      )
    : parseValue(data);
}

/**
 * @typedef {Object|Array<string|number>|string} Data
 */

/**
 * Parses a string value to its appropriate type.
 *
 * @param {string} str - The string to parse.
 * @returns {Data} The parsed value.
 */
function parseValue(str) {
  if (str === 'true') return true;
  if (str === 'false') return false;

  const maybeNumber = Number(str);
  if (!isNaN(maybeNumber) && str.trim() !== '') return maybeNumber;

  return str;
}

/**
 * Throws a formatted error when a required ref is not found in the component.
 */
class MissingRefError extends Error {
  /**
   * @param {string} ref
   * @param {Component} component
   */
  constructor(ref, component) {
    super(`Required ref "${ref}" not found in component ${component.tagName.toLowerCase()}`);
  }
}

/*
 * Declarative shadow DOM is only initialized on the initial render of the page.
 * If the component is mounted after the browser finishes the initial render,
 * the shadow root needs to be manually hydrated.
 */
export class DeclarativeShadowElement extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      const template = this.querySelector(':scope > template[shadowrootmode="open"]');

      if (!(template instanceof HTMLTemplateElement)) return;

      const shadow = this.attachShadow({ mode: 'open' });
      shadow.append(template.content.cloneNode(true));
    }
  }
}

/**
 * A custom ResizeObserver that only calls the callback when the element is resized.
 * By default the ResizeObserver callback is called when the element is first observed.
 */
export class ResizeNotifier extends ResizeObserver {
  #initialized = false;

  /**
   * @param {ResizeObserverCallback} callback
   */
  constructor(callback) {
    super((entries) => {
      if (this.#initialized) return callback(entries, this);
      this.#initialized = true;
    });
  }

  disconnect() {
    this.#initialized = false;
    super.disconnect();
  }
}

/**
 * Event class for overflow minimum items updates
 * @extends {Event}
 */
export class OverflowMinimumEvent extends Event {
  /**
   * Creates a new OverflowMinimumEvent
   * @param {boolean} minimumReached - Whether the minimum number of visible items has been reached
   */
  constructor(minimumReached) {
    super('overflowMinimum', { bubbles: true });
    this.detail = {
      minimumReached,
    };
  }
}

export class ReflowEvent extends Event {
  /**
   * @param {HTMLElement} lastVisibleElement - The element to move to the last visible position
   */
  constructor(lastVisibleElement) {
    super('reflow', { bubbles: true });
    this.detail = { lastVisibleElement };
  }
}

/**
 * A custom element that wraps a list of items and moves them to an overflow slot when they don't fit.
 * This component is used in the header section, it needs to be render-blocking to avoid layout shifts.
 * @attr {string | null} minimum-items When set, the element enters a 'minimum-reached' state when visible items are at or below this number.
 * @example
 * <overflow-list minimum-items="2">
 *   <!-- list items -->
 * </overflow-list>
 */
export class OverflowList extends DeclarativeShadowElement {
  static get observedAttributes() {
    return ['disabled', 'minimum-items'];
  }

  /**
   * @param {string} name
   * @param {string} oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'disabled') {
      if (newValue === 'true') {
        this.#reset();
      } else {
        this.#reflowItems();
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();

    if (this.hasAttribute('defer')) {
      const deferredReflow = () => {
        // Remove attribute first to change layout before calculating the actual size
        this.removeAttribute('defer');
        this.#initialize();
      };
      const { schedule } = this;

      const requestIdleCallback =
        typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback : setTimeout;

      requestIdleCallback(() => schedule(deferredReflow));
    } else if (this.shadowRoot) {
      this.#initialize();
    } else {
      // Not all element children has been parsed yet, try again in the next tick
      // <overflow-list> is a special case as critical.js can execute before DOMContentLoaded
      setTimeout(() => {
        this.#initialize();
      }, 0);
    }
  }

  /**
   * Initialize the element
   */
  #initialize() {
    const { shadowRoot } = this;

    if (!shadowRoot) throw new Error('Missing shadow root');

    const defaultSlot = shadowRoot.querySelector('slot:not([name])');
    const overflowSlot = shadowRoot.querySelector('slot[name="overflow"]');
    const moreSlot = shadowRoot.querySelector('slot[name="more"]');
    const overflow = shadowRoot.querySelector('[part="overflow"]');
    const list = shadowRoot.querySelector('[part="list"]');
    const placeholder = shadowRoot.querySelector('[part="placeholder"]');

    if (
      !(defaultSlot instanceof HTMLSlotElement) ||
      !(overflowSlot instanceof HTMLSlotElement) ||
      !(moreSlot instanceof HTMLSlotElement) ||
      !(overflow instanceof HTMLElement) ||
      !(list instanceof HTMLUListElement) ||
      !(placeholder instanceof HTMLLIElement)
    ) {
      throw new Error('Invalid element types in <OverflowList />');
    }

    this.#refs = {
      defaultSlot,
      overflowSlot,
      moreSlot,
      overflow,
      list,
      placeholder,
    };

    // Add event listener for reflow requests
    this.addEventListener(
      'reflow',
      /** @param {ReflowEvent} event */ (event) => {
        this.#reflowItems(event.detail.lastVisibleElement);
      }
    );

    this.#reflowItems();
  }

  disconnectedCallback() {
    this.#resizeObserver.disconnect();
  }

  get schedule() {
    return typeof Theme?.utilities?.scheduler?.schedule === 'function'
      ? Theme.utilities.scheduler.schedule
      : /** @param {FrameRequestCallback} callback */ (callback) =>
          requestAnimationFrame(() => setTimeout(callback, 0));
  }

  #scheduled = false;

  /**
   * Get the minimum number of items before changing the minimum-reached state
   * @returns {number | null}
   */
  get minimumItems() {
    const value = this.getAttribute('minimum-items');
    return value ? parseInt(value, 10) : null;
  }

  get overflowSlot() {
    const { overflowSlot } = this.#refs;
    return overflowSlot;
  }

  get defaultSlot() {
    const { defaultSlot } = this.#refs;
    return defaultSlot;
  }

  /**
   * @type {{width: number | null, height: number | null}}
   */
  #lastDimensions = {
    width: null,
    height: null,
  };

  /**
   * @type {ResizeObserverCallback & MutationCallback}
   */
  #handleChange = (event) => {
    if (this.#scheduled) return;

    let width = null;
    let height = null;
    let isResize = false;

    for (const [, entry] of event.entries()) {
      if (!(entry instanceof ResizeObserverEntry)) break;
      // There should only be one entry
      isResize = true;
      width = Math.round(entry.contentRect.width);
      height = Math.round(entry.contentRect.height);
    }

    if (isResize) {
      if (!width || !height || (width === this.#lastDimensions.width && height === this.#lastDimensions.height)) {
        // Skip reflow if dimensions are 0 or the same as the last reflow
        return;
      }

      this.#lastDimensions = { width: Math.round(width), height: Math.round(height) };
    }

    this.#scheduled = true;

    this.schedule(() => {
      this.#reflowItems();
      this.#scheduled = false;
    });
  };

  /**
   * Move all items to the default slot.
   */
  #moveItemsToDefaultSlot() {
    const { defaultSlot, overflowSlot } = this.#refs;

    for (const element of overflowSlot.assignedElements()) {
      element.slot = defaultSlot.name;
    }
  }

  /**
   * Reset the list to its initial state and disconnect the observers.
   */
  #reset() {
    const { list } = this.#refs;

    this.#mutationObserver.disconnect();
    this.#resizeObserver.disconnect();
    this.#moveItemsToDefaultSlot();

    list.style.removeProperty('height');
    this.style.setProperty('--overflow-count', '0');
  }

  /**
   * Sets the minimum-reached attribute and dispatches a custom event based on visible elements count
   * @param {Element[]} visibleElements - The currently visible elements
   */
  #updateMinimumReached(visibleElements) {
    if (this.minimumItems !== null) {
      const minimumReached = visibleElements.length < this.minimumItems;

      if (minimumReached) {
        this.setAttribute('minimum-reached', '');
      } else {
        this.removeAttribute('minimum-reached');
      }

      this.dispatchEvent(new OverflowMinimumEvent(minimumReached));
    }
  }

  /**
   * Show all items in the list.
   */
  showAll() {
    const { placeholder } = this.#refs;

    placeholder.style.setProperty('width', '0');
    placeholder.style.setProperty('display', 'none');
    this.setAttribute('disabled', 'true');
  }

  /**
   * Reflow items based on available space within the list.
   * @param {HTMLElement} [lastVisibleElement] Optional element to place in last visible position
   */
  #reflowItems = (lastVisibleElement) => {
    const { defaultSlot, overflowSlot, moreSlot, list, placeholder } = this.#refs;

    this.#resizeObserver.disconnect();
    this.#mutationObserver.disconnect();

    // Avoid layout shifts while reflowing the list
    const { height } = this.firstElementChild?.getBoundingClientRect() ?? {};

    if (height) list.style.height = `${height}px`;
    list.style.setProperty('overflow', 'hidden');

    // Move all elements to the default slot so we can check which ones overflow
    this.#moveItemsToDefaultSlot();

    const elements = defaultSlot.assignedElements();

    // Make sure the "More" item and placeholder are hidden
    moreSlot.hidden = true;
    placeholder.hidden = true;

    // First, check if all the items fit
    const rootRect = list.getBoundingClientRect();

    // Store the initial dimensions for comparison later
    this.#lastDimensions = { width: Math.round(rootRect.width), height: Math.round(rootRect.height) };

    const getVisibleElements = () => elements.filter((el) => el.getBoundingClientRect().top <= rootRect.top);
    let visibleElements = getVisibleElements();

    // If not all items fit or we have a lastVisibleElement, let's calculate with "More" button
    if (visibleElements.length !== elements.length || lastVisibleElement) {
      // Putting the "More" item (and lastVisibleElement, if provided) at the start of the list lets us see which items will fit on the same row
      moreSlot.style.setProperty('order', '-1');
      moreSlot.hidden = false;
      moreSlot.style.setProperty('height', `${height}px`);

      if (lastVisibleElement) {
        lastVisibleElement.style.setProperty('order', '-1');
      }

      // Recalculate the visible elements
      visibleElements = getVisibleElements();

      // Reset the order
      moreSlot.style.removeProperty('order');
      if (lastVisibleElement) {
        lastVisibleElement.style.removeProperty('order');
      }

      // If we have a lastVisibleElement, ensure it's in the last visible position
      if (lastVisibleElement) {
        const visibleIndex = visibleElements.indexOf(lastVisibleElement);
        if (visibleIndex !== -1) {
          // Remove lastVisibleElement from its current position
          visibleElements.splice(visibleIndex, 1);
          // Add it to the end of visible elements
          visibleElements.push(lastVisibleElement);
        }
      }

      moreSlot.style.setProperty('height', 'auto');
    }

    const overflowingElements = elements.filter((element) => !visibleElements.includes(element));
    const [firstOverflowingElement] = overflowingElements;
    const hasOverflow = overflowingElements.length > 0;
    const placeholderWidth = firstOverflowingElement ? firstOverflowingElement.clientWidth : 0;

    // Move the elements to the correct slot
    for (const element of elements) {
      element.slot = overflowingElements.includes(element) ? overflowSlot.name : defaultSlot.name;
    }

    // If there are overflowing elements
    // Show more button and placeholder if needed
    moreSlot.hidden = !hasOverflow;

    if (hasOverflow) {
      // Set the width and height of the placeholder so the list can grow if there is space
      placeholder.style.width = `${placeholderWidth}px`;
      placeholder.hidden = false;
    }

    list.style.setProperty('counter-reset', `overflow-count ${overflowingElements.length}`);
    this.style.setProperty('--overflow-count', `${overflowingElements.length}`);
    list.style.removeProperty('overflow');

    // Check if the minimum-reached state should be updated
    hasOverflow && this.#updateMinimumReached(visibleElements);

    // Observe the list for changes in size
    this.#resizeObserver.observe(this);
    this.#mutationObserver.observe(this, { childList: true });
  };

  /**
   * @type {{
   *   defaultSlot: HTMLSlotElement;
   *   overflowSlot: HTMLSlotElement;
   *   moreSlot: HTMLSlotElement;
   *   overflow: HTMLElement;
   *   list: HTMLUListElement;
   *   placeholder: HTMLLIElement;
   * }}
   */
  #refs;

  /**
   * @type {ResizeObserver}
   */
  #resizeObserver = new ResizeNotifier(this.#handleChange);

  /**
   * @type {MutationObserver}
   */
  #mutationObserver = new MutationObserver(this.#handleChange);
}

if (!customElements.get('overflow-list')) {
  customElements.define('overflow-list', OverflowList);
}

// Function to calculate total height of header group children
export function calculateHeaderGroupHeight(
  header = document.querySelector('#header-component'),
  headerGroup = document.querySelector('#header-group')
) {
  if (!headerGroup) return 0;

  let totalHeight = 0;
  const children = headerGroup.children;
  for (let i = 0; i < children.length; i++) {
    const element = children[i];
    if (element === header || !(element instanceof HTMLElement)) continue;
    totalHeight += element.offsetHeight;
  }
  return totalHeight;
}

/**
 * Initialize and maintain header height CSS variables.
 * This is critical for preventing layout shifts during page load.
 * There is a `ResizeObserver` and `MutationObserver` that kicks in post hydration in header.js
 * Note: header-group uses display: contents, so we must observe all children.
 */
(() => {
  const header = document.querySelector('header-component');

  // Early exit if no header - nothing to do
  if (!(header instanceof HTMLElement)) return;

  // Calculate initial height(s
  const headerHeight = header.offsetHeight;
  const headerGroupHeight = calculateHeaderGroupHeight(header);

  document.body.style.setProperty('--header-height', `${headerHeight}px`);
  document.body.style.setProperty('--header-group-height', `${headerGroupHeight}px`);
})();

/**
 * Updates CSS custom properties for transparent header offset calculation
 * Avoids expensive :has() selectors
 */
(() => {
  const header = document.querySelector('#header-component');
  const headerGroup = document.querySelector('#header-group');
  const hasHeaderSection = headerGroup?.querySelector('.header-section');
  if (!hasHeaderSection || !header?.hasAttribute('transparent')) {
    document.body.style.setProperty('--transparent-header-offset-boolean', '0');
    return;
  }

  const hasImmediateSection = hasHeaderSection.nextElementSibling?.classList.contains('shopify-section');

  const shouldApplyOffset = !hasImmediateSection ? '1' : '0';
  document.body.style.setProperty('--transparent-header-offset-boolean', shouldApplyOffset);
})();
