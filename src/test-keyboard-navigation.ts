// Simple test to verify keyboard navigation works
// This file can be removed after verification

export function testKeyboardNavigation() {
  console.log("Testing keyboard navigation...");

  // Check if focus cycling functions exist
  const elements = Array.from(document.querySelectorAll("[tabindex]")).filter(
    (el) => (el as HTMLElement).tabIndex >= 0,
  ) as HTMLElement[];

  console.log("Found focusable elements:", elements.length);
  elements.forEach((el, index) => {
    console.log(`Element ${index}: tag=${el.tagName}, tabIndex=${el.tabIndex}`);
  });

  // Test cycling through elements
  if (elements.length > 0) {
    console.log("Testing focus cycling...");
    elements[0].focus();
    console.log("Focused first element");

    // Simulate ArrowDown key press
    const downEvent = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
    });
    document.dispatchEvent(downEvent);

    setTimeout(() => {
      console.log(
        "Active element after ArrowDown:",
        document.activeElement?.tagName,
        (document.activeElement as HTMLElement)?.tabIndex,
      );
    }, 100);
  }
}

// Make available globally for testing
(window as any).testKeyboardNavigation = testKeyboardNavigation;
