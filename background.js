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

  if (request.action === 'removeStorage') {
    chrome.storage.local.remove(request.key, () => {
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
    // Get wallet state
    const storage = await new Promise((resolve) => {
      chrome.storage.local.get([
        'veilwallet_address', 
        'veilwallet_eoa', 
        'veilwallet_selected_account',
        'veilwallet_unlocked'
      ], resolve);
    });

    const unlocked = storage.veilwallet_unlocked === 'true';
    const smartAccount = storage.veilwallet_address;
    const eoa = storage.veilwallet_eoa;
    const selected = storage.veilwallet_selected_account || 'smart';
    const accountAddress = (selected === 'smart' && smartAccount) 
      ? smartAccount 
      : (eoa || smartAccount);

    // Methods that require user interaction (signing/transactions)
    const requiresApproval = ['eth_sendTransaction', 'eth_sign', 'personal_sign', 
      'eth_signTypedData', 'eth_signTypedData_v3', 'eth_signTypedData_v4'].includes(method);
    
    if (requiresApproval) {
      if (!unlocked) {
        chrome.action.openPopup();
        sendResponse({ error: 'Wallet is locked' });
        return;
      }

      // Store pending request and open approval page
      const requestId = `${method}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await chrome.storage.local.set({
        [`pending_request_${requestId}`]: {
          method,
          params,
          origin: sender.origin || sender.url,
          timestamp: Date.now(),
          accountAddress,
        }
      });

      // Open approval page
      chrome.action.openPopup();
      sendResponse({ requestId, requiresApproval: true });
      return;
    }

    // Methods that need account info
    if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
      if (!unlocked) {
        chrome.action.openPopup();
        sendResponse({ error: 'Wallet is locked' });
        return;
      }

      const accounts = [];
      if (selected === 'smart' && smartAccount) {
        accounts.push(smartAccount);
        if (eoa && eoa.toLowerCase() !== smartAccount.toLowerCase()) {
          accounts.push(eoa);
        }
      } else if (selected === 'eoa' && eoa) {
        accounts.push(eoa);
        if (smartAccount && smartAccount.toLowerCase() !== eoa.toLowerCase()) {
          accounts.push(smartAccount);
        }
      } else {
        if (smartAccount) accounts.push(smartAccount);
        if (eoa && (!smartAccount || eoa.toLowerCase() !== smartAccount.toLowerCase())) {
          accounts.push(eoa);
        }
      }
      
      sendResponse({ accounts });
      return;
    }

    // Chain ID
    if (method === 'eth_chainId') {
      sendResponse({ result: '0x138b' }); // 5003 in hex
      return;
    }

    if (method === 'net_version') {
      sendResponse({ result: '5003' });
      return;
    }

    // For all other read-only methods, forward to RPC provider
    const rpcUrl = 'https://rpc.sepolia.mantle.xyz';
    
    const rpcResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params: params || [],
      }),
    });

    const rpcData = await rpcResponse.json();
    
    if (rpcData.error) {
      sendResponse({ error: rpcData.error.message || 'RPC error' });
    } else {
      sendResponse({ result: rpcData.result });
    }
  } catch (error) {
    console.error('Error handling RPC request:', error);
    sendResponse({ error: error.message || 'Internal error' });
  }
}

// Listen for approval responses from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VEILWALLET_RPC_RESPONSE') {
    // Store response for the request
    chrome.storage.local.set({
      [`rpc_response_${message.requestId}`]: message.result || message.error
    });
    sendResponse({ success: true });
  }
  return true;
});

