'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { keyService } from '@/services/key.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function UnlockWalletPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get stored wallet address
      const storedAddress = typeof window !== 'undefined' 
        ? localStorage.getItem('veilwallet_address')
        : null;

      if (!storedAddress) {
        setError('No wallet found. Please create a new wallet.');
        setLoading(false);
        return;
      }

      // Try to unlock by getting the key (validates password)
      const keyResult = await keyService.getEthereumKeyByAccount(storedAddress, password);
      
      if (!keyResult.success || !keyResult.data) {
        setError(keyResult.error || 'Invalid password');
        setLoading(false);
        return;
      }

      // Password is correct, mark as unlocked and redirect to dashboard
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('veilwallet_unlocked', 'true');
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock wallet');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Unlock Your Wallet
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your password to access your self-custodial wallet
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              helperText="This is the password you set when creating your wallet"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <Button type="submit" className="w-full" isLoading={loading} disabled={loading}>
              Unlock Wallet
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have a wallet?{' '}
              <Link href="/wallet/create" className="font-medium text-black dark:text-white hover:underline">
                Create New Wallet
              </Link>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Have a seed phrase?{' '}
              <Link href="/wallet/restore" className="font-medium text-black dark:text-white hover:underline">
                Restore Wallet
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

