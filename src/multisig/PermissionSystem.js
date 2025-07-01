
export class PermissionSystem {
  constructor() {
    this.rolePermissions = this._initializeDefaultRolePermissions();
  }

  /**
   * Setup permissions for a multisig group
   */
  async setupGroupPermissions(multisigConfig) {
    try {
      // Validate roles and permissions
      this._validateGroupRoles(multisigConfig);
      
      // Setup operation-specific permissions
      for (const [operation, rule] of Object.entries(multisigConfig.rules)) {
        this._validateOperationRule(operation, rule, multisigConfig.members);
      }

      console.log(`🔒 Permissions setup for multisig group: ${multisigConfig.name}`);
      console.log(`👥 Roles: ${[...new Set(multisigConfig.members.map(m => m.role))].join(', ')}`);
      console.log(`⚙️ Operations: ${Object.keys(multisigConfig.rules).join(', ')}`);

      return true;

    } catch (error) {
      throw new Error(`Permission setup failed: ${error.message}`);
    }
  }

  /**
   * Check if a wallet can propose an operation
   */
  async canPropose(multisigConfig, walletName, operation) {
    try {
      // Find the member
      const member = multisigConfig.members.find(m => m.walletName === walletName);
      if (!member) {
        return { allowed: false, reason: `Wallet ${walletName} is not a member of this multisig` };
      }

      // Check if operation exists in rules
      const rule = multisigConfig.rules[operation];
      if (!rule) {
        // Allow proposal if no specific rule (will use default threshold)
        return { allowed: true, reason: 'No specific rule, using default permissions' };
      }

      // Check role-based permissions
      const roleCheck = this._checkRolePermission(member.role, operation, 'propose');
      if (!roleCheck.allowed) {
        return roleCheck;
      }

      // Check if member's role is in required roles for this operation
      if (rule.requiredRoles && rule.requiredRoles.length > 0) {
        if (!rule.requiredRoles.includes(member.role)) {
          return { 
            allowed: false, 
            reason: `Role '${member.role}' not authorized for operation '${operation}'. Required roles: ${rule.requiredRoles.join(', ')}` 
          };
        }
      }

      return { allowed: true, reason: 'Permission granted' };

    } catch (error) {
      return { allowed: false, reason: `Permission check failed: ${error.message}` };
    }
  }

  /**
   * Check if a wallet can approve an operation
   */
  async canApprove(multisigConfig, walletName, operation) {
    try {
      // Find the member
      const member = multisigConfig.members.find(m => m.walletName === walletName);
      if (!member) {
        return { allowed: false, reason: `Wallet ${walletName} is not a member of this multisig` };
      }

      // Check if operation exists in rules
      const rule = multisigConfig.rules[operation];
      if (!rule) {
        // Allow approval if no specific rule
        return { allowed: true, reason: 'No specific rule, using default permissions' };
      }

      // Check role-based permissions
      const roleCheck = this._checkRolePermission(member.role, operation, 'approve');
      if (!roleCheck.allowed) {
        return roleCheck;
      }

      // Check if member's role is in required roles for this operation
      if (rule.requiredRoles && rule.requiredRoles.length > 0) {
        if (!rule.requiredRoles.includes(member.role)) {
          return { 
            allowed: false, 
            reason: `Role '${member.role}' not authorized to approve operation '${operation}'. Required roles: ${rule.requiredRoles.join(', ')}` 
          };
        }
      }

      return { allowed: true, reason: 'Approval permission granted' };

    } catch (error) {
      return { allowed: false, reason: `Approval check failed: ${error.message}` };
    }
  }

  /**
   * Check spending limits for financial operations
   */
  async checkSpendingLimits(multisigConfig, walletName, operation, amount) {
    try {
      const member = multisigConfig.members.find(m => m.walletName === walletName);
      if (!member) {
        return { allowed: false, reason: 'Member not found' };
      }

      const rule = multisigConfig.rules[operation];
      if (!rule || !rule.maxAmount) {
        return { allowed: true, reason: 'No spending limit set' };
      }

      const maxAmount = parseFloat(rule.maxAmount);
      const requestAmount = parseFloat(amount);

      if (requestAmount > maxAmount) {
        return { 
          allowed: false, 
          reason: `Amount ${amount} exceeds limit ${rule.maxAmount} for operation ${operation}` 
        };
      }

      return { allowed: true, reason: 'Within spending limits' };

    } catch (error) {
      return { allowed: false, reason: `Spending limit check failed: ${error.message}` };
    }
  }

  /**
   * Get permissions summary for a wallet in a multisig
   */
  getWalletPermissions(multisigConfig, walletName) {
    const member = multisigConfig.members.find(m => m.walletName === walletName);
    if (!member) {
      return { error: 'Wallet not found in multisig' };
    }

    const permissions = {
      walletName,
      role: member.role,
      weight: member.weight,
      canPropose: {},
      canApprove: {},
      spendingLimits: {}
    };

    // Check each operation
    for (const [operation, rule] of Object.entries(multisigConfig.rules)) {
      const proposeCheck = this._checkRolePermission(member.role, operation, 'propose');
      const approveCheck = this._checkRolePermission(member.role, operation, 'approve');
      
      permissions.canPropose[operation] = proposeCheck.allowed;
      permissions.canApprove[operation] = approveCheck.allowed;
      
      if (rule.maxAmount) {
        permissions.spendingLimits[operation] = rule.maxAmount;
      }
    }

    return permissions;
  }

  /**
   * Get all members who can approve a specific operation
   */
  getEligibleApprovers(multisigConfig, operation) {
    const rule = multisigConfig.rules[operation];
    if (!rule || !rule.requiredRoles) {
      // If no specific rule, all members can approve
      return multisigConfig.members.map(m => m.walletName);
    }

    return multisigConfig.members
      .filter(member => rule.requiredRoles.includes(member.role))
      .map(member => member.walletName);
  }

  /**
   * Check if emergency override is allowed
   */
  canEmergencyOverride(multisigConfig, walletName, operation) {
    const member = multisigConfig.members.find(m => m.walletName === walletName);
    if (!member) {
      return { allowed: false, reason: 'Member not found' };
    }

    // Only certain roles can do emergency overrides
    const emergencyRoles = ['ceo', 'founder', 'admin', 'leader'];
    if (!emergencyRoles.includes(member.role)) {
      return { 
        allowed: false, 
        reason: `Role '${member.role}' cannot perform emergency overrides` 
      };
    }

    // Check if emergency override is enabled for this operation
    const rule = multisigConfig.rules[operation];
    if (rule && rule.allowEmergencyOverride === false) {
      return { 
        allowed: false, 
        reason: `Emergency override disabled for operation '${operation}'` 
      };
    }

    return { allowed: true, reason: 'Emergency override permitted' };
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Initialize default role permissions
   */
  _initializeDefaultRolePermissions() {
    return {
      // CEO/Founder permissions
      ceo: {
        propose: ['*'], // Can propose anything
        approve: ['*'], // Can approve anything
        emergencyOverride: true
      },
      founder: {
        propose: ['*'],
        approve: ['*'],
        emergencyOverride: true
      },
      admin: {
        propose: ['*'],
        approve: ['*'],
        emergencyOverride: true
      },

      // Developer permissions
      developer: {
        propose: [
          'createERC20Token', 'createMoveToken', 'createNFTCollection', 
          'mintNFT', 'playerRewards', 'batchPlayerRewards'
        ],
        approve: [
          'createERC20Token', 'createMoveToken', 'createNFTCollection',
          'mintNFT', 'playerRewards', 'batchPlayerRewards', 'transferETH'
        ],
        emergencyOverride: false
      },
      lead_dev: {
        propose: ['*'],
        approve: ['*'],
        emergencyOverride: true
      },

      // Artist permissions
      artist: {
        propose: ['createNFTCollection', 'mintNFT', 'nftMinting'],
        approve: ['createNFTCollection', 'mintNFT', 'nftMinting'],
        emergencyOverride: false
      },

      // Guild roles
      leader: {
        propose: ['*'],
        approve: ['*'],
        emergencyOverride: true
      },
      officer: {
        propose: [
          'memberReward', 'guildUpgrade', 'treasurySpend', 'newMember'
        ],
        approve: [
          'memberReward', 'guildUpgrade', 'treasurySpend', 'newMember'
        ],
        emergencyOverride: false
      },

      // Generic member
      member: {
        propose: ['memberReward'],
        approve: ['memberReward'],
        emergencyOverride: false
      },

      // Community roles
      community: {
        propose: ['playerRewards', 'communityEvents'],
        approve: ['playerRewards', 'communityEvents'],
        emergencyOverride: false
      },
      marketing: {
        propose: ['playerRewards', 'communityEvents', 'marketingSpend'],
        approve: ['playerRewards', 'communityEvents', 'marketingSpend'],
        emergencyOverride: false
      }
    };
  }

  /**
   * Check role permission for specific operation and action
   */
  _checkRolePermission(role, operation, action) {
    const rolePerms = this.rolePermissions[role];
    if (!rolePerms) {
      return { 
        allowed: false, 
        reason: `Unknown role: ${role}` 
      };
    }

    const allowedOperations = rolePerms[action] || [];
    
    // Check for wildcard permission
    if (allowedOperations.includes('*')) {
      return { allowed: true, reason: `Role '${role}' has wildcard permission for ${action}` };
    }

    // Check for specific operation permission
    if (allowedOperations.includes(operation)) {
      return { allowed: true, reason: `Role '${role}' has permission for ${operation}` };
    }

    return { 
      allowed: false, 
      reason: `Role '${role}' not permitted to ${action} operation '${operation}'` 
    };
  }

  /**
   * Validate group roles
   */
  _validateGroupRoles(multisigConfig) {
    for (const member of multisigConfig.members) {
      if (!member.role) {
        throw new Error(`Member ${member.walletName} missing role`);
      }

      if (!this.rolePermissions[member.role]) {
        console.warn(`⚠️ Unknown role '${member.role}' for ${member.walletName}. Using member permissions.`);
      }

      if (typeof member.weight !== 'number' || member.weight < 1) {
        throw new Error(`Member ${member.walletName} has invalid weight: ${member.weight}`);
      }
    }
  }

  /**
   * Validate operation rule
   */
  _validateOperationRule(operation, rule, members) {
    if (rule.requiredRoles) {
      // Check that required roles exist in the group
      const memberRoles = new Set(members.map(m => m.role));
      for (const requiredRole of rule.requiredRoles) {
        if (!memberRoles.has(requiredRole)) {
          throw new Error(`Operation '${operation}' requires role '${requiredRole}' but no member has this role`);
        }
      }
    }

    if (rule.threshold) {
      const eligibleMembers = rule.requiredRoles 
        ? members.filter(m => rule.requiredRoles.includes(m.role))
        : members;
      
      if (rule.threshold > eligibleMembers.length) {
        throw new Error(`Operation '${operation}' threshold (${rule.threshold}) exceeds eligible members (${eligibleMembers.length})`);
      }
    }
  }
}