/**
 * Morphs one element into another, preserving focus and scroll position
 * @param {HTMLElement} fromElement - The element to morph from
 * @param {HTMLElement} toElement - The element to morph to
 */
export function morph(fromElement, toElement) {
  // Preserve focus
  const activeElement = document.activeElement;
  let focusTarget = null;
  
  if (activeElement && fromElement.contains(activeElement)) {
    // Find the element with the same ID in the new content
    const newActiveElement = toElement.querySelector(`#${activeElement.id}`);
    if (newActiveElement) {
      focusTarget = newActiveElement;
    }
  }
  
  // Preserve scroll position
  const scrollTop = fromElement.scrollTop;
  const scrollLeft = fromElement.scrollLeft;
  
  // Replace the content
  fromElement.innerHTML = toElement.innerHTML;
  
  // Copy attributes
  for (const attr of toElement.attributes) {
    fromElement.setAttribute(attr.name, attr.value);
  }
  
  // Restore scroll position
  fromElement.scrollTop = scrollTop;
  fromElement.scrollLeft = scrollLeft;
  
  // Restore focus
  if (focusTarget) {
    focusTarget.focus();
  }
}
