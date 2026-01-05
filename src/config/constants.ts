// Contract addresses (Mantle Sepolia Testnet)
export const CONTRACT_ADDRESSES = {
  VEIL_TOKEN: process.env.NEXT_PUBLIC_VEIL_TOKEN_ADDRESS || '0xc9620e577D0C43B5D09AE8EA406eced818402739',
  ACCOUNT_FACTORY: process.env.NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS || '0x55633aFf235600374Ef58D2A5e507Aa39C9e0D37',
  ENTRY_POINT: process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS || '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  VERIFIER: process.env.NEXT_PUBLIC_VERIFIER_ADDRESS || '0x5ba2d923f8b1E392997D87060E207E1BAAeA3E13',
  POSEIDON_HASHER: process.env.NEXT_PUBLIC_POSEIDON_HASHER_ADDRESS || '0x7ff31538A93950264e26723C959a9D196bfB9779',
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
  MANTLE_SEPOLIA: process.env.NEXT_PUBLIC_MANTLE_SEPOLIA_RPC || 'https://rpc.sepolia.mantle.xyz',
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

// Network configuration (Mantle Sepolia Testnet)
export const NETWORK_CONFIG = {
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) : 5003, // Mantle Sepolia Testnet
  CHAIN_NAME: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Mantle Sepolia Testnet',
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || RPC_URLS.MANTLE_SEPOLIA,
  EXPLORER: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://explorer.sepolia.mantle.xyz',
  NATIVE_CURRENCY: {
    name: 'Mantle',
    symbol: 'MNT',
    decimals: 18,
  },
};

