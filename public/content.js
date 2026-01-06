// VeilWallet Web3 Provider Injection
// This script injects the VeilWallet provider into web pages

(function() {
  'use strict';

  // VeilWallet Provider
  class VeilWalletProvider {
    constructor() {
      this.isVeilWallet = true;
      this.isMetaMask = false; // Set to true if you want dApps to treat it like MetaMask
      this.chainId = '0x138b'; // 5003 in hex (Mantle Sepolia)
      this.networkVersion = '5003';
      this.selectedAddress = null;
      this._events = {};
      this._nextRequestId = 1;
    }

    // Event emitter methods
    on(event, callback) {
      if (!this._events[event]) {
        this._events[event] = [];
      }
      this._events[event].push(callback);
    }

    removeListener(event, callback) {
      if (!this._events[event]) return;
      this._events[event] = this._events[event].filter(cb => cb !== callback);
    }

    emit(event, ...args) {
      if (!this._events[event]) return;
      this._events[event].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }

    // Main request method
    async request({ method, params }) {
      console.log('[VeilWallet] Request:', method, params);

      switch (method) {
        case 'eth_requestAccounts':
        case 'eth_accounts':
          return this._requestAccounts();

        case 'eth_chainId':
          return this.chainId;

        case 'net_version':
          return this.networkVersion;

        case 'eth_sendTransaction':
          return this._sendTransaction(params[0]);

        case 'eth_sign':
          return this._sign(params);

        case 'personal_sign':
          return this._personalSign(params);

        case 'eth_signTypedData':
        case 'eth_signTypedData_v3':
        case 'eth_signTypedData_v4':
          return this._signTypedData(params);

        case 'wallet_switchEthereumChain':
          return this._switchChain(params[0]);

        case 'wallet_addEthereumChain':
          return this._addChain(params[0]);

        default:
          // Forward to RPC
          return this._forwardToRPC(method, params);
      }
    }

    // Legacy send method (for older dApps)
    send(methodOrPayload, paramsOrCallback) {
      if (typeof methodOrPayload === 'string') {
        return this.request({ method: methodOrPayload, params: paramsOrCallback });
      }
      // Legacy callback style
      this.request(methodOrPayload)
        .then(result => paramsOrCallback(null, { result }))
        .catch(error => paramsOrCallback(error));
    }

    // Legacy sendAsync method
    sendAsync(payload, callback) {
      this.request(payload)
        .then(result => callback(null, { jsonrpc: '2.0', id: payload.id, result }))
        .catch(error => callback(error));
    }

    // Internal methods
    async _requestAccounts() {
      try {
        // Send message to background script to get accounts
        const response = await this._sendToExtension('eth_requestAccounts');
        
        if (response.accounts && response.accounts.length > 0) {
          this.selectedAddress = response.accounts[0];
          this.emit('accountsChanged', response.accounts);
          return response.accounts;
        }
        
        throw new Error('User rejected the request');
      } catch (error) {
        console.error('[VeilWallet] Error requesting accounts:', error);
        throw error;
      }
    }

    async _sendTransaction(tx) {
      const response = await this._sendToExtension('eth_sendTransaction', [tx]);
      return response.hash;
    }

    async _sign(params) {
      const response = await this._sendToExtension('eth_sign', params);
      return response.signature;
    }

    async _personalSign(params) {
      const response = await this._sendToExtension('personal_sign', params);
      return response.signature;
    }

    async _signTypedData(params) {
      const response = await this._sendToExtension('eth_signTypedData_v4', params);
      return response.signature;
    }

    async _switchChain(params) {
      // For now, only support Mantle Sepolia
      if (params.chainId !== this.chainId) {
        throw new Error('Unsupported chain');
      }
      return null;
    }

    async _addChain(params) {
      // For now, reject adding new chains
      throw new Error('Adding chains is not supported yet');
    }

    async _forwardToRPC(method, params) {
      const response = await fetch('https://rpc.sepolia.mantle.xyz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: this._nextRequestId++,
          method,
          params: params || [],
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return data.result;
    }

    async _sendToExtension(method, params) {
      return new Promise((resolve, reject) => {
        const messageId = `veilwallet_${Date.now()}_${Math.random()}`;
        
        // Listen for response
        const responseHandler = (event) => {
          if (event.source !== window) return;
          if (event.data.type !== 'VEILWALLET_RESPONSE') return;
          if (event.data.id !== messageId) return;
          
          window.removeEventListener('message', responseHandler);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.data);
          }
        };
        
        window.addEventListener('message', responseHandler);
        
        // Send request to content script → background
        window.postMessage({
          type: 'VEILWALLET_REQUEST',
          id: messageId,
          method,
          params,
        }, '*');
        
        // Timeout after 60 seconds
        setTimeout(() => {
          window.removeEventListener('message', responseHandler);
          reject(new Error('Request timeout'));
        }, 60000);
      });
    }
  }

  // Inject provider
  const provider = new VeilWalletProvider();
  
  // Make it available globally
  window.ethereum = provider;
  window.veilwallet = provider;

  // Announce to the page
  window.dispatchEvent(new Event('ethereum#initialized'));
  
  console.log('[VeilWallet] Provider injected successfully');
})();

