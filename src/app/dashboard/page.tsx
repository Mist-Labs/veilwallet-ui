'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useWallet } from '@/hooks/useWallet';
import { BalanceCard } from '@/components/wallet/BalanceCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { walletAddress, isUnlocked, loading: authLoading, lock } = useWalletAuth();
  const { balance, transactions, loading: walletLoading, refreshBalance } = useWallet(
    walletAddress
  );

  useEffect(() => {
    if (!authLoading) {
      if (!walletAddress) {
        router.push('/');
      } else if (!isUnlocked) {
        router.push('/wallet/unlock');
      }
    }
  }, [authLoading, walletAddress, isUnlocked, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (!walletAddress || !isUnlocked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VeilWallet</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}
              </p>
            </div>
            <Button variant="outline" onClick={() => {
              lock();
              router.push('/wallet/unlock');
            }}>
              Lock Wallet
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Balance Card */}
          <BalanceCard balance={balance} loading={walletLoading} />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/wallet/send">
              <Button variant="primary" className="w-full h-20 text-lg">
                Send
              </Button>
            </Link>
            <Link href="/wallet/receive">
              <Button variant="secondary" className="w-full h-20 text-lg">
                Receive
              </Button>
            </Link>
            <Link href="/wallet/transactions">
              <Button variant="outline" className="w-full h-20 text-lg">
                Transactions
              </Button>
            </Link>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Transactions
            </h2>
            {walletLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {tx.type === 'send' ? 'Sent' : tx.type === 'receive' ? 'Received' : 'Transfer'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {tx.type === 'send' ? '-' : '+'} {tx.amount} MNT
                      </p>
                      <p className={`text-sm ${
                        tx.status === 'confirmed' ? 'text-green-600' :
                        tx.status === 'pending' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

