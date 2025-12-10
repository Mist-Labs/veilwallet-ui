import { API_ENDPOINTS } from '@/config/constants';
import type { APIResponse, WalletBalance, Transaction, Commitment, PrivateTransfer, TransparentTransfer } from '@/types';

class WalletService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_ENDPOINTS.INDEXER;
  }

  /**
   * Get wallet balance (transparent + private)
   */
  async getBalance(accountAddress: string): Promise<APIResponse<WalletBalance>> {
    try {
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
   * Send private transfer
   */
  async sendPrivateTransfer(
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
   * Send transparent transfer
   */
  async sendTransparentTransfer(
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
   */
  async generateCommitment(amount: string, recipientAddress: string): Promise<APIResponse<Commitment>> {
    try {
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
}

export const walletService = new WalletService();

