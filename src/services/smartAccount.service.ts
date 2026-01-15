import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config/constants';
import { ACCOUNT_FACTORY_ABI, SMART_ACCOUNT_ABI } from '@/lib/abis';

export interface SmartAccountInfo {
  address: string;
  owner: string;
  isDeployed: boolean;
}

class SmartAccountService {
  private provider: ethers.JsonRpcProvider;
  private factoryContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.RPC_URL);
    this.factoryContract = new ethers.Contract(
      CONTRACT_ADDRESSES.ACCOUNT_FACTORY,
      ACCOUNT_FACTORY_ABI as any,
      this.provider
    ) as ethers.Contract;
  }

  /**
   * Get predicted smart account address for an owner
   */
  async getPredictedAddress(ownerAddress: string, salt?: string): Promise<string> {
    try {
      console.log('🔮 [SmartAccount] Getting predicted address for owner:', ownerAddress);
      
      // Convert salt to uint256 - if string provided, hash it; if not, use owner address hash
      let saltUint256: bigint;
      if (salt) {
        // If salt is provided as string, hash it to get bytes32, then convert to uint256
        const saltHash = ethers.keccak256(ethers.toUtf8Bytes(salt));
        saltUint256 = BigInt(saltHash);
        console.log('🔮 [SmartAccount] Using provided salt:', salt);
      } else {
        // Default: use owner address hash
        const saltHash = ethers.keccak256(ethers.toUtf8Bytes(ownerAddress.toLowerCase()));
        saltUint256 = BigInt(saltHash);
        console.log('🔮 [SmartAccount] Using default salt (owner address hash)');
      }

      console.log('🔮 [SmartAccount] Calling factory.getAddress with:', {
        owner: ownerAddress,
        salt: saltUint256.toString(),
        factory: CONTRACT_ADDRESSES.ACCOUNT_FACTORY,
      });

      // Try calling the factory contract's getAddress method
      // Based on AccountFactory.sol: getAddress(address owner, uint256 salt) returns (address)
      let address: string;
      try {
        // First try using provider.call directly (more reliable for view functions)
        const iface = new ethers.Interface(ACCOUNT_FACTORY_ABI);
        const encodedData = iface.encodeFunctionData('getAddress', [ownerAddress, saltUint256]);
        
        console.log('🔮 [SmartAccount] Encoded function data:', encodedData);
        console.log('🔮 [SmartAccount] Calling factory at:', CONTRACT_ADDRESSES.ACCOUNT_FACTORY);
        
        const result = await this.provider.call({
          to: CONTRACT_ADDRESSES.ACCOUNT_FACTORY,
          data: encodedData,
        });
        
        console.log('🔮 [SmartAccount] Raw call result:', result);
        console.log('🔮 [SmartAccount] Result length:', result?.length);
        
        if (result && result !== '0x' && result.length >= 66) { // 0x + 64 hex chars = 66
          try {
            const decoded = iface.decodeFunctionResult('getAddress', result);
            address = decoded[0];
            console.log('🔮 [SmartAccount] Decoded address from call:', address);
            
            // Check if the decoded address is valid
            if (!ethers.isAddress(address)) {
              throw new Error(`Decoded value is not a valid address: ${address}`);
            }
          } catch (decodeError: any) {
            console.error('❌ [SmartAccount] Failed to decode result:', decodeError);
            console.error('❌ [SmartAccount] Raw result was:', result);
            throw new Error(`Failed to decode contract result: ${decodeError.message}`);
          }
        } else {
          console.error('❌ [SmartAccount] Invalid or empty result from contract:', result);
          throw new Error(`Empty or invalid result from contract call: ${result}`);
        }
      } catch (callError: any) {
        console.error('❌ [SmartAccount] Provider.call failed:', callError);
        console.error('❌ [SmartAccount] Error details:', {
          message: callError.message,
          code: callError.code,
          data: callError.data,
          reason: callError.reason,
        });
        
        // Fallback to direct contract call
        try {
          console.log('⚠️ [SmartAccount] Trying direct contract call as fallback...');
          address = await (this.factoryContract as any).getAddress(ownerAddress, saltUint256);
          console.log('🔮 [SmartAccount] Direct contract call result:', address);
        } catch (directError: any) {
          console.error('❌ [SmartAccount] Direct contract call also failed:', directError);
          throw new Error(`All contract calls failed. Provider.call: ${callError.message}. Direct call: ${directError.message}. The factory contract at ${CONTRACT_ADDRESSES.ACCOUNT_FACTORY} might not have a working getAddress method or the contract might be broken.`);
        }
      }
      
      console.log('🔮 [SmartAccount] Predicted address from factory:', address);
      
      // Validate that the address is not the factory address itself
      if (!address || address === ethers.ZeroAddress || address.toLowerCase() === CONTRACT_ADDRESSES.ACCOUNT_FACTORY.toLowerCase()) {
        console.error('❌ [SmartAccount] Invalid address returned from factory:', address);
        throw new Error('Factory returned invalid address. This might be a contract issue.');
      }
      
      // Validate it's a valid Ethereum address
      if (!ethers.isAddress(address)) {
        console.error('❌ [SmartAccount] Invalid address format:', address);
        throw new Error('Factory returned invalid address format');
      }
      
      console.log('✅ [SmartAccount] Valid predicted address:', address);
      return address;
    } catch (error: any) {
      console.error('❌ [SmartAccount] Error getting predicted address:', error);
      console.error('❌ [SmartAccount] Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        reason: error.reason,
      });
      throw new Error(`Failed to get predicted smart account address: ${error.message || error.reason || 'Unknown error'}`);
    }
  }

  /**
   * Check if smart account is deployed
   */
  async isDeployed(address: string): Promise<boolean> {
    try {
      const code = await this.provider.getCode(address);
      return code !== '0x';
    } catch (error) {
      console.error('Error checking deployment:', error);
      return false;
    }
  }

  /**
   * Deploy a smart account
   * @param ownerPrivateKey The private key of the owner EOA
   * @param ownerAddress Optional owner address (will be derived from private key if not provided)
   * @param salt Optional salt for deterministic address (defaults to hash of owner address)
   */
  async deployAccount(
    ownerPrivateKey: string,
    ownerAddress?: string,
    salt?: string
  ): Promise<{ success: boolean; address?: string; txHash?: string; error?: string }> {
    try {
      console.log('🚀 [SmartAccount] Starting deployment...');
      const wallet = new ethers.Wallet(ownerPrivateKey, this.provider);
      const owner = ownerAddress || wallet.address;
      console.log('📍 [SmartAccount] Owner address:', owner);

      // Convert salt to uint256 - factory expects uint256, not bytes32
      let saltUint256: bigint;
      if (salt) {
        // If salt is provided as string, hash it to get bytes32, then convert to uint256
        const saltHash = ethers.keccak256(ethers.toUtf8Bytes(salt));
        saltUint256 = BigInt(saltHash);
        console.log('🔑 [SmartAccount] Using provided salt:', salt);
      } else {
        // Default: use owner address hash (as per docs)
        const saltHash = ethers.keccak256(ethers.toUtf8Bytes(owner.toLowerCase()));
        saltUint256 = BigInt(saltHash);
        console.log('🔑 [SmartAccount] Using default salt (owner address hash)');
      }

      // Get predicted address BEFORE deployment
      console.log('🔮 [SmartAccount] Getting predicted address...');
      let predictedAddress: string;
      try {
        predictedAddress = await this.getPredictedAddress(owner, salt);
        console.log('✅ [SmartAccount] Predicted address from factory:', predictedAddress);
      } catch (error: any) {
        console.warn('⚠️ [SmartAccount] Factory getAddress failed, using manual calculation:', error);
        // Fallback to manual calculation if factory call fails
        const saltHash = salt 
          ? BigInt(ethers.keccak256(ethers.toUtf8Bytes(salt)))
          : BigInt(ethers.keccak256(ethers.toUtf8Bytes(owner.toLowerCase())));
        predictedAddress = this.calculateCreate2Address(owner, saltHash);
        console.log('✅ [SmartAccount] Predicted address (manual):', predictedAddress);
      }

      // Check if already deployed
      console.log('🔍 [SmartAccount] Checking if account is already deployed...');
      const deployed = await this.isDeployed(predictedAddress);
      if (deployed) {
        console.log('✅ [SmartAccount] Account already deployed at:', predictedAddress);
        return {
          success: true,
          address: predictedAddress,
        };
      }

      console.log('📝 [SmartAccount] Account not deployed, deploying now...');
      console.log('📝 [SmartAccount] Salt (uint256):', saltUint256.toString());
      console.log('📝 [SmartAccount] Factory address:', CONTRACT_ADDRESSES.ACCOUNT_FACTORY);

      // Check if owner has enough balance for gas
      const balance = await this.provider.getBalance(owner);
      console.log('💰 [SmartAccount] Owner (EOA) balance:', ethers.formatEther(balance), 'MNT');
      
      // Also check smart account balance (for info)
      const smartAccountBalance = await this.provider.getBalance(predictedAddress);
      console.log('💰 [SmartAccount] Smart account balance:', ethers.formatEther(smartAccountBalance), 'MNT');
      
      if (balance === 0n) {
        const errorMsg = smartAccountBalance > 0n
          ? `Your EOA (${owner}) has 0 MNT but needs MNT to pay for gas. Your smart account (${predictedAddress}) has ${ethers.formatEther(smartAccountBalance)} MNT, but the EOA must deploy it. Send MNT to your EOA address to deploy.`
          : `Insufficient balance. Your EOA (${owner}) needs MNT to pay for gas to deploy the smart account. Send MNT to your EOA address first, then deploy. You can also send funds to the smart account address (${predictedAddress}) before deployment - they will be available after deployment.`;
        
        return {
          success: false,
          error: errorMsg,
        };
      }

      // Deploy via factory
      const factoryWithSigner = this.factoryContract.connect(wallet);
      console.log('📤 [SmartAccount] Calling factory.createAccount...');
      console.log('📤 [SmartAccount] Parameters:', {
        owner,
        salt: saltUint256.toString(),
      });
      
      let tx: ethers.ContractTransactionResponse;
      try {
        tx = await factoryWithSigner.createAccount(owner, saltUint256);
        console.log('⏳ [SmartAccount] Transaction sent, hash:', tx.hash);
        console.log('⏳ [SmartAccount] Waiting for confirmation...');
      } catch (txError: any) {
        console.error('❌ [SmartAccount] Transaction send failed:', txError);
        return {
          success: false,
          error: `Transaction failed: ${txError.message || txError.reason || 'Unknown error'}`,
        };
      }
      
      let receipt: ethers.ContractTransactionReceipt | null;
      try {
        receipt = await tx.wait();
        console.log('✅ [SmartAccount] Transaction confirmed! Block:', receipt.blockNumber);
        console.log('✅ [SmartAccount] Gas used:', receipt.gasUsed.toString());
      } catch (waitError: any) {
        console.error('❌ [SmartAccount] Transaction wait failed:', waitError);
        return {
          success: false,
          error: `Transaction confirmation failed: ${waitError.message || waitError.reason || 'Unknown error'}`,
        };
      }

      if (!receipt) {
        return {
          success: false,
          error: 'Transaction receipt not available',
        };
      }

      // Check if transaction succeeded
      if (receipt.status === 0) {
        console.error('❌ [SmartAccount] Transaction reverted!');
        return {
          success: false,
          error: 'Transaction reverted. The smart account deployment failed.',
        };
      }

      // Wait a bit for the contract to be indexed
      console.log('⏳ [SmartAccount] Waiting for contract to be indexed...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify deployment by checking contract code
      console.log('🔍 [SmartAccount] Verifying deployment...');
      const isNowDeployed = await this.isDeployed(predictedAddress);
      
      if (!isNowDeployed) {
        console.error('❌ [SmartAccount] Deployment verification failed!');
        console.error('❌ [SmartAccount] Predicted address:', predictedAddress);
        console.error('❌ [SmartAccount] Transaction hash:', receipt.hash);
        
        // Try to get the actual deployed address from the event
        try {
          const factoryInterface = new ethers.Interface(ACCOUNT_FACTORY_ABI as any);
          const logs = receipt.logs;
          for (const log of logs) {
            try {
              const parsed = factoryInterface.parseLog(log as any);
              if (parsed && parsed.name === 'AccountCreated') {
                const actualAddress = parsed.args.account;
                console.log('✅ [SmartAccount] Found AccountCreated event, actual address:', actualAddress);
                if (actualAddress.toLowerCase() === predictedAddress.toLowerCase()) {
                  // Address matches, deployment succeeded
                  return {
                    success: true,
                    address: actualAddress,
                    txHash: receipt.hash,
                  };
                }
              }
            } catch (e) {
              // Not the log we're looking for
            }
          }
        } catch (eventError) {
          console.error('❌ [SmartAccount] Error parsing events:', eventError);
        }
        
        return {
          success: false,
          error: 'Deployment transaction confirmed but smart account contract not found at predicted address. The account may not have been deployed correctly.',
        };
      }

      console.log('✅ [SmartAccount] Deployment verified! Account is live at:', predictedAddress);

      return {
        success: true,
        address: predictedAddress,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('❌ [SmartAccount] Deployment error:', error);
      console.error('❌ [SmartAccount] Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        reason: error.reason,
      });
      return {
        success: false,
        error: error.message || error.reason || 'Failed to deploy smart account',
      };
    }
  }

  /**
   * Get smart account info
   */
  async getAccountInfo(accountAddress: string): Promise<SmartAccountInfo | null> {
    try {
      const deployed = await this.isDeployed(accountAddress);
      
      if (!deployed) {
        return {
          address: accountAddress,
          owner: ethers.ZeroAddress,
          isDeployed: false,
        };
      }

      const account = new ethers.Contract(
        accountAddress,
        SMART_ACCOUNT_ABI,
        this.provider
      );

      const owner = await account.owner();

      return {
        address: accountAddress,
        owner,
        isDeployed: true,
      };
    } catch (error) {
      console.error('Error getting account info:', error);
      return null;
    }
  }

  /**
   * Execute a transaction through smart account using ERC-4337 UserOperation
   * The smart account's execute() has onlyEntryPointOrSelf modifier,
   * so we must use EntryPoint.handleOps()
   */
  async executeTransaction(
    accountAddress: string,
    ownerPrivateKey: string,
    target: string,
    value: bigint,
    data: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log('🚀 [SmartAccount] Executing transaction through smart account...');
      console.log('📍 [SmartAccount] Account:', accountAddress);
      console.log('📍 [SmartAccount] Target:', target);
      console.log('📍 [SmartAccount] Value:', value.toString());
      
      // Check if account is deployed
      const isDeployed = await this.isDeployed(accountAddress);
      if (!isDeployed) {
        return {
          success: false,
          error: 'Smart account is not deployed yet. Please deploy it first.',
        };
      }

      const wallet = new ethers.Wallet(ownerPrivateKey, this.provider);
      const account = new ethers.Contract(
        accountAddress,
        SMART_ACCOUNT_ABI,
        this.provider
      );

      // Get EntryPoint address
      const entryPointAddress = await account.entryPoint();
      console.log('📍 [SmartAccount] EntryPoint:', entryPointAddress);

      // Encode execute call
      const executeData = account.interface.encodeFunctionData('execute', [target, value, data]);
      console.log('📝 [SmartAccount] Execute callData:', executeData);

      // EntryPoint ABI for UserOperations
      const ENTRY_POINT_ABI = [
        'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)',
        'function getUserOpHash((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) calldata userOp) public view returns (bytes32)',
        'function handleOps((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[], address beneficiary) external',
      ];

      const entryPoint = new ethers.Contract(
        entryPointAddress,
        ENTRY_POINT_ABI,
        wallet
      );

      // Get nonce
      const nonce = await entryPoint.getNonce(accountAddress, 0);
      console.log('🔢 [SmartAccount] Nonce:', nonce.toString());

      // Get gas prices
      const feeData = await this.provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice || 1000000000n;
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 1000000000n;
      
      // Gas limits (will be estimated properly in production)
      const callGasLimit = 200000n;
      const verificationGasLimit = 100000n;
      const preVerificationGas = 21000n;

      // Create UserOperation
      const userOp = {
        sender: accountAddress,
        nonce: nonce,
        initCode: '0x',
        callData: executeData,
        callGasLimit: callGasLimit,
        verificationGasLimit: verificationGasLimit,
        preVerificationGas: preVerificationGas,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        paymasterAndData: '0x',
        signature: '0x', // Will be filled after hashing
      };

      // Get UserOperation hash
      const userOpHash = await entryPoint.getUserOpHash(userOp);
      console.log('🔐 [SmartAccount] UserOp hash:', userOpHash);

      // Sign the UserOperation hash directly (raw signature, no message prefix)
      // ERC-4337 expects a raw ECDSA signature, not an Ethereum message signature
      const signingKey = new ethers.SigningKey(wallet.privateKey);
      const signature = signingKey.sign(userOpHash);
      
      // Format as r || s || v (65 bytes total: 32 + 32 + 1)
      // Ensure r and s are exactly 32 bytes each, and v is 1 byte
      const rBytes = ethers.getBytes(ethers.zeroPadValue(signature.r, 32));
      const sBytes = ethers.getBytes(ethers.zeroPadValue(signature.s, 32));
      const vByte = new Uint8Array([signature.v]); // v is 27 or 28, convert to single byte
      
      const signatureBytes = ethers.concat([rBytes, sBytes, vByte]);
      userOp.signature = signatureBytes;
      
      console.log('✍️ [SmartAccount] Signature created (raw ECDSA)');
      console.log('✍️ [SmartAccount] Signature length:', signatureBytes.length, 'bytes');
      console.log('✍️ [SmartAccount] Signature v:', signature.v);
      console.log('✍️ [SmartAccount] r length:', rBytes.length, 's length:', sBytes.length, 'v length:', vByte.length);

      // Execute via EntryPoint.handleOps
      // The beneficiary is the address that receives the gas refund (can be the sender)
      const beneficiary = wallet.address;
      
      console.log('📤 [SmartAccount] Calling EntryPoint.handleOps...');
      const tx = await entryPoint.handleOps([userOp], beneficiary);
      console.log('⏳ [SmartAccount] Transaction sent, hash:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ [SmartAccount] Transaction confirmed! Block:', receipt.blockNumber);

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('❌ [SmartAccount] Error executing transaction:', error);
      console.error('❌ [SmartAccount] Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        reason: error.reason,
      });
      return {
        success: false,
        error: error.message || error.reason || 'Failed to execute transaction',
      };
    }
  }

  /**
   * Add session key to smart account
   */
  async addSessionKey(
    accountAddress: string,
    ownerPrivateKey: string,
    sessionKeyAddress: string,
    validUntil: number,
    spendingLimit: bigint
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = new ethers.Wallet(ownerPrivateKey, this.provider);
      const account = new ethers.Contract(
        accountAddress,
        SMART_ACCOUNT_ABI,
        wallet
      );

      const tx = await account.addSessionKey(sessionKeyAddress, validUntil, spendingLimit);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error adding session key:', error);
      return {
        success: false,
        error: error.message || 'Failed to add session key',
      };
    }
  }

  /**
   * Set guardian for recovery
   */
  async setGuardian(
    accountAddress: string,
    ownerPrivateKey: string,
    guardianAddress: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const wallet = new ethers.Wallet(ownerPrivateKey, this.provider);
      const account = new ethers.Contract(
        accountAddress,
        SMART_ACCOUNT_ABI,
        wallet
      );

      const tx = await account.setGuardian(guardianAddress);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('Error setting guardian:', error);
      return {
        success: false,
        error: error.message || 'Failed to set guardian',
      };
    }
  }

  /**
   * Get MNT balance
   */
  async getMNTBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting MNT balance:', error);
      return '0';
    }
  }
}

export const smartAccountService = new SmartAccountService();

