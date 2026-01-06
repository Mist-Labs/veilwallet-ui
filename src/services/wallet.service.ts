import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config/constants';
import { VEIL_TOKEN_ABI } from '@/lib/abis';

export interface WalletBalance {
  transparent: string;
  private: string;
  total: string;
}

class WalletService {
  private provider: ethers.JsonRpcProvider;
  private tokenContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.RPC_URL);
    this.tokenContract = new ethers.Contract(
      CONTRACT_ADDRESSES.VEIL_TOKEN,
      VEIL_TOKEN_ABI,
      this.provider
    );
  }

  /**
   * Get VEIL token balance
   */
  async getVeilTokenBalance(address: string): Promise<{ success: boolean; data?: { balance: string }; error?: string }> {
    try {
      const balance = await this.tokenContract.balanceOf(address);
      return {
        success: true,
        data: {
          balance: ethers.formatEther(balance),
        },
      };
    } catch (error: any) {
      console.error('Error getting VEIL balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to get balance',
      };
    }
  }

  /**
   * Get wallet balance (transparent + private)
   */
  async getBalance(accountAddress: string): Promise<{ success: boolean; data?: WalletBalance; error?: string }> {
    try {
      const tokenBalance = await this.tokenContract.balanceOf(accountAddress);
      const transparent = ethers.formatEther(tokenBalance);

      // For now, private balance would need to be fetched from indexer
      const privateBalance = '0';

      const total = (parseFloat(transparent) + parseFloat(privateBalance)).toFixed(4);

      return {
        success: true,
        data: {
          transparent,
          private: privateBalance,
          total,
        },
      };
    } catch (error: any) {
      console.error('Error getting wallet balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to get wallet balance',
      };
    }
  }

  /**
   * Transfer tokens (standard)
   */
  async transfer(
    fromPrivateKey: string,
    to: string,
    amount: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = new ethers.Wallet(fromPrivateKey, this.provider);
      const token = this.tokenContract.connect(wallet);

      const tx = await token.transfer(to, ethers.parseEther(amount));
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error transferring tokens:', error);
      return {
        success: false,
        error: error.message || 'Failed to transfer tokens',
      };
    }
  }
}

export const walletService = new WalletService();
