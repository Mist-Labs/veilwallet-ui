import { useState } from 'react';
import { keyService } from '@/services/key.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function UnlockWallet() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔓 [UnlockWallet] Starting unlock process...');
      
      // First, try to get the EOA address (this is what the key is stored with)
      let lookupAddress = localStorage.getItem('veilwallet_eoa');
      const smartAccountAddress = localStorage.getItem('veilwallet_address');
      
      console.log('🔍 [UnlockWallet] EOA from storage:', lookupAddress);
      console.log('🔍 [UnlockWallet] Smart account from storage:', smartAccountAddress);
      
      if (!lookupAddress && !smartAccountAddress) {
        console.error('❌ [UnlockWallet] No wallet found in storage');
        setError('No wallet found. Please create a new wallet.');
        setLoading(false);
        return;
      }

      // If no EOA found, try using smart account address (for backwards compatibility)
      if (!lookupAddress) {
        console.log('⚠️ [UnlockWallet] No EOA found, using smart account address');
        lookupAddress = smartAccountAddress!;
      }

      console.log('🔑 [UnlockWallet] Attempting to retrieve key with address:', lookupAddress);
      const keyResult = await keyService.getEthereumKeyByAccount(lookupAddress!, password);
      
      if (!keyResult.success || !keyResult.data) {
        console.error('❌ [UnlockWallet] Key retrieval failed:', keyResult.error);
        
        // If lookup by EOA failed and we have a smart account address, try that
        if (lookupAddress !== smartAccountAddress && smartAccountAddress) {
          console.log('🔄 [UnlockWallet] Retrying with smart account address...');
          const retryResult = await keyService.getEthereumKeyByAccount(smartAccountAddress, password);
          
          if (retryResult.success && retryResult.data) {
            console.log('✅ [UnlockWallet] Key found using smart account address');
            sessionStorage.setItem('veilwallet_unlocked', 'true');
            window.location.href = 'popup.html';
            return;
          }
        }
        
        setError(keyResult.error || 'Invalid password');
        setLoading(false);
        return;
      }

      console.log('✅ [UnlockWallet] Key retrieved successfully');
      sessionStorage.setItem('veilwallet_unlocked', 'true');
      window.location.href = 'popup.html';
    } catch (err) {
      console.error('❌ [UnlockWallet] Unlock error:', err);
      setError(err instanceof Error ? err.message : 'Failed to unlock wallet');
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '400px', height: '600px' }} className="flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Unlock Your Wallet</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Enter your password
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <Button type="submit" className="w-full" isLoading={loading} disabled={loading}>
            Unlock Wallet
          </Button>
          <div className="text-center text-sm">
            <button 
              type="button"
              onClick={() => window.location.href = 'wallet-create.html'}
              className="text-gray-600 dark:text-gray-400 hover:underline"
            >
              Create New Wallet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

