import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '@/config/constants';

// ERC721 ABI (NFTs)
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function tokenByIndex(uint256 index) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
] as const;

// ERC1155 ABI (Multi-token standard)
const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) view returns (uint256[])',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data)',
  'function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data)',
  'function uri(uint256 id) view returns (string)',
] as const;

export interface NFTInfo {
  contractAddress: string;
  tokenId: string;
  name?: string;
  symbol?: string;
  tokenURI?: string;
  owner?: string;
}

export interface ERC1155TokenInfo {
  contractAddress: string;
  tokenId: string;
  balance: string;
  uri?: string;
}

class NFTService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.RPC_URL);
  }

  /**
   * Get ERC721 NFT information
   */
  async getNFTInfo(contractAddress: string, tokenId: string, ownerAddress?: string): Promise<{ success: boolean; data?: NFTInfo; error?: string }> {
    try {
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, this.provider);
      
      const [name, symbol, tokenURI, owner] = await Promise.all([
        contract.name().catch(() => ''),
        contract.symbol().catch(() => ''),
        contract.tokenURI(tokenId).catch(() => ''),
        ownerAddress ? Promise.resolve(ownerAddress) : contract.ownerOf(tokenId).catch(() => null),
      ]);

      return {
        success: true,
        data: {
          contractAddress,
          tokenId,
          name: name || undefined,
          symbol: symbol || undefined,
          tokenURI: tokenURI || undefined,
          owner: owner || undefined,
        },
      };
    } catch (error: any) {
      console.error('Error getting NFT info:', error);
      return {
        success: false,
        error: error.message || 'Failed to get NFT information',
      };
    }
  }

  /**
   * Get ERC721 balance (number of NFTs owned)
   */
  async getERC721Balance(contractAddress: string, ownerAddress: string): Promise<{ success: boolean; data?: { balance: number }; error?: string }> {
    try {
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, this.provider);
      const balance = await contract.balanceOf(ownerAddress);
      return {
        success: true,
        data: {
          balance: Number(balance),
        },
      };
    } catch (error: any) {
      console.error('Error getting ERC721 balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to get NFT balance',
      };
    }
  }

  /**
   * Transfer ERC721 NFT
   */
  async transferERC721(
    contractAddress: string,
    fromPrivateKey: string,
    to: string,
    tokenId: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = new ethers.Wallet(fromPrivateKey, this.provider);
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, wallet);
      
      const tx = await contract.transferFrom(wallet.address, to, tokenId);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not available');
      }

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error transferring ERC721:', error);
      return {
        success: false,
        error: error.message || 'Failed to transfer NFT',
      };
    }
  }

  /**
   * Get ERC1155 token balance
   */
  async getERC1155Balance(
    contractAddress: string,
    ownerAddress: string,
    tokenId: string
  ): Promise<{ success: boolean; data?: { balance: string }; error?: string }> {
    try {
      const contract = new ethers.Contract(contractAddress, ERC1155_ABI, this.provider);
      const balance = await contract.balanceOf(ownerAddress, tokenId);
      
      // ERC1155 doesn't have decimals, balance is already in the correct unit
      return {
        success: true,
        data: {
          balance: balance.toString(),
        },
      };
    } catch (error: any) {
      console.error('Error getting ERC1155 balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to get ERC1155 balance',
      };
    }
  }

  /**
   * Transfer ERC1155 tokens
   */
  async transferERC1155(
    contractAddress: string,
    fromPrivateKey: string,
    to: string,
    tokenId: string,
    amount: string,
    data: string = '0x'
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = new ethers.Wallet(fromPrivateKey, this.provider);
      const contract = new ethers.Contract(contractAddress, ERC1155_ABI, wallet);
      
      const tx = await contract.safeTransferFrom(
        wallet.address,
        to,
        tokenId,
        amount,
        data
      );
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not available');
      }

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error transferring ERC1155:', error);
      return {
        success: false,
        error: error.message || 'Failed to transfer ERC1155 tokens',
      };
    }
  }

  /**
   * Encode ERC721 transfer data for smart account
   */
  encodeERC721TransferData(to: string, tokenId: string): string {
    const iface = new ethers.Interface(ERC721_ABI);
    return iface.encodeFunctionData('transferFrom', [
      '0x0000000000000000000000000000000000000000', // Will be replaced by smart account address
      to,
      tokenId,
    ]);
  }

  /**
   * Encode ERC1155 transfer data for smart account
   */
  encodeERC1155TransferData(to: string, tokenId: string, amount: string, data: string = '0x'): string {
    const iface = new ethers.Interface(ERC1155_ABI);
    return iface.encodeFunctionData('safeTransferFrom', [
      '0x0000000000000000000000000000000000000000', // Will be replaced by smart account address
      to,
      tokenId,
      amount,
      data,
    ]);
  }
}

export const nftService = new NFTService();

