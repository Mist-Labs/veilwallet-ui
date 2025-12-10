# Architecture

## Overview

VeilWallet is a non-custodial browser extension wallet built with Next.js and TypeScript.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              VeilWallet Extension                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   UI (React) │  │ Key Service  │  │  Blockchain  │  │
│  │   Next.js    │  │  (Client)    │  │   Service    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                           │                              │
│                  Extension Storage                        │
│              (chrome.storage.local)                        │
└───────────────────────────┼──────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼────────┐
│  Auth Server   │                    │ Indexer Service │
│  (Port 3000)   │                    │  (Port 3002)    │
│                │                    │                 │
│ - Email OTP    │                    │ - Commitments  │
│ - Sessions     │                    │ - Transactions │
│ - No keys      │                    │ - Balance calc │
└────────────────┘                    └─────────────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │  Mantle Blockchain │
                  │                   │
                  │ - VeilToken       │
                  │ - AccountFactory  │
                  │ - SmartAccount    │
                  │ - EntryPoint      │
                  └───────────────────┘
```

## Key Components

### Frontend (Extension)

- **Framework**: Next.js 16 with App Router
- **UI**: React 19 with Tailwind CSS
- **Language**: TypeScript
- **State**: React Hooks

### Key Management

- **Storage**: Browser Extension Storage API (`chrome.storage.local`)
- **Generation**: Web Crypto API (ECDSA P-256)
- **Encryption**: AES-GCM with PBKDF2 key derivation
- **Isolation**: Keys only accessible by extension, not web pages

### Backend Services

- **Auth Server**: Email OTP authentication, session management
- **Indexer Service**: Commitment indexing, balance calculation
- **No Key Server**: Keys never stored or accessed by servers

### Smart Contracts

- **VeilToken**: Privacy token with commitment-based transfers
- **AccountFactory**: ERC-4337 account factory
- **SmartAccount**: ERC-4337 wallet implementation
- **EntryPoint**: ERC-4337 entry point contract

## Data Flow

### Key Generation

1. User creates account with email/password
2. Extension generates ECDSA key pair (client-side)
3. Private key encrypted with password (PBKDF2)
4. Encrypted key stored in extension storage
5. Public key used to derive account address

### Transaction Signing

1. User initiates transaction
2. Extension retrieves encrypted key from extension storage
3. User enters password to decrypt key
4. Transaction signed locally with private key
5. Signature sent to blockchain (via bundler for ERC-4337)
6. Key cleared from memory

### Private Transfer

1. User generates commitment for recipient
2. Extension creates nullifier (prevents double-spend)
3. Transaction signed with private key
4. UserOperation sent to bundler
5. Bundler submits to EntryPoint
6. VeilToken contract verifies and processes

## Security Architecture

### Extension Storage Isolation

- Keys stored in `chrome.storage.local` / `browser.storage.local`
- Isolated from web page context
- Phishing sites cannot access extension storage
- Browser automatically encrypts storage

### Context Verification

- All key operations verify extension context
- Operations fail if not in extension context
- Prevents web page access to keys

### Encryption

- Private keys encrypted with user password
- PBKDF2 with 100,000 iterations
- AES-GCM encryption for storage
- Keys only decrypted in memory during signing

