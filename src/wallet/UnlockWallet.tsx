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
      const storedAddress = localStorage.getItem('veilwallet_address');

      if (!storedAddress) {
        setError('No wallet found. Please create a new wallet.');
        setLoading(false);
        return;
      }

      const keyResult = await keyService.getEthereumKeyByAccount(storedAddress, password);
      
      if (!keyResult.success || !keyResult.data) {
        setError(keyResult.error || 'Invalid password');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('veilwallet_unlocked', 'true');
      window.location.href = 'popup.html';
    } catch (err) {
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

