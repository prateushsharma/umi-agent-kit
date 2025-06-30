import { createWalletClient, http, parseUnits, formatUnits, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SolidityCompiler } from '../compiler/SolidityCompiler.js';

export class UmiTokenManager {
  constructor(client, chain) {
    this.client = client;
    this.chain = chain;
  }

  /**
   * Deploy ERC-20 token contract using Umi-specific method
   */
  async deployERC20Token({ 
    deployerPrivateKey, 
    name, 
    symbol, 
    decimals = 18, 
    initialSupply 
  }) {
    try {
      // Validate inputs
      if (!deployerPrivateKey) throw new Error('Deployer private key required');
      if (!name) throw new Error('Token name required');
      if (!symbol) throw new Error('Token symbol required');
      if (!initialSupply) throw new Error('Initial supply required');

      console.log(`🔨 Compiling ${name} token contract...`);

      // Compile the contract
      const compiled = SolidityCompiler.compileERC20Token(name, symbol, decimals, initialSupply);
      console.log(`✅ Contract compiled successfully`);

      // Format private key
      const formattedKey = deployerPrivateKey.startsWith('0x') 
        ? deployerPrivateKey 
        : '0x' + deployerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      console.log(`🚀 Deploying contract from ${account.address}...`);

      // Use Umi-specific deployment method based on docs
      const serializedBytecode = this._serializeForUmi(compiled.bytecode);

      console.log(`📦 Serialized bytecode for Umi network`);

      // Deploy using Umi-compatible transaction
      const hash = await walletClient.sendTransaction({
        to: null, // Contract creation
        data: serializedBytecode,
        gas: 2000000n, // Sufficient gas for deployment
      });

      console.log(`📝 Transaction hash: ${hash}`);

      // Wait for deployment
      const receipt = await this.client.waitForTransaction(hash);
      
      console.log(`✅ Contract deployed at: ${receipt.contractAddress}`);

      return {
        hash,
        contractAddress: receipt.contractAddress,
        deployer: account.address,
        name,
        symbol,
        decimals,
        initialSupply: initialSupply.toString(),
        type: 'ERC20',
        abi: compiled.abi,
        bytecode: compiled.bytecode
      };

    } catch (error) {
      throw new Error(`ERC-20 deployment failed: ${error.message}`);
    }
  }

  /**
   * Serialize bytecode for Umi Network (based on docs)
   */
  _serializeForUmi(bytecode) {
    try {
      // Based on Umi docs, contracts need to be wrapped in a specific enum
      // This is similar to what's shown in the Hardhat deployment example
      
      // Remove 0x prefix if present
      const cleanBytecode = bytecode.replace('0x', '');
      
      // Convert to bytes array
      const code = new Uint8Array(Buffer.from(cleanBytecode, 'hex'));
      
      // Umi-specific serialization (based on docs pattern)
      // This creates the proper enum wrapper for contract deployment
      const serialized = this._createUmiContractWrapper(code);
      
      return '0x' + Buffer.from(serialized).toString('hex');
      
    } catch (error) {
      throw new Error(`Umi serialization failed: ${error.message}`);
    }
  }

  /**
   * Create Umi contract wrapper (based on docs example)
   */
  _createUmiContractWrapper(contractBytes) {
    // Based on the docs, Umi uses a specific format for contract deployment
    // This mimics the BCS serialization shown in the examples
    
    const length = contractBytes.length;
    const lengthBytes = this._encodeLength(length);
    
    // Create the wrapper: [enum_variant, length, bytecode]
    const wrapper = new Uint8Array(1 + lengthBytes.length + contractBytes.length);
    
    // Enum variant for EVM contract (based on docs: EvmContract)
    wrapper[0] = 2; // EvmContract variant
    
    // Copy length encoding
    wrapper.set(lengthBytes, 1);
    
    // Copy contract bytecode
    wrapper.set(contractBytes, 1 + lengthBytes.length);
    
    return wrapper;
  }

  /**
   * Encode length as varint (simple implementation)
   */
  _encodeLength(length) {
    if (length < 128) {
      return new Uint8Array([length]);
    } else if (length < 16384) {
      return new Uint8Array([
        (length & 0x7F) | 0x80,
        length >> 7
      ]);
    } else {
      // For larger lengths, use 4-byte encoding
      return new Uint8Array([
        (length & 0xFF),
        (length >> 8) & 0xFF,
        (length >> 16) & 0xFF,
        (length >> 24) & 0xFF
      ]);
    }
  }

  /**
   * Mint ERC-20 tokens (existing method)
   */
  async mintERC20({
    ownerPrivateKey,
    tokenAddress,
    to,
    amount,
    decimals = 18
  }) {
    try {
      const formattedKey = ownerPrivateKey.startsWith('0x') 
        ? ownerPrivateKey 
        : '0x' + ownerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      // Encode mint function call
      const data = encodeFunctionData({
        abi: SolidityCompiler.getStandardERC20ABI(),
        functionName: 'mint',
        args: [to, parseUnits(amount.toString(), decimals)]
      });

      const hash = await walletClient.sendTransaction({
        to: tokenAddress,
        data,
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        to,
        amount: amount.toString(),
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`ERC-20 mint failed: ${error.message}`);
    }
  }

  /**
   * Transfer ERC-20 tokens
   */
  async transferERC20({
    fromPrivateKey,
    tokenAddress,
    to,
    amount,
    decimals = 18
  }) {
    try {
      const formattedKey = fromPrivateKey.startsWith('0x') 
        ? fromPrivateKey 
        : '0x' + fromPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      const data = encodeFunctionData({
        abi: SolidityCompiler.getStandardERC20ABI(),
        functionName: 'transfer',
        args: [to, parseUnits(amount.toString(), decimals)]
      });

      const hash = await walletClient.sendTransaction({
        to: tokenAddress,
        data,
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        from: account.address,
        to,
        amount: amount.toString(),
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`ERC-20 transfer failed: ${error.message}`);
    }
  }

  /**
   * Get ERC-20 token balance
   */
  async getERC20Balance({
    tokenAddress,
    address,
    decimals = 18
  }) {
    try {
      const data = encodeFunctionData({
        abi: SolidityCompiler.getStandardERC20ABI(),
        functionName: 'balanceOf',
        args: [address]
      });

      const result = await this.client.call({
        to: tokenAddress,
        data,
      });

      if (!result.data) return '0';

      // Decode the result
      const balance = BigInt(result.data);
      return formatUnits(balance, decimals);

    } catch (error) {
      throw new Error(`Failed to get ERC-20 balance: ${error.message}`);
    }
  }
}