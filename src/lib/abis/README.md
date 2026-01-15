## Files

- **AccountFactory.json** - Factory contract for creating smart accounts
- **SmartAccount.json** - The main smart contract wallet
- **VeilToken.json** - Privacy-preserving ERC20 token
- **Verifier.json** - Commitment verifier for private transfers
- **PoseidonHasher.json** - Poseidon hash implementation

## Usage

Import ABIs in your TypeScript/JavaScript code:

```typescript
// Import just the ABI array
import { ACCOUNT_FACTORY_ABI, SMART_ACCOUNT_ABI } from '@/lib/abis';

// Or import the full artifact (includes bytecode, metadata, etc.)
import { AccountFactoryArtifact } from '@/lib/abis';

// Use with ethers.js
import { ethers } from 'ethers';
const contract = new ethers.Contract(address, ACCOUNT_FACTORY_ABI, provider);
```

## Source

These ABIs are automatically exported from the compiled contracts in:
`/home/superman/Desktop/projects/mist-labs/Mantle-Protocol/packages/contracts/out/`

## Contract Addresses (Mantle Sepolia Testnet)

- AccountFactory: `0x55633aFf235600374Ef58D2A5e507Aa39C9e0D37`
- VeilToken: `0xc9620e577D0C43B5D09AE8EA406eced818402739`
- Verifier: `0x5ba2d923f8b1E392997D87060E207E1BAAeA3E13`
- PoseidonHasher: `0x7ff31538A93950264e26723C959a9D196bfB9779`
- EntryPoint: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` (canonical)

