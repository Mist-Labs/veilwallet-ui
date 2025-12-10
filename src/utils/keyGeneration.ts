/**
 * Client-side key generation for non-custodial wallet
 * Uses Web Crypto API to generate ECDSA keys for signing
 */

import { deriveKeyFromPassword, encryptData, decryptData, generateSalt } from './encryption';

/**
 * Generate a new ECDSA key pair for signing transactions
 */
export async function generateKeyPair(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }> {
  return crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256', // secp256r1
    },
    true, // extractable
    ['sign', 'verify']
  );
}

/**
 * Export private key to JWK format
 */
export async function exportPrivateKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

/**
 * Export public key to JWK format
 */
export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

/**
 * Import private key from JWK format
 */
export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign']
  );
}

/**
 * Import public key from JWK format
 */
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['verify']
  );
}

/**
 * Derive wallet key from password (for encrypting the private key)
 */
export async function deriveWalletKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  return deriveKeyFromPassword(password, salt, 100000);
}

/**
 * Encrypt and store private key
 */
export async function encryptPrivateKey(
  privateKey: CryptoKey,
  password: string
): Promise<{ encrypted: string; iv: string; salt: string; publicKey: string }> {
  const salt = generateSalt();
  const encryptionKey = await deriveWalletKey(password, salt);
  
  const privateKeyJwk = await exportPrivateKey(privateKey);
  const publicKeyJwk = await exportPublicKey(await getPublicKeyFromPrivate(privateKey));
  
  const privateKeyStr = JSON.stringify(privateKeyJwk);
  const { encrypted, iv } = await encryptData(privateKeyStr, encryptionKey);
  
  return {
    encrypted,
    iv,
    salt: arrayBufferToBase64(salt.buffer),
    publicKey: JSON.stringify(publicKeyJwk),
  };
}

/**
 * Decrypt and restore private key
 */
export async function decryptPrivateKey(
  encrypted: string,
  iv: string,
  salt: string,
  password: string
): Promise<CryptoKey> {
  const saltBuffer = base64ToArrayBuffer(salt);
  const encryptionKey = await deriveWalletKey(password, new Uint8Array(saltBuffer));
  
  const privateKeyStr = await decryptData(encrypted, iv, encryptionKey);
  const privateKeyJwk = JSON.parse(privateKeyStr);
  
  return importPrivateKey(privateKeyJwk);
}

/**
 * Get public key from private key
 * For ECDSA, the public key is derived from the private key
 */
async function getPublicKeyFromPrivate(privateKey: CryptoKey): Promise<CryptoKey> {
  // Export private key to JWK format
  const privateJwk = await exportPrivateKey(privateKey);
  
  // Create public key JWK by removing the private component
  const publicJwk: JsonWebKey = {
    kty: privateJwk.kty,
    crv: privateJwk.crv,
    x: privateJwk.x,
    y: privateJwk.y,
    // 'd' is the private component - we exclude it for public key
  };
  
  return importPublicKey(publicJwk);
}

/**
 * Sign data with private key
 */
export async function signData(data: ArrayBuffer, privateKey: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    data
  );
}

/**
 * Verify signature with public key
 */
export async function verifySignature(
  signature: ArrayBuffer,
  data: ArrayBuffer,
  publicKey: CryptoKey
): Promise<boolean> {
  return crypto.subtle.verify(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    publicKey,
    signature,
    data
  );
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

