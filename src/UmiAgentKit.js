import { UmiClient } from './client/UmiClient.js';
import { WalletManager } from './wallet/WalletManager.js';
import { TransferManager } from './transfer/TransferManager.js';
import { validateConfig } from './config.js';
import { parseEther } from 'viem';

export class UmiAgentKit {
  constructor(config = {}) {
    // Set default config
    this.config = {
      network: 'devnet',
      ...config
    };

    // Validate configuration
    validateConfig(this.config);

    // Initialize client
    this.client = new UmiClient(this.config);
    
    // Initialize wallet manager
    this.walletManager = new WalletManager(this.client);

    // Initialize transfer manager
    this.transferManager = new TransferManager(this.client, this.client.chain);

    console.log(`UmiAgentKit initialized on ${this.config.network}`);
  }

  /**
   * Create a new wallet
   */
  createWallet() {
    return this.walletManager.createWallet();
  }

  /**
   * Import wallet from private key
   */
  importWallet(privateKey) {
    return this.walletManager.importWallet(privateKey);
  }

  /**
   * Import wallet from mnemonic
   */
  importFromMnemonic(mnemonic, index = 0) {
    return this.walletManager.importFromMnemonic(mnemonic, index);
  }

  /**
   * Get wallet by address
   */
  getWallet(address) {
    return this.walletManager.getWallet(address);
  }

  /**
   * Get all wallets
   */
  getAllWallets() {
    return this.walletManager.getAllWallets();
  }

  /**
   * Get balance for specific address
   */
  async getBalance(address) {
    return await this.client.getBalance(address);
  }

  /**
   * Get formatted balance in ETH
   */
  async getFormattedBalance(address) {
    const balance = await this.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash) {
    return await this.client.getTransaction(hash);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(hash, confirmations = 1) {
    return await this.client.waitForTransaction(hash, confirmations);
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return this.client.getNetworkInfo();
  }

  /**
   * Get current block number
   */
  async getBlockNumber() {
    return await this.client.getBlockNumber();
  }

  /**
   * Get gas price
   */
  async getGasPrice() {
    return await this.client.getGasPrice();
  }

  /**
   * Generate new mnemonic
   */
  generateMnemonic() {
    return WalletManager.generateMnemonic();
  }

  /**
   * Validate mnemonic
   */
  validateMnemonic(mnemonic) {
    return WalletManager.validateMnemonic(mnemonic);
  }

  /**
   * Send ETH from wallet to another address
   */
  async sendETH({ fromWallet, to, amount, gasLimit, gasPrice }) {
    if (!fromWallet) {
      throw new Error('From wallet is required');
    }
    
    return await this.transferManager.sendETH({
      fromPrivateKey: fromWallet.exportPrivateKey(),
      to,
      amount,
      gasLimit,
      gasPrice
    });
  }

  /**
   * Send ETH using private key directly
   */
  async sendETHWithPrivateKey({ fromPrivateKey, to, amount, gasLimit, gasPrice }) {
    return await this.transferManager.sendETH({
      fromPrivateKey,
      to,
      amount,
      gasLimit,
      gasPrice
    });
  }

  /**
   * Check if wallet has enough balance for transfer
   */
  async checkBalance({ address, amount, includeGas = true }) {
    return await this.transferManager.checkBalance({ address, amount, includeGas });
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(hash, confirmations = 1) {
    return await this.transferManager.waitForConfirmation(hash, confirmations);
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(hash) {
    return await this.transferManager.getTransactionStatus(hash);
  }

  /**
   * Calculate transaction cost
   */
  async calculateTransactionCost(amount) {
    return await this.transferManager.calculateTransactionCost(amount);
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas({ from, to, amount }) {
    const value = parseEther(amount.toString());
    return await this.transferManager.estimateGas({ from, to, value });
  }

  /**
   * Get total balance across all managed wallets
   */
  async getTotalBalance() {
    return await this.walletManager.getTotalBalance();
  }

  /**
   * Get summary of the kit
   */
  async getSummary() {
    const networkInfo = this.getNetworkInfo();
    const walletCount = this.walletManager.getWalletCount();
    const totalBalance = walletCount > 0 ? await this.getTotalBalance() : '0';

    return {
      network: networkInfo.network,
      chainId: networkInfo.chainId,
      rpcUrl: networkInfo.rpcUrl,
      walletCount,
      totalBalance: `${totalBalance} ETH`,
      wallets: this.walletManager.getWalletAddresses()
    };
  }

  /**
   * Close and cleanup
   */
  close() {
    this.walletManager.clearWallets();
    console.log('UmiAgentKit closed');
  }
}