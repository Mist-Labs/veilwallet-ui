# Blockchain RPC Methods

VeilWallet uses standard Ethereum JSON-RPC methods to interact with the Mantle blockchain.

## RPC Endpoint

- **Testnet:** `NEXT_PUBLIC_MANTLE_TESTNET_RPC` (default: `https://rpc.testnet.mantle.xyz`)
- **Mainnet:** `NEXT_PUBLIC_MANTLE_MAINNET_RPC` (default: `https://rpc.mantle.xyz`)

## Standard Ethereum RPC Methods

### eth_blockNumber

Get the current block number.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "eth_blockNumber",
  "params": [],
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1a2b3c"
}
```

**Usage:**
```typescript
const blockNumber = await blockchainService.getBlockNumber();
// Returns: 1715004 (decimal)
```

### eth_getTransactionReceipt

Get transaction receipt by hash.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "eth_getTransactionReceipt",
  "params": ["0x..."],
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "transactionHash": "0x...",
    "blockNumber": "0x1a2b3c",
    "blockHash": "0x...",
    "transactionIndex": "0x0",
    "from": "0x...",
    "to": "0x...",
    "gasUsed": "0x5208",
    "cumulativeGasUsed": "0x5208",
    "contractAddress": null,
    "logs": [],
    "status": "0x1"
  }
}
```

**Usage:**
```typescript
const receipt = await blockchainService.getTransactionReceipt(txHash);
```

## ERC-4337 UserOperation Methods

### eth_sendUserOperation

Send a UserOperation to the bundler (ERC-4337).

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "eth_sendUserOperation",
  "params": [
    {
      "sender": "0x...",
      "nonce": "0x0",
      "initCode": "0x",
      "callData": "0x...",
      "callGasLimit": "0x5208",
      "verificationGasLimit": "0x5208",
      "preVerificationGas": "0xc350",
      "maxFeePerGas": "0x3b9aca00",
      "maxPriorityFeePerGas": "0x3b9aca00",
      "paymasterAndData": "0x",
      "signature": "0x..."
    },
    "0x..."
  ],
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x..."
}
```

### eth_getUserOperationReceipt

Get UserOperation receipt by hash.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "eth_getUserOperationReceipt",
  "params": ["0x..."],
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "userOpHash": "0x...",
    "entryPoint": "0x...",
    "sender": "0x...",
    "nonce": "0x0",
    "paymaster": "0x",
    "actualGasCost": "0x5208",
    "actualGasUsed": "0x5208",
    "success": true,
    "logs": [],
    "receipt": {
      "transactionHash": "0x...",
      "blockNumber": "0x1a2b3c",
      "blockHash": "0x...",
      "status": "0x1"
    }
  }
}
```

## Contract-Specific Methods

### VeilToken Contract Methods

#### balanceOf

Get ERC20 balance for an address.

**Method:** `eth_call`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [
    {
      "to": "0x...", // VeilToken contract address
      "data": "0x70a08231000000000000000000000000..." // balanceOf(address)
    },
    "latest"
  ],
  "id": 1
}
```

#### getCommitments

Get all commitments for an address.

**Method:** `eth_call`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [
    {
      "to": "0x...", // VeilToken contract address
      "data": "0x..." // getCommitments(address)
    },
    "latest"
  ],
  "id": 1
}
```

### AccountFactory Contract Methods

#### createAccount

Create a new smart account.

**Method:** `eth_sendTransaction` or `eth_sendUserOperation`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "eth_sendUserOperation",
  "params": [
    {
      "sender": "0x...",
      "callData": "0x..." // createAccount(owner)
      // ... other UserOperation fields
    },
    "0x..." // EntryPoint address
  ],
  "id": 1
}
```

#### getAddress

Get account address for an owner.

**Method:** `eth_call`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [
    {
      "to": "0x...", // AccountFactory contract address
      "data": "0x..." // getAddress(address)
    },
    "latest"
  ],
  "id": 1
}
```

## Smart Account Contract Methods

### execute

Execute a single transaction.

**Method:** `eth_sendUserOperation`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "eth_sendUserOperation",
  "params": [
    {
      "sender": "0x...", // SmartAccount address
      "callData": "0x..." // execute(address, uint256, bytes)
      // ... other UserOperation fields
    },
    "0x..." // EntryPoint address
  ],
  "id": 1
}
```

### executeBatch

Execute multiple transactions in a batch.

**Method:** `eth_sendUserOperation`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "eth_sendUserOperation",
  "params": [
    {
      "sender": "0x...", // SmartAccount address
      "callData": "0x..." // executeBatch(address[], bytes[])
      // ... other UserOperation fields
    },
    "0x..." // EntryPoint address
  ],
  "id": 1
}
```

## Error Responses

All RPC methods return standard JSON-RPC error responses:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "execution reverted"
  }
}
```

Common error codes:
- `-32700`: Parse error
- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32000`: Server error
- `-32001`: Resource not found
- `-32002`: Resource unavailable
- `-32003`: Transaction rejected

