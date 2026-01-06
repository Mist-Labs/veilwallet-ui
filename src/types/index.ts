// API Response type
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Wallet types
export interface WalletInfo {
  address: string;
  publicKey: string;
  isDeployed: boolean;
}

export interface WalletBalance {
  transparent: string;
  private: string;
  total: string;
}

// Session Key types
export interface SessionKey {
  address: string;
  validUntil: number;
  spendingLimit: string;
  spentAmount: string;
}

// Transaction types
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'send' | 'receive' | 'private';
}

// Private Transfer types
export interface PrivateTransferProof {
  commitment: string;
  nullifier: string;
  proof: string;
}

// User Operation (ERC-4337) types
export interface UserOperation {
  sender: string;
  nonce: bigint;
  initCode: string;
  callData: string;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: string;
  signature: string;
}

// Storage types
export interface StoredKey {
  id: string;
  publicKey: string;
  encryptedPrivateKey: string;
  accountAddress?: string;
  createdAt: number;
}

export interface StoredEthereumKey {
  id: string;
  address: string;
  encryptedPrivateKey: string;
  encryptedMnemonic: string;
  accountAddress?: string;
  createdAt: number;
}

// Network types
export interface NetworkConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Guardian types
export interface Guardian {
  address: string;
  addedAt: number;
}

export interface RecoveryRequest {
  newOwner: string;
  timestamp: number;
  executed: boolean;
}

