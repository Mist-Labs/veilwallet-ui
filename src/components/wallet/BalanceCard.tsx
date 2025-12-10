'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { formatTokenAmount } from '@/utils/format';
import type { WalletBalance } from '@/types';

interface BalanceCardProps {
  balance: WalletBalance | null;
  loading?: boolean;
}

export function BalanceCard({ balance, loading }: BalanceCardProps) {
  if (loading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card>
        <p className="text-gray-500 dark:text-gray-400">No balance data available</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Balance</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatTokenAmount(balance.total)} MNT
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transparent</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatTokenAmount(balance.transparent)} MNT
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Private</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatTokenAmount(balance.private)} MNT
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

