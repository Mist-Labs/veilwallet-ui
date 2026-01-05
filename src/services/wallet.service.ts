import { ethers } from 'ethers';
import { API_ENDPOINTS } from '@/config/constants';
import { contractService } from './contract.service';
import { blockchainService } from './blockchain.service';
import { keyService } from './key.service';
import { CONTRACT_ADDRESSES } from '@/config/constants';
import { parseEther, formatEther, randomBytes, keccak256, zeroPadValue, hexlify, toBeHex } from '@/utils/ethersHelper';
import type { APIResponse, WalletBalance, Transaction, Commitment, PrivateTransfer, TransparentTransfer } from '@/types';

class WalletService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_ENDPOINTS.INDEXER;
  }

  /**
   * Get wallet balance (transparent + private)
   * Tries on-chain first, falls back to API
   */
  async getBalance(accountAddress: string): Promise<APIResponse<WalletBalance>> {
    try {
      // Try to get on-chain balance first
      try {
        const tokenBalance = await contractService.getTokenBalance(accountAddress);
        const nativeBalance = await blockchainService.getBalance(accountAddress);
        
        // For now, private balance would need to be fetched from API or calculated from commitments
        const privateBalance = '0'; // TODO: Calculate from commitments
        
        return {
          success: true,
          data: {
            transparent: formatEther(tokenBalance),
            private: privateBalance,
            total: formatEther(tokenBalance + nativeBalance),
          },
        };
      } catch (onChainError) {
        // Fall back to API
        console.warn('On-chain balance fetch failed, using API:', onChainError);
      }

      // Fallback to API
      const response = await fetch(`${this.baseUrl}/wallet/balance/${accountAddress}`, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get balance',
      };
    }
  }

  /**
   * Get private balance (sum of unspent commitments)
   */
  async getPrivateBalance(accountAddress: string): Promise<APIResponse<string>> {
    try {
      const response = await fetch(`${this.baseUrl}/wallet/private-balance/${accountAddress}`, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get private balance',
      };
    }
  }

  /**
   * Get all commitments for an address
   */
  async getCommitments(accountAddress: string): Promise<APIResponse<Commitment[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/wallet/commitments/${accountAddress}`, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get commitments',
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(accountAddress: string, limit = 50, offset = 0): Promise<APIResponse<Transaction[]>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/wallet/transactions/${accountAddress}?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transactions',
      };
    }
  }

  /**
   * Send private transfer (on-chain)
   * Uses self-custodial key service - requires password instead of raw private key
   */
  async sendPrivateTransfer(
    accountAddress: string,
    transfer: PrivateTransfer,
    password: string,
    keyId?: string
  ): Promise<APIResponse<{ transactionHash: string }>> {
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
        // Try to get key by account address
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
      
      // If commitment is provided, use it; otherwise generate
      let commitment = transfer.recipientCommitment;
      let nullifier = transfer.nullifier;
      let proof = transfer.proof;

      // If commitment not provided, generate it
      if (!commitment) {
        // Generate commitment inputs
        const amountBigInt = parseEther(transfer.amount);
        const blinding = hexlify(randomBytes(32));
        const recipientBytes = zeroPadValue(accountAddress, 32); // This should be recipient address
        const nonce = hexlify(randomBytes(32));

        // Create commitment
        commitment = await contractService.createCommitment(
          amountBigInt,
          blinding,
          accountAddress, // Should be recipient
          nonce
        );

        // Create nullifier
        nullifier = keccak256(commitment + 'nullifier');

        // Encode proof (for MVP, this is just the inputs)
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        proof = abiCoder.encode(
          ['bytes32[4]'],
          [[
            zeroPadValue(toBeHex(amountBigInt), 32),
            blinding,
            recipientBytes,
            nonce
          ]]
        );
      }

      // Execute private transfer
      const result = await contractService.sendPrivateTransfer(
        accountAddress,
        commitment,
        nullifier,
        parseEther(transfer.amount),
        proof,
        signer
      );

      return {
        success: true,
        data: {
          transactionHash: result.txHash,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Private transfer failed',
      };
    }
  }

  /**
   * Send transparent transfer (on-chain)
   * Uses self-custodial key service - requires password instead of raw private key
   */
  async sendTransparentTransfer(
    accountAddress: string,
    transfer: TransparentTransfer,
    password: string,
    keyId?: string
  ): Promise<APIResponse<{ transactionHash: string }>> {
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
        // Try to get key by account address
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

      // Execute token transfer
      const result = await contractService.transferToken(
        accountAddress,
        transfer.to,
        parseEther(transfer.amount),
        signer
      );

      return {
        success: true,
        data: {
          transactionHash: result.txHash,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transparent transfer failed',
      };
    }
  }

  /**
   * Send private transfer (via API - fallback)
   */
  async sendPrivateTransferViaAPI(
    accountAddress: string,
    transfer: PrivateTransfer
  ): Promise<APIResponse<{ transactionHash: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/wallet/transfer/private`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress,
          ...transfer,
        }),
        credentials: 'include',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Private transfer failed',
      };
    }
  }

  /**
   * Send transparent transfer (via API - fallback)
   */
  async sendTransparentTransferViaAPI(
    accountAddress: string,
    transfer: TransparentTransfer
  ): Promise<APIResponse<{ transactionHash: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/wallet/transfer/transparent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress,
          ...transfer,
        }),
        credentials: 'include',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transparent transfer failed',
      };
    }
  }

  /**
   * Generate commitment for receiving private transfer
   * Can be done on-chain or via API
   */
  async generateCommitment(amount: string, recipientAddress: string): Promise<APIResponse<Commitment>> {
    try {
      // Try on-chain generation
      try {
        const amountBigInt = parseEther(amount);
        const blinding = hexlify(randomBytes(32));
        const recipientBytes = zeroPadValue(recipientAddress, 32);
        const nonce = hexlify(randomBytes(32));

        const commitmentHash = await contractService.createCommitment(
          amountBigInt,
          blinding,
          recipientAddress,
          nonce
        );

        return {
          success: true,
          data: {
            hash: commitmentHash,
            amount,
            blindingFactor: blinding,
            recipient: recipientAddress,
            nonce,
            createdAt: new Date().toISOString(),
            isSpent: false,
          },
        };
      } catch (onChainError) {
        // Fall back to API
        console.warn('On-chain commitment generation failed, using API:', onChainError);
      }

      // Fallback to API
      const response = await fetch(`${this.baseUrl}/wallet/commitment/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          recipientAddress,
        }),
        credentials: 'include',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate commitment',
      };
    }
  }

  /**
   * Create or get smart contract wallet
   * Uses self-custodial key service - requires password instead of raw private key
   */
  async createSmartWallet(
    ownerAddress: string,
    salt: string,
    password: string,
    keyId?: string
  ): Promise<APIResponse<{ accountAddress: string; txHash?: string }>> {
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
        // Try to get key by account address
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create smart wallet',
      };
    }
  }

  /**
   * Get predicted wallet address without deploying
   */
  async getPredictedWalletAddress(ownerAddress: string, salt: string): Promise<APIResponse<string>> {
    try {
      const address = await contractService.getPredictedAddress(ownerAddress, salt);
      return {
        success: true,
        data: address,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get predicted address',
      };
    }
  }
}

export const walletService = new WalletService();

