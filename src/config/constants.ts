// Contract addresses (will be set via environment variables)
export const CONTRACT_ADDRESSES = {
  VEIL_TOKEN: process.env.NEXT_PUBLIC_VEIL_TOKEN_ADDRESS || '',
  ACCOUNT_FACTORY: process.env.NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS || '',
  ENTRY_POINT: process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS || '',
};

// API endpoints
// Note: No key management server - all keys are client-side only (non-custodial)
export const API_ENDPOINTS = {
  AUTH: process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3000',
  INDEXER: process.env.NEXT_PUBLIC_INDEXER_API_URL || 'http://localhost:3002',
};

// RPC URLs
export const RPC_URLS = {
  MANTLE_TESTNET: process.env.NEXT_PUBLIC_MANTLE_TESTNET_RPC || 'https://rpc.testnet.mantle.xyz',
  MANTLE_MAINNET: process.env.NEXT_PUBLIC_MANTLE_MAINNET_RPC || 'https://rpc.mantle.xyz',
};

// Session configuration
export const SESSION_CONFIG = {
  EXPIRY_HOURS: 36,
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
};

// Security configuration
export const SECURITY_CONFIG = {
  PBKDF2_ITERATIONS: 100000,
  SESSION_KEY_EXPIRY_HOURS: 36,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW_MINUTES: 15,
};

// Network configuration
export const NETWORK_CONFIG = {
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) : 5001, // Mantle Testnet
  CHAIN_NAME: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Mantle Testnet',
  NATIVE_CURRENCY: {
    name: 'Mantle',
    symbol: 'MNT',
    decimals: 18,
  },
};

