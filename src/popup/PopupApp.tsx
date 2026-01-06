import { useEffect, useState } from 'react';
import { ProtectionBanner } from '@/components/ProtectionBanner';
import { PasswordModal } from '@/components/ui/PasswordModal';
import { Toast } from '@/components/ui/Toast';

export default function PopupApp() {
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [mntBalance, setMntBalance] = useState<string>('0.00');
  const [veilBalance, setVeilBalance] = useState<string>('0.00');
  const [showProtectionBanner, setShowProtectionBanner] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    // Check if user has a wallet
    const address = localStorage.getItem('veilwallet_address');
    const unlocked = sessionStorage.getItem('veilwallet_unlocked') === 'true';
    
    if (!address) {
      // No wallet, redirect to create
      window.location.href = 'wallet-create.html';
    } else if (!unlocked) {
      // Wallet exists but locked, redirect to unlock
      window.location.href = 'wallet-unlock.html';
    } else {
      // Wallet is unlocked, show dashboard
      setWalletAddress(address);
      checkProtectionStatus();
      loadBalances(address);
      setLoading(false);
    }
  }, []);

  const checkProtectionStatus = async () => {
    const { accountProtectionService } = await import('@/services/accountProtection.service');
    const shouldShow = accountProtectionService.shouldShowProtectionPrompt();
    setShowProtectionBanner(shouldShow);
    setIsProtected(!shouldShow);
  };

  const handleProtect = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    try {
      const { keyService } = await import('@/services/key.service');
      let eoaAddress = localStorage.getItem('veilwallet_eoa');
      
      // If EOA not stored (old wallet), try to derive it from wallet address
      if (!eoaAddress) {
        const smartAddress = localStorage.getItem('veilwallet_address');
        if (!smartAddress) {
          setToast({ message: 'Wallet address not found', type: 'error' });
          setShowPasswordModal(false);
          return;
        }

        // Try to get key by smart account address first
        const keyResult = await keyService.getEthereumKeyByAccount(smartAddress, password);
        if (keyResult.success && keyResult.data) {
          eoaAddress = keyResult.data.address;
          localStorage.setItem('veilwallet_eoa', eoaAddress);
        } else {
          setToast({ message: 'Could not find wallet keys. Please restore your wallet.', type: 'error' });
          setShowPasswordModal(false);
          return;
        }
      }

      const keyResult = await keyService.getEthereumKeyByAccount(eoaAddress, password);
      if (!keyResult.success || !keyResult.data) {
        setToast({ message: 'Invalid password', type: 'error' });
        setShowPasswordModal(false);
        return;
      }

      const { accountProtectionService } = await import('@/services/accountProtection.service');
      const result = await accountProtectionService.protectAccount(keyResult.data.privateKey);

      if (result.success) {
        setToast({ message: '✅ Privacy protection enabled!', type: 'success' });
        setShowProtectionBanner(false);
        setIsProtected(true);
        setShowPasswordModal(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setToast({ message: result.error || 'Failed to enable protection', type: 'error' });
        setShowPasswordModal(false);
      }
    } catch (error: any) {
      console.error('Protection error:', error);
      setToast({ message: error.message || 'An error occurred', type: 'error' });
      setShowPasswordModal(false);
    }
  };

  const handleDismiss = () => {
    const { accountProtectionService } = require('@/services/accountProtection.service');
    accountProtectionService.dismissProtectionPrompt();
    setShowProtectionBanner(false);
  };

  const loadBalances = async (address: string) => {
    try {
      const { smartAccountService } = await import('@/services/smartAccount.service');
      const { walletService } = await import('@/services/wallet.service');
      
      // Get MNT balance
      const mnt = await smartAccountService.getMNTBalance(address);
      setMntBalance(parseFloat(mnt).toFixed(4));
      
      // Get VEIL token balance
      const veilResult = await walletService.getVeilTokenBalance(address);
      if (veilResult.success && veilResult.data) {
        setVeilBalance(veilResult.data.balance);
      }
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ width: '400px', height: '600px' }} className="flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  return (
    <div style={{ width: '400px', height: '600px' }} className="flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            VeilWallet
          </h1>
          {isProtected && (
            <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-1 rounded-full">
              <span className="text-xs">🛡️</span>
              <span className="text-xs text-green-400">Protected</span>
            </div>
          )}
        </div>
        <p className="text-xs text-white/60 truncate">{walletAddress}</p>
      </div>

      {/* Protection Banner */}
      {showProtectionBanner && (
        <ProtectionBanner onProtect={handleProtect} onDismiss={handleDismiss} />
      )}

      {/* Balance Section */}
      <div className="p-6 flex-1 overflow-auto">
        {/* Main Balance Card */}
        <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-3xl p-6 mb-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-white/60 uppercase tracking-wider">Total Balance</span>
            <button className="text-white/60 hover:text-white/80">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
          <div className="mb-4">
            <h2 className="text-5xl font-bold mb-2">{mntBalance}</h2>
            <p className="text-lg text-white/80">MNT</p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div>
              <span className="text-white/60">VEIL:</span>
              <span className="ml-2 font-semibold">{veilBalance}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button 
            onClick={() => window.location.href = 'send.html'}
            className="group bg-white/5 hover:bg-white/10 active:bg-white/15 backdrop-blur-sm rounded-2xl p-5 transition-all duration-200 border border-white/5 hover:border-white/10"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="text-sm font-medium">Send</div>
          </button>
          <button 
            onClick={() => window.location.href = 'receive.html'}
            className="group bg-white/5 hover:bg-white/10 active:bg-white/15 backdrop-blur-sm rounded-2xl p-5 transition-all duration-200 border border-white/5 hover:border-white/10"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-sm font-medium">Receive</div>
          </button>
          <button 
            onClick={() => window.location.href = 'history.html'}
            className="group bg-white/5 hover:bg-white/10 active:bg-white/15 backdrop-blur-sm rounded-2xl p-5 transition-all duration-200 border border-white/5 hover:border-white/10"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm font-medium">History</div>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Quick Stats</h3>
            <span className="text-xs text-white/60">Last 24h</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/60 mb-1">Transactions</p>
              <p className="text-lg font-bold">0</p>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-1">Privacy Txns</p>
              <p className="text-lg font-bold text-purple-400">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => window.location.href = 'settings.html'}
            className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl py-2.5 text-sm transition-all flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
          <button 
            onClick={() => {
              sessionStorage.removeItem('veilwallet_unlocked');
              window.location.reload();
            }}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl py-2.5 text-sm transition-all flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handlePasswordConfirm}
        title="Enable Protection"
        description="Enter your password to deploy smart account and enable privacy features"
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

