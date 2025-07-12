/**
 * Manages conversation context, user preferences, and AI memory
 */

export class ContextManager {
  constructor() {
    this.context = {
      // User preferences
      defaultWallet: null,
      preferredNetwork: null,
      userRole: null, // 'developer', 'artist', 'ceo', 'gamer', etc.
      
      // Recent operations
      lastTransaction: null,
      lastContractAddress: null,
      lastTokenAddress: null,
      lastNFTCollection: null,
      activeMultisig: null,
      
      // Session data
      walletAddresses: [],
      contractAddresses: {},
      multisigGroups: [],
      
      // Conversation flow
      currentOperation: null,
      pendingApprovals: [],
      
      // Gaming context
      gamingStudio: null,
      activeProject: null
    };
    
    this.messageHistory = [];
    this.maxHistoryLength = 50;
    
    console.log('🧠 Context manager initialized');
  }

  /**
   * Add a message to conversation history
   */
  addMessage(role, content, metadata = {}) {
    const message = {
      role, // 'user' or 'assistant'
      content,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    this.messageHistory.push(message);
    
    // Extract context from messages
    this._extractContextFromMessage(message);
    
    // Keep history manageable
    if (this.messageHistory.length > this.maxHistoryLength) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistoryLength);
    }
  }

  /**
   * Set a context value
   */
  setContextValue(key, value) {
    this.context[key] = value;
    console.log(`📝 Context updated: ${key}`);
  }

  /**
   * Get a context value
   */
  getContextValue(key) {
    return this.context[key];
  }

  /**
   * Get full context
   */
  getContext() {
    return { ...this.context };
  }

  /**
   * Update wallet context when wallets change
   */
  updateWalletContext(wallets) {
    this.context.walletAddresses = wallets.map(w => w.getAddress());
    
    // Set default wallet if none set
    if (!this.context.defaultWallet && wallets.length > 0) {
      this.context.defaultWallet = wallets[0].getAddress();
    }
  }

  /**
   * Update contract context when contracts are deployed
   */
  updateContractContext(type, address, metadata = {}) {
    if (!this.context.contractAddresses[type]) {
      this.context.contractAddresses[type] = [];
    }
    
    this.context.contractAddresses[type].push({
      address,
      deployedAt: new Date().toISOString(),
      ...metadata
    });
    
    // Update specific context based on type
    switch (type) {
      case 'token':
        this.context.lastTokenAddress = address;
        break;
      case 'nft':
        this.context.lastNFTCollection = address;
        break;
      default:
        this.context.lastContractAddress = address;
    }
  }

  /**
   * Update multisig context
   */
  updateMultisigContext(multisigGroup) {
    this.context.multisigGroups.push({
      id: multisigGroup.id,
      name: multisigGroup.name,
      members: multisigGroup.members.length,
      createdAt: new Date().toISOString()
    });
    
    this.context.activeMultisig = multisigGroup.id;
  }

  /**
   * Set gaming studio context
   */
  setGamingStudioContext(studioData) {
    this.context.gamingStudio = {
      name: studioData.studioName,
      multisigId: studioData.studioMultisig?.id,
      teamSize: Object.keys(studioData.teamWallets || {}).length,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Get contextual suggestions for the AI
   */
  getContextualSuggestions() {
    const suggestions = [];
    
    // Wallet-based suggestions
    if (this.context.walletAddresses.length === 0) {
      suggestions.push('Consider creating or importing a wallet to get started');
    }
    
    // Contract-based suggestions
    if (this.context.lastTokenAddress) {
      suggestions.push(`You recently deployed a token at ${this.context.lastTokenAddress}`);
    }
    
    if (this.context.lastNFTCollection) {
      suggestions.push(`You have an NFT collection at ${this.context.lastNFTCollection}`);
    }
    
    // Multisig suggestions
    if (this.context.pendingApprovals.length > 0) {
      suggestions.push(`You have ${this.context.pendingApprovals.length} pending proposals to review`);
    }
    
    // Gaming suggestions
    if (this.context.gamingStudio) {
      suggestions.push(`Working with ${this.context.gamingStudio.name} studio`);
    }
    
    return suggestions;
  }

  /**
   * Clear all context
   */
  clearContext() {
    this.context = {
      defaultWallet: null,
      preferredNetwork: null,
      userRole: null,
      lastTransaction: null,
      lastContractAddress: null,
      lastTokenAddress: null,
      lastNFTCollection: null,
      activeMultisig: null,
      walletAddresses: [],
      contractAddresses: {},
      multisigGroups: [],
      currentOperation: null,
      pendingApprovals: [],
      gamingStudio: null,
      activeProject: null
    };
    
    this.messageHistory = [];
    console.log('🗑️ Context cleared');
  }

  /**
   * Export context for persistence
   */
  exportContext() {
    return {
      context: this.context,
      messageHistory: this.messageHistory.slice(-10), // Last 10 messages only
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import context from exported data
   */
  importContext(exportedData) {
    if (exportedData.context) {
      this.context = { ...this.context, ...exportedData.context };
    }
    
    if (exportedData.messageHistory) {
      this.messageHistory = [...this.messageHistory, ...exportedData.messageHistory];
    }
    
    console.log('📥 Context imported');
  }

  /**
   * Get conversation summary for AI context
   */
  getConversationSummary() {
    const recentMessages = this.messageHistory.slice(-5);
    const summary = {
      recentTopics: this._extractTopics(recentMessages),
      userPreferences: {
        defaultWallet: this.context.defaultWallet,
        userRole: this.context.userRole,
        preferredNetwork: this.context.preferredNetwork
      },
      activeContext: {
        hasWallets: this.context.walletAddresses.length > 0,
        hasContracts: Object.keys(this.context.contractAddresses).length > 0,
        hasMultisig: this.context.multisigGroups.length > 0,
        inGamingStudio: !!this.context.gamingStudio
      }
    };
    
    return summary;
  }

  // Private methods

  /**
   * Extract context information from messages
   */
  _extractContextFromMessage(message) {
    const content = message.content.toLowerCase();
    
    // Extract wallet addresses mentioned
    const addressMatches = message.content.match(/0x[a-fA-F0-9]{40}/g);
    if (addressMatches) {
      addressMatches.forEach(address => {
        if (!this.context.walletAddresses.includes(address)) {
          this.context.walletAddresses.push(address);
        }
      });
    }
    
    // Extract transaction hashes
    const txMatches = message.content.match(/0x[a-fA-F0-9]{64}/g);
    if (txMatches) {
      this.context.lastTransaction = txMatches[0];
    }
    
    // Detect user role from conversation
    if (content.includes('game') || content.includes('gaming') || content.includes('studio')) {
      if (!this.context.userRole) {
        this.context.userRole = 'gamer';
      }
    }
    
    if (content.includes('develop') || content.includes('deploy') || content.includes('contract')) {
      if (!this.context.userRole) {
        this.context.userRole = 'developer';
      }
    }
    
    // Detect current operations
    if (content.includes('proposal') || content.includes('approve') || content.includes('multisig')) {
      this.context.currentOperation = 'multisig';
    }
    
    if (content.includes('token') && (content.includes('create') || content.includes('deploy'))) {
      this.context.currentOperation = 'token_creation';
    }
    
    if (content.includes('nft') && (content.includes('create') || content.includes('mint'))) {
      this.context.currentOperation = 'nft_operations';
    }
  }

  /**
   * Extract topics from recent messages
   */
  _extractTopics(messages) {
    const topics = new Set();
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      if (content.includes('balance') || content.includes('wallet')) {
        topics.add('wallet_management');
      }
      
      if (content.includes('token') || content.includes('erc20')) {
        topics.add('token_operations');
      }
      
      if (content.includes('nft') || content.includes('collection')) {
        topics.add('nft_operations');
      }
      
      if (content.includes('multisig') || content.includes('proposal')) {
        topics.add('multisig_coordination');
      }
      
      if (content.includes('gaming') || content.includes('studio')) {
        topics.add('gaming_development');
      }
    });
    
    return Array.from(topics);
  }
}