import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordModal } from '@/components/ui/PasswordModal';
import { Toast } from '@/components/ui/Toast';

type TransferType = 'standard' | 'private';

export default function SendPage() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [transferType, setTransferType] = useState<TransferType>('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Get wallet info
      const address = localStorage.getItem('veilwallet_address');
      if (!address) {
        throw new Error('Wallet not found');
      }

      // Get private key from encrypted storage
      const { keyService } = await import('@/services/key.service');
      const eoaAddress = localStorage.getItem('veilwallet_eoa');
      
      if (!eoaAddress) {
        throw new Error('EOA address not found');
      }

      const keyResult = await keyService.getEthereumKeyByAccount(eoaAddress, password);
      if (!keyResult.success || !keyResult.data) {
        setToast({ message: 'Invalid password', type: 'error' });
        setLoading(false);
        setShowPasswordModal(false);
        return;
      }

      const { privateKey } = keyResult.data;
      setShowPasswordModal(false);

      if (transferType === 'private') {
        // Send private transfer
        const { privateTransferService } = await import('@/services/privateTransfer.service');
        const result = await privateTransferService.sendPrivateTransfer(
          privateKey,
          recipient,
          amount
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to send private transfer');
        }

        setTxHash(result.txHash || '');
        setSuccess(true);
      } else {
        // Send standard transfer through smart account
        const { smartAccountService } = await import('@/services/smartAccount.service');
        const { ethers } = await import('ethers');
        const { CONTRACT_ADDRESSES } = await import('@/config/constants');
        const { VEIL_TOKEN_ABI } = await import('@/lib/abis');

        // Encode transfer call
        const iface = new ethers.Interface(VEIL_TOKEN_ABI);
        const data = iface.encodeFunctionData('transfer', [
          recipient,
          ethers.parseEther(amount),
        ]);

        // Execute through smart account
        const result = await smartAccountService.executeTransaction(
          address,
          privateKey,
          CONTRACT_ADDRESSES.veilToken,
          BigInt(0),
          data
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to send transfer');
        }

        setTxHash(result.txHash || '');
        setSuccess(true);
        setToast({ message: 'Transaction sent successfully!', type: 'success' });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send transaction');
      setToast({ message: err.message || 'Failed to send transaction', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ width: '400px', height: '600px' }} className="flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Transaction Sent!</h2>
              <p className="text-sm text-white/60">
                {transferType === 'private' ? '🔒 Private transfer' : 'Transfer'} successful
              </p>
            </div>
            {txHash && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <p className="text-xs text-white/60 mb-2">Transaction Hash</p>
                <p className="text-xs font-mono break-all text-white/90">{txHash}</p>
              </div>
            )}
            <div className="flex space-x-3">
              <Button 
                onClick={() => window.location.href = 'popup.html'} 
                variant="outline"
                className="flex-1"
              >
                Done
              </Button>
              <Button 
                onClick={() => window.location.href = 'history.html'}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500"
              >
                View History
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '400px', height: '600px' }} className="flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="p-4 border-b border-white/10 flex items-center">
        <button 
          onClick={() => window.location.href = 'popup.html'} 
          className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold ml-2">Send Tokens</h1>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transfer Type Selector */}
          <div className="space-y-3">
            <label className="text-sm text-white/60 uppercase tracking-wider">Transfer Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTransferType('standard')}
                className={`p-4 rounded-2xl border transition-all ${
                  transferType === 'standard'
                    ? 'bg-gradient-to-br from-white/20 to-white/10 border-white/40 scale-105'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105'
                }`}
              >
                <div className="text-base font-bold mb-1">Standard</div>
                <div className="text-xs text-white/60">Public on-chain</div>
              </button>
              <button
                type="button"
                onClick={() => setTransferType('private')}
                className={`p-4 rounded-2xl border transition-all ${
                  transferType === 'private'
                    ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/20 border-purple-400/40 scale-105'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105'
                }`}
              >
                <div className="text-base font-bold mb-1">🔒 Private</div>
                <div className="text-xs text-white/60">Amount hidden</div>
              </button>
            </div>
          </div>

          <Input
            label="Recipient Address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            required
            className="bg-white/10 border-white/20 text-white"
          />

          <Input
            label="Amount (VEIL)"
            type="number"
            step="0.0001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            className="bg-white/10 border-white/20 text-white"
          />

          {transferType === 'private' && (
            <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3 text-xs text-white/80">
              <strong>🔒 Privacy Mode:</strong> The transfer amount will be hidden on-chain. Only you and the recipient can see it.
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={loading}
            disabled={loading || !recipient || !amount}
          >
            {loading ? 'Sending...' : 'Send Tokens'}
          </Button>
        </form>
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handlePasswordConfirm}
        title="Confirm Transaction"
        description="Enter your password to send tokens"
        loading={loading}
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

