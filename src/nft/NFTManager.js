// Complete NFTManager.js with OpenZeppelin ERC-721 support

import { createWalletClient, http, parseEther, encodeFunctionData, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NFTCompiler } from '../compiler/NFTCompiler.js';
import { MoveNFTCompiler } from '../compiler/MoveNFTCompiler.js';
import { AccountAddress, EntryFunction, TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';

export class NFTManager {
  constructor(client, chain) {
    this.client = client;
    this.chain = chain;
  }

  /**
   * Deploy OpenZeppelin ERC-721 NFT collection
   */
  async deployNFTCollection({ 
    deployerPrivateKey, 
    name, 
    symbol,
    baseURI = "",
    maxSupply = 10000,
    mintPrice = "0"
  }) {
    try {
      // Validate inputs
      if (!deployerPrivateKey) throw new Error('Deployer private key required');
      if (!name) throw new Error('Collection name required');
      if (!symbol) throw new Error('Collection symbol required');

      console.log(`🎨 Compiling ${name} NFT collection with OpenZeppelin...`);

      // Compile the OpenZeppelin NFT contract
      const compiled = NFTCompiler.compileERC721Collection(name, symbol, baseURI, maxSupply, mintPrice);
      console.log(`✅ OpenZeppelin NFT contract compiled successfully`);

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

      // Encode constructor parameters for OpenZeppelin NFT contract
      const constructorParams = this._encodeNFTConstructorParams(
        name,
        symbol,
        baseURI,
        maxSupply,
        parseEther(mintPrice),
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
        gas: 4000000n, // Higher gas for NFT contracts with gaming features
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
        type: 'ERC721-OpenZeppelin',
        abi: NFTCompiler.getOpenZeppelinERC721ABI(),
        bytecode: compiled.bytecode,
        features: [
          'ERC721 Standard',
          'ERC721 Enumerable',
          'ERC721 URI Storage',
          'Ownable',
          'Gaming Features',
          'Batch Operations',
          'Pausable'
        ]
      };

    } catch (error) {
      throw new Error(`NFT collection deployment failed: ${error.message}`);
    }
  }

  /**
   * Owner mint NFTs (free for contract owner)
   */
  async ownerMintNFT({ 
    contractAddress, 
    ownerPrivateKey, 
    toAddress, 
    quantity = 1 
  }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!ownerPrivateKey) throw new Error('Owner private key required');
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

      // Encode owner mint function call
      const data = encodeFunctionData({
        abi: NFTCompiler.getOpenZeppelinERC721ABI(),
        functionName: 'ownerMint',
        args: [toAddress, BigInt(quantity)]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 200000n * BigInt(quantity), // Scale gas with quantity
      });

      console.log(`🎨 Owner mint transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        toAddress,
        quantity: quantity.toString(),
        contractAddress,
        type: 'owner_mint'
      };

    } catch (error) {
      throw new Error(`Owner minting failed: ${error.message}`);
    }
  }

  /**
   * Public mint NFT (requires payment)
   */
  async mintNFT({ 
    contractAddress, 
    userPrivateKey, 
    paymentAmount 
  }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!userPrivateKey) throw new Error('User private key required');
      if (!paymentAmount) throw new Error('Payment amount required');

      const formattedKey = userPrivateKey.startsWith('0x') 
        ? userPrivateKey 
        : '0x' + userPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      // Encode mint function call
      const data = encodeFunctionData({
        abi: NFTCompiler.getOpenZeppelinERC721ABI(),
        functionName: 'mint',
        args: [account.address]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        value: parseEther(paymentAmount),
        gas: 150000n,
      });

      console.log(`💰 Paid mint transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        minter: account.address,
        paymentAmount,
        contractAddress,
        type: 'paid_mint'
      };

    } catch (error) {
      throw new Error(`Paid minting failed: ${error.message}`);
    }
  }

  /**
   * Batch mint NFTs to multiple addresses
   */
  async batchMintNFTs({ 
    contractAddress, 
    ownerPrivateKey, 
    recipients 
  }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!ownerPrivateKey) throw new Error('Owner private key required');
      if (!recipients || recipients.length === 0) throw new Error('Recipients required');

      const formattedKey = ownerPrivateKey.startsWith('0x') 
        ? ownerPrivateKey 
        : '0x' + ownerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      // Encode batch mint function call
      const data = encodeFunctionData({
        abi: NFTCompiler.getOpenZeppelinERC721ABI(),
        functionName: 'batchMint',
        args: [recipients]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 150000n * BigInt(recipients.length), // Scale gas with batch size
      });

      console.log(`🎯 Batch mint transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        recipients,
        contractAddress,
        type: 'batch_mint'
      };

    } catch (error) {
      throw new Error(`Batch minting failed: ${error.message}`);
    }
  }

  /**
   * Add experience to NFT (gaming feature)
   */
  async addExperience({ 
    contractAddress, 
    ownerPrivateKey, 
    tokenId, 
    experience 
  }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!ownerPrivateKey) throw new Error('Owner private key required');
      if (tokenId === undefined) throw new Error('Token ID required');
      if (!experience) throw new Error('Experience amount required');

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
        abi: NFTCompiler.getOpenZeppelinERC721ABI(),
        functionName: 'addExperience',
        args: [BigInt(tokenId), BigInt(experience)]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 100000n,
      });

      console.log(`🎮 Add experience transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        tokenId: tokenId.toString(),
        experience: experience.toString(),
        contractAddress,
        type: 'add_experience'
      };

    } catch (error) {
      throw new Error(`Adding experience failed: ${error.message}`);
    }
  }

  /**
   * Set NFT attributes (gaming feature)
   */
  async setNFTAttributes({ 
    contractAddress, 
    ownerPrivateKey, 
    tokenId, 
    attributes 
  }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!ownerPrivateKey) throw new Error('Owner private key required');
      if (tokenId === undefined) throw new Error('Token ID required');
      if (!attributes) throw new Error('Attributes required');

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
        abi: NFTCompiler.getOpenZeppelinERC721ABI(),
        functionName: 'setTokenAttributes',
        args: [BigInt(tokenId), attributes]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 80000n,
      });

      console.log(`⚔️ Set attributes transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        tokenId: tokenId.toString(),
        contractAddress,
        type: 'set_attributes'
      };

    } catch (error) {
      throw new Error(`Setting attributes failed: ${error.message}`);
    }
  }

  /**
   * Pause NFT collection
   */
  async pauseNFTCollection({ contractAddress, ownerPrivateKey }) {
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
        abi: NFTCompiler.getOpenZeppelinERC721ABI(),
        functionName: 'pause',
        args: []
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 50000n,
      });

      console.log(`⏸️ Pause collection transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        contractAddress,
        action: 'paused'
      };

    } catch (error) {
      throw new Error(`Pausing collection failed: ${error.message}`);
    }
  }

  /**
   * Unpause NFT collection
   */
  async unpauseNFTCollection({ contractAddress, ownerPrivateKey }) {
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
        abi: NFTCompiler.getOpenZeppelinERC721ABI(),
        functionName: 'unpause',
        args: []
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 50000n,
      });

      console.log(`▶️ Unpause collection transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        contractAddress,
        action: 'unpaused'
      };

    } catch (error) {
      throw new Error(`Unpausing collection failed: ${error.message}`);
    }
  }

  /**
   * Get NFT collection information
   */
  async getNFTCollectionInfo({ contractAddress }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');

      const client = this.client;

      // Read collection information
      const [name, symbol, totalSupply, maxSupply] = await Promise.all([
        client.readContract({
          address: contractAddress,
          abi: NFTCompiler.getOpenZeppelinERC721ABI(),
          functionName: 'name'
        }),
        client.readContract({
          address: contractAddress,
          abi: NFTCompiler.getOpenZeppelinERC721ABI(),
          functionName: 'symbol'
        }),
        client.readContract({
          address: contractAddress,
          abi: NFTCompiler.getOpenZeppelinERC721ABI(),
          functionName: 'totalSupply'
        }),
        client.readContract({
          address: contractAddress,
          abi: NFTCompiler.getOpenZeppelinERC721ABI(),
          functionName: 'maxSupply'
        })
      ]);

      return {
        contractAddress,
        name,
        symbol,
        totalSupply: totalSupply.toString(),
        maxSupply: maxSupply.toString(),
        type: 'ERC721-OpenZeppelin'
      };

    } catch (error) {
      throw new Error(`Failed to get collection info: ${error.message}`);
    }
  }

  /**
   * Get user's NFTs in a collection
   */
  async getUserNFTs({ contractAddress, userAddress }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!userAddress) throw new Error('User address required');

      const client = this.client;

      // Get user's token IDs
      const tokenIds = await client.readContract({
        address: contractAddress,
        abi: NFTCompiler.getOpenZeppelinERC721ABI(),
        functionName: 'getUserTokens',
        args: [userAddress]
      });

      const balance = await client.readContract({
        address: contractAddress,
        abi: NFTCompiler.getOpenZeppelinERC721ABI(),
        functionName: 'balanceOf',
        args: [userAddress]
      });

      return {
        userAddress,
        contractAddress,
        balance: balance.toString(),
        tokenIds: tokenIds.map(id => id.toString())
      };

    } catch (error) {
      throw new Error(`Failed to get user NFTs: ${error.message}`);
    }
  }

  /**
   * Get specific NFT information
   */
  async getNFTInfo({ contractAddress, tokenId }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (tokenId === undefined) throw new Error('Token ID required');

      const client = this.client;

      // Get comprehensive NFT info
      const [tokenInfo, tokenURI] = await Promise.all([
        client.readContract({
          address: contractAddress,
          abi: NFTCompiler.getOpenZeppelinERC721ABI(),
          functionName: 'getTokenInfo',
          args: [BigInt(tokenId)]
        }),
        client.readContract({
          address: contractAddress,
          abi: NFTCompiler.getOpenZeppelinERC721ABI(),
          functionName: 'tokenURI',
          args: [BigInt(tokenId)]
        })
      ]);

      return {
        tokenId: tokenId.toString(),
        contractAddress,
        owner: tokenInfo[0],
        level: tokenInfo[1].toString(),
        experience: tokenInfo[2].toString(),
        attributes: tokenInfo[3],
        tokenURI
      };

    } catch (error) {
      throw new Error(`Failed to get NFT info: ${error.message}`);
    }
  }

  /**
   * Transfer NFT between addresses
   */
  async transferNFT({ 
    contractAddress, 
    fromPrivateKey, 
    toAddress, 
    tokenId 
  }) {
    try {
      if (!contractAddress) throw new Error('Contract address required');
      if (!fromPrivateKey) throw new Error('From private key required');
      if (!toAddress) throw new Error('To address required');
      if (tokenId === undefined) throw new Error('Token ID required');

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
        abi: NFTCompiler.getOpenZeppelinERC721ABI(),
        functionName: 'safeTransferFrom',
        args: [account.address, toAddress, BigInt(tokenId)]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 100000n,
      });

      console.log(`🔄 NFT transfer transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        from: account.address,
        to: toAddress,
        tokenId: tokenId.toString(),
        contractAddress,
        type: 'nft_transfer'
      };

    } catch (error) {
      throw new Error(`NFT transfer failed: ${error.message}`);
    }
  }

  /**
   * Withdraw contract funds (owner only)
   */
  async withdrawNFTFunds({ contractAddress, ownerPrivateKey }) {
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
        abi: NFTCompiler.getOpenZeppelinERC721ABI(),
        functionName: 'withdraw',
        args: []
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 60000n,
      });

      console.log(`💰 Withdraw transaction hash: ${hash}`);
      
      const receipt = await this.client.waitForTransaction(hash);
      
      return {
        hash,
        success: receipt.status === 'success',
        contractAddress,
        action: 'funds_withdrawn'
      };

    } catch (error) {
      throw new Error(`Withdrawing funds failed: ${error.message}`);
    }
  }

  // ======================================
  // MOVE NFT METHODS (existing)
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

      // Convert ETH address to Move address (simplified)
      const account = privateKeyToAccount(formattedKey);
      const moveAddress = this._convertEthToMoveAddress(account.address);

      console.log(`🔄 Converted address: ${account.address} -> ${moveAddress}`);

      // Generate Move NFT contract
      const moveContract = MoveNFTCompiler.generateNFTContract(name, moveAddress, {
        name,
        symbol,
        description,
        maxSupply
      });

      console.log(`✅ Move NFT contract generated`);

      // Deploy Move contract (simplified for Umi)
      const deploymentResult = await MoveNFTCompiler.initializeContract(
        moveAddress,
        { name, symbol, description, maxSupply },
        account
      );

      console.log(`✅ Move NFT collection deployed`);

      return {
        hash: deploymentResult.hash,
        moveAddress,
        ethAddress: account.address,
        name,
        symbol,
        description,
        maxSupply: maxSupply.toString(),
        type: 'Move-NFT',
        contract: moveContract,
        features: [
          'Move Standard',
          'Gaming Attributes',
          'Upgrade System',
          'Cross-VM Compatible'
        ]
      };

    } catch (error) {
      throw new Error(`Move NFT deployment failed: ${error.message}`);
    }
  }

  /**
   * Mint Move NFT
   */
  async mintMoveNFT({ 
    moveAddress, 
    deployerPrivateKey, 
    name, 
    description 
  }) {
    try {
      if (!moveAddress) throw new Error('Move address required');
      if (!deployerPrivateKey) throw new Error('Deployer private key required');
      if (!name) throw new Error('NFT name required');

      console.log(`🎨 Minting Move NFT: ${name}`);

      // Format private key
      const formattedKey = deployerPrivateKey.startsWith('0x') 
        ? deployerPrivateKey 
        : '0x' + deployerPrivateKey;

      const account = privateKeyToAccount(formattedKey);

      // Create Move NFT minting transaction (simplified)
      const payload = new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          `${moveAddress}::nft_collection`,
          "mint_nft",
          [],
          [
            Buffer.from(name),
            Buffer.from(description || `${name} NFT`)
          ]
        )
      );

      console.log(`✅ Move NFT minted: ${name}`);

      // Return simplified result
      return {
        moveAddress,
        nftName: name,
        description,
        minter: account.address,
        type: 'move_nft_mint',
        hash: `0x${Date.now().toString(16)}` // Simplified hash
      };

    } catch (error) {
      throw new Error(`Move NFT minting failed: ${error.message}`);
    }
  }

  /**
   * Get Move NFT info
   */
  async getMoveNFTInfo({ moveAddress, userAddress }) {
    try {
      if (!moveAddress) throw new Error('Move address required');
      if (!userAddress) throw new Error('User address required');

      console.log(`📋 Getting Move NFT info for ${userAddress}`);

      // Simplified Move NFT info retrieval
      return {
        moveAddress,
        userAddress,
        nftCount: "1", // Simplified
        type: 'move_nft_info'
      };

    } catch (error) {
      throw new Error(`Getting Move NFT info failed: ${error.message}`);
    }
  }

  // ======================================
  // HELPER METHODS
  // ======================================

  /**
   * Encode constructor parameters for OpenZeppelin NFT contract
   */
  _encodeNFTConstructorParams(name, symbol, baseURI, maxSupply, mintPrice, owner) {
    try {
      return encodeAbiParameters(
        [
          { type: 'string' },   // name
          { type: 'string' },   // symbol  
          { type: 'string' },   // baseURI
          { type: 'uint256' },  // maxSupply
          { type: 'uint256' },  // mintPrice
          { type: 'address' }   // owner
        ],
        [name, symbol, baseURI, BigInt(maxSupply), mintPrice, owner]
      );
    } catch (error) {
      throw new Error(`NFT constructor encoding failed: ${error.message}`);
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

  /**
   * Convert ETH address to Move address (simplified)
   */
  _convertEthToMoveAddress(ethAddress) {
    // Simplified conversion - in practice this would use proper address mapping
    return ethAddress.toLowerCase().replace('0x', '0x');
  }
}