'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { contractService } from '@/services/contract.service';
import { blockchainService } from '@/services/blockchain.service';
import { keyService } from '@/services/key.service';
import type { APIResponse } from '@/types';

interface UseContractReturn {
  loading: boolean;
  error: string | null;
  createWallet: (ownerAddress: string, salt: string, password: string, keyId?: string) => Promise<APIResponse<{ accountAddress: string; txHash?: string }>>;
  getPredictedAddress: (ownerAddress: string, salt: string) => Promise<APIResponse<string>>;
  addSessionKey: (accountAddress: string, sessionKeyAddress: string, validUntil: number, spendingLimit: string, password: string, keyId?: string) => Promise<APIResponse<{ txHash: string }>>;
  revokeSessionKey: (accountAddress: string, sessionKeyAddress: string, password: string, keyId?: string) => Promise<APIResponse<{ txHash: string }>>;
  setGuardian: (accountAddress: string, guardianAddress: string, password: string, keyId?: string) => Promise<APIResponse<{ txHash: string }>>;
  initiateRecovery: (accountAddress: string, newOwnerAddress: string, password: string, keyId?: string) => Promise<APIResponse<{ txHash: string }>>;
  executeRecovery: (accountAddress: string, password: string, keyId?: string) => Promise<APIResponse<{ txHash: string }>>;
  getSessionKeyInfo: (accountAddress: string, sessionKeyAddress: string) => Promise<APIResponse<{ validUntil: bigint; spendingLimit: bigint; spentAmount: bigint }>>;
  getGuardian: (accountAddress: string) => Promise<APIResponse<string>>;
  getPendingRecovery: (accountAddress: string) => Promise<APIResponse<{ newOwner: string; timestamp: bigint; executed: boolean }>>;
}

export function useContract(): UseContractReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWallet = useCallback(async (
    ownerAddress: string,
    salt: string,
    password: string,
    keyId?: string
  ): Promise<APIResponse<{ accountAddress: string; txHash?: string }>> => {
    setLoading(true);
    setError(null);
    try {
      // Get Ethereum private key from self-custodial storage
      let privateKey: string;
      if (keyId) {
        const keyResult = await keyService.getEthereumPrivateKey(keyId, password);
        if (!keyResult.success || !keyResult.data) {
          return {
            success: false,
            error: keyResult.error || 'Failed to get private key',
          };
        }
        privateKey = keyResult.data;
      } else {
        const keyResult = await keyService.getEthereumKeyByAccount(ownerAddress, password);
        if (!keyResult.success || !keyResult.data) {
          return {
            success: false,
            error: keyResult.error || 'Failed to get private key for account',
          };
        }
        privateKey = keyResult.data;
      }

      const provider = blockchainService.getProvider();
      const signer = new ethers.Wallet(privateKey, provider);
      const result = await contractService.createAccount(ownerAddress, salt, signer);
      return {
        success: true,
        data: {
          accountAddress: result.accountAddress,
          txHash: result.txHash,
        },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create wallet';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPredictedAddress = useCallback(async (
    ownerAddress: string,
    salt: string
  ): Promise<APIResponse<string>> => {
    setLoading(true);
    setError(null);
    try {
      const address = await contractService.getPredictedAddress(ownerAddress, salt);
      return {
        success: true,
        data: address,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get predicted address';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const addSessionKey = useCallback(async (
    accountAddress: string,
    sessionKeyAddress: string,
    validUntil: number,
    spendingLimit: string,
    password: string,
    keyId?: string
  ): Promise<APIResponse<{ txHash: string }>> => {
    setLoading(true);
    setError(null);
    try {
      // Get Ethereum private key from self-custodial storage
      let privateKey: string;
      if (keyId) {
        const keyResult = await keyService.getEthereumPrivateKey(keyId, password);
        if (!keyResult.success || !keyResult.data) {
          return {
            success: false,
            error: keyResult.error || 'Failed to get private key',
          };
        }
        privateKey = keyResult.data;
      } else {
        const keyResult = await keyService.getEthereumKeyByAccount(accountAddress, password);
        if (!keyResult.success || !keyResult.data) {
          return {
            success: false,
            error: keyResult.error || 'Failed to get private key for account',
          };
        }
        privateKey = keyResult.data;
      }

      const provider = blockchainService.getProvider();
      const signer = new ethers.Wallet(privateKey, provider);
      const { parseEther } = await import('@/utils/ethersHelper');
      const result = await contractService.addSessionKey(
        accountAddress,
        sessionKeyAddress,
        validUntil,
        parseEther(spendingLimit),
        signer
      );
      return {
        success: true,
        data: { txHash: result.txHash },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add session key';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const revokeSessionKey = useCallback(async (
    accountAddress: string,
    sessionKeyAddress: string,
    password: string,
    keyId?: string
  ): Promise<APIResponse<{ txHash: string }>> => {
    setLoading(true);
    setError(null);
    try {
      // Get Ethereum private key from self-custodial storage
      let privateKey: string;
      if (keyId) {
        const keyResult = await keyService.getEthereumPrivateKey(keyId, password);
        if (!keyResult.success || !keyResult.data) {
          return {
            success: false,
            error: keyResult.error || 'Failed to get private key',
          };
        }
        privateKey = keyResult.data;
      } else {
        const keyResult = await keyService.getEthereumKeyByAccount(accountAddress, password);
        if (!keyResult.success || !keyResult.data) {
          return {
            success: false,
            error: keyResult.error || 'Failed to get private key for account',
          };
        }
        privateKey = keyResult.data;
      }

      const provider = blockchainService.getProvider();
      const signer = new ethers.Wallet(privateKey, provider);
      const result = await contractService.revokeSessionKey(accountAddress, sessionKeyAddress, signer);
      return {
        success: true,
        data: { txHash: result.txHash },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to revoke session key';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const setGuardian = useCallback(async (
    accountAddress: string,
    guardianAddress: string,
    password: string,
    keyId?: string
  ): Promise<APIResponse<{ txHash: string }>> => {
    setLoading(true);
    setError(null);
    try {
      // Get Ethereum private key from self-custodial storage
      let privateKey: string;
      if (keyId) {
        const keyResult = await keyService.getEthereumPrivateKey(keyId, password);
        if (!keyResult.success || !keyResult.data) {
          return {
            success: false,
            error: keyResult.error || 'Failed to get private key',
          };
        }
        privateKey = keyResult.data;
      } else {
        const keyResult = await keyService.getEthereumKeyByAccount(accountAddress, password);
        if (!keyResult.success || !keyResult.data) {
          return {
            success: false,
            error: keyResult.error || 'Failed to get private key for account',
          };
        }
        privateKey = keyResult.data;
      }

      const provider = blockchainService.getProvider();
      const signer = new ethers.Wallet(privateKey, provider);
      const result = await contractService.setGuardian(accountAddress, guardianAddress, signer);
      return {
        success: true,
        data: { txHash: result.txHash },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to set guardian';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const initiateRecovery = useCallback(async (
    accountAddress: string,
    newOwnerAddress: string,
    password: string,
    keyId?: string
  ): Promise<APIResponse<{ txHash: string }>> => {
    setLoading(true);
    setError(null);
    try {
      // Get Ethereum private key from self-custodial storage
      let privateKey: string;
      if (keyId) {
        const keyResult = await keyService.getEthereumPrivateKey(keyId, password);
        if (!keyResult.success || !keyResult.data) {
          return {
            success: false,
            error: keyResult.error || 'Failed to get private key',
          };
        }
        privateKey = keyResult.data;
      } else {
        const keyResult = await keyService.getEthereumKeyByAccount(accountAddress, password);
        if (!keyResult.success || !keyResult.data) {
          return {
            success: false,
            error: keyResult.error || 'Failed to get private key for account',
          };
        }
        privateKey = keyResult.data;
      }

      const provider = blockchainService.getProvider();
      const signer = new ethers.Wallet(privateKey, provider);
      const result = await contractService.initiateRecovery(accountAddress, newOwnerAddress, signer);
      return {
        success: true,
        data: { txHash: result.txHash },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initiate recovery';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const executeRecovery = useCallback(async (
    accountAddress: string,
    password: string,
    keyId?: string
  ): Promise<APIResponse<{ txHash: string }>> => {
    setLoading(true);
    setError(null);
    try {
      // Get Ethereum private key from self-custodial storage
      let privateKey: string;
      if (keyId) {
        const keyResult = await keyService.getEthereumPrivateKey(keyId, password);
        if (!keyResult.success || !keyResult.data) {
          return {
            success: false,
            error: keyResult.error || 'Failed to get private key',
          };
        }
        privateKey = keyResult.data;
      } else {
        const keyResult = await keyService.getEthereumKeyByAccount(accountAddress, password);
        if (!keyResult.success || !keyResult.data) {
          return {
            success: false,
            error: keyResult.error || 'Failed to get private key for account',
          };
        }
        privateKey = keyResult.data;
      }

      const provider = blockchainService.getProvider();
      const signer = new ethers.Wallet(privateKey, provider);
      const result = await contractService.executeRecovery(accountAddress, signer);
      return {
        success: true,
        data: { txHash: result.txHash },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to execute recovery';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getSessionKeyInfo = useCallback(async (
    accountAddress: string,
    sessionKeyAddress: string
  ): Promise<APIResponse<{ validUntil: bigint; spendingLimit: bigint; spentAmount: bigint }>> => {
    setLoading(true);
    setError(null);
    try {
      const result = await contractService.getSessionKey(accountAddress, sessionKeyAddress);
      return {
        success: true,
        data: result,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get session key info';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getGuardian = useCallback(async (
    accountAddress: string
  ): Promise<APIResponse<string>> => {
    setLoading(true);
    setError(null);
    try {
      const guardian = await contractService.getGuardian(accountAddress);
      return {
        success: true,
        data: guardian,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get guardian';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingRecovery = useCallback(async (
    accountAddress: string
  ): Promise<APIResponse<{ newOwner: string; timestamp: bigint; executed: boolean }>> => {
    setLoading(true);
    setError(null);
    try {
      const result = await contractService.getPendingRecovery(accountAddress);
      return {
        success: true,
        data: result,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get pending recovery';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createWallet,
    getPredictedAddress,
    addSessionKey,
    revokeSessionKey,
    setGuardian,
    initiateRecovery,
    executeRecovery,
    getSessionKeyInfo,
    getGuardian,
    getPendingRecovery,
  };
}

