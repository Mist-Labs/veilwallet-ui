'use client';

import { useState, useEffect, useCallback } from 'react';
import { keyService } from '@/services/key.service';
import { storeKeyId, getKeyId, clearKeyId } from '@/utils/session';
import type { WalletKey } from '@/types';

interface UseKeysReturn {
  keyId: string | null;
  loading: boolean;
  error: string | null;
  generateKey: (password: string, accountAddress?: string) => Promise<{ success: boolean; error?: string }>;
  getPrivateKey: (password: string) => Promise<CryptoKey | null>;
  listKeys: () => Promise<WalletKey[]>;
  deleteKey: (keyId: string) => Promise<{ success: boolean; error?: string }>;
  signTransaction: (transactionData: ArrayBuffer | string, password: string) => Promise<{ signature: string } | null>;
}

export function useKeys(accountAddress?: string): UseKeysReturn {
  const [keyId, setKeyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load key ID from storage on mount
  useEffect(() => {
    const storedKeyId = getKeyId();
    if (storedKeyId) {
      setKeyId(storedKeyId);
    }
  }, []);

  const generateKey = useCallback(async (password: string, accountAddr?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await keyService.generateWalletKey(password, accountAddr || accountAddress);
      if (result.success && result.data) {
        setKeyId(result.data.keyId);
        storeKeyId(result.data.keyId);
        return { success: true };
      } else {
        setError(result.error || 'Key generation failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Key generation failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [accountAddress]);

  const getPrivateKey = useCallback(async (password: string): Promise<CryptoKey | null> => {
    if (!keyId) {
      setError('No key ID found');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await keyService.getPrivateKey(keyId, password);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to get private key');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get private key');
      return null;
    } finally {
      setLoading(false);
    }
  }, [keyId]);

  const listKeys = useCallback(async (): Promise<WalletKey[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await keyService.listKeys();
      if (result.success && result.data) {
        return result.data.map(key => ({
          keyId: key.id,
          publicKey: key.publicKey,
          accountAddress: key.accountAddress,
          createdAt: new Date().toISOString(), // Would be stored in actual implementation
        }));
      } else {
        setError(result.error || 'Failed to list keys');
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list keys');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteKey = useCallback(async (keyIdToDelete: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await keyService.deleteKey(keyIdToDelete);
      if (result.success) {
        if (keyIdToDelete === keyId) {
          setKeyId(null);
          clearKeyId();
        }
        return { success: true };
      } else {
        setError(result.error || 'Failed to delete key');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete key';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [keyId]);

  const signTransaction = useCallback(async (
    transactionData: ArrayBuffer | string,
    password: string
  ): Promise<{ signature: string } | null> => {
    if (!keyId) {
      setError('No key ID found');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      // Get private key
      const privateKeyResult = await keyService.getPrivateKey(keyId, password);
      if (!privateKeyResult.success || !privateKeyResult.data) {
        setError(privateKeyResult.error || 'Failed to get private key');
        return null;
      }

      // Sign transaction
      const signResult = await keyService.signTransaction(transactionData, privateKeyResult.data);
      if (signResult.success && signResult.data) {
        return signResult.data;
      } else {
        setError(signResult.error || 'Failed to sign transaction');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign transaction');
      return null;
    } finally {
      setLoading(false);
    }
  }, [keyId]);

  return {
    keyId,
    loading,
    error,
    generateKey,
    getPrivateKey,
    listKeys,
    deleteKey,
    signTransaction,
  };
}

