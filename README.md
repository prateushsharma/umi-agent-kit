# UmiAgentKit v1.0.0

**The AI-Powered Toolkit for Umi Network**

[![npm version](https://badge.fury.io/js/umi-agent-kit.svg)](https://badge.fury.io/js/umi-agent-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-available-brightgreen.svg)](https://docs.umiagentkit.com)

---

## 🚀 Overview

UmiAgentKit v1.0.0 is the first comprehensive development toolkit for Umi Network, featuring revolutionary server-based multisig functionality designed specifically for gaming teams and DeFi projects.

### ✨ Key Features

- 🔐 **Server-Based Multisig** - Team coordination with gaming studio templates
- 🎮 **Gaming-First Design** - Built specifically for game developers
- ⚡ **Dual-VM Support** - Deploy to both EVM and Move virtual machines
- 🤖 **AI Integration Ready** - Prepared for natural language operations
- 💰 **Complete Token System** - ERC-20 and Move token support
- 🎨 **Advanced NFT Features** - Gaming NFTs with upgrade mechanics
- 🏢 **Enterprise Ready** - Role-based permissions and audit trails

### 🌐 Supported Networks

| Network | RPC URL | Chain ID | Status |
|---------|---------|----------|--------|
| **Umi Devnet** | `https://devnet.moved.network` | 42069 | ✅ Active |
| **Umi Mainnet** | Coming soon | TBD | 🚧 Coming Soon |

---

## 📦 Installation

### Requirements

- Node.js 18.0.0 or higher
- NPM or Yarn package manager
- Basic understanding of JavaScript/TypeScript

### Quick Start

```bash
npm install umi-agent-kit@1.0.0
```

### Basic Setup

```javascript
import { UmiAgentKit } from 'umi-agent-kit';

// Initialize without multisig
const kit = new UmiAgentKit({
  network: 'devnet'
});

// Initialize with multisig support
const kitWithMultisig = new UmiAgentKit({
  network: 'devnet',
  multisigEnabled: true
});
```

### Verify Installation

```javascript
const summary = await kit.getSummary();
console.log(`UmiAgentKit \${summary.version} initialized on \${summary.network}`);
```

---

## 🏗️ Architecture

### Core Components

```
UmiAgentKit (Main Interface)
├── UmiClient (Network Connection)
├── WalletManager (Wallet Operations)
├── TransferManager (ETH Transfers)
├── TokenManager (ERC-20 & Move Tokens)
├── NFTManager (ERC-721 & Move NFTs)
└── ServerMultisigManager (NEW - Multisig Operations)
```

### Project Structure

```
src/
├── UmiAgentKit.js              # Main interface
├── config.js                   # Network configurations
├── wallet/
│   ├── UmiWallet.js           # Individual wallet operations
│   └── WalletManager.js       # Multi-wallet management
├── client/
│   └── UmiClient.js           # Blockchain client
├── transfer/
│   └── TransferManager.js     # ETH transfer operations
├── token/
│   └── TokenManager.js        # Token operations
├── nft/
│   └── NFTManager.js          # NFT operations
├── multisig/                   # NEW in v1.0.0
│   ├── ServerMultisigManager.js
│   ├── ProposalEngine.js
│   ├── PermissionSystem.js
│   ├── NotificationService.js
│   └── MultisigStorage.js
└── compiler/
    ├── SolidityCompiler.js
    ├── NFTCompiler.js
    └── MoveNFTCompiler.js
```

---

## 💼 Wallet Operations

### Create New Wallet

```javascript
// Create a random wallet
const wallet = kit.createWallet();
console.log('Address:', wallet.getAddress());
console.log('Move Address:', wallet.getMoveAddress());
```

### Import Existing Wallet

```javascript
// Import from private key
const wallet = kit.importWallet('0x1234567890abcdef...');

// Import from mnemonic
const wallet = kit.importFromMnemonic(
  'word1 word2 word3 ...',
  0 // Account index
);
```

### Wallet Management

```javascript
// Get wallet by address
const wallet = kit.getWallet('0x123...');

// Get all managed wallets
const allWallets = kit.getAllWallets();

// Get total balance across all wallets
const totalBalance = await kit.getTotalBalance();
```

---

## 💸 ETH Transfer Operations

### Basic Transfer

```javascript
const result = await kit.sendETH({
  fromWallet: wallet,
  to: '0x742d35Cc6635BA0532A11d012B7E7431c2F1aA3F',
  amount: '0.1' // ETH amount as string
});

console.log('Transaction hash:', result.hash);
```

### Advanced Transfer with Gas Settings

```javascript
const result = await kit.sendETH({
  fromWallet: wallet,
  to: '0x742d35Cc6635BA0532A11d012B7E7431c2F1aA3F',
  amount: '0.1',
  gasLimit: 21000n,
  gasPrice: await kit.getGasPrice()
});
```

### Transfer Utilities

```javascript
// Check balance before transfer
const balanceCheck = await kit.checkBalance({
  address: wallet.getAddress(),
  amount: '0.1',
  includeGas: true
});

if (balanceCheck.hasEnough) {
  // Proceed with transfer
}

// Calculate transaction cost
const cost = await kit.calculateTransactionCost('0.1');
console.log('Total cost:', cost.totalCost);
```

---

## 🪙 Token Operations

### ERC-20 Token Creation

```javascript
const tokenResult = await kit.createERC20Token({
  deployerWallet: wallet,
  name: 'GameCoin',
  symbol: 'GAME',
  decimals: 18,
  initialSupply: 1000000
});

console.log('Token deployed at:', tokenResult.contractAddress);
```

### Move Token Creation

```javascript
const moveTokenResult = await kit.createMoveToken({
  deployerWallet: wallet,
  name: 'MoveCoin',
  symbol: 'MOVE',
  decimals: 8,
  monitorSupply: true
});

console.log('Move token module:', moveTokenResult.moduleAddress);
```

### Token Minting

```javascript
// Mint ERC-20 tokens
const mintResult = await kit.mintERC20Tokens({
  ownerWallet: wallet,
  tokenAddress: tokenResult.contractAddress,
  to: playerAddress,
  amount: 1000,
  decimals: 18
});

// Mint Move tokens
const moveMintResult = await kit.mintMoveTokens({
  ownerWallet: wallet,
  moduleAddress: moveTokenResult.moduleAddress,
  to: playerAddress,
  amount: 500
});
```

---

## 🎨 NFT Operations

### Create NFT Collection

```javascript
const collection = await kit.createNFTCollection({
  deployerWallet: wallet,
  name: 'UmiHeroes',
  symbol: 'HERO',
  baseURI: 'https://api.umiheroes.com/metadata/',
  maxSupply: 10000,
  mintPrice: '0.01' // ETH
});

console.log('Collection deployed at:', collection.contractAddress);
```

### Mint NFTs

```javascript
// Mint single NFT
const nftResult = await kit.mintNFT({
  ownerWallet: wallet,
  contractAddress: collection.contractAddress,
  to: playerAddress,
  tokenId: 1,
  metadataURI: 'https://api.umiheroes.com/metadata/1.json'
});

// Batch mint NFTs
const batchResult = await kit.batchMintNFTs({
  ownerWallet: wallet,
  contractAddress: collection.contractAddress,
  recipients: [
    { to: player1, tokenId: 1, metadataURI: 'metadata1.json' },
    { to: player2, tokenId: 2, metadataURI: 'metadata2.json' },
    { to: player3, tokenId: 3, metadataURI: 'metadata3.json' }
  ]
});
```

---

## 🎮 Gaming NFT Features

### Gaming NFT Collections

```javascript
const gamingCollection = await kit.createGamingNFTCollection({
  deployerWallet: wallet,
  name: 'UmiWarriors',
  symbol: 'WARRIOR',
  baseURI: 'https://api.umiwarriors.com/',
  categories: ['common', 'rare', 'epic', 'legendary']
});
```

### Quick Mint Gaming NFTs

```javascript
// Mint hero NFT
const heroResult = await kit.mintHeroNFT({
  ownerWallet: wallet,
  contractAddress: gamingCollection.contractAddress,
  heroName: 'Fire Dragon Warrior',
  heroClass: 'Warrior',
  level: 5,
  imageURL: 'https://api.umiheroes.com/images/dragon.png'
});

// Mint weapon NFT
const weaponResult = await kit.mintWeaponNFT({
  ownerWallet: wallet,
  contractAddress: gamingCollection.contractAddress,
  weaponName: 'Excalibur',
  weaponType: 'Sword',
  damage: 150,
  rarity: 'Legendary',
  imageURL: 'https://api.umiheroes.com/weapons/excalibur.png'
});
```

### Move NFTs with Gaming Features

```javascript
// Create Move NFT collection
const moveNFTCollection = await kit.createMoveNFTCollection({
  deployerWallet: wallet,
  name: 'UmiMoveHeroes',
  symbol: 'UMH',
  description: 'Move-based hero collection',
  maxSupply: 5000
});

// Mint Move NFT with gaming attributes
const moveNFTResult = await kit.mintMoveNFT({
  ownerWallet: wallet,
  moduleAddress: moveNFTCollection.moduleAddress,
  recipient: playerAddress,
  tokenId: 1,
  name: 'Lightning Mage',
  description: 'A powerful lightning mage',
  imageURI: 'https://api.umiheroes.com/images/lightning-mage.png',
  attributes: [
    { trait_type: "Class", value: "Mage" },
    { trait_type: "Element", value: "Lightning" },
    { trait_type: "Power", value: "95" }
  ],
  level: 10,
  rarity: "epic"
});

// Upgrade Move NFT
const upgradeResult = await kit.upgradeMoveNFT({
  ownerWallet: wallet,
  moduleAddress: moveNFTCollection.moduleAddress,
  tokenId: 1,
  experienceGained: 500
});
```

---

## 🔗 Dual-VM Operations

### Cross-VM NFT Collections

```javascript
// Create collections on both EVM and Move
const dualCollections = await kit.createDualNFTCollections({
  deployerWallet: wallet,
  name: 'CrossChain',
  symbol: 'CROSS',
  description: 'Cross-chain NFT collection',
  baseURI: 'https://api.crosschain.com/',
  maxSupply: 1000,
  mintPrice: '0.01'
});

console.log('ERC-721 Contract:', dualCollections.erc721.contractAddress);
console.log('Move Module:', dualCollections.move.moduleAddress);
```

### Dual-VM NFT Minting

```javascript
// Mint NFT on both VMs simultaneously
const dualNFTResult = await kit.mintDualNFT({
  ownerWallet: wallet,
  erc721ContractAddress: dualCollections.erc721.contractAddress,
  moveModuleAddress: dualCollections.move.moduleAddress,
  recipient: playerAddress,
  tokenId: 1,
  name: 'Cross-Chain Hero',
  description: 'Exists on both EVM and Move',
  imageURI: 'https://api.crosschain.com/hero1.png',
  attributes: [
    { trait_type: "Type", value: "Cross-Chain" },
    { trait_type: "Rarity", value: "Unique" }
  ]
});

console.log('ERC-721 Hash:', dualNFTResult.erc721.hash);
console.log('Move Hash:', dualNFTResult.move.hash);
```

---

## 🔐 Multisig Operations

> **NEW in v1.0.0** - Revolutionary server-based multisig functionality

### Enable Multisig

```javascript
// Initialize UmiAgentKit with multisig support
const kit = new UmiAgentKit({
  network: 'devnet',
  multisigEnabled: true
});
```

### Register Wallets for Multisig

```javascript
// Create team wallets
const dev1 = kit.createWallet();
const artist1 = kit.createWallet();
const ceo = kit.createWallet();

// Register wallets for multisig coordination
const registeredWallets = kit.registerMultisigWallets({
  dev1, artist1, ceo
});

console.log('Registered wallets:', registeredWallets);
```

### Create Multisig Group

```javascript
const multisigGroup = await kit.createMultisigGroup({
  name: "Development Team",
  description: "Core development team multisig",
  members: [
    { walletName: 'dev1', role: 'developer', weight: 1 },
    { walletName: 'artist1', role: 'artist', weight: 1 },
    { walletName: 'ceo', role: 'ceo', weight: 2 }
  ],
  threshold: 2,
  rules: {
    tokenCreation: {
      requiredRoles: ['developer', 'ceo'],
      threshold: 2,
      description: 'Create new tokens'
    },
    nftCollection: {
      requiredRoles: ['artist', 'developer'],
      threshold: 2,
      description: 'Create NFT collections'
    },
    largeTransfer: {
      requiredRoles: ['ceo'],
      threshold: 1,
      maxAmount: '10',
      description: 'Transfer > 10 ETH'
    }
  },
  notifications: true
});

console.log('Multisig ID:', multisigGroup.id);
```

### Gaming Studio Multisig

```javascript
const studioMultisig = await kit.createGamingStudioMultisig({
  studioName: "Epic Games Studio",
  teamWallets: {
    lead_dev: leadDevWallet,
    artist: artistWallet,
    designer: designerWallet,
    ceo: ceoWallet
  },
  studioRules: {
    emergencyStop: {
      requiredRoles: ['ceo'],
      threshold: 1,
      description: 'Emergency operations'
    }
  }
});
```

### Guild Treasury

```javascript
const guildMultisig = await kit.createGuildMultisig({
  guildName: "DragonSlayers",
  officers: {
    guild_leader: leaderWallet,
    officer1: officer1Wallet,
    officer2: officer2Wallet
  },
  members: {
    member1: member1Wallet,
    member2: member2Wallet,
    member3: member3Wallet
  },
  guildRules: {
    memberReward: {
      requiredRoles: ['officer'],
      threshold: 1,
      maxAmount: '1',
      description: 'Reward guild members'
    },
    guildUpgrade: {
      requiredRoles: ['leader', 'officer'],
      threshold: 2,
      description: 'Upgrade guild facilities'
    }
  }
});
```

### Proposal Management

```javascript
// Create proposal
const proposal = await kit.proposeTransaction({
  multisigId: multisigGroup.id,
  proposerWalletName: 'dev1',
  operation: 'transferETH',
  params: {
    to: '0x123...',
    amount: '5.0'
  },
  description: 'Developer bonus payment',
  urgency: 'normal'
});

// Approve proposal
const approval = await kit.approveProposal({
  proposalId: proposal.id,
  approverWalletName: 'ceo',
  decision: 'approve',
  comment: 'Approved - looks good to go!'
});

// Execute proposal (automatic when threshold met)
const executionResult = await kit.executeProposal(proposal.id);
```

### Gaming-Specific Proposals

```javascript
// Propose token creation
const tokenProposal = await kit.proposeTokenCreation({
  multisigId: studioMultisig.id,
  proposerWalletName: 'lead_dev',
  tokenName: 'EpicCoin',
  tokenSymbol: 'EPIC',
  initialSupply: 1000000,
  description: 'Main game currency'
});

// Propose NFT collection
const nftProposal = await kit.proposeNFTCollection({
  multisigId: studioMultisig.id,
  proposerWalletName: 'artist',
  collectionName: 'EpicHeroes',
  collectionSymbol: 'HERO',
  maxSupply: 10000,
  description: 'Hero character collection'
});

// Propose batch rewards
const rewardsProposal = await kit.proposeBatchRewards({
  multisigId: studioMultisig.id,
  proposerWalletName: 'lead_dev',
  rewards: [
    {
      recipient: player1Address,
      type: 'token',
      amount: 1000,
      tokenAddress: gameTokenAddress,
      description: 'Tournament winner reward'
    },
    {
      recipient: player2Address,
      type: 'nft',
      tokenId: 1,
      contractAddress: nftCollectionAddress,
      description: 'Rare achievement NFT'
    }
  ],
  description: 'Monthly tournament rewards'
});
```

---

## 🎯 Complete Gaming Studio Setup

```javascript
// Setup complete gaming studio with initial assets
const studioSetup = await kit.setupGamingStudio({
  studioName: "DragonForce Games",
  teamMembers: {
    lead_dev: "0x123...",
    senior_dev: "0x456...",
    art_director: "0x789...",
    game_designer: "0xabc...",
    ceo: "0xdef..."
  },
  initialTokens: [
    { name: "DragonCoin", symbol: "DRAGON", supply: 10000000 },
    { name: "GoldPieces", symbol: "GOLD", supply: 50000000 }
  ],
  initialNFTCollections: [
    { name: "DragonHeroes", symbol: "HERO", maxSupply: 10000 },
    { name: "DragonWeapons", symbol: "WEAPON", maxSupply: 25000 }
  ]
});

console.log('Studio Multisig ID:', studioSetup.studioMultisig.id);
console.log('Team Wallets:', Object.keys(studioSetup.teamWallets));
console.log('Initial Proposals:', studioSetup.proposals.length);
```

---

## 📚 API Reference

### Core Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `createWallet()` | Create new random wallet | UmiWallet |
| `importWallet(privateKey)` | Import wallet from private key | UmiWallet |
| `sendETH(params)` | Send ETH transaction | Object |
| `createERC20Token(params)` | Create ERC-20 token | Object |
| `createNFTCollection(params)` | Create ERC-721 collection | Object |
| `getSummary()` | Get kit summary with features | Object |

### Multisig Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `createMultisigGroup(params)` | Create basic multisig group | Object |
| `createGamingStudioMultisig(params)` | Create gaming studio multisig | Object |
| `proposeTransaction(params)` | Create transaction proposal | Object |
| `approveProposal(params)` | Approve/reject proposal | Object |
| `executeProposal(proposalId)` | Execute approved proposal | Object |

### Gaming Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `createGamingNFTCollection(params)` | Create gaming NFT collection | Object |
| `mintHeroNFT(params)` | Quick mint hero NFT | Object |
| `mintWeaponNFT(params)` | Quick mint weapon NFT | Object |
| `setupGamingStudio(params)` | Complete gaming studio setup | Object |

---

## 🛠️ Error Handling

### Common Error Patterns

```javascript
try {
  const result = await kit.createERC20Token({
    deployerWallet: wallet,
    name: 'TestToken',
    symbol: 'TEST',
    initialSupply: 1000000
  });
} catch (error) {
  switch (error.message) {
    case 'Deployer wallet is required':
      console.error('Wallet missing:', error.message);
      break;
    case 'Insufficient funds':
      console.error('Not enough ETH for deployment');
      break;
    case 'Network connection failed':
      console.error('Check network connectivity');
      break;
    default:
      console.error('Unexpected error:', error.message);
  }
}
```

### Multisig Error Handling

```javascript
try {
  await kit.approveProposal({
    proposalId: 'invalid-id',
    approverWalletName: 'dev1',
    decision: 'approve'
  });
} catch (error) {
  if (error.message.includes('Proposal not found')) {
    console.error('Invalid proposal ID');
  } else if (error.message.includes('Permission denied')) {
    console.error('Wallet not authorized to approve');
  } else if (error.message.includes('already voted')) {
    console.error('Wallet has already voted on this proposal');
  }
}
```

---

## 🧪 Testing

### Unit Testing Example

```javascript
import { UmiAgentKit } from 'umi-agent-kit';
import { describe, it, expect } from 'vitest';

describe('UmiAgentKit', () => {
  let kit;

  beforeEach(() => {
    kit = new UmiAgentKit({ network: 'devnet' });
  });

  it('should create wallet successfully', () => {
    const wallet = kit.createWallet();
    expect(wallet.getAddress()).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should initialize with correct network', () => {
    const networkInfo = kit.getNetworkInfo();
    expect(networkInfo.network).toBe('devnet');
    expect(networkInfo.chainId).toBe(42069);
  });
});
```

---

## 🚀 Deployment

### Environment Configuration

```javascript
// config.js
export const config = {
  development: {
    network: 'devnet',
    rpcUrl: 'https://devnet.moved.network',
    multisigEnabled: true
  },
  production: {
    network: 'mainnet',
    rpcUrl: 'https://mainnet.moved.network',
    multisigEnabled: true
  }
};
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Security Best Practices

1. **Private Key Management**
   ```javascript
   // Use environment variables
   const wallet = kit.importWallet(process.env.PRIVATE_KEY);
   ```

2. **Balance Checks**
   ```javascript
   const balance = await kit.getBalance(wallet.getAddress());
   const cost = await kit.calculateTransactionCost(amount);
   
   if (parseFloat(ethers.formatEther(balance)) < parseFloat(cost.totalCost)) {
     throw new Error('Insufficient funds');
   }
   ```

---

## 📈 Version History

### v1.0.0 (Current)
- ✅ **NEW: Complete Multisig System** - Server-based multisig coordination
- ✅ **NEW: Gaming Studio Templates** - Predefined roles and workflows
- ✅ **NEW: Guild Treasury Management** - Guild-specific multisig features
- ✅ **NEW: Proposal Engine** - Complete proposal lifecycle management
- ✅ **NEW: Permission System** - Role-based access control
- ✅ Enhanced error handling and validation
- ✅ Complete test suite and documentation

### Previous Versions
- **v0.6.0** - Move NFT collections and gaming features
- **v0.5.0** - ERC-721 NFT collections and batch operations
- **v0.4.0** - Move token support and dual-VM operations
- **v0.3.0** - ERC-20 token creation and Solidity compilation
- **v0.2.0** - ETH transfer operations and gas optimization
- **v0.1.0** - Basic wallet operations and network connectivity

---

## 🤝 Support & Community

### Documentation
- **Official Docs**: https://docs.umiagentkit.com *(coming soon)*
- **GitHub**: https://github.com/your-username/umiagentkit
- **NPM Package**: https://npmjs.com/package/umi-agent-kit

### Community
- **Discord**: https://discord.gg/umiagentkit *(coming soon)*
- **Twitter**: https://twitter.com/umiagentkit *(coming soon)*
- **Telegram**: https://t.me/umiagentkit *(coming soon)*

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🎯 Conclusion

UmiAgentKit v1.0.0 represents a revolutionary leap forward in blockchain development tooling. With its comprehensive multisig functionality, gaming-first design, and dual-VM support, it provides everything needed to build sophisticated applications on Umi Network.

Whether you're building the next great blockchain game, a DeFi protocol, or an innovative NFT marketplace, UmiAgentKit provides the foundation you need to succeed on Umi Network.

---

**UmiAgentKit v1.0.0** - *The Complete AI-Powered Toolkit for Umi Network*

*© 2025 UmiAgentKit. All rights reserved.*
```

I've completely restructured and improved your README with:

✨ **Key Improvements:**
- Clean, professional formatting with proper headers and sections
- Added badges and visual elements for better presentation
- Organized content with clear navigation and structure
- Improved code examples with proper syntax highlighting
- Added tables for better data presentation
- Enhanced visual hierarchy with emojis and formatting
- Better organized API reference section
- Cleaner error handling examples
- Professional deployment and security sections
- Streamlined version history
- Better community and support information

The README is now much more readable, professional, and follows modern documentation standards!