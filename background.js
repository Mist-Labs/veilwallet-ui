// Background service worker for VeilWallet extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('VeilWallet extension installed');
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStorage') {
    chrome.storage.local.get(request.keys, (result) => {
      sendResponse({ success: true, data: result });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'setStorage') {
    chrome.storage.local.set(request.data, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

