# VeilWallet Project Structure

## 📁 Directory Overview

```
veilwallet-ui/
├── public/                 # Static assets
│   ├── content.js         # Web3 provider injection script
│   ├── inpage.js          # Provider communication script
│   └── icon-*.png         # Extension icons
│
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── PasswordModal.tsx
│   │   │   └── Toast.tsx
│   │   └── ProtectionBanner.tsx
│   │
│   ├── pages/            # Application pages
│   │   ├── SendPage.tsx  # Send tokens page
│   │   ├── ReceivePage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── *-main.tsx    # Entry points for each page
│   │
│   ├── popup/            # Extension popup
│   │   ├── PopupApp.tsx  # Main dashboard
│   │   └── main.tsx      # Popup entry point
│   │
│   ├── wallet/           # Wallet creation/unlock
│   │   ├── CreateWallet.tsx
│   │   ├── UnlockWallet.tsx
│   │   └── *-main.tsx
│   │
│   ├── services/         # Business logic
│   │   ├── accountProtection.service.ts  # Smart account protection
│   │   ├── key.service.ts               # Key management
│   │   ├── network.service.ts           # Network operations
│   │   ├── privateTransfer.service.ts   # Privacy transfers
│   │   ├── smartAccount.service.ts      # Smart account operations
│   │   └── wallet.service.ts            # Wallet operations
│   │
│   ├── config/           # Configuration
│   │   └── constants.ts  # Network & contract addresses
│   │
│   ├── lib/              # Libraries
│   │   └── abis.ts       # Smart contract ABIs
│   │
│   ├── utils/            # Utilities
│   │   ├── ethereumKeyGeneration.ts
│   │   ├── ethereumKeyStorage.ts
│   │   └── extensionCheck.ts
│   │
│   └── styles/           # Global styles
│       └── globals.css
│
├── *.html                # HTML entry points for each page
├── background.js         # Extension background service worker
├── manifest.json         # Chrome extension manifest
├── vite.config.ts        # Vite configuration
├── vite-extension-build.js  # Custom build script
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies & scripts
└── README.md             # Project documentation
```

## 🔑 Key Files

### Entry Points
- `popup.html` → Dashboard entry
- `send.html` → Send tokens page
- `receive.html` → Receive tokens page
- `history.html` → Transaction history
- `settings.html` → Settings page
- `wallet-create.html` → Create wallet
- `wallet-unlock.html` → Unlock wallet

### Services
- **accountProtection.service.ts** - Deploy & manage smart accounts
- **smartAccount.service.ts** - Smart account operations (execute, session keys)
- **privateTransfer.service.ts** - Privacy transfers with commitments
- **key.service.ts** - Secure key generation & storage
- **wallet.service.ts** - Token balances & transactions
- **network.service.ts** - RPC & gas estimation

### Components
- **UI Components** - Reusable buttons, inputs, modals, toasts
- **ProtectionBanner** - Smart account protection prompt

## 🚀 Build Process

1. `pnpm run dev` - Development server
2. `pnpm run build:extension` - Build for Chrome extension
3. Output: `extension/` directory ready to load

## 📦 Tech Stack

- **Build Tool**: Vite
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: ethers.js v6
- **Network**: Mantle Sepolia Testnet

