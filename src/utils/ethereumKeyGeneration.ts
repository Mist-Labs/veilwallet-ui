/**
 * Ethereum-specific key generation for self-custodial wallet
 * Generates secp256k1 keys compatible with Ethereum
 * Uses BIP39 mnemonic phrases for wallet recovery
 * Keys are stored encrypted in extension storage (self-custodial)
 */

import { ethers } from 'ethers';
import { deriveKeyFromPassword, encryptData, decryptData, generateSalt } from './encryption';

/**
 * Generate a new Ethereum key pair with mnemonic (BIP39)
 * Returns the private key, address, and mnemonic phrase
 */
export function generateEthereumKeyPair(): { privateKey: string; address: string; mnemonic: string } {
  // Use Mnemonic to generate a proper BIP39 mnemonic
  const mnemonic = ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16));
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  
  return {
    privateKey: wallet.privateKey,
    address: wallet.address,
    mnemonic,
  };
}

/**
 * Generate wallet from mnemonic phrase
 */
export function generateWalletFromMnemonic(mnemonic: string): { privateKey: string; address: string } {
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  return {
    privateKey: wallet.privateKey,
    address: wallet.address,
  };
}

/**
 * Validate mnemonic phrase
 */
export function validateMnemonic(mnemonic: string): boolean {
  try {
    ethers.Wallet.fromPhrase(mnemonic);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get address from Ethereum private key
 */
export function getAddressFromPrivateKey(privateKey: string): string {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

/**
 * Encrypt Ethereum private key with password
 * Also encrypts mnemonic if provided
 * Uses the same encryption as the Web Crypto keys for consistency
 */
export async function encryptEthereumPrivateKey(
  privateKey: string,
  password: string,
  mnemonic?: string
): Promise<{ encrypted: string; iv: string; salt: string; address: string; encryptedMnemonic?: string; mnemonicIv?: string }> {
  const salt = generateSalt();
  const encryptionKey = await deriveKeyFromPassword(password, salt, 100000);
  
  // Encrypt the private key string
  const { encrypted, iv } = await encryptData(privateKey, encryptionKey);
  
  // Encrypt mnemonic if provided
  let encryptedMnemonic: string | undefined;
  let mnemonicIv: string | undefined;
  if (mnemonic) {
    const mnemonicSalt = generateSalt();
    const mnemonicKey = await deriveKeyFromPassword(password, mnemonicSalt, 100000);
    const mnemonicEncrypted = await encryptData(mnemonic, mnemonicKey);
    encryptedMnemonic = mnemonicEncrypted.encrypted;
    mnemonicIv = mnemonicEncrypted.iv;
  }
  
  // Get address from private key
  const address = getAddressFromPrivateKey(privateKey);
  
  return {
    encrypted,
    iv,
    salt: arrayBufferToBase64(salt.buffer),
    address,
    encryptedMnemonic,
    mnemonicIv,
  };
}

/**
 * Decrypt Ethereum private key
 */
export async function decryptEthereumPrivateKey(
  encrypted: string,
  iv: string,
  salt: string,
  password: string
): Promise<string> {
  const saltBuffer = base64ToArrayBuffer(salt);
  const encryptionKey = await deriveKeyFromPassword(password, new Uint8Array(saltBuffer));
  
  const privateKey = await decryptData(encrypted, iv, encryptionKey);
  return privateKey;
}

/**
 * Sign Ethereum transaction hash with private key
 * This is used for signing transaction hashes (not raw transaction data)
 */
export function signEthereumHash(hash: string, privateKey: string): string {
  const wallet = new ethers.Wallet(privateKey);
  // Note: In practice, you'd sign the transaction object, not just the hash
  // This is a helper for signing pre-computed hashes
  return wallet.signingKey.sign(hash).serialized;
}

/**
 * Verify Ethereum signature
 */
export function verifyEthereumSignature(
  message: string,
  signature: string,
  address: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

