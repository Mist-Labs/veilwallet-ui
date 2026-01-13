import { ethers } from 'ethers';
import { smartAccountService } from './smartAccount.service';
import { createAccountLookup, listEthereumKeys } from '@/utils/ethereumKeyStorage';

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
    console.log('🛡️ [AccountProtection] Starting protection process...');
    try {
      const wallet = new ethers.Wallet(privateKey);
      const eoaAddress = wallet.address;
      console.log('📍 [AccountProtection] EOA Address:', eoaAddress);

      // Deploy smart account
      console.log('🚀 [AccountProtection] Calling smartAccountService.deployAccount...');
      const result = await smartAccountService.deployAccount(privateKey, eoaAddress);

      if (!result.success) {
        console.error('❌ [AccountProtection] Deployment failed:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to deploy smart account',
        };
      }

      console.log('✅ [AccountProtection] Smart account deployed at:', result.address);
      
      // IMPORTANT: Preserve the original address if it was an EOA
      // Only update veilwallet_address if it's not already set, or if it's the same as EOA (meaning it was stored as EOA)
      const existingAddress = localStorage.getItem('veilwallet_address');
      const existingEoa = localStorage.getItem('veilwallet_eoa');
      
      console.log('📝 [AccountProtection] Existing address in storage:', existingAddress);
      console.log('📝 [AccountProtection] Existing EOA in storage:', existingEoa);
      console.log('📝 [AccountProtection] New EOA from wallet:', eoaAddress);
      
      // If existing address is the same as EOA, it means the wallet was stored with EOA address
      // In this case, we should update it to smart account address
      // But if existing address is different from EOA, it might already be a smart account
      if (existingAddress && existingAddress.toLowerCase() === eoaAddress.toLowerCase()) {
        console.log('🔄 [AccountProtection] Existing address is EOA, updating to smart account');
        localStorage.setItem('veilwallet_address', result.address!);
      } else if (!existingAddress) {
        // No address stored, store the smart account address
        console.log('💾 [AccountProtection] No existing address, storing smart account address');
        localStorage.setItem('veilwallet_address', result.address!);
      } else {
        // Address exists and is different from EOA - might already be a smart account
        console.log('⚠️ [AccountProtection] Existing address is different from EOA, preserving it');
        // Still update to new smart account if it's different
        if (existingAddress.toLowerCase() !== result.address!.toLowerCase()) {
          console.log('🔄 [AccountProtection] Updating to new smart account address');
          localStorage.setItem('veilwallet_address', result.address!);
        }
      }
      
      // Always store EOA for reference
      localStorage.setItem('veilwallet_eoa', eoaAddress);
      localStorage.setItem('veilwallet_protected', 'true');
      
      console.log('✅ [AccountProtection] Final stored addresses:');
      console.log('   - Smart Account:', localStorage.getItem('veilwallet_address'));
      console.log('   - EOA:', localStorage.getItem('veilwallet_eoa'));
      
      // Create reverse lookup for smart account address so unlock can find the key
      console.log('🔗 [AccountProtection] Creating reverse lookup for smart account address...');
      try {
        const allKeys = await listEthereumKeys();
        const keyForEoa = allKeys.find(k => 
          k.address.toLowerCase() === eoaAddress.toLowerCase() || 
          k.accountAddress?.toLowerCase() === eoaAddress.toLowerCase()
        );
        
        if (keyForEoa) {
          await createAccountLookup(result.address!, keyForEoa.id);
          console.log('✅ [AccountProtection] Reverse lookup created for smart account');
        } else {
          console.warn('⚠️ [AccountProtection] Could not find key for EOA to create reverse lookup');
        }
      } catch (lookupError) {
        console.error('❌ [AccountProtection] Failed to create reverse lookup:', lookupError);
        // Don't fail the whole operation if lookup creation fails
      }
      
      console.log('✅ [AccountProtection] Protection complete!');

      return {
        success: true,
        smartAccountAddress: result.address,
      };
    } catch (error: any) {
      console.error('❌ [AccountProtection] Error protecting account:', error);
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

