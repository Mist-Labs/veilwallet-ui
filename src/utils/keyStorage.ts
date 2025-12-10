/**
 * Non-custodial key storage using Browser Extension Storage API
 * Keys are stored in extension storage, isolated from web pages
 * Phishing sites cannot access these keys - only the extension can
 */

import { isExtensionContext } from './extensionCheck';

interface StoredKey {
  id: string;
  encryptedPrivateKey: string;
  publicKey: string;
  iv: string;
  salt: string;
  createdAt: string;
  accountAddress?: string;
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
 */
function getStorageAPI(): StorageAPI | null {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage as StorageAPI;
  }
  if (typeof browser !== 'undefined' && browser.storage) {
    return browser.storage as StorageAPI;
  }
  return null;
}

const STORAGE_PREFIX = 'veilwallet_key_';
const KEYS_INDEX_KEY = 'veilwallet_keys_index';

/**
 * Store encrypted private key in extension storage
 * Only accessible by the extension, not by web pages
 */
export async function storePrivateKey(
  keyId: string,
  encryptedPrivateKey: string,
  publicKey: string,
  iv: string,
  salt: string,
  accountAddress?: string
): Promise<void> {
  const storage = getStorageAPI();
  if (!storage) {
    throw new Error('Extension storage API not available. This must run in a browser extension context.');
  }

  const keyData: StoredKey = {
    id: keyId,
    encryptedPrivateKey,
    publicKey,
    iv,
    salt,
    createdAt: new Date().toISOString(),
    accountAddress,
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
    const accountKey = `veilwallet_account_${accountAddress}`;
    await storage.local.set({ [accountKey]: keyId });
  }
}

/**
 * Get encrypted private key from extension storage
 */
export async function getPrivateKey(keyId: string): Promise<StoredKey | null> {
  const storage = getStorageAPI();
  if (!storage) {
    throw new Error('Extension storage API not available. This must run in a browser extension context.');
  }

  const storageKey = `${STORAGE_PREFIX}${keyId}`;
  const result = await storage.local.get(storageKey);
  return result[storageKey] || null;
}

/**
 * Get key by account address
 */
export async function getKeyByAccount(accountAddress: string): Promise<StoredKey | null> {
  const storage = getStorageAPI();
  if (!storage) {
    throw new Error('Extension storage API not available. This must run in a browser extension context.');
  }

  const accountKey = `veilwallet_account_${accountAddress}`;
  const accountResult = await storage.local.get(accountKey);
  const keyId = accountResult[accountKey];

  if (!keyId) {
    return null;
  }

  return getPrivateKey(keyId);
}

/**
 * Delete key from extension storage
 */
export async function deleteKey(keyId: string): Promise<void> {
  const storage = getStorageAPI();
  if (!storage) {
    throw new Error('Extension storage API not available. This must run in a browser extension context.');
  }

  const storageKey = `${STORAGE_PREFIX}${keyId}`;
  
  // Get the key to find account address
  const keyData = await getPrivateKey(keyId);
  
  // Remove from storage
  await storage.local.remove(storageKey);

  // Update keys index
  const indexResult = await storage.local.get(KEYS_INDEX_KEY);
  const index: string[] = indexResult[KEYS_INDEX_KEY] || [];
  const newIndex = index.filter(id => id !== keyId);
  await storage.local.set({ [KEYS_INDEX_KEY]: newIndex });

  // Remove account mapping if exists
  if (keyData?.accountAddress) {
    const accountKey = `veilwallet_account_${keyData.accountAddress}`;
    await storage.local.remove(accountKey);
  }
}

/**
 * List all stored keys (public info only)
 */
export async function listKeys(): Promise<Array<{ id: string; publicKey: string; accountAddress?: string }>> {
  const storage = getStorageAPI();
  if (!storage) {
    throw new Error('Extension storage API not available. This must run in a browser extension context.');
  }

  const indexResult = await storage.local.get(KEYS_INDEX_KEY);
  const index: string[] = indexResult[KEYS_INDEX_KEY] || [];

  const keys: Array<{ id: string; publicKey: string; accountAddress?: string }> = [];

  for (const keyId of index) {
    const keyData = await getPrivateKey(keyId);
    if (keyData) {
      keys.push({
        id: keyData.id,
        publicKey: keyData.publicKey,
        accountAddress: keyData.accountAddress,
      });
    }
  }

  return keys;
}

/**
 * Clear all keys (use with caution)
 */
export async function clearAllKeys(): Promise<void> {
  const storage = getStorageAPI();
  if (!storage) {
    throw new Error('Extension storage API not available. This must run in a browser extension context.');
  }

  const indexResult = await storage.local.get(KEYS_INDEX_KEY);
  const index: string[] = indexResult[KEYS_INDEX_KEY] || [];

  const keysToRemove: string[] = [];
  for (const keyId of index) {
    keysToRemove.push(`${STORAGE_PREFIX}${keyId}`);
  }

  if (keysToRemove.length > 0) {
    await storage.local.remove(keysToRemove);
  }

  await storage.local.remove(KEYS_INDEX_KEY);
  
  // Clear all account mappings (this is a bit brute force, but safe)
  const allData = await storage.local.get(null);
  const accountKeys = Object.keys(allData).filter(key => key.startsWith('veilwallet_account_'));
  if (accountKeys.length > 0) {
    await storage.local.remove(accountKeys);
  }
}
