import { ethers } from 'ethers';
import { smartAccountService } from './smartAccount.service';

export interface AccountProtectionStatus {
  isProtected: boolean;
  smartAccountAddress?: string;
  needsProtection: boolean;
}

class AccountProtectionService {
  /**
   * Check if account is protected (has smart account)
   */
  async checkProtectionStatus(eoaAddress: string): Promise<AccountProtectionStatus> {
    try {
      const smartAddress = await smartAccountService.getPredictedAddress(eoaAddress);
      const isDeployed = await smartAccountService.isDeployed(smartAddress);

      return {
        isProtected: isDeployed,
        smartAccountAddress: smartAddress,
        needsProtection: !isDeployed,
      };
    } catch (error) {
      console.error('Error checking protection status:', error);
      return {
        isProtected: false,
        needsProtection: true,
      };
    }
  }

  /**
   * Protect account by deploying smart account
   */
  async protectAccount(
    privateKey: string
  ): Promise<{ success: boolean; smartAccountAddress?: string; error?: string }> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const eoaAddress = wallet.address;

      // Deploy smart account
      const result = await smartAccountService.deployAccount(privateKey, eoaAddress);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to deploy smart account',
        };
      }

      // Store smart account address
      localStorage.setItem('veilwallet_address', result.address!);
      localStorage.setItem('veilwallet_eoa', eoaAddress);
      localStorage.setItem('veilwallet_protected', 'true');

      return {
        success: true,
        smartAccountAddress: result.address,
      };
    } catch (error: any) {
      console.error('Error protecting account:', error);
      return {
        success: false,
        error: error.message || 'Failed to protect account',
      };
    }
  }

  /**
   * Check if address needs protection prompt
   */
  shouldShowProtectionPrompt(): boolean {
    const isProtected = localStorage.getItem('veilwallet_protected') === 'true';
    const hasAddress = !!localStorage.getItem('veilwallet_address');
    const dismissed = sessionStorage.getItem('protection_prompt_dismissed') === 'true';

    return hasAddress && !isProtected && !dismissed;
  }

  /**
   * Dismiss protection prompt for session
   */
  dismissProtectionPrompt() {
    sessionStorage.setItem('protection_prompt_dismissed', 'true');
  }
}

export const accountProtectionService = new AccountProtectionService();

