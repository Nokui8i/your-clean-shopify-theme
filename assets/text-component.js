import { Component } from '@theme/component';

/**
 * A custom element that displays text content with various styling options.
 * @extends {Component}
 */
export class TextComponent extends Component {
  /**
   * Applies a shimmer effect to the text component.
   */
  shimmer() {
    this.setAttribute('shimmer', '');
  }
}

if (!customElements.get('text-component')) {
  customElements.define('text-component', TextComponent);
}
