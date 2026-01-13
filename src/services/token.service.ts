import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '@/config/constants';

// Standard ERC20 ABI (minimal - just what we need)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
];

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
}

export interface TokenTransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

class TokenService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.RPC_URL);
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string, accountAddress: string): Promise<{ success: boolean; data?: TokenInfo; error?: string }> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      const [name, symbol, decimals, balance] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.balanceOf(accountAddress),
      ]);

      return {
        success: true,
        data: {
          address: tokenAddress,
          name,
          symbol,
          decimals: Number(decimals),
          balance: ethers.formatUnits(balance, decimals),
        },
      };
    } catch (error: any) {
      console.error('Error getting token info:', error);
      return {
        success: false,
        error: error.message || 'Failed to get token information',
      };
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenAddress: string, accountAddress: string): Promise<{ success: boolean; data?: { balance: string; decimals: number }; error?: string }> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(accountAddress),
        tokenContract.decimals(),
      ]);

      return {
        success: true,
        data: {
          balance: ethers.formatUnits(balance, decimals),
          decimals: Number(decimals),
        },
      };
    } catch (error: any) {
      console.error('Error getting token balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to get token balance',
      };
    }
  }

  /**
   * Transfer tokens (direct from EOA)
   */
  async transfer(
    tokenAddress: string,
    fromPrivateKey: string,
    to: string,
    amount: string,
    decimals?: number
  ): Promise<TokenTransferResult> {
    try {
      const wallet = new ethers.Wallet(fromPrivateKey, this.provider);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

      // Get decimals if not provided
      let tokenDecimals = decimals;
      if (!tokenDecimals) {
        tokenDecimals = await tokenContract.decimals();
      }

      const amountWei = ethers.parseUnits(amount, tokenDecimals);
      const tx = await tokenContract.transfer(to, amountWei);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not available');
      }

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error transferring tokens:', error);
      return {
        success: false,
        error: error.message || 'Failed to transfer tokens',
      };
    }
  }

  /**
   * Transfer native token (MNT)
   */
  async transferNative(
    fromPrivateKey: string,
    to: string,
    amount: string
  ): Promise<TokenTransferResult> {
    try {
      const wallet = new ethers.Wallet(fromPrivateKey, this.provider);
      const tx = await wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not available');
      }

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error transferring native token:', error);
      return {
        success: false,
        error: error.message || 'Failed to transfer native token',
      };
    }
  }

  /**
   * Encode transfer data for smart account execution
   */
  encodeTransferData(to: string, amount: string, decimals: number): string {
    const iface = new ethers.Interface(ERC20_ABI);
    return iface.encodeFunctionData('transfer', [
      to,
      ethers.parseUnits(amount, decimals),
    ]);
  }
}

export const tokenService = new TokenService();

