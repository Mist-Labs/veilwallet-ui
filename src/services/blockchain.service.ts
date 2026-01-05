import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config/constants';
import type { UserOperation } from '@/types';

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private chainId: number;
  private rpcUrl: string;

  constructor() {
    this.rpcUrl = NETWORK_CONFIG.RPC_URL;
    this.chainId = NETWORK_CONFIG.CHAIN_ID;
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
  }

  /**
   * Get provider instance
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Get signer from private key
   */
  getSigner(privateKey: string): ethers.Wallet {
    return new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * Get contract instance
   */
  getContract(address: string, abi: readonly string[]): ethers.Contract {
    return new ethers.Contract(address, abi, this.provider);
  }

  /**
   * Get contract instance with signer
   */
  getContractWithSigner(address: string, abi: readonly string[], signer: ethers.Signer): ethers.Contract {
    return new ethers.Contract(address, abi, signer);
  }

  /**
   * Send UserOperation to bundler (ERC-4337)
   * Note: This requires a bundler endpoint. For now, we'll use direct transactions.
   */
  async sendUserOperation(userOp: UserOperation): Promise<{ userOpHash: string }> {
    try {
      // TODO: Implement bundler integration when available
      // For now, throw error as this requires a bundler service
      throw new Error('Bundler integration not yet implemented. Use direct contract calls instead.');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get balance of an address
   */
  async getBalance(address: string): Promise<bigint> {
    try {
      return await this.provider.getBalance(address);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<ethers.TransactionReceipt | null> {
    try {
      return await this.provider.waitForTransaction(txHash, confirmations);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get contract addresses
   */
  getContractAddresses() {
    return CONTRACT_ADDRESSES;
  }

  /**
   * Get network configuration
   */
  getNetworkConfig() {
    return NETWORK_CONFIG;
  }

  /**
   * Check if address is a contract
   */
  async isContract(address: string): Promise<boolean> {
    try {
      const code = await this.provider.getCode(address);
      return code !== '0x' && code !== '0x0';
    } catch (error) {
      return false;
    }
  }
}

export const blockchainService = new BlockchainService();

