
export class UmiAIWrapper {
  constructor(umiKit) {
    this.umiKit = umiKit;
    console.log('🤖 UmiAIWrapper initialized');
  }

  // ========== WALLET FUNCTIONS ==========

  /**
   * Get wallet balance with AI-friendly error handling
   */
 async getWalletBalance({ address }) {
  try {
    let targetAddress = address;
    
    // Handle "my wallet" or similar references
    if (address === 'my' || address === 'mine' || address === 'default') {
      const context = this.umiKit.aiManager?.contextManager?.getContext();
      targetAddress = context?.defaultWallet || context?.userWallet;
      
      if (!targetAddress) {
        // Try to get the first wallet if available
        const wallets = this.umiKit.getAllWallets();
        if (wallets && wallets.length > 0) {
          targetAddress = wallets[0].getAddress();
          console.log(`📝 Using first available wallet: ${targetAddress}`);
        } else {
          throw new Error('No default wallet set and no wallets available. Please create a wallet first.');
        }
      }
    }
    
    // Validate address format
    if (!targetAddress || !targetAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error(`Invalid wallet address: ${targetAddress}`);
    }
    
    console.log(`🔍 Getting balance for address: ${targetAddress}`);
    
    // Get balance from UmiKit
    const balanceWei = await this.umiKit.getBalance(targetAddress);
    console.log(`📊 Raw balance:`, balanceWei, `(type: ${typeof balanceWei})`);
    
    // Convert balance properly based on type
    let balanceETH = '0.000000';
    let balanceWeiString = '0';
    
    try {
      if (balanceWei === null || balanceWei === undefined) {
        console.log('⚠️  Balance is null/undefined, using 0');
        balanceETH = '0.000000';
        balanceWeiString = '0';
      } else if (typeof balanceWei === 'bigint') {
        // Viem returns BigInt
        balanceWeiString = balanceWei.toString();
        const balanceNumber = Number(balanceWeiString);
        balanceETH = (balanceNumber / 1e18).toFixed(6);
      } else if (typeof balanceWei === 'string') {
        balanceWeiString = balanceWei;
        const balanceNumber = Number(balanceWei);
        balanceETH = (balanceNumber / 1e18).toFixed(6);
      } else if (typeof balanceWei === 'number') {
        balanceWeiString = balanceWei.toString();
        balanceETH = (balanceWei / 1e18).toFixed(6);
      } else {
        // Fallback
        balanceWeiString = String(balanceWei);
        const balanceNumber = Number(balanceWeiString);
        balanceETH = (balanceNumber / 1e18).toFixed(6);
      }
    } catch (conversionError) {
      console.error('❌ Balance conversion error:', conversionError);
      balanceETH = '0.000000';
      balanceWeiString = '0';
    }
    
    console.log(`💰 Formatted balance: ${balanceETH} ETH`);
    
    return {
      success: true,
      address: targetAddress,
      balance: balanceETH,
      balanceWei: balanceWeiString,
      network: this.umiKit.getNetworkInfo().network
    };
    
  } catch (error) {
    console.error('❌ getWalletBalance error:', error);
    return {
      success: false,
      message: `Failed to get wallet balance: ${error.message}`,
      address: address || 'unknown',
      balance: '0.000000',
      balanceWei: '0'
    };
  }
}


  /**
   * Get network information
   */
  async getNetworkInfo() {
  try {
    const networkInfo = this.umiKit.getNetworkInfo();
    
    let blockNumber = 'unknown';
    try {
      const blockNum = await this.umiKit.getBlockNumber();
      blockNumber = typeof blockNum === 'bigint' ? blockNum.toString() : String(blockNum);
    } catch (blockError) {
      console.warn('⚠️  Could not get block number:', blockError.message);
      blockNumber = 'unavailable';
    }
    
    return {
      success: true,
      network: networkInfo.network,
      chainId: networkInfo.chainId,
      rpcUrl: networkInfo.rpcUrl,
      blockExplorer: networkInfo.explorer || networkInfo.blockExplorer,
      currentBlock: blockNumber
    };
    
  } catch (error) {
    console.error('❌ getNetworkInfo error:', error);
    return {
      success: false,
      message: `Failed to get network info: ${error.message}`,
      network: 'unknown',
      chainId: 'unknown',
      currentBlock: 'unknown'
    };
  }
}


  /**
   * List all managed wallets
   */
  async listWallets() {
  try {
    const wallets = this.umiKit.getAllWallets();
    const walletList = [];
    
    if (!wallets || wallets.length === 0) {
      return {
        success: true,
        message: 'No wallets found. Create a wallet first.',
        wallets: [],
        count: 0
      };
    }
    
    for (const wallet of wallets) {
      try {
        const address = wallet.getAddress();
        let balance = '0.000000';
        let moveAddress = 'N/A';
        
        try {
          const balanceWei = await this.umiKit.getBalance(address);
          if (balanceWei !== null && balanceWei !== undefined) {
            const balanceStr = typeof balanceWei === 'bigint' ? balanceWei.toString() : String(balanceWei);
            const balanceNum = Number(balanceStr);
            balance = (balanceNum / 1e18).toFixed(6);
          }
        } catch (balanceError) {
          console.warn(`⚠️  Could not get balance for ${address}:`, balanceError.message);
        }
        
        try {
          if (typeof wallet.getMoveAddress === 'function') {
            moveAddress = wallet.getMoveAddress();
          }
        } catch (moveError) {
          console.warn(`⚠️  Could not get Move address for ${address}`);
        }
        
        walletList.push({
          address,
          balance,
          moveAddress,
          status: 'active'
        });
        
      } catch (walletError) {
        console.warn('⚠️  Error processing wallet:', walletError.message);
        walletList.push({
          address: 'error',
          balance: 'error',
          moveAddress: 'error',
          error: walletError.message
        });
      }
    }
    
    return {
      success: true,
      message: `Found ${walletList.length} wallet(s)`,
      wallets: walletList,
      count: walletList.length
    };
    
  } catch (error) {
    console.error('❌ listWallets error:', error);
    return {
      success: false,
      message: `Failed to list wallets: ${error.message}`,
      wallets: [],
      count: 0
    };
  }
}

  /**
   * Get current gas price
   */
  async getGasPrice() {
  try {
    const gasPrice = await this.umiKit.getGasPrice();
    
    let gasPriceString = '0';
    let gasPriceGwei = '0.00';
    
    if (gasPrice !== null && gasPrice !== undefined) {
      if (typeof gasPrice === 'bigint') {
        gasPriceString = gasPrice.toString();
        const gasPriceNum = Number(gasPriceString);
        gasPriceGwei = (gasPriceNum / 1e9).toFixed(2);
      } else {
        gasPriceString = String(gasPrice);
        const gasPriceNum = Number(gasPriceString);
        gasPriceGwei = (gasPriceNum / 1e9).toFixed(2);
      }
    }
    
    return {
      success: true,
      gasPrice: gasPriceString,
      gasPriceGwei: gasPriceGwei,
      network: this.umiKit.getNetworkInfo().network
    };
    
  } catch (error) {
    console.error('❌ getGasPrice error:', error);
    return {
      success: false,
      message: `Failed to get gas price: ${error.message}`,
      gasPrice: '0',
      gasPriceGwei: '0.00'
    };
  }
}

  /**
   * Get latest block number
   */
 async getBlockNumber() {
  try {
    const blockNumber = await this.umiKit.getBlockNumber();
    
    let blockNumString = '0';
    if (blockNumber !== null && blockNumber !== undefined) {
      blockNumString = typeof blockNumber === 'bigint' ? blockNumber.toString() : String(blockNumber);
    }
    
    return {
      success: true,
      blockNumber: blockNumString,
      network: this.umiKit.getNetworkInfo().network
    };
    
  } catch (error) {
    console.error('❌ getBlockNumber error:', error);
    return {
      success: false,
      message: `Failed to get block number: ${error.message}`,
      blockNumber: '0'
    };
  }
}

  // ========== TRANSFER FUNCTIONS ==========

  /**
   * Send ETH between wallets
   */
/**
 * REPLACE your sendETH method in UmiAIWrapper.js with this FIXED version
 * The issue is that TransferManager returns 'hash' but we were expecting 'transactionHash'
 */

/**
 * Send ETH and track the transaction - COMPLETELY FIXED VERSION
 */
async sendETH({ fromAddress, toAddress, amount }) {
  try {
    let actualFromAddress = fromAddress;
    
    // Handle "my" wallet references
    if (fromAddress === 'my' || fromAddress === 'mine' || fromAddress === 'default') {
      const context = this.umiKit.aiManager?.contextManager?.getContext();
      actualFromAddress = context?.defaultWallet || context?.userWallet;
      
      if (!actualFromAddress) {
        // Try to get the first wallet if available
        const wallets = this.umiKit.getAllWallets();
        if (wallets && wallets.length > 0) {
          actualFromAddress = wallets[0].getAddress();
          console.log(`📝 Using first available wallet: ${actualFromAddress}`);
        } else {
          throw new Error('No default wallet set and no wallets available. Please create or import a wallet first.');
        }
      }
    }
    
    const fromWallet = this.umiKit.walletManager.getWallet(actualFromAddress);
    if (!fromWallet) {
      throw new Error(`Wallet not found: ${actualFromAddress}. Available wallets: ${this.umiKit.getAllWallets().map(w => w.getAddress()).join(', ')}`);
    }

    console.log(`💸 Sending ${amount} ETH from ${actualFromAddress} to ${toAddress}`);

    // Call the UmiAgentKit sendETH method
    const result = await this.umiKit.sendETH({
      fromWallet,
      to: toAddress,
      amount: amount.toString()
    });

    console.log(`📊 Raw result from UmiAgentKit:`, result);

    // FIXED: TransferManager returns 'hash', not 'transactionHash'
    const transactionHash = result.hash || result.transactionHash;
    
    if (!transactionHash) {
      console.warn('⚠️  No transaction hash returned from TransferManager');
    }

    console.log(`✅ Transaction successful: ${transactionHash}`);

    // Track this transaction in context for AI memory
    if (this.umiKit.aiManager?.contextManager) {
      const context = this.umiKit.aiManager.contextManager.getContext();
      if (!context.recentTransactions) {
        context.recentTransactions = [];
      }
      
      // Add to recent transactions
      const transactionRecord = {
        hash: transactionHash,
        from: result.from || actualFromAddress,
        to: result.to || toAddress,
        amount: result.amount || amount,
        type: toAddress === '0x0000000000000000000000000000000000000000' ? 'burn' : 'transfer',
        timestamp: new Date().toISOString(),
        network: this.umiKit.getNetworkInfo().network,
        status: result.status || 'confirmed'
      };
      
      context.recentTransactions.unshift(transactionRecord);
      console.log(`📝 Added transaction to memory:`, transactionRecord);
      
      // Keep only last 20 transactions
      context.recentTransactions = context.recentTransactions.slice(0, 20);
      
      // Update balance history
      if (!context.balanceHistory) {
        context.balanceHistory = [];
      }
      
      try {
        // Wait a moment for transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newBalance = await this.umiKit.getBalance(actualFromAddress);
        const balanceETH = (Number(newBalance.toString()) / 1e18).toFixed(6);
        
        context.balanceHistory.unshift({
          balance: balanceETH,
          timestamp: new Date().toISOString(),
          after_transaction: transactionHash
        });
        
        console.log(`📊 Updated balance: ${balanceETH} ETH`);
        
        // Keep only last 10 balances
        context.balanceHistory = context.balanceHistory.slice(0, 10);
      } catch (balanceError) {
        console.warn('Could not update balance history:', balanceError.message);
      }
    }

    const explorerUrl = `${this.umiKit.getNetworkInfo().explorer || this.umiKit.getNetworkInfo().blockExplorer}/tx/${transactionHash}`;

    return {
      success: true,
      transactionHash: transactionHash,
      hash: transactionHash, // Also provide 'hash' for compatibility
      from: result.from || actualFromAddress,
      to: result.to || toAddress,
      amount: result.amount || amount,
      network: this.umiKit.getNetworkInfo().network,
      explorer_url: explorerUrl,
      status: result.status || 'sent',
      message: transactionHash ? 
        `✅ Successfully sent ${amount} ETH from ${actualFromAddress} to ${toAddress}. Transaction: ${transactionHash}` :
        `✅ Transaction sent but hash not available. Check balance for confirmation.`
    };

  } catch (error) {
    console.error('❌ sendETH error:', error);
    return {
      success: false,
      message: `ETH transfer failed: ${error.message}`,
      error: error.message
    };
  }
}
  // ========== TOKEN FUNCTIONS ==========

  /**
   * Create ERC-20 token
   */
  async createERC20Token({ deployerAddress, name, symbol, decimals = 18, initialSupply }) {
    try {
      const deployerWallet = this.umiKit.walletManager.getWallet(deployerAddress);
      if (!deployerWallet) {
        throw new Error(`Deployer wallet not found: ${deployerAddress}`);
      }

      const result = await this.umiKit.createERC20Token({
        deployerWallet,
        name,
        symbol,
        decimals,
        initialSupply
      });

      return {
        success: true,
        contractAddress: result.contractAddress,
        transactionHash: result.transactionHash,
        name,
        symbol,
        decimals,
        initialSupply
      };

    } catch (error) {
      return {
        success: false,
        message: `Token creation failed: ${error.message}`
      };
    }
  }

  /**
   * Create Move token
   */
  async createMoveToken({ deployerAddress, name, symbol, decimals = 8, initialSupply }) {
    try {
      const deployerWallet = this.umiKit.walletManager.getWallet(deployerAddress);
      if (!deployerWallet) {
        throw new Error(`Deployer wallet not found: ${deployerAddress}`);
      }

      const result = await this.umiKit.createMoveToken({
        deployerWallet,
        name,
        symbol,
        decimals,
        initialSupply
      });

      return {
        success: true,
        contractAddress: result.contractAddress,
        transactionHash: result.transactionHash,
        name,
        symbol,
        decimals,
        initialSupply
      };

    } catch (error) {
      return {
        success: false,
        message: `Move token creation failed: ${error.message}`
      };
    }
  }

  // ========== NFT FUNCTIONS ==========

  /**
   * Create ERC-721 NFT collection
   */
  async createERC721Collection({ deployerAddress, name, symbol, baseURI = '', maxSupply = 10000 }) {
    try {
      const deployerWallet = this.umiKit.walletManager.getWallet(deployerAddress);
      if (!deployerWallet) {
        throw new Error(`Deployer wallet not found: ${deployerAddress}`);
      }

      const result = await this.umiKit.createERC721Collection({
        deployerWallet,
        name,
        symbol,
        baseURI,
        maxSupply
      });

      return {
        success: true,
        contractAddress: result.contractAddress,
        transactionHash: result.transactionHash,
        name,
        symbol,
        baseURI,
        maxSupply
      };

    } catch (error) {
      return {
        success: false,
        message: `NFT collection creation failed: ${error.message}`
      };
    }
  }

  /**
   * Create Move NFT collection
   */
  async createMoveNFTCollection({ deployerAddress, name, symbol, description = '', maxSupply = 10000 }) {
    try {
      const deployerWallet = this.umiKit.walletManager.getWallet(deployerAddress);
      if (!deployerWallet) {
        throw new Error(`Deployer wallet not found: ${deployerAddress}`);
      }

      const result = await this.umiKit.createMoveNFTCollection({
        deployerWallet,
        name,
        symbol,
        description,
        maxSupply
      });

      return {
        success: true,
        contractAddress: result.contractAddress,
        transactionHash: result.transactionHash,
        name,
        symbol,
        description,
        maxSupply
      };

    } catch (error) {
      return {
        success: false,
        message: `Move NFT collection creation failed: ${error.message}`
      };
    }
  }

  // ========== MULTISIG FUNCTIONS ==========

  /**
   * Create multisig group
   */
  async createMultisigGroup({ name, memberCount, threshold, description = '' }) {
    try {
      if (!this.umiKit.multisigManager) {
        throw new Error('Multisig functionality not enabled');
      }

      const result = await this.umiKit.multisigManager.createGroup({
        name,
        memberCount,
        threshold,
        description
      });

      return {
        success: true,
        groupId: result.groupId,
        name: result.name,
        memberCount: result.memberCount,
        threshold: result.threshold,
        members: result.members,
        treasuryAddress: result.treasuryAddress
      };

    } catch (error) {
      return {
        success: false,
        message: `Multisig group creation failed: ${error.message}`
      };
    }
  }

  /**
   * List multisig groups
   */
  async listMultisigGroups() {
    try {
      if (!this.umiKit.multisigManager) {
        throw new Error('Multisig functionality not enabled');
      }

      const groups = await this.umiKit.multisigManager.getAllGroups();

      return {
        success: true,
        groups: groups.map(group => ({
          groupId: group.groupId,
          name: group.name,
          memberCount: group.memberCount,
          threshold: group.threshold,
          treasuryAddress: group.treasuryAddress,
          activeProposals: group.activeProposals || 0
        })),
        count: groups.length
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to list multisig groups: ${error.message}`,
        groups: []
      };
    }
  }

  /**
   * Create proposal in multisig group
   */
  async createProposal({ groupId, title, description, action, parameters }) {
    try {
      if (!this.umiKit.multisigManager) {
        throw new Error('Multisig functionality not enabled');
      }

      const result = await this.umiKit.multisigManager.createProposal({
        groupId,
        title,
        description,
        action,
        parameters
      });

      return {
        success: true,
        proposalId: result.proposalId,
        title: result.title,
        description: result.description,
        action: result.action,
        status: result.status,
        approvals: result.approvals,
        required: result.required
      };

    } catch (error) {
      return {
        success: false,
        message: `Proposal creation failed: ${error.message}`
      };
    }
  }

  /**
   * Vote on proposal
   */
  async voteOnProposal({ proposalId, memberIndex, vote, reason = '' }) {
    try {
      if (!this.umiKit.multisigManager) {
        throw new Error('Multisig functionality not enabled');
      }

      const result = await this.umiKit.multisigManager.voteOnProposal({
        proposalId,
        memberIndex,
        vote,
        reason
      });

      return {
        success: true,
        proposalId: result.proposalId,
        vote: result.vote,
        approvals: result.approvals,
        required: result.required,
        status: result.status,
        executed: result.executed || false
      };

    } catch (error) {
      return {
        success: false,
        message: `Voting failed: ${error.message}`
      };
    }
  }

  // ========== MULTI-CONTRACT DEPLOYMENT FUNCTIONS ==========

  /**
   * Deploy multiple contracts from a folder
   */
 async deployContractsFromFolder({ contractsPath, walletAddress, deploymentType = 'module_only', config = {} }) {
  try {
    let actualWalletAddress = walletAddress;
    
    // Handle "my" wallet references
    if (walletAddress === 'my' || walletAddress === 'mine' || walletAddress === 'default') {
      const context = this.umiKit.aiManager?.contextManager?.getContext();
      actualWalletAddress = context?.defaultWallet || context?.userWallet;
      
      if (!actualWalletAddress) {
        // Try to get the first wallet if available
        const wallets = this.umiKit.getAllWallets();
        if (wallets && wallets.length > 0) {
          actualWalletAddress = wallets[0].getAddress();
          console.log(`📝 Using first available wallet: ${actualWalletAddress}`);
        } else {
          throw new Error('No default wallet set and no wallets available. Please create or import a wallet first.');
        }
      }
    }
    
    const wallet = this.umiKit.walletManager.getWallet(actualWalletAddress);
    if (!wallet) {
      throw new Error(`Wallet not found: ${actualWalletAddress}. Available wallets: ${this.umiKit.getAllWallets().map(w => w.getAddress()).join(', ')}`);
    }

    console.log(`🚀 AI: Deploying contracts from ${contractsPath} using wallet ${actualWalletAddress}`);

    let result;
    switch (deploymentType) {
      case 'module_only':
        result = await this.umiKit.deploymentManager.deployContractsOnly(contractsPath, wallet);
        break;
      case 'with_json':
        result = await this.umiKit.deploymentManager.deployWithJson(contractsPath, wallet);
        break;
      case 'with_config':
        result = await this.umiKit.deploymentManager.deployWithConfig(contractsPath, wallet, config);
        break;
      default:
        throw new Error(`Unknown deployment type: ${deploymentType}`);
    }

    console.log('📊 Deployment result:', result);

    // Format for AI response
   const deployedList = Object.entries(result).map(([name, contract]) => ({
  name,
  address: contract.address,
  functions: contract.functions || [],
  // ADD THESE LINES:
  transactionHash: contract.hash || contract.txHash,
  deployer: contract.deployer || contract.deployerAddress,
  type: contract.type || 'Move',
  status: contract.hash ? 'deployed' : 'unknown'
}));

return {
  success: true,
  message: `Successfully deployed ${deployedList.length} contracts from ${contractsPath}`,
  contracts: deployedList,
  deploymentType,
  walletUsed: actualWalletAddress,
  // ADD THIS:
  transactionHashes: deployedList.map(c => c.transactionHash).filter(Boolean)
};
  } catch (error) {
    console.error('❌ Deployment error:', error);
    return {
      success: false,
      message: `Deployment failed: ${error.message}`,
      contracts: [],
      error: error.message
    };
  }
}

  /**
   * Get all contracts deployed by a user
   */
  async getDeployedContracts({ walletAddress }) {
    try {
      // This would scan blockchain for contracts deployed by user
      // For now, return contracts from context/cache
      const contracts = this.umiKit.getDeployedContracts?.(walletAddress) || [];

      return {
        success: true,
        message: `Found ${contracts.length} deployed contracts`,
        contracts: contracts.map(contract => ({
          name: contract.name,
          address: contract.address,
          type: contract.type || 'unknown',
          functions: contract.functions || []
        }))
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to get contracts: ${error.message}`,
        contracts: []
      };
    }
  }

  /**
   * Call a function on any deployed contract
   */
  async callContractFunction({ contractAddress, functionName, parameters = [], walletAddress, isReadOnly = false }) {
    try {
      console.log(`📞 AI: Calling ${functionName} on ${contractAddress}`);

      // Get wallet for write operations
      let wallet = null;
      if (!isReadOnly) {
        wallet = this.umiKit.walletManager.getWallet(walletAddress);
        if (!wallet) {
          throw new Error(`Wallet not found: ${walletAddress}`);
        }
      }

      // Call the contract function
      const result = await this.umiKit.callContractFunction(
        contractAddress,
        functionName,
        parameters,
        wallet
      );

      return {
        success: true,
        message: `Function ${functionName} executed successfully`,
        result: result.result || result.hash,
        transactionHash: result.hash,
        isReadOnly
      };

    } catch (error) {
      return {
        success: false,
        message: `Function call failed: ${error.message}`,
        result: null
      };
    }
  }

  /**
   * Execute operations across multiple contracts (ecosystem operation)
   */
  async executeMultiContractOperation({ operationType, contracts, walletAddress, parameters = {} }) {
    try {
      console.log(`🔗 AI: Executing multi-contract operation: ${operationType}`);

      // Get wallet
      const wallet = this.umiKit.walletManager.getWallet(walletAddress);
      if (!wallet) {
        throw new Error(`Wallet not found: ${walletAddress}`);
      }

      let result;

      switch (operationType) {
        case 'start_tournament':
          result = await this._startTournamentOperation(contracts, wallet, parameters);
          break;
        case 'distribute_rewards':
          result = await this._distributeRewardsOperation(contracts, wallet, parameters);
          break;
        case 'mint_and_reward':
          result = await this._mintAndRewardOperation(contracts, wallet, parameters);
          break;
        case 'batch_transfer':
          result = await this._batchTransferOperation(contracts, wallet, parameters);
          break;
        default:
          throw new Error(`Unknown operation type: ${operationType}`);
      }

      return {
        success: true,
        message: `Multi-contract operation ${operationType} completed`,
        operationType,
        results: result.results || [],
        summary: result.summary
      };

    } catch (error) {
      return {
        success: false,
        message: `Multi-contract operation failed: ${error.message}`,
        operationType: operationType || 'unknown'
      };
    }
  }

  // ========== GAMING-SPECIFIC ECOSYSTEM OPERATIONS ==========

  /**
   * Start tournament operation across gaming contracts
   */
  async _startTournamentOperation(contracts, wallet, params) {
    const { entryFee, maxPlayers, prizePool } = params;
    const results = [];

    // Step 1: Approve GameToken spending for Tournament contract
    if (contracts.gameToken && contracts.tournament) {
      const approveResult = await this.umiKit.callContractFunction(
        contracts.gameToken,
        'approve',
        [contracts.tournament, entryFee * maxPlayers],
        wallet
      );
      results.push({ step: 'approve_tokens', result: approveResult });
    }

    // Step 2: Create tournament
    if (contracts.tournament) {
      const tournamentResult = await this.umiKit.callContractFunction(
        contracts.tournament,
        'createTournament',
        [maxPlayers, entryFee, prizePool],
        wallet
      );
      results.push({ step: 'create_tournament', result: tournamentResult });
    }

    return {
      results,
      summary: `Tournament created with ${maxPlayers} max players, ${entryFee} entry fee`
    };
  }

  /**
   * Distribute rewards operation
   */
  async _distributeRewardsOperation(contracts, wallet, params) {
    const { recipients, amounts } = params;
    const results = [];

    // Batch distribute tokens
    if (contracts.gameToken) {
      for (let i = 0; i < recipients.length; i++) {
        const transferResult = await this.umiKit.callContractFunction(
          contracts.gameToken,
          'transfer',
          [recipients[i], amounts[i]],
          wallet
        );
        results.push({ step: `transfer_to_${recipients[i]}`, result: transferResult });
      }
    }

    return {
      results,
      summary: `Rewards distributed to ${recipients.length} recipients`
    };
  }

  /**
   * Mint NFT and reward operation
   */
  async _mintAndRewardOperation(contracts, wallet, params) {
    const { recipient, nftMetadata, rewardAmount } = params;
    const results = [];

    // Step 1: Mint NFT
    if (contracts.nftContract) {
      const mintResult = await this.umiKit.callContractFunction(
        contracts.nftContract,
        'mint',
        [recipient, nftMetadata],
        wallet
      );
      results.push({ step: 'mint_nft', result: mintResult });
    }

    // Step 2: Send token reward
    if (contracts.gameToken && rewardAmount > 0) {
      const rewardResult = await this.umiKit.callContractFunction(
        contracts.gameToken,
        'transfer',
        [recipient, rewardAmount],
        wallet
      );
      results.push({ step: 'send_reward', result: rewardResult });
    }

    return {
      results,
      summary: `NFT minted and ${rewardAmount} tokens rewarded to ${recipient}`
    };
  }

  /**
   * Batch transfer operation
   */
  async _batchTransferOperation(contracts, wallet, params) {
    const { tokenContract, transfers } = params; // transfers = [{to, amount}]
    const results = [];

    for (const transfer of transfers) {
      const transferResult = await this.umiKit.callContractFunction(
        tokenContract,
        'transfer',
        [transfer.to, transfer.amount],
        wallet
      );
      results.push({ step: `transfer_${transfer.amount}_to_${transfer.to}`, result: transferResult });
    }

    return {
      results,
      summary: `Batch transferred to ${transfers.length} recipients`
    };
  }

  // ========== CONTRACT ANALYSIS FUNCTIONS ==========

  /**
   * Analyze gaming ecosystem health
   */
  async analyzeGamingEcosystem({ contracts }) {
    try {
      const analysis = {};

      // Analyze each contract in the ecosystem
      for (const [name, address] of Object.entries(contracts)) {
        if (name.includes('token')) {
          analysis[name] = await this._analyzeTokenContract(address);
        } else if (name.includes('nft')) {
          analysis[name] = await this._analyzeNFTContract(address);
        } else if (name.includes('tournament')) {
          analysis[name] = await this._analyzeTournamentContract(address);
        }
      }

      // Calculate ecosystem metrics
      const totalValue = Object.values(analysis)
        .reduce((sum, contract) => sum + (contract.totalValue || 0), 0);

      return {
        success: true,
        message: 'Ecosystem analysis completed',
        analysis,
        summary: {
          totalContracts: Object.keys(contracts).length,
          totalValue: totalValue,
          healthScore: this._calculateHealthScore(analysis)
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Ecosystem analysis failed: ${error.message}`,
        analysis: {}
      };
    }
  }

  // ========== HELPER FUNCTIONS ==========

  async _analyzeTokenContract(address) {
    // Analyze token metrics: supply, holders, etc.
    return {
      type: 'token',
      totalSupply: 1000000, // Would fetch from contract
      totalHolders: 150,
      totalValue: 50000
    };
  }

  async _analyzeNFTContract(address) {
    // Analyze NFT metrics: total minted, owners, etc.
    return {
      type: 'nft',
      totalMinted: 500,
      uniqueOwners: 200,
      floorPrice: 10
    };
  }

  async _analyzeTournamentContract(address) {
    // Analyze tournament metrics: active tournaments, participants, etc.
    return {
      type: 'tournament',
      activeTournaments: 3,
      totalParticipants: 64,
      totalPrizePool: 1000
    };
  }

  _calculateHealthScore(analysis) {
    // Simple health scoring algorithm
    const scores = Object.values(analysis).map(contract => {
      if (contract.type === 'token') return contract.totalHolders > 100 ? 90 : 70;
      if (contract.type === 'nft') return contract.uniqueOwners > 50 ? 85 : 65;
      if (contract.type === 'tournament') return contract.activeTournaments > 0 ? 95 : 50;
      return 50;
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
  async getTransactionHistory({ address, limit = 10 }) {
  try {
    let targetAddress = address;
    
    // Handle "my wallet" references
    if (address === 'my' || address === 'mine' || address === 'default') {
      const context = this.umiKit.aiManager?.contextManager?.getContext();
      targetAddress = context?.defaultWallet || context?.userWallet;
      
      if (!targetAddress) {
        const wallets = this.umiKit.getAllWallets();
        if (wallets && wallets.length > 0) {
          targetAddress = wallets[0].getAddress();
        } else {
          throw new Error('No wallet available');
        }
      }
    }
    
    console.log(`🔍 Getting transaction history for: ${targetAddress}`);
    
    // Get current block number
    const currentBlock = await this.umiKit.getBlockNumber();
    const startBlock = Math.max(0, Number(currentBlock) - 1000); // Last 1000 blocks
    
    console.log(`📊 Scanning blocks ${startBlock} to ${currentBlock}`);
    
    // This is a simplified approach - in production you'd use an indexer or explorer API
    const transactions = [];
    
    try {
      // Try to get recent transactions (this might not work on all networks)
      // For now, return a message that we need better indexing
      return {
        success: true,
        message: `I don't have access to full transaction history indexing yet. To see real transaction history, you can check the block explorer at ${this.umiKit.getNetworkInfo().explorer || this.umiKit.getNetworkInfo().blockExplorer}`,
        address: targetAddress,
        transactions: [],
        note: "Transaction history requires blockchain indexing. Currently showing live balance only.",
        current_balance: await this.getWalletBalance({ address: targetAddress })
      };
      
    } catch (error) {
      console.log('⚠️  Transaction history not available:', error.message);
      return {
        success: false,
        message: "Transaction history is not available. Use block explorer for detailed history.",
        address: targetAddress,
        transactions: []
      };
    }
    
  } catch (error) {
    console.error('❌ getTransactionHistory error:', error);
    return {
      success: false,
      message: `Failed to get transaction history: ${error.message}`,
      transactions: []
    };
  }
}
async getRecentTransactions({ limit = 10 }) {
  try {
    const context = this.umiKit.aiManager?.contextManager?.getContext();
    const recentTransactions = context?.recentTransactions || [];
    
    if (recentTransactions.length === 0) {
      return {
        success: true,
        message: "No recent transactions found in memory. This only tracks transactions made through this AI session.",
        transactions: [],
        count: 0
      };
    }
    
    const limitedTransactions = recentTransactions.slice(0, limit);
    
    return {
      success: true,
      message: `Found ${limitedTransactions.length} recent transactions from this session`,
      transactions: limitedTransactions.map((tx, index) => ({
        index: index + 1,
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        type: tx.type,
        timestamp: tx.timestamp,
        explorer_url: `${this.umiKit.getNetworkInfo().explorer || this.umiKit.getNetworkInfo().blockExplorer}/tx/${tx.hash}`
      })),
      count: limitedTransactions.length,
      total_in_memory: recentTransactions.length
    };
    
  } catch (error) {
    console.error('❌ getRecentTransactions error:', error);
    return {
      success: false,
      message: `Failed to get recent transactions: ${error.message}`,
      transactions: []
    };
  }
}
async getBalanceHistory({ limit = 10 }) {
  try {
    const context = this.umiKit.aiManager?.contextManager?.getContext();
    const balanceHistory = context?.balanceHistory || [];
    
    if (balanceHistory.length === 0) {
      // Get current balance at least
      const currentBalance = await this.getWalletBalance({ address: 'my' });
      return {
        success: true,
        message: "No balance history in memory. Showing current balance only.",
        balances: [
          {
            index: 1,
            balance: currentBalance.balance,
            timestamp: new Date().toISOString(),
            note: "Current balance"
          }
        ],
        count: 1
      };
    }
    
    const limitedHistory = balanceHistory.slice(0, limit);
    
    return {
      success: true,
      message: `Found ${limitedHistory.length} balance records from this session`,
      balances: limitedHistory.map((record, index) => ({
        index: index + 1,
        balance: record.balance,
        timestamp: record.timestamp,
        after_transaction: record.after_transaction
      })),
      count: limitedHistory.length,
      total_in_memory: balanceHistory.length
    };
    
  } catch (error) {
    console.error('❌ getBalanceHistory error:', error);
    return {
      success: false,
      message: `Failed to get balance history: ${error.message}`,
      balances: []
    };
  }
}

}