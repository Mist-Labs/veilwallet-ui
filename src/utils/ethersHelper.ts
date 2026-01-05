/**
 * Helper utilities for working with ethers.js and Ethereum keys
 */

import { ethers } from 'ethers';

/**
 * Convert CryptoKey to Ethereum private key string
 * Note: This is a simplified approach. In production, you'd need proper key derivation.
 * For now, we'll assume the private key is stored separately or derived differently.
 */
export async function getEthereumPrivateKeyFromCryptoKey(
  cryptoKey: CryptoKey
): Promise<string | null> {
  // This is a placeholder - in production, you'd need to properly derive
  // the Ethereum private key from the Web Crypto key
  // For now, we'll need to store Ethereum private keys separately
  // or use a different key derivation method
  throw new Error('Key conversion not yet implemented. Use Ethereum private key directly.');
}

/**
 * Generate a random Ethereum private key
 */
export function generateEthereumPrivateKey(): string {
  const wallet = ethers.Wallet.createRandom();
  return wallet.privateKey;
}

/**
 * Get address from private key
 */
export function getAddressFromPrivateKey(privateKey: string): string {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

/**
 * Create a signer from private key
 */
export function createSignerFromPrivateKey(
  privateKey: string,
  provider: ethers.Provider
): ethers.Wallet {
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Format amount to wei (bigint)
 */
export function parseEther(amount: string): bigint {
  return ethers.parseEther(amount);
}

/**
 * Format wei to ether (string)
 */
export function formatEther(amount: bigint): string {
  return ethers.formatEther(amount);
}

/**
 * Generate random bytes
 */
export function randomBytes(length: number): Uint8Array {
  return ethers.randomBytes(length);
}

/**
 * Keccak256 hash
 */
export function keccak256(data: string | Uint8Array): string {
  return ethers.keccak256(data);
}

/**
 * Zero pad value to 32 bytes
 */
export function zeroPadValue(value: string, length: number): string {
  return ethers.zeroPadValue(value, length);
}

/**
 * Hexlify bytes
 */
export function hexlify(data: Uint8Array): string {
  return ethers.hexlify(data);
}

/**
 * Convert string to hex
 */
export function toBeHex(value: bigint | number, length?: number): string {
  return ethers.toBeHex(value, length);
}

