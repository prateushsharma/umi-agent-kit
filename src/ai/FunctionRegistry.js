/**
 * File: src/ai/FunctionRegistry.js
 * 
 * Registry of all blockchain functions available to the AI
 * INCLUDING MULTISIG FUNCTIONS
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
    // ====== WALLET FUNCTIONS ======
    
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

    // ====== NEW: MULTISIG FUNCTIONS ======

    // Create multisig group
    this.registerFunction('create_multisig_group', {
      description: 'Create a multisig group for team coordination with threshold voting',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the multisig group'
          },
          memberCount: {
            type: 'integer',
            description: 'Number of team members (will create wallets automatically)',
            minimum: 2,
            maximum: 10
          },
          threshold: {
            type: 'integer',
            description: 'Number of approvals required (e.g., 4 out of 7)'
          },
          description: {
            type: 'string',
            description: 'Description of the multisig purpose'
          },
          roles: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of roles for members (e.g., ["ceo", "developer", "artist"])'
          }
        },
        required: ['name', 'memberCount', 'threshold']
      },
      execute: this.aiWrapper.createMultisigGroup.bind(this.aiWrapper)
    });

    // Create gaming studio multisig
    this.registerFunction('create_gaming_studio', {
      description: 'Create a gaming studio multisig with predefined gaming roles',
      parameters: {
        type: 'object',
        properties: {
          studioName: {
            type: 'string',
            description: 'Name of the gaming studio'
          },
          teamSize: {
            type: 'integer',
            description: 'Number of team members (will create wallets automatically)',
            minimum: 3,
            maximum: 10
          }
        },
        required: ['studioName', 'teamSize']
      },
      execute: this.aiWrapper.createGamingStudio.bind(this.aiWrapper)
    });

    // Create team wallets
    this.registerFunction('create_team_wallets', {
      description: 'Create multiple wallets for a team',
      parameters: {
        type: 'object',
        properties: {
          count: {
            type: 'integer',
            description: 'Number of wallets to create',
            minimum: 2,
            maximum: 15
          },
          roles: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of roles for the wallets (e.g., ["developer", "artist", "ceo"])'
          }
        },
        required: ['count']
      },
      execute: this.aiWrapper.createTeamWallets.bind(this.aiWrapper)
    });

    // List multisig groups
    this.registerFunction('list_multisig_groups', {
      description: 'List all multisig groups',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      execute: this.aiWrapper.listMultisigGroups.bind(this.aiWrapper)
    });

    // ====== TOKEN FUNCTIONS ======

    // Create ERC-20 token
    this.registerFunction('create_erc20_token', {
      description: 'Create a new ERC-20 token',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Token name (e.g., "GameCoin")'
          },
          symbol: {
            type: 'string',
            description: 'Token symbol (e.g., "GAME")'
          },
          decimals: {
            type: 'integer',
            description: 'Token decimals (usually 18)',
            default: 18
          },
          initialSupply: {
            type: 'integer',
            description: 'Initial token supply (e.g., 1000000)'
          }
        },
        required: ['name', 'symbol', 'initialSupply']
      },
      execute: this.aiWrapper.createERC20Token.bind(this.aiWrapper)
    });

    // ====== NFT FUNCTIONS ======

    // Create NFT collection
    this.registerFunction('create_nft_collection', {
      description: 'Create a new NFT collection',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Collection name (e.g., "Epic Heroes")'
          },
          symbol: {
            type: 'string',
            description: 'Collection symbol (e.g., "HERO")'
          },
          maxSupply: {
            type: 'integer',
            description: 'Maximum number of NFTs (e.g., 10000)'
          },
          mintPrice: {
            type: 'string',
            description: 'Mint price in ETH (e.g., "0.01")'
          }
        },
        required: ['name', 'symbol', 'maxSupply']
      },
      execute: this.aiWrapper.createNFTCollection.bind(this.aiWrapper)
    });

    // ====== WALLET CREATION ======

    // Create new wallet
    this.registerFunction('create_wallet', {
      description: 'Create a new wallet',
      parameters: {
        type: 'object',
        properties: {
          label: {
            type: 'string',
            description: 'Optional label for the wallet'
          }
        },
        required: []
      },
      execute: this.aiWrapper.createWallet.bind(this.aiWrapper)
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