/**
 * Extension context checking and utilities
 */

/**
 * Check if code is running in extension context
 */
export function isExtensionContext(): boolean {
  return (
    (typeof chrome !== 'undefined' && chrome.storage) ||
    (typeof browser !== 'undefined' && browser.storage)
  );
}

/**
 * Check if code is running in extension popup
 */
export function isExtensionPopup(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.protocol === 'chrome-extension:' ||
    window.location.protocol === 'moz-extension:'
  );
}

/**
 * Check if code is running in extension content script
 */
export function isContentScript(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window as any).chrome?.runtime?.id !== undefined ||
    (window as any).browser?.runtime?.id !== undefined
  );
}

/**
 * Get extension ID
 */
export function getExtensionId(): string | null {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime.id;
  }
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser.runtime.id;
  }
  return null;
}

/**
 * Show error if not in extension context
 */
export function requireExtensionContext(): void {
  if (!isExtensionContext()) {
    throw new Error(
      'This feature requires browser extension context. ' +
      'Keys can only be accessed from the extension, not from web pages. ' +
      'This protects against phishing attacks.'
    );
  }
}

