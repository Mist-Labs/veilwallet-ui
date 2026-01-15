import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordModal } from '@/components/ui/PasswordModal';
import { Toast } from '@/components/ui/Toast';
import { TokenSelector } from '@/components/ui/TokenSelector';
import { tokenService, type TokenInfo } from '@/services/token.service';
import { nftService } from '@/services/nft.service';
import { NETWORK_CONFIG, CONTRACT_ADDRESSES } from '@/config/constants';

type TransferType = 'standard' | 'private';
type TokenType = 'native' | 'erc20' | 'erc721' | 'erc1155';

export default function SendPage() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenId, setTokenId] = useState(''); // For ERC721/ERC1155
  const [selectedToken, setSelectedToken] = useState<string | null>(null); // null = native token
  const [tokenType, setTokenType] = useState<TokenType>('native');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [transferType, setTransferType] = useState<TransferType>('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [accountAddress, setAccountAddress] = useState<string>('');

  useEffect(() => {
    // Get current account address
    const selectedAccount = localStorage.getItem('veilwallet_selected_account') || 'smart';
    const smartAccount = localStorage.getItem('veilwallet_address');
    const eoaAddress = localStorage.getItem('veilwallet_eoa');
    
    const address = selectedAccount === 'smart' && smartAccount 
      ? smartAccount 
      : (eoaAddress || smartAccount || '');
    
    setAccountAddress(address);
  }, []);

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
      // Get selected account and addresses
      const selectedAccount = localStorage.getItem('veilwallet_selected_account') || 'smart';
      const smartAccount = localStorage.getItem('veilwallet_address');
      const eoaAddress = localStorage.getItem('veilwallet_eoa');
      
      // Determine which address to use for the transaction
      const fromAddress = selectedAccount === 'smart' && smartAccount 
        ? smartAccount 
        : (eoaAddress || smartAccount);
      
      if (!fromAddress) {
        throw new Error('Wallet not found');
      }

      // Always use EOA to get private key (keys are stored with EOA)
      if (!eoaAddress) {
        throw new Error('EOA address not found');
      }

      const { keyService } = await import('@/services/key.service');
      const keyResult = await keyService.getEthereumKeyByAccount(eoaAddress, password);
      if (!keyResult.success || !keyResult.data) {
        setToast({ message: 'Invalid password', type: 'error' });
        setLoading(false);
        setShowPasswordModal(false);
        return;
      }

      const { privateKey } = keyResult.data;
      setShowPasswordModal(false);

      // Handle different token types
      if (tokenType === 'erc721') {
        // ERC721 NFT transfer
        if (!selectedToken || !tokenId) {
          throw new Error('NFT contract address and token ID required');
        }

        const isEOA = selectedAccount === 'eoa' || 
          (fromAddress.toLowerCase() === eoaAddress?.toLowerCase());

        if (isEOA) {
          const result = await nftService.transferERC721(
            selectedToken,
            privateKey,
            recipient,
            tokenId
          );

          if (!result.success) {
            throw new Error(result.error || 'Failed to transfer NFT');
          }

          setTxHash(result.txHash || '');
          setSuccess(true);
          setToast({ message: 'NFT transferred successfully!', type: 'success' });
        } else {
          // Through smart account
          if (!smartAccount || fromAddress.toLowerCase() !== smartAccount.toLowerCase()) {
            throw new Error('Smart account address mismatch');
          }

          const data = nftService.encodeERC721TransferData(recipient, tokenId);
          const result = await smartAccountService.executeTransaction(
            smartAccount,
            privateKey,
            selectedToken,
            BigInt(0),
            data
          );

          if (!result.success) {
            throw new Error(result.error || 'Failed to transfer NFT');
          }

          setTxHash(result.txHash || '');
          setSuccess(true);
          setToast({ message: 'NFT transferred successfully!', type: 'success' });
        }
      } else if (tokenType === 'erc1155') {
        // ERC1155 multi-token transfer
        if (!selectedToken || !tokenId || !amount) {
          throw new Error('Contract address, token ID, and amount required');
        }

        const isEOA = selectedAccount === 'eoa' || 
          (fromAddress.toLowerCase() === eoaAddress?.toLowerCase());

        if (isEOA) {
          const result = await nftService.transferERC1155(
            selectedToken,
            privateKey,
            recipient,
            tokenId,
            amount
          );

          if (!result.success) {
            throw new Error(result.error || 'Failed to transfer tokens');
          }

          setTxHash(result.txHash || '');
          setSuccess(true);
          setToast({ message: 'Tokens transferred successfully!', type: 'success' });
        } else {
          // Through smart account
          if (!smartAccount || fromAddress.toLowerCase() !== smartAccount.toLowerCase()) {
            throw new Error('Smart account address mismatch');
          }

          const data = nftService.encodeERC1155TransferData(recipient, tokenId, amount);
          const result = await smartAccountService.executeTransaction(
            smartAccount,
            privateKey,
            selectedToken,
            BigInt(0),
            data
          );

          if (!result.success) {
            throw new Error(result.error || 'Failed to transfer tokens');
          }

          setTxHash(result.txHash || '');
          setSuccess(true);
          setToast({ message: 'Tokens transferred successfully!', type: 'success' });
        }
      } else if (transferType === 'private') {
        // Send private transfer (VEIL only)
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
        // Determine if we're sending from EOA or Smart Account
        const isEOA = selectedAccount === 'eoa' || 
          (fromAddress.toLowerCase() === eoaAddress?.toLowerCase());
        
        console.log('🔍 [SendPage] Account selection:', {
          selectedAccount,
          fromAddress,
          eoaAddress,
          smartAccount,
          isEOA,
        });
        
        if (isEOA) {
          // Send directly from EOA
          console.log('📤 [SendPage] Sending from EOA account directly');
          
          if (selectedToken === null) {
            // Native token transfer
            const result = await tokenService.transferNative(
              privateKey,
              recipient,
              amount
            );

            if (!result.success) {
              throw new Error(result.error || 'Failed to send native token');
            }

            setTxHash(result.txHash || '');
            setSuccess(true);
            setToast({ message: 'Transaction sent successfully!', type: 'success' });
          } else {
            // ERC20 token transfer
            if (!tokenInfo) {
              throw new Error('Token information not available');
            }

            const result = await tokenService.transfer(
              selectedToken,
              privateKey,
              recipient,
              amount,
              tokenInfo.decimals
            );

            if (!result.success) {
              throw new Error(result.error || 'Failed to send tokens');
            }

            setTxHash(result.txHash || '');
            setSuccess(true);
            setToast({ message: 'Transaction sent successfully!', type: 'success' });
          }
        } else {
          // Send through smart account
          console.log('📤 [SendPage] Sending through smart account');
          console.log('📤 [SendPage] Smart account address:', smartAccount);
          console.log('📤 [SendPage] From address:', fromAddress);
          console.log('📤 [SendPage] Selected account:', selectedAccount);
          
          const { smartAccountService } = await import('@/services/smartAccount.service');
          const { ethers } = await import('ethers');

          if (!smartAccount) {
            throw new Error('Smart account address not found. Please deploy your smart account first.');
          }
          
          if (fromAddress.toLowerCase() !== smartAccount.toLowerCase()) {
            console.error('❌ [SendPage] Address mismatch:', {
              fromAddress,
              smartAccount,
              selectedAccount,
            });
            throw new Error(`Smart account address mismatch. Expected ${smartAccount}, got ${fromAddress}`);
          }
          
          // Verify smart account is deployed
          const isDeployed = await smartAccountService.isDeployed(smartAccount);
          if (!isDeployed) {
            throw new Error('Smart account is not deployed yet. Please deploy it first from the main wallet screen.');
          }
          
          console.log('✅ [SendPage] Smart account verified and deployed');

          if (selectedToken === null) {
            // Native token - send MNT through smart account
            const tx = await smartAccountService.executeTransaction(
              smartAccount,
              privateKey,
              recipient,
              ethers.parseEther(amount),
              '0x'
            );

            if (!tx.success) {
              throw new Error(tx.error || 'Failed to send native token');
            }

            setTxHash(tx.txHash || '');
            setSuccess(true);
            setToast({ message: 'Transaction sent successfully!', type: 'success' });
          } else {
            // ERC20 token transfer through smart account
            if (!tokenInfo) {
              throw new Error('Token information not available');
            }

            const data = tokenService.encodeTransferData(recipient, amount, tokenInfo.decimals);

            const result = await smartAccountService.executeTransaction(
              smartAccount,
              privateKey,
              selectedToken,
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
        }
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
          {/* Token Type Selector */}
          <div className="space-y-2">
            <label className="text-sm text-white/60 uppercase tracking-wider">Asset Type</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTokenType('native');
                  setSelectedToken(null);
                  setTokenInfo(null);
                }}
                className={`p-2 rounded-lg border text-xs transition-all ${
                  tokenType === 'native'
                    ? 'bg-purple-500/30 border-purple-400/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                Native
              </button>
              <button
                type="button"
                onClick={() => {
                  setTokenType('erc20');
                  setSelectedToken(null);
                  setTokenInfo(null);
                }}
                className={`p-2 rounded-lg border text-xs transition-all ${
                  tokenType === 'erc20'
                    ? 'bg-purple-500/30 border-purple-400/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                ERC20
              </button>
              <button
                type="button"
                onClick={() => {
                  setTokenType('erc721');
                  setSelectedToken(null);
                  setTokenInfo(null);
                }}
                className={`p-2 rounded-lg border text-xs transition-all ${
                  tokenType === 'erc721'
                    ? 'bg-purple-500/30 border-purple-400/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                ERC721
              </button>
              <button
                type="button"
                onClick={() => {
                  setTokenType('erc1155');
                  setSelectedToken(null);
                  setTokenInfo(null);
                }}
                className={`p-2 rounded-lg border text-xs transition-all ${
                  tokenType === 'erc1155'
                    ? 'bg-purple-500/30 border-purple-400/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                ERC1155
              </button>
            </div>
          </div>

          {/* Token Selector (for ERC20) */}
          {accountAddress && tokenType === 'erc20' && (
            <TokenSelector
              selectedToken={selectedToken}
              onTokenSelect={(address, info) => {
                setSelectedToken(address);
                setTokenInfo(info);
              }}
              accountAddress={accountAddress}
            />
          )}

          {/* NFT Contract Address Input (for ERC721/ERC1155) */}
          {(tokenType === 'erc721' || tokenType === 'erc1155') && (
            <Input
              label="NFT Contract Address"
              value={selectedToken || ''}
              onChange={(e) => setSelectedToken(e.target.value)}
              placeholder="0x..."
              required
              className="bg-white/10 border-white/20 text-white"
            />
          )}

          {/* Transfer Type Selector (only for ERC20 tokens) */}
          {tokenType === 'erc20' && selectedToken !== null && (
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
          )}

          <Input
            label="Recipient Address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            required
            className="bg-white/10 border-white/20 text-white"
          />

          {/* Token ID for NFTs */}
          {(tokenType === 'erc721' || tokenType === 'erc1155') && (
            <Input
              label="Token ID"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="0"
              required
              className="bg-white/10 border-white/20 text-white"
            />
          )}

          {/* Amount (for native/ERC20/ERC1155) */}
          {tokenType !== 'erc721' && (
            <Input
              label={`Amount ${tokenInfo ? `(${tokenInfo.symbol})` : tokenType === 'native' ? '(MNT)' : ''}`}
              type="number"
              step="0.0001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="bg-white/10 border-white/20 text-white"
            />
          )}

          {transferType === 'private' && selectedToken === CONTRACT_ADDRESSES.VEIL_TOKEN && (
            <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3 text-xs text-white/80">
              <strong>🔒 Privacy Mode:</strong> The transfer amount will be hidden on-chain. Only you and the recipient can see it. (VEIL only)
            </div>
          )}
          
          {transferType === 'private' && selectedToken !== CONTRACT_ADDRESSES.VEIL_TOKEN && selectedToken !== null && (
            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 text-xs text-yellow-300">
              <strong>⚠️ Note:</strong> Private transfers are only available for VEIL tokens. Please select VEIL token for private transfers.
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

