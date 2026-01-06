import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '@/config/constants';

export interface NetworkInfo {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface GasEstimate {
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedCost: string;
}

class NetworkService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.RPC_URL);
  }

  /**
   * Get current network info
   */
  getNetworkInfo(): NetworkInfo {
    return {
      chainId: NETWORK_CONFIG.CHAIN_ID,
      chainName: NETWORK_CONFIG.CHAIN_NAME,
      rpcUrl: NETWORK_CONFIG.RPC_URL,
      blockExplorerUrl: NETWORK_CONFIG.EXPLORER,
      nativeCurrency: NETWORK_CONFIG.NATIVE_CURRENCY,
    };
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error('Error getting block number:', error);
      return 0;
    }
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      console.error('Error getting gas price:', error);
      return BigInt(0);
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(tx: {
    from: string;
    to: string;
    value?: bigint;
    data?: string;
  }): Promise<GasEstimate | null> {
    try {
      const gasLimit = await this.provider.estimateGas(tx);
      const feeData = await this.provider.getFeeData();

      const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice || BigInt(0);
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || BigInt(0);

      const estimatedCost = ethers.formatEther(gasLimit * maxFeePerGas);

      return {
        gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
        estimatedCost,
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      return null;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      return null;
    }
  }

  /**
   * Wait for transaction
   */
  async waitForTransaction(txHash: string, confirmations = 1) {
    try {
      return await this.provider.waitForTransaction(txHash, confirmations);
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      return null;
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash: string) {
    try {
      return await this.provider.getTransaction(txHash);
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(address: string): Promise<number> {
    try {
      return await this.provider.getTransactionCount(address);
    } catch (error) {
      console.error('Error getting transaction count:', error);
      return 0;
    }
  }

  /**
   * Send raw transaction
   */
  async sendTransaction(signedTx: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const tx = await this.provider.broadcastTransaction(signedTx);
      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error: any) {
      console.error('Error sending transaction:', error);
      return {
        success: false,
        error: error.message || 'Failed to send transaction',
      };
    }
  }

  /**
   * Get explorer URL for address
   */
  getExplorerUrl(address: string, type: 'address' | 'tx' = 'address'): string {
    return `${NETWORK_CONFIG.EXPLORER}/${type}/${address}`;
  }
}

export const networkService = new NetworkService();

