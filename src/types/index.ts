// User types
export interface User {
  id: string;
  email: string;
  accountAddress: string;
  createdAt: string;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
}

export interface OTPVerification {
  email: string;
  otp: string;
}

export interface AuthResponse {
  user: User;
  sessionToken: string;
  requiresOTP?: boolean;
}

export interface Session {
  token: string;
  expiresAt: string;
  userId: string;
}

// Wallet types
export interface WalletBalance {
  transparent: string; // ERC20 balance
  private: string; // Sum of unspent commitments
  total: string; // Transparent + Private
}

export interface Commitment {
  hash: string;
  amount: string; // Encrypted/decrypted amount
  blindingFactor?: string;
  recipient?: string;
  nonce?: string;
  createdAt: string;
  isSpent: boolean;
}

// Transaction types
export interface Transaction {
  id: string;
  type: 'private' | 'transparent' | 'receive';
  from: string;
  to: string;
  amount: string;
  commitment?: string;
  nullifier?: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  transactionHash?: string;
  timestamp: string;
}

// Key management types (non-custodial)
export interface WalletKey {
  keyId: string;
  publicKey: string;
  accountAddress?: string;
  createdAt: string;
}

export interface SessionKey {
  address: string;
  validUntil: string;
  spendingLimit: string;
  isActive: boolean;
  privateKey?: CryptoKey; // Stored in memory only, never persisted
}

// API response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// UserOperation types (ERC-4337)
export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

// Transfer types
export interface PrivateTransfer {
  recipientCommitment: string;
  nullifier: string;
  amount: string;
  proof: string;
}

export interface TransparentTransfer {
  to: string;
  amount: string;
}

