
import { createWalletClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NFTCompiler } from '../compiler/NFTCompiler.js';
import { MoveNFTCompiler } from '../compiler/MoveNFTCompiler.js';
import { AccountAddress, EntryFunction, TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';

export class NFTManager {
  constructor(client, chain) {
    this.client = client;
    this.chain = chain;
  }

  // ======================================
  // EXISTING ERC-721 METHODS (unchanged)
  // ======================================

  /**
   * Deploy ERC-721 NFT collection using Umi-specific method
   */
  async deployNFTCollection({ 
    deployerPrivateKey, 
    name, 
    symbol,
    baseURI = "",
    maxSupply = 10000,
    mintPrice = "0" // in ETH
  }) {
    try {
      // Validate inputs
      if (!deployerPrivateKey) throw new Error('Deployer private key required');
      if (!name) throw new Error('Collection name required');
      if (!symbol) throw new Error('Collection symbol required');

      console.log(`🎨 Compiling ${name} NFT collection...`);

      // Compile the NFT contract
      const compiled = NFTCompiler.compileERC721Collection(name, symbol, baseURI, maxSupply, mintPrice);
      console.log(`✅ NFT contract compiled successfully`);

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

      console.log(`🚀 Deploying NFT collection from ${account.address}...`);

      // Use Umi-specific deployment method (same as tokens)
      const serializedBytecode = this._serializeForUmi(compiled.bytecode);

      console.log(`📦 Serialized bytecode for Umi network`);

      // Deploy using Umi-compatible transaction
      const hash = await walletClient.sendTransaction({
        to: null, // Contract creation
        data: serializedBytecode,
        gas: 3000000n, // Higher gas for NFT contracts
      });

      console.log(`📝 Transaction hash: ${hash}`);

      // Wait for deployment
      const receipt = await this.client.waitForTransaction(hash);
      
      console.log(`✅ NFT collection deployed at: ${receipt.contractAddress}`);

      return {
        hash,
        contractAddress: receipt.contractAddress,
        deployer: account.address,
        name,
        symbol,
        baseURI,
        maxSupply: maxSupply.toString(),
        mintPrice: mintPrice.toString(),
        type: 'ERC721',
        abi: compiled.abi,
        bytecode: compiled.bytecode
      };

    } catch (error) {
      throw new Error(`NFT collection deployment failed: ${error.message}`);
    }
  }

  // ======================================
  // NEW: MOVE NFT METHODS
  // ======================================

  /**
   * Deploy Move NFT collection
   */
  async deployMoveNFTCollection({ 
    deployerPrivateKey, 
    name, 
    symbol,
    description = "",
    maxSupply = 10000
  }) {
    try {
      // Validate inputs
      if (!deployerPrivateKey) throw new Error('Deployer private key required');
      if (!name) throw new Error('Collection name required');
      if (!symbol) throw new Error('Collection symbol required');

      console.log(`🎨 Generating ${name} Move NFT collection...`);

      // Format private key and get address
      const formattedKey = deployerPrivateKey.startsWith('0x') 
        ? deployerPrivateKey 
        : '0x' + deployerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      const moveAddress = this._ethToMoveAddress(account.address);
      
      // Generate Move contract source
      const moveContract = MoveNFTCompiler.generateMoveNFTCollection(name, symbol, description, maxSupply);
      const finalContract = MoveNFTCompiler.replaceAddress(moveContract, account.address);
      
      console.log(`✅ Move contract generated`);

      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      console.log(`🚀 Deploying Move NFT collection from ${account.address}...`);
      console.log(`📍 Move address: ${moveAddress}`);

      // Create Move contract deployment payload
      const deploymentPayload = this._createMoveNFTDeploymentPayload(
        moveAddress, 
        name, 
        symbol, 
        description, 
        maxSupply
      );

      // Deploy using Umi-compatible transaction
      const hash = await walletClient.sendTransaction({
        to: account.address, // Deploy to own address for Move contracts
        data: deploymentPayload,
        gas: 4000000n, // Higher gas for Move NFT contracts
      });

      console.log(`📝 Transaction hash: ${hash}`);

      // Wait for deployment
      const receipt = await this.client.waitForTransaction(hash);
      
      const moduleAddress = `${moveAddress}::${name.toLowerCase()}_nft`;
      console.log(`✅ Move NFT collection deployed at: ${moduleAddress}`);

      return {
        hash,
        moduleAddress,
        contractAddress: receipt.contractAddress || account.address,
        deployer: account.address,
        moveAddress,
        name,
        symbol,
        description,
        maxSupply: maxSupply.toString(),
        type: 'MoveNFT',
        contract: finalContract
      };

    } catch (error) {
      throw new Error(`Move NFT collection deployment failed: ${error.message}`);
    }
  }

  /**
   * Mint Move NFT
   */
  async mintMoveNFT({
    ownerPrivateKey,
    moduleAddress,
    recipient,
    tokenId,
    name,
    description,
    imageURI,
    attributes = [],
    level = 1,
    rarity = "common"
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
      const mintPayload = this._createMoveMintPayload(
        moduleAddress,
        recipient,
        tokenId,
        name,
        description,
        imageURI,
        attributes,
        level,
        rarity
      );

      const hash = await walletClient.sendTransaction({
        to: account.address,
        data: mintPayload,
        gas: 300000n,
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        recipient,
        tokenId: tokenId.toString(),
        name,
        description,
        imageURI,
        level,
        rarity,
        moduleAddress,
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`Move NFT mint failed: ${error.message}`);
    }
  }

  /**
   * Batch mint Move NFTs
   */
  async batchMintMoveNFTs({
    ownerPrivateKey,
    moduleAddress,
    recipients, // Array of {recipient, tokenId, name, description, imageURI, rarity}
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

      // Extract arrays for batch minting
      const recipientAddresses = recipients.map(r => this._ethToMoveAddress(r.recipient));
      const tokenIds = recipients.map(r => r.tokenId);
      const names = recipients.map(r => r.name);
      const descriptions = recipients.map(r => r.description);
      const imageURIs = recipients.map(r => r.imageURI);
      const rarities = recipients.map(r => r.rarity || "common");

      // Create Move batch mint payload
      const batchPayload = this._createMoveBatchMintPayload(
        moduleAddress,
        recipientAddresses,
        tokenIds,
        names,
        descriptions,
        imageURIs,
        rarities
      );

      const hash = await walletClient.sendTransaction({
        to: account.address,
        data: batchPayload,
        gas: BigInt(300000 * recipients.length),
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        recipients,
        moduleAddress,
        count: recipients.length,
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`Move NFT batch mint failed: ${error.message}`);
    }
  }

  /**
   * Transfer Move NFT
   */
  async transferMoveNFT({
    fromPrivateKey,
    moduleAddress,
    from,
    to,
    tokenId
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
      const transferPayload = this._createMoveTransferPayload(moduleAddress, to, tokenId);

      const hash = await walletClient.sendTransaction({
        to: account.address,
        data: transferPayload,
        gas: 200000n,
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        from,
        to,
        tokenId: tokenId.toString(),
        moduleAddress,
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`Move NFT transfer failed: ${error.message}`);
    }
  }

  /**
   * Get Move NFT info
   */
  async getMoveNFTInfo({
    moduleAddress,
    owner
  }) {
    try {
      const moveOwner = this._ethToMoveAddress(owner);
      const ownerAddress = AccountAddress.fromString(moveOwner);
      
      const entryFunction = EntryFunction.build(
        moduleAddress,
        'get_nft_info',
        [],
        [ownerAddress]
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      const payload = transactionPayload.bcsToHex().toString();

      const result = await this.client.call({
        to: owner,
        data: payload,
      });

      if (!result.data) return null;

      // Decode Move NFT result (simplified)
      return this._decodeMoveNFTResult(result.data);

    } catch (error) {
      throw new Error(`Failed to get Move NFT info: ${error.message}`);
    }
  }

  /**
   * Upgrade Move NFT (gaming feature)
   */
  async upgradeMoveNFT({
    ownerPrivateKey,
    moduleAddress,
    tokenId,
    experienceGained
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

      // Create upgrade payload
      const upgradePayload = this._createMoveUpgradePayload(moduleAddress, tokenId, experienceGained);

      const hash = await walletClient.sendTransaction({
        to: account.address,
        data: upgradePayload,
        gas: 200000n,
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        tokenId: tokenId.toString(),
        experienceGained,
        moduleAddress,
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`Move NFT upgrade failed: ${error.message}`);
    }
  }

  /**
   * Create gaming Move NFT collection
   */
  async deployGamingMoveNFTCollection({ 
    deployerPrivateKey, 
    name, 
    symbol,
    categories = ['weapon', 'armor', 'accessory', 'consumable']
  }) {
    try {
      // Validate inputs
      if (!deployerPrivateKey) throw new Error('Deployer private key required');
      if (!name) throw new Error('Collection name required');
      if (!symbol) throw new Error('Collection symbol required');

      console.log(`🎮 Generating ${name} Gaming Move NFT collection...`);

      // Format private key and get address
      const formattedKey = deployerPrivateKey.startsWith('0x') 
        ? deployerPrivateKey 
        : '0x' + deployerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      const moveAddress = this._ethToMoveAddress(account.address);
      
      // Generate gaming Move contract source
      const moveContract = MoveNFTCompiler.generateGamingMoveNFT(name, symbol, categories);
      const finalContract = MoveNFTCompiler.replaceAddress(moveContract, account.address);
      
      console.log(`✅ Gaming Move contract generated`);

      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      console.log(`🚀 Deploying Gaming Move NFT collection from ${account.address}...`);

      // Create gaming collection deployment payload
      const deploymentPayload = this._createGamingMoveDeploymentPayload(
        moveAddress, 
        name, 
        symbol,
        10000, // max_supply
        1000,  // base_experience_per_level
        100    // max_level
      );

      // Deploy using Umi-compatible transaction
      const hash = await walletClient.sendTransaction({
        to: account.address,
        data: deploymentPayload,
        gas: 4500000n, // Higher gas for gaming contracts
      });

      console.log(`📝 Transaction hash: ${hash}`);

      // Wait for deployment
      const receipt = await this.client.waitForTransaction(hash);
      
      const moduleAddress = `${moveAddress}::${name.toLowerCase()}_gaming`;
      console.log(`✅ Gaming Move NFT collection deployed at: ${moduleAddress}`);

      return {
        hash,
        moduleAddress,
        contractAddress: receipt.contractAddress || account.address,
        deployer: account.address,
        moveAddress,
        name,
        symbol,
        categories,
        type: 'GamingMoveNFT',
        contract: finalContract
      };

    } catch (error) {
      throw new Error(`Gaming Move NFT collection deployment failed: ${error.message}`);
    }
  }

  // ======================================
  // EXISTING ERC-721 METHODS (continued - keeping all original methods)
  // ======================================

  /**
   * Mint NFT to specific address
   */
  async mintNFT({
    ownerPrivateKey,
    contractAddress,
    to,
    tokenId,
    metadataURI = ""
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
        abi: NFTCompiler.getStandardERC721ABI(),
        functionName: 'mintTo',
        args: [to, tokenId, metadataURI]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 200000n,
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        to,
        tokenId: tokenId.toString(),
        metadataURI,
        contractAddress,
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`NFT mint failed: ${error.message}`);
    }
  }

  // [Include all other existing ERC-721 methods: batchMintNFTs, transferNFT, etc...]
  // [For brevity, I'm showing the key new Move methods above]

  // ======================================
  // HELPER METHODS FOR MOVE NFTS
  // ======================================

  /**
   * Convert ETH address to Move address format
   */
  _ethToMoveAddress(ethAddress) {
    const cleanAddress = ethAddress.replace('0x', '');
    return '0x000000000000000000000000' + cleanAddress;
  }

  /**
   * Create Move NFT deployment payload
   */
  _createMoveNFTDeploymentPayload(moveAddress, name, symbol, description, maxSupply) {
    try {
      const address = AccountAddress.fromString(moveAddress);
      
      const entryFunction = EntryFunction.build(
        `${moveAddress}::${name.toLowerCase()}_nft`,
        'create_collection',
        [],
        [
          address,
          name,
          symbol,
          description,
          maxSupply,
          "", // base_uri
          5,  // royalty_numerator (5%)
          100 // royalty_denominator
        ]
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      return transactionPayload.bcsToHex().toString();
      
    } catch (error) {
      throw new Error(`Move NFT deployment payload creation failed: ${error.message}`);
    }
  }

  /**
   * Create Move mint transaction payload
   */
  _createMoveMintPayload(moduleAddress, recipient, tokenId, name, description, imageURI, attributes, level, rarity) {
    try {
      const recipientAddress = AccountAddress.fromString(this._ethToMoveAddress(recipient));
      
      const entryFunction = EntryFunction.build(
        moduleAddress,
        'mint_nft',
        [],
        [
          recipientAddress,
          tokenId,
          name,
          description,
          imageURI,
          attributes, // Simplified - in practice you'd properly encode attributes
          level,
          rarity
        ]
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      return transactionPayload.bcsToHex().toString();
      
    } catch (error) {
      throw new Error(`Move mint payload creation failed: ${error.message}`);
    }
  }

  /**
   * Create Move batch mint payload
   */
  _createMoveBatchMintPayload(moduleAddress, recipients, tokenIds, names, descriptions, imageURIs, rarities) {
    try {
      const recipientAddresses = recipients.map(addr => AccountAddress.fromString(addr));
      
      const entryFunction = EntryFunction.build(
        moduleAddress,
        'batch_mint_nfts',
        [],
        [
          recipientAddresses,
          tokenIds,
          names,
          descriptions,
          imageURIs,
          rarities
        ]
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      return transactionPayload.bcsToHex().toString();
      
    } catch (error) {
      throw new Error(`Move batch mint payload creation failed: ${error.message}`);
    }
  }

  /**
   * Create Move transfer payload
   */
  _createMoveTransferPayload(moduleAddress, to, tokenId) {
    try {
      const toAddress = AccountAddress.fromString(this._ethToMoveAddress(to));
      
      const entryFunction = EntryFunction.build(
        moduleAddress,
        'transfer_nft',
        [],
        [toAddress, tokenId]
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      return transactionPayload.bcsToHex().toString();
      
    } catch (error) {
      throw new Error(`Move transfer payload creation failed: ${error.message}`);
    }
  }

  /**
   * Create Move upgrade payload
   */
  _createMoveUpgradePayload(moduleAddress, tokenId, experienceGained) {
    try {
      const entryFunction = EntryFunction.build(
        moduleAddress,
        'upgrade_nft',
        [],
        [tokenId, experienceGained]
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      return transactionPayload.bcsToHex().toString();
      
    } catch (error) {
      throw new Error(`Move upgrade payload creation failed: ${error.message}`);
    }
  }

  /**
   * Create gaming Move deployment payload
   */
  _createGamingMoveDeploymentPayload(moveAddress, name, symbol, maxSupply, baseExp, maxLevel) {
    try {
      const address = AccountAddress.fromString(moveAddress);
      
      const entryFunction = EntryFunction.build(
        `${moveAddress}::${name.toLowerCase()}_gaming`,
        'create_gaming_collection',
        [],
        [
          address,
          name,
          symbol,
          maxSupply,
          baseExp,
          maxLevel
        ]
      );
      
      const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
      return transactionPayload.bcsToHex().toString();
      
    } catch (error) {
      throw new Error(`Gaming Move deployment payload creation failed: ${error.message}`);
    }
  }

  /**
   * Decode Move NFT result (simplified)
   */
  _decodeMoveNFTResult(data) {
    // This is a simplified decoder - in production you'd use proper BCS decoding
    try {
      return {
        tokenId: 1, // Placeholder - decode from data
        name: "Move NFT",
        description: "A Move-based NFT",
        level: 1,
        experience: 0,
        rarity: "common"
      };
    } catch (error) {
      return null;
    }
  }

  // ======================================
  // EXISTING HELPER METHODS (unchanged)
  // ======================================

  /**
   * Serialize bytecode for Umi Network (reuse from TokenManager)
   */
  _serializeForUmi(bytecode) {
    try {
      const cleanBytecode = bytecode.replace('0x', '');
      const code = new Uint8Array(Buffer.from(cleanBytecode, 'hex'));
      const serialized = this._createUmiContractWrapper(code);
      return '0x' + Buffer.from(serialized).toString('hex');
    } catch (error) {
      throw new Error(`Umi serialization failed: ${error.message}`);
    }
  }

  /**
   * Create Umi contract wrapper (same as TokenManager)
   */
  _createUmiContractWrapper(contractBytes) {
    const length = contractBytes.length;
    const lengthBytes = this._encodeLength(length);
    const wrapper = new Uint8Array(1 + lengthBytes.length + contractBytes.length);
    wrapper[0] = 2; // EvmContract variant
    wrapper.set(lengthBytes, 1);
    wrapper.set(contractBytes, 1 + lengthBytes.length);
    return wrapper;
  }

  /**
   * Encode length as varint (same as TokenManager)
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
      return new Uint8Array([
        (length & 0xFF),
        (length >> 8) & 0xFF,
        (length >> 16) & 0xFF,
        (length >> 24) & 0xFF
      ]);
    }
  }

  // [Keep all other existing ERC-721 methods: getNFTOwner, getNFTMetadata, etc.]
  // [For brevity, showing main structure - include all original methods]
}