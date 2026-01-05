/**
 * Extension context checking and utilities
 */

/**
 * Development mode flag - allows testing without extension
 */
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true' || 
                 (typeof window !== 'undefined' && (window as any).__VEILWALLET_DEV_MODE__ === true);

/**
 * Check if code is running in extension context
 * Returns true in dev mode to allow testing without extension
 */
export function isExtensionContext(): boolean {
  // Allow bypassing in dev mode
  if (DEV_MODE) {
    return true;
  }
  
  return !!(
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
  if (typeof chrome !== 'undefined' && (chrome as any).runtime) {
    return (chrome as any).runtime.id;
  }
  if (typeof browser !== 'undefined' && (browser as any).runtime) {
    return (browser as any).runtime.id;
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

