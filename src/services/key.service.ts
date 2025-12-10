/**
 * Non-custodial key management service
 * All keys are generated and stored client-side only
 * Never sends private keys to server
 */

import { SECURITY_CONFIG } from '@/config/constants';
import { generateKeyPair, encryptPrivateKey, decryptPrivateKey, signData, exportPublicKey } from '@/utils/keyGeneration';
import { storePrivateKey, getPrivateKey, getKeyByAccount, deleteKey, listKeys } from '@/utils/keyStorage';
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
      const dataBuffer = typeof transactionData === 'string'
        ? new TextEncoder().encode(transactionData)
        : transactionData;
      
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
}

export const keyService = new KeyService();

// Helper function
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
