// Smart contract types
// Note: These are type definitions for contract interfaces, not extending ethers.Contract
// to avoid TypeScript conflicts with ethers.js internal types

export interface VeilTokenContract {
  transfer: (to: string, amount: bigint) => Promise<any>;
  transferFrom: (from: string, to: string, amount: bigint) => Promise<any>;
  approve: (spender: string, amount: bigint) => Promise<any>;
  balanceOf: (address: string) => Promise<bigint>;
  totalSupply: () => Promise<bigint>;
  allowance: (owner: string, spender: string) => Promise<bigint>;
  privateTransfer: (commitment: string, nullifier: string, amount: bigint, proof: string) => Promise<any>;
  claimFromCommitment: (commitment: string, amount: bigint, proof: string) => Promise<any>;
  createCommitment: (inputs: [string, string, string, string]) => Promise<string>;
  isNullifierUsed: (nullifier: string) => Promise<boolean>;
  isCommitmentValid: (commitment: string) => Promise<boolean>;
  mint: (to: string, amount: bigint) => Promise<any>;
}

export interface SmartAccountContract {
  owner: () => Promise<string>;
  signer: () => Promise<string>;
  entryPoint: () => Promise<string>;
  changeOwner: (newOwner: string) => Promise<any>;
  execute: (target: string, value: bigint, data: string) => Promise<any>;
  executeBatch: (targets: string[], values: bigint[], datas: string[]) => Promise<any>;
  addSessionKey: (sessionKey: string, validUntil: number, spendingLimit: bigint) => Promise<any>;
  revokeSessionKey: (sessionKey: string) => Promise<any>;
  sessionKeys: (sessionKey: string) => Promise<[bigint, bigint, bigint]>;
  setGuardian: (guardian: string) => Promise<any>;
  initiateRecovery: (newOwner: string) => Promise<any>;
  executeRecovery: () => Promise<any>;
  guardian: () => Promise<string>;
  pendingRecovery: () => Promise<[string, bigint, boolean]>;
}

export interface AccountFactoryContract {
  getAddress: (owner: string, salt: bigint) => Promise<string>;
  createAccount: (owner: string, salt: bigint) => Promise<any>;
  entryPoint: () => Promise<string>;
}

export interface VerifierContract {
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

