'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { walletService } from '@/services/wallet.service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatAddress } from '@/utils/format';
import Link from 'next/link';

export default function ReceivePage() {
  const { user, isAuthenticated } = useAuth();
  const [commitment, setCommitment] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleGenerateCommitment = async () => {
    setError('');
    setLoading(true);
    try {
      // For MVP, we'll generate a simple commitment
      // In production, this would use the actual commitment generation
      const result = await walletService.generateCommitment('0', user.accountAddress);
      if (result.success && result.data) {
        setCommitment(result.data.hash);
      } else {
        setError(result.error || 'Failed to generate commitment');
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receive</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Account Address */}
        <Card title="Your Wallet Address">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Account Address</p>
              <p className="font-mono text-lg text-gray-900 dark:text-white break-all">
                {user.accountAddress}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(user.accountAddress);
              }}
            >
              Copy Address
            </Button>
          </div>
        </Card>

        {/* Private Transfer Commitment */}
        <Card title="Receive Private Transfer">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate a commitment for receiving private VeilToken transfers. Share this commitment with the sender.
            </p>
            {commitment ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Commitment Hash</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                    {commitment}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(commitment);
                    }}
                  >
                    Copy Commitment
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setCommitment(null)}
                  >
                    Generate New
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleGenerateCommitment} isLoading={loading} disabled={loading}>
                Generate Commitment
              </Button>
            )}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

