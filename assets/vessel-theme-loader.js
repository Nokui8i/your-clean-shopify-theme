/**
 * Vessel Theme Loader
 * This script loads all the Vessel theme components and makes them available globally
 */

// Load order is important - dependencies must be loaded first
const componentFiles = [
  // Core utilities and base classes
  'utilities.js',
  'critical.js',
  'component.js',
  'events.js',
  'performance.js',
  'morph.js',
  'section-renderer.js',
  'scrolling.js',
  'slideshow.js',
  'dialog.js',
  'focus.js',
  
  // UI Components
  'floating-panel.js',
  'text-component.js',
  'paginated-list.js',
  'accordion-custom.js',
  'announcement-bar.js',
  'auto-close-details.js',
  'copy-to-clipboard.js',
  'drag-zoom-wrapper.js',
  'header-drawer.js',
  'header-menu.js',
  'header.js',
  
  // Cart and Product Components
  'cart-discount.js',
  'cart-drawer.js',
  'cart-icon.js',
  'cart-note.js',
  'component-cart-items.js',
  'component-quantity-selector.js',
  'product-card.js',
  'product-form.js',
  'product-inventory.js',
  'product-price.js',
  'product-recommendations.js',
  'product-title-truncation.js',
  'variant-picker.js',
  
  // Other Components
  'account-login-actions.js',
  'anchored-popover.js',
  'blog-posts-list.js',
  'collection-links.js',
  'gift-card-recipient-form.js',
  'jumbo-text.js',
  'local-pickup.js',
  'localization.js',
  'marquee.js',
  'media-gallery.js',
  'media.js',
  'overflow-list.css',
  'paginated-list-aspect-ratio.js',
  'predictive-search.js',
  'product-card-link.js',
  'qr-code-generator.js',
  'qr-code-image.js',
  'quick-add.js',
  'recently-viewed-products.js',
  'results-list.js',
  'rte-formatter.js',
  'search-page-input.js',
  'show-more.js',
  'template-giftcard.css',
  'theme-editor.js',
  'video-background.js',
  'view-transitions.js',
  'zoom-dialog.js'
];

/**
 * Loads a JavaScript file dynamically
 * @param {string} filename - The filename to load
 * @returns {Promise} Promise that resolves when the file is loaded
 */
function loadScript(filename) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `/assets/${filename}`;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${filename}`));
    document.head.appendChild(script);
  });
}

/**
 * Loads all Vessel theme components
 */
async function loadVesselTheme() {
  console.log('🚀 Loading Vessel Theme Components...');
  
  try {
    // Load core files first
    for (const filename of componentFiles) {
      if (filename.endsWith('.js')) {
        await loadScript(filename);
        console.log(`✅ Loaded: ${filename}`);
      }
    }
    
    console.log('🎉 All Vessel Theme components loaded successfully!');
    
    // Dispatch a custom event to notify that all components are loaded
    document.dispatchEvent(new CustomEvent('vessel-theme-loaded'));
    
  } catch (error) {
    console.error('❌ Error loading Vessel Theme components:', error);
  }
}

// Start loading when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadVesselTheme);
} else {
  loadVesselTheme();
}

// Make the loader available globally
window.loadVesselTheme = loadVesselTheme;
