# 🚀 UmiAgentKit v3.0 - The Complete AI-Powered Blockchain Toolkit

**The World's Most Advanced AI-Driven Blockchain Development Platform**  
*Revolutionary Natural Language Blockchain Operations with Server-Based Multisig*

---

## 🌟 **Why UmiAgentKit Will Change Everything**

Imagine building blockchain applications by simply talking to your computer:

```
"Create a gaming studio with 7 team members where 4 need to approve transactions"
"Make a token called SuperCoin with 10 million supply"
"Set up an NFT collection for our heroes with 10,000 max supply"
"Check my wallet balance and show me the gas prices"
```

**UmiAgentKit makes this reality.** It's the first toolkit that combines:
- 🤖 **AI-Powered Natural Language Processing** via Groq API
- 🔐 **Revolutionary Server-Based Multisig** for team coordination
- ⚡ **Dual-VM Support** (EVM + Move) in one unified platform
- 🎮 **Gaming-First Design** built for the future of blockchain gaming

---

## 🎯 **Quick Start - Get Running in 2 Minutes**

### **Step 1: Install**
```bash
npm install umi-agent-kit
```

### **Step 2: Setup**
```javascript
import { UmiAgentKit } from 'umi-agent-kit';

// Initialize with AI and Multisig
const kit = new UmiAgentKit({
  network: 'devnet',
  multisigEnabled: true
});

// Enable AI with your Groq API key
kit.enableAI({
  groqApiKey: 'your-groq-api-key'
});

// Import your main wallet
const mainWallet = kit.importWallet('your-private-key');
kit.setAIContext('defaultWallet', mainWallet.getAddress());
```

### **Step 3: Start Building with AI**
```javascript
// Just talk to your blockchain!
await kit.chat("Create a gaming studio called Epic Games with 5 team members");
await kit.chat("Make a token called GameCoin with 1 million supply");
await kit.chat("Check my wallet balance");
await kit.chat("What network am I connected to?");
```

**That's it!** You're now using the most advanced blockchain toolkit ever created. 🎉

---

## 🤖 **AI-Powered Operations - The Future is Here**

### **🧠 Revolutionary AI Engine**

UmiAgentKit uses **Groq's lightning-fast AI** to understand natural language and automatically execute blockchain operations. No more complex APIs - just talk naturally!

#### **🎛️ AI Models Available:**
- **`llama3-70b-8192`** - Best overall performance and intelligence
- **`llama3-8b-8192`** - Lightning-fast responses
- **`mixtral-8x7b-32768`** - Massive context window for complex conversations
- **`gemma-7b-it`** - Lightweight and efficient

#### **🎨 AI Presets for Every Use Case:**
```javascript
// Quick responses for rapid development
kit.configureAI('quick');

// Detailed explanations for learning
kit.configureAI('conversational');

// Creative gaming-focused assistance
kit.configureAI('development');

// Precise, production-ready responses
kit.configureAI('production');
```

### **💬 Natural Language Commands**

Your AI assistant understands context and can execute complex blockchain operations:

#### **💰 Wallet Operations:**
```
"Check my wallet balance"
"Create a new wallet for testing"
"Show me all my wallets"
"What's the gas price right now?"
"Transfer 5 ETH to my team wallet"
```

#### **🏢 Team & Multisig Operations:**
```
"Create a multisig group with 7 people where 4 need to approve"
"Set up a gaming studio called DragonForge with 6 team members"
"Create team wallets for: CEO, developer, artist, marketing"
"Show me all my multisig groups"
"Who are the members of my Epic Team multisig?"
```

#### **🪙 Token Creation:**
```
"Create a token called GameCoin with 10 million supply"
"Make a reward token called XP with 18 decimals"
"Deploy a utility token for our game economy"
```

#### **🎨 NFT Operations:**
```
"Create an NFT collection called Epic Heroes with 10,000 max supply"
"Make a weapon NFT collection for our RPG game"
"Set up character NFTs with 0.01 ETH mint price"
```

#### **🌐 Network Information:**
```
"What network am I connected to?"
"Show me the latest block number"
"What's the current chain ID?"
"Check if the network is healthy"
```

### **🧠 Context-Aware AI**

The AI remembers your preferences, wallets, and project details:

```javascript
// Set your project context
kit.setAIContext('projectName', 'Epic RPG Game');
kit.setAIContext('defaultWallet', mainWallet.getAddress());
kit.setAIContext('userRole', 'game-developer');

// AI now understands your project context
await kit.chat("Create tokens for our game economy");
// AI knows you're building "Epic RPG Game" and suggests appropriate tokens
```

### **🔄 Conversation Memory**

Your AI maintains conversation history for natural follow-ups:

```javascript
await kit.chat("Create a gaming studio with 5 members");
// AI creates the studio...

await kit.chat("Add 2 more members to that studio");
// AI remembers the previous studio and adds members

await kit.chat("What's the multisig threshold for it?");
// AI knows "it" refers to the studio just created
```

---

## 🔐 **Revolutionary Multisig System**

### **🌟 World's First Server-Based Multisig**

Traditional multisig requires all team members to be online simultaneously. **UmiAgentKit changes everything** with server-based coordination:

- ✅ **Offline Coordination** - Team members can approve when convenient
- ✅ **Gaming Studio Templates** - Pre-configured roles for game development
- ✅ **Proposal Engine** - Complete proposal lifecycle management
- ✅ **Smart Notifications** - Real-time updates for team coordination
- ✅ **Role-Based Permissions** - Granular access control by team role

### **🎮 Gaming Studio Multisig**

Built specifically for game development teams:

```javascript
// Create a complete gaming studio in one command
const studio = await kit.createGamingStudioMultisig({
  studioName: "Epic Games Studio",
  teamWallets: {
    ceo: ceoWallet,
    lead_developer: devWallet,
    art_director: artistWallet,
    game_designer: designerWallet,
    marketing_lead: marketingWallet
  }
});
```

#### **🎯 Predefined Gaming Roles:**
- **👑 CEO** - Strategic decisions, emergency powers (weight: 3)
- **💻 Lead Developer** - Technical implementations, smart contracts (weight: 2)
- **🎨 Art Director** - NFT creation, visual assets (weight: 2)
- **🎮 Game Designer** - Game mechanics, balance decisions (weight: 2)
- **📢 Marketing Lead** - Community engagement, token operations (weight: 1)
- **🏛️ Community Manager** - Player rewards, community treasury (weight: 1)

#### **⚙️ Smart Gaming Rules:**
```javascript
const defaultRules = {
  tokenCreation: { 
    requiredRoles: ['lead_developer', 'ceo'], 
    threshold: 2,
    description: 'Create new game tokens'
  },
  nftCollection: { 
    requiredRoles: ['art_director', 'game_designer'], 
    threshold: 2,
    description: 'Create NFT collections'
  },
  playerRewards: { 
    requiredRoles: ['game_designer'], 
    threshold: 1,
    maxAmount: '100',
    description: 'Distribute player rewards'
  },
  emergencyStop: { 
    requiredRoles: ['ceo'], 
    threshold: 1,
    description: 'Emergency operations'
  }
};
```

### **⚔️ Guild Treasury Multisig**

Perfect for gaming guilds and DAOs:

```javascript
const guild = await kit.createGuildMultisig({
  guildName: "DragonSlayers Guild",
  officers: {
    guild_leader: leaderWallet,
    officer1: officer1Wallet,
    officer2: officer2Wallet
  },
  members: {
    member1: member1Wallet,
    member2: member2Wallet,
    member3: member3Wallet
  }
});
```

### **📋 Proposal System**

Complete proposal lifecycle with automatic execution:

```javascript
// Propose a token creation
const proposal = await kit.proposeTransaction({
  multisigId: studio.id,
  proposerWalletName: 'lead_developer',
  operation: 'createERC20Token',
  params: {
    name: 'GameCoin',
    symbol: 'GAME',
    initialSupply: 1000000
  },
  description: "Main game currency for player transactions",
  urgency: 'normal'
});

// Team members approve
await kit.approveProposal({
  proposalId: proposal.id,
  approverWalletName: 'ceo',
  decision: 'approve',
  comment: "Approved - good tokenomics"
});

// Automatically executes when threshold is met!
```

### **🔔 Smart Notifications**

Real-time coordination for distributed teams:

```javascript
// Configure notifications
const notifications = {
  enableConsole: true,
  enableWebhooks: true,
  webhookUrl: 'https://your-game-backend.com/multisig-webhook',
  enableSlack: true,
  slackWebhook: 'your-slack-webhook-url'
};
```

**Notification Types:**
- 📩 **New Proposal** - When someone creates a proposal
- ✅ **Approval Received** - When a team member approves
- ❌ **Proposal Rejected** - When someone rejects
- 🚀 **Ready for Execution** - When threshold is met
- ⚡ **Proposal Executed** - When transaction completes
- 📊 **Daily Summary** - Daily team coordination report

---

## 🌐 **Complete Function Reference**

### **🤖 AI Functions**

#### **`kit.enableAI(config)`**
Enable AI functionality with Groq integration.

```javascript
const ai = kit.enableAI({
  groqApiKey: 'your-groq-api-key',
  model: 'llama3-70b-8192',        // Optional
  temperature: 0.1,                // Optional
  maxTokens: 8192                  // Optional
});
```

#### **`kit.chat(message)`**
Main AI interface - talk naturally to your blockchain.

```javascript
const response = await kit.chat("Create a gaming token with 1M supply");
console.log(response.message);    // AI response
console.log(response.actions);    // Blockchain actions executed
```

#### **`kit.configureAI(preset, customConfig)`**
Configure AI behavior for different scenarios.

```javascript
kit.configureAI('gaming');        // Gaming-focused responses
kit.configureAI('production');    // Precise, reliable responses
kit.configureAI('quick');         // Fast, concise responses
kit.configureAI('conversational'); // Detailed explanations
```

#### **`kit.setAIContext(key, value)`**
Set context for personalized AI responses.

```javascript
kit.setAIContext('defaultWallet', wallet.getAddress());
kit.setAIContext('projectName', 'Epic RPG Game');
kit.setAIContext('userRole', 'game-developer');
```

### **💼 Wallet Functions**

#### **`kit.createWallet()`**
Create a new wallet with private key.

```javascript
const wallet = kit.createWallet();
console.log(wallet.getAddress());     // EVM address
console.log(wallet.getMoveAddress()); // Move address
```

#### **`kit.importWallet(privateKey)`**
Import existing wallet from private key.

```javascript
const wallet = kit.importWallet('0x123...');
```

#### **`kit.getBalance(address)`**
Get ETH balance for any address.

```javascript
const balance = await kit.getBalance(wallet.getAddress());
console.log(`Balance: ${balance} ETH`);
```

#### **`kit.transfer(params)`**
Send ETH between wallets.

```javascript
await kit.transfer({
  from: fromWallet,
  to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  amount: '1.5'
});
```

### **🪙 Token Functions**

#### **`kit.createERC20Token(params)`**
Create ERC-20 tokens with real-time compilation.

```javascript
const token = await kit.createERC20Token({
  deployerWallet: wallet,
  name: 'GameCoin',
  symbol: 'GAME',
  decimals: 18,
  initialSupply: 1000000
});
```

#### **`kit.createMoveToken(params)`**
Create Move-based tokens.

```javascript
const moveToken = await kit.createMoveToken({
  deployerWallet: wallet,
  name: 'MoveCoin',
  symbol: 'MOVE',
  decimals: 8
});
```

#### **`kit.transferTokens(params)`**
Transfer tokens between wallets.

```javascript
await kit.transferTokens({
  fromWallet: wallet,
  to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  contractAddress: token.contractAddress,
  amount: '1000'
});
```

### **🎨 NFT Functions**

#### **`kit.createNFTCollection(params)`**
Create ERC-721 NFT collections.

```javascript
const collection = await kit.createNFTCollection({
  deployerWallet: wallet,
  name: 'Epic Heroes',
  symbol: 'HERO',
  maxSupply: 10000,
  mintPrice: '0.01',
  baseURI: 'https://api.epicgame.com/heroes/'
});
```

#### **`kit.mintNFT(params)`**
Mint individual NFTs.

```javascript
const nft = await kit.mintNFT({
  ownerWallet: wallet,
  contractAddress: collection.contractAddress,
  to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  tokenId: 1,
  metadataURI: 'https://api.epicgame.com/heroes/1'
});
```

#### **`kit.createMoveNFTCollection(params)`**
Create Move-based NFT collections.

```javascript
const moveCollection = await kit.createMoveNFTCollection({
  deployerWallet: wallet,
  name: 'Move Heroes',
  description: 'Epic heroes on Move VM',
  maxSupply: 5000
});
```

#### **`kit.mintMoveNFT(params)`**
Mint Move NFTs with gaming attributes.

```javascript
const moveNFT = await kit.mintMoveNFT({
  ownerWallet: wallet,
  moduleAddress: moveCollection.moduleAddress,
  recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  tokenId: 1,
  name: 'Dragon Slayer',
  description: 'Legendary warrior hero',
  imageURI: 'https://api.epicgame.com/heroes/dragon-slayer.png',
  attributes: [
    { trait_type: 'Strength', value: 95 },
    { trait_type: 'Magic', value: 88 },
    { trait_type: 'Speed', value: 77 }
  ],
  level: 1,
  rarity: 'legendary'
});
```

### **🔐 Multisig Functions**

#### **`kit.registerMultisigWallets(wallets)`**
Register wallets for multisig operations.

```javascript
const walletNames = kit.registerMultisigWallets({
  ceo: ceoWallet,
  developer: devWallet,
  artist: artistWallet
});
```

#### **`kit.createMultisigGroup(params)`**
Create basic multisig group.

```javascript
const multisig = await kit.createMultisigGroup({
  name: "Development Team",
  description: "Core team multisig",
  members: [
    { walletName: 'ceo', role: 'ceo', weight: 2 },
    { walletName: 'developer', role: 'developer', weight: 1 },
    { walletName: 'artist', role: 'artist', weight: 1 }
  ],
  threshold: 2,
  rules: {
    tokenCreation: {
      requiredRoles: ['developer', 'ceo'],
      threshold: 2
    }
  }
});
```

#### **`kit.createGamingStudioMultisig(params)`**
Create gaming studio with predefined roles.

```javascript
const studio = await kit.createGamingStudioMultisig({
  studioName: "Epic Games Studio",
  teamWallets: {
    ceo: ceoWallet,
    lead_developer: devWallet,
    art_director: artistWallet,
    game_designer: designerWallet
  }
});
```

#### **`kit.proposeTransaction(params)`**
Propose transaction requiring approval.

```javascript
const proposal = await kit.proposeTransaction({
  multisigId: studio.id,
  proposerWalletName: 'lead_developer',
  operation: 'createERC20Token',
  params: {
    name: 'GameCoin',
    symbol: 'GAME',
    initialSupply: 1000000
  },
  description: "Main game currency",
  urgency: 'normal'
});
```

#### **`kit.approveProposal(params)`**
Approve or reject proposals.

```javascript
await kit.approveProposal({
  proposalId: proposal.id,
  approverWalletName: 'ceo',
  decision: 'approve',
  comment: "Looks good, approved!"
});
```

### **🌐 Network Functions**

#### **`kit.getNetworkInfo()`**
Get current network information.

```javascript
const info = kit.getNetworkInfo();
console.log(info.network);        // 'devnet'
console.log(info.chainId);        // 42069
console.log(info.rpcUrl);         // RPC endpoint
```

#### **`kit.getBlockNumber()`**
Get latest block number.

```javascript
const blockNumber = await kit.getBlockNumber();
```

#### **`kit.getSummary()`**
Get comprehensive toolkit summary.

```javascript
const summary = await kit.getSummary();
console.log(summary.walletCount);
console.log(summary.features);
console.log(summary.ai.enabled);
console.log(summary.multisig.groupCount);
```

---

## 🏗️ **Complete Example: Building a Game Economy**

Let's build a complete blockchain game economy with AI assistance:

```javascript
import { UmiAgentKit } from 'umi-agent-kit';

async function buildGameEconomy() {
  // 1. Initialize UmiAgentKit
  const kit = new UmiAgentKit({
    network: 'devnet',
    multisigEnabled: true
  });

  // 2. Enable AI
  kit.enableAI({
    groqApiKey: 'your-groq-api-key'
  });

  // 3. Import your main wallet
  const mainWallet = kit.importWallet('your-private-key');
  kit.setAIContext('defaultWallet', mainWallet.getAddress());
  kit.setAIContext('projectName', 'Epic RPG Game');

  // 4. Create gaming studio with AI
  console.log('🎮 Creating gaming studio...');
  const studioResponse = await kit.chat(
    "Create a gaming studio called 'Epic RPG Studio' with 6 team members"
  );
  console.log(studioResponse.message);

  // 5. Create game tokens with AI
  console.log('🪙 Creating game tokens...');
  const tokenResponse = await kit.chat(
    "Create a game token called 'Gold' with symbol 'GOLD' and 10 million supply"
  );
  console.log(tokenResponse.message);

  // 6. Create hero NFT collection with AI
  console.log('🎨 Creating hero NFTs...');
  const heroResponse = await kit.chat(
    "Create an NFT collection called 'Epic Heroes' with 10000 max supply and 0.01 ETH mint price"
  );
  console.log(heroResponse.message);

  // 7. Create weapon NFT collection
  console.log('⚔️ Creating weapon NFTs...');
  const weaponResponse = await kit.chat(
    "Create a weapon NFT collection called 'Legendary Weapons' with 5000 max supply"
  );
  console.log(weaponResponse.message);

  // 8. Check our progress
  console.log('📊 Checking progress...');
  const summaryResponse = await kit.chat(
    "Show me a summary of everything we've created"
  );
  console.log(summaryResponse.message);

  console.log('🎉 Game economy created successfully!');
}

buildGameEconomy();
```

**Output:**
```
🎮 Creating gaming studio...
✅ Gaming studio "Epic RPG Studio" created with 6 team members and multisig coordination

🪙 Creating game tokens...
✅ Token "Gold" (GOLD) created successfully! Contract: 0xabc123...

🎨 Creating hero NFTs...
✅ NFT collection "Epic Heroes" (HERO) created successfully! Contract: 0xdef456...

⚔️ Creating weapon NFTs...
✅ NFT collection "Legendary Weapons" (WEAPON) created successfully! Contract: 0x789abc...

📊 Checking progress...
✅ Summary: Created 1 gaming studio, 1 token, 2 NFT collections. Ready to launch!

🎉 Game economy created successfully!
```

---

## 🚀 **Advanced Use Cases**

### **🏰 Guild Management System**

```javascript
// Create guild treasury
const guild = await kit.chat(
  "Create a guild called 'DragonSlayers' with 3 officers and 10 members"
);

// Propose reward distribution
await kit.chat(
  "Propose distributing 1000 GOLD tokens to top 5 guild members"
);

// Officers approve the proposal
await kit.chat(
  "Approve the reward proposal as guild officer"
);
```

### **🎯 Tournament Prize Pool**

```javascript
// Create tournament multisig
await kit.chat(
  "Create a tournament multisig for 'Epic Battle Tournament' with 5 organizers"
);

// Setup prize tokens
await kit.chat(
  "Create prize tokens for the tournament with 100,000 total supply"
);

// Distribute prizes automatically
await kit.chat(
  "Distribute tournament prizes: 1st place 10,000 tokens, 2nd place 5,000 tokens"
);
```

### **🏭 Multi-Game Studio**

```javascript
// Create parent studio
await kit.chat(
  "Create a parent gaming studio called 'Epic Games Group' with 10 executives"
);

// Create game-specific teams
await kit.chat(
  "Create a sub-team for 'RPG Project' with 6 developers"
);

await kit.chat(
  "Create a sub-team for 'Racing Game' with 5 developers"
);

// Cross-team token sharing
await kit.chat(
  "Create a shared utility token for all Epic Games Group projects"
);
```

# UmiAgentKit - All New Deployment Functions

## 🎯 **Complete Reference Guide**

### **Core Deployment Functions**

---

#### **1. deployContracts(contractsPath, deployerWallet)**

Deploy multiple Move contracts without constructor values.

```javascript
const contracts = await kit.deployContracts('./contracts/', wallet);
// Returns: { GameToken: {...}, HeroNFT: {...}, Tournament: {...} }
```

**Parameters:**
- `contractsPath` - Path to folder containing .move files
- `deployerWallet` - UmiWallet object for deployment

**Returns:** Object with deployed contract details

---

#### **2. setConstructorValues(contractAddress, constructorArgs, callerWallet)**

Initialize contracts after deployment with constructor values.

```javascript
await kit.setConstructorValues(contracts.GameToken.address, {
  name: 'GameCoin',
  symbol: 'GAME', 
  decimals: 8,
  initial_supply: 1000000
}, wallet);
```

**Parameters:**
- `contractAddress` - Deployed contract address (e.g., "0x123::gametoken")
- `constructorArgs` - Object with initialization parameters
- `callerWallet` - UmiWallet object for the transaction

**Returns:** Transaction result with hash

---

#### **3. deployWithJson(contractsPath, deployerWallet, configFile)**

Deploy contracts using JSON configuration file.

```javascript
// Uses ./contracts/deployment.json
const ecosystem = await kit.deployWithJson('./contracts/', wallet);

// Uses custom config file
const ecosystem = await kit.deployWithJson('./contracts/', wallet, './my-config.json');
```

**Parameters:**
- `contractsPath` - Path to contracts folder
- `deployerWallet` - UmiWallet object for deployment  
- `configFile` - Optional path to config file (defaults to deployment.json)

**Example deployment.json:**
```json
{
  "contracts": {
    "GameToken": {
      "file": "GameToken.move",
      "dependencies": [],
      "initArgs": {
        "name": "GameCoin",
        "symbol": "GAME",
        "decimals": 8,
        "initial_supply": 1000000
      }
    },
    "HeroNFT": {
      "file": "HeroNFT.move",
      "dependencies": ["GameToken"],
      "initArgs": {
        "name": "Epic Heroes",
        "game_token": "@GameToken"
      }
    }
  }
}
```

**Returns:** Object with deployed ecosystem

---

#### **4. deployWithConfig(contractsPath, deployerWallet, configObject)**

Deploy contracts using JavaScript configuration object.

```javascript
const ecosystem = await kit.deployWithConfig('./contracts/', wallet, {
  GameToken: { 
    name: 'GameCoin', 
    symbol: 'GAME', 
    decimals: 8,
    initial_supply: 1000000
  },
  HeroNFT: { 
    name: 'Epic Heroes', 
    symbol: 'HERO',
    game_token: '@GameToken'  // Reference to GameToken
  },
  Tournament: {
    name: 'Epic Tournament',
    entry_fee: 10,
    game_token: '@GameToken',
    hero_nft: '@HeroNFT'
  }
});
```

**Parameters:**
- `contractsPath` - Path to contracts folder
- `deployerWallet` - UmiWallet object for deployment
- `configObject` - JavaScript object with contract configurations

**Returns:** Object with deployed ecosystem

---

### **Utility Functions**

---

#### **5. deploySingleContract(contractPath, deployerWallet, constructorArgs)**

Deploy a single Move contract file.

```javascript
const gameToken = await kit.deploySingleContract(
  './contracts/GameToken.move',
  wallet,
  {
    name: 'GameCoin',
    symbol: 'GAME',
    decimals: 8,
    initial_supply: 1000000
  }
);
```

**Parameters:**
- `contractPath` - Path to single .move file
- `deployerWallet` - UmiWallet object for deployment
- `constructorArgs` - Optional constructor arguments

**Returns:** Single deployed contract object

---

#### **6. getContractFunctions(deployedContract)**

Get list of available functions from a deployed contract.

```javascript
const functions = kit.getContractFunctions(deployedContract);
console.log(functions);
// [
//   { name: 'initialize', type: 'entry', visibility: 'public' },
//   { name: 'mint', type: 'entry', visibility: 'public' },
//   { name: 'get_balance', type: 'view', visibility: 'public' }
// ]
```

**Parameters:**
- `deployedContract` - Contract object from deployment

**Returns:** Array of function objects with name, type, and visibility

---

#### **7. callContractFunction(contractAddress, functionName, args, callerWallet)**

Call any function on a deployed Move contract.

```javascript
// Call a minting function
const mintResult = await kit.callContractFunction(
  '0x123::gametoken',
  'mint',
  {
    to: wallet.getAddress(),
    amount: 1000
  },
  wallet
);

// Call a view function
const balanceResult = await kit.callContractFunction(
  '0x123::gametoken', 
  'get_balance',
  {
    account: wallet.getAddress()
  },
  wallet
);
```

**Parameters:**
- `contractAddress` - Module address (e.g., "0x123::gametoken")
- `functionName` - Name of function to call
- `args` - Object with function arguments
- `callerWallet` - UmiWallet object for the transaction

**Returns:** Transaction result with hash and receipt

---

#### **8. getDeploymentSummary(deployedContracts)**

Get summary statistics of deployment results.

```javascript
const summary = kit.getDeploymentSummary(deployedContracts);
console.log(summary);
// {
//   totalContracts: 3,
//   contracts: {
//     GameToken: {
//       address: "0x123::gametoken",
//       type: "move", 
//       initialized: true,
//       txHash: "0xabc..."
//     },
//     HeroNFT: { ... },
//     Tournament: { ... }
//   },
//   totalGasUsed: 0
// }
```

**Parameters:**
- `deployedContracts` - Object with deployed contracts

**Returns:** Summary object with statistics

---

#### **9. exportDeploymentResults(deployedContracts, outputPath)**

Export deployment results to JSON file for later reference.

```javascript
await kit.exportDeploymentResults(
  deployedContracts, 
  './deployment-results.json'
);
```

**Generated file structure:**
```json
{
  "timestamp": "2025-01-07T10:30:00.000Z",
  "network": "devnet",
  "summary": {
    "totalContracts": 3,
    "contracts": { ... }
  },
  "contracts": {
    "GameToken": {
      "address": "0x123::gametoken",
      "txHash": "0xabc...",
      "type": "move",
      "initialized": true
    }
  }
}
```

**Parameters:**
- `deployedContracts` - Object with deployed contracts
- `outputPath` - File path to save results (default: './deployment-results.json')

**Returns:** Promise that resolves when file is written

---

#### **10. validateContracts(contractsPath)**

Validate Move contracts before deployment to catch syntax errors.

```javascript
try {
  await kit.validateContracts('./contracts/');
  console.log('✅ All contracts are valid!');
} catch (error) {
  console.error('❌ Validation failed:', error.message);
}
```

**Parameters:**
- `contractsPath` - Path to contracts folder

**Returns:** Promise that resolves if valid, rejects if invalid

**Validation checks:**
- Move syntax validation
- Module declaration presence
- Function structure verification

---

## 🎯 **Usage Examples**

### **Complete Workflow Example**

```javascript
import { UmiAgentKit } from 'umi-agent-kit';

const kit = new UmiAgentKit({ network: 'devnet' });
const wallet = kit.importWallet(process.env.PRIVATE_KEY);

// Option 1: Deploy now, constructor later
const contracts = await kit.deployContracts('./contracts/', wallet);

await kit.setConstructorValues(contracts.GameToken.address, {
  name: 'GameCoin',
  symbol: 'GAME',
  decimals: 8,
  initial_supply: 1000000
}, wallet);

// Option 2: Deploy with JSON config
const ecosystem = await kit.deployWithJson('./contracts/', wallet);

// Option 3: Deploy with config object
const ecosystem2 = await kit.deployWithConfig('./contracts/', wallet, {
  GameToken: { name: 'GameCoin', symbol: 'GAME' },
  HeroNFT: { name: 'Epic Heroes', gameToken: '@GameToken' }
});

// Call deployed contract functions
const mintResult = await kit.callContractFunction(
  ecosystem.GameToken.address,
  'mint',
  { to: wallet.getAddress(), amount: 1000 },
  wallet
);

// Export results
await kit.exportDeploymentResults(ecosystem, './results.json');
```

### **Error Handling Example**

```javascript
try {
  // Validate before deployment
  await kit.validateContracts('./contracts/');
  
  // Deploy contracts
  const contracts = await kit.deployContracts('./contracts/', wallet);
  
  // Initialize contracts
  for (const [name, contract] of Object.entries(contracts)) {
    if (!contract.initialized) {
      await kit.setConstructorValues(contract.address, {
        name: `${name}Token`,
        symbol: name.toUpperCase()
      }, wallet);
    }
  }
  
  console.log('🎉 Deployment successful!');
  
} catch (error) {
  console.error('💥 Deployment failed:', error.message);
  
  if (error.message.includes('gas')) {
    console.log('💡 Try increasing gas limit or check wallet balance');
  }
  
  if (error.message.includes('compilation')) {
    console.log('💡 Check Move contract syntax');
  }
}
```

---

## 📋 **Function Categories Summary**

### **🚀 Primary Deployment (3 options)**
- `deployContracts()` - Deploy now, constructor later
- `deployWithJson()` - Deploy with JSON configuration  
- `deployWithConfig()` - Deploy with JavaScript object

### **⚙️ Constructor & Initialization**
- `setConstructorValues()` - Initialize contracts after deployment

### **🔧 Utilities & Management**
- `deploySingleContract()` - Single contract deployment
- `getContractFunctions()` - Function inspection
- `callContractFunction()` - Generic function calling
- `getDeploymentSummary()` - Deployment statistics
- `exportDeploymentResults()` - Save results to file
- `validateContracts()` - Pre-deployment validation

**Total: 10 comprehensive deployment functions for complete Move contract ecosystem management** 🎯


# 🤖 Simple AI Contract Deployment with UmiAgentKit

Deploy your Move contracts using AI chat interface.

## 📦 Install

```bash
npm install umi-agent-kit
```

## 🚀 Basic Setup

```javascript
import { UmiAgentKit } from 'umi-agent-kit';

// Initialize
const kit = new UmiAgentKit({ network: 'devnet' });

// Enable AI
kit.enableAI({
  groqApiKey: 'your-groq-api-key'
});

// Import wallet
const wallet = kit.importWallet(process.env.PRIVATE_KEY);
```

## 💬 Deploy with AI Chat

```javascript
// Simply chat to deploy contracts
await kit.chat("the default one");
// ✅ Deploys all contracts from your folder

await kit.chat("deploy my contracts");
// ✅ Scans folder and deploys everything

await kit.chat("deploy from ./my-contracts folder");
// ✅ Deploys from specific folder path

await kit.chat("create a gaming token");
// ✅ Creates and deploys a game token
```

## 📁 Folder Structure

```
your-project/
├── contracts/
│   ├── GameToken.move
│   ├── HeroNFT.move
│   └── Tournament.move
└── index.js
```

## 🎯 Simple Example

```javascript
import { UmiAgentKit } from 'umi-agent-kit';

async function main() {
  // Setup
  const kit = new UmiAgentKit({ network: 'devnet' });
  kit.enableAI({ groqApiKey: 'your-groq-key' });
  const wallet = kit.importWallet('your-private-key');
  
  // Deploy contracts with AI
  const result = await kit.chat("deploy my gaming contracts");
  
  console.log("Deployed contracts:", result);
}

main();
```

## 🎮 What You Can Say

### Deploy Commands
- `"deploy my contracts"`
- `"the default one"`
- `"deploy contracts from ./my-contracts folder"`
- `"deploy from test-contracts directory"`
- `"create a gaming token"`
- `"make an NFT collection"`

### Check Status
- `"check my balance"`
- `"show my contracts"`
- `"what network am I on?"`

### Interact with Contracts
- `"send 100 tokens to player1"`
- `"mint a hero NFT"`
- `"start tournament"`

## 🎮 Real AI Interaction Example

Based on actual UmiAgentKit deployment:

```
👤 User: "the default one"

🧠 AI: Analyzing your request...
🔍 AI: Found contracts folder: test-contracts
📁 AI: Scanning contracts: counter, GameToken, HeroNFT
🔄 AI: Resolving dependencies: counter → GameToken → HeroNFT

🚀 AI: Deploying counter contract...
📦 AI: Creating Move contract at address 0xeD328deA266f29ddC604679072Ee4f4F23C165f9
✅ AI: counter deployed! Hash: 0xcf28b0c0c158e24541b6d649c784073c196dbf6a0fa2f977f874788c30df2d07
📍 AI: Contract address: 0x000000000000000000000000eD328deA266f29ddC604679072Ee4f4F23C165f9::counter_token

🪙 AI: Deploying GameToken contract...
📦 AI: Creating gaming token with symbol GAME and 8 decimals
✅ AI: GameToken deployed! Hash: 0x1097eff6d4f472de7a4ea09b58adb9c288b4db066b119d11c1646cdc7e044973
📍 AI: Contract address: 0x000000000000000000000000eD328deA266f29ddC604679072Ee4f4F23C165f9::gametoken_token

🎨 AI: Deploying HeroNFT contract...
📦 AI: Creating NFT collection with symbol HERO
✅ AI: HeroNFT deployed! Hash: 0x6e7a465c1916b1318b2c814b4bd26e243546d663b22f995c69ee66d47ec92139
📍 AI: Contract address: 0x000000000000000000000000eD328deA266f29ddC604679072Ee4f4F23C165f9::heronft_token

🎉 AI: All contracts deployed successfully!
📊 AI: Summary: 3 Move contracts deployed to Umi Network
💡 AI: Next step: Use setConstructorValues() to initialize your contracts
✅ AI: Your gaming ecosystem is ready to use!
```

## 💡 Pro Tip: Specify Contract Location

You can tell the AI exactly where your contracts are:

```javascript
// Deploy from specific folders
await kit.chat("deploy contracts from ./game-contracts folder");
await kit.chat("deploy from test-contracts directory");
await kit.chat("use contracts in ./src/move-contracts/");

// Or just use default (scans current directory)
await kit.chat("deploy my contracts");
```

## ✨ That's It!

Just talk to your blockchain and UmiAgentKit handles the rest. No complex APIs needed.

```javascript
// This simple chat deploys everything
await kit.chat("deploy my gaming ecosystem");
```


### **🔐 Multisig Workflow**

```
1. 💡 Developer Proposes
   "Create rare weapon NFT collection"
   
2. 🔔 Team Notified
   CEO: ✅ Approved - "Great idea!"
   Artist: ✅ Approved - "I'll design the weapons"
   Designer: ⏳ Pending review
   
3. 🎯 Threshold Met (3/5)
   Auto-execution triggered
   
4. ⚡ Smart Contract Deployed
   Collection "Legendary Weapons" created
   Contract: 0xdef456...
   
5. 📊 Team Dashboard Updated
   New collection added to studio assets
   Ready for minting and distribution
```

---

## 🏆 **Why UmiAgentKit Dominates**

### **🥇 vs Traditional Blockchain SDKs**

| Feature | Traditional SDKs | UmiAgentKit |
|---------|------------------|-------------|
| **Learning Curve** | Weeks/Months | Minutes |
| **Code Complexity** | 100+ lines | Natural language |
| **Team Coordination** | Manual processes | AI-powered multisig |
| **Virtual Machines** | Single VM | Dual-VM (EVM + Move) |
| **Gaming Features** | Build from scratch | Built-in templates |
| **AI Integration** | None | Revolutionary |

### **💎 vs Competitors**

**Other toolkits:** Complex APIs, no AI, limited gaming support  
**UmiAgentKit:** AI-first, gaming-optimized, revolutionary multisig

**Other multisig:** Requires all online, complex setup  
**UmiAgentKit:** Server-based, AI-managed, gaming templates

**Other AI tools:** Limited blockchain integration  
**UmiAgentKit:** Complete blockchain operations via AI

---

## 🚦 **Get Started Now**

### **🎯 For Game Developers**
```bash
npm install umi-agent-kit
```
Start building your game economy in minutes, not months.

### **🏢 For Studios**
Perfect for teams needing coordination and governance.

### **⚔️ For Guilds**
Built-in treasury management and member coordination.

### **🚀 For Innovators**
Push the boundaries of what's possible with AI + blockchain.

---

## 📞 **Support & Community**

### **🔗 Links**
- **Documentation**: Complete guides and tutorials
- **GitHub**: Open source and community contributions  
- **Discord**: Real-time support and community
- **Twitter**: Latest updates and announcements

### **🆘 Get Help**
- **AI Issues**: Check Groq API key and configuration
- **Multisig Problems**: Verify wallet registrations
- **Network Issues**: Confirm Umi Network connectivity
- **General Support**: Join our Discord community

---

## 🌟 **The Future is AI + Blockchain**

**UmiAgentKit isn't just a toolkit - it's a revolution.**

For the first time in blockchain history, you can:
- Build complex applications by talking naturally
- Coordinate teams with intelligent multisig systems  
- Deploy to multiple virtual machines seamlessly
- Create gaming economies in minutes, not months

**Join the thousands of developers already building the future with UmiAgentKit.**

---

**🚀 Ready to revolutionize your Umi blockchain development?**

```bash
npm install umi-agent-kit
```

**The future of Umi blockchain development starts with a simple conversation.** 💬✨

---

*© 2025 UmiAgentKit - The World's Most Advanced AI-Powered Blockchain Toolkit*
