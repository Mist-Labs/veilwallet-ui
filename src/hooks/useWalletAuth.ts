'use client';

import { useState, useEffect, useCallback } from 'react';
import { keyService } from '@/services/key.service';

interface UseWalletAuthReturn {
  walletAddress: string | null;
  loading: boolean;
  isUnlocked: boolean;
  unlock: (password: string) => Promise<{ success: boolean; error?: string }>;
  lock: () => void;
  refresh: () => void;
}

export function useWalletAuth(): UseWalletAuthReturn {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      const address = localStorage.getItem('veilwallet_address');
      setWalletAddress(address);
      // Check if wallet is unlocked (has a session flag)
      const unlocked = sessionStorage.getItem('veilwallet_unlocked') === 'true';
      setIsUnlocked(unlocked && !!address);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unlock = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!walletAddress) {
      return { success: false, error: 'No wallet found' };
    }

    try {
      // Try to get the key (validates password)
      const keyResult = await keyService.getEthereumKeyByAccount(walletAddress, password);
      
      if (!keyResult.success || !keyResult.data) {
        return { success: false, error: keyResult.error || 'Invalid password' };
      }

      // Password is correct, mark as unlocked
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('veilwallet_unlocked', 'true');
      }
      setIsUnlocked(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to unlock wallet' };
    }
  }, [walletAddress]);

  const lock = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('veilwallet_unlocked');
    }
    setIsUnlocked(false);
  }, []);

  return {
    walletAddress,
    loading,
    isUnlocked,
    unlock,
    lock,
    refresh,
  };
}

