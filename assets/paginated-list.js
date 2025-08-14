import { Component } from '@theme/component';

/**
 * Base class for paginated list components.
 * @extends {Component}
 */
export default class PaginatedList extends Component {
  constructor() {
    super();
    this.currentPage = 1;
    this.itemsPerPage = 10;
  }

  /**
   * Gets the current page number.
   * @returns {number} The current page number.
   */
  getCurrentPage() {
    return this.currentPage;
  }

  /**
   * Sets the current page number.
   * @param {number} page - The page number to set.
   */
  setCurrentPage(page) {
    this.currentPage = page;
  }

  /**
   * Gets the number of items per page.
   * @returns {number} The number of items per page.
   */
  getItemsPerPage() {
    return this.itemsPerPage;
  }

  /**
   * Sets the number of items per page.
   * @param {number} items - The number of items per page.
   */
  setItemsPerPage(items) {
    this.itemsPerPage = items;
  }

  /**
   * Calculates the total number of pages.
   * @param {number} totalItems - The total number of items.
   * @returns {number} The total number of pages.
   */
  getTotalPages(totalItems) {
    return Math.ceil(totalItems / this.itemsPerPage);
  }

  /**
   * Gets the items for the current page.
   * @param {Array} items - The array of all items.
   * @returns {Array} The items for the current page.
   */
  getPageItems(items) {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return items.slice(startIndex, endIndex);
  }
}
