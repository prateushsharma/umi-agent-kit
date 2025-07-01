

import { createWalletClient, http, parseUnits, formatUnits, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SolidityCompiler } from '../compiler/SolidityCompiler.js';
import { AccountAddress, EntryFunction, TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';

export class TokenManager {
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
   * Deploy Move token contract using Umi-specific method
   * NEW METHOD ADDED
   */
  async deployMoveToken({ 
    deployerPrivateKey, 
    name, 
    symbol, 
    decimals = 8, 
    monitorSupply = true 
  }) {
    try {
      // Validate inputs
      if (!deployerPrivateKey) throw new Error('Deployer private key required');
      if (!name) throw new Error('Token name required');
      if (!symbol) throw new Error('Token symbol required');

      console.log(`🔨 Creating ${name} Move token contract...`);

      // Format private key
      const formattedKey = deployerPrivateKey.startsWith('0x') 
        ? deployerPrivateKey 
        : '0x' + deployerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      // Convert ETH address to Move address format
      const moveAddress = this._ethToMoveAddress(account.address);
      console.log(`📍 Move address: ${moveAddress}`);

      // Generate Move token contract
      const moveContract = this._generateMoveTokenContract(name, symbol, decimals, monitorSupply, moveAddress);
      console.log(`✅ Move contract generated`);

      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      console.log(`🚀 Deploying Move contract from ${account.address}...`);

      // Create Move contract deployment payload using Umi pattern
      const deploymentPayload = this._createMoveDeploymentPayload(moveContract, moveAddress);

      // Deploy using Umi-compatible transaction
      const hash = await walletClient.sendTransaction({
        to: account.address, // Deploy to own address for Move contracts
        data: deploymentPayload,
        gas: 3000000n, // Higher gas for Move contracts
      });

      console.log(`📝 Transaction hash: ${hash}`);

      // Wait for deployment
      const receipt = await this.client.waitForTransaction(hash);
      
      const moduleAddress = `${moveAddress}::${name.toLowerCase()}_token`;
      console.log(`✅ Move contract deployed at: ${moduleAddress}`);

      return {
        hash,
        moduleAddress,
        contractAddress: receipt.contractAddress || account.address,
        deployer: account.address,
        moveAddress,
        name,
        symbol,
        decimals,
        monitorSupply,
        type: 'Move',
        contract: moveContract
      };

    } catch (error) {
      throw new Error(`Move token deployment failed: ${error.message}`);
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
   * Convert ETH address to Move address format
   * NEW METHOD ADDED
   */
  _ethToMoveAddress(ethAddress) {
    // Convert ETH address to Move format: 0x000000000000000000000000 + ethAddress.slice(2)
    const cleanAddress = ethAddress.replace('0x', '');
    return '0x000000000000000000000000' + cleanAddress;
  }

  /**
   * Generate Move token contract source code
   * NEW METHOD ADDED
   */
  _generateMoveTokenContract(name, symbol, decimals, monitorSupply, moduleAddress) {
    const contractName = `${name.toLowerCase()}_token`;
    
    return `
module ${moduleAddress}::${contractName} {
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::coin::{Self, Coin, MintCapability, FreezeCapability, BurnCapability};
    use aptos_framework::account;

    struct ${name} {}

    struct TokenCaps has key {
        mint_cap: MintCapability<${name}>,
        freeze_cap: FreezeCapability<${name}>,
        burn_cap: BurnCapability<${name}>,
    }

    const ETOKEN_NOT_INITIALIZED: u64 = 1;
    const EINSUFFICIENT_PERMISSIONS: u64 = 2;

    public entry fun initialize(account: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<${name}>(
            account,
            string::utf8(b"${name}"),
            string::utf8(b"${symbol}"),
            ${decimals},
            ${monitorSupply.toString()}
        );

        move_to(account, TokenCaps {
            mint_cap,
            freeze_cap,
            burn_cap,
        });
    }

    public entry fun mint(
        account: &signer,
        to: address,
        amount: u64
    ) acquires TokenCaps {
        let account_addr = signer::address_of(account);
        assert!(exists<TokenCaps>(account_addr), ETOKEN_NOT_INITIALIZED);
        
        let token_caps = borrow_global<TokenCaps>(account_addr);
        let coins = coin::mint<${name}>(amount, &token_caps.mint_cap);
        coin::deposit(to, coins);
    }

    public entry fun burn(
        account: &signer,
        amount: u64
    ) acquires TokenCaps {
        let account_addr = signer::address_of(account);
        assert!(exists<TokenCaps>(account_addr), ETOKEN_NOT_INITIALIZED);
        
        let token_caps = borrow_global<TokenCaps>(account_addr);
        let coins = coin::withdraw<${name}>(account, amount);
        coin::burn(coins, &token_caps.burn_cap);
    }

    public fun get_balance(account: address): u64 {
        coin::balance<${name}>(account)
    }

    public fun get_name(): String {
        string::utf8(b"${name}")
    }

    public fun get_symbol(): String {
        string::utf8(b"${symbol}")
    }

    public fun get_decimals(): u8 {
        ${decimals}
    }
}`;
  }

  /**
   * Create Move contract deployment payload
   * NEW METHOD ADDED
   */
  _createMoveDeploymentPayload(contractSource, moduleAddress) {
    try {
      // Based on Umi docs Move deployment pattern
      const address = AccountAddress.fromString(moduleAddress);
      
      // Create entry function for module deployment
      const entryFunction = EntryFunction.build(
        `${moduleAddress}::${contractSource.match(/module\s+\w+::(\w+)/)[1]}`,
        'initialize',
        [],
        [address]
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      const payload = transactionPayload.bcsToHex();
      
      return payload.toString();
      
    } catch (error) {
      throw new Error(`Move deployment payload creation failed: ${error.message}`);
    }
  }

  /**
   * Mint ERC-20 tokens
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
   * Mint Move tokens
   * NEW METHOD ADDED
   */
  async mintMoveToken({
    ownerPrivateKey,
    moduleAddress,
    to,
    amount
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

      // Create Move mint transaction payload
      const mintPayload = this._createMoveMintPayload(moduleAddress, to, amount);

      const hash = await walletClient.sendTransaction({
        to: account.address,
        data: mintPayload,
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        to,
        amount: amount.toString(),
        moduleAddress,
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`Move mint failed: ${error.message}`);
    }
  }

  /**
   * Create Move mint transaction payload
   * NEW METHOD ADDED
   */
  _createMoveMintPayload(moduleAddress, to, amount) {
    try {
      const toAddress = AccountAddress.fromString(this._ethToMoveAddress(to));
      
      const entryFunction = EntryFunction.build(
        moduleAddress,
        'mint',
        [],
        [toAddress, amount]
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      return transactionPayload.bcsToHex().toString();
      
    } catch (error) {
      throw new Error(`Move mint payload creation failed: ${error.message}`);
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
   * Transfer Move tokens
   * NEW METHOD ADDED
   */
  async transferMoveToken({
    fromPrivateKey,
    moduleAddress,
    to,
    amount
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

      // Create Move transfer payload
      const transferPayload = this._createMoveTransferPayload(moduleAddress, to, amount);

      const hash = await walletClient.sendTransaction({
        to: account.address,
        data: transferPayload,
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        from: account.address,
        to,
        amount: amount.toString(),
        moduleAddress,
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`Move transfer failed: ${error.message}`);
    }
  }

  /**
   * Create Move transfer transaction payload
   * NEW METHOD ADDED
   */
  _createMoveTransferPayload(moduleAddress, to, amount) {
    try {
      const toAddress = AccountAddress.fromString(this._ethToMoveAddress(to));
      
      const entryFunction = EntryFunction.build(
        'aptos_framework::coin',
        'transfer',
        [moduleAddress], // Type argument for the coin type
        [toAddress, amount]
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      return transactionPayload.bcsToHex().toString();
      
    } catch (error) {
      throw new Error(`Move transfer payload creation failed: ${error.message}`);
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

  /**
   * Get Move token balance
   * NEW METHOD ADDED
   */
  async getMoveTokenBalance({
    moduleAddress,
    address
  }) {
    try {
      const moveAddress = this._ethToMoveAddress(address);
      const balanceAddress = AccountAddress.fromString(moveAddress);
      
      const entryFunction = EntryFunction.build(
        moduleAddress,
        'get_balance',
        [],
        [balanceAddress]
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      const payload = transactionPayload.bcsToHex().toString();

      const result = await this.client.call({
        to: address,
        data: payload,
      });

      if (!result.data) return '0';

      // Decode Move balance result
      const balance = BigInt(result.data);
      return balance.toString();

    } catch (error) {
      throw new Error(`Failed to get Move token balance: ${error.message}`);
    }
  }
}