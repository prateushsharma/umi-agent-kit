import { ethers } from 'ethers';
import { UmiWallet } from './UmiWallet.js';

export class WalletManager {
  constructor(client) {
    this.client = client;
    this.wallets = new Map(); // Store wallets by address
  }

  /**
   * Create a new random wallet
   */
  createWallet() {
    const wallet = ethers.Wallet.createRandom();
    const umiWallet = new UmiWallet(wallet.privateKey, this.client);
    
    // Store wallet for easy access
    this.wallets.set(umiWallet.address, umiWallet);
    
    return umiWallet;
  }

  /**
   * Import wallet from private key
   */
  importWallet(privateKey) {
    if (!privateKey) {
      throw new Error('Private key is required');
    }

    try {
      const umiWallet = new UmiWallet(privateKey, this.client);
      this.wallets.set(umiWallet.address, umiWallet);
      return umiWallet;
    } catch (error) {
      throw new Error(`Failed to import wallet: ${error.message}`);
    }
  }

  /**
   * Import wallet from mnemonic phrase
   */
  importFromMnemonic(mnemonic, index = 0) {
    if (!mnemonic) {
      throw new Error('Mnemonic phrase is required');
    }

    try {
      const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
      const wallet = hdNode.deriveChild(index);
      const umiWallet = new UmiWallet(wallet.privateKey, this.client);
      
      this.wallets.set(umiWallet.address, umiWallet);
      return umiWallet;
    } catch (error) {
      throw new Error(`Failed to import from mnemonic: ${error.message}`);
    }
  }

  /**
   * Get wallet by address
   */
  getWallet(address) {
    return this.wallets.get(address);
  }

  /**
   * Get all managed wallets
   */
  getAllWallets() {
    return Array.from(this.wallets.values());
  }

  /**
   * Get wallet addresses
   */
  getWalletAddresses() {
    return Array.from(this.wallets.keys());
  }

  /**
   * Remove wallet from manager
   */
  removeWallet(address) {
    return this.wallets.delete(address);
  }

  /**
   * Clear all wallets
   */
  clearWallets() {
    this.wallets.clear();
  }

  /**
   * Get total balance across all wallets
   */
  async getTotalBalance() {
    const wallets = this.getAllWallets();
    let totalBalance = 0;

    for (const wallet of wallets) {
      try {
        const balance = await wallet.getBalance();
        totalBalance += parseFloat(balance);
      } catch (error) {
        console.warn(`Failed to get balance for ${wallet.address}: ${error.message}`);
      }
    }

    return totalBalance.toString();
  }

  /**
   * Generate a new mnemonic phrase
   */
  static generateMnemonic() {
    return ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16));
  }

  /**
   * Validate mnemonic phrase
   */
  static validateMnemonic(mnemonic) {
    try {
      ethers.HDNodeWallet.fromPhrase(mnemonic);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get wallet count
   */
  getWalletCount() {
    return this.wallets.size;
  }
}