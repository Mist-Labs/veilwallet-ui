// Contract ABIs for VeilWallet smart contracts

export const ACCOUNT_FACTORY_ABI = [
  'function getAddress(address owner, uint256 salt) public view returns (address)',
  'function createAccount(address owner, uint256 salt) external returns (address)',
  'function entryPoint() public view returns (address)',
  'event AccountCreated(address indexed account, address indexed owner, uint256 salt)',
] as const;

export const SMART_ACCOUNT_ABI = [
  // Account Management
  'function owner() public view returns (address)',
  'function signer() public view returns (address)',
  'function entryPoint() public view returns (address)',
  'function changeOwner(address newOwner) external',
  
  // Execution
  'function execute(address target, uint256 value, bytes calldata data) external payable',
  'function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas) external payable',
  
  // Session Keys
  'function addSessionKey(address sessionKey, uint256 validUntil, uint256 spendingLimit) external',
  'function revokeSessionKey(address sessionKey) external',
  'function sessionKeys(address) public view returns (uint256 validUntil, uint256 spendingLimit, uint256 spentAmount)',
  
  // Guardian Recovery
  'function setGuardian(address _guardian) external',
  'function initiateRecovery(address newOwner) external',
  'function executeRecovery() external',
  'function guardian() public view returns (address)',
  'function pendingRecovery() public view returns (address newOwner, uint256 timestamp, bool executed)',
  
  // ERC-4337
  'function validateUserOp((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds) external returns (uint256 validationData)',
  
  // Events
  'event SessionKeyAdded(address indexed sessionKey, uint256 validUntil, uint256 spendingLimit)',
  'event SessionKeyRevoked(address indexed sessionKey)',
  'event RecoveryInitiated(address indexed newOwner, uint256 timestamp)',
  'event RecoveryExecuted(address indexed oldOwner, address indexed newOwner)',
  'event OwnerChanged(address indexed oldOwner, address indexed newOwner)',
] as const;

export const VEIL_TOKEN_ABI = [
  // Standard ERC20
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) public returns (bool)',
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function balanceOf(address account) public view returns (uint256)',
  'function totalSupply() public view returns (uint256)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  
  // Private Transfers
  'function privateTransfer(bytes32 commitment, bytes32 nullifier, uint256 amount, bytes calldata proof) external',
  'function claimFromCommitment(bytes32 commitment, uint256 amount, bytes calldata proof) external',
  'function createCommitment(bytes32[4] calldata inputs) external view returns (bytes32)',
  'function isNullifierUsed(bytes32 nullifier) external view returns (bool)',
  'function isCommitmentValid(bytes32 commitment) external view returns (bool)',
  'function mint(address to, uint256 amount) external',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event PrivateTransfer(bytes32 indexed commitment, bytes32 indexed nullifier, address indexed recipient)',
  'event CommitmentClaimed(bytes32 indexed commitment, address indexed recipient, uint256 amount)',
  'event EncryptedBalanceUpdated(address indexed account, bytes encryptedData)',
] as const;

export const VERIFIER_ABI = [
  'function verifyCommitment(bytes32[4] calldata inputs) external view returns (bytes32)',
  'function verifyCommitment2(bytes32[2] calldata inputs) external view returns (bytes32)',
  'function verifyCommitment3(bytes32[3] calldata inputs) external view returns (bytes32)',
  'function verifyCommitmentMatch(bytes32[4] calldata inputs, bytes32 expectedCommitment) external view returns (bool)',
  'function hasher() public view returns (address)',
] as const;

// ERC721 ABI (NFTs)
export const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function tokenByIndex(uint256 index) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
] as const;

// ERC1155 ABI (Multi-token standard)
export const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) view returns (uint256[])',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data)',
  'function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data)',
  'function uri(uint256 id) view returns (string)',
] as const;

// Standard ERC20 ABI
export const ERC20_ABI = [
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) public returns (bool)',
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function balanceOf(address account) public view returns (uint256)',
  'function totalSupply() public view returns (uint256)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function decimals() public view returns (uint8)',
  'function name() public view returns (string)',
  'function symbol() public view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const;

