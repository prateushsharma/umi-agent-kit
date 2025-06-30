import { createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export class TransferManager {
  constructor(client, chain) {
    this.client = client;
    this.chain = chain;
  }

  /**
   * Send ETH from one wallet to another
   */
  async sendETH({ fromPrivateKey, to, amount, gasLimit, gasPrice }) {
    try {
      // Validate inputs
      if (!fromPrivateKey) throw new Error('Private key is required');
      if (!to) throw new Error('Recipient address is required');
      if (!amount) throw new Error('Amount is required');

      // Create account from private key
      const account = privateKeyToAccount(fromPrivateKey);
      
      // Create wallet client for sending transactions
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.client.networkConfig.rpcUrl)
      });

      // Get current gas price if not provided
      if (!gasPrice) {
        gasPrice = await this.client.getGasPrice();
      }

      // Estimate gas if not provided
      if (!gasLimit) {
        gasLimit = await this.estimateGas({
          from: account.address,
          to,
          value: parseEther(amount.toString())
        });
      }

      // Send transaction
      const hash = await walletClient.sendTransaction({
        to,
        value: parseEther(amount.toString()),
        gas: gasLimit,
        gasPrice: gasPrice
      });

      return {
        hash,
        from: account.address,
        to,
        amount: amount.toString(),
        status: 'pending'
      };

    } catch (error) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas({ from, to, value }) {
    try {
      const gas = await this.client.publicClient.estimateGas({
        account: from,
        to,
        value
      });
      
      // Add 20% buffer for safety
      return gas + (gas * 20n / 100n);
    } catch (error) {
      // Fallback to default gas limit
      console.warn('Gas estimation failed, using default:', error.message);
      return 21000n; // Standard ETH transfer gas
    }
  }

  /**
   * Get current gas price with priority fee
   */
  async getGasPrice() {
    try {
      const gasPrice = await this.client.getGasPrice();
      
      // Add small priority fee (10% more)
      return gasPrice + (gasPrice * 10n / 100n);
    } catch (error) {
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }

  /**
   * Check if address has enough balance for transfer
   */
  async checkBalance({ address, amount, includeGas = true }) {
    try {
      const balance = await this.client.getBalance(address);
      const requiredAmount = parseEther(amount.toString());
      
      if (includeGas) {
        const gasPrice = await this.getGasPrice();
        const gasLimit = 21000n; // Standard ETH transfer
        const gasCost = gasPrice * gasLimit;
        const totalRequired = requiredAmount + gasCost;
        
        return {
          hasEnough: balance >= totalRequired,
          balance: formatEther(balance),
          required: formatEther(totalRequired),
          gasCost: formatEther(gasCost)
        };
      }
      
      return {
        hasEnough: balance >= requiredAmount,
        balance: formatEther(balance),
        required: formatEther(requiredAmount),
        gasCost: '0'
      };
    } catch (error) {
      throw new Error(`Balance check failed: ${error.message}`);
    }
  }

  /**
   * Wait for transaction confirmation and return receipt
   */
  async waitForConfirmation(hash, confirmations = 1) {
    try {
      const receipt = await this.client.waitForTransaction(hash, confirmations);
      
      return {
        hash: receipt.transactionHash,
        status: receipt.status === 'success' ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        confirmations
      };
    } catch (error) {
      throw new Error(`Failed to confirm transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(hash) {
    try {
      const receipt = await this.client.getTransactionReceipt(hash);
      const transaction = await this.client.getTransaction(hash);
      
      return {
        hash,
        status: receipt.status === 'success' ? 'confirmed' : 'failed',
        from: transaction.from,
        to: transaction.to,
        amount: formatEther(transaction.value),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: transaction.gasPrice?.toString() || '0',
        blockNumber: receipt.blockNumber.toString()
      };
    } catch (error) {
      // Transaction might be pending
      try {
        await this.client.getTransaction(hash);
        return {
          hash,
          status: 'pending'
        };
      } catch {
        return {
          hash,
          status: 'not_found'
        };
      }
    }
  }

  /**
   * Calculate transaction cost
   */
  async calculateTransactionCost(amount) {
    try {
      const gasPrice = await this.getGasPrice();
      const gasLimit = 21000n; // Standard ETH transfer
      const gasCost = gasPrice * gasLimit;
      const totalCost = parseEther(amount.toString()) + gasCost;
      
      return {
        amount: amount.toString(),
        gasCost: formatEther(gasCost),
        totalCost: formatEther(totalCost),
        gasPrice: gasPrice.toString(),
        gasLimit: gasLimit.toString()
      };
    } catch (error) {
      throw new Error(`Cost calculation failed: ${error.message}`);
    }
  }
}