// Smart contract types
import type { ethers } from 'ethers';

export interface VeilTokenContract extends ethers.Contract {
  transfer: (to: string, amount: bigint) => Promise<ethers.ContractTransactionResponse>;
  transferFrom: (from: string, to: string, amount: bigint) => Promise<ethers.ContractTransactionResponse>;
  approve: (spender: string, amount: bigint) => Promise<ethers.ContractTransactionResponse>;
  balanceOf: (address: string) => Promise<bigint>;
  totalSupply: () => Promise<bigint>;
  allowance: (owner: string, spender: string) => Promise<bigint>;
  privateTransfer: (commitment: string, nullifier: string, amount: bigint, proof: string) => Promise<ethers.ContractTransactionResponse>;
  claimFromCommitment: (commitment: string, amount: bigint, proof: string) => Promise<ethers.ContractTransactionResponse>;
  createCommitment: (inputs: [string, string, string, string]) => Promise<string>;
  isNullifierUsed: (nullifier: string) => Promise<boolean>;
  isCommitmentValid: (commitment: string) => Promise<boolean>;
  mint: (to: string, amount: bigint) => Promise<ethers.ContractTransactionResponse>;
}

export interface SmartAccountContract extends ethers.Contract {
  owner: () => Promise<string>;
  signer: () => Promise<string>;
  entryPoint: () => Promise<string>;
  changeOwner: (newOwner: string) => Promise<ethers.ContractTransactionResponse>;
  execute: (target: string, value: bigint, data: string) => Promise<ethers.ContractTransactionResponse>;
  executeBatch: (targets: string[], values: bigint[], datas: string[]) => Promise<ethers.ContractTransactionResponse>;
  addSessionKey: (sessionKey: string, validUntil: number, spendingLimit: bigint) => Promise<ethers.ContractTransactionResponse>;
  revokeSessionKey: (sessionKey: string) => Promise<ethers.ContractTransactionResponse>;
  sessionKeys: (sessionKey: string) => Promise<[bigint, bigint, bigint]>;
  setGuardian: (guardian: string) => Promise<ethers.ContractTransactionResponse>;
  initiateRecovery: (newOwner: string) => Promise<ethers.ContractTransactionResponse>;
  executeRecovery: () => Promise<ethers.ContractTransactionResponse>;
  guardian: () => Promise<string>;
  pendingRecovery: () => Promise<[string, bigint, boolean]>;
}

export interface AccountFactoryContract extends ethers.Contract {
  getAddress: (owner: string, salt: bigint) => Promise<string>;
  createAccount: (owner: string, salt: bigint) => Promise<ethers.ContractTransactionResponse>;
  entryPoint: () => Promise<string>;
}

export interface VerifierContract extends ethers.Contract {
  verifyCommitment: (inputs: [string, string, string, string]) => Promise<string>;
  verifyCommitment2: (inputs: [string, string]) => Promise<string>;
  verifyCommitment3: (inputs: [string, string, string]) => Promise<string>;
  verifyCommitmentMatch: (inputs: [string, string, string, string], expectedCommitment: string) => Promise<boolean>;
  hasher: () => Promise<string>;
}

// Session key info
export interface SessionKeyInfo {
  validUntil: bigint;
  spendingLimit: bigint;
  spentAmount: bigint;
}

// Pending recovery info
export interface PendingRecovery {
  newOwner: string;
  timestamp: bigint;
  executed: boolean;
}

