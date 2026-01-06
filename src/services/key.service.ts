/**
 * Non-custodial key management service
 * All keys are generated and stored client-side only
 * Never sends private keys to server
 * Supports both Web Crypto keys (P-256) and Ethereum keys (secp256k1)
 */

import { NETWORK_CONFIG } from '@/config/constants';
import { 
  generateEthereumKeyPair, 
  generateWalletFromMnemonic,
  encryptEthereumPrivateKey, 
  decryptEthereumPrivateKey,
  getAddressFromPrivateKey 
} from '@/utils/ethereumKeyGeneration';
import { 
  storeEthereumPrivateKey, 
  getEthereumPrivateKey, 
  getEthereumKeyByAccount, 
  deleteEthereumKey, 
  listEthereumKeys 
} from '@/utils/ethereumKeyStorage';
import type { APIResponse, SessionKey } from '@/types';

class KeyService {
  /**
   * Generate a new wallet key pair (client-side only)
   * Keys are stored in extension storage, isolated from web pages
   */
  async generateWalletKey(password: string, accountAddress?: string): Promise<APIResponse<{ keyId: string; publicKey: string }>> {
    try {
      // Verify we're in extension context
      const { isExtensionContext } = await import('@/utils/extensionCheck');
      if (!isExtensionContext()) {
        return {
          success: false,
          error: 'Keys can only be generated in extension context. This protects against phishing attacks.',
        };
      }

      const keyPair = await generateKeyPair();
      const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
      
      // Encrypt private key with password
      const encrypted = await encryptPrivateKey(keyPair.privateKey, password);
      
      // Generate unique key ID
      const keyId = `key_${Date.now()}_${crypto.getRandomValues(new Uint8Array(4)).join('')}`;
      
      // Store encrypted key in extension storage (isolated from web pages)
      await storePrivateKey(
        keyId,
        encrypted.encrypted,
        encrypted.publicKey,
        encrypted.iv,
        encrypted.salt,
        accountAddress
      );
      
      return {
        success: true,
        data: {
          keyId,
          publicKey: encrypted.publicKey,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Key generation failed',
      };
    }
  }

  /**
   * Get private key (decrypted) - requires password
   * Only works in extension context - phishing sites cannot access keys
   */
  async getPrivateKey(keyId: string, password: string): Promise<APIResponse<CryptoKey>> {
    try {
      // Verify we're in extension context
      const { isExtensionContext } = await import('@/utils/extensionCheck');
      if (!isExtensionContext()) {
        return {
          success: false,
          error: 'Keys can only be accessed in extension context. This protects against phishing attacks.',
        };
      }

      const stored = await getPrivateKey(keyId);
      if (!stored) {
        return {
          success: false,
          error: 'Key not found',
        };
      }
      
      const privateKey = await decryptPrivateKey(
        stored.encryptedPrivateKey,
        stored.iv,
        stored.salt,
        password
      );
      
      return {
        success: true,
        data: privateKey,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to decrypt key',
      };
    }
  }

  /**
   * Get key by account address
   * Only works in extension context - phishing sites cannot access keys
   */
  async getKeyByAccount(accountAddress: string, password: string): Promise<APIResponse<CryptoKey>> {
    try {
      // Verify we're in extension context
      const { isExtensionContext } = await import('@/utils/extensionCheck');
      if (!isExtensionContext()) {
        return {
          success: false,
          error: 'Keys can only be accessed in extension context. This protects against phishing attacks.',
        };
      }

      const stored = await getKeyByAccount(accountAddress);
      if (!stored) {
        return {
          success: false,
          error: 'Key not found for account',
        };
      }
      
      const privateKey = await decryptPrivateKey(
        stored.encryptedPrivateKey,
        stored.iv,
        stored.salt,
        password
      );
      
      return {
        success: true,
        data: privateKey,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to decrypt key',
      };
    }
  }

  /**
   * Generate session key (client-side)
   * Session keys are derived from the main private key
   */
  async generateSessionKey(
    privateKey: CryptoKey,
    spendingLimit?: string,
    validUntil?: Date
  ): Promise<APIResponse<SessionKey>> {
    try {
      // Derive session key from main private key
      // In production, use proper key derivation (HKDF)
      const sessionKeyPair = await generateKeyPair();
      const publicKeyJwk = await exportPublicKey(sessionKeyPair.publicKey);
      
      // For MVP, we'll store the session key pair
      // In production, derive deterministically from main key
      const sessionKey: SessionKey = {
        address: '', // Will be derived from public key
        validUntil: (validUntil || new Date(Date.now() + SECURITY_CONFIG.SESSION_KEY_EXPIRY_HOURS * 60 * 60 * 1000)).toISOString(),
        spendingLimit: spendingLimit || '0',
        isActive: true,
      };
      
      return {
        success: true,
        data: sessionKey,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session key generation failed',
      };
    }
  }

  /**
   * Sign transaction data (client-side only)
   */
  async signTransaction(
    transactionData: ArrayBuffer | string,
    privateKey: CryptoKey
  ): Promise<APIResponse<{ signature: string }>> {
    try {
      let dataBuffer: ArrayBuffer;
      if (typeof transactionData === 'string') {
        const encoded = new TextEncoder().encode(transactionData);
        dataBuffer = encoded.buffer as ArrayBuffer;
      } else if (transactionData instanceof ArrayBuffer) {
        dataBuffer = transactionData;
      } else {
        // It's a Uint8Array or similar - create a new ArrayBuffer
        const uint8Array = transactionData as Uint8Array;
        const newBuffer = new ArrayBuffer(uint8Array.byteLength);
        new Uint8Array(newBuffer).set(uint8Array);
        dataBuffer = newBuffer;
      }
      
      const signature = await signData(dataBuffer, privateKey);
      const signatureBase64 = arrayBufferToBase64(signature);
      
      return {
        success: true,
        data: {
          signature: signatureBase64,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction signing failed',
      };
    }
  }

  /**
   * List all stored keys (public info only)
   * Only works in extension context
   */
  async listKeys(): Promise<APIResponse<Array<{ id: string; publicKey: string; accountAddress?: string }>>> {
    try {
      // Verify we're in extension context
      const { isExtensionContext } = await import('@/utils/extensionCheck');
      if (!isExtensionContext()) {
        return {
          success: false,
          error: 'Keys can only be accessed in extension context. This protects against phishing attacks.',
        };
      }

      const keys = await listKeys();
      return {
        success: true,
        data: keys,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list keys',
      };
    }
  }

  /**
   * Delete key
   * Only works in extension context
   */
  async deleteKey(keyId: string): Promise<APIResponse<void>> {
    try {
      // Verify we're in extension context
      const { isExtensionContext } = await import('@/utils/extensionCheck');
      if (!isExtensionContext()) {
        return {
          success: false,
          error: 'Keys can only be accessed in extension context. This protects against phishing attacks.',
        };
      }

      await deleteKey(keyId);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete key',
      };
    }
  }

  /**
   * Generate a new Ethereum key pair (self-custodial)
   * Keys are stored encrypted in extension storage, isolated from web pages
   */
  async generateEthereumKey(password: string, accountAddress?: string): Promise<APIResponse<{ keyId: string; address: string; mnemonic: string }>> {
    try {
      // Verify we're in extension context
      const { isExtensionContext } = await import('@/utils/extensionCheck');
      if (!isExtensionContext()) {
        return {
          success: false,
          error: 'Keys can only be generated in extension context. This protects against phishing attacks.',
        };
      }

      const { privateKey, address, mnemonic } = generateEthereumKeyPair();
      
      // Encrypt private key and mnemonic with password
      const encrypted = await encryptEthereumPrivateKey(privateKey, password, mnemonic);
      
      // Generate unique key ID
      const keyId = `eth_key_${Date.now()}_${crypto.getRandomValues(new Uint8Array(4)).join('')}`;
      
      // Use address as accountAddress if not provided (for lookup)
      const finalAccountAddress = accountAddress || address;
      
      // Store encrypted key in extension storage (isolated from web pages)
      await storeEthereumPrivateKey(
        keyId,
        encrypted.encrypted,
        encrypted.address,
        encrypted.iv,
        encrypted.salt,
        finalAccountAddress,
        encrypted.encryptedMnemonic,
        encrypted.mnemonicIv
      );
      
      return {
        success: true,
        data: {
          keyId,
          address: encrypted.address,
          mnemonic, // Return mnemonic so user can save it
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ethereum key generation failed',
      };
    }
  }

  /**
   * Get Ethereum private key (decrypted) - requires password
   * Only works in extension context - phishing sites cannot access keys
   */
  async getEthereumPrivateKey(keyId: string, password: string): Promise<APIResponse<string>> {
    try {
      // Verify we're in extension context
      const { isExtensionContext } = await import('@/utils/extensionCheck');
      if (!isExtensionContext()) {
        return {
          success: false,
          error: 'Keys can only be accessed in extension context. This protects against phishing attacks.',
        };
      }

      const stored = await getEthereumPrivateKey(keyId);
      if (!stored) {
        return {
          success: false,
          error: 'Ethereum key not found',
        };
      }
      
      const privateKey = await decryptEthereumPrivateKey(
        stored.encryptedPrivateKey,
        stored.iv,
        stored.salt,
        password
      );
      
      return {
        success: true,
        data: privateKey,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to decrypt Ethereum key',
      };
    }
  }

  /**
   * Get Ethereum key by account address
   * Only works in extension context - phishing sites cannot access keys
   */
  async getEthereumKeyByAccount(accountAddress: string, password: string): Promise<APIResponse<{ address: string; privateKey: string }>> {
    console.log('🔐 [KeyService] getEthereumKeyByAccount called with:', accountAddress);
    try {
      // Verify we're in extension context
      const { isExtensionContext } = await import('@/utils/extensionCheck');
      if (!isExtensionContext()) {
        console.error('❌ [KeyService] Not in extension context');
        return {
          success: false,
          error: 'Keys can only be accessed in extension context. This protects against phishing attacks.',
        };
      }

      console.log('🔍 [KeyService] Looking up stored key...');
      const stored = await getEthereumKeyByAccount(accountAddress);
      if (!stored) {
        console.error('❌ [KeyService] No key found for account:', accountAddress);
        return {
          success: false,
          error: 'Ethereum key not found for account',
        };
      }
      
      console.log('✅ [KeyService] Found stored key, decrypting...');
      const privateKey = await decryptEthereumPrivateKey(
        stored.encryptedPrivateKey,
        stored.iv,
        stored.salt,
        password
      );
      
      console.log('✅ [KeyService] Private key decrypted successfully');
      return {
        success: true,
        data: {
          address: stored.address,
          privateKey,
        },
      };
    } catch (error) {
      console.error('❌ [KeyService] Error in getEthereumKeyByAccount:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to decrypt Ethereum key',
      };
    }
  }

  /**
   * List all stored Ethereum keys (public info only)
   * Only works in extension context
   */
  async listEthereumKeys(): Promise<APIResponse<Array<{ id: string; address: string; accountAddress?: string }>>> {
    try {
      // Verify we're in extension context
      const { isExtensionContext } = await import('@/utils/extensionCheck');
      if (!isExtensionContext()) {
        return {
          success: false,
          error: 'Keys can only be accessed in extension context. This protects against phishing attacks.',
        };
      }

      const keys = await listEthereumKeys();
      return {
        success: true,
        data: keys,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list Ethereum keys',
      };
    }
  }

  /**
   * Delete Ethereum key
   * Only works in extension context
   */
  async deleteEthereumKey(keyId: string): Promise<APIResponse<void>> {
    try {
      // Verify we're in extension context
      const { isExtensionContext } = await import('@/utils/extensionCheck');
      if (!isExtensionContext()) {
        return {
          success: false,
          error: 'Keys can only be accessed in extension context. This protects against phishing attacks.',
        };
      }

      await deleteEthereumKey(keyId);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete Ethereum key',
      };
    }
  }

  /**
   * Generate Ethereum key from mnemonic phrase (for wallet restoration)
   */
  async generateEthereumKeyFromMnemonic(
    mnemonic: string,
    password: string,
    accountAddress?: string
  ): Promise<APIResponse<{ keyId: string; address: string }>> {
    try {
      // Verify we're in extension context (or dev mode)
      const { isExtensionContext } = await import('@/utils/extensionCheck');
      if (!isExtensionContext()) {
        return {
          success: false,
          error: 'Keys can only be generated in extension context. This protects against phishing attacks.',
        };
      }

      // Generate wallet from mnemonic
      const { privateKey, address } = generateWalletFromMnemonic(mnemonic);
      
      // Encrypt private key and mnemonic with password
      const encrypted = await encryptEthereumPrivateKey(privateKey, password, mnemonic);
      
      // Generate unique key ID
      const keyId = `eth_key_${Date.now()}_${crypto.getRandomValues(new Uint8Array(4)).join('')}`;
      
      // Use address as accountAddress if not provided
      const finalAccountAddress = accountAddress || address;
      
      // Store encrypted key in extension storage
      await storeEthereumPrivateKey(
        keyId,
        encrypted.encrypted,
        encrypted.address,
        encrypted.iv,
        encrypted.salt,
        finalAccountAddress,
        encrypted.encryptedMnemonic,
        encrypted.mnemonicIv
      );
      
      return {
        success: true,
        data: {
          keyId,
          address: encrypted.address,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restore wallet from mnemonic',
      };
    }
  }
}

export const keyService = new KeyService();

// Helper function
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
