'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useWallet } from '@/hooks/useWallet';
import { ethers } from 'ethers';
import { blockchainService } from '@/services/blockchain.service';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function PopupPage() {
  const router = useRouter();
  const { walletAddress, isUnlocked, loading: authLoading, lock } = useWalletAuth();
  const { balance, transactions, loading: walletLoading, refreshBalance } = useWallet(walletAddress);
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [isSmartAccount, setIsSmartAccount] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!walletAddress) {
        router.push('/wallet/create');
      } else if (!isUnlocked) {
        router.push('/wallet/unlock');
      }
    }
  }, [authLoading, walletAddress, isUnlocked, router]);

  useEffect(() => {
    if (walletAddress && isUnlocked) {
      const loadData = async () => {
        try {
          // Check if it's a smart account
          const isContract = await blockchainService.isContract(walletAddress);
          setIsSmartAccount(isContract);
          
          // Get native balance
          const bal = await blockchainService.getBalance(walletAddress);
          setNativeBalance(ethers.formatEther(bal));
        } catch (error) {
          console.error('Error loading wallet data:', error);
        }
      };
      loadData();
    }
  }, [walletAddress, isUnlocked]);

  const copyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
    }
  };

  if (authLoading) {
    return (
      <div className="w-[400px] h-[600px] flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" style={{ width: '400px', height: '600px' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  if (!walletAddress || !isUnlocked) {
    return (
      <div className="w-[400px] h-[600px] flex items-center justify-center bg-white dark:bg-gray-900" style={{ width: '400px', height: '600px' }}>
        <div className="text-center p-4">
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  const totalBalance = balance 
    ? (parseFloat(balance.transparent || '0') + parseFloat(balance.private || '0')).toFixed(4)
    : '0.0000';

  return (
    <div 
      className="w-[400px] min-w-[400px] h-[600px] min-h-[600px] max-h-[600px] bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 overflow-hidden flex flex-col" 
      style={{ 
        width: '400px', 
        height: '600px', 
        minWidth: '400px', 
        minHeight: '600px',
        maxWidth: '400px',
        maxHeight: '600px',
        position: 'relative'
      }}
    >
      {/* Premium Header with Glassmorphism */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 pb-8">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">VeilWallet</h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs text-white/80">{isSmartAccount ? 'Smart Account' : 'EOA'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyAddress}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                title="Copy Address"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  lock();
                  router.push('/wallet/unlock');
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                title="Lock Wallet"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Address Display */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/60 font-medium mb-1">Wallet Address</p>
              <button onClick={copyAddress} className="text-white/60 hover:text-white transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="font-mono text-sm text-white break-all">{walletAddress}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 -mt-4">
          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Balance */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBalance}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MNT</p>
            </div>
            
            {/* Native Balance */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Native</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{parseFloat(nativeBalance).toFixed(4)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MNT</p>
            </div>
          </div>

          {/* Token Balance */}
          {balance && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">VeilToken</p>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Transparent</span>
                  <span className="font-medium text-gray-900 dark:text-white">{balance.transparent || '0.0000'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Private</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">{balance.private || '0.0000'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions - Enhanced */}
          <div className="grid grid-cols-3 gap-2">
            <Link href="/wallet/send" className="group">
              <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 group-hover:bg-white/30 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">Send</p>
              </div>
            </Link>
            <Link href="/wallet/receive" className="group">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 group-hover:bg-white/30 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7l-7 7-7-7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">Receive</p>
              </div>
            </Link>
            <Link href="/wallet/transactions" className="group">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 group-hover:bg-white/30 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">History</p>
              </div>
            </Link>
          </div>

          {/* Recent Transactions - Enhanced */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                <Link href="/wallet/transactions">
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                    View All →
                  </button>
                </Link>
              </div>
            </div>
            <div className="p-2">
              {walletLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No transactions yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start by sending or receiving tokens</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {transactions.slice(0, 4).map((tx) => (
                    <Link
                      key={tx.id}
                      href={`/wallet/transactions#${tx.id}`}
                      className="block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            tx.type === 'receive' 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : tx.type === 'private'
                              ? 'bg-purple-100 dark:bg-purple-900/30'
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            {tx.type === 'receive' ? (
                              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7l-7 7-7-7" />
                              </svg>
                            ) : tx.type === 'private' ? (
                              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {tx.type === 'receive' ? 'Received' : tx.type === 'private' ? 'Private Transfer' : 'Sent'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className={`text-sm font-bold ${
                            tx.type === 'receive' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {tx.type === 'receive' ? '+' : '-'} {tx.amount}
                          </p>
                          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                            tx.status === 'confirmed' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : tx.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {tx.status === 'confirmed' && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            {tx.status}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Network & Settings Footer */}
          <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Mantle Sepolia</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshBalance}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Refresh"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <Link href="/dashboard">
                <button
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Open Full Dashboard"
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

