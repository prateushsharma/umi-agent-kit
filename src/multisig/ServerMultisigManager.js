
import { ProposalEngine } from './ProposalEngine.js';
import { PermissionSystem } from './PermissionSystem.js';
import { NotificationService } from './NotificationService.js';
import { MultisigStorage } from './MultisigStorage.js';

export class ServerMultisigManager {
  constructor(umiClient, serverWallets = {}) {
    this.client = umiClient;
    this.serverWallets = serverWallets; // All wallets available on this server
    
    // Initialize core components
    this.proposalEngine = new ProposalEngine(this);
    this.permissionSystem = new PermissionSystem();
    this.notificationService = new NotificationService();
    this.storage = new MultisigStorage();
    
    // Track active multisig groups
    this.multisigGroups = new Map();
    
    console.log(`🔐 ServerMultisigManager initialized with ${Object.keys(serverWallets).length} wallets`);
  }

  /**
   * Create a new multisig group using server wallets
   */
  async createMultisigGroup({
    name,
    description = "",
    members, // Array of wallet names or {walletName, role, weight}
    threshold = 2,
    rules = {},
    notifications = true
  }) {
    try {
      // Validate members exist on server
      const validatedMembers = this._validateMembers(members);
      
      // Create multisig configuration
      const multisigConfig = {
        id: this._generateId(),
        name,
        description,
        members: validatedMembers,
        threshold,
        rules: this._processRules(rules),
        notifications,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // Setup permissions
      await this.permissionSystem.setupGroupPermissions(multisigConfig);
      
      // Store configuration
      await this.storage.saveMultisigGroup(multisigConfig);
      this.multisigGroups.set(multisigConfig.id, multisigConfig);

      console.log(`✅ Multisig group "${name}" created with ID: ${multisigConfig.id}`);
      console.log(`👥 Members: ${validatedMembers.map(m => m.walletName).join(', ')}`);
      console.log(`🎯 Threshold: ${threshold}/${validatedMembers.length}`);

      return multisigConfig;

    } catch (error) {
      throw new Error(`Failed to create multisig group: ${error.message}`);
    }
  }

  /**
   * Create a gaming studio multisig with predefined roles
   */
  async createGamingStudioMultisig({
    studioName,
    teamWallets, // {developer1: wallet, artist1: wallet, ceo: wallet}
    studioRules = {}
  }) {
    console.log(`🎮 Creating gaming studio multisig for: ${studioName}`);

    // Default gaming studio rules
    const defaultRules = {
      tokenCreation: { 
        requiredRoles: ['developer', 'ceo'], 
        threshold: 2,
        description: 'Create new game tokens'
      },
      nftCollection: { 
        requiredRoles: ['artist', 'developer'], 
        threshold: 2,
        description: 'Create NFT collections'
      },
      nftMinting: { 
        requiredRoles: ['artist'], 
        threshold: 1,
        description: 'Mint individual NFTs'
      },
      largeTransfer: { 
        requiredRoles: ['developer', 'ceo'], 
        threshold: 2,
        maxAmount: '10',
        description: 'Transfer > 10 ETH'
      },
      playerRewards: { 
        requiredRoles: ['developer'], 
        threshold: 1,
        description: 'Distribute player rewards'
      },
      emergencyStop: { 
        requiredRoles: ['ceo'], 
        threshold: 1,
        description: 'Emergency operations'
      },
      ...studioRules
    };

    // Setup members with gaming roles
    const members = Object.entries(teamWallets).map(([walletName, wallet]) => {
      const role = this._detectGamingRole(walletName);
      return {
        walletName,
        role,
        weight: role === 'ceo' ? 2 : 1,
        wallet
      };
    });

    return await this.createMultisigGroup({
      name: `${studioName} Studio`,
      description: `Gaming studio multisig for ${studioName}`,
      members,
      threshold: 2,
      rules: defaultRules,
      notifications: true
    });
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
    console.log(`⚔️ Creating guild multisig for: ${guildName}`);

    const defaultRules = {
      guildUpgrade: { 
        requiredRoles: ['leader', 'officer'], 
        threshold: 2,
        description: 'Upgrade guild facilities'
      },
      memberReward: { 
        requiredRoles: ['officer'], 
        threshold: 1,
        maxAmount: '1',
        description: 'Reward guild members'
      },
      treasurySpend: { 
        requiredRoles: ['leader'], 
        threshold: 1,
        maxAmount: '5',
        description: 'Spend from treasury'
      },
      newMember: { 
        requiredRoles: ['leader', 'officer'], 
        threshold: 1,
        description: 'Add new guild member'
      },
      ...guildRules
    };

    // Combine officers and members
    const allMembers = [
      ...Object.entries(officers).map(([name, wallet]) => ({
        walletName: name,
        role: name.includes('leader') ? 'leader' : 'officer',
        weight: name.includes('leader') ? 3 : 2,
        wallet
      })),
      ...Object.entries(members).map(([name, wallet]) => ({
        walletName: name,
        role: 'member',
        weight: 1,
        wallet
      }))
    ];

    return await this.createMultisigGroup({
      name: `${guildName} Guild`,
      description: `Guild treasury for ${guildName}`,
      members: allMembers,
      threshold: 2,
      rules: defaultRules,
      notifications: true
    });
  }

  /**
   * Propose a new transaction/operation
   */
  async proposeTransaction({
    multisigId,
    proposerWalletName,
    operation, // 'createToken', 'mintNFT', 'transferETH', etc.
    params,
    description = "",
    urgency = 'normal' // 'low', 'normal', 'high', 'emergency'
  }) {
    try {
      const multisig = this.multisigGroups.get(multisigId);
      if (!multisig) {
        throw new Error(`Multisig group ${multisigId} not found`);
      }

      // Check proposer permissions
      const canPropose = await this.permissionSystem.canPropose(
        multisig, 
        proposerWalletName, 
        operation
      );
      
      if (!canPropose.allowed) {
        throw new Error(`Permission denied: ${canPropose.reason}`);
      }

      // Create proposal
      const proposal = await this.proposalEngine.createProposal({
        multisigId,
        proposerWalletName,
        operation,
        params,
        description,
        urgency,
        requiredApprovals: this._calculateRequiredApprovals(multisig, operation)
      });

      // Send notifications
      if (multisig.notifications) {
        await this.notificationService.notifyNewProposal(multisig, proposal);
      }

      console.log(`📝 Proposal created: ${proposal.id}`);
      console.log(`🎯 Operation: ${operation}`);
      console.log(`👤 Proposer: ${proposerWalletName}`);
      console.log(`✅ Required approvals: ${proposal.requiredApprovals.length}`);

      return proposal;

    } catch (error) {
      throw new Error(`Failed to create proposal: ${error.message}`);
    }
  }

  /**
   * Approve a proposal
   */
  async approveProposal({
    proposalId,
    approverWalletName,
    decision = 'approve', // 'approve', 'reject'
    comment = ""
  }) {
    try {
      const proposal = await this.proposalEngine.getProposal(proposalId);
      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      const multisig = this.multisigGroups.get(proposal.multisigId);
      
      // Check approver permissions
      const canApprove = await this.permissionSystem.canApprove(
        multisig, 
        approverWalletName, 
        proposal.operation
      );
      
      if (!canApprove.allowed) {
        throw new Error(`Permission denied: ${canApprove.reason}`);
      }

      // Record approval
      const approval = await this.proposalEngine.recordApproval({
        proposalId,
        approverWalletName,
        decision,
        comment,
        timestamp: new Date().toISOString()
      });

      console.log(`${decision === 'approve' ? '✅' : '❌'} ${approverWalletName} ${decision}d proposal ${proposalId}`);

      // Check if proposal is ready for execution
      if (decision === 'approve' && proposal.hasRequiredApprovals()) {
        console.log(`🚀 Proposal ${proposalId} has enough approvals, executing...`);
        return await this.executeProposal(proposalId);
      }

      // Send notifications
      if (multisig.notifications) {
        await this.notificationService.notifyApproval(multisig, proposal, approval);
      }

      return approval;

    } catch (error) {
      throw new Error(`Failed to approve proposal: ${error.message}`);
    }
  }

  /**
   * Execute an approved proposal
   */
  async executeProposal(proposalId) {
    try {
      const proposal = await this.proposalEngine.getProposal(proposalId);
      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      // Verify proposal is ready for execution
      if (!proposal.hasRequiredApprovals()) {
        throw new Error(`Proposal ${proposalId} does not have required approvals`);
      }

      if (proposal.status !== 'pending') {
        throw new Error(`Proposal ${proposalId} is not in pending status`);
      }

      console.log(`⚡ Executing proposal ${proposalId}: ${proposal.operation}`);

      // Execute the actual blockchain operation
      const result = await this._executeOperation(proposal);

      // Update proposal status
      await this.proposalEngine.updateProposalStatus(proposalId, 'executed', result);

      // Send notifications
      const multisig = this.multisigGroups.get(proposal.multisigId);
      if (multisig.notifications) {
        await this.notificationService.notifyExecution(multisig, proposal, result);
      }

      console.log(`✅ Proposal ${proposalId} executed successfully`);
      console.log(`📊 Result:`, result);

      return {
        proposalId,
        operation: proposal.operation,
        result,
        executedAt: new Date().toISOString()
      };

    } catch (error) {
      // Update proposal status to failed
      await this.proposalEngine.updateProposalStatus(proposalId, 'failed', { error: error.message });
      throw new Error(`Failed to execute proposal: ${error.message}`);
    }
  }

  /**
   * Get multisig group information
   */
  getMultisigGroup(multisigId) {
    return this.multisigGroups.get(multisigId);
  }

  /**
   * Get all multisig groups
   */
  getAllMultisigGroups() {
    return Array.from(this.multisigGroups.values());
  }

  /**
   * Get pending proposals for a multisig group
   */
  async getPendingProposals(multisigId) {
    return await this.proposalEngine.getPendingProposals(multisigId);
  }

  /**
   * Get proposals for a specific wallet
   */
  async getProposalsForWallet(walletName) {
    return await this.proposalEngine.getProposalsForWallet(walletName);
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Validate that all members exist on the server
   */
  _validateMembers(members) {
    const validated = [];
    
    for (const member of members) {
      const walletName = typeof member === 'string' ? member : member.walletName;
      
      if (!this.serverWallets[walletName]) {
        throw new Error(`Wallet ${walletName} not found on server`);
      }

      validated.push({
        walletName,
        role: member.role || 'member',
        weight: member.weight || 1,
        wallet: this.serverWallets[walletName]
      });
    }

    return validated;
  }

  /**
   * Process and validate rules
   */
  _processRules(rules) {
    const processed = {};
    
    for (const [operation, rule] of Object.entries(rules)) {
      processed[operation] = {
        requiredRoles: rule.requiredRoles || [],
        threshold: rule.threshold || 1,
        maxAmount: rule.maxAmount,
        description: rule.description || `${operation} operation`,
        ...rule
      };
    }

    return processed;
  }

  /**
   * Calculate required approvals for an operation
   */
  _calculateRequiredApprovals(multisig, operation) {
    const rule = multisig.rules[operation];
    if (!rule) {
      // Use default threshold if no specific rule
      return multisig.members.slice(0, multisig.threshold).map(m => m.walletName);
    }

    // Find members with required roles
    const eligibleMembers = multisig.members.filter(member => 
      rule.requiredRoles.includes(member.role)
    );

    return eligibleMembers.slice(0, rule.threshold).map(m => m.walletName);
  }

  /**
   * Detect gaming role from wallet name
   */
  _detectGamingRole(walletName) {
    const name = walletName.toLowerCase();
    if (name.includes('ceo') || name.includes('founder')) return 'ceo';
    if (name.includes('dev') || name.includes('engineer')) return 'developer';
    if (name.includes('artist') || name.includes('design')) return 'artist';
    if (name.includes('marketing')) return 'marketing';
    if (name.includes('community')) return 'community';
    return 'member';
  }

  /**
   * Execute the actual blockchain operation
   */
  async _executeOperation(proposal) {
    const { operation, params } = proposal;
    
    switch (operation) {
      case 'createERC20Token':
        return await this._executeTokenCreation(proposal);
      case 'createNFTCollection':
        return await this._executeNFTCollection(proposal);
      case 'mintNFT':
        return await this._executeNFTMint(proposal);
      case 'transferETH':
        return await this._executeETHTransfer(proposal);
      case 'batchPlayerRewards':
        return await this._executeBatchRewards(proposal);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Execute token creation
   */
  async _executeTokenCreation(proposal) {
    const { params } = proposal;
    const proposerWallet = this.serverWallets[proposal.proposerWalletName];
    
    // Use UmiAgentKit to create token
    const result = await this.client.createERC20Token({
      deployerWallet: proposerWallet,
      name: params.name,
      symbol: params.symbol,
      decimals: params.decimals || 18,
      initialSupply: params.initialSupply
    });

    return {
      type: 'tokenCreation',
      contractAddress: result.contractAddress,
      transactionHash: result.hash,
      tokenName: params.name,
      tokenSymbol: params.symbol
    };
  }

  /**
   * Execute NFT collection creation
   */
  async _executeNFTCollection(proposal) {
    const { params } = proposal;
    const proposerWallet = this.serverWallets[proposal.proposerWalletName];
    
    const result = await this.client.createNFTCollection({
      deployerWallet: proposerWallet,
      name: params.name,
      symbol: params.symbol,
      baseURI: params.baseURI || "",
      maxSupply: params.maxSupply || 10000
    });

    return {
      type: 'nftCollection',
      contractAddress: result.contractAddress,
      transactionHash: result.hash,
      collectionName: params.name
    };
  }

  /**
   * Execute NFT mint
   */
  async _executeNFTMint(proposal) {
    const { params } = proposal;
    const proposerWallet = this.serverWallets[proposal.proposerWalletName];
    
    const result = await this.client.mintNFT({
      ownerWallet: proposerWallet,
      contractAddress: params.contractAddress,
      to: params.to,
      tokenId: params.tokenId,
      metadataURI: params.metadataURI || ""
    });

    return {
      type: 'nftMint',
      transactionHash: result.hash,
      tokenId: params.tokenId,
      recipient: params.to
    };
  }

  /**
   * Execute ETH transfer
   */
  async _executeETHTransfer(proposal) {
    const { params } = proposal;
    const proposerWallet = this.serverWallets[proposal.proposerWalletName];
    
    const result = await this.client.sendETH({
      fromWallet: proposerWallet,
      to: params.to,
      amount: params.amount
    });

    return {
      type: 'ethTransfer',
      transactionHash: result.hash,
      from: result.from,
      to: params.to,
      amount: params.amount
    };
  }

  /**
   * Execute batch player rewards
   */
  async _executeBatchRewards(proposal) {
    const { params } = proposal;
    const proposerWallet = this.serverWallets[proposal.proposerWalletName];
    const results = [];

    for (const reward of params.rewards) {
      try {
        let result;
        
        if (reward.type === 'token') {
          result = await this.client.transferERC20Tokens({
            fromWallet: proposerWallet,
            tokenAddress: reward.tokenAddress,
            to: reward.recipient,
            amount: reward.amount
          });
        } else if (reward.type === 'nft') {
          result = await this.client.mintNFT({
            ownerWallet: proposerWallet,
            contractAddress: reward.contractAddress,
            to: reward.recipient,
            tokenId: reward.tokenId,
            metadataURI: reward.metadataURI
          });
        }

        results.push({
          recipient: reward.recipient,
          type: reward.type,
          success: true,
          transactionHash: result.hash
        });

      } catch (error) {
        results.push({
          recipient: reward.recipient,
          type: reward.type,
          success: false,
          error: error.message
        });
      }
    }

    return {
      type: 'batchRewards',
      totalRewards: params.rewards.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Generate unique ID
   */
  _generateId() {
    return 'multisig_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}