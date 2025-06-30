import { createWalletClient, http, parseUnits, formatUnits, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { AccountAddress, EntryFunction, TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';
import { SolidityCompiler } from '../compiler/SolidityCompiler.js';

export class TokenManager {
  constructor(client, chain) {
    this.client = client;
    this.chain = chain;
  }

  /**
   * Deploy ERC-20 token contract
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

      // Compile the contract with real parameters
      const compiled = SolidityCompiler.compileERC20Token(name, symbol, decimals, initialSupply);
      
      console.log(`✅ Contract compiled successfully`);
      console.log(`📦 Bytecode length: ${compiled.bytecode.length} characters`);

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

      // Deploy contract with real compiled bytecode
      const hash = await walletClient.deployContract({
        abi: compiled.abi,
        bytecode: compiled.bytecode,
        args: [], // No constructor args needed since they're hardcoded
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
   * Deploy Move token
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

      // Format private key and get Move address
      const formattedKey = deployerPrivateKey.startsWith('0x') 
        ? deployerPrivateKey 
        : '0x' + deployerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      const moveAddress = this._ethToMoveAddress(account.address);

      // Create Move transaction payload
      const entryFunction = EntryFunction.build(
        `${moveAddress}::coin`,
        'initialize_token',
        ['0x1::aptos_coin::AptosCoin'], // Type argument (placeholder)
        [
          new Uint8Array(Buffer.from(name, 'utf8')),
          new Uint8Array(Buffer.from(symbol, 'utf8')),
          decimals,
          monitorSupply
        ]
      );

      const payload = new TransactionPayloadEntryFunction(entryFunction);
      const payloadHex = payload.bcsToHex().toString();

      // Send transaction
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      const hash = await walletClient.sendTransaction({
        to: account.address,
        data: payloadHex,
      });

      // Wait for confirmation
      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        moduleAddress: moveAddress,
        deployer: account.address,
        name,
        symbol,
        decimals,
        type: 'Move'
      };

    } catch (error) {
      throw new Error(`Move token deployment failed: ${error.message}`);
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
      const moveAddress = this._ethToMoveAddress(account.address);
      const toMoveAddress = this._ethToMoveAddress(to);

      // Create mint transaction
      const entryFunction = EntryFunction.build(
        `${moduleAddress}::coin`,
        'mint',
        ['0x1::aptos_coin::AptosCoin'], // Type argument
        [
          AccountAddress.fromString(toMoveAddress),
          parseInt(amount)
        ]
      );

      const payload = new TransactionPayloadEntryFunction(entryFunction);
      const payloadHex = payload.bcsToHex().toString();

      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      const hash = await walletClient.sendTransaction({
        to: account.address,
        data: payloadHex,
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        to,
        amount: amount.toString(),
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`Move token mint failed: ${error.message}`);
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

      // Decode the result (simple implementation)
      const balance = BigInt(result.data);
      return formatUnits(balance, decimals);

    } catch (error) {
      throw new Error(`Failed to get ERC-20 balance: ${error.message}`);
    }
  }

  /**
   * Helper: Convert ETH address to Move address
   */
  _ethToMoveAddress(ethAddress) {
    const cleanAddr = ethAddress.replace('0x', '');
    return '0x000000000000000000000000' + cleanAddr;
  }
}