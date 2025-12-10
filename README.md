# VeilWallet

Privacy-first, non-custodial Account Abstraction wallet extension for Mantle blockchain.

## Quick Links

- [Documentation](docs/README.md)
- [API Reference](docs/api-reference/README.md)
- [Getting Started](docs/getting-started.md)

## Features

- **Non-Custodial**: All keys generated and stored client-side in extension storage
- **Privacy-First**: Private balance visibility for VeilToken with commitment-based transfers
- **Account Abstraction**: ERC-4337 support for gasless transactions
- **Phishing Protection**: Keys stored in extension storage, isolated from web pages
- **Email OTP Authentication**: Secure authentication with 36-hour session expiry

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   │   ├── login/        # Login page
│   │   ├── signup/       # Signup page
│   │   └── otp/          # OTP verification page
│   ├── dashboard/        # Main dashboard
│   └── wallet/           # Wallet features
│       ├── send/         # Send tokens
│       ├── receive/      # Receive tokens
│       └── transactions/ # Transaction history
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
- npm or yarn

### Installation

```bash
npm install
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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Architecture

### Frontend (This Project) - Non-Custodial Browser Extension
- **Framework**: Next.js 16 with App Router (built for extension popup)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **State Management**: React Hooks
- **Key Management**: Client-side only (Web Crypto API + Extension Storage API)
  - **Extension Storage**: Keys stored in `chrome.storage.local` / `browser.storage.local`
  - **Isolated from web pages**: Phishing sites cannot access extension storage
  - **Browser-encrypted**: Storage automatically encrypted by browser
- **Signing**: All transactions signed locally, never sent to server

### Backend Services (Separate)
- **Auth Server**: Email OTP + password authentication (no key access)
- **Indexer Service**: Commitment indexing and balance calculation (read-only)
- **No Key Server**: Keys are never stored or accessed by servers

### Smart Contracts
- **VeilToken**: Privacy token with commitment-based transfers
- **AccountFactory**: ERC-4337 account factory
- **SmartAccount**: ERC-4337 wallet implementation

## Key Concepts

### Account Abstraction (ERC-4337)
- Gasless transactions via session keys
- Social recovery via guardians
- Batch transaction execution

### Privacy (VeilToken)
- Commitment-based private transfers
- Nullifier system prevents double-spending
- Encrypted balance storage for viewing

### Key Management (Non-Custodial + Extension-Isolated)
- **Client-side generation**: All keys generated in browser using Web Crypto API
- **Extension storage**: Encrypted keys stored in browser extension storage API (isolated from web pages)
- **Phishing protection**: Keys are ONLY accessible by the extension, not by web pages
- **Password encryption**: Private keys encrypted with user password (PBKDF2, 100k iterations)
- **No server access**: Servers never see or store private keys
- **Session keys**: Derived client-side for gasless transactions

## Development Roadmap

### MVP (Weeks 1-3)
- ✅ Basic UI structure
- ✅ Authentication flow
- ✅ Dashboard with balance display
- ✅ Send/Receive functionality
- ⏳ Smart contract integration
- ⏳ Backend API integration

### Phase 2 (Weeks 4-5)
- Enhanced security features
- Fingerprint/biometric authentication
- Guardian-based social recovery

### Phase 3 (Weeks 6-8)
- DeFi integration
- DEX swaps
- Staking interface

### Phase 4 (Weeks 9-12)
- Multi-token privacy (PrivacyPool)
- Advanced zkSNARK circuits

## Security Considerations

### Non-Custodial Security + Phishing Protection
- **Private keys never leave device**: All keys generated and stored locally
- **Extension-isolated storage**: Keys stored in browser extension storage API
  - **Phishing sites CANNOT access keys**: Extension storage is isolated from web page context
  - **Only extension can retrieve keys**: Web pages cannot read extension storage
  - **Browser-encrypted**: Extension storage is automatically encrypted by the browser
- **Client-side encryption**: Keys encrypted with user password (PBKDF2, 100k iterations)
- **No server key access**: Servers cannot access or recover keys
- **User controls keys**: Users can export/backup keys if needed
- **Context verification**: All key operations verify extension context before execution

### Additional Security
- All sensitive data encrypted at rest
- HTTPS only in production
- Rate limiting on API endpoints
- Session expiry after 36 hours
- IP change detection
- No seed phrases stored (uses password-based key derivation)

## License

Private - Mist Labs
