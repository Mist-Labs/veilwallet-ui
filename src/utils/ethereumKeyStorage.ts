/**
 * Self-custodial Ethereum key storage using Browser Extension Storage API
 * Ethereum private keys are stored encrypted in extension storage
 * Phishing sites cannot access these keys - only the extension can
 */

import { isExtensionContext } from './extensionCheck';

interface StoredEthereumKey {
  id: string;
  encryptedPrivateKey: string;
  address: string;
  iv: string;
  salt: string;
  createdAt: string;
  accountAddress?: string; // Smart contract wallet address if created
  encryptedMnemonic?: string; // Encrypted mnemonic phrase
  mnemonicIv?: string; // IV for mnemonic encryption
}

// Extension storage API (works with both Chrome and Firefox)
type StorageAPI = {
  local: {
    get: (keys: string | string[] | { [key: string]: any } | null) => Promise<{ [key: string]: any }>;
    set: (items: { [key: string]: any }) => Promise<void>;
    remove: (keys: string | string[]) => Promise<void>;
    clear: () => Promise<void>;
  };
};

/**
 * Get the storage API (Chrome or Firefox)
 * Falls back to localStorage in dev mode
 */
function getStorageAPI(): StorageAPI | null {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage as StorageAPI;
  }
  if (typeof browser !== 'undefined' && browser.storage) {
    return browser.storage as StorageAPI;
  }
  
  // Dev mode: use localStorage fallback
  if (typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_DEV_MODE === 'true' || (window as any).__VEILWALLET_DEV_MODE__ === true)) {
    return createLocalStorageAPI();
  }
  
  return null;
}

/**
 * Create a localStorage-based storage API for dev mode
 */
function createLocalStorageAPI(): StorageAPI {
  return {
    local: {
      get: async (keys: string | string[] | { [key: string]: any } | null): Promise<{ [key: string]: any }> => {
        if (typeof window === 'undefined') return {};
        
        if (keys === null) {
          // Get all keys
          const result: { [key: string]: any } = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('veilwallet_') || key.startsWith('__veilwallet_'))) {
              try {
                result[key] = JSON.parse(localStorage.getItem(key) || 'null');
              } catch {
                result[key] = localStorage.getItem(key);
              }
            }
          }
          return result;
        }
        
        if (typeof keys === 'string') {
          const value = localStorage.getItem(keys);
          return { [keys]: value ? JSON.parse(value) : null };
        }
        
        if (Array.isArray(keys)) {
          const result: { [key: string]: any } = {};
          keys.forEach(key => {
            const value = localStorage.getItem(key);
            result[key] = value ? JSON.parse(value) : null;
          });
          return result;
        }
        
        // Object form
        const result: { [key: string]: any } = {};
        Object.keys(keys).forEach(key => {
          const value = localStorage.getItem(key);
          result[key] = value ? JSON.parse(value) : null;
        });
        return result;
      },
      set: async (items: { [key: string]: any }): Promise<void> => {
        if (typeof window === 'undefined') return;
        Object.entries(items).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
      },
      remove: async (keys: string | string[]): Promise<void> => {
        if (typeof window === 'undefined') return;
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach(key => localStorage.removeItem(key));
      },
      clear: async (): Promise<void> => {
        if (typeof window === 'undefined') return;
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('veilwallet_') || key.startsWith('__veilwallet_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      },
    },
  };
}

const STORAGE_PREFIX = 'veilwallet_eth_key_';
const KEYS_INDEX_KEY = 'veilwallet_eth_keys_index';

/**
 * Store encrypted Ethereum private key in extension storage
 * Only accessible by the extension, not by web pages
 */
export async function storeEthereumPrivateKey(
  keyId: string,
  encryptedPrivateKey: string,
  address: string,
  iv: string,
  salt: string,
  accountAddress?: string,
  encryptedMnemonic?: string,
  mnemonicIv?: string
): Promise<void> {
  const storage = getStorageAPI();
  if (!storage) {
    throw new Error('Storage API not available. Enable dev mode by setting NEXT_PUBLIC_DEV_MODE=true or window.__VEILWALLET_DEV_MODE__ = true');
  }

  const keyData: StoredEthereumKey = {
    id: keyId,
    encryptedPrivateKey,
    address,
    iv,
    salt,
    createdAt: new Date().toISOString(),
    accountAddress: accountAddress || address, // Use address as accountAddress if not provided
    encryptedMnemonic,
    mnemonicIv,
  };

  const storageKey = `${STORAGE_PREFIX}${keyId}`;
  
  // Store the key data
  await storage.local.set({
    [storageKey]: keyData,
  });

  // Update keys index
  const indexResult = await storage.local.get(KEYS_INDEX_KEY);
  const index: string[] = indexResult[KEYS_INDEX_KEY] || [];
  if (!index.includes(keyId)) {
    index.push(keyId);
    await storage.local.set({ [KEYS_INDEX_KEY]: index });
  }

  // If account address provided, create reverse lookup
  if (accountAddress) {
    const accountKey = `veilwallet_eth_account_${accountAddress}`;
    await storage.local.set({ [accountKey]: keyId });
  }
}

/**
 * Get encrypted Ethereum private key from extension storage
 */
export async function getEthereumPrivateKey(keyId: string): Promise<StoredEthereumKey | null> {
  const storage = getStorageAPI();
  if (!storage) {
    throw new Error('Storage API not available. Enable dev mode by setting NEXT_PUBLIC_DEV_MODE=true or window.__VEILWALLET_DEV_MODE__ = true');
  }

  const storageKey = `${STORAGE_PREFIX}${keyId}`;
  const result = await storage.local.get(storageKey);
  return result[storageKey] || null;
}

/**
 * Get Ethereum key by account address
 * Supports lookup by both EOA address and smart account address
 */
export async function getEthereumKeyByAccount(accountAddress: string): Promise<StoredEthereumKey | null> {
  const storage = getStorageAPI();
  if (!storage) {
    throw new Error('Storage API not available. Enable dev mode by setting NEXT_PUBLIC_DEV_MODE=true or window.__VEILWALLET_DEV_MODE__ = true');
  }

  // First, try direct lookup
  const accountKey = `veilwallet_eth_account_${accountAddress}`;
  const accountResult = await storage.local.get(accountKey);
  const keyId = accountResult[accountKey];

  if (keyId) {
    return getEthereumPrivateKey(keyId);
  }

  // If not found, search through all keys to find a match
  // This handles cases where the key was stored with EOA but we're looking up by smart account
  const allKeys = await listEthereumKeys();
  for (const key of allKeys) {
    if (key.address.toLowerCase() === accountAddress.toLowerCase() || 
        key.accountAddress?.toLowerCase() === accountAddress.toLowerCase()) {
      const keyData = await getEthereumPrivateKey(key.id);
      if (keyData) {
        // Create reverse lookup for future queries
        const reverseKey = `veilwallet_eth_account_${accountAddress}`;
        await storage.local.set({ [reverseKey]: key.id });
        return keyData;
      }
    }
  }

  return null;
}

/**
 * Create a reverse lookup for an account address to a key ID
 * Useful when adding smart account address lookup after protection is enabled
 */
export async function createAccountLookup(accountAddress: string, keyId: string): Promise<void> {
  const storage = getStorageAPI();
  if (!storage) {
    throw new Error('Storage API not available. Enable dev mode by setting NEXT_PUBLIC_DEV_MODE=true or window.__VEILWALLET_DEV_MODE__ = true');
  }

  const accountKey = `veilwallet_eth_account_${accountAddress}`;
  await storage.local.set({ [accountKey]: keyId });
}

/**
 * Delete Ethereum key from extension storage
 */
export async function deleteEthereumKey(keyId: string): Promise<void> {
  const storage = getStorageAPI();
  if (!storage) {
    throw new Error('Storage API not available. Enable dev mode by setting NEXT_PUBLIC_DEV_MODE=true or window.__VEILWALLET_DEV_MODE__ = true');
  }

  const storageKey = `${STORAGE_PREFIX}${keyId}`;
  
  // Get the key to find account address
  const keyData = await getEthereumPrivateKey(keyId);
  
  // Remove from storage
  await storage.local.remove(storageKey);

  // Update keys index
  const indexResult = await storage.local.get(KEYS_INDEX_KEY);
  const index: string[] = indexResult[KEYS_INDEX_KEY] || [];
  const newIndex = index.filter(id => id !== keyId);
  await storage.local.set({ [KEYS_INDEX_KEY]: newIndex });

  // Remove account mapping if exists
  if (keyData?.accountAddress) {
    const accountKey = `veilwallet_eth_account_${keyData.accountAddress}`;
    await storage.local.remove(accountKey);
  }
}

/**
 * List all stored Ethereum keys (public info only)
 */
export async function listEthereumKeys(): Promise<Array<{ id: string; address: string; accountAddress?: string }>> {
  const storage = getStorageAPI();
  if (!storage) {
    throw new Error('Storage API not available. Enable dev mode by setting NEXT_PUBLIC_DEV_MODE=true or window.__VEILWALLET_DEV_MODE__ = true');
  }

  const indexResult = await storage.local.get(KEYS_INDEX_KEY);
  const index: string[] = indexResult[KEYS_INDEX_KEY] || [];

  const keys: Array<{ id: string; address: string; accountAddress?: string }> = [];

  for (const keyId of index) {
    const keyData = await getEthereumPrivateKey(keyId);
    if (keyData) {
      keys.push({
        id: keyData.id,
        address: keyData.address,
        accountAddress: keyData.accountAddress,
      });
    }
  }

  return keys;
}

