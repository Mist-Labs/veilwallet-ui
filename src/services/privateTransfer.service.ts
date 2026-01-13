import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config/constants';
import { VEIL_TOKEN_ABI, VERIFIER_ABI } from '@/lib/abis';

export interface PrivateTransferParams {
  recipient: string;
  amount: string;
}

export interface CommitmentData {
  commitment: string;
  nullifier: string;
  inputs: [string, string, string, string];
  proof: string;
}

class PrivateTransferService {
  private provider: ethers.JsonRpcProvider;
  private tokenContract: ethers.Contract;
  private verifierContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.RPC_URL);
    this.tokenContract = new ethers.Contract(
      CONTRACT_ADDRESSES.VEIL_TOKEN,
      VEIL_TOKEN_ABI,
      this.provider
    );
    this.verifierContract = new ethers.Contract(
      CONTRACT_ADDRESSES.VERIFIER,
      VERIFIER_ABI,
      this.provider
    );
  }

  /**
   * Create a commitment for private transfer
   */
  async createCommitment(
    amount: string,
    recipient: string
  ): Promise<{ success: boolean; data?: CommitmentData; error?: string }> {
    try {
      // Convert amount to wei
      const amountBigInt = ethers.parseEther(amount);

      // Generate random blinding factor and nonce
      const blinding = ethers.randomBytes(32);
      const nonce = ethers.randomBytes(32);

      // Prepare inputs for Poseidon hash
      const inputs: [string, string, string, string] = [
        ethers.zeroPadValue(ethers.toBeHex(amountBigInt), 32),
        ethers.hexlify(blinding),
        ethers.zeroPadValue(recipient, 32),
        ethers.hexlify(nonce),
      ];

      // Get commitment from verifier
      const commitment = await this.verifierContract.verifyCommitment(inputs);

      // Create nullifier (prevents double-spending)
      const nullifier = ethers.keccak256(
        ethers.concat([commitment, ethers.toUtf8Bytes('nullifier')])
      );

      // Encode proof (in MVP, just encode the inputs)
      const proof = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32[4]'],
        [inputs]
      );

      return {
        success: true,
        data: {
          commitment,
          nullifier,
          inputs,
          proof,
        },
      };
    } catch (error: any) {
      console.error('Error creating commitment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create commitment',
      };
    }
  }

  /**
   * Send private transfer
   */
  async sendPrivateTransfer(
    senderPrivateKey: string,
    recipient: string,
    amount: string
  ): Promise<{ success: boolean; txHash?: string; commitment?: string; error?: string }> {
    try {
      // Create commitment
      const commitmentResult = await this.createCommitment(amount, recipient);
      if (!commitmentResult.success || !commitmentResult.data) {
        return {
          success: false,
          error: commitmentResult.error || 'Failed to create commitment',
        };
      }

      const { commitment, nullifier, proof } = commitmentResult.data;
      const amountBigInt = ethers.parseEther(amount);

      // Send transaction
      const wallet = new ethers.Wallet(senderPrivateKey, this.provider);
      const token = this.tokenContract.connect(wallet);

      const tx = await token.privateTransfer(commitment, nullifier, amountBigInt, proof);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        commitment,
      };
    } catch (error: any) {
      console.error('Error sending private transfer:', error);
      return {
        success: false,
        error: error.message || 'Failed to send private transfer',
      };
    }
  }

  /**
   * Claim from commitment
   */
  async claimFromCommitment(
    recipientPrivateKey: string,
    commitment: string,
    amount: string,
    inputs: [string, string, string, string]
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const amountBigInt = ethers.parseEther(amount);

      // Encode proof
      const proof = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32[4]'],
        [inputs]
      );

      // Send claim transaction
      const wallet = new ethers.Wallet(recipientPrivateKey, this.provider);
      const token = this.tokenContract.connect(wallet);

      const tx = await token.claimFromCommitment(commitment, amountBigInt, proof);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error claiming commitment:', error);
      return {
        success: false,
        error: error.message || 'Failed to claim commitment',
      };
    }
  }

  /**
   * Check if commitment is valid
   */
  async isCommitmentValid(commitment: string): Promise<boolean> {
    try {
      return await this.tokenContract.isCommitmentValid(commitment);
    } catch (error) {
      console.error('Error checking commitment:', error);
      return false;
    }
  }

  /**
   * Check if nullifier has been used
   */
  async isNullifierUsed(nullifier: string): Promise<boolean> {
    try {
      return await this.tokenContract.isNullifierUsed(nullifier);
    } catch (error) {
      console.error('Error checking nullifier:', error);
      return false;
    }
  }
}

export const privateTransferService = new PrivateTransferService();

