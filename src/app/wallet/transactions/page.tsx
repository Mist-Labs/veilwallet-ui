'use client';

import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { Card } from '@/components/ui/Card';
import { formatAddress, formatRelativeTime, formatTokenAmount } from '@/utils/format';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function TransactionsPage() {
  const { user, isAuthenticated } = useAuth();
  const { transactions, loading, refreshTransactions } = useWallet(user?.accountAddress || null);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">← Back</Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => refreshTransactions()}>
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No transactions yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'receive'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {tx.type === 'receive' ? '↓' : '↑'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {tx.type === 'receive' ? 'Received' : tx.type === 'private' ? 'Private Transfer' : 'Sent'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(tx.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="ml-13 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        {tx.type === 'receive' ? 'From' : 'To'}: {formatAddress(tx.type === 'receive' ? tx.from : tx.to)}
                      </p>
                      {tx.transactionHash && (
                        <p className="font-mono text-xs mt-1">
                          {tx.transactionHash.slice(0, 10)}...{tx.transactionHash.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold text-lg ${
                        tx.type === 'receive' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {tx.type === 'receive' ? '+' : '-'} {formatTokenAmount(tx.amount)} MNT
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        tx.status === 'confirmed'
                          ? 'text-green-600 dark:text-green-400'
                          : tx.status === 'pending'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

