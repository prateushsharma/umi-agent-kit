/**
 * File: src/ai/FunctionRegistry.js
 * 
 * Registry of all blockchain functions available to the AI
 * Starting with balance checking functionality
 */

export class FunctionRegistry {
  constructor(aiWrapper) {
    this.aiWrapper = aiWrapper;
    this.functions = new Map();
    
    // Register all available functions
    this._registerCoreFunctions();
    
    console.log(`🔧 Function registry initialized with ${this.functions.size} functions`);
  }

  /**
   * Register core blockchain functions
   */
  _registerCoreFunctions() {
    // Wallet balance checking
    this.registerFunction('get_wallet_balance', {
      description: 'Get the ETH balance of a wallet address',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Wallet address to check (0x... format) or "my" for default wallet'
          }
        },
        required: ['address']
      },
      execute: this.aiWrapper.getWalletBalance.bind(this.aiWrapper)
    });

    // Network information
    this.registerFunction('get_network_info', {
      description: 'Get current network information (devnet/mainnet, chain ID, etc.)',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      execute: this.aiWrapper.getNetworkInfo.bind(this.aiWrapper)
    });

    // List managed wallets
    this.registerFunction('list_wallets', {
      description: 'List all wallets managed by UmiAgentKit with their balances',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      execute: this.aiWrapper.listWallets.bind(this.aiWrapper)
    });

    // Get current gas price
    this.registerFunction('get_gas_price', {
      description: 'Get current gas price on the network',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      execute: this.aiWrapper.getGasPrice.bind(this.aiWrapper)
    });

    // Get block number
    this.registerFunction('get_block_number', {
      description: 'Get the latest block number on the network',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      execute: this.aiWrapper.getBlockNumber.bind(this.aiWrapper)
    });
  }

  /**
   * Register a new function
   */
  registerFunction(name, config) {
    this.functions.set(name, {
      name,
      description: config.description,
      parameters: config.parameters,
      execute: config.execute
    });
  }

  /**
   * Get all functions in Groq-compatible format
   */
  getAvailableFunctions() {
    return Array.from(this.functions.values()).map(func => ({
      type: 'function',
      function: {
        name: func.name,
        description: func.description,
        parameters: func.parameters
      }
    }));
  }

  /**
   * Execute a specific function
   */
  async executeFunction(name, args) {
    const func = this.functions.get(name);
    if (!func) {
      throw new Error(`Function ${name} not found`);
    }

    try {
      console.log(`⚡ Executing function: ${name}`, args);
      const result = await func.execute(args);
      console.log(`✅ Function result:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Function execution failed: ${name}`, error);
      throw error;
    }
  }

  /**
   * Get function by name
   */
  getFunction(name) {
    return this.functions.get(name);
  }

  /**
   * List all available function names
   */
  listFunctions() {
    return Array.from(this.functions.keys());
  }

  /**
   * Get functions by category (for future organization)
   */
  getFunctionsByCategory(category) {
    // Future enhancement: categorize functions
    return this.getAvailableFunctions();
  }
}