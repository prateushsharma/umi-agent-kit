
import Groq from 'groq-sdk';

export class GroqEngine {
  constructor(config = {}) {
    // Default Groq configuration - optimized for blockchain operations
    const defaults = {
      model: 'llama3-70b-8192',     // Fast, capable model (alternatives: 'llama3-8b-8192', 'mixtral-8x7b-32768')
      temperature: 0.1,             // Low for consistent blockchain operations (0.0-1.0)
      maxTokens: 1000,              // Response length limit
      topP: 0.9,                    // Nucleus sampling parameter
      frequencyPenalty: 0.0,        // Reduce repetition
      presencePenalty: 0.0,         // Encourage new topics
      stream: false,                // Set to true for streaming responses
      customSystemPrompt: null      // User can override system prompt
    };

    this.config = {
      apiKey: config.groqApiKey || config.apiKey,
      ...defaults,
      ...config  // User config overrides defaults
    };

    if (!this.config.apiKey) {
      throw new Error('Groq API key is required. Get one from https://console.groq.com/');
    }

    // Validate model choice
    this._validateConfig();

    // Initialize Groq client
    this.groq = new Groq({ 
      apiKey: this.config.apiKey 
    });

    // Use custom system prompt or default
    this.systemPrompt = this.config.customSystemPrompt || this._getDefaultSystemPrompt();

    console.log('🤖 GroqEngine initialized');
    console.log(`📊 Model: ${this.config.model}`);
    console.log(`🌡️  Temperature: ${this.config.temperature}`);
    console.log(`📝 Max tokens: ${this.config.maxTokens}`);
  }

  /**
   * Get available Groq models
   */
  static getAvailableModels() {
    return {
      'llama3-70b-8192': {
        name: 'Llama 3 70B',
        description: 'Most capable, best for complex blockchain operations',
        contextWindow: 8192,
        recommended: true
      },
      'llama3-8b-8192': {
        name: 'Llama 3 8B', 
        description: 'Faster, good for simple operations',
        contextWindow: 8192,
        recommended: false
      },
      'mixtral-8x7b-32768': {
        name: 'Mixtral 8x7B',
        description: 'Large context window, good for complex conversations',
        contextWindow: 32768,
        recommended: false
      },
      'gemma-7b-it': {
        name: 'Gemma 7B',
        description: 'Fast and efficient for basic operations',
        contextWindow: 8192,
        recommended: false
      }
    };
  }

  /**
   * Get configuration presets for different use cases
   */
  static getConfigPresets() {
    return {
      // Fast and consistent for production blockchain operations
      production: {
        model: 'llama3-70b-8192',
        temperature: 0.1,
        maxTokens: 800,
        topP: 0.9
      },
      
      // More creative for development and testing
      development: {
        model: 'llama3-70b-8192', 
        temperature: 0.3,
        maxTokens: 1200,
        topP: 0.95
      },
      
      // Fast responses for simple operations
      quick: {
        model: 'llama3-8b-8192',
        temperature: 0.05,
        maxTokens: 500,
        topP: 0.8
      },
      
      // Large context for complex conversations
      conversational: {
        model: 'mixtral-8x7b-32768',
        temperature: 0.2,
        maxTokens: 1500,
        topP: 0.9
      }
    };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this._validateConfig();
    
    // Update system prompt if provided
    if (newConfig.customSystemPrompt) {
      this.systemPrompt = newConfig.customSystemPrompt;
    }
    
    console.log('🔧 Groq configuration updated');
    return this.config;
  }

  /**
   * Validate configuration parameters
   */
  _validateConfig() {
    const availableModels = Object.keys(GroqEngine.getAvailableModels());
    
    if (!availableModels.includes(this.config.model)) {
      console.warn(`⚠️  Unknown model: ${this.config.model}. Available models:`, availableModels);
    }
    
    if (this.config.temperature < 0 || this.config.temperature > 1) {
      throw new Error('Temperature must be between 0 and 1');
    }
    
    if (this.config.maxTokens < 1 || this.config.maxTokens > 4000) {
      throw new Error('Max tokens must be between 1 and 4000');
    }
  }

  /**
   * Default system prompt for Umi Network blockchain assistant
   */

_getDefaultSystemPrompt() {
  return `You are UmiBot, a helpful AI assistant specialized in blockchain game development on Umi Network.

Your expertise includes:
- Checking wallet balances and transaction status on Umi Network
- Creating and managing gaming tokens (ERC-20) and NFTs (ERC-721)
- Setting up gaming studios with multisig team coordination
- Deploying contracts to both EVM and Move virtual machines
- Managing player rewards and game economies
- Helping with multisig proposals and team coordination

IMPORTANT RULES:
1. Always use the provided functions to interact with the blockchain
2. When users mention addresses, validate they look like valid Ethereum addresses (0x...)
3. For balance checks, use the get_wallet_balance function
4. If users say "my wallet" or "my balance", they mean their default wallet
5. Be conversational but precise about blockchain operations
6. Always provide transaction hashes and explorer links when available
7. If an operation might cost gas or deploy contracts, warn the user first
8. When you send transactions, always track them in your memory for future reference

CRITICAL - BALANCE CHANGE DETECTION:
IMPORTANT: If you notice balance changes that don't match your recorded transactions, always ask the user about external sources like faucets, airdrops, or transactions made outside this AI system. Don't assume where funds came from. Say something like "I notice your balance changed but I don't see a matching transaction in my memory. Did you receive funds from an external source?"

DEPLOYMENT RULES:
9. ALWAYS use the provided functions for contract deployment - NEVER pretend to deploy
10. When user says "deploy", "deploy it", "deploy again", ALWAYS call deploy_contracts_from_folder function
11. NEVER make up contract addresses - only return real addresses from actual function calls
12. If deployment fails, tell the user the real error - don't pretend it worked
13. For contract deployment, you MUST call a function - never just respond with text
14. If you don't have the required files or folders, ask the user to provide them

FUNCTION CALLING REQUIREMENTS:
15. When users ask for blockchain operations, ALWAYS use the appropriate function
16. Never simulate or pretend to perform blockchain operations
17. If a function call fails, explain the real error and suggest solutions
18. Always return actual results from function calls, not made-up data

You speak in a friendly, gaming-focused tone and always suggest best practices.`;
    console.log('🤖 GroqEngine initialized with model:', this.config.model);
  }


  /**
   * Main chat interface with function calling
   */
  async chat(message, availableFunctions = [], conversationHistory = []) {
    try {
      // Build messages array
      const messages = [
        { role: "system", content: this.systemPrompt },
        ...conversationHistory,
        { role: "user", content: message }
      ];

      console.log('🧠 Sending to Groq:', message);

      // Make API call to Groq
      const response = await this.groq.chat.completions.create({
        messages,
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        tools: availableFunctions.length > 0 ? availableFunctions : undefined,
        tool_choice: availableFunctions.length > 0 ? "auto" : undefined
      });

      const result = this._parseGroqResponse(response);
      
      console.log('🎯 Groq response type:', result.type);
      
      return result;

    } catch (error) {
      console.error('❌ Groq API error:', error);
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }

  /**
   * Parse Groq API response
   */
  _parseGroqResponse(response) {
    const choice = response.choices[0];
    
    if (!choice) {
      throw new Error('No response from Groq API');
    }

    const message = choice.message;
    
    // Check if Groq wants to call functions
    if (message.tool_calls && message.tool_calls.length > 0) {
      const functionCalls = message.tool_calls.map(toolCall => ({
        name: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments)
      }));
      
      return {
        type: 'function_calls',
        functionCalls,
        content: message.content || ''
      };
    }
    
    // Regular text response
    return {
      type: 'text',
      content: message.content || 'I apologize, but I did not generate a response.'
    };
  }

  /**
   * Test connection to Groq API
   */
  async testConnection() {
    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          { role: "user", content: "Say 'hello' to test the connection" }
        ],
        model: this.config.model,
        max_tokens: 10
      });
      
      console.log('✅ Groq connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Groq connection test failed:', error);
      return false;
    }
  }

  /**
   * Default system prompt for Umi Network blockchain assistant
   */
  _getDefaultSystemPrompt() {
    return `You are UmiBot, a helpful AI assistant specialized in blockchain game development on Umi Network.

Your expertise includes:
- Checking wallet balances and transaction status on Umi Network
- Creating and managing gaming tokens (ERC-20) and NFTs (ERC-721)
- Setting up gaming studios with multisig team coordination
- Deploying contracts to both EVM and Move virtual machines
- Managing player rewards and game economies
- Helping with multisig proposals and team coordination

IMPORTANT RULES:
1. Always use the provided functions to interact with the blockchain
2. When users mention addresses, validate they look like valid Ethereum addresses (0x...)
3. For balance checks, use the get_wallet_balance function
4. If users say "my wallet" or "my balance", they mean their default wallet
5. Be conversational but precise about blockchain operations
6. Always provide transaction hashes and explorer links when available
7. If an operation might cost gas or deploy contracts, warn the user first
8. For gaming projects, suggest best practices for token economics and NFT mechanics

Response Style:
- Be friendly and gaming-focused in your tone
- Use appropriate emojis (💰 for balance, 🎮 for gaming, ⚡ for transactions)
- Explain technical concepts in beginner-friendly terms
- Always confirm important actions before executing them
- Provide helpful next steps and suggestions

Remember: You're helping developers build the next generation of blockchain games on Umi Network!`;
  }
}