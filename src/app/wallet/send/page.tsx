'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { walletService } from '@/services/wallet.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default function SendPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [transferType, setTransferType] = useState<'transparent' | 'private'>('transparent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!user?.accountAddress) {
        setError('Account address not found');
        return;
      }

      let result;
      if (transferType === 'private') {
        // For private transfer, recipient is a commitment
        result = await walletService.sendPrivateTransfer(user.accountAddress, {
          recipientCommitment: recipient,
          nullifier: '', // Will be generated
          amount,
          proof: '', // Will be generated
        });
      } else {
        result = await walletService.sendTransparentTransfer(user.accountAddress, {
          to: recipient,
          amount,
        });
      }

      if (result.success && result.data) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Transfer failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">← Back</Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Send</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transfer Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transfer Type
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setTransferType('transparent')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                    transferType === 'transparent'
                      ? 'border-black dark:border-white bg-gray-100 dark:bg-gray-700'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  Transparent
                </button>
                <button
                  type="button"
                  onClick={() => setTransferType('private')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                    transferType === 'private'
                      ? 'border-black dark:border-white bg-gray-100 dark:bg-gray-700'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  Private
                </button>
              </div>
            </div>

            {/* Recipient Input */}
            <Input
              label={transferType === 'private' ? 'Recipient Commitment' : 'Recipient Address'}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              placeholder={transferType === 'private' ? '0x...' : '0x...'}
              helperText={
                transferType === 'private'
                  ? 'Enter the commitment hash for private transfer'
                  : 'Enter the recipient wallet address'
              }
            />

            {/* Amount Input */}
            <Input
              label="Amount (MNT)"
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.0"
              min="0"
            />

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Transfer successful! Redirecting...
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={loading} disabled={loading || success}>
              Send {transferType === 'private' ? 'Private' : 'Transparent'} Transfer
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}

