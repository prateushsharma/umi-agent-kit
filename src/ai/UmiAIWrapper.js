/**
 * File: src/ai/UmiAIWrapper.js
 * 
 * Wrapper that provides AI-friendly interfaces to UmiAgentKit functions
 * INCLUDING ALL MULTISIG METHODS
 */

export class UmiAIWrapper {
  constructor(umiKit) {
    this.umiKit = umiKit;
    console.log('🤖 UmiAIWrapper initialized');
  }

  // ====== EXISTING WALLET FUNCTIONS ======

  /**
   * Get wallet balance with AI-friendly error handling
   */
  async getWalletBalance({ address }) {
    try {
      let targetAddress = address;
      
      // Handle "my wallet" or similar references
      if (address === 'my' || address === 'mine' || address === 'default') {
        const context = this.umiKit.aiManager?.getContext();
        targetAddress = context?.defaultWallet || context?.userWallet;
        
        if (!targetAddress) {
          throw new Error('No default wallet set. Please provide a specific address or import a wallet first.');
        }
      }
      
      // Validate address format
      if (!targetAddress || !targetAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error(`Invalid wallet address: ${targetAddress}`);
      }
      
      const balance = await this.umiKit.getBalance(targetAddress);
      const balanceETH = (parseFloat(balance) / 1e18).toFixed(6);
      
      return {
        address: targetAddress,
        balance: balanceETH,
        balanceWei: balance.toString(),
        network: this.umiKit.client.networkInfo.network
      };
      
    } catch (error) {
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    try {
      const networkInfo = this.umiKit.getNetworkInfo();
      const blockNumber = await this.umiKit.getBlockNumber();
      
      return {
        network: networkInfo.network,
        chainId: networkInfo.chainId,
        rpcUrl: networkInfo.rpcUrl,
        blockExplorer: networkInfo.blockExplorer,
        currentBlock: blockNumber
      };
    } catch (error) {
      throw new Error(`Failed to get network info: ${error.message}`);
    }
  }

  /**
   * List all wallets
   */
  async listWallets() {
    try {
      const summary = await this.umiKit.getSummary();
      const wallets = [];
      
      // Add main wallet if available
      const context = this.umiKit.aiManager?.getContext();
      if (context?.defaultWallet) {
        const balance = await this.umiKit.getBalance(context.defaultWallet);
        wallets.push({
          address: context.defaultWallet,
          type: 'main',
          balance: (parseFloat(balance) / 1e18).toFixed(6)
        });
      }
      
      return {
        wallets,
        totalWallets: summary.walletCount,
        network: summary.network
      };
    } catch (error) {
      throw new Error(`Failed to list wallets: ${error.message}`);
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    try {
      // This is a placeholder - implement actual gas price fetching
      return {
        gasPrice: '20 Gwei',
        network: this.umiKit.client.networkInfo.network,
        note: 'Gas prices on Umi Network are typically low'
      };
    } catch (error) {
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber() {
    try {
      const blockNumber = await this.umiKit.getBlockNumber();
      return {
        blockNumber,
        network: this.umiKit.client.networkInfo.network
      };
    } catch (error) {
      throw new Error(`Failed to get block number: ${error.message}`);
    }
  }

  // ====== NEW: MULTISIG FUNCTIONS ======

  /**
   * Create a multisig group
   */
  async createMultisigGroup({ name, memberCount, threshold, description = "", roles = [] }) {
    try {
      console.log(`🔐 Creating multisig group: ${name}`);
      
      // Generate default roles if not provided
      const defaultRoles = ['ceo', 'developer', 'artist', 'marketing', 'community', 'designer', 'producer', 'manager', 'lead', 'officer'];
      const memberRoles = roles.length >= memberCount ? roles.slice(0, memberCount) : 
        [...roles, ...defaultRoles.slice(0, memberCount - roles.length)];
      
      // Create wallets for the members
      const teamWallets = {};
      
      for (let i = 0; i < memberCount; i++) {
        const role = memberRoles[i] || `member_${i + 1}`;
        const wallet = this.umiKit.createWallet();
        teamWallets[role] = wallet;
        
        console.log(`👤 Created wallet for ${role}: ${wallet.getAddress()}`);
      }
      
      // Register the wallets
      this.umiKit.registerMultisigWallets(teamWallets);
      
      // Create the multisig group
      const multisigGroup = await this.umiKit.createMultisigGroup({
        name,
        description,
        members: Object.keys(teamWallets).map((role, index) => ({
          walletName: role,
          role: role,
          weight: role === 'ceo' ? 2 : 1
        })),
        threshold,
        notifications: true
      });
      
      return {
        success: true,
        multisigId: multisigGroup.id,
        name: multisigGroup.name,
        members: multisigGroup.members.length,
        threshold: multisigGroup.threshold,
        wallets: Object.keys(teamWallets).map(role => ({
          role,
          address: teamWallets[role].getAddress()
        })),
        message: `Multisig group "${name}" created successfully with ${memberCount} members (${threshold} required for approval)`
      };
      
    } catch (error) {
      throw new Error(`Failed to create multisig group: ${error.message}`);
    }
  }

  /**
   * Create a gaming studio with team wallets
   */
  async createGamingStudio({ studioName, teamSize }) {
    try {
      console.log(`🎮 Creating gaming studio: ${studioName}`);
      
      // Define gaming roles
      const gamingRoles = ['ceo', 'lead_developer', 'artist', 'game_designer', 'marketing', 'community_manager', 'producer', 'qa_lead', 'sound_designer', 'writer'];
      const teamWallets = {};
      
      // Create wallets for team members
      for (let i = 0; i < Math.min(teamSize, 10); i++) {
        const role = gamingRoles[i] || `team_member_${i + 1}`;
        const wallet = this.umiKit.createWallet();
        teamWallets[role] = wallet;
        
        console.log(`👤 Created ${role} wallet: ${wallet.getAddress()}`);
      }
      
      // Create gaming studio multisig
      const studioMultisig = await this.umiKit.createGamingStudioMultisig({
        studioName,
        teamWallets
      });
      
      return {
        success: true,
        studioName,
        multisigId: studioMultisig.studioMultisig.id,
        teamMembers: Object.keys(teamWallets).length,
        wallets: Object.entries(teamWallets).map(([role, wallet]) => ({
          role,
          address: wallet.getAddress()
        })),
        threshold: studioMultisig.studioMultisig.threshold,
        message: `Gaming studio "${studioName}" created with ${Object.keys(teamWallets).length} team members and multisig coordination`
      };
      
    } catch (error) {
      throw new Error(`Failed to create gaming studio: ${error.message}`);
    }
  }

  /**
   * Create team wallets
   */
  async createTeamWallets({ count, roles = [] }) {
    try {
      console.log(`👥 Creating ${count} team wallets`);
      
      const wallets = [];
      const defaultRoles = ['member_1', 'member_2', 'member_3', 'member_4', 'member_5', 'member_6', 'member_7', 'member_8', 'member_9', 'member_10'];
      
      for (let i = 0; i < count; i++) {
        const wallet = this.umiKit.createWallet();
        const role = roles[i] || defaultRoles[i] || `wallet_${i + 1}`;
        
        wallets.push({
          role,
          address: wallet.getAddress(),
          moveAddress: wallet.getMoveAddress()
        });
        
        console.log(`👤 Created wallet ${i + 1} (${role}): ${wallet.getAddress()}`);
      }
      
      return {
        success: true,
        count: wallets.length,
        wallets,
        message: `Created ${wallets.length} team wallets successfully`
      };
      
    } catch (error) {
      throw new Error(`Failed to create team wallets: ${error.message}`);
    }
  }

  /**
   * List all multisig groups
   */
  async listMultisigGroups() {
    try {
      if (!this.umiKit.multisigManager) {
        return {
          success: false,
          groups: [],
          message: 'Multisig not enabled on this UmiAgentKit instance'
        };
      }
      
      const groups = this.umiKit.getAllMultisigGroups();
      
      return {
        success: true,
        count: groups.length,
        groups: groups.map(group => ({
          id: group.id,
          name: group.name,
          members: group.members.length,
          threshold: group.threshold,
          status: group.status,
          createdAt: group.createdAt
        })),
        message: groups.length > 0 ? 
          `Found ${groups.length} multisig group(s)` : 
          'No multisig groups created yet'
      };
      
    } catch (error) {
      throw new Error(`Failed to list multisig groups: ${error.message}`);
    }
  }

  // ====== TOKEN FUNCTIONS ======

  /**
   * Create ERC-20 token
   */
  async createERC20Token({ name, symbol, decimals = 18, initialSupply }) {
    try {
      console.log(`🪙 Creating ERC-20 token: ${name} (${symbol})`);
      
      // Get deployer wallet (main wallet)
      const context = this.umiKit.aiManager?.getContext();
      const deployerAddress = context?.defaultWallet;
      
      if (!deployerAddress) {
        throw new Error('No deployer wallet set. Please set a default wallet first.');
      }
      
      // Find the wallet object
      // This is a simplified version - you may need to adjust based on your wallet management
      const deployerWallet = this.umiKit.walletManager.wallets.find(w => 
        w.getAddress() === deployerAddress
      );
      
      if (!deployerWallet) {
        throw new Error('Deployer wallet not found in wallet manager');
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
        name,
        symbol,
        decimals,
        initialSupply,
        contractAddress: result.contractAddress,
        transactionHash: result.hash,
        message: `Token "${name}" (${symbol}) created successfully!`
      };
      
    } catch (error) {
      throw new Error(`Failed to create ERC-20 token: ${error.message}`);
    }
  }

  // ====== NFT FUNCTIONS ======

  /**
   * Create NFT collection
   */
  async createNFTCollection({ name, symbol, maxSupply, mintPrice = "0.01" }) {
    try {
      console.log(`🎨 Creating NFT collection: ${name} (${symbol})`);
      
      // Get deployer wallet (main wallet)
      const context = this.umiKit.aiManager?.getContext();
      const deployerAddress = context?.defaultWallet;
      
      if (!deployerAddress) {
        throw new Error('No deployer wallet set. Please set a default wallet first.');
      }
      
      // Find the wallet object
      const deployerWallet = this.umiKit.walletManager.wallets.find(w => 
        w.getAddress() === deployerAddress
      );
      
      if (!deployerWallet) {
        throw new Error('Deployer wallet not found in wallet manager');
      }
      
      const result = await this.umiKit.createNFTCollection({
        deployerWallet,
        name,
        symbol,
        maxSupply,
        mintPrice
      });
      
      return {
        success: true,
        name,
        symbol,
        maxSupply,
        mintPrice,
        contractAddress: result.contractAddress,
        transactionHash: result.hash,
        message: `NFT collection "${name}" (${symbol}) created successfully!`
      };
      
    } catch (error) {
      throw new Error(`Failed to create NFT collection: ${error.message}`);
    }
  }

  // ====== WALLET CREATION ======

  /**
   * Create a new wallet
   */
  async createWallet({ label = "" }) {
    try {
      console.log(`👛 Creating new wallet${label ? ` (${label})` : ''}`);
      
      const wallet = this.umiKit.createWallet();
      
      return {
        success: true,
        address: wallet.getAddress(),
        moveAddress: wallet.getMoveAddress(),
        label: label || 'New Wallet',
        message: `New wallet created successfully! Address: ${wallet.getAddress()}`
      };
      
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }
}