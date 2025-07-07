
import { createWalletClient, http, parseEther, parseUnits, encodeFunctionData, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ERC1155Compiler } from '../compiler/ERC1155Compiler.js';

export class ERC1155Manager {
  constructor(client, chain) {
    this.client = client;
    this.chain = chain;
  }

  /**
   * Deploy ERC1155 contract using EXACT same pattern as TokenManager
   */
  async deployERC1155Contract({ 
    deployerPrivateKey, 
    name, 
    baseURI = "",
    owner = null
  }) {
    try {
      // Validate inputs (exact same as TokenManager)
      if (!deployerPrivateKey) throw new Error('Deployer private key required');
      if (!name) throw new Error('Contract name required');

      console.log(`🎨 Generating ${name} ERC1155 contract...`);

      // Compile contract (same pattern as TokenManager)
      const compiled = ERC1155Compiler.compileERC1155Contract(name, baseURI);
      
      if (!compiled.success) {
        throw new Error(`ERC1155 compilation failed: ${compiled.error}`);
      }

      console.log(`✅ ERC1155 contract compiled successfully`);

      // Format private key (EXACT same as TokenManager)
      const formattedKey = deployerPrivateKey.startsWith('0x') 
        ? deployerPrivateKey 
        : '0x' + deployerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      console.log(`🚀 Deploying ERC1155 contract from ${account.address}...`);

      // Encode constructor parameters (EXACT same pattern as TokenManager)
      const constructorParams = this._encodeERC1155ConstructorParams(
        name,
        baseURI,
        owner || account.address // Use provided owner or deployer
      );

      // Combine bytecode with constructor parameters (EXACT same as TokenManager)
      const deploymentData = compiled.bytecode + constructorParams.slice(2);

      // Use Umi-specific deployment method (EXACT same as TokenManager)
      const serializedBytecode = this._serializeForUmi(deploymentData);

      console.log(`📦 Serialized bytecode for Umi network`);

      // Deploy using Umi-compatible transaction (EXACT same as TokenManager)
      const hash = await walletClient.sendTransaction({
        to: null, // Contract creation
        data: serializedBytecode,
        gas: 4000000n, // Higher gas for ERC1155 contracts
      });

      console.log(`📝 Transaction hash: ${hash}`);

      // Wait for deployment (EXACT same as TokenManager)
      const receipt = await this.client.waitForTransaction(hash);
      
      console.log(`✅ ERC1155 contract deployed at: ${receipt.contractAddress}`);

      return {
        hash,
        contractAddress: receipt.contractAddress,
        deployer: account.address,
        name,
        baseURI,
        type: 'ERC1155-Custom',
        abi: compiled.abi,
        bytecode: compiled.bytecode,
        features: [
          'ERC1155 Standard',
          'Multi-Token Support',
          'Batch Operations',
          'Ownable',
          'Pausable',
          'Custom Token Creation'
        ]
      };

    } catch (error) {
      throw new Error(`ERC1155 deployment failed: ${error.message}`);
    }
  }

  /**
   * Create token type in existing ERC1155 contract
   */
  async createTokenType({
    ownerPrivateKey,
    contractAddress,
    metadataURI,
    maxSupply,
    mintPrice = "0"
  }) {
    try {
      if (!ownerPrivateKey) throw new Error('Owner private key required');
      if (!contractAddress) throw new Error('Contract address required');
      if (!metadataURI) throw new Error('Metadata URI required');

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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'createToken',
        args: [metadataURI, BigInt(maxSupply), parseEther(mintPrice)]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 200000n,
      });

      console.log(`🪙 Create token transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        contractAddress,
        metadataURI,
        maxSupply: maxSupply.toString(),
        mintPrice,
        action: 'token_type_created'
      };

    } catch (error) {
      throw new Error(`Token type creation failed: ${error.message}`);
    }
  }

  /**
   * Admin mint ERC1155 tokens (owner only, no payment)
   */
  async adminMintERC1155({
    ownerPrivateKey,
    contractAddress,
    toAddress,
    tokenId,
    amount
  }) {
    try {
      if (!ownerPrivateKey) throw new Error('Owner private key required');
      if (!contractAddress) throw new Error('Contract address required');
      if (!toAddress) throw new Error('Recipient address required');

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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'adminMint',
        args: [toAddress, BigInt(tokenId), BigInt(amount)]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 200000n,
      });

      console.log(`🎁 Admin mint transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        from: account.address,
        to: toAddress,
        tokenId: tokenId.toString(),
        amount: amount.toString(),
        contractAddress,
        type: 'admin_mint'
      };

    } catch (error) {
      throw new Error(`Admin minting failed: ${error.message}`);
    }
  }

  /**
   * Public mint ERC1155 tokens (requires payment)
   */
  async mintERC1155({
    fromPrivateKey,
    contractAddress,
    toAddress,
    tokenId,
    amount,
    payment = "0"
  }) {
    try {
      if (!fromPrivateKey) throw new Error('Private key required');
      if (!contractAddress) throw new Error('Contract address required');
      if (!toAddress) throw new Error('Recipient address required');

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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'mint',
        args: [toAddress, BigInt(tokenId), BigInt(amount)]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        value: parseEther(payment),
        gas: 200000n,
      });

      console.log(`🎁 Mint transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        from: account.address,
        to: toAddress,
        tokenId: tokenId.toString(),
        amount: amount.toString(),
        payment,
        contractAddress,
        type: 'public_mint'
      };

    } catch (error) {
      throw new Error(`Minting failed: ${error.message}`);
    }
  }

  /**
   * Batch mint ERC1155 tokens (requires payment)
   */
  async batchMintERC1155({
    fromPrivateKey,
    contractAddress,
    toAddress,
    tokenIds,
    amounts,
    totalPayment = "0"
  }) {
    try {
      if (!fromPrivateKey) throw new Error('Private key required');
      if (!contractAddress) throw new Error('Contract address required');
      if (!toAddress) throw new Error('Recipient address required');

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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'batchMint',
        args: [toAddress, tokenIds.map(id => BigInt(id)), amounts.map(amt => BigInt(amt))]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        value: parseEther(totalPayment),
        gas: 300000n, // Higher gas for batch
      });

      console.log(`🎁 Batch mint transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        from: account.address,
        to: toAddress,
        tokenIds: tokenIds.map(id => id.toString()),
        amounts: amounts.map(amt => amt.toString()),
        totalPayment,
        contractAddress,
        type: 'batch_mint'
      };

    } catch (error) {
      throw new Error(`Batch minting failed: ${error.message}`);
    }
  }

  /**
   * Admin batch mint ERC1155 tokens (owner only)
   */
  async adminBatchMintERC1155({
    ownerPrivateKey,
    contractAddress,
    toAddress,
    tokenIds,
    amounts
  }) {
    try {
      if (!ownerPrivateKey) throw new Error('Owner private key required');
      if (!contractAddress) throw new Error('Contract address required');
      if (!toAddress) throw new Error('Recipient address required');

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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'adminBatchMint',
        args: [toAddress, tokenIds.map(id => BigInt(id)), amounts.map(amt => BigInt(amt))]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 300000n,
      });

      console.log(`👑 Admin batch mint transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        from: account.address,
        to: toAddress,
        tokenIds: tokenIds.map(id => id.toString()),
        amounts: amounts.map(amt => amt.toString()),
        contractAddress,
        type: 'admin_batch_mint'
      };

    } catch (error) {
      throw new Error(`Admin batch minting failed: ${error.message}`);
    }
  }

  /**
   * Transfer ERC1155 tokens
   */
  async transferERC1155({
    fromPrivateKey,
    contractAddress,
    toAddress,
    tokenId,
    amount
  }) {
    try {
      if (!fromPrivateKey) throw new Error('Private key required');
      if (!contractAddress) throw new Error('Contract address required');
      if (!toAddress) throw new Error('Recipient address required');

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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'safeTransferFrom',
        args: [account.address, toAddress, BigInt(tokenId), BigInt(amount), '0x']
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 200000n,
      });

      console.log(`🔄 Transfer transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        from: account.address,
        to: toAddress,
        tokenId: tokenId.toString(),
        amount: amount.toString(),
        contractAddress,
        type: 'transfer'
      };

    } catch (error) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Batch transfer ERC1155 tokens
   */
  async batchTransferERC1155({
    fromPrivateKey,
    contractAddress,
    toAddress,
    tokenIds,
    amounts
  }) {
    try {
      if (!fromPrivateKey) throw new Error('Private key required');
      if (!contractAddress) throw new Error('Contract address required');
      if (!toAddress) throw new Error('Recipient address required');

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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'safeBatchTransferFrom',
        args: [account.address, toAddress, tokenIds.map(id => BigInt(id)), amounts.map(amt => BigInt(amt)), '0x']
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 300000n,
      });

      console.log(`🔄 Batch transfer transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        from: account.address,
        to: toAddress,
        tokenIds: tokenIds.map(id => id.toString()),
        amounts: amounts.map(amt => amt.toString()),
        contractAddress,
        type: 'batch_transfer'
      };

    } catch (error) {
      throw new Error(`Batch transfer failed: ${error.message}`);
    }
  }

  /**
   * Get ERC1155 token balance
   */
  async getERC1155Balance(contractAddress, ownerAddress, tokenId) {
    try {
      return await this.client.call({
        to: contractAddress,
        data: encodeFunctionData({
          abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
          functionName: 'balanceOf',
          args: [ownerAddress, BigInt(tokenId)]
        })
      });
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get multiple ERC1155 token balances
   */
  async getERC1155Balances(contractAddress, ownerAddresses, tokenIds) {
    try {
      return await this.client.call({
        to: contractAddress,
        data: encodeFunctionData({
          abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
          functionName: 'balanceOfBatch',
          args: [ownerAddresses, tokenIds.map(id => BigInt(id))]
        })
      });
    } catch (error) {
      throw new Error(`Failed to get batch balances: ${error.message}`);
    }
  }

  /**
   * Get all owned tokens for an address
   */
  async getOwnedTokens(contractAddress, ownerAddress) {
    try {
      return await this.client.call({
        to: contractAddress,
        data: encodeFunctionData({
          abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
          functionName: 'getOwnedTokens',
          args: [ownerAddress]
        })
      });
    } catch (error) {
      throw new Error(`Failed to get owned tokens: ${error.message}`);
    }
  }

  /**
   * Set approval for all tokens
   */
  async setApprovalForAll({
    ownerPrivateKey,
    contractAddress,
    operatorAddress,
    approved
  }) {
    try {
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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'setApprovalForAll',
        args: [operatorAddress, approved]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 100000n,
      });

      console.log(`🔐 Set approval transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        owner: account.address,
        operator: operatorAddress,
        approved,
        contractAddress,
        type: 'set_approval'
      };

    } catch (error) {
      throw new Error(`Set approval failed: ${error.message}`);
    }
  }

  /**
   * Check if operator is approved for all tokens
   */
  async isApprovedForAll(contractAddress, ownerAddress, operatorAddress) {
    try {
      return await this.client.call({
        to: contractAddress,
        data: encodeFunctionData({
          abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
          functionName: 'isApprovedForAll',
          args: [ownerAddress, operatorAddress]
        })
      });
    } catch (error) {
      throw new Error(`Failed to check approval: ${error.message}`);
    }
  }

  /**
   * Get token URI
   */
  async getTokenURI(contractAddress, tokenId) {
    try {
      return await this.client.call({
        to: contractAddress,
        data: encodeFunctionData({
          abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
          functionName: 'uri',
          args: [BigInt(tokenId)]
        })
      });
    } catch (error) {
      throw new Error(`Failed to get token URI: ${error.message}`);
    }
  }

  /**
   * Get total supply of a token
   */
  async getTotalSupply(contractAddress, tokenId) {
    try {
      return await this.client.call({
        to: contractAddress,
        data: encodeFunctionData({
          abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
          functionName: 'totalSupply',
          args: [BigInt(tokenId)]
        })
      });
    } catch (error) {
      throw new Error(`Failed to get total supply: ${error.message}`);
    }
  }

  /**
   * Pause contract (owner only)
   */
  async pauseContract({
    ownerPrivateKey,
    contractAddress
  }) {
    try {
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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'pause',
        args: []
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 100000n,
      });

      console.log(`⏸️ Pause transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        contractAddress,
        type: 'pause'
      };

    } catch (error) {
      throw new Error(`Pause failed: ${error.message}`);
    }
  }

  /**
   * Unpause contract (owner only)
   */
  async unpauseContract({
    ownerPrivateKey,
    contractAddress
  }) {
    try {
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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'unpause',
        args: []
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 100000n,
      });

      console.log(`▶️ Unpause transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        contractAddress,
        type: 'unpause'
      };

    } catch (error) {
      throw new Error(`Unpause failed: ${error.message}`);
    }
  }

  /**
   * Withdraw funds from contract (owner only)
   */
  async withdrawFunds({
    ownerPrivateKey,
    contractAddress
  }) {
    try {
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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'withdraw',
        args: []
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 100000n,
      });

      console.log(`💸 Withdraw transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        contractAddress,
        type: 'withdraw'
      };

    } catch (error) {
      throw new Error(`Withdraw failed: ${error.message}`);
    }
  }

  /**
   * Burn tokens
   */
  async burnTokens({
    ownerPrivateKey,
    contractAddress,
    tokenId,
    amount
  }) {
    try {
      if (!ownerPrivateKey) throw new Error('Private key required');

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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'burn',
        args: [account.address, BigInt(tokenId), BigInt(amount)]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 150000n,
      });

      console.log(`🔥 Burn transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        from: account.address,
        tokenId: tokenId.toString(),
        amount: amount.toString(),
        contractAddress,
        type: 'burn'
      };

    } catch (error) {
      throw new Error(`Burn failed: ${error.message}`);
    }
  }

  /**
   * Burn multiple tokens in batch
   */
  async burnTokensBatch({
    ownerPrivateKey,
    contractAddress,
    tokenIds,
    amounts
  }) {
    try {
      if (!ownerPrivateKey) throw new Error('Private key required');

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
        abi: ERC1155Compiler.getOpenZeppelinERC1155ABI(),
        functionName: 'burnBatch',
        args: [account.address, tokenIds.map(id => BigInt(id)), amounts.map(amt => BigInt(amt))]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 250000n,
      });

      console.log(`🔥 Batch burn transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        from: account.address,
        tokenIds: tokenIds.map(id => id.toString()),
        amounts: amounts.map(amt => amt.toString()),
        contractAddress,
        type: 'batch_burn'
      };

    } catch (error) {
      throw new Error(`Batch burn failed: ${error.message}`);
    }
  }

  /**
   * Encode constructor parameters for ERC1155 contract (EXACT same pattern as TokenManager)
   */
  _encodeERC1155ConstructorParams(name, baseURI, owner) {
    try {
      return encodeAbiParameters(
        [
          { type: 'string' },   // name
          { type: 'string' },   // baseURI
          { type: 'address' }   // owner
        ],
        [name, baseURI, owner]
      );
    } catch (error) {
      throw new Error(`Constructor encoding failed: ${error.message}`);
    }
  }

  /**
   * Serialize bytecode for Umi network deployment (EXACT same as TokenManager)
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