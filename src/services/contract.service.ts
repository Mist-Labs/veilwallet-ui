import { ethers } from 'ethers';
import { blockchainService } from './blockchain.service';
import { CONTRACT_ADDRESSES } from '@/config/constants';
import {
  ACCOUNT_FACTORY_ABI,
  SMART_ACCOUNT_ABI,
  VEIL_TOKEN_ABI,
  VERIFIER_ABI,
} from '@/lib/abis';

class ContractService {
  /**
   * Get AccountFactory contract instance
   */
  getAccountFactory(signer?: ethers.Signer): ethers.Contract {
    const provider = blockchainService.getProvider();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES.ACCOUNT_FACTORY,
      ACCOUNT_FACTORY_ABI,
      signer || provider
    );
    return contract;
  }

  /**
   * Get SmartAccount contract instance
   */
  getSmartAccount(accountAddress: string, signer?: ethers.Signer): ethers.Contract {
    const provider = blockchainService.getProvider();
    const contract = new ethers.Contract(
      accountAddress,
      SMART_ACCOUNT_ABI,
      signer || provider
    );
    return contract;
  }

  /**
   * Get VeilToken contract instance
   */
  getVeilToken(signer?: ethers.Signer): ethers.Contract {
    const provider = blockchainService.getProvider();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES.VEIL_TOKEN,
      VEIL_TOKEN_ABI,
      signer || provider
    );
    return contract;
  }

  /**
   * Get Verifier contract instance
   */
  getVerifier(signer?: ethers.Signer): ethers.Contract {
    const provider = blockchainService.getProvider();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES.VERIFIER,
      VERIFIER_ABI,
      signer || provider
    );
    return contract;
  }

  /**
   * Get predicted wallet address without deploying
   */
  async getPredictedAddress(ownerAddress: string, salt: string): Promise<string> {
    const factory = this.getAccountFactory();
    const saltHash = ethers.keccak256(ethers.toUtf8Bytes(salt));
    // Convert hex string to bigint for the function call
    const saltBigInt = BigInt(saltHash);
    // Use the interface to encode and call
    const iface = new ethers.Interface(ACCOUNT_FACTORY_ABI);
    const data = iface.encodeFunctionData('getAddress', [ownerAddress, saltBigInt]);
    const result = await factory.provider.call({
      to: CONTRACT_ADDRESSES.ACCOUNT_FACTORY,
      data,
    });
    return iface.decodeFunctionResult('getAddress', result)[0] as string;
  }

  /**
   * Create a new smart contract wallet
   */
  async createAccount(
    ownerAddress: string,
    salt: string,
    signer: ethers.Signer
  ): Promise<{ accountAddress: string; txHash: string }> {
    const factory = this.getAccountFactory(signer);
    const saltHash = ethers.keccak256(ethers.toUtf8Bytes(salt));
    const saltBigInt = BigInt(saltHash);
    
    // Check if account already exists
    const iface = new ethers.Interface(ACCOUNT_FACTORY_ABI);
    const data = iface.encodeFunctionData('getAddress', [ownerAddress, saltBigInt]);
    const result = await factory.provider.call({
      to: CONTRACT_ADDRESSES.ACCOUNT_FACTORY,
      data,
    });
    const predictedAddress = iface.decodeFunctionResult('getAddress', result)[0] as string;
    const isDeployed = await blockchainService.isContract(predictedAddress);
    
    if (isDeployed) {
      return {
        accountAddress: predictedAddress,
        txHash: '', // Already deployed
      };
    }

    // Deploy new account
    const tx = await factory.createAccount(ownerAddress, saltBigInt);
    const receipt = await tx.wait();
    
    // Find the AccountCreated event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = factory.interface.parseLog({
          topics: log.topics || [],
          data: log.data || '0x',
        });
        return parsed?.name === 'AccountCreated';
      } catch {
        return false;
      }
    });

    let accountAddress = predictedAddress;
    if (event) {
      try {
        const parsed = factory.interface.parseLog({
          topics: event.topics || [],
          data: event.data || '0x',
        });
        accountAddress = parsed?.args.account;
      } catch {
        // Use predicted address if parsing fails
      }
    }

    return {
      accountAddress,
      txHash: receipt.hash,
    };
  }

  /**
   * Execute a transaction from SmartAccount
   */
  async executeTransaction(
    accountAddress: string,
    target: string,
    value: bigint,
    data: string,
    signer: ethers.Signer
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    const account = this.getSmartAccount(accountAddress, signer);
    const tx = await account.execute(target, value, data);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, receipt };
  }

  /**
   * Execute batch transactions from SmartAccount
   */
  async executeBatch(
    accountAddress: string,
    targets: string[],
    values: bigint[],
    datas: string[],
    signer: ethers.Signer
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    const account = this.getSmartAccount(accountAddress, signer);
    const tx = await account.executeBatch(targets, values, datas);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, receipt };
  }

  /**
   * Add session key to SmartAccount
   */
  async addSessionKey(
    accountAddress: string,
    sessionKeyAddress: string,
    validUntil: number,
    spendingLimit: bigint,
    signer: ethers.Signer
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    const account = this.getSmartAccount(accountAddress, signer);
    const tx = await account.addSessionKey(sessionKeyAddress, validUntil, spendingLimit);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, receipt };
  }

  /**
   * Revoke session key from SmartAccount
   */
  async revokeSessionKey(
    accountAddress: string,
    sessionKeyAddress: string,
    signer: ethers.Signer
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    const account = this.getSmartAccount(accountAddress, signer);
    const tx = await account.revokeSessionKey(sessionKeyAddress);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, receipt };
  }

  /**
   * Get session key info
   */
  async getSessionKey(
    accountAddress: string,
    sessionKeyAddress: string
  ): Promise<{ validUntil: bigint; spendingLimit: bigint; spentAmount: bigint }> {
    const account = this.getSmartAccount(accountAddress);
    const result = await account.sessionKeys(sessionKeyAddress);
    return {
      validUntil: result.validUntil,
      spendingLimit: result.spendingLimit,
      spentAmount: result.spentAmount,
    };
  }

  /**
   * Set guardian for SmartAccount
   */
  async setGuardian(
    accountAddress: string,
    guardianAddress: string,
    signer: ethers.Signer
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    const account = this.getSmartAccount(accountAddress, signer);
    const tx = await account.setGuardian(guardianAddress);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, receipt };
  }

  /**
   * Initiate recovery process
   */
  async initiateRecovery(
    accountAddress: string,
    newOwnerAddress: string,
    signer: ethers.Signer
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    const account = this.getSmartAccount(accountAddress, signer);
    const tx = await account.initiateRecovery(newOwnerAddress);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, receipt };
  }

  /**
   * Execute recovery (after 24 hour delay)
   */
  async executeRecovery(
    accountAddress: string,
    signer: ethers.Signer
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    const account = this.getSmartAccount(accountAddress, signer);
    const tx = await account.executeRecovery();
    const receipt = await tx.wait();
    return { txHash: receipt.hash, receipt };
  }

  /**
   * Get guardian address
   */
  async getGuardian(accountAddress: string): Promise<string> {
    const account = this.getSmartAccount(accountAddress);
    return await account.guardian();
  }

  /**
   * Get pending recovery info
   */
  async getPendingRecovery(
    accountAddress: string
  ): Promise<{ newOwner: string; timestamp: bigint; executed: boolean }> {
    const account = this.getSmartAccount(accountAddress);
    const result = await account.pendingRecovery();
    return {
      newOwner: result.newOwner,
      timestamp: result.timestamp,
      executed: result.executed,
    };
  }

  /**
   * Get VeilToken balance
   */
  async getTokenBalance(accountAddress: string): Promise<bigint> {
    const token = this.getVeilToken();
    return await token.balanceOf(accountAddress);
  }

  /**
   * Transfer VeilToken (standard ERC20 transfer)
   */
  async transferToken(
    fromAccountAddress: string,
    to: string,
    amount: bigint,
    signer: ethers.Signer
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    // If fromAccountAddress is a SmartAccount, use execute
    // Otherwise, use direct transfer
    const isSmartAccount = await blockchainService.isContract(fromAccountAddress);
    
    if (isSmartAccount) {
      const token = this.getVeilToken();
      const tokenInterface = new ethers.Interface(VEIL_TOKEN_ABI);
      const data = tokenInterface.encodeFunctionData('transfer', [to, amount]);
      
      return this.executeTransaction(fromAccountAddress, CONTRACT_ADDRESSES.VEIL_TOKEN, BigInt(0), data, signer);
    } else {
      const token = this.getVeilToken(signer);
      const tx = await token.transfer(to, amount);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, receipt };
    }
  }

  /**
   * Create commitment for private transfer
   */
  async createCommitment(
    amount: bigint,
    blinding: string,
    recipient: string,
    nonce: string
  ): Promise<string> {
    const verifier = this.getVerifier();
    const recipientBytes = ethers.zeroPadValue(recipient, 32);
    const inputs: [string, string, string, string] = [
      ethers.zeroPadValue(ethers.toBeHex(amount), 32),
      blinding,
      recipientBytes,
      nonce,
    ];
    return await verifier.verifyCommitment(inputs);
  }

  /**
   * Send private transfer
   */
  async sendPrivateTransfer(
    accountAddress: string,
    commitment: string,
    nullifier: string,
    amount: bigint,
    proof: string,
    signer: ethers.Signer
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    const token = this.getVeilToken();
    const tokenInterface = new ethers.Interface(VEIL_TOKEN_ABI);
    const data = tokenInterface.encodeFunctionData('privateTransfer', [
      commitment,
      nullifier,
      amount,
      proof,
    ]);

    const isSmartAccount = await blockchainService.isContract(accountAddress);
    
    if (isSmartAccount) {
      return this.executeTransaction(accountAddress, CONTRACT_ADDRESSES.VEIL_TOKEN, BigInt(0), data, signer);
    } else {
      const tokenWithSigner = this.getVeilToken(signer);
      const tx = await tokenWithSigner.privateTransfer(commitment, nullifier, amount, proof);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, receipt };
    }
  }

  /**
   * Claim from commitment
   */
  async claimFromCommitment(
    accountAddress: string,
    commitment: string,
    amount: bigint,
    proof: string,
    signer: ethers.Signer
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    const token = this.getVeilToken();
    const tokenInterface = new ethers.Interface(VEIL_TOKEN_ABI);
    const data = tokenInterface.encodeFunctionData('claimFromCommitment', [
      commitment,
      amount,
      proof,
    ]);

    const isSmartAccount = await blockchainService.isContract(accountAddress);
    
    if (isSmartAccount) {
      return this.executeTransaction(accountAddress, CONTRACT_ADDRESSES.VEIL_TOKEN, BigInt(0), data, signer);
    } else {
      const tokenWithSigner = this.getVeilToken(signer);
      const tx = await tokenWithSigner.claimFromCommitment(commitment, amount, proof);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, receipt };
    }
  }

  /**
   * Check if nullifier is used
   */
  async isNullifierUsed(nullifier: string): Promise<boolean> {
    const token = this.getVeilToken();
    return await token.isNullifierUsed(nullifier);
  }

  /**
   * Check if commitment is valid
   */
  async isCommitmentValid(commitment: string): Promise<boolean> {
    const token = this.getVeilToken();
    return await token.isCommitmentValid(commitment);
  }

  /**
   * Get account owner
   */
  async getAccountOwner(accountAddress: string): Promise<string> {
    const account = this.getSmartAccount(accountAddress);
    return await account.owner();
  }

  /**
   * Change account owner
   */
  async changeOwner(
    accountAddress: string,
    newOwner: string,
    signer: ethers.Signer
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    const account = this.getSmartAccount(accountAddress, signer);
    const tx = await account.changeOwner(newOwner);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, receipt };
  }
}

export const contractService = new ContractService();

