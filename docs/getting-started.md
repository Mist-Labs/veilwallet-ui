# Getting Started

## Prerequisites

- Node.js 18+
- npm or yarn
- Chrome or Firefox browser (for extension)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3000
NEXT_PUBLIC_INDEXER_API_URL=http://localhost:3002
NEXT_PUBLIC_VEIL_TOKEN_ADDRESS=
NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS=
NEXT_PUBLIC_ENTRY_POINT_ADDRESS=
NEXT_PUBLIC_MANTLE_TESTNET_RPC=https://rpc.testnet.mantle.xyz
NEXT_PUBLIC_MANTLE_MAINNET_RPC=https://rpc.mantle.xyz
NEXT_PUBLIC_CHAIN_ID=5001
NEXT_PUBLIC_CHAIN_NAME=Mantle Testnet
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

