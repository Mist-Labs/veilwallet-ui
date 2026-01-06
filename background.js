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

  // Handle RPC requests from dApps
  if (request.type === 'VEILWALLET_RPC') {
    handleRPCRequest(request, sender, sendResponse);
    return true;
  }
});

// Handle RPC requests from web pages
async function handleRPCRequest(request, sender, sendResponse) {
  const { method, params } = request;

  try {
    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts': {
        // Check if wallet is unlocked
        const unlocked = sessionStorage.getItem('veilwallet_unlocked') === 'true';
        if (!unlocked) {
          // Open popup to unlock
          chrome.action.openPopup();
          sendResponse({ error: 'Wallet is locked' });
          return;
        }

        // Get wallet address
        const address = localStorage.getItem('veilwallet_address');
        if (address) {
          sendResponse({ accounts: [address] });
        } else {
          sendResponse({ accounts: [] });
        }
        break;
      }

      case 'eth_sendTransaction': {
        // Open popup for transaction approval
        chrome.action.openPopup();
        // Store pending transaction
        const txId = Date.now().toString();
        await chrome.storage.local.set({
          [`pending_tx_${txId}`]: {
            ...params[0],
            origin: sender.origin || sender.url,
            timestamp: Date.now(),
          }
        });
        sendResponse({ txId });
        break;
      }

      case 'personal_sign':
      case 'eth_sign':
      case 'eth_signTypedData_v4': {
        // Open popup for signature approval
        chrome.action.openPopup();
        const signId = Date.now().toString();
        await chrome.storage.local.set({
          [`pending_sign_${signId}`]: {
            method,
            params,
            origin: sender.origin || sender.url,
            timestamp: Date.now(),
          }
        });
        sendResponse({ signId });
        break;
      }

      default:
        sendResponse({ error: 'Method not supported' });
    }
  } catch (error) {
    console.error('Error handling RPC request:', error);
    sendResponse({ error: error.message });
  }
}

