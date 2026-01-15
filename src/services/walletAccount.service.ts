/**
 * Wallet Account Management Service
 * Manages multiple wallet accounts and their smart account deployments
 */

import { smartAccountService } from './smartAccount.service';
import { keyService } from './key.service';
import { CONTRACT_ADDRESSES } from '@/config/constants';

export interface WalletAccount {
  id: string;
  eoaAddress: string;
  smartAccountAddress: string | null; // Predicted address (counterfactual)
  isSmartAccountDeployed: boolean;
  name?: string;
  createdAt: number;
  isActive: boolean;
}

const ACCOUNTS_STORAGE_KEY = 'veilwallet_accounts';
const ACTIVE_ACCOUNT_KEY = 'veilwallet_active_account_id';

class WalletAccountService {
  /**
   * Get all wallet accounts
   */
  async getAllAccounts(): Promise<WalletAccount[]> {
    try {
      const accountsJson = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (!accountsJson) return [];
      return JSON.parse(accountsJson);
    } catch (error) {
      console.error('Error getting accounts:', error);
      return [];
    }
  }

  /**
   * Get active account
   */
  async getActiveAccount(): Promise<WalletAccount | null> {
    const accounts = await this.getAllAccounts();
    const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    
    if (activeId) {
      const account = accounts.find(a => a.id === activeId);
      if (account) return account;
    }
    
    // Return first account if no active account set
    return accounts.length > 0 ? accounts[0] : null;
  }

  /**
   * Create a new wallet account (EOA only, no deployment)
   */
  async createAccount(
    password: string,
    name?: string
  ): Promise<{ success: boolean; account?: WalletAccount; error?: string }> {
    try {
      // Generate EOA
      const keyResult = await keyService.generateEthereumKey(password);
      if (!keyResult.success || !keyResult.data) {
        return {
          success: false,
          error: keyResult.error || 'Failed to generate wallet',
        };
      }

      const { address: eoaAddress, keyId } = keyResult.data;

      // Get predicted smart account address (counterfactual - no deployment needed)
      const predictedAddress = await smartAccountService.getPredictedAddress(eoaAddress);
      console.log('📍 [WalletAccount] Predicted smart account address:', predictedAddress);
      console.log('📍 [WalletAccount] EOA address:', eoaAddress);
      console.log('📍 [WalletAccount] Factory address:', CONTRACT_ADDRESSES.ACCOUNT_FACTORY);
      
      // Validate the predicted address is not the factory or EOA
      if (!predictedAddress || 
          predictedAddress.toLowerCase() === CONTRACT_ADDRESSES.ACCOUNT_FACTORY.toLowerCase() ||
          predictedAddress.toLowerCase() === eoaAddress.toLowerCase()) {
        console.error('❌ [WalletAccount] Invalid predicted address!', predictedAddress);
        throw new Error('Failed to get valid smart account address. The predicted address is invalid.');
      }
      
      // Check if already deployed
      const isDeployed = await smartAccountService.isDeployed(predictedAddress);
      console.log('🔍 [WalletAccount] Smart account deployed?', isDeployed);

      const account: WalletAccount = {
        id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eoaAddress,
        smartAccountAddress: predictedAddress,
        isSmartAccountDeployed: isDeployed,
        name: name || `Account ${new Date().toLocaleDateString()}`,
        createdAt: Date.now(),
        isActive: false,
      };

      // Save account
      const accounts = await this.getAllAccounts();
      accounts.push(account);
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));

      // Set as active if it's the first account
      if (accounts.length === 1) {
        await this.setActiveAccount(account.id);
      }

      return {
        success: true,
        account,
      };
    } catch (error: any) {
      console.error('Error creating account:', error);
      return {
        success: false,
        error: error.message || 'Failed to create account',
      };
    }
  }

  /**
   * Deploy smart account for an existing wallet
   */
  async deploySmartAccount(
    accountId: string,
    password: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const accounts = await this.getAllAccounts();
      const account = accounts.find(a => a.id === accountId);
      
      if (!account) {
        return {
          success: false,
          error: 'Account not found',
        };
      }

      if (account.isSmartAccountDeployed) {
        return {
          success: true,
          error: 'Smart account already deployed',
        };
      }

      // Get private key
      const keyResult = await keyService.getEthereumKeyByAccount(account.eoaAddress, password);
      if (!keyResult.success || !keyResult.data) {
        return {
          success: false,
          error: 'Invalid password',
        };
      }

      const privateKey = keyResult.data.privateKey;

      // Deploy smart account
      const deployResult = await smartAccountService.deployAccount(privateKey, account.eoaAddress);
      
      if (!deployResult.success) {
        return {
          success: false,
          error: deployResult.error || 'Failed to deploy smart account',
        };
      }

      // Update account
      account.isSmartAccountDeployed = true;
      account.smartAccountAddress = deployResult.address || account.smartAccountAddress;
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));

      return {
        success: true,
        txHash: deployResult.txHash,
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
   * Set active account
   */
  async setActiveAccount(accountId: string): Promise<void> {
    const accounts = await this.getAllAccounts();
    const account = accounts.find(a => a.id === accountId);
    
    if (!account) {
      throw new Error('Account not found');
    }

    // Update all accounts
    accounts.forEach(a => {
      a.isActive = a.id === accountId;
    });
    
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountId);
    
    // Update legacy storage for backward compatibility
    localStorage.setItem('veilwallet_eoa', account.eoaAddress);
    localStorage.setItem('veilwallet_address', account.smartAccountAddress || account.eoaAddress);
  }

  /**
   * Delete account
   */
  async deleteAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const accounts = await this.getAllAccounts();
      const account = accounts.find(a => a.id === accountId);
      
      if (!account) {
        return {
          success: false,
          error: 'Account not found',
        };
      }

      // Remove account
      const filtered = accounts.filter(a => a.id !== accountId);
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(filtered));

      // If deleted account was active, set first account as active
      if (account.isActive && filtered.length > 0) {
        await this.setActiveAccount(filtered[0].id);
      } else if (filtered.length === 0) {
        localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
        localStorage.removeItem('veilwallet_eoa');
        localStorage.removeItem('veilwallet_address');
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete account',
      };
    }
  }

  /**
   * Update account name
   */
  async updateAccountName(accountId: string, name: string): Promise<void> {
    const accounts = await this.getAllAccounts();
    const account = accounts.find(a => a.id === accountId);
    
    if (account) {
      account.name = name;
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    }
  }
}

export const walletAccountService = new WalletAccountService();

