'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { keyService } from '@/services/key.service';
import { generateWalletFromMnemonic, validateMnemonic } from '@/utils/ethereumKeyGeneration';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function RestoreWalletPage() {
  const router = useRouter();
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate mnemonic
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12) {
      setError('Seed phrase must be 12 words');
      return;
    }

    if (!validateMnemonic(mnemonic.trim())) {
      setError('Invalid seed phrase. Please check your words.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      // Generate wallet from mnemonic
      const { address } = generateWalletFromMnemonic(mnemonic.trim());
      
      // Generate and store the key (this will encrypt it)
      const keyResult = await keyService.generateEthereumKeyFromMnemonic(mnemonic.trim(), password, address);
      
      if (!keyResult.success || !keyResult.data) {
        setError(keyResult.error || 'Failed to restore wallet');
        setLoading(false);
        return;
      }

      // Store address for unlock flow
      if (typeof window !== 'undefined') {
        localStorage.setItem('veilwallet_address', address);
        sessionStorage.setItem('veilwallet_unlocked', 'true');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore wallet');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Restore Wallet
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your 12-word seed phrase to restore your wallet
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seed Phrase (12 words)
              </label>
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="word1 word2 word3 ... word12"
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter your 12-word recovery phrase separated by spaces
              </p>
            </div>
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              helperText="Set a password to encrypt your restored wallet"
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <Button type="submit" className="w-full" isLoading={loading} disabled={loading}>
              Restore Wallet
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have a seed phrase?{' '}
              <Link href="/wallet/create" className="font-medium text-black dark:text-white hover:underline">
                Create New Wallet
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

