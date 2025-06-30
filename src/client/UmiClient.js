import { createPublicClient, http, defineChain } from 'viem';
import { DEFAULT_CONFIG } from '../config.js';

export class UmiClient {
  constructor(config) {
    this.config = config;
    this.networkConfig = DEFAULT_CONFIG[config.network];
    
    if (!this.networkConfig) {
      throw new Error(`Unsupported network: ${config.network}`);
    }

    // Define Umi chain for Viem
    this.chain = defineChain({
      id: this.networkConfig.chainId,
      name: this.networkConfig.name,
      nativeCurrency: this.networkConfig.currency,
      rpcUrls: {
        default: {
          http: [config.rpcUrl || this.networkConfig.rpcUrl],
        },
      },
      blockExplorers: {
        default: {
          name: 'Umi Explorer',
          url: this.networkConfig.blockExplorer,
        },
      },
    });

    // Create public client for reading blockchain data
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(config.rpcUrl || this.networkConfig.rpcUrl)
    });
  }

  /**
   * Get balance for an address
   */
  async getBalance(address) {
    try {
      return await this.publicClient.getBalance({ address });
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash) {
    try {
      return await this.publicClient.getTransaction({ hash });
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash) {
    try {
      return await this.publicClient.getTransactionReceipt({ hash });
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(hash, confirmations = 1) {
    try {
      return await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations 
      });
    } catch (error) {
      throw new Error(`Failed to wait for transaction: ${error.message}`);
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber() {
    try {
      return await this.publicClient.getBlockNumber();
    } catch (error) {
      throw new Error(`Failed to get block number: ${error.message}`);
    }
  }

  /**
   * Get gas price
   */
  async getGasPrice() {
    try {
      return await this.publicClient.getGasPrice();
    } catch (error) {
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }

  /**
   * Call a contract function (read-only)
   */
  async call(params) {
    try {
      return await this.publicClient.call(params);
    } catch (error) {
      throw new Error(`Contract call failed: ${error.message}`);
    }
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      network: this.config.network,
      chainId: this.networkConfig.chainId,
      rpcUrl: this.config.rpcUrl || this.networkConfig.rpcUrl,
      explorer: this.networkConfig.blockExplorer
    };
  }
}