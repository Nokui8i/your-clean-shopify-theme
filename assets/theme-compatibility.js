/**
 * Theme Compatibility Layer
 * This script provides the @theme namespace that Vessel theme components expect
 */

// Create the @theme namespace
window['@theme'] = {};

// Import all the necessary modules and make them available under @theme
import('./utilities.js').then(module => {
  window['@theme'].utilities = module;
});

import('./critical.js').then(module => {
  window['@theme'].critical = module;
});

import('./component.js').then(module => {
  window['@theme'].component = module;
});

import('./events.js').then(module => {
  window['@theme'].events = module;
});

import('./performance.js').then(module => {
  window['@theme'].performance = module;
});

import('./morph.js').then(module => {
  window['@theme'].morph = module;
});

import('./section-renderer.js').then(module => {
  window['@theme']['section-renderer'] = module;
});

import('./scrolling.js').then(module => {
  window['@theme'].scrolling = module;
});

import('./slideshow.js').then(module => {
  window['@theme'].slideshow = module;
});

import('./dialog.js').then(module => {
  window['@theme'].dialog = module;
});

import('./focus.js').then(module => {
  window['@theme'].focus = module;
});

import('./floating-panel.js').then(module => {
  window['@theme']['floating-panel'] = module;
});

import('./text-component.js').then(module => {
  window['@theme']['text-component'] = module;
});

import('./paginated-list.js').then(module => {
  window['@theme']['paginated-list'] = module;
});

import('./accordion-custom.js').then(module => {
  window['@theme']['accordion-custom'] = module;
});

import('./announcement-bar.js').then(module => {
  window['@theme']['announcement-bar'] = module;
});

import('./auto-close-details.js').then(module => {
  window['@theme']['auto-close-details'] = module;
});

import('./copy-to-clipboard.js').then(module => {
  window['@theme']['copy-to-clipboard'] = module;
});

import('./drag-zoom-wrapper.js').then(module => {
  window['@theme']['drag-zoom-wrapper'] = module;
});

import('./header-drawer.js').then(module => {
  window['@theme']['header-drawer'] = module;
});

import('./header-menu.js').then(module => {
  window['@theme']['header-menu'] = module;
});

import('./header.js').then(module => {
  window['@theme'].header = module;
});

import('./cart-discount.js').then(module => {
  window['@theme']['cart-discount'] = module;
});

import('./cart-drawer.js').then(module => {
  window['@theme']['cart-drawer'] = module;
});

import('./cart-icon.js').then(module => {
  window['@theme']['cart-icon'] = module;
});

import('./cart-note.js').then(module => {
  window['@theme']['cart-note'] = module;
});

import('./component-cart-items.js').then(module => {
  window['@theme']['component-cart-items'] = module;
});

import('./component-quantity-selector.js').then(module => {
  window['@theme']['component-quantity-selector'] = module;
});

import('./product-card.js').then(module => {
  window['@theme']['product-card'] = module;
});

import('./product-form.js').then(module => {
  window['@theme']['product-form'] = module;
});

import('./product-inventory.js').then(module => {
  window['@theme']['product-inventory'] = module;
});

import('./product-price.js').then(module => {
  window['@theme']['product-price'] = module;
});

import('./product-recommendations.js').then(module => {
  window['@theme']['product-recommendations'] = module;
});

import('./product-title-truncation.js').then(module => {
  window['@theme']['product-title-truncation'] = module;
});

import('./variant-picker.js').then(module => {
  window['@theme']['variant-picker'] = module;
});

import('./account-login-actions.js').then(module => {
  window['@theme']['account-login-actions'] = module;
});

import('./anchored-popover.js').then(module => {
  window['@theme']['anchored-popover'] = module;
});

import('./blog-posts-list.js').then(module => {
  window['@theme']['blog-posts-list'] = module;
});

import('./collection-links.js').then(module => {
  window['@theme']['collection-links'] = module;
});

import('./gift-card-recipient-form.js').then(module => {
  window['@theme']['gift-card-recipient-form'] = module;
});

import('./jumbo-text.js').then(module => {
  window['@theme']['jumbo-text'] = module;
});

import('./local-pickup.js').then(module => {
  window['@theme']['local-pickup'] = module;
});

import('./localization.js').then(module => {
  window['@theme'].localization = module;
});

import('./marquee.js').then(module => {
  window['@theme'].marquee = module;
});

import('./media-gallery.js').then(module => {
  window['@theme']['media-gallery'] = module;
});

import('./media.js').then(module => {
  window['@theme'].media = module;
});

import('./paginated-list-aspect-ratio.js').then(module => {
  window['@theme']['paginated-list-aspect-ratio'] = module;
});

import('./predictive-search.js').then(module => {
  window['@theme']['predictive-search'] = module;
});

import('./product-card-link.js').then(module => {
  window['@theme']['product-card-link'] = module;
});

import('./qr-code-generator.js').then(module => {
  window['@theme']['qr-code-generator'] = module;
});

import('./qr-code-image.js').then(module => {
  window['@theme']['qr-code-image'] = module;
});

import('./quick-add.js').then(module => {
  window['@theme']['quick-add'] = module;
});

import('./recently-viewed-products.js').then(module => {
  window['@theme']['recently-viewed-products'] = module;
});

import('./results-list.js').then(module => {
  window['@theme']['results-list'] = module;
});

import('./rte-formatter.js').then(module => {
  window['@theme']['rte-formatter'] = module;
});

import('./search-page-input.js').then(module => {
  window['@theme']['search-page-input'] = module;
});

import('./show-more.js').then(module => {
  window['@theme']['show-more'] = module;
});

import('./theme-editor.js').then(module => {
  window['@theme']['theme-editor'] = module;
});

import('./video-background.js').then(module => {
  window['@theme']['video-background'] = module;
});

import('./view-transitions.js').then(module => {
  window['@theme']['view-transitions'] = module;
});

import('./zoom-dialog.js').then(module => {
  window['@theme']['zoom-dialog'] = module;
});

console.log('🔧 Theme compatibility layer loaded');
