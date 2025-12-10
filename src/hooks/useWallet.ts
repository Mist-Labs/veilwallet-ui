'use client';

import { useState, useEffect, useCallback } from 'react';
import { walletService } from '@/services/wallet.service';
import type { WalletBalance, Transaction, Commitment } from '@/types';

interface UseWalletReturn {
  balance: WalletBalance | null;
  transactions: Transaction[];
  commitments: Commitment[];
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshCommitments: () => Promise<void>;
}

export function useWallet(accountAddress: string | null): UseWalletReturn {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!accountAddress) return;

    setLoading(true);
    setError(null);
    try {
      const response = await walletService.getBalance(accountAddress);
      if (response.success && response.data) {
        setBalance(response.data);
      } else {
        setError(response.error || 'Failed to fetch balance');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, [accountAddress]);

  const refreshTransactions = useCallback(async () => {
    if (!accountAddress) return;

    setLoading(true);
    setError(null);
    try {
      const response = await walletService.getTransactions(accountAddress);
      if (response.success && response.data) {
        setTransactions(response.data);
      } else {
        setError(response.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [accountAddress]);

  const refreshCommitments = useCallback(async () => {
    if (!accountAddress) return;

    setLoading(true);
    setError(null);
    try {
      const response = await walletService.getCommitments(accountAddress);
      if (response.success && response.data) {
        setCommitments(response.data);
      } else {
        setError(response.error || 'Failed to fetch commitments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch commitments');
    } finally {
      setLoading(false);
    }
  }, [accountAddress]);

  useEffect(() => {
    if (accountAddress) {
      refreshBalance();
      refreshTransactions();
      refreshCommitments();
    }
  }, [accountAddress, refreshBalance, refreshTransactions, refreshCommitments]);

  return {
    balance,
    transactions,
    commitments,
    loading,
    error,
    refreshBalance,
    refreshTransactions,
    refreshCommitments,
  };
}

