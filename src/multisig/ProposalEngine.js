/**
 * File Location: src/multisig/ProposalEngine.js
 * 
 * ProposalEngine - Handles proposal creation, tracking, and approval management
 * 
 * This class manages the lifecycle of proposals within the multisig system,
 * from creation to execution or rejection.
 */

export class ProposalEngine {
  constructor(multisigManager) {
    this.multisigManager = multisigManager;
    this.proposals = new Map(); // proposalId -> proposal
    this.proposalsByMultisig = new Map(); // multisigId -> [proposalIds]
    this.proposalsByWallet = new Map(); // walletName -> [proposalIds]
  }

  /**
   * Create a new proposal
   */
  async createProposal({
    multisigId,
    proposerWalletName,
    operation,
    params,
    description = "",
    urgency = 'normal',
    requiredApprovals = [],
    expiresAt = null
  }) {
    try {
      const proposalId = this._generateProposalId();
      
      // Set expiration if not provided (default 7 days for normal, 1 day for emergency)
      if (!expiresAt) {
        const days = urgency === 'emergency' ? 1 : 7;
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }

      const proposal = {
        id: proposalId,
        multisigId,
        proposerWalletName,
        operation,
        params,
        description,
        urgency,
        requiredApprovals, // Array of wallet names that need to approve
        approvals: new Map(), // walletName -> approval object
        rejections: new Map(), // walletName -> rejection object
        status: 'pending', // 'pending', 'executed', 'rejected', 'expired', 'failed'
        createdAt: new Date().toISOString(),
        expiresAt,
        executedAt: null,
        executionResult: null
      };

      // Add helper methods to proposal
      proposal.hasRequiredApprovals = () => this._hasRequiredApprovals(proposal);
      proposal.getApprovalStatus = () => this._getApprovalStatus(proposal);
      proposal.isExpired = () => new Date() > new Date(proposal.expiresAt);

      // Store proposal
      this.proposals.set(proposalId, proposal);
      
      // Index by multisig
      if (!this.proposalsByMultisig.has(multisigId)) {
        this.proposalsByMultisig.set(multisigId, []);
      }
      this.proposalsByMultisig.get(multisigId).push(proposalId);

      // Index by proposer
      if (!this.proposalsByWallet.has(proposerWalletName)) {
        this.proposalsByWallet.set(proposerWalletName, []);
      }
      this.proposalsByWallet.get(proposerWalletName).push(proposalId);

      console.log(`📝 Proposal ${proposalId} created by ${proposerWalletName}`);
      console.log(`🎯 Operation: ${operation}`);
      console.log(`⏰ Expires: ${expiresAt}`);
      console.log(`✅ Required approvals: ${requiredApprovals.join(', ')}`);

      return proposal;

    } catch (error) {
      throw new Error(`Failed to create proposal: ${error.message}`);
    }
  }

  /**
   * Record an approval or rejection
   */
  async recordApproval({
    proposalId,
    approverWalletName,
    decision, // 'approve' or 'reject'
    comment = "",
    timestamp = new Date().toISOString()
  }) {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      // Check if proposal is still pending
      if (proposal.status !== 'pending') {
        throw new Error(`Proposal ${proposalId} is no longer pending (status: ${proposal.status})`);
      }

      // Check if expired
      if (proposal.isExpired()) {
        proposal.status = 'expired';
        throw new Error(`Proposal ${proposalId} has expired`);
      }

      // Check if this wallet already voted
      if (proposal.approvals.has(approverWalletName) || proposal.rejections.has(approverWalletName)) {
        throw new Error(`${approverWalletName} has already voted on proposal ${proposalId}`);
      }

      // Check if this wallet is required to approve
      if (!proposal.requiredApprovals.includes(approverWalletName)) {
        throw new Error(`${approverWalletName} is not authorized to vote on proposal ${proposalId}`);
      }

      const approval = {
        walletName: approverWalletName,
        decision,
        comment,
        timestamp
      };

      // Record the vote
      if (decision === 'approve') {
        proposal.approvals.set(approverWalletName, approval);
        console.log(`✅ ${approverWalletName} approved proposal ${proposalId}`);
      } else if (decision === 'reject') {
        proposal.rejections.set(approverWalletName, approval);
        proposal.status = 'rejected'; // One rejection kills the proposal
        console.log(`❌ ${approverWalletName} rejected proposal ${proposalId}`);
      }

      // Index by approver wallet
      if (!this.proposalsByWallet.has(approverWalletName)) {
        this.proposalsByWallet.set(approverWalletName, []);
      }
      if (!this.proposalsByWallet.get(approverWalletName).includes(proposalId)) {
        this.proposalsByWallet.get(approverWalletName).push(proposalId);
      }

      return approval;

    } catch (error) {
      throw new Error(`Failed to record approval: ${error.message}`);
    }
  }

  /**
   * Get a proposal by ID
   */
  async getProposal(proposalId) {
    return this.proposals.get(proposalId);
  }

  /**
   * Get all pending proposals for a multisig group
   */
  async getPendingProposals(multisigId) {
    const proposalIds = this.proposalsByMultisig.get(multisigId) || [];
    return proposalIds
      .map(id => this.proposals.get(id))
      .filter(proposal => proposal && proposal.status === 'pending' && !proposal.isExpired());
  }

  /**
   * Get all proposals for a specific wallet
   */
  async getProposalsForWallet(walletName) {
    const proposalIds = this.proposalsByWallet.get(walletName) || [];
    return proposalIds.map(id => this.proposals.get(id)).filter(Boolean);
  }

  /**
   * Get proposals requiring action from a specific wallet
   */
  async getProposalsRequiringAction(walletName) {
    const allProposals = Array.from(this.proposals.values());
    
    return allProposals.filter(proposal => 
      proposal.status === 'pending' &&
      !proposal.isExpired() &&
      proposal.requiredApprovals.includes(walletName) &&
      !proposal.approvals.has(walletName) &&
      !proposal.rejections.has(walletName)
    );
  }

  /**
   * Update proposal status
   */
  async updateProposalStatus(proposalId, status, result = null) {
    try {
      const proposal = this.proposals.get(proposalId);
      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      proposal.status = status;
      
      if (status === 'executed') {
        proposal.executedAt = new Date().toISOString();
        proposal.executionResult = result;
        console.log(`✅ Proposal ${proposalId} executed successfully`);
      } else if (status === 'failed') {
        proposal.executedAt = new Date().toISOString();
        proposal.executionResult = result;
        console.log(`❌ Proposal ${proposalId} execution failed`);
      }

      return proposal;

    } catch (error) {
      throw new Error(`Failed to update proposal status: ${error.message}`);
    }
  }

  /**
   * Get proposal statistics for a multisig group
   */
  async getProposalStats(multisigId) {
    const proposalIds = this.proposalsByMultisig.get(multisigId) || [];
    const proposals = proposalIds.map(id => this.proposals.get(id)).filter(Boolean);

    const stats = {
      total: proposals.length,
      pending: proposals.filter(p => p.status === 'pending' && !p.isExpired()).length,
      executed: proposals.filter(p => p.status === 'executed').length,
      rejected: proposals.filter(p => p.status === 'rejected').length,
      expired: proposals.filter(p => p.isExpired()).length,
      failed: proposals.filter(p => p.status === 'failed').length,
      byOperation: {},
      byUrgency: {},
      averageApprovalTime: 0
    };

    // Group by operation type
    proposals.forEach(proposal => {
      stats.byOperation[proposal.operation] = (stats.byOperation[proposal.operation] || 0) + 1;
      stats.byUrgency[proposal.urgency] = (stats.byUrgency[proposal.urgency] || 0) + 1;
    });

    // Calculate average approval time for executed proposals
    const executedProposals = proposals.filter(p => p.status === 'executed');
    if (executedProposals.length > 0) {
      const totalTime = executedProposals.reduce((sum, proposal) => {
        const created = new Date(proposal.createdAt);
        const executed = new Date(proposal.executedAt);
        return sum + (executed - created);
      }, 0);
      stats.averageApprovalTime = Math.round(totalTime / executedProposals.length / (1000 * 60 * 60)); // hours
    }

    return stats;
  }

  /**
   * Clean up expired proposals
   */
  async cleanupExpiredProposals() {
    const allProposals = Array.from(this.proposals.values());
    let cleanedCount = 0;

    for (const proposal of allProposals) {
      if (proposal.status === 'pending' && proposal.isExpired()) {
        proposal.status = 'expired';
        cleanedCount++;
        console.log(`⏰ Proposal ${proposal.id} marked as expired`);
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired proposals`);
    }

    return cleanedCount;
  }

  /**
   * Get proposal summary for display
   */
  getProposalSummary(proposal) {
    const summary = {
      id: proposal.id,
      operation: proposal.operation,
      proposer: proposal.proposerWalletName,
      description: proposal.description,
      urgency: proposal.urgency,
      status: proposal.status,
      createdAt: proposal.createdAt,
      expiresAt: proposal.expiresAt,
      approvalStatus: proposal.getApprovalStatus(),
      requiredCount: proposal.requiredApprovals.length,
      approvedCount: proposal.approvals.size,
      rejectedCount: proposal.rejections.size,
      isExpired: proposal.isExpired(),
      timeLeft: this._getTimeLeft(proposal.expiresAt)
    };

    // Add operation-specific details
    switch (proposal.operation) {
      case 'createERC20Token':
        summary.details = {
          tokenName: proposal.params.name,
          tokenSymbol: proposal.params.symbol,
          initialSupply: proposal.params.initialSupply
        };
        break;
      case 'createNFTCollection':
        summary.details = {
          collectionName: proposal.params.name,
          symbol: proposal.params.symbol,
          maxSupply: proposal.params.maxSupply
        };
        break;
      case 'transferETH':
        summary.details = {
          recipient: proposal.params.to,
          amount: proposal.params.amount,
          currency: 'ETH'
        };
        break;
      case 'batchPlayerRewards':
        summary.details = {
          playerCount: proposal.params.rewards.length,
          totalRewards: proposal.params.rewards.length
        };
        break;
      default:
        summary.details = proposal.params;
    }

    return summary;
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Check if proposal has required approvals
   */
  _hasRequiredApprovals(proposal) {
    // Check if all required approvers have approved
    for (const requiredApprover of proposal.requiredApprovals) {
      if (!proposal.approvals.has(requiredApprover)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get approval status summary
   */
  _getApprovalStatus(proposal) {
    const approved = [];
    const pending = [];
    const rejected = [];

    for (const requiredApprover of proposal.requiredApprovals) {
      if (proposal.approvals.has(requiredApprover)) {
        approved.push(requiredApprover);
      } else if (proposal.rejections.has(requiredApprover)) {
        rejected.push(requiredApprover);
      } else {
        pending.push(requiredApprover);
      }
    }

    return {
      approved,
      pending,
      rejected,
      isComplete: pending.length === 0 && rejected.length === 0,
      canExecute: this._hasRequiredApprovals(proposal)
    };
  }

  /**
   * Get time left until expiration
   */
  _getTimeLeft(expiresAt) {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff <= 0) {
      return 'Expired';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Generate unique proposal ID
   */
  _generateProposalId() {
    return 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }
}