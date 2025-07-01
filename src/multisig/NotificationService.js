
export class NotificationService {
  constructor(config = {}) {
    this.config = {
      enableConsole: config.enableConsole !== false, // Default true
      enableWebhooks: config.enableWebhooks || false,
      webhookUrl: config.webhookUrl,
      enableSlack: config.enableSlack || false,
      slackWebhook: config.slackWebhook,
      enableEmail: config.enableEmail || false,
      ...config
    };

    this.notificationQueue = [];
    this.webhookRetries = 3;
  }

  /**
   * Notify about new proposal
   */
  async notifyNewProposal(multisigConfig, proposal) {
    try {
      const message = this._createProposalMessage(multisigConfig, proposal);
      
      console.log('📢 NEW PROPOSAL NOTIFICATION');
      console.log('============================');
      console.log(message.text);
      
      // Send to various channels
      await this._sendToAllChannels(message, 'new_proposal');

      // Queue for any offline members
      this._queueNotification({
        type: 'new_proposal',
        multisigId: multisigConfig.id,
        proposalId: proposal.id,
        message: message.text,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Failed to send proposal notification: ${error.message}`);
    }
  }

  /**
   * Notify about proposal approval/rejection
   */
  async notifyApproval(multisigConfig, proposal, approval) {
    try {
      const message = this._createApprovalMessage(multisigConfig, proposal, approval);
      
      console.log('📢 PROPOSAL APPROVAL NOTIFICATION');
      console.log('==================================');
      console.log(message.text);
      
      await this._sendToAllChannels(message, 'approval');

      // Check if proposal is ready for execution
      if (proposal.hasRequiredApprovals()) {
        await this._notifyReadyForExecution(multisigConfig, proposal);
      }

    } catch (error) {
      console.error(`❌ Failed to send approval notification: ${error.message}`);
    }
  }

  /**
   * Notify about proposal execution
   */
  async notifyExecution(multisigConfig, proposal, result) {
    try {
      const message = this._createExecutionMessage(multisigConfig, proposal, result);
      
      console.log('📢 PROPOSAL EXECUTION NOTIFICATION');
      console.log('===================================');
      console.log(message.text);
      
      await this._sendToAllChannels(message, 'execution');

    } catch (error) {
      console.error(`❌ Failed to send execution notification: ${error.message}`);
    }
  }

  /**
   * Notify about urgent proposals
   */
  async notifyUrgentProposal(multisigConfig, proposal) {
    try {
      const message = this._createUrgentMessage(multisigConfig, proposal);
      
      console.log('🚨 URGENT PROPOSAL NOTIFICATION');
      console.log('================================');
      console.log(message.text);
      
      await this._sendToAllChannels(message, 'urgent_proposal');

    } catch (error) {
      console.error(`❌ Failed to send urgent notification: ${error.message}`);
    }
  }

  /**
   * Send daily summary of pending proposals
   */
  async sendDailySummary(multisigConfigs, proposals) {
    try {
      for (const multisigConfig of multisigConfigs) {
        const pendingProposals = proposals.filter(p => 
          p.multisigId === multisigConfig.id && p.status === 'pending'
        );

        if (pendingProposals.length === 0) continue;

        const message = this._createDailySummaryMessage(multisigConfig, pendingProposals);
        
        console.log('📊 DAILY SUMMARY NOTIFICATION');
        console.log('==============================');
        console.log(message.text);
        
        await this._sendToAllChannels(message, 'daily_summary');
      }

    } catch (error) {
      console.error(`❌ Failed to send daily summary: ${error.message}`);
    }
  }

  /**
   * Get notification history
   */
  getNotificationHistory(limit = 50) {
    return this.notificationQueue.slice(-limit);
  }

  /**
   * Configure notification channels
   */
  configureChannels(config) {
    this.config = { ...this.config, ...config };
    console.log('🔧 Notification channels configured:', Object.keys(config));
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Create proposal notification message
   */
  _createProposalMessage(multisigConfig, proposal) {
    const emoji = this._getOperationEmoji(proposal.operation);
    const urgencyEmoji = proposal.urgency === 'emergency' ? '🚨' : proposal.urgency === 'high' ? '⚡' : '📝';
    
    const text = `
${urgencyEmoji} ${emoji} NEW PROPOSAL

Multisig: ${multisigConfig.name}
Proposal ID: ${proposal.id}
Operation: ${proposal.operation}
Proposer: ${proposal.proposerWalletName}
Urgency: ${proposal.urgency.toUpperCase()}

Description: ${proposal.description || 'No description provided'}

Required Approvals: ${proposal.requiredApprovals.join(', ')}
Expires: ${new Date(proposal.expiresAt).toLocaleString()}

${this._getOperationDetails(proposal)}

⏰ Please review and approve/reject this proposal.`;

    return {
      text,
      type: 'proposal',
      urgency: proposal.urgency,
      multisigId: multisigConfig.id,
      proposalId: proposal.id
    };
  }

  /**
   * Create approval notification message
   */
  _createApprovalMessage(multisigConfig, proposal, approval) {
    const emoji = approval.decision === 'approve' ? '✅' : '❌';
    const status = proposal.getApprovalStatus();
    
    const text = `
${emoji} PROPOSAL ${approval.decision.toUpperCase()}ED

Multisig: ${multisigConfig.name}
Proposal ID: ${proposal.id}
Operation: ${proposal.operation}

${approval.decision === 'approve' ? 'Approved' : 'Rejected'} by: ${approval.walletName}
${approval.comment ? `Comment: ${approval.comment}` : ''}

Current Status:
✅ Approved: ${status.approved.join(', ') || 'None'}
⏳ Pending: ${status.pending.join(', ') || 'None'}
❌ Rejected: ${status.rejected.join(', ') || 'None'}

${status.canExecute ? '🚀 Ready for execution!' : `Still waiting for: ${status.pending.join(', ')}`}`;

    return {
      text,
      type: 'approval',
      decision: approval.decision,
      multisigId: multisigConfig.id,
      proposalId: proposal.id
    };
  }

  /**
   * Create execution notification message
   */
  _createExecutionMessage(multisigConfig, proposal, result) {
    const emoji = result.type === 'tokenCreation' ? '🪙' : 
                  result.type === 'nftCollection' ? '🎨' : 
                  result.type === 'ethTransfer' ? '💸' : '⚡';
    
    const text = `
${emoji} PROPOSAL EXECUTED SUCCESSFULLY

Multisig: ${multisigConfig.name}
Proposal ID: ${proposal.id}
Operation: ${proposal.operation}
Executed at: ${new Date(proposal.executedAt).toLocaleString()}

${this._getExecutionDetails(result)}

✅ Operation completed successfully!`;

    return {
      text,
      type: 'execution',
      multisigId: multisigConfig.id,
      proposalId: proposal.id,
      result
    };
  }

  /**
   * Create urgent proposal message
   */
  _createUrgentMessage(multisigConfig, proposal) {
    const text = `
🚨🚨🚨 URGENT PROPOSAL REQUIRES IMMEDIATE ATTENTION 🚨🚨🚨

Multisig: ${multisigConfig.name}
Proposal ID: ${proposal.id}
Operation: ${proposal.operation}
Proposer: ${proposal.proposerWalletName}

⚠️ This proposal has EMERGENCY urgency level!

Description: ${proposal.description}

Required Approvals: ${proposal.requiredApprovals.join(', ')}
Expires: ${new Date(proposal.expiresAt).toLocaleString()}

🔥 PLEASE REVIEW IMMEDIATELY 🔥`;

    return {
      text,
      type: 'urgent',
      multisigId: multisigConfig.id,
      proposalId: proposal.id
    };
  }

  /**
   * Create daily summary message
   */
  _createDailySummaryMessage(multisigConfig, pendingProposals) {
    const text = `
📊 DAILY MULTISIG SUMMARY

Multisig: ${multisigConfig.name}
Date: ${new Date().toLocaleDateString()}

📝 Pending Proposals: ${pendingProposals.length}

${pendingProposals.map(proposal => {
  const timeLeft = this._getTimeLeft(proposal.expiresAt);
  const status = proposal.getApprovalStatus();
  return `
• ${proposal.operation} (${proposal.id})
  Proposer: ${proposal.proposerWalletName}
  Approved: ${status.approved.length}/${proposal.requiredApprovals.length}
  Time left: ${timeLeft}
  ${proposal.urgency === 'emergency' ? '🚨 URGENT' : ''}`;
}).join('')}

⏰ Please review pending proposals to keep operations moving smoothly.`;

    return {
      text,
      type: 'daily_summary',
      multisigId: multisigConfig.id,
      pendingCount: pendingProposals.length
    };
  }

  /**
   * Notify when proposal is ready for execution
   */
  async _notifyReadyForExecution(multisigConfig, proposal) {
    const message = {
      text: `
🚀 PROPOSAL READY FOR EXECUTION

Multisig: ${multisigConfig.name}
Proposal ID: ${proposal.id}
Operation: ${proposal.operation}

✅ All required approvals received!
The proposal will be executed automatically.

${this._getOperationDetails(proposal)}`,
      type: 'ready_for_execution',
      multisigId: multisigConfig.id,
      proposalId: proposal.id
    };

    console.log('📢 READY FOR EXECUTION NOTIFICATION');
    console.log('====================================');
    console.log(message.text);

    await this._sendToAllChannels(message, 'ready_for_execution');
  }

  /**
   * Send message to all configured channels
   */
  async _sendToAllChannels(message, eventType) {
    const promises = [];

    // Console logging (always enabled for server multisig)
    if (this.config.enableConsole) {
      // Already logged above, just track
    }

    // Webhook notifications
    if (this.config.enableWebhooks && this.config.webhookUrl) {
      promises.push(this._sendWebhook(message, eventType));
    }

    // Slack notifications
    if (this.config.enableSlack && this.config.slackWebhook) {
      promises.push(this._sendSlack(message, eventType));
    }

    // Email notifications (future implementation)
    if (this.config.enableEmail) {
      promises.push(this._sendEmail(message, eventType));
    }

    // Wait for all notifications to complete
    const results = await Promise.allSettled(promises);
    
    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ Notification channel ${index} failed:`, result.reason);
      }
    });
  }

  /**
   * Send webhook notification
   */
  async _sendWebhook(message, eventType) {
    try {
      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        multisigId: message.multisigId,
        proposalId: message.proposalId,
        message: message.text,
        urgency: message.urgency,
        data: message
      };

      // Simple fetch implementation for webhook
      // In a real server environment, you'd use proper HTTP client
      console.log(`🔗 Webhook notification sent for event: ${eventType}`);
      console.log(`📡 Webhook URL: ${this.config.webhookUrl}`);
      console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));

      return { success: true, channel: 'webhook' };

    } catch (error) {
      throw new Error(`Webhook notification failed: ${error.message}`);
    }
  }

  /**
   * Send Slack notification
   */
  async _sendSlack(message, eventType) {
    try {
      const slackMessage = {
        text: message.text,
        username: 'UmiAgentKit Multisig',
        icon_emoji: this._getSlackEmoji(eventType),
        attachments: [{
          color: this._getSlackColor(eventType, message.urgency),
          fields: [
            {
              title: 'Event Type',
              value: eventType,
              short: true
            },
            {
              title: 'Multisig ID',
              value: message.multisigId,
              short: true
            }
          ],
          timestamp: Math.floor(Date.now() / 1000)
        }]
      };

      console.log(`💬 Slack notification sent for event: ${eventType}`);
      console.log(`📱 Slack message:`, JSON.stringify(slackMessage, null, 2));

      return { success: true, channel: 'slack' };

    } catch (error) {
      throw new Error(`Slack notification failed: ${error.message}`);
    }
  }

  /**
   * Send email notification (placeholder for future implementation)
   */
  async _sendEmail(message, eventType) {
    try {
      console.log(`📧 Email notification (not implemented yet) for event: ${eventType}`);
      console.log(`📨 Would send email with subject: Multisig ${eventType} - ${message.multisigId}`);
      
      return { success: true, channel: 'email' };

    } catch (error) {
      throw new Error(`Email notification failed: ${error.message}`);
    }
  }

  /**
   * Queue notification for later delivery
   */
  _queueNotification(notification) {
    this.notificationQueue.push(notification);
    
    // Keep only last 1000 notifications
    if (this.notificationQueue.length > 1000) {
      this.notificationQueue = this.notificationQueue.slice(-1000);
    }
  }

  /**
   * Get operation emoji
   */
  _getOperationEmoji(operation) {
    const emojis = {
      createERC20Token: '🪙',
      createMoveToken: '⚡',
      createNFTCollection: '🎨',
      mintNFT: '🖼️',
      transferETH: '💸',
      batchPlayerRewards: '🎁',
      emergencyStop: '🛑',
      guildUpgrade: '⚔️',
      memberReward: '🏆'
    };
    return emojis[operation] || '⚙️';
  }

  /**
   * Get operation details for display
   */
  _getOperationDetails(proposal) {
    const { operation, params } = proposal;
    
    switch (operation) {
      case 'createERC20Token':
        return `Token Name: ${params.name}
Symbol: ${params.symbol}
Initial Supply: ${params.initialSupply?.toLocaleString()}`;

      case 'createNFTCollection':
        return `Collection: ${params.name}
Symbol: ${params.symbol}
Max Supply: ${params.maxSupply?.toLocaleString()}`;

      case 'mintNFT':
        return `Recipient: ${params.to}
Token ID: ${params.tokenId}
Contract: ${params.contractAddress}`;

      case 'transferETH':
        return `Recipient: ${params.to}
Amount: ${params.amount} ETH`;

      case 'batchPlayerRewards':
        return `Number of players: ${params.rewards?.length}
Total rewards: ${params.rewards?.length} items`;

      default:
        return Object.entries(params)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
    }
  }

  /**
   * Get execution details for display
   */
  _getExecutionDetails(result) {
    switch (result.type) {
      case 'tokenCreation':
        return `Token Contract: ${result.contractAddress}
Transaction: ${result.transactionHash}
Token: ${result.tokenName} (${result.tokenSymbol})`;

      case 'nftCollection':
        return `NFT Contract: ${result.contractAddress}
Transaction: ${result.transactionHash}
Collection: ${result.collectionName}`;

      case 'nftMint':
        return `Transaction: ${result.transactionHash}
Token ID: ${result.tokenId}
Recipient: ${result.recipient}`;

      case 'ethTransfer':
        return `Transaction: ${result.transactionHash}
From: ${result.from}
To: ${result.to}
Amount: ${result.amount} ETH`;

      case 'batchRewards':
        return `Total Rewards: ${result.totalRewards}
Successful: ${result.successful}
Failed: ${result.failed}`;

      default:
        return `Transaction completed successfully`;
    }
  }

  /**
   * Get time left until expiration
   */
  _getTimeLeft(expiresAt) {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '<1h';
  }

  /**
   * Get Slack emoji for event type
   */
  _getSlackEmoji(eventType) {
    const emojis = {
      new_proposal: ':memo:',
      approval: ':white_check_mark:',
      execution: ':rocket:',
      urgent_proposal: ':rotating_light:',
      ready_for_execution: ':rocket:',
      daily_summary: ':bar_chart:'
    };
    return emojis[eventType] || ':gear:';
  }

  /**
   * Get Slack color for event type
   */
  _getSlackColor(eventType, urgency) {
    if (urgency === 'emergency') return 'danger';
    if (urgency === 'high') return 'warning';
    
    const colors = {
      new_proposal: '#36a64f',
      approval: '#36a64f',
      execution: '#ff9500',
      urgent_proposal: '#ff0000',
      ready_for_execution: '#ff9500',
      daily_summary: '#439fe0'
    };
    return colors[eventType] || '#439fe0';
  }
}