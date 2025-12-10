// Smart contract ABI types
export interface VeilTokenContract {
  transfer: (to: string, amount: string) => Promise<any>;
  privateTransfer: (commitment: string, nullifier: string, amount: string, proof: string) => Promise<any>;
  updateEncryptedBalance: (encryptedData: string) => Promise<any>;
  claimFromCommitment: (commitment: string, amount: string, proof: string) => Promise<any>;
  balanceOf: (address: string) => Promise<string>;
  getCommitments: (address: string) => Promise<string[]>;
}

export interface SmartAccountContract {
  execute: (dest: string, value: string, func: string) => Promise<any>;
  executeBatch: (dest: string[], func: string[]) => Promise<any>;
  addSessionKey: (sessionKey: string, validUntil: number, spendingLimit: string) => Promise<any>;
  revokeSessionKey: (sessionKey: string) => Promise<any>;
  validateSignature: (userOp: any, userOpHash: string) => Promise<boolean>;
}

export interface AccountFactoryContract {
  createAccount: (owner: string) => Promise<any>;
  getAddress: (owner: string) => Promise<string>;
}

