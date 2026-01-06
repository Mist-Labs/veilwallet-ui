import { useState } from 'react';
import { NETWORK_CONFIG } from '@/config/constants';
import { Modal } from '@/components/ui/Modal';
import { PasswordModal } from '@/components/ui/PasswordModal';
import { Toast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const address = localStorage.getItem('veilwallet_address') || '';
  const eoaAddress = localStorage.getItem('veilwallet_eoa') || '';
  const isProtected = localStorage.getItem('veilwallet_protected') === 'true';

  const handleExportSeed = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    try {
      const { keyService } = await import('@/services/key.service');
      const result = await keyService.getEthereumKeyByAccount(eoaAddress, password);
      
      if (result.success && result.data) {
        setSeedPhrase(result.data.mnemonic);
        setShowSeedPhrase(true);
        setShowPasswordModal(false);
      } else {
        setToast({ message: 'Invalid password', type: 'error' });
        setShowPasswordModal(false);
      }
    } catch (error: any) {
      setToast({ message: error.message || 'An error occurred', type: 'error' });
      setShowPasswordModal(false);
    }
  };

  const handleResetWallet = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'wallet-create.html';
  };

  return (
    <div style={{ width: '400px', height: '600px' }} className="flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center">
        <button 
          onClick={() => window.location.href = 'popup.html'} 
          className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold ml-2">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Account Info */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Account Info</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <p className="text-white/60 mb-1">Smart Account</p>
              <p className="font-mono bg-white/5 p-2 rounded-lg break-all">{address}</p>
            </div>
            {eoaAddress && (
              <div>
                <p className="text-white/60 mb-1">EOA Address</p>
                <p className="font-mono bg-white/5 p-2 rounded-lg break-all">{eoaAddress}</p>
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <span className="text-white/60">Protection Status</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                isProtected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {isProtected ? '🛡️ Protected' : '⚠️ Unprotected'}
              </span>
            </div>
          </div>
        </div>

        {/* Network */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span>Network</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/60">Network</span>
              <span className="font-medium">{NETWORK_CONFIG.CHAIN_NAME}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Chain ID</span>
              <span className="font-mono">{NETWORK_CONFIG.CHAIN_ID}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">RPC</span>
              <button 
                onClick={() => window.open(NETWORK_CONFIG.RPC_URL, '_blank')}
                className="text-blue-400 hover:text-blue-300 truncate max-w-[200px]"
              >
                {NETWORK_CONFIG.RPC_URL.replace('https://', '')}
              </button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold mb-3 flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Security</span>
          </h3>
          <div className="space-y-2">
            <button
              onClick={handleExportSeed}
              className="w-full bg-white/5 hover:bg-white/10 rounded-xl p-3 text-left text-sm transition-colors"
            >
              <div className="flex items-center justify-between">
                <span>Export Seed Phrase</span>
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button
              onClick={() => setToast({ message: 'Guardian management coming soon!', type: 'info' })}
              className="w-full bg-white/5 hover:bg-white/10 rounded-xl p-3 text-left text-sm transition-colors"
            >
              <div className="flex items-center justify-between">
                <span>Manage Guardians</span>
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button
              onClick={() => setToast({ message: 'Session key management coming soon!', type: 'info' })}
              className="w-full bg-white/5 hover:bg-white/10 rounded-xl p-3 text-left text-sm transition-colors"
            >
              <div className="flex items-center justify-between">
                <span>Session Keys</span>
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold mb-3">About</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/60">Version</span>
              <span>0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Website</span>
              <a href="https://veilwallet.com" target="_blank" className="text-blue-400 hover:text-blue-300">
                veilwallet.com
              </a>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-4 border border-red-500/20">
          <h3 className="text-sm font-semibold mb-3 text-red-400">Danger Zone</h3>
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl p-3 text-sm transition-colors"
          >
            Reset Wallet
          </button>
        </div>
      </div>

      {/* Modals */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handlePasswordConfirm}
        title="Export Seed Phrase"
        description="Enter your password to view your seed phrase"
      />

      <Modal
        isOpen={showSeedPhrase}
        onClose={() => {
          setShowSeedPhrase(false);
          setSeedPhrase('');
        }}
        title="Your Seed Phrase"
        showCancel={false}
        confirmText="Done"
        onConfirm={() => {
          setShowSeedPhrase(false);
          setSeedPhrase('');
        }}
      >
        <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-3 mb-4">
          <p className="text-xs text-yellow-300">
            ⚠️ <strong>Warning:</strong> Never share your seed phrase. Anyone with these words can access your wallet.
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="grid grid-cols-3 gap-2 text-sm font-mono">
            {seedPhrase.split(' ').map((word, i) => (
              <div key={i} className="bg-white/5 p-2 rounded">
                <span className="text-white/60 text-xs">{i + 1}.</span> {word}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Wallet?"
        confirmText="Reset Wallet"
        cancelText="Cancel"
        onConfirm={handleResetWallet}
        variant="danger"
      >
        <div className="space-y-3">
          <p className="text-sm">
            This will permanently delete all wallet data from this device.
          </p>
          <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3">
            <p className="text-xs text-red-300">
              ⚠️ <strong>Warning:</strong> Make sure you have backed up your seed phrase before proceeding. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>

      {/* Toast */}
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

