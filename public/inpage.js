// Inpage script - runs in page context
// This receives messages from content script and forwards to the extension

(function() {
  'use strict';

  // Listen for messages from the page
  window.addEventListener('message', async (event) => {
    // Only accept messages from same window
    if (event.source !== window) return;
    if (event.data.type !== 'VEILWALLET_REQUEST') return;

    const { id, method, params } = event.data;

    try {
      // Forward to extension background
      const response = await chrome.runtime.sendMessage({
        type: 'VEILWALLET_RPC',
        method,
        params,
      });

      // Send response back to page
      window.postMessage({
        type: 'VEILWALLET_RESPONSE',
        id,
        data: response,
      }, '*');
    } catch (error) {
      window.postMessage({
        type: 'VEILWALLET_RESPONSE',
        id,
        error: error.message,
      }, '*');
    }
  });

  console.log('[VeilWallet] Inpage script ready');
})();

