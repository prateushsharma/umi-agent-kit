/**
 * File: src/ai/UmiAIWrapper.js
 * 
 * Wrapper around UmiAgentKit functionality specifically designed for AI consumption
 * Handles address resolution, validation, and user-friendly responses
 */

import { formatEther } from 'viem';

export class UmiAIWrapper {
  constructor(umiKit) {
    this.umiKit = umiKit;
    this.defaultWallet = null; // User can set their default wallet
    
    console.log('🔗 UmiAIWrapper initialized');
  }

  /**
   * Set default wallet for "my wallet" references
   */
  setDefaultWallet(address) {
    // Validate address format
    if (!address.startsWith('0x') || address.length !== 42) {
      throw new Error('Invalid wallet address format. Expected 0x followed by 40 hex characters.');
    }
    
    this.defaultWallet = address;
    console.log(`📌 Default wallet set: ${address}`);
  }

  /**
   * Get default wallet or prompt user to set one
   */
  getDefaultWallet() {
    if (!this.defaultWallet) {
      // Try to get first managed wallet
      const wallets = this.umiKit.getAllWallets();
      if (wallets.length > 0) {
        this.defaultWallet = wallets[0].getAddress();
        console.log(`🎯 Auto-selected default wallet: ${this.defaultWallet}`);
      }
    }
    return this.defaultWallet;
  }

  /**
   * Resolve address from user input
   * Handles: "my", "0x123...", or attempts to find by partial match
   */
  _resolveAddress(addressInput) {
    if (!addressInput) {
      throw new Error('Address is required');
    }

    // Handle "my wallet" references
    if (addressInput.toLowerCase() === 'my' || addressInput.toLowerCase() === 'mine') {
      const defaultAddr = this.getDefaultWallet();
      if (!defaultAddr) {
        throw new Error('No default wallet set. Please provide a specific address or import a wallet first.');
      }
      return defaultAddr;
    }

    // Handle full address
    if (addressInput.startsWith('0x') && addressInput.length === 42) {
      return addressInput;
    }

    // Handle partial address - try to find in managed wallets
    if (addressInput.startsWith('0x') && addressInput.length < 42) {
      const wallets = this.umiKit.getAllWallets();
      const matches = wallets.filter(w => 
        w.getAddress().toLowerCase().startsWith(addressInput.toLowerCase())
      );
      
      if (matches.length === 1) {
        return matches[0].getAddress();
      } else if (matches.length > 1) {
        throw new Error(`Ambiguous address "${addressInput}" matches multiple wallets: ${matches.map(w => w.getAddress()).join(', ')}`);
      }
    }

    throw new Error(`Invalid address format: "${addressInput}". Expected full address (0x...) or "my" for default wallet.`);
  }

  /**
   * Get wallet balance with user-friendly formatting
   */
  async getWalletBalance(args) {
    try {
      const address = this._resolveAddress(args.address);
      
      console.log(`💰 Checking balance for: ${address}`);
      
      // Get balance from UmiAgentKit
      const balanceWei = await this.umiKit.getBalance(address);
      const balanceEth = formatEther(balanceWei);
      
      // Check if this is a managed wallet
      const wallet = this.umiKit.getWallet(address);
      const isManaged = wallet !== null;
      
      return {
        address,
        balance: balanceEth,
        balanceWei: balanceWei.toString(),
        isManaged,
        network: this.umiKit.getNetworkInfo().network
      };
      
    } catch (error) {
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo(args = {}) {
    try {
      const networkInfo = this.umiKit.getNetworkInfo();
      const blockNumber = await this.umiKit.getBlockNumber();
      
      return {
        network: networkInfo.network,
        chainId: networkInfo.chainId,
        rpcUrl: networkInfo.rpcUrl,
        blockExplorer: networkInfo.explorer,
        currentBlock: blockNumber.toString(),
        connected: true
      };
      
    } catch (error) {
      throw new Error(`Failed to get network info: ${error.message}`);
    }
  }

  /**
   * List all managed wallets with balances
   */
  async listWallets(args = {}) {
    try {
      const wallets = this.umiKit.getAllWallets();
      
      if (wallets.length === 0) {
        return {
          wallets: [],
          count: 0,
          message: 'No wallets are currently managed. Create or import a wallet to get started.'
        };
      }

      // Get balances for all wallets
      const walletsWithBalances = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            const balanceWei = await this.umiKit.getBalance(wallet.getAddress());
            const balanceEth = formatEther(balanceWei);
            
            return {
              address: wallet.getAddress(),
              moveAddress: wallet.getMoveAddress(),
              balance: balanceEth,
              balanceWei: balanceWei.toString(),
              isDefault: wallet.getAddress() === this.defaultWallet
            };
          } catch (error) {
            return {
              address: wallet.getAddress(),
              moveAddress: wallet.getMoveAddress(),
              balance: 'Error',
              balanceWei: '0',
              error: error.message,
              isDefault: wallet.getAddress() === this.defaultWallet
            };
          }
        })
      );

      return {
        wallets: walletsWithBalances,
        count: wallets.length,
        defaultWallet: this.defaultWallet
      };
      
    } catch (error) {
      throw new Error(`Failed to list wallets: ${error.message}`);
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(args = {}) {
    try {
      const gasPriceWei = await this.umiKit.getGasPrice();
      const gasPriceGwei = formatEther(gasPriceWei * 1000000000n); // Convert to Gwei
      
      return {
        gasPriceWei: gasPriceWei.toString(),
        gasPriceGwei: gasPriceGwei,
        network: this.umiKit.getNetworkInfo().network
      };
      
    } catch (error) {
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(args = {}) {
    try {
      const blockNumber = await this.umiKit.getBlockNumber();
      
      return {
        blockNumber: blockNumber.toString(),
        network: this.umiKit.getNetworkInfo().network
      };
      
    } catch (error) {
      throw new Error(`Failed to get block number: ${error.message}`);
    }
  }

  /**
   * Import wallet from private key (AI-safe with validation)
   */
  async importWallet(args) {
    try {
      const { privateKey, setAsDefault = true } = args;
      
      if (!privateKey) {
        throw new Error('Private key is required');
      }

      // Validate private key format
      if (!privateKey.startsWith('0x') && privateKey.length !== 64 && privateKey.length !== 66) {
        throw new Error('Invalid private key format. Expected 64 hex characters (with or without 0x prefix)');
      }

      // Import wallet using UmiAgentKit
      const wallet = this.umiKit.importWallet(privateKey);
      
      // Set as default if requested
      if (setAsDefault) {
        this.setDefaultWallet(wallet.getAddress());
      }

      // Get initial balance
      const balanceWei = await this.umiKit.getBalance(wallet.getAddress());
      const balanceEth = formatEther(balanceWei);

      return {
        address: wallet.getAddress(),
        moveAddress: wallet.getMoveAddress(),
        balance: balanceEth,
        balanceWei: balanceWei.toString(),
        isDefault: setAsDefault,
        imported: true
      };
      
    } catch (error) {
      throw new Error(`Failed to import wallet: ${error.message}`);
    }
  }

  /**
   * Create new wallet
   */
  async createWallet(args = {}) {
    try {
      const { setAsDefault = true } = args;
      
      // Create wallet using UmiAgentKit
      const wallet = this.umiKit.createWallet();
      
      // Set as default if requested
      if (setAsDefault) {
        this.setDefaultWallet(wallet.getAddress());
      }

      // Get initial balance (should be 0)
      const balanceWei = await this.umiKit.getBalance(wallet.getAddress());
      const balanceEth = formatEther(balanceWei);

      return {
        address: wallet.getAddress(),
        moveAddress: wallet.getMoveAddress(),
        balance: balanceEth,
        balanceWei: balanceWei.toString(),
        isDefault: setAsDefault,
        created: true,
        warning: 'New wallet created with 0 balance. You may need to fund it before making transactions.'
      };
      
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }
}