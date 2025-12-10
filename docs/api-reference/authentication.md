# Authentication API

Base URL: `NEXT_PUBLIC_AUTH_API_URL` (default: `http://localhost:3000`)

## Signup

Register a new user account.

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "accountAddress": "0x...",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "sessionToken": "jwt_token",
    "requiresOTP": false
  }
}
```

## Login

Authenticate with email and password.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "accountAddress": "0x...",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "sessionToken": "jwt_token",
    "requiresOTP": false
  }
}
```

**Note:** If `requiresOTP` is `true`, user must verify OTP before accessing the wallet.

## Request OTP

Request a one-time password code via email.

**Endpoint:** `POST /auth/otp/request`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent to email"
  }
}
```

## Verify OTP

Verify the OTP code and complete authentication.

**Endpoint:** `POST /auth/otp/verify`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "accountAddress": "0x...",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "sessionToken": "jwt_token"
  }
}
```

## Get Current User

Get the currently authenticated user.

**Endpoint:** `GET /auth/me`

**Headers:**
- Cookie: `sessionToken` (httpOnly cookie)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "accountAddress": "0x...",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

## Validate Session

Check if the current session is valid.

**Endpoint:** `GET /auth/validate`

**Headers:**
- Cookie: `sessionToken` (httpOnly cookie)

**Response:**
```json
{
  "success": true
}
```

## Logout

Logout the current user and invalidate session.

**Endpoint:** `POST /auth/logout`

**Headers:**
- Cookie: `sessionToken` (httpOnly cookie)

**Response:**
```json
{
  "success": true
}
```

