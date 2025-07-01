

import { promises as fs } from 'fs';
import path from 'path';

export class MultisigStorage {
  constructor(config = {}) {
    this.config = {
      storageDir: config.storageDir || './multisig_data',
      enableFileStorage: config.enableFileStorage !== false, // Default true
      enableBackups: config.enableBackups !== false, // Default true
      maxBackups: config.maxBackups || 10,
      autoSave: config.autoSave !== false, // Default true
      ...config
    };

    // Initialize storage directories
    this._initializeStorage();
  }

  /**
   * Save multisig group configuration
   */
  async saveMultisigGroup(multisigConfig) {
    try {
      if (!this.config.enableFileStorage) {
        return { saved: false, reason: 'File storage disabled' };
      }

      const filename = `multisig_${multisigConfig.id}.json`;
      const filepath = path.join(this.config.storageDir, 'groups', filename);
      
      // Create backup if exists
      if (this.config.enableBackups) {
        await this._createBackup(filepath, 'groups');
      }

      // Prepare data for storage (serialize Maps, etc.)
      const storageData = this._prepareForStorage(multisigConfig);
      
      await fs.writeFile(filepath, JSON.stringify(storageData, null, 2));
      
      console.log(`💾 Multisig group saved: ${filename}`);
      
      return { 
        saved: true, 
        filepath, 
        timestamp: new Date().toISOString() 
      };

    } catch (error) {
      throw new Error(`Failed to save multisig group: ${error.message}`);
    }
  }

  /**
   * Load multisig group configuration
   */
  async loadMultisigGroup(multisigId) {
    try {
      const filename = `multisig_${multisigId}.json`;
      const filepath = path.join(this.config.storageDir, 'groups', filename);
      
      const data = await fs.readFile(filepath, 'utf8');
      const multisigConfig = JSON.parse(data);
      
      // Restore from storage format
      const restored = this._restoreFromStorage(multisigConfig);
      
      console.log(`📁 Multisig group loaded: ${filename}`);
      
      return restored;

    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw new Error(`Failed to load multisig group: ${error.message}`);
    }
  }

  /**
   * Save proposal
   */
  async saveProposal(proposal) {
    try {
      if (!this.config.enableFileStorage) {
        return { saved: false, reason: 'File storage disabled' };
      }

      const filename = `proposal_${proposal.id}.json`;
      const filepath = path.join(this.config.storageDir, 'proposals', filename);
      
      // Create backup if exists
      if (this.config.enableBackups) {
        await this._createBackup(filepath, 'proposals');
      }

      // Prepare proposal for storage
      const storageData = this._prepareProposalForStorage(proposal);
      
      await fs.writeFile(filepath, JSON.stringify(storageData, null, 2));
      
      console.log(`💾 Proposal saved: ${filename}`);
      
      return { 
        saved: true, 
        filepath, 
        timestamp: new Date().toISOString() 
      };

    } catch (error) {
      throw new Error(`Failed to save proposal: ${error.message}`);
    }
  }

  /**
   * Load proposal
   */
  async loadProposal(proposalId) {
    try {
      const filename = `proposal_${proposalId}.json`;
      const filepath = path.join(this.config.storageDir, 'proposals', filename);
      
      const data = await fs.readFile(filepath, 'utf8');
      const proposalData = JSON.parse(data);
      
      // Restore proposal from storage format
      const restored = this._restoreProposalFromStorage(proposalData);
      
      console.log(`📁 Proposal loaded: ${filename}`);
      
      return restored;

    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw new Error(`Failed to load proposal: ${error.message}`);
    }
  }

  /**
   * Get all multisig groups
   */
  async getAllMultisigGroups() {
    try {
      const groupsDir = path.join(this.config.storageDir, 'groups');
      const files = await fs.readdir(groupsDir);
      
      const multisigGroups = [];
      
      for (const file of files) {
        if (file.startsWith('multisig_') && file.endsWith('.json')) {
          const multisigId = file.replace('multisig_', '').replace('.json', '');
          const group = await this.loadMultisigGroup(multisigId);
          if (group) {
            multisigGroups.push(group);
          }
        }
      }
      
      console.log(`📂 Loaded ${multisigGroups.length} multisig groups`);
      
      return multisigGroups;

    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // Directory doesn't exist yet
      }
      throw new Error(`Failed to load multisig groups: ${error.message}`);
    }
  }

  /**
   * Get all proposals for a multisig
   */
  async getProposalsForMultisig(multisigId) {
    try {
      const proposalsDir = path.join(this.config.storageDir, 'proposals');
      const files = await fs.readdir(proposalsDir);
      
      const proposals = [];
      
      for (const file of files) {
        if (file.startsWith('proposal_') && file.endsWith('.json')) {
          const proposalId = file.replace('proposal_', '').replace('.json', '');
          const proposal = await this.loadProposal(proposalId);
          
          if (proposal && proposal.multisigId === multisigId) {
            proposals.push(proposal);
          }
        }
      }
      
      // Sort by creation date (newest first)
      proposals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log(`📂 Loaded ${proposals.length} proposals for multisig ${multisigId}`);
      
      return proposals;

    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // Directory doesn't exist yet
      }
      throw new Error(`Failed to load proposals: ${error.message}`);
    }
  }

  /**
   * Save audit log entry
   */
  async saveAuditLog(entry) {
    try {
      if (!this.config.enableFileStorage) {
        return { saved: false, reason: 'File storage disabled' };
      }

      const auditDir = path.join(this.config.storageDir, 'audit');
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `audit_${today}.jsonl`; // JSON Lines format
      const filepath = path.join(auditDir, filename);
      
      // Ensure audit directory exists
      await fs.mkdir(auditDir, { recursive: true });
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        ...entry
      };
      
      // Append to daily audit log file (JSON Lines format)
      await fs.appendFile(filepath, JSON.stringify(logEntry) + '\n');
      
      return { 
        saved: true, 
        filepath, 
        timestamp: logEntry.timestamp 
      };

    } catch (error) {
      throw new Error(`Failed to save audit log: ${error.message}`);
    }
  }

  /**
   * Export multisig data for backup/migration
   */
  async exportMultisigData(multisigId) {
    try {
      const multisigGroup = await this.loadMultisigGroup(multisigId);
      if (!multisigGroup) {
        throw new Error(`Multisig group ${multisigId} not found`);
      }

      const proposals = await this.getProposalsForMultisig(multisigId);
      
      const exportData = {
        multisigGroup,
        proposals,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const filename = `export_${multisigId}_${Date.now()}.json`;
      const filepath = path.join(this.config.storageDir, 'exports', filename);
      
      // Ensure exports directory exists
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      
      await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
      
      console.log(`📦 Multisig data exported: ${filename}`);
      
      return { 
        exported: true, 
        filepath, 
        filename,
        multisigId,
        proposalCount: proposals.length
      };

    } catch (error) {
      throw new Error(`Failed to export multisig data: ${error.message}`);
    }
  }

  /**
   * Import multisig data from backup/migration
   */
  async importMultisigData(filepath) {
    try {
      const data = await fs.readFile(filepath, 'utf8');
      const importData = JSON.parse(data);
      
      if (!importData.multisigGroup || !importData.proposals) {
        throw new Error('Invalid import data format');
      }

      // Save multisig group
      await this.saveMultisigGroup(importData.multisigGroup);
      
      // Save all proposals
      for (const proposal of importData.proposals) {
        await this.saveProposal(proposal);
      }

      console.log(`📥 Imported multisig data: ${importData.multisigGroup.id}`);
      console.log(`📄 Imported ${importData.proposals.length} proposals`);
      
      return {
        imported: true,
        multisigId: importData.multisigGroup.id,
        proposalCount: importData.proposals.length,
        importedAt: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to import multisig data: ${error.message}`);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const stats = {
        storageDir: this.config.storageDir,
        multisigGroups: 0,
        proposals: 0,
        auditLogs: 0,
        backups: 0,
        totalSize: 0
      };

      // Count multisig groups
      try {
        const groupsDir = path.join(this.config.storageDir, 'groups');
        const groupFiles = await fs.readdir(groupsDir);
        stats.multisigGroups = groupFiles.filter(f => f.endsWith('.json')).length;
      } catch (e) { /* Directory might not exist */ }

      // Count proposals
      try {
        const proposalsDir = path.join(this.config.storageDir, 'proposals');
        const proposalFiles = await fs.readdir(proposalsDir);
        stats.proposals = proposalFiles.filter(f => f.endsWith('.json')).length;
      } catch (e) { /* Directory might not exist */ }

      // Count audit logs
      try {
        const auditDir = path.join(this.config.storageDir, 'audit');
        const auditFiles = await fs.readdir(auditDir);
        stats.auditLogs = auditFiles.filter(f => f.endsWith('.jsonl')).length;
      } catch (e) { /* Directory might not exist */ }

      // Count backups
      try {
        const backupsDir = path.join(this.config.storageDir, 'backups');
        const backupFiles = await fs.readdir(backupsDir);
        stats.backups = backupFiles.length;
      } catch (e) { /* Directory might not exist */ }

      // Calculate total size (simplified)
      try {
        const du = await this._calculateDirectorySize(this.config.storageDir);
        stats.totalSize = du;
      } catch (e) { /* Can't calculate size */ }

      return stats;

    } catch (error) {
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }

  /**
   * Clean up old backups and audit logs
   */
  async cleanup() {
    try {
      let cleanedFiles = 0;

      // Clean old backups
      if (this.config.enableBackups) {
        cleanedFiles += await this._cleanupBackups();
      }

      // Clean old audit logs (keep last 30 days)
      cleanedFiles += await this._cleanupAuditLogs();

      console.log(`🧹 Cleanup completed: ${cleanedFiles} files removed`);
      
      return { cleanedFiles };

    } catch (error) {
      throw new Error(`Storage cleanup failed: ${error.message}`);
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Initialize storage directories
   */
  async _initializeStorage() {
    if (!this.config.enableFileStorage) {
      return;
    }

    try {
      const dirs = [
        this.config.storageDir,
        path.join(this.config.storageDir, 'groups'),
        path.join(this.config.storageDir, 'proposals'),
        path.join(this.config.storageDir, 'audit'),
        path.join(this.config.storageDir, 'backups'),
        path.join(this.config.storageDir, 'exports')
      ];

      for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
      }

      console.log(`📁 Storage initialized: ${this.config.storageDir}`);

    } catch (error) {
      console.error(`❌ Failed to initialize storage: ${error.message}`);
    }
  }

  /**
   * Prepare multisig config for storage (serialize Maps, functions, etc.)
   */
  _prepareForStorage(multisigConfig) {
    return {
      ...multisigConfig,
      // Remove any functions or non-serializable data
      members: multisigConfig.members.map(member => ({
        walletName: member.walletName,
        role: member.role,
        weight: member.weight
        // Don't store the actual wallet object
      }))
    };
  }

  /**
   * Restore multisig config from storage
   */
  _restoreFromStorage(storageData) {
    return {
      ...storageData
      // Add back any helper functions if needed
    };
  }

  /**
   * Prepare proposal for storage
   */
  _prepareProposalForStorage(proposal) {
    return {
      ...proposal,
      approvals: Array.from(proposal.approvals.entries()),
      rejections: Array.from(proposal.rejections.entries())
    };
  }

  /**
   * Restore proposal from storage
   */
  _restoreProposalFromStorage(storageData) {
    const proposal = {
      ...storageData,
      approvals: new Map(storageData.approvals),
      rejections: new Map(storageData.rejections)
    };

    // Add helper methods back
    proposal.hasRequiredApprovals = () => {
      for (const requiredApprover of proposal.requiredApprovals) {
        if (!proposal.approvals.has(requiredApprover)) {
          return false;
        }
      }
      return true;
    };

    proposal.getApprovalStatus = () => {
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
        canExecute: proposal.hasRequiredApprovals()
      };
    };

    proposal.isExpired = () => new Date() > new Date(proposal.expiresAt);

    return proposal;
  }

  /**
   * Create backup of existing file
   */
  async _createBackup(filepath, category) {
    try {
      // Check if file exists
      await fs.access(filepath);
      
      const backupsDir = path.join(this.config.storageDir, 'backups', category);
      await fs.mkdir(backupsDir, { recursive: true });
      
      const filename = path.basename(filepath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `${timestamp}_${filename}`;
      const backupPath = path.join(backupsDir, backupFilename);
      
      await fs.copyFile(filepath, backupPath);
      
      console.log(`💾 Backup created: ${backupFilename}`);
      
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`⚠️ Failed to create backup: ${error.message}`);
      }
    }
  }

  /**
   * Clean up old backups
   */
  async _cleanupBackups() {
    try {
      const backupsDir = path.join(this.config.storageDir, 'backups');
      const categories = await fs.readdir(backupsDir);
      let cleanedCount = 0;

      for (const category of categories) {
        const categoryDir = path.join(backupsDir, category);
        const files = await fs.readdir(categoryDir);
        
        // Sort files by name (timestamp-based)
        files.sort().reverse();
        
        // Remove old backups beyond maxBackups
        if (files.length > this.config.maxBackups) {
          const filesToRemove = files.slice(this.config.maxBackups);
          
          for (const file of filesToRemove) {
            await fs.unlink(path.join(categoryDir, file));
            cleanedCount++;
          }
        }
      }

      return cleanedCount;

    } catch (error) {
      console.error(`⚠️ Failed to cleanup backups: ${error.message}`);
      return 0;
    }
  }

  /**
   * Clean up old audit logs
   */
  async _cleanupAuditLogs() {
    try {
      const auditDir = path.join(this.config.storageDir, 'audit');
      const files = await fs.readdir(auditDir);
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let cleanedCount = 0;

      for (const file of files) {
        if (file.startsWith('audit_') && file.endsWith('.jsonl')) {
          const dateStr = file.replace('audit_', '').replace('.jsonl', '');
          const fileDate = new Date(dateStr);
          
          if (fileDate < thirtyDaysAgo) {
            await fs.unlink(path.join(auditDir, file));
            cleanedCount++;
          }
        }
      }

      return cleanedCount;

    } catch (error) {
      console.error(`⚠️ Failed to cleanup audit logs: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate directory size (simplified)
   */
  async _calculateDirectorySize(dirPath) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      let totalSize = 0;

      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          totalSize += await this._calculateDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }

      return totalSize;

    } catch (error) {
      return 0;
    }
  }
}