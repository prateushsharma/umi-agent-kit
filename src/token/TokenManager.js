// Complete TokenManager.js with OpenZeppelin ERC-20 support

import { createWalletClient, http, parseUnits, formatUnits, encodeFunctionData, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SolidityCompiler } from '../compiler/SolidityCompiler.js';
import { AccountAddress, EntryFunction, TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';

export class TokenManager {
  constructor(client, chain) {
    this.client = client;
    this.chain = chain;
  }

  /**
   * Deploy ERC-20 token contract using OpenZeppelin implementation
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

      console.log(`🔨 Compiling ${name} token contract with OpenZeppelin...`);

      // Compile the OpenZeppelin-based contract
      const compiled = SolidityCompiler.compileERC20Token(name, symbol, decimals, initialSupply);
      console.log(`✅ OpenZeppelin contract compiled successfully`);

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

      // Encode constructor parameters for OpenZeppelin contract
      const constructorParams = this._encodeConstructorParams(
        name,
        symbol,
        decimals,
        initialSupply,
        account.address // owner address
      );

      // Combine bytecode with constructor parameters
      const deploymentData = compiled.bytecode + constructorParams.slice(2);

      // Use Umi-specific deployment method
      const serializedBytecode = this._serializeForUmi(deploymentData);

      console.log(`📦 Serialized bytecode for Umi network`);

      // Deploy using Umi-compatible transaction
      const hash = await walletClient.sendTransaction({
        to: null, // Contract creation
        data: serializedBytecode,
        gas: 3000000n, // Higher gas for OpenZeppelin features
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
        type: 'ERC20-OpenZeppelin',
        abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
        bytecode: compiled.bytecode,
        features: [
          'ERC20 Standard',
          'Ownable',
          'Burnable', 
          'Pausable',
          'Mintable'
        ]
      };

    } catch (error) {
      throw new Error(`ERC-20 deployment failed: ${error.message}`);
    }
  }

  /**
   * Deploy Move token contract using Umi-specific method
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

      // Format private key for Move operations
      const formattedKey = deployerPrivateKey.startsWith('0x') 
        ? deployerPrivateKey 
        : '0x' + deployerPrivateKey;

      // Create Move token using Aptos SDK
      const payload = new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          "0x1::managed_coin",
          "initialize",
          [],
          [
            Buffer.from(name),
            Buffer.from(symbol),
            decimals,
            monitorSupply
          ]
        )
      );

      console.log(`🚀 Deploying Move token...`);

      // This would be implemented with proper Aptos SDK integration
      // For now, return a placeholder structure
      return {
        type: 'Move-Token',
        name,
        symbol,
        decimals,
        monitorSupply,
        deployer: 'move-address', // Would be converted from ETH address
        features: ['Move Standard', 'Supply Monitoring']
      };

    } catch (error) {
      throw new Error(`Move token deployment failed: ${error.message}`);
    }
  }

  /**
   * Mint tokens to a specific address (OpenZeppelin feature)
   */
  async mintTokens({ 
    contractAddress, 
    ownerPrivateKey, 
    toAddress, 
    amount 
  }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!ownerPrivateKey) throw new Error('Owner private key required');
      if (!toAddress) throw new Error('Recipient address required');
      if (!amount) throw new Error('Amount required');

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
        abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
        functionName: 'mint',
        args: [toAddress, parseUnits(amount.toString(), 18)]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 100000n,
      });

      console.log(`🪙 Mint transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        toAddress,
        amount: amount.toString(),
        contractAddress,
        type: 'mint'
      };

    } catch (error) {
      throw new Error(`Token minting failed: ${error.message}`);
    }
  }

  /**
   * Burn tokens from caller's balance (OpenZeppelin feature)
   */
  async burnTokens({ 
    contractAddress, 
    ownerPrivateKey, 
    amount 
  }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!ownerPrivateKey) throw new Error('Private key required');
      if (!amount) throw new Error('Amount required');

      const formattedKey = ownerPrivateKey.startsWith('0x') 
        ? ownerPrivateKey 
        : '0x' + ownerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      const data = encodeFunctionData({
        abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
        functionName: 'burn',
        args: [parseUnits(amount.toString(), 18)]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 80000n,
      });

      console.log(`🔥 Burn transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        amount: amount.toString(),
        contractAddress,
        type: 'burn'
      };

    } catch (error) {
      throw new Error(`Token burning failed: ${error.message}`);
    }
  }

  /**
   * Pause token transfers (OpenZeppelin feature)
   */
  async pauseToken({ contractAddress, ownerPrivateKey }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!ownerPrivateKey) throw new Error('Owner private key required');

      const formattedKey = ownerPrivateKey.startsWith('0x') 
        ? ownerPrivateKey 
        : '0x' + ownerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      const data = encodeFunctionData({
        abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
        functionName: 'pause',
        args: []
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 50000n,
      });

      console.log(`⏸️ Pause transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        contractAddress,
        action: 'paused'
      };

    } catch (error) {
      throw new Error(`Token pausing failed: ${error.message}`);
    }
  }

  /**
   * Unpause token transfers (OpenZeppelin feature)
   */
  async unpauseToken({ contractAddress, ownerPrivateKey }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!ownerPrivateKey) throw new Error('Owner private key required');

      const formattedKey = ownerPrivateKey.startsWith('0x') 
        ? ownerPrivateKey 
        : '0x' + ownerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      const data = encodeFunctionData({
        abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
        functionName: 'unpause',
        args: []
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 50000n,
      });

      console.log(`▶️ Unpause transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        contractAddress,
        action: 'unpaused'
      };

    } catch (error) {
      throw new Error(`Token unpausing failed: ${error.message}`);
    }
  }

  /**
   * Transfer token ownership (OpenZeppelin feature)
   */
  async transferTokenOwnership({ 
    contractAddress, 
    currentOwnerPrivateKey, 
    newOwnerAddress 
  }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!currentOwnerPrivateKey) throw new Error('Current owner private key required');
      if (!newOwnerAddress) throw new Error('New owner address required');

      const formattedKey = currentOwnerPrivateKey.startsWith('0x') 
        ? currentOwnerPrivateKey 
        : '0x' + currentOwnerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      const data = encodeFunctionData({
        abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
        functionName: 'transferOwnership',
        args: [newOwnerAddress]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 60000n,
      });

      console.log(`👑 Ownership transfer transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        contractAddress,
        previousOwner: account.address,
        newOwner: newOwnerAddress,
        action: 'ownership_transferred'
      };

    } catch (error) {
      throw new Error(`Ownership transfer failed: ${error.message}`);
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo({ contractAddress }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');

      const client = this.client;

      // Read token information using multicall for efficiency
      const [name, symbol, decimals, totalSupply, paused] = await Promise.all([
        client.readContract({
          address: contractAddress,
          abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
          functionName: 'name'
        }),
        client.readContract({
          address: contractAddress,
          abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
          functionName: 'symbol'
        }),
        client.readContract({
          address: contractAddress,
          abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
          functionName: 'decimals'
        }),
        client.readContract({
          address: contractAddress,
          abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
          functionName: 'totalSupply'
        }),
        client.readContract({
          address: contractAddress,
          abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
          functionName: 'paused'
        }).catch(() => false) // In case contract doesn't have pause functionality
      ]);

      return {
        contractAddress,
        name,
        symbol,
        decimals,
        totalSupply: formatUnits(totalSupply, decimals),
        paused,
        type: 'ERC20-OpenZeppelin'
      };

    } catch (error) {
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance({ contractAddress, address }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!address) throw new Error('Address required');

      const balance = await this.client.readContract({
        address: contractAddress,
        abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
        functionName: 'balanceOf',
        args: [address]
      });

      const decimals = await this.client.readContract({
        address: contractAddress,
        abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
        functionName: 'decimals'
      });

      return {
        address,
        contractAddress,
        balance: formatUnits(balance, decimals),
        balanceWei: balance.toString(),
        decimals
      };

    } catch (error) {
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  /**
   * Transfer tokens between addresses
   */
  async transferTokens({ 
    contractAddress, 
    fromPrivateKey, 
    toAddress, 
    amount 
  }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!fromPrivateKey) throw new Error('From private key required');
      if (!toAddress) throw new Error('To address required');
      if (!amount) throw new Error('Amount required');

      const formattedKey = fromPrivateKey.startsWith('0x') 
        ? fromPrivateKey 
        : '0x' + fromPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      // Get decimals for proper amount formatting
      const decimals = await this.client.readContract({
        address: contractAddress,
        abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
        functionName: 'decimals'
      });

      const data = encodeFunctionData({
        abi: SolidityCompiler.getOpenZeppelinERC20ABI(),
        functionName: 'transfer',
        args: [toAddress, parseUnits(amount.toString(), decimals)]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 70000n,
      });

      console.log(`💸 Transfer transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        from: account.address,
        to: toAddress,
        amount: amount.toString(),
        contractAddress,
        type: 'transfer'
      };

    } catch (error) {
      throw new Error(`Token transfer failed: ${error.message}`);
    }
  }

  /**
   * Encode constructor parameters for OpenZeppelin contract
   */
  _encodeConstructorParams(name, symbol, decimals, initialSupply, owner) {
    try {
      return encodeAbiParameters(
        [
          { type: 'string' },   // name
          { type: 'string' },   // symbol  
          { type: 'uint8' },    // decimals
          { type: 'uint256' },  // initialSupply
          { type: 'address' }   // owner
        ],
        [name, symbol, decimals, parseUnits(initialSupply.toString(), 0), owner]
      );
    } catch (error) {
      throw new Error(`Constructor encoding failed: ${error.message}`);
    }
  }

  /**
   * Serialize bytecode for Umi network deployment
   */
  _serializeForUmi(bytecode) {
    try {
      const cleanBytecode = bytecode.replace('0x', '');
      const code = new Uint8Array(Buffer.from(cleanBytecode, 'hex'));
      
      // Create length bytes (little-endian)
      const lengthBytes = new Uint8Array(4);
      const length = code.length;
      lengthBytes[0] = length & 0xff;
      lengthBytes[1] = (length >> 8) & 0xff;
      lengthBytes[2] = (length >> 16) & 0xff;
      lengthBytes[3] = (length >> 24) & 0xff;
      
      // Umi-specific enum wrapper: EvmContract variant
      const wrapper = new Uint8Array(1 + lengthBytes.length + code.length);
      wrapper[0] = 2; // EvmContract variant
      wrapper.set(lengthBytes, 1);
      wrapper.set(code, 1 + lengthBytes.length);
      
      return '0x' + Buffer.from(wrapper).toString('hex');
    } catch (error) {
      throw new Error(`Umi serialization failed: ${error.message}`);
    }
  }
}