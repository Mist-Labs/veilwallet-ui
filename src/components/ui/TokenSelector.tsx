import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { tokenService, type TokenInfo } from '@/services/token.service';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config/constants';
import { smartAccountService } from '@/services/smartAccount.service';

interface TokenSelectorProps {
  selectedToken: string | null;
  onTokenSelect: (tokenAddress: string | null, tokenInfo: TokenInfo | null) => void;
  accountAddress: string;
}

export function TokenSelector({ selectedToken, onTokenSelect, accountAddress }: TokenSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState('');

  // Default tokens
  const defaultTokens = [
    {
      address: null, // Native token
      symbol: NETWORK_CONFIG.NATIVE_CURRENCY.symbol,
      name: NETWORK_CONFIG.NATIVE_CURRENCY.name,
      icon: '🪙',
    },
    {
      address: CONTRACT_ADDRESSES.VEIL_TOKEN,
      symbol: 'VEIL',
      name: 'Veil Token',
      icon: '🔒',
    },
  ];

  useEffect(() => {
    if (selectedToken && accountAddress) {
      loadTokenInfo(selectedToken);
    } else if (selectedToken === null && accountAddress) {
      // Load native token balance
      loadNativeBalance();
    }
  }, [selectedToken, accountAddress]);

  const loadNativeBalance = async () => {
    if (!accountAddress) return;
    setLoading(true);
    try {
      const balance = await smartAccountService.getMNTBalance(accountAddress);
      setTokenInfo({
        address: '',
        name: NETWORK_CONFIG.NATIVE_CURRENCY.name,
        symbol: NETWORK_CONFIG.NATIVE_CURRENCY.symbol,
        decimals: NETWORK_CONFIG.NATIVE_CURRENCY.decimals,
        balance: balance,
      });
      onTokenSelect(null, {
        address: '',
        name: NETWORK_CONFIG.NATIVE_CURRENCY.name,
        symbol: NETWORK_CONFIG.NATIVE_CURRENCY.symbol,
        decimals: NETWORK_CONFIG.NATIVE_CURRENCY.decimals,
        balance: balance,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  const loadTokenInfo = async (address: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await tokenService.getTokenInfo(address, accountAddress);
      if (result.success && result.data) {
        setTokenInfo(result.data);
        onTokenSelect(address, result.data);
      } else {
        setError(result.error || 'Failed to load token');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load token');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomToken = async () => {
    if (!customAddress || !ethers.isAddress(customAddress)) {
      setError('Invalid address');
      return;
    }
    await loadTokenInfo(customAddress);
    setShowCustom(false);
  };

  const handleTokenSelect = (address: string | null) => {
    setError('');
    if (address === null) {
      // Native token
      loadNativeBalance();
    } else {
      loadTokenInfo(address);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-white/60 uppercase tracking-wider">Token</label>
      
      {/* Token Selection */}
      <div className="grid grid-cols-2 gap-2">
        {defaultTokens.map((token) => (
          <button
            key={token.address || 'native'}
            type="button"
            onClick={() => handleTokenSelect(token.address)}
            className={`p-3 rounded-xl border transition-all text-left ${
              selectedToken === token.address
                ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/20 border-purple-400/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{token.icon}</span>
              <div>
                <div className="font-semibold text-sm">{token.symbol}</div>
                <div className="text-xs text-white/60">{token.name}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Token Input */}
      <button
        type="button"
        onClick={() => setShowCustom(!showCustom)}
        className="w-full p-2 text-xs text-white/60 hover:text-white/80 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
      >
        {showCustom ? 'Cancel' : '+ Add Custom Token'}
      </button>

      {showCustom && (
        <div className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
          <input
            type="text"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <button
            type="button"
            onClick={handleCustomToken}
            disabled={loading}
            className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Add Token'}
          </button>
        </div>
      )}

      {/* Selected Token Info */}
      {tokenInfo && (
        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{tokenInfo.symbol}</div>
              <div className="text-xs text-white/60">{tokenInfo.name}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{parseFloat(tokenInfo.balance).toFixed(4)}</div>
              <div className="text-xs text-white/60">Balance</div>
            </div>
          </div>
          {tokenInfo.address && (
            <div className="mt-2 text-xs text-white/40 font-mono truncate">
              {tokenInfo.address}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


