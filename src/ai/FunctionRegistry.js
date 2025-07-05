

export class FunctionRegistry {
  constructor(aiWrapper) {
    this.aiWrapper = aiWrapper;
    this.functions = new Map();
    
    // Register all available functions
    this._registerCoreFunctions();
    this._registerMultisigFunctions();
    this._registerMultiContractFunctions();
    this._registerGamingFunctions();
    
    console.log(`📋 Function Registry initialized with ${this.functions.size} functions`);
  }

  /**
   * Register a function for AI use
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
   * Get all available functions in OpenAI function format
   */
  getAvailableFunctions() {
    return Array.from(this.functions.values()).map(func => ({
      type: "function",
      function: {
        name: func.name,
        description: func.description,
        parameters: func.parameters
      }
    }));
  }

  /**
   * Execute a function by name
   */
  async executeFunction(name, parameters) {
    const func = this.functions.get(name);
    if (!func) {
      throw new Error(`Function not found: ${name}`);
    }

    try {
      return await func.execute(parameters);
    } catch (error) {
      console.error(`Function execution failed for ${name}:`, error);
      throw error;
    }
  }

  /**
   * Register core blockchain functions
   */
  _registerCoreFunctions() {
    // Get wallet balance
    this.registerFunction('get_wallet_balance', {
      description: 'Get the ETH balance of a wallet address',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Wallet address to check balance for, or "my" for default wallet'
          }
        },
        required: ['address']
      },
      execute: this.aiWrapper.getWalletBalance.bind(this.aiWrapper)
    });

    // Get network info
    this.registerFunction('get_network_info', {
      description: 'Get information about the current blockchain network',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      execute: this.aiWrapper.getNetworkInfo.bind(this.aiWrapper)
    });

    // List wallets
    this.registerFunction('list_wallets', {
      description: 'List all wallets managed by UmiAgentKit with their balances',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      execute: this.aiWrapper.listWallets.bind(this.aiWrapper)
    });

    // Get gas price
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

    // Send ETH
    this.registerFunction('send_eth', {
      description: 'Send ETH from one wallet to another',
      parameters: {
        type: 'object',
        properties: {
          fromAddress: {
            type: 'string',
            description: 'Sender wallet address'
          },
          toAddress: {
            type: 'string',
            description: 'Recipient wallet address'
          },
          amount: {
            type: 'string',
            description: 'Amount of ETH to send (e.g., "0.1")'
          }
        },
        required: ['fromAddress', 'toAddress', 'amount']
      },
      execute: this.aiWrapper.sendETH.bind(this.aiWrapper)
    });

    // Create ERC-20 token
    this.registerFunction('create_erc20_token', {
      description: 'Create a new ERC-20 token contract',
      parameters: {
        type: 'object',
        properties: {
          deployerAddress: {
            type: 'string',
            description: 'Wallet address to deploy from'
          },
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
            description: 'Number of decimals (default: 18)',
            default: 18
          },
          initialSupply: {
            type: 'integer',
            description: 'Initial token supply'
          }
        },
        required: ['deployerAddress', 'name', 'symbol', 'initialSupply']
      },
      execute: this.aiWrapper.createERC20Token.bind(this.aiWrapper)
    });

    // Create Move token
    this.registerFunction('create_move_token', {
      description: 'Create a new Move token contract',
      parameters: {
        type: 'object',
        properties: {
          deployerAddress: {
            type: 'string',
            description: 'Wallet address to deploy from'
          },
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
            description: 'Number of decimals (default: 8)',
            default: 8
          },
          initialSupply: {
            type: 'integer',
            description: 'Initial token supply'
          }
        },
        required: ['deployerAddress', 'name', 'symbol', 'initialSupply']
      },
      execute: this.aiWrapper.createMoveToken.bind(this.aiWrapper)
    });

    // Create ERC-721 NFT collection
    this.registerFunction('create_erc721_collection', {
      description: 'Create a new ERC-721 NFT collection',
      parameters: {
        type: 'object',
        properties: {
          deployerAddress: {
            type: 'string',
            description: 'Wallet address to deploy from'
          },
          name: {
            type: 'string',
            description: 'Collection name (e.g., "Epic Heroes")'
          },
          symbol: {
            type: 'string',
            description: 'Collection symbol (e.g., "HERO")'
          },
          baseURI: {
            type: 'string',
            description: 'Base URI for metadata',
            default: ''
          },
          maxSupply: {
            type: 'integer',
            description: 'Maximum number of NFTs',
            default: 10000
          }
        },
        required: ['deployerAddress', 'name', 'symbol']
      },
      execute: this.aiWrapper.createERC721Collection.bind(this.aiWrapper)
    });

    // Create Move NFT collection
    this.registerFunction('create_move_nft_collection', {
      description: 'Create a new Move NFT collection',
      parameters: {
        type: 'object',
        properties: {
          deployerAddress: {
            type: 'string',
            description: 'Wallet address to deploy from'
          },
          name: {
            type: 'string',
            description: 'Collection name (e.g., "Epic Heroes")'
          },
          symbol: {
            type: 'string',
            description: 'Collection symbol (e.g., "HERO")'
          },
          description: {
            type: 'string',
            description: 'Collection description',
            default: ''
          },
          maxSupply: {
            type: 'integer',
            description: 'Maximum number of NFTs',
            default: 10000
          }
        },
        required: ['deployerAddress', 'name', 'symbol']
      },
      execute: this.aiWrapper.createMoveNFTCollection.bind(this.aiWrapper)
    });
    this.registerFunction('get_transaction_history', {
  description: 'Get transaction history for a wallet address',
  parameters: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Wallet address to get history for, or "my" for default wallet'
      },
      limit: {
        type: 'integer',
        description: 'Number of transactions to return (default: 10)',
        default: 10,
        minimum: 1,
        maximum: 50
      }
    },
    required: ['address']
  },
  execute: this.aiWrapper.getTransactionHistory.bind(this.aiWrapper)
});

// Get recent transactions from AI memory
this.registerFunction('get_recent_transactions', {
  description: 'Get recent transactions from this AI session memory',
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        description: 'Number of recent transactions to return (default: 10)',
        default: 10,
        minimum: 1,
        maximum: 20
      }
    },
    required: []
  },
  execute: this.aiWrapper.getRecentTransactions.bind(this.aiWrapper)
});

// Get balance history from AI memory
this.registerFunction('get_balance_history', {
  description: 'Get balance history from this AI session memory',
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        description: 'Number of balance records to return (default: 10)',
        default: 10,
        minimum: 1,
        maximum: 20
      }
    },
    required: []
  },
  execute: this.aiWrapper.getBalanceHistory.bind(this.aiWrapper)
});

// Update the existing send_eth function to use the new tracking version
this.registerFunction('send_eth', {
  description: 'Send ETH from one wallet to another with transaction tracking',
  parameters: {
    type: 'object',
    properties: {
      fromAddress: {
        type: 'string',
        description: 'Sender wallet address'
      },
      toAddress: {
        type: 'string',
        description: 'Recipient wallet address (use 0x0000000000000000000000000000000000000000 to burn ETH)'
      },
      amount: {
        type: 'string',
        description: 'Amount of ETH to send (e.g., "0.1")'
      }
    },
    required: ['fromAddress', 'toAddress', 'amount']
  },
  execute: this.aiWrapper.sendETH.bind(this.aiWrapper)
});
  }

  /**
   * Register multisig functions
   */
  _registerMultisigFunctions() {
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
            description: 'Description of the group purpose',
            default: ''
          }
        },
        required: ['name', 'memberCount', 'threshold']
      },
      execute: this.aiWrapper.createMultisigGroup.bind(this.aiWrapper)
    });

    // List multisig groups
    this.registerFunction('list_multisig_groups', {
      description: 'List all multisig groups and their status',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      execute: this.aiWrapper.listMultisigGroups.bind(this.aiWrapper)
    });

    // Create proposal
    this.registerFunction('create_proposal', {
      description: 'Create a new proposal in a multisig group',
      parameters: {
        type: 'object',
        properties: {
          groupId: {
            type: 'string',
            description: 'ID of the multisig group'
          },
          title: {
            type: 'string',
            description: 'Proposal title'
          },
          description: {
            type: 'string',
            description: 'Detailed proposal description'
          },
          action: {
            type: 'string',
            description: 'Action to execute (e.g., "transfer", "deploy_contract")'
          },
          parameters: {
            type: 'object',
            description: 'Parameters for the action',
            properties: {}
          }
        },
        required: ['groupId', 'title', 'description', 'action']
      },
      execute: this.aiWrapper.createProposal.bind(this.aiWrapper)
    });

    // Vote on proposal
    this.registerFunction('vote_on_proposal', {
      description: 'Vote on a multisig proposal',
      parameters: {
        type: 'object',
        properties: {
          proposalId: {
            type: 'string',
            description: 'ID of the proposal'
          },
          memberIndex: {
            type: 'integer',
            description: 'Index of the voting member (0-based)'
          },
          vote: {
            type: 'boolean',
            description: 'Vote: true for approve, false for reject'
          },
          reason: {
            type: 'string',
            description: 'Reason for the vote',
            default: ''
          }
        },
        required: ['proposalId', 'memberIndex', 'vote']
      },
      execute: this.aiWrapper.voteOnProposal.bind(this.aiWrapper)
    });
  }

  /**
   * Register multi-contract deployment and interaction functions
   */
  _registerMultiContractFunctions() {
    // Deploy contracts from folder
    this.registerFunction('deploy_contracts_from_folder', {
      description: 'Deploy multiple smart contracts from a folder with dependency resolution',
      parameters: {
        type: 'object',
        properties: {
          contractsPath: {
            type: 'string',
            description: 'Path to folder containing contract files (.move files)'
          },
          walletAddress: {
            type: 'string',
            description: 'Wallet address to deploy contracts from'
          },
          deploymentType: {
            type: 'string',
            enum: ['module_only', 'with_json', 'with_config'],
            description: 'Type of deployment: module_only (deploy now, init later), with_json (use deployment.json), with_config (use provided config)',
            default: 'module_only'
          },
          config: {
            type: 'object',
            description: 'Configuration object for with_config deployment type',
            properties: {},
            default: {}
          }
        },
        required: ['contractsPath', 'walletAddress']
      },
      execute: this.aiWrapper.deployContractsFromFolder.bind(this.aiWrapper)
    });

    // Get deployed contracts
    this.registerFunction('get_deployed_contracts', {
      description: 'Get all contracts deployed by a user wallet',
      parameters: {
        type: 'object',
        properties: {
          walletAddress: {
            type: 'string',
            description: 'Wallet address to find deployed contracts for'
          }
        },
        required: ['walletAddress']
      },
      execute: this.aiWrapper.getDeployedContracts.bind(this.aiWrapper)
    });

    // Call contract function
    this.registerFunction('call_contract_function', {
      description: 'Call any function on any deployed smart contract',
      parameters: {
        type: 'object',
        properties: {
          contractAddress: {
            type: 'string',
            description: 'Address of the deployed contract'
          },
          functionName: {
            type: 'string',
            description: 'Name of the function to call'
          },
          parameters: {
            type: 'array',
            description: 'Array of parameters to pass to the function',
            items: {},
            default: []
          },
          walletAddress: {
            type: 'string',
            description: 'Wallet address to call from (for write operations)'
          },
          isReadOnly: {
            type: 'boolean',
            description: 'Whether this is a read-only operation (view function)',
            default: false
          }
        },
        required: ['contractAddress', 'functionName']
      },
      execute: this.aiWrapper.callContractFunction.bind(this.aiWrapper)
    });

    // Execute multi-contract operation
    this.registerFunction('execute_multi_contract_operation', {
      description: 'Execute complex operations across multiple smart contracts (gaming ecosystems)',
      parameters: {
        type: 'object',
        properties: {
          operationType: {
            type: 'string',
            enum: ['start_tournament', 'distribute_rewards', 'mint_and_reward', 'batch_transfer'],
            description: 'Type of multi-contract operation to execute'
          },
          contracts: {
            type: 'object',
            description: 'Object mapping contract roles to addresses',
            properties: {
              gameToken: { type: 'string', description: 'GameToken contract address' },
              nftContract: { type: 'string', description: 'NFT contract address' },
              tournament: { type: 'string', description: 'Tournament contract address' }
            }
          },
          walletAddress: {
            type: 'string',
            description: 'Wallet address to execute operations from'
          },
          parameters: {
            type: 'object',
            description: 'Operation-specific parameters',
            properties: {
              entryFee: { type: 'number', description: 'Tournament entry fee (for start_tournament)' },
              maxPlayers: { type: 'number', description: 'Maximum players (for start_tournament)' },
              prizePool: { type: 'number', description: 'Prize pool amount (for start_tournament)' },
              recipients: { type: 'array', items: { type: 'string' }, description: 'Array of recipient addresses (for distribute_rewards)' },
              amounts: { type: 'array', items: { type: 'number' }, description: 'Array of reward amounts (for distribute_rewards)' },
              recipient: { type: 'string', description: 'Single recipient address (for mint_and_reward)' },
              nftMetadata: { type: 'string', description: 'NFT metadata URI (for mint_and_reward)' },
              rewardAmount: { type: 'number', description: 'Token reward amount (for mint_and_reward)' },
              transfers: { type: 'array', description: 'Array of transfer objects {to, amount} (for batch_transfer)' }
            },
            default: {}
          }
        },
        required: ['operationType', 'contracts', 'walletAddress']
      },
      execute: this.aiWrapper.executeMultiContractOperation.bind(this.aiWrapper)
    });
  }

  /**
   * Register gaming-specific functions
   */
  _registerGamingFunctions() {
    // Analyze gaming ecosystem
    this.registerFunction('analyze_gaming_ecosystem', {
      description: 'Analyze the health and metrics of a gaming ecosystem (multiple contracts working together)',
      parameters: {
        type: 'object',
        properties: {
          contracts: {
            type: 'object',
            description: 'Object mapping contract names to addresses to analyze',
            properties: {}
          }
        },
        required: ['contracts']
      },
      execute: this.aiWrapper.analyzeGamingEcosystem.bind(this.aiWrapper)
    });

    // Create gaming tournament
    this.registerFunction('create_gaming_tournament', {
      description: 'Create a new gaming tournament with token entry fees and NFT rewards',
      parameters: {
        type: 'object',
        properties: {
          tournamentContract: { type: 'string', description: 'Tournament contract address' },
          gameTokenContract: { type: 'string', description: 'Game token contract address' },
          nftContract: { type: 'string', description: 'NFT contract address for rewards' },
          walletAddress: { type: 'string', description: 'Organizer wallet address' },
          maxPlayers: { type: 'number', description: 'Maximum number of players' },
          entryFee: { type: 'number', description: 'Entry fee in game tokens' },
          prizeNftMetadata: { type: 'string', description: 'Metadata URI for winner NFT', default: '' }
        },
        required: ['tournamentContract', 'walletAddress', 'maxPlayers', 'entryFee']
      },
      execute: async (params) => {
        return await this.aiWrapper.executeMultiContractOperation({
          operationType: 'start_tournament',
          contracts: {
            gameToken: params.gameTokenContract,
            nftContract: params.nftContract,
            tournament: params.tournamentContract
          },
          walletAddress: params.walletAddress,
          parameters: {
            maxPlayers: params.maxPlayers,
            entryFee: params.entryFee,
            prizePool: params.entryFee * params.maxPlayers * 0.8 // 80% of fees as prize pool
          }
        });
      }
    });

    // Distribute gaming rewards
    this.registerFunction('distribute_gaming_rewards', {
      description: 'Distribute tokens and NFTs to players after tournament or achievement',
      parameters: {
        type: 'object',
        properties: {
          gameTokenContract: { type: 'string', description: 'Game token contract address' },
          nftContract: { type: 'string', description: 'NFT contract address' },
          walletAddress: { type: 'string', description: 'Distributor wallet address' },
          winners: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                playerAddress: { type: 'string' },
                tokenReward: { type: 'number' },
                nftMetadata: { type: 'string', description: 'NFT metadata if winning NFT' }
              }
            },
            description: 'Array of winner objects with rewards'
          }
        },
        required: ['walletAddress', 'winners']
      },
      execute: async (params) => {
        const results = [];
        for (const winner of params.winners) {
          if (winner.tokenReward && winner.tokenReward > 0) {
            const rewardResult = await this.aiWrapper.executeMultiContractOperation({
              operationType: 'distribute_rewards',
              contracts: { gameToken: params.gameTokenContract },
              walletAddress: params.walletAddress,
              parameters: {
                recipients: [winner.playerAddress],
                amounts: [winner.tokenReward]
              }
            });
            results.push(rewardResult);
          }
          
          if (winner.nftMetadata) {
            const nftResult = await this.aiWrapper.executeMultiContractOperation({
              operationType: 'mint_and_reward',
              contracts: { nftContract: params.nftContract },
              walletAddress: params.walletAddress,
              parameters: {
                recipient: winner.playerAddress,
                nftMetadata: winner.nftMetadata,
                rewardAmount: 0
              }
            });
            results.push(nftResult);
          }
        }
        
        return {
          success: true,
          message: `Distributed rewards to ${params.winners.length} winners`,
          results
        };
      }
    });

    // Get player stats
    this.registerFunction('get_player_stats', {
      description: 'Get comprehensive player statistics across all gaming contracts',
      parameters: {
        type: 'object',
        properties: {
          playerAddress: { type: 'string', description: 'Player wallet address' },
          contracts: {
            type: 'object',
            description: 'Gaming contract addresses to check',
            properties: {
              gameToken: { type: 'string' },
              nftContracts: { type: 'array', items: { type: 'string' } },
              tournamentContract: { type: 'string' }
            }
          }
        },
        required: ['playerAddress', 'contracts']
      },
      execute: async (params) => {
        const stats = {};
        
        // Get token balance
        if (params.contracts.gameToken) {
          const tokenBalance = await this.aiWrapper.callContractFunction({
            contractAddress: params.contracts.gameToken,
            functionName: 'balanceOf',
            parameters: [params.playerAddress],
            isReadOnly: true
          });
          stats.tokenBalance = tokenBalance.result || 0;
        }
        
        // Get NFT counts
        if (params.contracts.nftContracts) {
          stats.nftCounts = {};
          for (const nftContract of params.contracts.nftContracts) {
            const nftBalance = await this.aiWrapper.callContractFunction({
              contractAddress: nftContract,
              functionName: 'balanceOf',
              parameters: [params.playerAddress],
              isReadOnly: true
            });
            stats.nftCounts[nftContract] = nftBalance.result || 0;
          }
        }
        
        return {
          success: true,
          playerAddress: params.playerAddress,
          stats
        };
      }
    });
  }

  /**
   * Get function by name
   */
  getFunction(name) {
    return this.functions.get(name);
  }

  /**
   * Get all function names
   */
  getFunctionNames() {
    return Array.from(this.functions.keys());
  }

  /**
   * Get functions by category
   */
  getFunctionsByCategory(category) {
    const categoryFunctions = [];
    for (const [name, func] of this.functions) {
      if (name.startsWith(category) || func.description.toLowerCase().includes(category)) {
        categoryFunctions.push(func);
      }
    }
    return categoryFunctions;
  }
}