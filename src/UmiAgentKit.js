/**
 * File Location: src/UmiAgentKit.js
 * COMPLETE UmiAgentKit.js - Final version with full Move NFT support
 * 
 * This is the complete UmiAgentKit.js file with:
 * - All existing functionality (wallets, transfers, tokens, ERC-721 NFTs)
 * - NEW: Complete Move NFT functionality
 * - NEW: Dual-VM NFT support (ERC-721 + Move)
 * - NEW: Gaming NFT features for both VMs
 */

import { UmiClient } from './client/UmiClient.js';
import { WalletManager } from './wallet/WalletManager.js';
import { TransferManager } from './transfer/TransferManager.js';
import { TokenManager } from './token/TokenManager.js';
import { NFTManager } from './nft/NFTManager.js';
import { validateConfig } from './config.js';
import { parseEther } from 'viem';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export class UmiAgentKit {
  constructor(config = {}) {
    // Set default config
    this.config = {
      network: 'devnet',
      ...config
    };

    // Validate configuration
    validateConfig(this.config);

    // Initialize client
    this.client = new UmiClient(this.config);
    
    // Initialize wallet manager
    this.walletManager = new WalletManager(this.client);

    // Initialize transfer manager
    this.transferManager = new TransferManager(this.client, this.client.chain);

    // Initialize token manager
    this.tokenManager = new TokenManager(this.client, this.client.chain);

    // Initialize NFT manager (supports both ERC-721 and Move)
    this.nftManager = new NFTManager(this.client, this.client.chain);

    console.log(`UmiAgentKit initialized on ${this.config.network}`);
  }

  // ====== WALLET OPERATIONS ======

  /**
   * Create a new wallet
   */
  createWallet() {
    return this.walletManager.createWallet();
  }

  /**
   * Import wallet from private key
   */
  importWallet(privateKey) {
    return this.walletManager.importWallet(privateKey);
  }

  /**
   * Import wallet from mnemonic
   */
  importFromMnemonic(mnemonic, index = 0) {
    return this.walletManager.importFromMnemonic(mnemonic, index);
  }

  /**
   * Get wallet by address
   */
  getWallet(address) {
    return this.walletManager.getWallet(address);
  }

  /**
   * Get all wallets
   */
  getAllWallets() {
    return this.walletManager.getAllWallets();
  }

  /**
   * Get balance for specific address
   */
  async getBalance(address) {
    return await this.client.getBalance(address);
  }

  /**
   * Get formatted balance in ETH
   */
  async getFormattedBalance(address) {
    const balance = await this.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash) {
    return await this.client.getTransaction(hash);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(hash, confirmations = 1) {
    return await this.client.waitForTransaction(hash, confirmations);
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return this.client.getNetworkInfo();
  }

  /**
   * Get current block number
   */
  async getBlockNumber() {
    return await this.client.getBlockNumber();
  }

  /**
   * Get gas price
   */
  async getGasPrice() {
    return await this.client.getGasPrice();
  }

  /**
   * Generate new mnemonic
   */
  generateMnemonic() {
    return WalletManager.generateMnemonic();
  }

  /**
   * Validate mnemonic
   */
  validateMnemonic(mnemonic) {
    return WalletManager.validateMnemonic(mnemonic);
  }

  // ====== ETH TRANSFER OPERATIONS ======

  /**
   * Send ETH from wallet to another address
   */
  async sendETH({ fromWallet, to, amount, gasLimit, gasPrice }) {
    if (!fromWallet) {
      throw new Error('From wallet is required');
    }
    
    return await this.transferManager.sendETH({
      fromPrivateKey: fromWallet.exportPrivateKey(),
      to,
      amount,
      gasLimit,
      gasPrice
    });
  }

  /**
   * Send ETH using private key directly
   */
  async sendETHWithPrivateKey({ fromPrivateKey, to, amount, gasLimit, gasPrice }) {
    return await this.transferManager.sendETH({
      fromPrivateKey,
      to,
      amount,
      gasLimit,
      gasPrice
    });
  }

  /**
   * Check if wallet has enough balance for transfer
   */
  async checkBalance({ address, amount, includeGas = true }) {
    return await this.transferManager.checkBalance({ address, amount, includeGas });
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(hash, confirmations = 1) {
    return await this.transferManager.waitForConfirmation(hash, confirmations);
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(hash) {
    return await this.transferManager.getTransactionStatus(hash);
  }

  /**
   * Calculate transaction cost
   */
  async calculateTransactionCost(amount) {
    return await this.transferManager.calculateTransactionCost(amount);
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas({ from, to, amount }) {
    const value = parseEther(amount.toString());
    return await this.transferManager.estimateGas({ from, to, value });
  }

  /**
   * Get total balance across all managed wallets
   */
  async getTotalBalance() {
    return await this.walletManager.getTotalBalance();
  }

  // ====== TOKEN OPERATIONS ======

  /**
   * Create ERC-20 token
   */
  async createERC20Token({
    deployerWallet,
    name,
    symbol,
    decimals = 18,
    initialSupply
  }) {
    if (!deployerWallet) {
      throw new Error('Deployer wallet is required');
    }

    return await this.tokenManager.deployERC20Token({
      deployerPrivateKey: deployerWallet.exportPrivateKey(),
      name,
      symbol,
      decimals,
      initialSupply
    });
  }

  /**
   * Create ERC-20 token with private key
   */
  async createERC20TokenWithPrivateKey({
    deployerPrivateKey,
    name,
    symbol,
    decimals = 18,
    initialSupply
  }) {
    return await this.tokenManager.deployERC20Token({
      deployerPrivateKey,
      name,
      symbol,
      decimals,
      initialSupply
    });
  }

  /**
   * Create Move token
   */
  async createMoveToken({
    deployerWallet,
    name,
    symbol,
    decimals = 8,
    monitorSupply = true
  }) {
    if (!deployerWallet) {
      throw new Error('Deployer wallet is required');
    }

    return await this.tokenManager.deployMoveToken({
      deployerPrivateKey: deployerWallet.exportPrivateKey(),
      name,
      symbol,
      decimals,
      monitorSupply
    });
  }

  /**
   * Create Move token with private key
   */
  async createMoveTokenWithPrivateKey({
    deployerPrivateKey,
    name,
    symbol,
    decimals = 8,
    monitorSupply = true
  }) {
    return await this.tokenManager.deployMoveToken({
      deployerPrivateKey,
      name,
      symbol,
      decimals,
      monitorSupply
    });
  }

  /**
   * Mint ERC-20 tokens
   */
  async mintERC20Tokens({
    ownerWallet,
    tokenAddress,
    to,
    amount,
    decimals = 18
  }) {
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    return await this.tokenManager.mintERC20({
      ownerPrivateKey: ownerWallet.exportPrivateKey(),
      tokenAddress,
      to,
      amount,
      decimals
    });
  }

  /**
   * Mint Move tokens
   */
  async mintMoveTokens({
    ownerWallet,
    moduleAddress,
    to,
    amount
  }) {
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    return await this.tokenManager.mintMoveToken({
      ownerPrivateKey: ownerWallet.exportPrivateKey(),
      moduleAddress,
      to,
      amount
    });
  }

  /**
   * Transfer ERC-20 tokens
   */
  async transferERC20Tokens({
    fromWallet,
    tokenAddress,
    to,
    amount,
    decimals = 18
  }) {
    if (!fromWallet) {
      throw new Error('From wallet is required');
    }

    return await this.tokenManager.transferERC20({
      fromPrivateKey: fromWallet.exportPrivateKey(),
      tokenAddress,
      to,
      amount,
      decimals
    });
  }

  /**
   * Get ERC-20 token balance
   */
  async getERC20Balance({
    tokenAddress,
    address,
    decimals = 18
  }) {
    return await this.tokenManager.getERC20Balance({
      tokenAddress,
      address,
      decimals
    });
  }

  /**
   * Get token balance for a wallet
   */
  async getTokenBalance({
    wallet,
    tokenAddress,
    decimals = 18
  }) {
    return await this.getERC20Balance({
      tokenAddress,
      address: wallet.getAddress(),
      decimals
    });
  }

  // ====== ERC-721 NFT OPERATIONS ======

  /**
   * Create ERC-721 NFT collection
   */
  async createNFTCollection({
    deployerWallet,
    name,
    symbol,
    baseURI = "",
    maxSupply = 10000,
    mintPrice = "0"
  }) {
    if (!deployerWallet) {
      throw new Error('Deployer wallet is required');
    }

    return await this.nftManager.deployNFTCollection({
      deployerPrivateKey: deployerWallet.exportPrivateKey(),
      name,
      symbol,
      baseURI,
      maxSupply,
      mintPrice
    });
  }

  /**
   * Create ERC-721 NFT collection with private key
   */
  async createNFTCollectionWithPrivateKey({
    deployerPrivateKey,
    name,
    symbol,
    baseURI = "",
    maxSupply = 10000,
    mintPrice = "0"
  }) {
    return await this.nftManager.deployNFTCollection({
      deployerPrivateKey,
      name,
      symbol,
      baseURI,
      maxSupply,
      mintPrice
    });
  }

  /**
   * Mint ERC-721 NFT to specific address
   */
  async mintNFT({
    ownerWallet,
    contractAddress,
    to,
    tokenId,
    metadataURI = ""
  }) {
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    return await this.nftManager.mintNFT({
      ownerPrivateKey: ownerWallet.exportPrivateKey(),
      contractAddress,
      to,
      tokenId,
      metadataURI
    });
  }

  /**
   * Mint ERC-721 NFT with private key
   */
  async mintNFTWithPrivateKey({
    ownerPrivateKey,
    contractAddress,
    to,
    tokenId,
    metadataURI = ""
  }) {
    return await this.nftManager.mintNFT({
      ownerPrivateKey,
      contractAddress,
      to,
      tokenId,
      metadataURI
    });
  }

  /**
   * Batch mint ERC-721 NFTs
   */
  async batchMintNFTs({
    ownerWallet,
    contractAddress,
    recipients
  }) {
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    return await this.nftManager.batchMintNFTs({
      ownerPrivateKey: ownerWallet.exportPrivateKey(),
      contractAddress,
      recipients
    });
  }

  /**
   * Transfer ERC-721 NFT between addresses
   */
  async transferNFT({
    fromWallet,
    contractAddress,
    from,
    to,
    tokenId
  }) {
    if (!fromWallet) {
      throw new Error('From wallet is required');
    }

    return await this.nftManager.transferNFT({
      fromPrivateKey: fromWallet.exportPrivateKey(),
      contractAddress,
      from,
      to,
      tokenId
    });
  }

  /**
   * Get ERC-721 NFT owner
   */
  async getNFTOwner({
    contractAddress,
    tokenId
  }) {
    return await this.nftManager.getNFTOwner({
      contractAddress,
      tokenId
    });
  }

  /**
   * Get ERC-721 NFT metadata
   */
  async getNFTMetadata({
    contractAddress,
    tokenId
  }) {
    return await this.nftManager.getNFTMetadata({
      contractAddress,
      tokenId
    });
  }

  /**
   * Get ERC-721 NFT balance for address
   */
  async getNFTBalance({
    contractAddress,
    address
  }) {
    return await this.nftManager.getNFTBalance({
      contractAddress,
      address
    });
  }

  /**
   * Get collection information
   */
  async getCollectionInfo({
    contractAddress
  }) {
    return await this.nftManager.getCollectionInfo({
      contractAddress
    });
  }

  // ====== MOVE NFT OPERATIONS ======

  /**
   * Create Move NFT collection
   */
  async createMoveNFTCollection({
    deployerWallet,
    name,
    symbol,
    description = "",
    maxSupply = 10000
  }) {
    if (!deployerWallet) {
      throw new Error('Deployer wallet is required');
    }

    return await this.nftManager.deployMoveNFTCollection({
      deployerPrivateKey: deployerWallet.exportPrivateKey(),
      name,
      symbol,
      description,
      maxSupply
    });
  }

  /**
   * Create Move NFT collection with private key
   */
  async createMoveNFTCollectionWithPrivateKey({
    deployerPrivateKey,
    name,
    symbol,
    description = "",
    maxSupply = 10000
  }) {
    return await this.nftManager.deployMoveNFTCollection({
      deployerPrivateKey,
      name,
      symbol,
      description,
      maxSupply
    });
  }

  /**
   * Mint Move NFT
   */
  async mintMoveNFT({
    ownerWallet,
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
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    return await this.nftManager.mintMoveNFT({
      ownerPrivateKey: ownerWallet.exportPrivateKey(),
      moduleAddress,
      recipient,
      tokenId,
      name,
      description,
      imageURI,
      attributes,
      level,
      rarity
    });
  }

  /**
   * Mint Move NFT with private key
   */
  async mintMoveNFTWithPrivateKey({
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
    return await this.nftManager.mintMoveNFT({
      ownerPrivateKey,
      moduleAddress,
      recipient,
      tokenId,
      name,
      description,
      imageURI,
      attributes,
      level,
      rarity
    });
  }

  /**
   * Batch mint Move NFTs
   */
  async batchMintMoveNFTs({
    ownerWallet,
    moduleAddress,
    recipients
  }) {
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    return await this.nftManager.batchMintMoveNFTs({
      ownerPrivateKey: ownerWallet.exportPrivateKey(),
      moduleAddress,
      recipients
    });
  }

  /**
   * Transfer Move NFT
   */
  async transferMoveNFT({
    fromWallet,
    moduleAddress,
    from,
    to,
    tokenId
  }) {
    if (!fromWallet) {
      throw new Error('From wallet is required');
    }

    return await this.nftManager.transferMoveNFT({
      fromPrivateKey: fromWallet.exportPrivateKey(),
      moduleAddress,
      from,
      to,
      tokenId
    });
  }

  /**
   * Get Move NFT info
   */
  async getMoveNFTInfo({
    moduleAddress,
    owner
  }) {
    return await this.nftManager.getMoveNFTInfo({
      moduleAddress,
      owner
    });
  }

  /**
   * Upgrade Move NFT (gaming feature)
   */
  async upgradeMoveNFT({
    ownerWallet,
    moduleAddress,
    tokenId,
    experienceGained
  }) {
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    return await this.nftManager.upgradeMoveNFT({
      ownerPrivateKey: ownerWallet.exportPrivateKey(),
      moduleAddress,
      tokenId,
      experienceGained
    });
  }

  /**
   * Create gaming Move NFT collection
   */
  async createGamingMoveNFTCollection({
    deployerWallet,
    name,
    symbol,
    categories = ['weapon', 'armor', 'accessory', 'consumable']
  }) {
    if (!deployerWallet) {
      throw new Error('Deployer wallet is required');
    }

    return await this.nftManager.deployGamingMoveNFTCollection({
      deployerPrivateKey: deployerWallet.exportPrivateKey(),
      name,
      symbol,
      categories
    });
  }

  // ====== GAMING NFT HELPERS ======

  /**
   * Create gaming ERC-721 NFT collection with special features
   */
  async createGamingNFTCollection({
    deployerWallet,
    name,
    symbol,
    baseURI = "",
    categories = ['common', 'rare', 'epic', 'legendary']
  }) {
    if (!deployerWallet) {
      throw new Error('Deployer wallet is required');
    }

    // Use NFTCompiler for gaming-specific contract
    const { NFTCompiler } = await import('./compiler/NFTCompiler.js');
    
    const gamingContract = NFTCompiler.compileGamingNFT(name, symbol, baseURI, categories);
    
    // Deploy using custom bytecode
    const formattedKey = deployerWallet.exportPrivateKey().startsWith('0x') 
      ? deployerWallet.exportPrivateKey() 
      : '0x' + deployerWallet.exportPrivateKey();

    const account = privateKeyToAccount(formattedKey);
    
    const walletClient = createWalletClient({
      account,
      chain: this.client.chain,
      transport: http(this.client.chain.rpcUrls.default.http[0])
    });

    // Use same serialization as other contracts
    const serializedBytecode = this.nftManager._serializeForUmi(gamingContract.bytecode);

    const hash = await walletClient.sendTransaction({
      to: null,
      data: serializedBytecode,
      gas: 3500000n, // Higher gas for gaming contracts
    });

    const receipt = await this.client.waitForTransaction(hash);
    
    return {
      hash,
      contractAddress: receipt.contractAddress,
      deployer: account.address,
      name,
      symbol,
      baseURI,
      categories,
      type: 'GamingNFT',
      abi: gamingContract.abi,
      bytecode: gamingContract.bytecode
    };
  }

  /**
   * Quick mint hero NFT (ERC-721)
   */
  async mintHeroNFT({
    ownerWallet,
    contractAddress,
    heroName,
    heroClass,
    level = 1,
    imageURL
  }) {
    const tokenId = Date.now(); // Simple ID generation
    const metadata = {
      name: heroName,
      description: `A level ${level} ${heroClass} hero`,
      image: imageURL,
      attributes: [
        { trait_type: "Class", value: heroClass },
        { trait_type: "Level", value: level },
        { trait_type: "Type", value: "Hero" }
      ]
    };
    
    // For production, you'd upload this to IPFS
    const metadataURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;
    
    return await this.mintNFT({
      ownerWallet,
      contractAddress,
      to: ownerWallet.getAddress(),
      tokenId,
      metadataURI
    });
  }

  /**
   * Quick mint weapon NFT (ERC-721)
   */
  async mintWeaponNFT({
    ownerWallet,
    contractAddress,
    weaponName,
    weaponType,
    damage,
    rarity,
    imageURL
  }) {
    const tokenId = Date.now() + Math.floor(Math.random() * 1000); // Avoid collisions
    const metadata = {
      name: weaponName,
      description: `A ${rarity} ${weaponType} with ${damage} damage`,
      image: imageURL,
      attributes: [
        { trait_type: "Type", value: weaponType },
        { trait_type: "Damage", value: damage },
        { trait_type: "Rarity", value: rarity },
        { trait_type: "Category", value: "Weapon" }
      ]
    };
    
    const metadataURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;
    
    return await this.mintNFT({
      ownerWallet,
      contractAddress,
      to: ownerWallet.getAddress(),
      tokenId,
      metadataURI
    });
  }

  /**
   * Quick mint Move hero NFT
   */
  async mintMoveHeroNFT({
    ownerWallet,
    moduleAddress,
    heroName,
    heroClass,
    level = 1,
    imageURL
  }) {
    const tokenId = Date.now(); // Simple ID generation
    const attributes = [
      { trait_type: "Class", value: heroClass },
      { trait_type: "Level", value: level.toString() },
      { trait_type: "Type", value: "Hero" }
    ];
    
    return await this.mintMoveNFT({
      ownerWallet,
      moduleAddress,
      recipient: ownerWallet.getAddress(),
      tokenId,
      name: heroName,
      description: `A level ${level} ${heroClass} hero`,
      imageURI: imageURL,
      attributes,
      level,
      rarity: "common"
    });
  }

  /**
   * Quick mint Move weapon NFT
   */
  async mintMoveWeaponNFT({
    ownerWallet,
    moduleAddress,
    weaponName,
    weaponType,
    damage,
    rarity,
    imageURL
  }) {
    const tokenId = Date.now() + Math.floor(Math.random() * 1000);
    const attributes = [
      { trait_type: "Type", value: weaponType },
      { trait_type: "Damage", value: damage.toString() },
      { trait_type: "Rarity", value: rarity },
      { trait_type: "Category", value: "Weapon" }
    ];
    
    return await this.mintMoveNFT({
      ownerWallet,
      moduleAddress,
      recipient: ownerWallet.getAddress(),
      tokenId,
      name: weaponName,
      description: `A ${rarity} ${weaponType} with ${damage} damage`,
      imageURI: imageURL,
      attributes,
      level: 1,
      rarity
    });
  }

  // ====== DUAL-VM NFT OPERATIONS ======

  /**
   * Create dual NFT collections (both ERC-721 and Move)
   */
  async createDualNFTCollections({
    deployerWallet,
    name,
    symbol,
    description = "",
    baseURI = "",
    maxSupply = 10000,
    mintPrice = "0"
  }) {
    if (!deployerWallet) {
      throw new Error('Deployer wallet is required');
    }

    console.log('🎨 Creating dual NFT collections (ERC-721 + Move)...');

    // Deploy ERC-721 collection
    console.log('1️⃣  Deploying ERC-721 collection...');
    const erc721Collection = await this.createNFTCollection({
      deployerWallet,
      name: `${name}ERC721`,
      symbol: `${symbol}721`,
      baseURI,
      maxSupply,
      mintPrice
    });

    // Deploy Move collection
    console.log('2️⃣  Deploying Move collection...');
    const moveCollection = await this.createMoveNFTCollection({
      deployerWallet,
      name: `${name}Move`,
      symbol: `${symbol}MV`,
      description,
      maxSupply
    });

    console.log('✅ Dual NFT collections created!');

    return {
      erc721: erc721Collection,
      move: moveCollection,
      summary: {
        name,
        symbol,
        bothCollections: true,
        erc721Address: erc721Collection.contractAddress,
        moveAddress: moveCollection.moduleAddress
      }
    };
  }

  /**
   * Mint NFT to both chains (ERC-721 and Move)
   */
  async mintDualNFT({
    ownerWallet,
    erc721ContractAddress,
    moveModuleAddress,
    recipient,
    tokenId,
    name,
    description,
    imageURI,
    attributes = []
  }) {
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    console.log('🪙 Minting to both ERC-721 and Move...');

    // Mint ERC-721 NFT
    console.log('1️⃣  Minting ERC-721 NFT...');
    const erc721Result = await this.mintNFT({
      ownerWallet,
      contractAddress: erc721ContractAddress,
      to: recipient,
      tokenId,
      metadataURI: imageURI
    });

    // Mint Move NFT
    console.log('2️⃣  Minting Move NFT...');
    const moveResult = await this.mintMoveNFT({
      ownerWallet,
      moduleAddress: moveModuleAddress,
      recipient,
      tokenId,
      name,
      description,
      imageURI,
      attributes,
      level: 1,
      rarity: "common"
    });

    console.log('✅ Dual NFT minted!');

    return {
      erc721: erc721Result,
      move: moveResult,
      summary: {
        tokenId,
        recipient,
        bothMinted: true,
        erc721Hash: erc721Result.hash,
        moveHash: moveResult.hash
      }
    };
  }

  // ====== UTILITY METHODS ======

  /**
   * Get summary of the kit
   */
  async getSummary() {
    const networkInfo = this.getNetworkInfo();
    const walletCount = this.walletManager.getWalletCount();
    const totalBalance = walletCount > 0 ? await this.getTotalBalance() : '0';

    return {
      network: networkInfo.network,
      chainId: networkInfo.chainId,
      rpcUrl: networkInfo.rpcUrl,
      walletCount,
      totalBalance: `${totalBalance} ETH`,
      wallets: this.walletManager.getWalletAddresses(),
      features: {
        walletManagement: true,
        ethTransfers: true,
        erc20Tokens: true,
        moveTokens: true,
        erc721NFTs: true,        // ERC-721 NFTs
        moveNFTs: true,          // Move NFTs
        gamingNFTs: true,        // Both ERC-721 and Move gaming features
        dualVMNFTs: true         // Dual-VM NFT support
      },
      capabilities: {
        createCollections: ['ERC-721', 'Move'],
        mintNFTs: ['single', 'batch', 'gaming'],
        transferNFTs: ['ERC-721', 'Move'],
        upgradeNFTs: ['Move gaming features'],
        dualChain: true
      },
      version: '0.6.0' // Updated for Move NFT support
    };
  }

  /**
   * Close and cleanup
   */
  close() {
    this.walletManager.clearWallets();
    console.log('UmiAgentKit closed');
  }
}