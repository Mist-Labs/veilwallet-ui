# Wallet API

Base URL: `NEXT_PUBLIC_INDEXER_API_URL` (default: `http://localhost:3002`)

## Get Balance

Get wallet balance (transparent + private).

**Endpoint:** `GET /wallet/balance/{accountAddress}`

**Headers:**
- Cookie: `sessionToken` (httpOnly cookie)

**Response:**
```json
{
  "success": true,
  "data": {
    "transparent": "1000000000000000000",
    "private": "500000000000000000",
    "total": "1500000000000000000"
  }
}
```

## Get Private Balance

Get private balance (sum of unspent commitments).

**Endpoint:** `GET /wallet/private-balance/{accountAddress}`

**Headers:**
- Cookie: `sessionToken` (httpOnly cookie)

**Response:**
```json
{
  "success": true,
  "data": "500000000000000000"
}
```

## Get Commitments

Get all commitments for an address.

**Endpoint:** `GET /wallet/commitments/{accountAddress}`

**Headers:**
- Cookie: `sessionToken` (httpOnly cookie)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hash": "0x...",
      "amount": "1000000000000000000",
      "blindingFactor": "0x...",
      "recipient": "0x...",
      "nonce": "0x...",
      "createdAt": "2025-01-01T00:00:00Z",
      "isSpent": false
    }
  ]
}
```

## Get Transactions

Get transaction history for an address.

**Endpoint:** `GET /wallet/transactions/{accountAddress}?limit=50&offset=0`

**Query Parameters:**
- `limit` (optional): Number of transactions to return (default: 50)
- `offset` (optional): Number of transactions to skip (default: 0)

**Headers:**
- Cookie: `sessionToken` (httpOnly cookie)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tx_id",
      "type": "private",
      "from": "0x...",
      "to": "0x...",
      "amount": "1000000000000000000",
      "commitment": "0x...",
      "nullifier": "0x...",
      "status": "confirmed",
      "blockNumber": 12345,
      "transactionHash": "0x...",
      "timestamp": "2025-01-01T00:00:00Z"
    }
  ]
}
```

## Send Private Transfer

Send a private VeilToken transfer.

**Endpoint:** `POST /wallet/transfer/private`

**Headers:**
- Cookie: `sessionToken` (httpOnly cookie)
- Content-Type: `application/json`

**Request Body:**
```json
{
  "accountAddress": "0x...",
  "recipientCommitment": "0x...",
  "nullifier": "0x...",
  "amount": "1000000000000000000",
  "proof": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x..."
  }
}
```

## Send Transparent Transfer

Send a transparent ERC20 transfer.

**Endpoint:** `POST /wallet/transfer/transparent`

**Headers:**
- Cookie: `sessionToken` (httpOnly cookie)
- Content-Type: `application/json`

**Request Body:**
```json
{
  "accountAddress": "0x...",
  "to": "0x...",
  "amount": "1000000000000000000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x..."
  }
}
```

## Generate Commitment

Generate a commitment for receiving private transfers.

**Endpoint:** `POST /wallet/commitment/generate`

**Headers:**
- Cookie: `sessionToken` (httpOnly cookie)
- Content-Type: `application/json`

**Request Body:**
```json
{
  "amount": "1000000000000000000",
  "recipientAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hash": "0x...",
    "amount": "1000000000000000000",
    "blindingFactor": "0x...",
    "recipient": "0x...",
    "nonce": "0x...",
    "createdAt": "2025-01-01T00:00:00Z",
    "isSpent": false
  }
}
```

