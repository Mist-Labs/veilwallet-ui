# VeilWallet

Privacy-first, non-custodial Account Abstraction wallet extension for Mantle blockchain.

## ⚡ Quick Start

**Built with Vite + React for optimal Chrome extension performance**

```bash
# Install dependencies
pnpm install

# Build extension
pnpm run build:extension

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the "extension/" folder
```

## Quick Links

- [Documentation](docs/README.md)
- [API Reference](docs/api-reference/README.md)
- [Getting Started](docs/getting-started.md)
- [Vite Setup Guide](VITE_SETUP.md)

## Features

- **Non-Custodial**: All keys generated and stored client-side in extension storage
- **Privacy-First**: Private balance visibility for VeilToken with commitment-based transfers
- **Account Abstraction**: ERC-4337 support for gasless transactions
- **Phishing Protection**: Keys stored in extension storage, isolated from web pages
- **Email OTP Authentication**: Secure authentication with 36-hour session expiry

## Project Structure

```
src/
├── popup/                 # Extension popup entry
│   ├── main.tsx          # Popup main entry
│   └── PopupApp.tsx      # Popup routing logic
├── wallet/               # Wallet pages
│   ├── CreateWallet.tsx  # Create wallet UI
│   ├── UnlockWallet.tsx  # Unlock wallet UI
│   ├── create-main.tsx   # Create wallet entry
│   └── unlock-main.tsx   # Unlock wallet entry
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   └── wallet/          # Wallet-specific components
├── services/            # API and business logic services
│   ├── auth.service.ts  # Authentication service
│   ├── key.service.ts   # Key management service
│   ├── wallet.service.ts # Wallet operations service
│   └── blockchain.service.ts # Blockchain interactions
├── hooks/               # React hooks
│   ├── useAuth.ts       # Authentication hook
│   └── useWallet.ts     # Wallet data hook
├── utils/               # Utility functions
│   ├── encryption.ts    # Encryption utilities
│   ├── session.ts       # Session management
│   └── format.ts        # Formatting utilities
├── types/               # TypeScript type definitions
│   ├── index.ts         # Main types
│   └── contracts.ts     # Contract types
└── config/              # Configuration
    └── constants.ts     # App constants
```

## Features

### Authentication
- Email + Password login
- Email OTP verification (required every 36 hours or on IP change)
- Session management with 36-hour expiry
- Secure logout

### Wallet Features
- **Balance Display**: View transparent and private VeilToken balances
- **Send Tokens**: Send transparent or private transfers
- **Receive Tokens**: Generate commitments for private transfers
- **Transaction History**: View all transactions with status

### Security
- MPC-based key management (2/3 shards)
- Session keys for gasless transactions
- Encrypted local storage
- IP change detection

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Endpoints
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3000
NEXT_PUBLIC_INDEXER_API_URL=http://localhost:3002
# Note: No key management server - all keys are client-side only

# Contract Addresses
NEXT_PUBLIC_VEIL_TOKEN_ADDRESS=
NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS=
NEXT_PUBLIC_ENTRY_POINT_ADDRESS=

# RPC URLs
NEXT_PUBLIC_MANTLE_TESTNET_RPC=https://rpc.testnet.mantle.xyz
NEXT_PUBLIC_MANTLE_MAINNET_RPC=https://rpc.mantle.xyz

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=5001
NEXT_PUBLIC_CHAIN_NAME=Mantle Testnet
```

### Development

```bash
# Start Vite dev server
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build Extension

```bash
# Build and package for Chrome extension
pnpm run build:extension
```

This will create an `extension/` directory ready to load in Chrome.

### Preview Build

```bash
# Preview production build locally
pnpm run preview
```