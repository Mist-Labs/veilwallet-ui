'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { keyService } from '@/services/key.service';
import { walletService } from '@/services/wallet.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function CreateWalletPage() {
  // Enable dev mode automatically for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Auto-enable dev mode if not in extension context
      if (!((typeof chrome !== 'undefined' && chrome.storage) || (typeof browser !== 'undefined' && browser.storage))) {
        (window as any).__VEILWALLET_DEV_MODE__ = true;
      }
    }
  }, []);
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'password' | 'creating' | 'success' | 'mnemonic'>('password');
  const [walletAddress, setWalletAddress] = useState('');
  const [mnemonic, setMnemonic] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setStep('creating');

    try {
      // Generate Ethereum key pair (self-custodial)
      const keyResult = await keyService.generateEthereumKey(password);
      
      if (!keyResult.success || !keyResult.data) {
        setError(keyResult.error || 'Failed to generate wallet');
        setStep('password');
        return;
      }

      const { address, mnemonic: mnemonicPhrase } = keyResult.data;
      setWalletAddress(address);
      setMnemonic(mnemonicPhrase);

      // Store address immediately for lookup
      if (typeof window !== 'undefined') {
        localStorage.setItem('veilwallet_address', address);
      }

      // Show mnemonic first, then success
      setStep('mnemonic');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
      setStep('password');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // Store wallet address in session/localStorage for "unlock" flow
    if (typeof window !== 'undefined') {
      localStorage.setItem('veilwallet_address', walletAddress);
    }
    router.push('/dashboard');
  };

  if (step === 'mnemonic') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
        <Card className="max-w-md w-full">
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Save Your Seed Phrase</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Write down these 12 words in order. Keep them safe and secret.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-yellow-400 dark:border-yellow-600">
              <div className="grid grid-cols-3 gap-2 font-mono text-sm">
                {mnemonic.split(' ').map((word, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400 text-xs">{index + 1}.</span>
                    <span className="text-gray-900 dark:text-white">{word}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-400">
                <strong>Warning:</strong> Never share your seed phrase. Anyone with these words can access your wallet.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(mnemonic);
                }}
                className="flex-1"
              >
                Copy Seed Phrase
              </Button>
              <Button 
                onClick={() => setStep('success')} 
                className="flex-1"
              >
                I've Saved It
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
        <Card className="max-w-md w-full">
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet Created!</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Your self-custodial wallet is ready
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Wallet Address
              </label>
              <div className="font-mono text-sm break-all text-gray-900 dark:text-white">
                {walletAddress}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                <strong>Important:</strong> Save your password securely. If you lose it, you cannot recover your wallet.
              </p>
            </div>

            <Button onClick={handleContinue} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create Your Wallet
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Generate a new self-custodial wallet. Your keys stay on your device.
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              helperText="This password encrypts your private key. You'll need it to unlock your wallet."
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
            <Button type="submit" className="w-full" isLoading={loading || step === 'creating'} disabled={loading || step === 'creating'}>
              {step === 'creating' ? 'Creating Wallet...' : 'Create Wallet'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have a wallet?{' '}
              <Link href="/wallet/unlock" className="font-medium text-black dark:text-white hover:underline">
                Unlock Wallet
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

