/**
 * Request an idle callback or fallback to setTimeout
 * @returns {function} The requestIdleCallback function
 */
export const requestIdleCallback =
  typeof window.requestIdleCallback == 'function' ? window.requestIdleCallback : setTimeout;

/**
 * Executes a callback in a separate task after the next frame.
 * Using to defer non-critical tasks until after the interaction is complete.
 * @see https://web.dev/articles/optimize-inp#yield_to_allow_rendering_work_to_occur_sooner
 * @param {() => any} callback - The callback to execute
 */
export const requestYieldCallback = (callback) => {
  requestAnimationFrame(() => {
    setTimeout(callback, 0);
  });
};

/**
 * Check if the browser supports View Transitions API
 * @returns {boolean} True if the browser supports View Transitions API, false otherwise
 */
export function supportsViewTransitions() {
  return typeof document.startViewTransition === 'function';
}

/**
 * The current view transition
 * @type {{ current: Promise<void> | undefined }}
 */
export const viewTransition = {
  current: undefined,
};

/**
 * Functions to run when a view transition of a given type is started
 * @type {{ [key: string]: () => Promise<(() => void) | undefined> }}
 */
const viewTransitionTypes = {
  'product-grid': async () => {
    const grid = document.querySelector('.product-grid');
    const productCards = /** @type {HTMLElement[]} */ ([
      ...document.querySelectorAll('.product-grid .product-grid__item'),
    ]);

    if (!grid || !productCards.length) return;

    await new Promise((resolve) =>
      requestIdleCallback(() => {
        const cardsToAnimate = getCardsToAnimate(grid, productCards);

        productCards.forEach((card, index) => {
          if (index < cardsToAnimate) {
            card.style.setProperty('view-transition-name', `product-card-${card.dataset.productId}`);
          } else {
            card.style.setProperty('content-visibility', 'hidden');
          }
        });

        resolve(null);
      })
    );

    return () =>
      productCards.forEach((card) => {
        card.style.removeProperty('view-transition-name');
        card.style.removeProperty('content-visibility');
      });
  },
};

/**
 * Starts a view transition
 * @param {() => void} callback The callback to call when the view transition starts
 * @param {string[]} [types] The types of view transition to use
 * @returns {Promise<void>} A promise that resolves when the view transition finishes
 */
export function startViewTransition(callback, types) {
  return new Promise(async (resolve) => {
    // Check if View Transitions API is supported
    if (supportsViewTransitions() && !prefersReducedMotion()) {
      let cleanupFunctions = [];

      if (types) {
        for (const type of types) {
          if (viewTransitionTypes[type]) {
            const cleanupFunction = await viewTransitionTypes[type]();
            if (cleanupFunction) cleanupFunctions.push(cleanupFunction);
          }
        }
      }

      const transition = document.startViewTransition(callback);

      if (!viewTransition.current) {
        viewTransition.current = transition.finished;
      }

      if (types) types.forEach((type) => transition.types.add(type));

      transition.finished.then(() => {
        viewTransition.current = undefined;
        cleanupFunctions.forEach((cleanupFunction) => cleanupFunction());
        resolve();
      });

      return;
    }

    // Fallback for browsers that don't support this API yet
    callback();
    resolve();
  });
}

/**
 * @typedef {{ [key: string]: string | undefined }} Headers
 */

/**
 * @typedef {Object} FetchConfig
 * @property {string} method
 * @property {Headers} headers
 * @property {string | FormData | undefined} [body]
 */

/**
 * Creates a fetch configuration object
 * @param {string} [type] The type of response to expect
 * @param {Object} [config] The config of the request
 * @param {FetchConfig['body']} [config.body] The body of the request
 * @param {FetchConfig['headers']} [config.headers] The headers of the request
 * @returns {RequestInit} The fetch configuration object
 */
export function fetchConfig(type = 'json', config = {}) {
  /** @type {Headers} */
  const headers = { 'Content-Type': 'application/json', Accept: `application/${type}`, ...config.headers };

  if (type === 'javascript') {
    headers['X-Requested-With'] = 'XMLHttpRequest';
    delete headers['Content-Type'];
  }

  return {
    method: 'POST',
    headers: /** @type {HeadersInit} */ (headers),
    body: config.body,
  };
}

/**
 * Creates a debounced function that delays calling the provided function (fn)
 * until after wait milliseconds have elapsed since the last time
 * the debounced function was invoked. The returned function has a .cancel()
 * method to cancel any pending calls.
 *
 * @template {(...args: any[]) => any} T
 * @param {T} fn The function to debounce
 * @param {number} wait The time (in milliseconds) to wait before calling fn
 * @returns {T & { cancel(): void }} A debounced version of fn with a .cancel() method
 */
export function debounce(fn, wait) {
  /** @type {number | undefined} */
  let timeout;

  /** @param {...any} args */
  function debounced(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  }

  // Add the .cancel method:
  debounced.cancel = () => {
    clearTimeout(timeout);
  };

  return /** @type {T & { cancel(): void }} */ (debounced);
}

/**
 * Creates a throttled function that calls the provided function (fn) at most once per every wait milliseconds
 *
 * @template {(...args: any[]) => any} T
 * @param {T} fn The function to throttle
 * @param {number} delay The time (in milliseconds) to wait before calling fn
 * @returns {T & { cancel(): void }} A throttled version of fn with a .cancel() method
 */
export function throttle(fn, delay) {
  let lastCall = 0;

  /** @param {...any} args */
  function throttled(...args) {
    const now = performance.now();
    // If the time since the last call exceeds the delay, execute the callback
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  }

  throttled.cancel = () => {
    lastCall = performance.now();
  };

  return /** @type {T & { cancel(): void }} */ (throttled);
}

/**
 * A media query for reduced motion
 * @type {MediaQueryList}
 */
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Check if the user prefers reduced motion
 * @returns {boolean} True if the user prefers reduced motion, false otherwise
 */
export function prefersReducedMotion() {
  return reducedMotion.matches;
}

/**
 * Normalize a string
 * @param {string} str The string to normalize
 * @returns {string} The normalized string
 */
export function normalizeString(str) {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Format a money value
 * @param {string} value The value to format
 * @returns {string} The formatted value
 */
export function formatMoney(value) {
  let valueWithNoSpaces = value.replace(' ', '');
  if (valueWithNoSpaces.indexOf(',') === -1) return valueWithNoSpaces;
  if (valueWithNoSpaces.indexOf(',') < valueWithNoSpaces.indexOf('.')) return valueWithNoSpaces.replace(',', '');
  if (valueWithNoSpaces.indexOf('.') < valueWithNoSpaces.indexOf(','))
    return valueWithNoSpaces.replace('.', '').replace(',', '.');
  if (valueWithNoSpaces.indexOf(',') !== -1) return valueWithNoSpaces.replace(',', '.');

  return valueWithNoSpaces;
}

/**
 * Check if the document is ready/loaded and call the callback when it is.
 * @param {() => void} callback The function to call when the document is ready.
 */
export function onDocumentLoaded(callback) {
  if (document.readyState === 'complete') {
    callback();
  } else {
    window.addEventListener('load', callback);
  }
}

/**
 * Wait for all animations to finish before calling the callback.
 * @param {Element | Element[]} elements The element(s) whose animations to wait for.
 * @param {() => void} [callback] The function to call when all animations are finished.
 * @param {Object} [options] The options to pass to `Element.getAnimations`.
 * @returns {Promise<void>} A promise that resolves when all animations are finished.
 */
export function onAnimationEnd(elements, callback, options = { subtree: true }) {
  const animations = Array.isArray(elements)
    ? elements.flatMap((element) => element.getAnimations(options))
    : elements.getAnimations(options);
  const animationPromises = animations.reduce((acc, animation) => {
    // Ignore ViewTimeline animations
    if (animation.timeline instanceof DocumentTimeline) {
      acc.push(animation.finished);
    }

    return acc;
  }, /** @type {Promise<Animation>[]} */ ([]));

  return Promise.allSettled(animationPromises).then(callback);
}

/**
 * Check if the click is outside the element.
 * @param {MouseEvent} event The mouse event.
 * @param {Element} element The element to check.
 * @returns {boolean} True if the click is outside the element, false otherwise.
 */
export function isClickedOutside(event, element) {
  if (event.target instanceof HTMLDialogElement || !(event.target instanceof Element)) {
    return !isPointWithinElement(event.clientX, event.clientY, element);
  }

  return !element.contains(event.target);
}

/**
 * Check if a point is within an element.
 * @param {number} x The x coordinate of the point.
 * @param {number} y The y coordinate of the point.
 * @param {Element} element The element to check.
 * @returns {boolean} True if the point is within the element, false otherwise.
 */
export function isPointWithinElement(x, y, element) {
  const { left, right, top, bottom } = element.getBoundingClientRect();

  return x >= left && x <= right && y >= top && y <= bottom;
}

// Media Query Utilities
export const mediaQueryLarge = window.matchMedia('(min-width: 990px)');

// Mobile Breakpoint Check
export function isMobileBreakpoint() {
  return !mediaQueryLarge.matches;
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Request Idle Callback
export function requestIdleCallback(callback) {
  if (window.requestIdleCallback) {
    return window.requestIdleCallback(callback);
  }
  return setTimeout(callback, 1);
}

// View Transition
export const viewTransition = {
  current: null
};

// Scheduler
export const scheduler = {
  schedule: (task) => {
    if (window.requestIdleCallback) {
      requestIdleCallback(task);
    } else {
      setTimeout(task, 0);
    }
  }
};

// Utility functions
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function center(element, axis) {
  const rect = element.getBoundingClientRect();
  return axis === 'x' ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
}

export function closest(values, target) {
  return values.reduce((prev, curr) => {
    return Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev;
  });
}

export function getVisibleElements(container, elements, threshold = 0.5, axis = 'x') {
  if (!elements || !elements.length) return [];
  
  const containerRect = container.getBoundingClientRect();
  const visible = [];
  
  for (const element of elements) {
    const elementRect = element.getBoundingClientRect();
    let visibleRatio;
    
    if (axis === 'x') {
      const overlap = Math.min(elementRect.right, containerRect.right) - Math.max(elementRect.left, containerRect.left);
      visibleRatio = overlap / elementRect.width;
    } else {
      const overlap = Math.min(elementRect.bottom, containerRect.bottom) - Math.max(elementRect.top, containerRect.top);
      visibleRatio = overlap / elementRect.height;
    }
    
    if (visibleRatio >= threshold) {
      visible.push(element);
    }
  }
  
  return visible;
}

export function preventDefault(event) {
  event.preventDefault();
}

export function isClickedOutside(element, event) {
  return !element.contains(event.target);
}

export function onAnimationEnd(element, callback) {
  const handleAnimationEnd = () => {
    element.removeEventListener('animationend', handleAnimationEnd);
    callback();
  };
  element.addEventListener('animationend', handleAnimationEnd);
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function resetShimmer(element) {
  element.style.animation = 'none';
  element.offsetHeight; // Trigger reflow
  element.style.animation = null;
}

export function formatMoney(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function touchToPoint(touch) {
  return {
    x: touch.clientX,
    y: touch.clientY
  };
}

export function getDistance(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getMidpoint(point1, point2) {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2
  };
}

export function trapFocus(container) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  container.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
  
  firstElement.focus();
}

export function removeTrapFocus(container) {
  // Remove event listeners if needed
}

export function cycleFocus(elements, direction = 1) {
  const currentIndex = elements.findIndex(el => el === document.activeElement);
  const nextIndex = (currentIndex + direction + elements.length) % elements.length;
  elements[nextIndex].focus();
}

export function onDocumentLoaded(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

export function changeMetaThemeColor(color) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', color);
  }
}

export function calculateHeaderGroupHeight(header, headerGroup) {
  if (!headerGroup) return 0;
  
  let totalHeight = 0;
  const children = headerGroup.children;
  
  for (const child of children) {
    if (child.style.display !== 'none') {
      totalHeight += child.offsetHeight;
    }
  }
  
  return totalHeight;
}

// Fetch config utility
export function fetchConfig(type, options = {}) {
  const config = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': `application/${type}`,
      ...options.headers
    },
    ...options
  };
  
  return config;
}

// Start view transition
export function startViewTransition(callback) {
  if (document.startViewTransition) {
    return document.startViewTransition(callback);
  }
  return Promise.resolve().then(callback);
}

// Export for use in other modules
window.isMobileBreakpoint = isMobileBreakpoint;
window.mediaQueryLarge = mediaQueryLarge;
window.debounce = debounce;
window.throttle = throttle;
window.requestIdleCallback = requestIdleCallback;
window.viewTransition = viewTransition;
window.scheduler = scheduler;
window.clamp = clamp;
window.center = center;
window.closest = closest;
window.getVisibleElements = getVisibleElements;
window.preventDefault = preventDefault;
window.isClickedOutside = isClickedOutside;
window.onAnimationEnd = onAnimationEnd;
window.prefersReducedMotion = prefersReducedMotion;
window.resetShimmer = resetShimmer;
window.formatMoney = formatMoney;
window.touchToPoint = touchToPoint;
window.getDistance = getDistance;
window.getMidpoint = getMidpoint;
window.trapFocus = trapFocus;
window.removeTrapFocus = removeTrapFocus;
window.cycleFocus = cycleFocus;
window.onDocumentLoaded = onDocumentLoaded;
window.changeMetaThemeColor = changeMetaThemeColor;
window.calculateHeaderGroupHeight = calculateHeaderGroupHeight;
window.fetchConfig = fetchConfig;
window.startViewTransition = startViewTransition;
