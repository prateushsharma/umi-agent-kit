/**
 * FILE LOCATION: src/deployment/MoveDeploymentEngine.js
 * 
 * REPLACE THE deployMoveContract method with this fixed version
 */

import { 
  AccountAddress, 
  EntryFunction, 
  TransactionPayloadEntryFunction,
  MoveString,
  U64,
  U8
} from '@aptos-labs/ts-sdk';

import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export class MoveDeploymentEngine {
  constructor(umiKit) {
    this.kit = umiKit;
    this.client = umiKit.client;
  }

  /**
   * Deploy Move contract using YOUR existing working method
   * FIXED: Use proper viem walletClient like your existing code
   */
  async deployMoveContract(contract, deployerWallet, initArgs = {}) {
    try {
      console.log(`🚀 Deploying Move contract: ${contract.name} (using existing working method)`);

      // Step 1: Create viem walletClient (like your existing working code)
      const walletClient = this.createWalletClient(deployerWallet);
      
      // Step 2: Process the Move contract (replace address placeholders)
      const processedContract = this.processContract(contract, deployerWallet);
      
      // Step 3: Create deployment payload using YOUR existing method
      const deploymentPayload = this.createDeploymentPayload(processedContract, deployerWallet);
      
      // Step 4: Serialize using YOUR existing working _serializeForUmi method
      const serializedPayload = this.serializeForUmi(deploymentPayload);
      
      // Step 5: Deploy using viem walletClient (like your existing working code)
      const txHash = await walletClient.sendTransaction({
        to: deployerWallet.getAddress(),
        data: serializedPayload,
        gas: 3000000n
      });
      
      console.log(`📝 Move deployment transaction: ${txHash}`);
      
      // Step 6: Wait for confirmation
      const receipt = await this.client.waitForTransaction(txHash);
      
      // Step 7: Get module address
      const moduleAddress = this.getModuleAddress(deployerWallet.getAddress(), contract.name);
      
      // Step 8: Initialize if args provided
      if (Object.keys(initArgs).length > 0) {
        await this.initializeContract(moduleAddress, initArgs, deployerWallet);
      }
      
      return {
        name: contract.name,
        address: moduleAddress,
        txHash,
        type: 'move',
        initialized: Object.keys(initArgs).length > 0,
        deployerAddress: deployerWallet.getAddress(),
        receipt
      };

    } catch (error) {
      throw new Error(`Move deployment failed: ${error.message}`);
    }
  }

  /**
   * Create viem walletClient from UmiAgentKit wallet (like your existing working code)
   */
  createWalletClient(deployerWallet) {
    try {
      // Get private key from UmiAgentKit wallet
      const privateKey = deployerWallet.getPrivateKey();
      
      // Ensure proper format
      const formattedKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
      
      // Create account (like your existing code)
      const account = privateKeyToAccount(formattedKey);
      
      // Create walletClient (like your existing code)
      const walletClient = createWalletClient({
        account,
        chain: this.kit.client.chain,
        transport: http(this.kit.client.chain.rpcUrls.default.http[0])
      });
      
      return walletClient;
      
    } catch (error) {
      throw new Error(`Failed to create wallet client: ${error.message}`);
    }
  }

  /**
   * Initialize contract after deployment using viem walletClient
   */
  async initializeContract(moduleAddress, initArgs, deployerWallet) {
    try {
      console.log(`⚙️ Initializing contract: ${moduleAddress}`);
      console.log(`📝 Args:`, initArgs);
      
      // Create viem walletClient for initialization
      const walletClient = this.createWalletClient(deployerWallet);
      
      // Convert init args to BCS format
      const bcsArgs = this.convertArgsToBCS(initArgs);
      
      // Create initialize function call
      const entryFunction = EntryFunction.build(
        moduleAddress,
        'initialize',
        [],
        bcsArgs
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      const payload = transactionPayload.bcsToHex().toString();
      const serializedPayload = this.serializeForUmi(payload);
      
      const txHash = await walletClient.sendTransaction({
        to: deployerWallet.getAddress(),
        data: serializedPayload,
        gas: 1000000n
      });
      
      console.log(`✅ Contract initialized: ${txHash}`);
      
      await this.client.waitForTransaction(txHash);
      
      return { hash: txHash };
      
    } catch (error) {
      throw new Error(`Contract initialization failed: ${error.message}`);
    }
  }

  // ===== KEEP ALL OTHER METHODS THE SAME =====
  // (processContract, createDeploymentPayload, serializeForUmi, etc.)

  /**
   * Process Move contract - replace address placeholders with actual deployer address
   */
  processContract(contract, deployerWallet) {
    // Convert ETH address to Move address format (using your existing method)
    const moveAddress = this.ethToMoveAddress(deployerWallet.getAddress());
    
    // Replace common address placeholders
    let processedContent = contract.content
      .replace(/deployer_addr/g, moveAddress)
      .replace(/DEPLOYER_ADDRESS/g, moveAddress)
      .replace(/0x[0]+/g, moveAddress)
      .replace(/example/g, moveAddress);
    
    return {
      name: contract.name,
      content: processedContent,
      moveAddress
    };
  }

  /**
   * Create deployment payload using YOUR existing _createMoveDeploymentPayload method
   */
  createDeploymentPayload(processedContract, deployerWallet) {
    try {
      // Use your existing TokenManager's _createMoveDeploymentPayload method
      if (this.kit.tokenManager && typeof this.kit.tokenManager._createMoveDeploymentPayload === 'function') {
        return this.kit.tokenManager._createMoveDeploymentPayload(
          processedContract.content,
          processedContract.moveAddress
        );
      }
      
      // Fallback: Create deployment payload manually using your existing pattern
      return this.createMoveDeploymentPayloadFallback(processedContract);
      
    } catch (error) {
      throw new Error(`Failed to create deployment payload: ${error.message}`);
    }
  }

  /**
   * Fallback deployment payload creation using your existing BCS pattern
   */
  createMoveDeploymentPayloadFallback(processedContract) {
    try {
      // Based on your existing Move deployment pattern from createMoveToken
      const address = AccountAddress.fromString(processedContract.moveAddress);
      
      // Extract module name from contract
      const moduleMatch = processedContract.content.match(/module\s+[^:]+::(\w+)/);
      const moduleName = moduleMatch ? moduleMatch[1] : processedContract.name.toLowerCase();
      
      // Create entry function for module deployment (your existing pattern)
      const entryFunction = EntryFunction.build(
        `${processedContract.moveAddress}::${moduleName}`,
        'initialize',
        [],
        [address]
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      return transactionPayload.bcsToHex().toString();
      
    } catch (error) {
      throw new Error(`Fallback payload creation failed: ${error.message}`);
    }
  }

  /**
   * Serialize for Umi using YOUR existing working _serializeForUmi method
   */
  serializeForUmi(payload) {
    try {
      // Use your existing TokenManager's _serializeForUmi method
      if (this.kit.tokenManager && typeof this.kit.tokenManager._serializeForUmi === 'function') {
        return this.kit.tokenManager._serializeForUmi(payload);
      }
      
      // Fallback: Implement the same serialization manually
      return this.serializeForUmiFallback(payload);
      
    } catch (error) {
      throw new Error(`Umi serialization failed: ${error.message}`);
    }
  }

  /**
   * Fallback Umi serialization using your existing working pattern
   */
  serializeForUmiFallback(payload) {
    try {
      // Based on your existing working _serializeForUmi method
      const cleanPayload = payload.replace('0x', '');
      const payloadBytes = new Uint8Array(Buffer.from(cleanPayload, 'hex'));
      
      const length = payloadBytes.length;
      const lengthBytes = this.encodeLength(length);
      
      // Umi-specific enum wrapper for Move contracts (variant 1)
      const wrapper = new Uint8Array(1 + lengthBytes.length + payloadBytes.length);
      
      wrapper[0] = 1; // MoveContract variant (different from ERC-20's variant 2)
      wrapper.set(lengthBytes, 1);
      wrapper.set(payloadBytes, 1 + lengthBytes.length);
      
      return '0x' + Buffer.from(wrapper).toString('hex');
      
    } catch (error) {
      throw new Error(`Fallback serialization failed: ${error.message}`);
    }
  }

  /**
   * Convert arguments to BCS format
   */
  convertArgsToBCS(args) {
    const bcsArgs = [];
    
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string') {
        if (value.startsWith('0x')) {
          // Address argument
          bcsArgs.push(AccountAddress.fromString(value));
        } else {
          // String argument
          bcsArgs.push(new MoveString(value));
        }
      } else if (typeof value === 'number') {
        if (value < 256) {
          bcsArgs.push(new U8(value));
        } else {
          bcsArgs.push(new U64(value));
        }
      } else if (typeof value === 'boolean') {
        bcsArgs.push(new U8(value ? 1 : 0));
      } else {
        // Try to convert to string as fallback
        bcsArgs.push(new MoveString(String(value)));
      }
    }
    
    return bcsArgs;
  }

  /**
   * Get deployed module address
   */
  getModuleAddress(deployerAddress, contractName) {
    // Move modules are deployed at: deployerAddress::moduleName
    const cleanAddress = deployerAddress.replace('0x', '').toLowerCase();
    const moduleName = contractName.toLowerCase();
    return `0x${cleanAddress}::${moduleName}`;
  }

  /**
   * Convert ETH address to Move address format (your existing method)
   */
  ethToMoveAddress(ethAddress) {
    // Use your existing method if available
    if (this.kit.tokenManager && typeof this.kit.tokenManager._ethToMoveAddress === 'function') {
      return this.kit.tokenManager._ethToMoveAddress(ethAddress);
    }
    
    // Fallback: Simple conversion
    return ethAddress.replace('0x', '0x000000000000000000000000');
  }

  /**
   * Length encoding (your existing method)
   */
  encodeLength(length) {
    // Use your existing method if available
    if (this.kit.tokenManager && typeof this.kit.tokenManager._encodeLength === 'function') {
      return this.kit.tokenManager._encodeLength(length);
    }
    
    // Fallback: Simple length encoding
    if (length < 128) {
      return new Uint8Array([length]);
    } else if (length < 16384) {
      return new Uint8Array([
        (length & 0x7F) | 0x80,
        length >> 7
      ]);
    } else {
      throw new Error('Contract too large for deployment');
    }
  }
}