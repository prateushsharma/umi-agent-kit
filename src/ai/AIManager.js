/**
 * Main AI interface that manages conversation, context, and function execution
 * Allows full customization of Groq configuration
 */

import { GroqEngine } from './GroqEngine.js';
import { UmiAIWrapper } from './UmiAIWrapper.js';
import { FunctionRegistry } from './FunctionRegistry.js';
import { ContextManager } from './ContextManager.js';

export class AIManager {
  constructor(umiKit, config = {}) {
    this.umiKit = umiKit;
    this.config = config;
    
    // Initialize AI components
    this.groqEngine = new GroqEngine(config);
    this.aiWrapper = new UmiAIWrapper(umiKit);
    this.functionRegistry = new FunctionRegistry(this.aiWrapper);
    this.contextManager = new ContextManager();
    
    // Conversation history
    this.conversationHistory = [];
    
    console.log('🤖 AI Manager initialized');
    console.log('💡 Try these commands:');
    console.log('   • "check my balance"');
    console.log('   • "what networks am I connected to?"');
    console.log('   • "show me my wallets"');
  }

  /**
   * Main chat interface
   */
  async chat(message) {
    try {
      console.log(`👤 User: ${message}`);
      
      // Update context with user message
      this.contextManager.addMessage('user', message);
      
      // Get available functions based on current context
      const availableFunctions = this.functionRegistry.getAvailableFunctions();
      
      // Send to Groq for processing
      const response = await this.groqEngine.chat(
        message, 
        availableFunctions, 
        this.conversationHistory
      );
      
      // Process the response
      const result = await this._processResponse(response);
      
      // Update conversation history
      this._updateConversationHistory(message, result.finalResponse);
      
      // Update context
      this.contextManager.addMessage('assistant', result.finalResponse);
      
      console.log(`🤖 UmiBot: ${result.finalResponse}`);
      
      return {
        message: result.finalResponse,
        actions: result.actions || [],
        context: this.contextManager.getContext()
      };
      
    } catch (error) {
      const errorMessage = `Sorry, I encountered an error: ${error.message}`;
      console.error('❌ AI Error:', error);
      
      return {
        message: errorMessage,
        error: true,
        actions: []
      };
    }
  }

  /**
   * Configure Groq settings with presets or custom values
   */
  configureGroq(preset = null, customConfig = {}) {
    let newConfig = { ...customConfig };
    
    if (preset) {
      const presets = GroqEngine.getConfigPresets();
      if (presets[preset]) {
        newConfig = { ...presets[preset], ...customConfig };
        console.log(`🎛️  Applied preset: ${preset}`);
      } else {
        console.warn(`⚠️  Unknown preset: ${preset}. Available: ${Object.keys(presets).join(', ')}`);
      }
    }
    
    this.groqEngine.updateConfig(newConfig);
    console.log('⚙️  Groq configuration updated');
    
    return this.groqEngine.config;
  }

  /**
   * Get current Groq configuration
   */
  getGroqConfig() {
    return {
      current: this.groqEngine.config,
      availableModels: GroqEngine.getAvailableModels(),
      presets: GroqEngine.getConfigPresets()
    };
  }

  /**
   * Set a custom system prompt
   */
  setSystemPrompt(prompt) {
    this.groqEngine.updateConfig({ customSystemPrompt: prompt });
    console.log('📝 System prompt updated');
  }

  /**
   * Reset to default system prompt
   */
  resetSystemPrompt() {
    this.groqEngine.updateConfig({ customSystemPrompt: null });
    console.log('🔄 System prompt reset to default');
  }

  /**
   * Get conversation history
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history and context
   */
  clearHistory() {
    this.conversationHistory = [];
    this.contextManager.clearContext();
    console.log('🗑️  Conversation history cleared');
  }

  /**
   * Get current context (wallets, contracts, etc.)
   */
  getContext() {
    return this.contextManager.getContext();
  }

  /**
   * Manually set context (useful for setting user's wallet address)
   */
  setContext(key, value) {
    this.contextManager.setContextValue(key, value);
    console.log(`📌 Context updated: ${key} = ${value}`);
  }

  /**
   * Quick setup methods for common scenarios
   */
  
  // Setup for gaming studio development
  setupForGaming() {
    this.configureGroq('development');
    this.setSystemPrompt(`You are UmiBot, specialized in blockchain game development.
    
You help game developers create tokens, NFTs, and manage gaming studios with multisig wallets.
Be enthusiastic about gaming and suggest best practices for game economies.
Always consider player experience and game balance when making suggestions.`);
    
    console.log('🎮 AI configured for gaming development');
  }
  
  // Setup for production deployment
  setupForProduction() {
    this.configureGroq('production');
    console.log('🏭 AI configured for production use');
  }
  
  // Setup for quick operations
  setupForQuickOps() {
    this.configureGroq('quick');
    console.log('⚡ AI configured for quick operations');
  }

  /**
   * Process Groq response and execute blockchain functions
   */
  async _processResponse(response) {
    if (response.type === 'function_calls') {
      const actions = [];
      let finalResponse = '';
      
      // Execute each function call
      for (const functionCall of response.functionCalls) {
        try {
          console.log(`🔧 Executing: ${functionCall.name}`);
          
          const result = await this.functionRegistry.executeFunction(
            functionCall.name,
            functionCall.arguments
          );
          
          actions.push({
            function: functionCall.name,
            arguments: functionCall.arguments,
            result: result
          });
          
          // Build response based on function results
          finalResponse += this._formatFunctionResult(functionCall.name, result);
          
        } catch (error) {
          console.error(`❌ Function execution failed: ${functionCall.name}`, error);
          finalResponse += `Sorry, I couldn't execute ${functionCall.name}: ${error.message}\n`;
        }
      }
      
      return { finalResponse: finalResponse.trim(), actions };
      
    } else {
      // Regular text response
      return { finalResponse: response.content };
    }
  }

  /**
   * Format function execution results for user display
   */
  _formatFunctionResult(functionName, result) {
    switch (functionName) {
      case 'get_wallet_balance':
        return `💰 Balance: ${result.balance} ETH (${result.address})\n`;
      
      case 'get_network_info':
        return `🌐 Connected to ${result.network} (Chain ID: ${result.chainId})\n`;
      
      case 'list_wallets':
        const walletList = result.wallets.map(w => `  • ${w.address} (${w.balance} ETH)`).join('\n');
        return `👛 Your wallets:\n${walletList}\n`;
      
      default:
        return `✅ ${functionName} completed successfully\n`;
    }
  }

  /**
   * Update conversation history for context
   */
  _updateConversationHistory(userMessage, assistantResponse) {
    this.conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantResponse }
    );
    
    // Keep conversation history manageable (last 20 messages)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }
}