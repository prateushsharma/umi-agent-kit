
import { UmiClient } from './client/UmiClient.js';
import { WalletManager } from './wallet/WalletManager.js';
import { TransferManager } from './transfer/TransferManager.js';
import { TokenManager } from './token/TokenManager.js';
import { NFTManager } from './nft/NFTManager.js';
import { ServerMultisigManager } from './multisig/ServerMultisigManager.js';
import { AIManager } from './ai/AIManager.js'; // NEW: AI Integration
import { validateConfig } from './config.js';
import { parseEther } from 'viem';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { MultiContractDeployer } from './deployment/MultiContractDeployer.js';
import { ERC1155Manager } from './erc1155/ERC1155Manager.js';
import { EmbeddedDeploymentEngine } from './deployment/EmbeddedDeploymentEngine.js';
import fs from 'fs/promises';
import path from 'path';
export class UmiAgentKit {
  constructor(config = {}) {
    // Set default config
    this.config = {
      network: 'devnet',
      multisigEnabled: true,
      aiEnabled: false, // NEW: AI is optional by default
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

    // Initialize multisig manager with server wallets
    if (this.config.multisigEnabled) {
      this.multisigManager = new ServerMultisigManager(this.client);
      console.log(`🔐 Multisig functionality enabled`);
    }

    // AI Manager will be initialized when enableAI() is called
    this.aiManager = null;

    // Add deployment manager
    //this.deploymentManager = new MultiContractDeployer(this); // removed - was causing BCS error
 this.embeddedEngine = new EmbeddedDeploymentEngine(this);
    this.erc1155Manager = new ERC1155Manager(this.client, this.client.chain);

    // NEW: Initialze embedded deployment engine
    this.embeddedEngine = new EmbeddedDeploymentEngine(this);

     console.log(`UmiAgentKit initialized on ${this.config.network} with Advance Features`);
  }

  // ====== NEW: AI INTEGRATION METHODS ======

  /**
   * Enable AI functionality with Groq integration
   */
  enableAI(aiConfig = {}) {
    try {
      // Validate AI configuration
      if (!aiConfig.groqApiKey && !aiConfig.apiKey) {
        throw new Error('Groq API key is required. Get one from https://console.groq.com/');
      }

      // Initialize AI Manager
      this.aiManager = new AIManager(this, {
        groqApiKey: aiConfig.groqApiKey || aiConfig.apiKey,
        ...aiConfig
      });

      // Mark AI as enabled
      this.config.aiEnabled = true;

      console.log('🤖 AI functionality enabled with Groq');
      
      return this.aiManager;

    } catch (error) {
      throw new Error(`Failed to enable AI: ${error.message}`);
    }
  }

  /**
   * Check if AI is enabled
   */
  isAIEnabled() {
    return this.config.aiEnabled && this.aiManager !== null;
  }

  /**
   * Chat with AI (requires AI to be enabled first)
   */
  async chat(message) {
    if (!this.isAIEnabled()) {
      throw new Error('AI not enabled. Call enableAI() first with your Groq API key.');
    }

    return await this.aiManager.chat(message);
  }

  /**
   * Configure AI settings
   */
  configureAI(preset = null, customConfig = {}) {
    if (!this.isAIEnabled()) {
      throw new Error('AI not enabled. Call enableAI() first.');
    }

    return this.aiManager.configureGroq(preset, customConfig);
  }

  /**
   * Get AI configuration and available options
   */
  getAIConfig() {
    if (!this.isAIEnabled()) {
      return {
        enabled: false,
        message: 'AI not enabled. Call enableAI() to get started.'
      };
    }

    return this.aiManager.getGroqConfig();
  }

  /**
   * Set AI context (useful for setting default wallet, etc.)
   */
  setAIContext(key, value) {
    if (!this.isAIEnabled()) {
      throw new Error('AI not enabled. Call enableAI() first.');
    }

    this.aiManager.setContext(key, value);
  }

  /**
   * Clear AI conversation history
   */
  clearAIHistory() {
    if (!this.isAIEnabled()) {
      throw new Error('AI not enabled. Call enableAI() first.');
    }

    this.aiManager.clearHistory();
  }

  /**
   * Setup AI for different scenarios
   */
  setupAIForGaming() {
    if (!this.isAIEnabled()) {
      throw new Error('AI not enabled. Call enableAI() first.');
    }

    this.aiManager.setupForGaming();
  }

  setupAIForProduction() {
    if (!this.isAIEnabled()) {
      throw new Error('AI not enabled. Call enableAI() first.');
    }

    this.aiManager.setupForProduction();
  }

  setupAIForQuickOps() {
    if (!this.isAIEnabled()) {
      throw new Error('AI not enabled. Call enableAI() first.');
    }

    this.aiManager.setupForQuickOps();
  }

  // ====== WALLET OPERATIONS ======

  /**
   * Create a new wallet
   */
  createWallet() {
    const wallet = this.walletManager.createWallet();
    
    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateWalletContext(this.getAllWallets());
    }
    
    return wallet;
  }

  /**
   * Import wallet from private key
   */
  importWallet(privateKey) {
    const wallet = this.walletManager.importWallet(privateKey);
    
    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateWalletContext(this.getAllWallets());
    }
    
    return wallet;
  }

  /**
   * Import wallet from mnemonic
   */
  importFromMnemonic(mnemonic, index = 0) {
    const wallet = this.walletManager.importFromMnemonic(mnemonic, index);
    
    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateWalletContext(this.getAllWallets());
    }
    
    return wallet;
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

    const result = await this.tokenManager.deployERC20Token({
      deployerPrivateKey: deployerWallet.exportPrivateKey(),
      name,
      symbol,
      decimals,
      initialSupply
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateContractContext('token', result.contractAddress, {
        name,
        symbol,
        type: 'ERC20'
      });
    }

    return result;
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
    const result = await this.tokenManager.deployERC20Token({
      deployerPrivateKey,
      name,
      symbol,
      decimals,
      initialSupply
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateContractContext('token', result.contractAddress, {
        name,
        symbol,
        type: 'ERC20'
      });
    }

    return result;
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

    const result = await this.tokenManager.deployMoveToken({
      deployerPrivateKey: deployerWallet.exportPrivateKey(),
      name,
      symbol,
      decimals,
      monitorSupply
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateContractContext('token', result.moduleAddress, {
        name,
        symbol,
        type: 'Move'
      });
    }

    return result;
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
    const result = await this.tokenManager.deployMoveToken({
      deployerPrivateKey,
      name,
      symbol,
      decimals,
      monitorSupply
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateContractContext('token', result.moduleAddress, {
        name,
        symbol,
        type: 'Move'
      });
    }

    return result;
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

    const result = await this.nftManager.deployNFTCollection({
      deployerPrivateKey: deployerWallet.exportPrivateKey(),
      name,
      symbol,
      baseURI,
      maxSupply,
      mintPrice
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateContractContext('nft', result.contractAddress, {
        name,
        symbol,
        type: 'ERC721'
      });
    }

    return result;
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
    const result = await this.nftManager.deployNFTCollection({
      deployerPrivateKey,
      name,
      symbol,
      baseURI,
      maxSupply,
      mintPrice
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateContractContext('nft', result.contractAddress, {
        name,
        symbol,
        type: 'ERC721'
      });
    }

    return result;
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

    const result = await this.nftManager.deployMoveNFTCollection({
      deployerPrivateKey: deployerWallet.exportPrivateKey(),
      name,
      symbol,
      description,
      maxSupply
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateContractContext('nft', result.moduleAddress, {
        name,
        symbol,
        type: 'MoveNFT'
      });
    }

    return result;
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
    const result = await this.nftManager.deployMoveNFTCollection({
      deployerPrivateKey,
      name,
      symbol,
      description,
      maxSupply
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateContractContext('nft', result.moduleAddress, {
        name,
        symbol,
        type: 'MoveNFT'
      });
    }

    return result;
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

    const result = await this.nftManager.deployGamingMoveNFTCollection({
      deployerPrivateKey: deployerWallet.exportPrivateKey(),
      name,
      symbol,
      categories
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateContractContext('nft', result.moduleAddress, {
        name,
        symbol,
        type: 'GamingMoveNFT'
      });
    }

    return result;
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
    
    const result = {
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

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateContractContext('nft', result.contractAddress, {
        name,
        symbol,
        type: 'GamingNFT'
      });
    }

    return result;
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

  // ====== MULTISIG OPERATIONS ======

  /**
   * Register wallets for multisig use
   */
  registerMultisigWallets(wallets) {
    if (!this.multisigManager) {
      throw new Error('Multisig not enabled. Set multisigEnabled: true in config.');
    }

    // Convert wallet objects to the format needed by multisig
    const serverWallets = {};
    
    if (Array.isArray(wallets)) {
      // Array of wallet objects
      wallets.forEach((wallet, index) => {
        const name = `wallet_${index + 1}`;
        serverWallets[name] = wallet;
      });
    } else if (typeof wallets === 'object') {
      // Object with named wallets
      Object.entries(wallets).forEach(([name, wallet]) => {
        serverWallets[name] = wallet;
      });
    }

    // Update multisig manager with server wallets
    this.multisigManager.serverWallets = { ...this.multisigManager.serverWallets, ...serverWallets };
    
    console.log(`🔐 Registered ${Object.keys(serverWallets).length} wallets for multisig`);
    console.log(`👥 Available wallets: ${Object.keys(serverWallets).join(', ')}`);
    
    return Object.keys(serverWallets);
  }

  /**
   * Create a basic multisig group
   */
  async createMultisigGroup({
    name,
    description = "",
    members, // Array of wallet names or {walletName, role, weight}
    threshold = 2,
    rules = {},
    notifications = true
  }) {
    if (!this.multisigManager) {
      throw new Error('Multisig not enabled');
    }

    const result = await this.multisigManager.createMultisigGroup({
      name,
      description,
      members,
      threshold,
      rules,
      notifications
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateMultisigContext(result);
    }

    return result;
  }

  /**
   * Create a gaming studio multisig with predefined gaming roles
   */
  async createGamingStudioMultisig({
    studioName,
    teamWallets, // {developer1: wallet, artist1: wallet, ceo: wallet}
    studioRules = {}
  }) {
    if (!this.multisigManager) {
      throw new Error('Multisig not enabled');
    }

    const result = await this.multisigManager.createGamingStudioMultisig({
      studioName,
      teamWallets,
      studioRules
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.setGamingStudioContext({ 
        studioName, 
        studioMultisig: result 
      });
    }

    return result;
  }

  /**
   * Create a guild treasury multisig
   */
  async createGuildMultisig({
    guildName,
    officers, // {leader: wallet, officer1: wallet}
    members = {}, // {member1: wallet, member2: wallet}
    guildRules = {}
  }) {
    if (!this.multisigManager) {
      throw new Error('Multisig not enabled');
    }

    const result = await this.multisigManager.createGuildMultisig({
      guildName,
      officers,
      members,
      guildRules
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateMultisigContext(result);
    }

    return result;
  }

  /**
   * Propose a transaction requiring multisig approval
   */
  async proposeTransaction({
    multisigId,
    proposerWalletName,
    operation, // 'createToken', 'mintNFT', 'transferETH', etc.
    params,
    description = "",
    urgency = 'normal' // 'low', 'normal', 'high', 'emergency'
  }) {
    if (!this.multisigManager) {
      throw new Error('Multisig not enabled');
    }

    return await this.multisigManager.proposeTransaction({
      multisigId,
      proposerWalletName,
      operation,
      params,
      description,
      urgency
    });
  }

  /**
   * Approve or reject a proposal
   */
  async approveProposal({
    proposalId,
    approverWalletName,
    decision = 'approve', // 'approve', 'reject'
    comment = ""
  }) {
    if (!this.multisigManager) {
      throw new Error('Multisig not enabled');
    }

    return await this.multisigManager.approveProposal({
      proposalId,
      approverWalletName,
      decision,
      comment
    });
  }

  /**
   * Execute an approved proposal
   */
  async executeProposal(proposalId) {
    if (!this.multisigManager) {
      throw new Error('Multisig not enabled');
    }

    return await this.multisigManager.executeProposal(proposalId);
  }

  /**
   * Get multisig group information
   */
  getMultisigGroup(multisigId) {
    if (!this.multisigManager) {
      throw new Error('Multisig not enabled');
    }

    return this.multisigManager.getMultisigGroup(multisigId);
  }

  /**
   * Get all multisig groups
   */
  getAllMultisigGroups() {
    if (!this.multisigManager) {
      throw new Error('Multisig not enabled');
    }

    return this.multisigManager.getAllMultisigGroups();
  }

  /**
   * Get pending proposals for a multisig group
   */
  async getPendingProposals(multisigId) {
    if (!this.multisigManager) {
      throw new Error('Multisig not enabled');
    }

    return await this.multisigManager.getPendingProposals(multisigId);
  }

  /**
   * Get proposals requiring action from a specific wallet
   */
  async getProposalsRequiringAction(walletName) {
    if (!this.multisigManager) {
      throw new Error('Multisig not enabled');
    }

    return await this.multisigManager.proposalEngine.getProposalsRequiringAction(walletName);
  }

  // ====== GAMING-SPECIFIC MULTISIG HELPERS ======

  /**
   * Quick proposal for token creation (gaming studios)
   */
  async proposeTokenCreation({
    multisigId,
    proposerWalletName,
    tokenName,
    tokenSymbol,
    initialSupply,
    description = `Create ${tokenName} token for the game`
  }) {
    return await this.proposeTransaction({
      multisigId,
      proposerWalletName,
      operation: 'createERC20Token',
      params: {
        name: tokenName,
        symbol: tokenSymbol,
        initialSupply,
        decimals: 18
      },
      description
    });
  }

  /**
   * Quick proposal for NFT collection creation
   */
  async proposeNFTCollection({
    multisigId,
    proposerWalletName,
    collectionName,
    collectionSymbol,
    maxSupply = 10000,
    description = `Create ${collectionName} NFT collection`
  }) {
    return await this.proposeTransaction({
      multisigId,
      proposerWalletName,
      operation: 'createNFTCollection',
      params: {
        name: collectionName,
        symbol: collectionSymbol,
        maxSupply,
        baseURI: ""
      },
      description
    });
  }

  /**
   * Quick proposal for batch player rewards
   */
  async proposeBatchRewards({
    multisigId,
    proposerWalletName,
    rewards, // Array of {recipient, type, amount, tokenAddress?, etc}
    description = "Distribute batch rewards to players"
  }) {
    return await this.proposeTransaction({
      multisigId,
      proposerWalletName,
      operation: 'batchPlayerRewards',
      params: {
        rewards
      },
      description
    });
  }

  /**
   * Quick proposal for large ETH transfer
   */
  async proposeLargeTransfer({
    multisigId,
    proposerWalletName,
    to,
    amount,
    description = `Transfer ${amount} ETH to ${to}`
  }) {
    return await this.proposeTransaction({
      multisigId,
      proposerWalletName,
      operation: 'transferETH',
      params: {
        to,
        amount
      },
      description,
      urgency: 'high'
    });
  }

  // ====== MULTISIG INTEGRATION EXAMPLES ======

  /**
   * Example: Setup complete gaming studio with multisig
   */
  async setupGamingStudio({
    studioName,
    teamMembers, // {dev1: privateKey, artist1: privateKey, ceo: privateKey}
    initialTokens = [],
    initialNFTCollections = []
  }) {
    console.log(`🎮 Setting up gaming studio: ${studioName}`);

    // 1. Import all team wallets
    const teamWallets = {};
    for (const [memberName, privateKey] of Object.entries(teamMembers)) {
      teamWallets[memberName] = this.importWallet(privateKey);
      console.log(`👤 Imported wallet for ${memberName}: ${teamWallets[memberName].getAddress()}`);
    }

    // 2. Register wallets for multisig
    this.registerMultisigWallets(teamWallets);

    // 3. Create gaming studio multisig
    const studioMultisig = await this.createGamingStudioMultisig({
      studioName,
      teamWallets
    });

    console.log(`🔐 Created studio multisig: ${studioMultisig.id}`);

    // 4. Propose initial tokens if specified
    const proposals = [];
    for (const token of initialTokens) {
      const proposal = await this.proposeTokenCreation({
        multisigId: studioMultisig.id,
        proposerWalletName: Object.keys(teamWallets)[0], // Use first team member as proposer
        tokenName: token.name,
        tokenSymbol: token.symbol,
        initialSupply: token.supply,
        description: `Initial ${token.name} token for ${studioName}`
      });
      proposals.push(proposal);
    }

    // 5. Propose initial NFT collections if specified
    for (const collection of initialNFTCollections) {
      const proposal = await this.proposeNFTCollection({
        multisigId: studioMultisig.id,
        proposerWalletName: Object.keys(teamWallets)[0],
        collectionName: collection.name,
        collectionSymbol: collection.symbol,
        maxSupply: collection.maxSupply,
        description: `Initial ${collection.name} NFT collection for ${studioName}`
      });
      proposals.push(proposal);
    }

    console.log(`✅ Gaming studio setup complete!`);
    console.log(`🔐 Multisig ID: ${studioMultisig.id}`);
    console.log(`📝 Created ${proposals.length} initial proposals`);

    const result = {
      studioMultisig,
      teamWallets,
      proposals,
      studioName
    };

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.setGamingStudioContext(result);
    }

    return result;
  }

  // ====== UTILITY METHODS ======

  /**
   * Get enhanced summary including multisig and AI information
   */
  async getSummary() {
    const networkInfo = this.getNetworkInfo();
    const walletCount = this.walletManager.getWalletCount();
    const totalBalance = walletCount > 0 ? await this.getTotalBalance() : '0';

    const summary = {
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
        dualVMNFTs: true,        // Dual-VM NFT support
        serverMultisig: this.config.multisigEnabled, // Multisig
        aiIntegration: this.config.aiEnabled // NEW: AI
      },
      capabilities: {
        createCollections: ['ERC-721', 'Move'],
        mintNFTs: ['single', 'batch', 'gaming'],
        transferNFTs: ['ERC-721', 'Move'],
        upgradeNFTs: ['Move gaming features'],
        dualChain: true,
        multisigOperations: this.config.multisigEnabled ? [
          'gaming studios', 'guild treasuries', 'proposal workflows', 
          'role-based permissions', 'batch operations'
        ] : [],
        aiFeatures: this.config.aiEnabled ? [ // NEW: AI capabilities
          'natural language queries', 'balance checking', 'wallet management',
          'transaction assistance', 'context awareness', 'conversation memory'
        ] : []
      },
      version: '1.0.0' // Updated for AI support
    };

    // Add multisig summary if enabled
    if (this.config.multisigEnabled && this.multisigManager) {
      const multisigGroups = this.getAllMultisigGroups();
      summary.multisig = {
        enabled: true,
        groupCount: multisigGroups.length,
        registeredWallets: Object.keys(this.multisigManager.serverWallets).length,
        groups: multisigGroups.map(group => ({
          id: group.id,
          name: group.name,
          memberCount: group.members.length,
          status: group.status
        }))
      };
    } else {
      summary.multisig = {
        enabled: false,
        message: 'Enable with multisigEnabled: true in config'
      };
    }

    // Add AI summary if enabled
    if (this.config.aiEnabled && this.aiManager) {
      const aiConfig = this.aiManager.getGroqConfig();
      summary.ai = {
        enabled: true,
        model: aiConfig.current.model,
        temperature: aiConfig.current.temperature,
        conversationLength: this.aiManager.getConversationHistory().length,
        availableModels: Object.keys(aiConfig.availableModels),
        presets: Object.keys(aiConfig.presets)
      };
    } else {
      summary.ai = {
        enabled: false,
        message: 'Enable with enableAI({ groqApiKey: "your-key" })'
      };
    }

    return summary;
  }

  /**
   * Close and cleanup
   */
  
  /**
   * Clean up embedded workspace - FIXED
   */
  async cleanup() {
    if (this.embeddedEngine) {
      await this.embeddedEngine.cleanup();
    }
  }
  close() {
    this.walletManager.clearWallets();
    if (this.multisigManager) {
      console.log('🔐 Multisig manager cleaned up');
    }
    if (this.aiManager) {
      console.log('🤖 AI manager cleaned up');
    }
    console.log('UmiAgentKit closed');
  }

  // ======== Deployment Setup ========
  /**
 * Deploy contracts without constructor values
 * Constructor values will be set later via setConstructorValues()
 */
/**
   * Scan contracts folder for .move and .sol files - FIXED
   */
   async scanContractsFolder(contractsPath) {
    try {
      // Use fs directly since it's imported at the top
      const files = await fs.readdir(contractsPath);
      const contracts = [];
      
      for (const file of files) {
        if (file.endsWith('.move') || file.endsWith('.sol')) {
          const filePath = path.join(contractsPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          contracts.push({
            name: file.replace(/\.(move|sol)$/, ''),
            fileName: file,
            content,
            path: filePath
          });
        }
      }
      
      if (contracts.length === 0) {
        throw new Error(`No .move or .sol files found in ${contractsPath}`);
      }
      
      return contracts;
      
    } catch (error) {
      throw new Error(`Failed to scan contracts folder: ${error.message}`);
    }
  }

 /**
   * Deploy contracts using embedded official Umi toolchain
   * Automatically detects Move vs Solidity contracts
   */
 async deployContracts(contractsPath, deployerWallet, options = {}) {
    try {
      console.log(`🚀 Starting embedded deployment from: ${contractsPath}`);
      
      // Scan contracts folder using local method (has fs import)
      const contracts = await this.scanContractsFolder(contractsPath);
      console.log(`📁 Found ${contracts.length} contract(s): ${contracts.map(c => c.name).join(', ')}`);
      
      // Deploy using embedded engine
      const results = await this.embeddedEngine.deployMultipleContracts(contracts, deployerWallet);
      
      // Generate deployment summary
      this.logDeploymentSummary(results);
      
      return results;
      
    } catch (error) {
      throw new Error(`Embedded deployment failed: ${error.message}`);
    }
  }


 /**
   * Log deployment summary - FIXED
   */
  /**
   * Log deployment summary
   */
  logDeploymentSummary(results) {
    console.log('\n📊 EMBEDDED DEPLOYMENT SUMMARY:');
    
    const successful = Object.entries(results).filter(([_, result]) => !result.error);
    const failed = Object.entries(results).filter(([_, result]) => result.error);
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log('\n🎉 Successfully deployed:');
      successful.forEach(([name, result]) => {
        console.log(`  - ${name} (${result.type}): ${result.address}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n💥 Failed deployments:');
      failed.forEach(([name, result]) => {
        console.log(`  - ${name}: ${result.error}`);
      });
    }
  }

async setConstructorValues(contractAddress, constructorArgs, callerWallet) {
  try {
    console.log(`⚙️ Setting constructor values for contract: ${contractAddress}`);
    
    const result = await this.deploymentManager.setConstructorValues(
      contractAddress,
      constructorArgs,
      callerWallet
    );
    
    console.log(`✅ Constructor values set successfully!`);
    return result;

  } catch (error) {
    throw new Error(`Set constructor values failed: ${error.message}`);
  }
}
// ====== OPTION 2: DEPLOY WITH DEPLOYMENT.JSON ======

/**
 * Deploy contracts using deployment.json configuration file
 * Looks for deployment.json in contractsPath or uses provided configFile
 */
/**
   * Deploy with JSON configuration (enhanced with embedded engine)
   */
   /**
   * Load deployment configuration from JSON - FIXED
   */
   async loadDeploymentConfig(configPath) {
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      if (!config.contracts) {
        throw new Error('Invalid deployment.json: missing "contracts" section');
      }
      
      return config;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Deployment config not found: ${configPath}`);
      }
      throw new Error(`Failed to load deployment config: ${error.message}`);
    }
  }
 /**
   * Resolve @ContractName references in configuration - FIXED
   */
 async resolveConfigArgs(configArgs, deployedContracts) {
    const resolved = {};
    
    for (const [key, value] of Object.entries(configArgs)) {
      if (typeof value === 'string' && value.startsWith('@')) {
        const contractName = value.substring(1);
        if (deployedContracts[contractName]) {
          resolved[key] = deployedContracts[contractName].address;
        } else {
          throw new Error(`Referenced contract "${contractName}" not found in deployed contracts`);
        }
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }
 /**
   * Deploy with JSON configuration - NEW METHOD
   */
  async deployWithJson(contractsPath, deployerWallet, configFile = null) {
    try {
      console.log(`🚀 Starting JSON-configured deployment...`);
      
      // Load configuration using fs import
      const configPath = configFile || path.join(contractsPath, 'deployment.json');
      const config = await this.loadDeploymentConfig(configPath);
      
      // Scan contracts using local method
      const contracts = await this.scanContractsFolder(contractsPath);
      
      // Deploy in dependency order
      const results = {};
      const deploymentOrder = config.deploymentOrder || Object.keys(config.contracts);
      
      for (const contractName of deploymentOrder) {
        const contractConfig = config.contracts[contractName];
        const contract = contracts.find(c => c.name === contractName);
        
        if (!contract) {
          throw new Error(`Contract ${contractName} not found in ${contractsPath}`);
        }
        
        console.log(`🚀 Deploying ${contractName} with config...`);
        
        // Resolve constructor arguments
        const resolvedArgs = await this.resolveConfigArgs(contractConfig.constructorParams || {}, results);
        
        // Deploy using embedded engine
        let result;
        if (contract.content.includes('module ')) {
          result = await this.embeddedEngine.deployMoveContract(contract, deployerWallet, resolvedArgs);
        } else {
          result = await this.embeddedEngine.deploySolidityContract(contract, deployerWallet, resolvedArgs);
        }
        
        results[contractName] = result;
        console.log(`✅ ${contractName} deployed: ${result.address}`);
      }
      
      console.log(`🎉 JSON deployment complete! ${Object.keys(results).length} contract(s) deployed.`);
      return results;
      
    } catch (error) {
      throw new Error(`JSON deployment failed: ${error.message}`);
    }
  }


/**
   * Deploy with configuration object - NEW METHOD
   */
  /**
   * Deploy with configuration object
   */
  async deployWithConfig(contractsPath, deployerWallet, configObject = {}) {
    try {
      console.log(`🚀 Starting config object deployment...`);
      
      // Scan contracts using local method
      const contracts = await this.scanContractsFolder(contractsPath);
      
      // Deploy contracts with configuration
      const results = {};
      for (const contract of contracts) {
        const contractConfig = configObject[contract.name] || {};
        
        console.log(`🚀 Deploying ${contract.name} with config object...`);
        
        // Resolve references in config
        const resolvedArgs = await this.resolveConfigArgs(contractConfig, results);
        
        // Deploy using embedded engine
        let result;
        if (contract.content.includes('module ')) {
          result = await this.embeddedEngine.deployMoveContract(contract, deployerWallet, resolvedArgs);
        } else {
          result = await this.embeddedEngine.deploySolidityContract(contract, deployerWallet, resolvedArgs);
        }
        
        results[contract.name] = result;
        console.log(`✅ ${contract.name} deployed: ${result.address}`);
      }
      
      console.log(`🎉 Config deployment complete! ${Object.keys(results).length} contract(s) deployed.`);
      return results;
      
    } catch (error) {
      throw new Error(`Config deployment failed: ${error.message}`);
    }
  }


// ====== ADDITIONAL DEPLOYMENT UTILITIES ======
// FIXED: Enhanced existing deployWithConstructor method
async deployWithConstructor(contract, deployerWallet, constructorArgs) {
  try {
    // Check if this is a Move contract
    if (contract.content && contract.content.includes('module ') && contract.content.includes('::')) {
      // Deploy Move module first
      const moduleResult = await this.deployModuleOnly(contract, deployerWallet);
      
      // Then initialize with constructor args (Move init function)
      if (Object.keys(constructorArgs).length > 0) {
        const initResult = await this.initializeContract(
          moduleResult.address,
          constructorArgs,
          deployerWallet
        );
        
        return {
          ...moduleResult,
          initialized: true,
          initHash: initResult.hash
        };
      }
      
      return moduleResult;
      
    } else {
      // Handle Solidity contracts (existing logic)
      return await this.deployEVMContract(contract, deployerWallet, constructorArgs);
    }
    
  } catch (error) {
    throw new Error(`Contract deployment with constructor failed: ${error.message}`);
  }
}

 /**
   * Deploy a single contract - NEW METHOD
   */
   async deploySingleContract(contractPath, deployerWallet, constructorArgs = {}) {
    try {
      console.log(`🚀 Deploying single contract: ${contractPath}`);
      
      // Read contract file using fs import
      const contractContent = await fs.readFile(contractPath, 'utf8');
      const contractName = path.basename(contractPath).replace(/\.(move|sol)$/, '');
      
      const contract = {
        name: contractName,
        content: contractContent,
        path: contractPath
      };
      
      // Deploy based on contract type using embedded engine
      let result;
      if (contract.content.includes('module ')) {
        result = await this.embeddedEngine.deployMoveContract(contract, deployerWallet, constructorArgs);
      } else {
        result = await this.embeddedEngine.deploySolidityContract(contract, deployerWallet, constructorArgs);
      }
      
      console.log(`✅ Contract deployed successfully!`);
      return result;
      
    } catch (error) {
      throw new Error(`Single contract deployment failed: ${error.message}`);
    }
  }
/**
 * Get contract functions after deployment
 * Returns list of available functions for a deployed contract
 */
getContractFunctions(deployedContract) {
  return this.deploymentManager.getContractFunctions(deployedContract);
}

/**
 * Call a function on a deployed contract
 * Generic method to call any function on any deployed Move contract
 */
async callContractFunction(contractAddress, functionName, args, callerWallet) {
  try {
    console.log(`📞 Calling function ${functionName} on ${contractAddress}`);
    
    const result = await this.deploymentManager.callContractFunction(
      contractAddress,
      functionName,
      args,
      callerWallet
    );
    
    console.log(`✅ Function call successful: ${result.hash}`);
    return result;

  } catch (error) {
    throw new Error(`Contract function call failed: ${error.message}`);
  }
}

/**
 * Get deployment summary
 * Returns summary information about deployed contracts
 */
getDeploymentSummary(deployedContracts) {
  return this.deploymentManager.getDeploymentSummary(deployedContracts);
}

 /**
   * Export deployment results to file - FIXED
   */
  async exportDeploymentResults(deployedContracts, outputPath = './deployment-results.json') {
    const exportData = {
      timestamp: new Date().toISOString(),
      network: this.config.network,
      summary: {
        totalContracts: Object.keys(deployedContracts).length,
        successful: Object.values(deployedContracts).filter(c => !c.error).length,
        failed: Object.values(deployedContracts).filter(c => c.error).length
      },
      contracts: deployedContracts
    };
    
    await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`📄 Deployment results exported to: ${outputPath}`);
  }


/**
 * Validate contracts before deployment
 * Check contracts for basic syntax and structure issues
 */
async validateContracts(contractsPath) {
  try {
    const contracts = await this.deploymentManager.scanContractsFolder(contractsPath);
    await this.deploymentManager.validateContracts(contracts);
    
    console.log(`✅ All contracts validated successfully`);
    return true;

  } catch (error) {
    throw new Error(`Contract validation failed: ${error.message}`);
  }
}
/**
 * Create ERC1155 multi-token contract using OpenZeppelin
 */
async createERC1155Contract(deployerWallet, name, baseURI = "") {
    if (!deployerWallet) {
      throw new Error('Deployer wallet is required');
    }

    const result = await this.erc1155Manager.deployERC1155Contract({
      deployerPrivateKey: deployerWallet.exportPrivateKey(),
      name,
      baseURI
    });

    // Update AI context if AI is enabled
    if (this.isAIEnabled()) {
      this.aiManager.contextManager.updateContractContext('erc1155', result.contractAddress, {
        name,
        type: 'ERC1155'
      });
    }

    return result;
  }
/**
 * Create ERC1155 token type
 */
 async createERC1155Token(ownerWallet, contractAddress, abi, metadataURI, maxSupply, mintPrice = "0") {
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    return await this.erc1155Manager.createTokenType({
      ownerPrivateKey: ownerWallet.exportPrivateKey(),
      contractAddress,
      metadataURI,
      maxSupply,
      mintPrice
    });
  }
 /**
   * Admin mint ERC1155 tokens (owner only, no payment)
   */
  async adminMintERC1155(ownerWallet, contractAddress, abi, toAddress, tokenId, amount) {
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    return await this.erc1155Manager.adminMintERC1155({
      ownerPrivateKey: ownerWallet.exportPrivateKey(),
      contractAddress,
      toAddress,
      tokenId,
      amount
    });
  }
/**
 * Mint ERC1155 tokens to address
 */
 async mintERC1155(wallet, contractAddress, abi, toAddress, tokenId, amount, payment = "0") {
    if (!wallet) {
      throw new Error('Wallet is required');
    }

    return await this.erc1155Manager.mintERC1155({
      fromPrivateKey: wallet.exportPrivateKey(),
      contractAddress,
      toAddress,
      tokenId,
      amount,
      payment
    });
  }
/**
 * Batch mint multiple ERC1155 token types
 */
 async batchMintERC1155(wallet, contractAddress, abi, toAddress, tokenIds, amounts, totalPayment = "0") {
    if (!wallet) {
      throw new Error('Wallet is required');
    }

    return await this.erc1155Manager.batchMintERC1155({
      fromPrivateKey: wallet.exportPrivateKey(),
      contractAddress,
      toAddress,
      tokenIds,
      amounts,
      totalPayment
    });
  }

/**
 * Transfer ERC1155 tokens between addresses
 */
 async transferERC1155(wallet, contractAddress, abi, toAddress, tokenId, amount) {
    if (!wallet) {
      throw new Error('Wallet is required');
    }

    return await this.erc1155Manager.transferERC1155({
      fromPrivateKey: wallet.exportPrivateKey(),
      contractAddress,
      toAddress,
      tokenId,
      amount
    });
  }

/**
 * Batch transfer multiple ERC1155 token types
 */
 async batchTransferERC1155(wallet, contractAddress, abi, toAddress, tokenIds, amounts) {
    if (!wallet) {
      throw new Error('Wallet is required');
    }

    return await this.erc1155Manager.batchTransferERC1155({
      fromPrivateKey: wallet.exportPrivateKey(),
      contractAddress,
      toAddress,
      tokenIds,
      amounts
    });
  }

/**
 * Get ERC1155 token balance for address
 */
async getERC1155Balance(contractAddress, abi, ownerAddress, tokenId) {
    return await this.erc1155Manager.getERC1155Balance(contractAddress, ownerAddress, tokenId);
  }

async getERC1155OwnedTokens(contractAddress, abi, ownerAddress) {
    return await this.erc1155Manager.getOwnedTokens(contractAddress, ownerAddress);
  }
/**
 * Set approval for all ERC1155 tokens
 */
async setERC1155ApprovalForAll(wallet, contractAddress, abi, operatorAddress, approved) {
    if (!wallet) {
      throw new Error('Wallet is required');
    }

    return await this.erc1155Manager.setApprovalForAll({
      ownerPrivateKey: wallet.exportPrivateKey(),
      contractAddress,
      operatorAddress,
      approved
    });
  }
/**
 * Check if address is approved for all ERC1155 tokens
 */
 async isERC1155ApprovedForAll(contractAddress, abi, ownerAddress, operatorAddress) {
    return await this.erc1155Manager.isApprovedForAll(contractAddress, ownerAddress, operatorAddress);
  }
/**
 * Get ERC1155 token URI/metadata
 */
 async getERC1155TokenURI(contractAddress, abi, tokenId) {
    return await this.erc1155Manager.getTokenURI(contractAddress, tokenId);
  }
/**
 * Admin mint ERC1155 (owner only, no payment required)
 */
async adminMintERC1155(wallet, contractAddress, abi, toAddress, tokenId, amount) {
  console.log(`👑 Admin minting ERC1155: ${amount} of token ${tokenId} to ${toAddress}`);
  return await this.erc1155.adminMintERC1155(wallet, contractAddress, abi, toAddress, tokenId, amount);
}
/**
 * Admin batch mint ERC1155 (owner only)
 */
async adminBatchMintERC1155(wallet, contractAddress, abi, toAddress, tokenIds, amounts) {
  console.log(`👑 Admin batch minting ERC1155 to ${toAddress}`);
  return await this.erc1155.adminBatchMintERC1155(wallet, contractAddress, abi, toAddress, tokenIds, amounts);
}

/**
 * Pause ERC1155 contract (owner only)
 */
 async pauseERC1155Contract(ownerWallet, contractAddress, abi) {
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    return await this.erc1155Manager.pauseContract({
      ownerPrivateKey: ownerWallet.exportPrivateKey(),
      contractAddress
    });
  }
/**
 * Unpause ERC1155 contract (owner only)
 */
async unpauseERC1155Contract(ownerWallet, contractAddress, abi) {
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    return await this.erc1155Manager.unpauseContract({
      ownerPrivateKey: ownerWallet.exportPrivateKey(),
      contractAddress
    });
  }
/**
 * Withdraw funds from ERC1155 contract (owner only)
 */
async withdrawERC1155Funds(wallet, contractAddress, abi) {
  console.log(`💸 Withdrawing funds from ERC1155 contract`);
  return await this.erc1155.withdrawERC1155Funds(wallet, contractAddress, abi);
}
/**
 * Get all ERC1155 tokens owned by address
 */
async getERC1155OwnedTokens(contractAddress, abi, ownerAddress) {
  console.log(`📦 Getting all ERC1155 tokens for ${ownerAddress}`);
  return await this.erc1155.getERC1155OwnedTokens(contractAddress, abi, ownerAddress);
}
 async withdrawERC1155Funds(ownerWallet, contractAddress, abi) {
    if (!ownerWallet) {
      throw new Error('Owner wallet is required');
    }

    return await this.erc1155Manager.withdrawFunds({
      ownerPrivateKey: ownerWallet.exportPrivateKey(),
      contractAddress
    });
  }
}