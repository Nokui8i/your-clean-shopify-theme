/**
 * Castle Theme Features JavaScript
 * Implements all the advanced features from the King theme Castle preset
 */

class CastleThemeFeatures {
  constructor() {
    this.init();
  }

  init() {
    this.initMegaMenu();
    this.initQuickView();
    this.initNewsletterPopup();
    this.initProductBadges();
    this.initEnhancedProductCards();
    this.initStickyHeader();
    this.initAgeVerification();
    this.initCountdownTimers();
  }

  // Mega Menu Functionality
  initMegaMenu() {
    const megaMenuItems = document.querySelectorAll('[data-mega-menu-item]');
    
    megaMenuItems.forEach(item => {
      const link = item.querySelector('[data-mega-menu-item]');
      const submenu = item.querySelector('.mega-menu__submenu');
      
      if (link && submenu) {
        // Desktop hover
        item.addEventListener('mouseenter', () => {
          this.showSubmenu(submenu);
        });
        
        item.addEventListener('mouseleave', () => {
          this.hideSubmenu(submenu);
        });
        
        // Mobile touch
        link.addEventListener('click', (e) => {
          if (window.innerWidth <= 768) {
            e.preventDefault();
            this.toggleSubmenu(submenu);
          }
        });
      }
    });
  }

  showSubmenu(submenu) {
    submenu.style.display = 'block';
    submenu.style.opacity = '1';
    submenu.style.transform = 'translateY(0)';
  }

  hideSubmenu(submenu) {
    submenu.style.opacity = '0';
    submenu.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      submenu.style.display = 'none';
    }, 200);
  }

  toggleSubmenu(submenu) {
    const isVisible = submenu.style.display === 'block';
    if (isVisible) {
      this.hideSubmenu(submenu);
    } else {
      this.showSubmenu(submenu);
    }
  }

  // Quick View Functionality
  initQuickView() {
    const quickViewButtons = document.querySelectorAll('[data-quick-view]');
    const quickViewModal = document.querySelector('[data-quick-view-modal]');
    const closeButtons = document.querySelectorAll('[data-quick-view-close]');
    
    if (!quickViewModal) return;
    
    quickViewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = button.dataset.productId;
        this.openQuickView(productId);
      });
    });
    
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.closeQuickView();
      });
    });
    
    // Close on overlay click
    quickViewModal.addEventListener('click', (e) => {
      if (e.target === quickViewModal) {
        this.closeQuickView();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeQuickView();
      }
    });
  }

  async openQuickView(productId) {
    const modal = document.querySelector('[data-quick-view-modal]');
    if (!modal) return;
    
    try {
      // Show loading state
      modal.classList.add('loading');
      
      // Fetch product data
      const response = await fetch(`/products/${productId}.js`);
      const product = await response.json();
      
      // Populate modal
      this.populateQuickView(product);
      
      // Show modal
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      modal.classList.remove('loading');
    }
  }

  populateQuickView(product) {
    // Populate title
    const title = document.querySelector('[data-quick-view-title]');
    if (title) title.textContent = product.title;
    
    // Populate price
    const price = document.querySelector('[data-quick-view-price]');
    if (price) price.innerHTML = this.formatMoney(product.price);
    
    // Populate description
    const description = document.querySelector('[data-quick-view-description]');
    if (description) description.innerHTML = product.description;
    
    // Populate main image
    const mainImage = document.querySelector('[data-quick-view-main-image]');
    if (mainImage && product.images.length > 0) {
      mainImage.src = product.images[0];
      mainImage.alt = product.title;
    }
    
    // Populate variants
    this.populateQuickViewVariants(product);
    
    // Set up add to cart
    this.setupQuickViewAddToCart(product);
  }

  populateQuickViewVariants(product) {
    const variantsContainer = document.querySelector('[data-quick-view-variants]');
    if (!variantsContainer || !product.variants) return;
    
    variantsContainer.innerHTML = '';
    
    product.variants.forEach(variant => {
      const variantElement = document.createElement('div');
      variantElement.className = 'variant-option';
      variantElement.innerHTML = `
        <input type="radio" name="variant" value="${variant.id}" id="variant-${variant.id}">
        <label for="variant-${variant.id}">${variant.title}</label>
      `;
      variantsContainer.appendChild(variantElement);
    });
  }

  setupQuickViewAddToCart(product) {
    const addToCartButton = document.querySelector('[data-quick-view-add-to-cart]');
    if (!addToCartButton) return;
    
    addToCartButton.addEventListener('click', async () => {
      const variantId = document.querySelector('input[name="variant"]:checked')?.value || product.variants[0].id;
      const quantity = document.querySelector('[data-quick-view-quantity]')?.value || 1;
      
      try {
        addToCartButton.textContent = 'Adding...';
        addToCartButton.disabled = true;
        
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [{
              id: variantId,
              quantity: parseInt(quantity)
            }]
          })
        });
        
        if (response.ok) {
          // Trigger cart update event
          document.dispatchEvent(new CustomEvent('cart:updated'));
          this.closeQuickView();
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
      } finally {
        addToCartButton.textContent = 'Add to Cart';
        addToCartButton.disabled = false;
      }
    });
  }

  closeQuickView() {
    const modal = document.querySelector('[data-quick-view-modal]');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Newsletter Popup Functionality
  initNewsletterPopup() {
    const popup = document.querySelector('[data-newsletter-popup]');
    if (!popup) return;
    
    const closeButtons = document.querySelectorAll('[data-newsletter-popup-close]');
    const delay = parseInt(popup.dataset.delay) || 10000; // Default 10 seconds
    
    // Show popup after delay
    setTimeout(() => {
      if (!this.hasShownNewsletterPopup()) {
        this.showNewsletterPopup();
      }
    }, delay);
    
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.hideNewsletterPopup();
      });
    });
    
    // Close on overlay click
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        this.hideNewsletterPopup();
      }
    });
  }

  showNewsletterPopup() {
    const popup = document.querySelector('[data-newsletter-popup]');
    if (popup) {
      popup.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.setNewsletterPopupShown();
    }
  }

  hideNewsletterPopup() {
    const popup = document.querySelector('[data-newsletter-popup]');
    if (popup) {
      popup.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  hasShownNewsletterPopup() {
    return localStorage.getItem('newsletter-popup-shown') === 'true';
  }

  setNewsletterPopupShown() {
    localStorage.setItem('newsletter-popup-shown', 'true');
  }

  // Product Badges
  initProductBadges() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
      const productId = card.dataset.productId;
      if (productId) {
        this.addProductBadges(card, productId);
      }
    });
  }

  addProductBadges(card, productId) {
    // This would typically fetch product data to determine badges
    // For now, we'll add example badges
    const badgeContainer = document.createElement('div');
    badgeContainer.className = 'product-badges';
    
    // Example badges (in real implementation, these would be dynamic)
    const badges = [
      { type: 'new', text: 'NEW' },
      { type: 'sale', text: 'SALE' }
    ];
    
    badges.forEach(badge => {
      const badgeElement = document.createElement('span');
      badgeElement.className = `product-badge product-badge--${badge.type}`;
      badgeElement.textContent = badge.text;
      badgeContainer.appendChild(badgeElement);
    });
    
    card.appendChild(badgeContainer);
  }

  // Enhanced Product Cards
  initEnhancedProductCards() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
      // Add hover effects
      card.addEventListener('mouseenter', () => {
        card.classList.add('hovered');
      });
      
      card.addEventListener('mouseleave', () => {
        card.classList.remove('hovered');
      });
      
      // Add quick view button if not already present
      if (!card.querySelector('[data-quick-view]')) {
        this.addQuickViewButton(card);
      }
    });
  }

  addQuickViewButton(card) {
    const productId = card.dataset.productId;
    if (!productId) return;
    
    const quickViewButton = document.createElement('button');
    quickViewButton.className = 'product-card__quick-view';
    quickViewButton.setAttribute('data-quick-view', '');
    quickViewButton.setAttribute('data-product-id', productId);
    quickViewButton.innerHTML = 'Quick View';
    
    card.appendChild(quickViewButton);
  }

  // Sticky Header
  initStickyHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    let lastScrollTop = 0;
    const scrollThreshold = 100;
    
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > scrollThreshold) {
        header.classList.add('sticky');
        
        // Hide/show on scroll direction
        if (scrollTop > lastScrollTop) {
          header.classList.add('scrolling-down');
          header.classList.remove('scrolling-up');
        } else {
          header.classList.add('scrolling-up');
          header.classList.remove('scrolling-down');
        }
      } else {
        header.classList.remove('sticky', 'scrolling-down', 'scrolling-up');
      }
      
      lastScrollTop = scrollTop;
    });
  }

  // Age Verification
  initAgeVerification() {
    const ageVerification = document.querySelector('[data-age-verification]');
    if (!ageVerification) return;
    
    if (!this.hasVerifiedAge()) {
      this.showAgeVerification();
    }
  }

  showAgeVerification() {
    const modal = document.createElement('div');
    modal.className = 'age-verification-modal';
    modal.innerHTML = `
      <div class="age-verification-content">
        <h2>Age Verification Required</h2>
        <p>You must be 18 or older to view this content.</p>
        <div class="age-verification-buttons">
          <button class="button--primary" data-age-verify="true">I am 18 or older</button>
          <button class="button--secondary" data-age-verify="false">I am under 18</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle age verification
    modal.addEventListener('click', (e) => {
      if (e.target.dataset.ageVerify === 'true') {
        this.setAgeVerified();
        modal.remove();
      } else if (e.target.dataset.ageVerify === 'false') {
        window.location.href = '/';
      }
    });
  }

  hasVerifiedAge() {
    return sessionStorage.getItem('age-verified') === 'true';
  }

  setAgeVerified() {
    sessionStorage.setItem('age-verified', 'true');
  }

  // Countdown Timers
  initCountdownTimers() {
    const countdownElements = document.querySelectorAll('[data-countdown]');
    
    countdownElements.forEach(element => {
      const endDate = new Date(element.dataset.countdown).getTime();
      this.startCountdown(element, endDate);
    });
  }

  startCountdown(element, endDate) {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate - now;
      
      if (distance < 0) {
        clearInterval(timer);
        element.innerHTML = 'EXPIRED';
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      element.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
  }

  // Utility Functions
  formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CastleThemeFeatures();
});

// Export for use in other scripts
window.CastleThemeFeatures = CastleThemeFeatures;
