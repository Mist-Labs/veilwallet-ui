import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config/constants';
import { ACCOUNT_FACTORY_ABI, SMART_ACCOUNT_ABI } from '@/lib/abis';

export interface SmartAccountInfo {
  address: string;
  owner: string;
  isDeployed: boolean;
}

class SmartAccountService {
  private provider: ethers.JsonRpcProvider;
  private factoryContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.RPC_URL);
    this.factoryContract = new ethers.Contract(
      CONTRACT_ADDRESSES.ACCOUNT_FACTORY,
      ACCOUNT_FACTORY_ABI,
      this.provider
    );
  }

  /**
   * Get predicted smart account address for an owner
   */
  async getPredictedAddress(ownerAddress: string, salt?: string): Promise<string> {
    try {
      const saltBytes = salt 
        ? ethers.keccak256(ethers.toUtf8Bytes(salt))
        : ethers.keccak256(ethers.toUtf8Bytes(ownerAddress));

      const address = await this.factoryContract.getAddress(ownerAddress, saltBytes);
      return address;
    } catch (error) {
      console.error('Error getting predicted address:', error);
      throw new Error('Failed to get predicted smart account address');
    }
  }

  /**
   * Check if smart account is deployed
   */
  async isDeployed(address: string): Promise<boolean> {
    try {
      const code = await this.provider.getCode(address);
      return code !== '0x';
    } catch (error) {
      console.error('Error checking deployment:', error);
      return false;
    }
  }

  /**
   * Deploy a smart account
   */
  async deployAccount(
    ownerPrivateKey: string,
    salt?: string
  ): Promise<{ success: boolean; address?: string; txHash?: string; error?: string }> {
    try {
      const wallet = new ethers.Wallet(ownerPrivateKey, this.provider);
      const ownerAddress = wallet.address;

      const saltBytes = salt
        ? ethers.keccak256(ethers.toUtf8Bytes(salt))
        : ethers.keccak256(ethers.toUtf8Bytes(ownerAddress));

      // Get predicted address
      const predictedAddress = await this.getPredictedAddress(ownerAddress, salt);

      // Check if already deployed
      const deployed = await this.isDeployed(predictedAddress);
      if (deployed) {
        return {
          success: true,
          address: predictedAddress,
        };
      }

      // Deploy
      const factoryWithSigner = this.factoryContract.connect(wallet);
      const tx = await factoryWithSigner.createAccount(ownerAddress, saltBytes);
      const receipt = await tx.wait();

      return {
        success: true,
        address: predictedAddress,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error deploying smart account:', error);
      return {
        success: false,
        error: error.message || 'Failed to deploy smart account',
      };
    }
  }

  /**
   * Get smart account info
   */
  async getAccountInfo(accountAddress: string): Promise<SmartAccountInfo | null> {
    try {
      const deployed = await this.isDeployed(accountAddress);
      
      if (!deployed) {
        return {
          address: accountAddress,
          owner: ethers.ZeroAddress,
          isDeployed: false,
        };
      }

      const account = new ethers.Contract(
        accountAddress,
        SMART_ACCOUNT_ABI,
        this.provider
      );

      const owner = await account.owner();

      return {
        address: accountAddress,
        owner,
        isDeployed: true,
      };
    } catch (error) {
      console.error('Error getting account info:', error);
      return null;
    }
  }

  /**
   * Execute a transaction through smart account
   */
  async executeTransaction(
    accountAddress: string,
    ownerPrivateKey: string,
    target: string,
    value: bigint,
    data: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = new ethers.Wallet(ownerPrivateKey, this.provider);
      const account = new ethers.Contract(
        accountAddress,
        SMART_ACCOUNT_ABI,
        wallet
      );

      const tx = await account.execute(target, value, data);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error executing transaction:', error);
      return {
        success: false,
        error: error.message || 'Failed to execute transaction',
      };
    }
  }

  /**
   * Add session key to smart account
   */
  async addSessionKey(
    accountAddress: string,
    ownerPrivateKey: string,
    sessionKeyAddress: string,
    validUntil: number,
    spendingLimit: bigint
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = new ethers.Wallet(ownerPrivateKey, this.provider);
      const account = new ethers.Contract(
        accountAddress,
        SMART_ACCOUNT_ABI,
        wallet
      );

      const tx = await account.addSessionKey(sessionKeyAddress, validUntil, spendingLimit);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error adding session key:', error);
      return {
        success: false,
        error: error.message || 'Failed to add session key',
      };
    }
  }

  /**
   * Set guardian for recovery
   */
  async setGuardian(
    accountAddress: string,
    ownerPrivateKey: string,
    guardianAddress: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = new ethers.Wallet(ownerPrivateKey, this.provider);
      const account = new ethers.Contract(
        accountAddress,
        SMART_ACCOUNT_ABI,
        wallet
      );

      const tx = await account.setGuardian(guardianAddress);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error setting guardian:', error);
      return {
        success: false,
        error: error.message || 'Failed to set guardian',
      };
    }
  }

  /**
   * Get MNT balance
   */
  async getMNTBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting MNT balance:', error);
      return '0';
    }
  }
}

export const smartAccountService = new SmartAccountService();

