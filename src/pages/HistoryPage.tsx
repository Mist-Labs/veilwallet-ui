import { useState, useEffect } from 'react';
import { NETWORK_CONFIG } from '@/config/constants';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  type: 'send' | 'receive' | 'private';
  status: 'pending' | 'confirmed' | 'failed';
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    // In production, fetch from indexer or blockchain
    // For now, check localStorage for recent txns
    const stored = localStorage.getItem('veilwallet_transactions');
    if (stored) {
      setTransactions(JSON.parse(stored));
    }
    setLoading(false);
  };

  const getExplorerUrl = (hash: string) => {
    return `${NETWORK_CONFIG.EXPLORER}/tx/${hash}`;
  };

  if (loading) {
    return (
      <div style={{ width: '400px', height: '600px' }} className="flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  return (
    <div style={{ width: '400px', height: '600px' }} className="flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => window.location.href = 'popup.html'} 
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold ml-2">Transaction History</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-sm text-white/60 mb-6">
              Your transaction history will appear here once you send or receive tokens.
            </p>
            <button
              onClick={() => window.location.href = 'send.html'}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all"
            >
              Send Tokens
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <button
                key={index}
                onClick={() => window.open(getExplorerUrl(tx.hash), '_blank')}
                className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 transition-all text-left"
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'send' ? 'bg-purple-500/20' :
                    tx.type === 'receive' ? 'bg-green-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    {tx.type === 'send' ? (
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    ) : tx.type === 'receive' ? (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold capitalize">{tx.type} {tx.type === 'private' && '🔒'}</span>
                      <span className="font-semibold">{tx.value} VEIL</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span className="truncate">{tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}</span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

