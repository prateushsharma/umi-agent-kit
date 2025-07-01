\# UmiAgentKit v1.0.0 - Complete Documentation

\*\*The AI-Powered Toolkit for Umi Network\*\* \*Complete API Reference
& Developer Guide\*

\-\--

\## Table of Contents

1\. \[Project Overview\](#project-overview) 2. \[Installation &
Setup\](#installation\--setup) 3. \[Core
Architecture\](#core-architecture) 4. \[Wallet
Operations\](#wallet-operations) 5. \[ETH Transfer
Operations\](#eth-transfer-operations) 6. \[Token Operations (ERC-20 &
Move)\](#token-operations) 7. \[NFT Operations (ERC-721 &
Move)\](#nft-operations) 8. \[Gaming NFT
Features\](#gaming-nft-features) 9. \[Dual-VM
Operations\](#dual-vm-operations) 10. \[Multisig Operations (NEW
v1.0.0)\](#multisig-operations) 11. \[Gaming Studio
Management\](#gaming-studio-management) 12. \[Complete API
Reference\](#complete-api-reference) 13. \[Usage
Examples\](#usage-examples) 14. \[Error Handling\](#error-handling) 15.
\[Testing & Validation\](#testing\--validation) 16. \[Deployment
Guide\](#deployment-guide)

\-\--

\## Project Overview

\### What is UmiAgentKit?

UmiAgentKit v1.0.0 is the first comprehensive development toolkit for
Umi Network, featuring revolutionary server-based multisig functionality
designed specifically for gaming teams and DeFi projects.

\### Key Features

\- 🔐 \*\*Server-Based Multisig\*\* - Team coordination with gaming
studio templates - 🎮 \*\*Gaming-First Design\*\* - Built specifically
for game developers - ⚡ \*\*Dual-VM Support\*\* - Deploy to both EVM
and Move virtual machines - 🤖 \*\*AI Integration Ready\*\* - Prepared
for natural language operations - 💰 \*\*Complete Token System\*\* -
ERC-20 and Move token support - 🎨 \*\*Advanced NFT Features\*\* -
Gaming NFTs with upgrade mechanics - 🏢 \*\*Enterprise Ready\*\* -
Role-based permissions and audit trails

\### Supported Networks

\- \*\*Umi Devnet\*\*: \`https://devnet.moved.network\` (Chain ID:
42069) - \*\*Umi Mainnet\*\*: Coming soon

\-\--

\## Installation & Setup

\### Requirements

\- Node.js 18.0.0 or higher - NPM or Yarn package manager - Basic
understanding of JavaScript/TypeScript

\### Installation

\`\`\`bash npm install umi-agent-kit@1.0.0 \`\`\`

\### Basic Setup

\`\`\`javascript import { UmiAgentKit } from \'umi-agent-kit\';

// Initialize without multisig const kit = new UmiAgentKit({ network:
\'devnet\' });

// Initialize with multisig support const kitWithMultisig = new
UmiAgentKit({ network: \'devnet\', multisigEnabled: true }); \`\`\`

\### Verification

\`\`\`javascript // Verify installation const summary = await
kit.getSummary(); console.log(\`UmiAgentKit \${summary.version}
initialized on \${summary.network}\`); \`\`\`

\-\--

\## Core Architecture

\### Main Components

\`\`\` UmiAgentKit (Main Interface) ├── UmiClient (Network Connection)
├── WalletManager (Wallet Operations) ├── TransferManager (ETH
Transfers) ├── TokenManager (ERC-20 & Move Tokens) ├── NFTManager
(ERC-721 & Move NFTs) └── ServerMultisigManager (NEW - Multisig
Operations) \`\`\`

\### File Structure

\`\`\` src/ ├── UmiAgentKit.js \# Main interface ├── config.js \#
Network configurations ├── wallet/ │ ├── UmiWallet.js \# Individual
wallet operations │ └── WalletManager.js \# Multi-wallet management ├──
client/ │ └── UmiClient.js \# Blockchain client ├── transfer/ │ └──
TransferManager.js \# ETH transfer operations ├── token/ │ └──
TokenManager.js \# Token operations ├── nft/ │ └── NFTManager.js \# NFT
operations ├── multisig/ \# NEW in v1.0.0 │ ├── ServerMultisigManager.js
│ ├── ProposalEngine.js │ ├── PermissionSystem.js │ ├──
NotificationService.js │ └── MultisigStorage.js └── compiler/ ├──
SolidityCompiler.js ├── NFTCompiler.js └── MoveNFTCompiler.js \`\`\`

\-\--

\## Wallet Operations

\### Create New Wallet

\`\`\`javascript // Create a random wallet const wallet =
kit.createWallet(); console.log(\'Address:\', wallet.getAddress());
console.log(\'Move Address:\', wallet.getMoveAddress()); \`\`\`

\### Import Wallet

\`\`\`javascript // Import from private key const wallet =
kit.importWallet(\'0x1234567890abcdef\...\');

// Import from mnemonic const wallet = kit.importFromMnemonic( \'word1
word2 word3 \...\', 0 // Account index ); \`\`\`

\### Wallet Management

\`\`\`javascript // Get wallet by address const wallet =
kit.getWallet(\'0x123\...\');

// Get all managed wallets const allWallets = kit.getAllWallets();

// Get wallet count const count = kit.walletManager.getWalletCount();

// Get total balance across all wallets const totalBalance = await
kit.getTotalBalance(); \`\`\`

\### Mnemonic Operations

\`\`\`javascript // Generate new mnemonic const mnemonic =
kit.generateMnemonic();

// Validate mnemonic const isValid = kit.validateMnemonic(mnemonic);
\`\`\`

\-\--

\## ETH Transfer Operations

\### Basic ETH Transfer

\`\`\`javascript // Send ETH from wallet to address const result = await
kit.sendETH({ fromWallet: wallet, to:
\'0x742d35Cc6635BA0532A11d012B7E7431c2F1aA3F\', amount: \'0.1\' // ETH
amount as string });

console.log(\'Transaction hash:\', result.hash); \`\`\`

\### Advanced Transfer Options

\`\`\`javascript // Send with custom gas settings const result = await
kit.sendETH({ fromWallet: wallet, to:
\'0x742d35Cc6635BA0532A11d012B7E7431c2F1aA3F\', amount: \'0.1\',
gasLimit: 21000n, gasPrice: await kit.getGasPrice() }); \`\`\`

\### Transfer Utilities

\`\`\`javascript // Check balance before transfer const balanceCheck =
await kit.checkBalance({ address: wallet.getAddress(), amount: \'0.1\',
includeGas: true });

if (balanceCheck.hasEnough) { // Proceed with transfer }

// Calculate transaction cost const cost = await
kit.calculateTransactionCost(\'0.1\'); console.log(\'Total cost:\',
cost.totalCost);

// Estimate gas const gasEstimate = await kit.estimateGas({ from:
wallet.getAddress(), to: \'0x742d35Cc6635BA0532A11d012B7E7431c2F1aA3F\',
amount: \'0.1\' }); \`\`\`

\### Transaction Monitoring

\`\`\`javascript // Wait for confirmation const receipt = await
kit.waitForConfirmation(hash, 1);

// Get transaction status const status = await
kit.getTransactionStatus(hash);

// Get transaction details const transaction = await
kit.getTransaction(hash); \`\`\`

\-\--

\## Token Operations

\### ERC-20 Token Creation

\`\`\`javascript // Create ERC-20 token const tokenResult = await
kit.createERC20Token({ deployerWallet: wallet, name: \'GameCoin\',
symbol: \'GAME\', decimals: 18, initialSupply: 1000000 });

console.log(\'Token deployed at:\', tokenResult.contractAddress);
console.log(\'Transaction hash:\', tokenResult.hash); \`\`\`

\### Move Token Creation

\`\`\`javascript // Create Move token const moveTokenResult = await
kit.createMoveToken({ deployerWallet: wallet, name: \'MoveCoin\',
symbol: \'MOVE\', decimals: 8, monitorSupply: true });

console.log(\'Move token module:\', moveTokenResult.moduleAddress);
\`\`\`

\### Token Minting

\`\`\`javascript // Mint ERC-20 tokens const mintResult = await
kit.mintERC20Tokens({ ownerWallet: wallet, tokenAddress:
tokenResult.contractAddress, to: playerAddress, amount: 1000, decimals:
18 });

// Mint Move tokens const moveMintResult = await kit.mintMoveTokens({
ownerWallet: wallet, moduleAddress: moveTokenResult.moduleAddress, to:
playerAddress, amount: 500 }); \`\`\`

\### Token Transfers

\`\`\`javascript // Transfer ERC-20 tokens const transferResult = await
kit.transferERC20Tokens({ fromWallet: wallet, tokenAddress:
tokenResult.contractAddress, to: recipientAddress, amount: 100,
decimals: 18 }); \`\`\`

\### Token Balance Queries

\`\`\`javascript // Get ERC-20 balance const balance = await
kit.getERC20Balance({ tokenAddress: tokenResult.contractAddress,
address: wallet.getAddress(), decimals: 18 });

// Get token balance for a wallet const walletBalance = await
kit.getTokenBalance({ wallet: wallet, tokenAddress:
tokenResult.contractAddress, decimals: 18 }); \`\`\`

\-\--

\## NFT Operations

\### ERC-721 NFT Collections

\`\`\`javascript // Create NFT collection const collection = await
kit.createNFTCollection({ deployerWallet: wallet, name: \'UmiHeroes\',
symbol: \'HERO\', baseURI: \'https://api.umiheroes.com/metadata/\',
maxSupply: 10000, mintPrice: \'0.01\' // ETH });

console.log(\'Collection deployed at:\', collection.contractAddress);
\`\`\`

\### Individual NFT Minting

\`\`\`javascript // Mint single NFT const nftResult = await
kit.mintNFT({ ownerWallet: wallet, contractAddress:
collection.contractAddress, to: playerAddress, tokenId: 1, metadataURI:
\'https://api.umiheroes.com/metadata/1.json\' }); \`\`\`

\### Batch NFT Minting

\`\`\`javascript // Batch mint NFTs const batchResult = await
kit.batchMintNFTs({ ownerWallet: wallet, contractAddress:
collection.contractAddress, recipients: \[ { to: player1, tokenId: 1,
metadataURI: \'metadata1.json\' }, { to: player2, tokenId: 2,
metadataURI: \'metadata2.json\' }, { to: player3, tokenId: 3,
metadataURI: \'metadata3.json\' } \] }); \`\`\`

\### NFT Transfers

\`\`\`javascript // Transfer NFT const transferResult = await
kit.transferNFT({ fromWallet: wallet, contractAddress:
collection.contractAddress, from: currentOwner, to: newOwner, tokenId: 1
}); \`\`\`

\### NFT Queries

\`\`\`javascript // Get NFT owner const owner = await kit.getNFTOwner({
contractAddress: collection.contractAddress, tokenId: 1 });

// Get NFT metadata const metadata = await kit.getNFTMetadata({
contractAddress: collection.contractAddress, tokenId: 1 });

// Get NFT balance for address const nftBalance = await
kit.getNFTBalance({ contractAddress: collection.contractAddress,
address: wallet.getAddress() });

// Get collection information const collectionInfo = await
kit.getCollectionInfo({ contractAddress: collection.contractAddress });
\`\`\`

\-\--

\## Gaming NFT Features

\### Gaming NFT Collections

\`\`\`javascript // Create gaming-specific NFT collection const
gamingCollection = await kit.createGamingNFTCollection({ deployerWallet:
wallet, name: \'UmiWarriors\', symbol: \'WARRIOR\', baseURI:
\'https://api.umiwarriors.com/\', categories: \[\'common\', \'rare\',
\'epic\', \'legendary\'\] }); \`\`\`

\### Hero NFTs

\`\`\`javascript // Quick mint hero NFT const heroResult = await
kit.mintHeroNFT({ ownerWallet: wallet, contractAddress:
gamingCollection.contractAddress, heroName: \'Fire Dragon Warrior\',
heroClass: \'Warrior\', level: 5, imageURL:
\'https://api.umiheroes.com/images/dragon.png\' }); \`\`\`

\### Weapon NFTs

\`\`\`javascript // Quick mint weapon NFT const weaponResult = await
kit.mintWeaponNFT({ ownerWallet: wallet, contractAddress:
gamingCollection.contractAddress, weaponName: \'Excalibur\', weaponType:
\'Sword\', damage: 150, rarity: \'Legendary\', imageURL:
\'https://api.umiheroes.com/weapons/excalibur.png\' }); \`\`\`

\### Move NFT Collections

\`\`\`javascript // Create Move NFT collection const moveNFTCollection =
await kit.createMoveNFTCollection({ deployerWallet: wallet, name:
\'UmiMoveHeroes\', symbol: \'UMH\', description: \'Move-based hero
collection\', maxSupply: 5000 }); \`\`\`

\### Move NFT Minting with Gaming Features

\`\`\`javascript // Mint Move NFT with gaming attributes const
moveNFTResult = await kit.mintMoveNFT({ ownerWallet: wallet,
moduleAddress: moveNFTCollection.moduleAddress, recipient:
playerAddress, tokenId: 1, name: \'Lightning Mage\', description: \'A
powerful lightning mage\', imageURI:
\'https://api.umiheroes.com/images/lightning-mage.png\', attributes: \[
{ trait_type: \"Class\", value: \"Mage\" }, { trait_type: \"Element\",
value: \"Lightning\" }, { trait_type: \"Power\", value: \"95\" } \],
level: 10, rarity: \"epic\" }); \`\`\`

\### NFT Upgrades (Move Only)

\`\`\`javascript // Upgrade Move NFT const upgradeResult = await
kit.upgradeMoveNFT({ ownerWallet: wallet, moduleAddress:
moveNFTCollection.moduleAddress, tokenId: 1, experienceGained: 500 });
\`\`\`

\### Gaming Move NFT Collections

\`\`\`javascript // Create gaming Move NFT collection const
gamingMoveCollection = await kit.createGamingMoveNFTCollection({
deployerWallet: wallet, name: \'UmiGameAssets\', symbol: \'UGA\',
categories: \[\'weapon\', \'armor\', \'accessory\', \'consumable\'\] });
\`\`\`

\-\--

\## Dual-VM Operations

\### Cross-VM NFT Collections

\`\`\`javascript // Create collections on both EVM and Move const
dualCollections = await kit.createDualNFTCollections({ deployerWallet:
wallet, name: \'CrossChain\', symbol: \'CROSS\', description:
\'Cross-chain NFT collection\', baseURI:
\'https://api.crosschain.com/\', maxSupply: 1000, mintPrice: \'0.01\'
});

console.log(\'ERC-721 Contract:\',
dualCollections.erc721.contractAddress); console.log(\'Move Module:\',
dualCollections.move.moduleAddress); \`\`\`

\### Dual-VM NFT Minting

\`\`\`javascript // Mint NFT on both VMs simultaneously const
dualNFTResult = await kit.mintDualNFT({ ownerWallet: wallet,
erc721ContractAddress: dualCollections.erc721.contractAddress,
moveModuleAddress: dualCollections.move.moduleAddress, recipient:
playerAddress, tokenId: 1, name: \'Cross-Chain Hero\', description:
\'Exists on both EVM and Move\', imageURI:
\'https://api.crosschain.com/hero1.png\', attributes: \[ { trait_type:
\"Type\", value: \"Cross-Chain\" }, { trait_type: \"Rarity\", value:
\"Unique\" } \] });

console.log(\'ERC-721 Hash:\', dualNFTResult.erc721.hash);
console.log(\'Move Hash:\', dualNFTResult.move.hash); \`\`\`

\-\--

\## Multisig Operations

\*NEW in v1.0.0 - Revolutionary server-based multisig functionality\*

\### Enable Multisig

\`\`\`javascript // Initialize UmiAgentKit with multisig support const
kit = new UmiAgentKit({ network: \'devnet\', multisigEnabled: true });
\`\`\`

\### Register Wallets for Multisig

\`\`\`javascript // Create team wallets const dev1 = kit.createWallet();
const artist1 = kit.createWallet(); const ceo = kit.createWallet();

// Register wallets for multisig coordination const registeredWallets =
kit.registerMultisigWallets({ dev1, artist1, ceo });

console.log(\'Registered wallets:\', registeredWallets); // Output:
\[\'dev1\', \'artist1\', \'ceo\'\] \`\`\`

\### Create Basic Multisig Group

\`\`\`javascript // Create basic multisig group const multisigGroup =
await kit.createMultisigGroup({ name: \"Development Team\", description:
\"Core development team multisig\", members: \[ { walletName: \'dev1\',
role: \'developer\', weight: 1 }, { walletName: \'artist1\', role:
\'artist\', weight: 1 }, { walletName: \'ceo\', role: \'ceo\', weight: 2
} \], threshold: 2, rules: { tokenCreation: { requiredRoles:
\[\'developer\', \'ceo\'\], threshold: 2, description: \'Create new
tokens\' }, nftCollection: { requiredRoles: \[\'artist\',
\'developer\'\], threshold: 2, description: \'Create NFT collections\'
}, largeTransfer: { requiredRoles: \[\'ceo\'\], threshold: 1, maxAmount:
\'10\', description: \'Transfer \> 10 ETH\' } }, notifications: true });

console.log(\'Multisig ID:\', multisigGroup.id); \`\`\`

\### Create Gaming Studio Multisig

\`\`\`javascript // Create gaming studio with predefined roles const
studioMultisig = await kit.createGamingStudioMultisig({ studioName:
\"Epic Games Studio\", teamWallets: { lead_dev: leadDevWallet, artist:
artistWallet, designer: designerWallet, ceo: ceoWallet }, studioRules: {
// Custom rules override defaults emergencyStop: { requiredRoles:
\[\'ceo\'\], threshold: 1, description: \'Emergency operations\' } } });
\`\`\`

\### Create Guild Treasury

\`\`\`javascript // Create guild multisig for gaming guilds const
guildMultisig = await kit.createGuildMultisig({ guildName:
\"DragonSlayers\", officers: { guild_leader: leaderWallet, officer1:
officer1Wallet, officer2: officer2Wallet }, members: { member1:
member1Wallet, member2: member2Wallet, member3: member3Wallet },
guildRules: { memberReward: { requiredRoles: \[\'officer\'\], threshold:
1, maxAmount: \'1\', description: \'Reward guild members\' },
guildUpgrade: { requiredRoles: \[\'leader\', \'officer\'\], threshold:
2, description: \'Upgrade guild facilities\' } } }); \`\`\`

\### Proposal Creation

\`\`\`javascript // Generic transaction proposal const proposal = await
kit.proposeTransaction({ multisigId: multisigGroup.id,
proposerWalletName: \'dev1\', operation: \'transferETH\', params: { to:
\'0x123\...\', amount: \'5.0\' }, description: \'Developer bonus
payment\', urgency: \'normal\' // \'low\', \'normal\', \'high\',
\'emergency\' });

console.log(\'Proposal ID:\', proposal.id); \`\`\`

\### Gaming-Specific Proposals

\`\`\`javascript // Propose token creation const tokenProposal = await
kit.proposeTokenCreation({ multisigId: studioMultisig.id,
proposerWalletName: \'lead_dev\', tokenName: \'EpicCoin\', tokenSymbol:
\'EPIC\', initialSupply: 1000000, description: \'Main game currency\'
});

// Propose NFT collection const nftProposal = await
kit.proposeNFTCollection({ multisigId: studioMultisig.id,
proposerWalletName: \'artist\', collectionName: \'EpicHeroes\',
collectionSymbol: \'HERO\', maxSupply: 10000, description: \'Hero
character collection\' });

// Propose batch rewards const rewardsProposal = await
kit.proposeBatchRewards({ multisigId: studioMultisig.id,
proposerWalletName: \'lead_dev\', rewards: \[ { recipient:
player1Address, type: \'token\', amount: 1000, tokenAddress:
gameTokenAddress, description: \'Tournament winner reward\' }, {
recipient: player2Address, type: \'nft\', tokenId: 1, contractAddress:
nftCollectionAddress, description: \'Rare achievement NFT\' } \],
description: \'Monthly tournament rewards\' });

// Propose large transfer with high urgency const urgentTransfer = await
kit.proposeLargeTransfer({ multisigId: studioMultisig.id,
proposerWalletName: \'ceo\', to: emergencyAddress, amount: \'50.0\',
description: \'Emergency funding for critical issue\' }); \`\`\`

\### Proposal Approval

\`\`\`javascript // Approve a proposal const approval = await
kit.approveProposal({ proposalId: proposal.id, approverWalletName:
\'ceo\', decision: \'approve\', comment: \'Approved - looks good to
go!\' });

// Reject a proposal const rejection = await kit.approveProposal({
proposalId: proposal.id, approverWalletName: \'ceo\', decision:
\'reject\', comment: \'Not approved at this time\' }); \`\`\`

\### Proposal Execution

\`\`\`javascript // Execute approved proposal (automatic when threshold
met) const executionResult = await kit.executeProposal(proposal.id);

console.log(\'Execution result:\', executionResult); // Output includes
transaction hash and execution details \`\`\`

\### Multisig Information Queries

\`\`\`javascript // Get multisig group information const groupInfo =
kit.getMultisigGroup(multisigGroup.id);

// Get all multisig groups const allGroups = kit.getAllMultisigGroups();

// Get pending proposals const pendingProposals = await
kit.getPendingProposals(multisigGroup.id);

// Get proposals requiring action from specific wallet const
actionRequired = await kit.getProposalsRequiringAction(\'dev1\');

// Get proposal statistics const stats = await
kit.multisigManager.proposalEngine.getProposalStats(multisigGroup.id);
\`\`\`

\-\--

\## Gaming Studio Management

\### Complete Studio Setup

\`\`\`javascript // Setup complete gaming studio with initial assets
const studioSetup = await kit.setupGamingStudio({ studioName:
\"DragonForce Games\", teamMembers: { lead_dev: \"0x123\...\",
senior_dev: \"0x456\...\", art_director: \"0x789\...\", game_designer:
\"0xabc\...\", ceo: \"0xdef\...\" }, initialTokens: \[ { name:
\"DragonCoin\", symbol: \"DRAGON\", supply: 10000000 }, { name:
\"GoldPieces\", symbol: \"GOLD\", supply: 50000000 } \],
initialNFTCollections: \[ { name: \"DragonHeroes\", symbol: \"HERO\",
maxSupply: 10000 }, { name: \"DragonWeapons\", symbol: \"WEAPON\",
maxSupply: 25000 } \] });

console.log(\'Studio Multisig ID:\', studioSetup.studioMultisig.id);
console.log(\'Team Wallets:\', Object.keys(studioSetup.teamWallets));
console.log(\'Initial Proposals:\', studioSetup.proposals.length);
\`\`\`

\### Studio Workflow Example

\`\`\`javascript // 1. Developer proposes new game token const
gameTokenProposal = await kit.proposeTokenCreation({ multisigId:
studioSetup.studioMultisig.id, proposerWalletName: \'lead_dev\',
tokenName: \'BattlePoints\', tokenSymbol: \'BP\', initialSupply:
5000000, description: \'In-game battle points for PvP rewards\' });

// 2. Art director and CEO approve await kit.approveProposal({
proposalId: gameTokenProposal.id, approverWalletName: \'art_director\',
decision: \'approve\', comment: \'Great for PvP incentives\' });

await kit.approveProposal({ proposalId: gameTokenProposal.id,
approverWalletName: \'ceo\', decision: \'approve\', comment: \'Approved
for Q4 launch\' });

// 3. Proposal auto-executes when threshold met // BattlePoints token is
now deployed!

// 4. Game designer proposes player rewards const playerRewards = await
kit.proposeBatchRewards({ multisigId: studioSetup.studioMultisig.id,
proposerWalletName: \'game_designer\', rewards: \[ { recipient:
\'0x111\...\', type: \'token\', amount: 5000, description: \'Top player
monthly reward\' }, { recipient: \'0x222\...\', type: \'nft\', tokenId:
100, description: \'Legendary weapon for tournament winner\' } \],
description: \'Monthly competitive rewards distribution\' }); \`\`\`

\-\--

\## Complete API Reference

\### UmiAgentKit Constructor

\`\`\`javascript new UmiAgentKit(config) \`\`\`

\*\*Parameters:\*\* - \`config\` (Object):  - \`network\` (String):
\'devnet\' or \'mainnet\'  - \`multisigEnabled\` (Boolean): Enable
multisig functionality  - \`rpcUrl\` (String, optional): Custom RPC URL

\### Wallet Methods

\| Method \| Description \| Returns \|
\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\| \|
\`createWallet()\` \| Create new random wallet \| UmiWallet \| \|
\`importWallet(privateKey)\` \| Import wallet from private key \|
UmiWallet \| \| \`importFromMnemonic(mnemonic, index)\` \| Import from
mnemonic phrase \| UmiWallet \| \| \`getWallet(address)\` \| Get wallet
by address \| UmiWallet \\\| null \| \| \`getAllWallets()\` \| Get all
managed wallets \| UmiWallet\[\] \| \| \`generateMnemonic()\` \|
Generate new mnemonic \| String \| \| \`validateMnemonic(mnemonic)\` \|
Validate mnemonic phrase \| Boolean \|

\### Transfer Methods

\| Method \| Description \| Returns \|
\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\| \|
\`sendETH(params)\` \| Send ETH transaction \| Object \| \|
\`checkBalance(params)\` \| Check if wallet has sufficient balance \|
Object \| \| \`calculateTransactionCost(amount)\` \| Calculate
transaction cost \| Object \| \| \`estimateGas(params)\` \| Estimate gas
for transaction \| BigInt \| \| \`waitForConfirmation(hash,
confirmations)\` \| Wait for transaction confirmation \| Object \| \|
\`getTransactionStatus(hash)\` \| Get transaction status \| Object \|

\### Token Methods

\| Method \| Description \| Returns \|
\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\| \|
\`createERC20Token(params)\` \| Create ERC-20 token \| Object \| \|
\`createMoveToken(params)\` \| Create Move token \| Object \| \|
\`mintERC20Tokens(params)\` \| Mint ERC-20 tokens \| Object \| \|
\`mintMoveTokens(params)\` \| Mint Move tokens \| Object \| \|
\`transferERC20Tokens(params)\` \| Transfer ERC-20 tokens \| Object \|
\| \`getERC20Balance(params)\` \| Get ERC-20 token balance \| String \|
\| \`getTokenBalance(params)\` \| Get token balance for wallet \| String
\|

\### NFT Methods

\| Method \| Description \| Returns \|
\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\| \|
\`createNFTCollection(params)\` \| Create ERC-721 collection \| Object
\| \| \`createMoveNFTCollection(params)\` \| Create Move NFT collection
\| Object \| \| \`mintNFT(params)\` \| Mint single NFT \| Object \| \|
\`batchMintNFTs(params)\` \| Batch mint NFTs \| Object \| \|
\`mintMoveNFT(params)\` \| Mint Move NFT \| Object \| \|
\`transferNFT(params)\` \| Transfer NFT \| Object \| \|
\`getNFTOwner(params)\` \| Get NFT owner \| String \| \|
\`getNFTMetadata(params)\` \| Get NFT metadata \| Object \| \|
\`upgradeMoveNFT(params)\` \| Upgrade Move NFT \| Object \|

\### Gaming NFT Methods

\| Method \| Description \| Returns \|
\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\| \|
\`createGamingNFTCollection(params)\` \| Create gaming NFT collection \|
Object \| \| \`mintHeroNFT(params)\` \| Quick mint hero NFT \| Object \|
\| \`mintWeaponNFT(params)\` \| Quick mint weapon NFT \| Object \| \|
\`mintMoveHeroNFT(params)\` \| Mint Move hero NFT \| Object \| \|
\`mintMoveWeaponNFT(params)\` \| Mint Move weapon NFT \| Object \| \|
\`createGamingMoveNFTCollection(params)\` \| Create gaming Move
collection \| Object \|

\### Dual-VM Methods

\| Method \| Description \| Returns \|
\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\| \|
\`createDualNFTCollections(params)\` \| Create collections on both VMs
\| Object \| \| \`mintDualNFT(params)\` \| Mint NFT on both VMs
simultaneously \| Object \|

\### Multisig Methods

\| Method \| Description \| Returns \|
\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\| \|
\`registerMultisigWallets(wallets)\` \| Register wallets for multisig \|
String\[\] \| \| \`createMultisigGroup(params)\` \| Create basic
multisig group \| Object \| \| \`createGamingStudioMultisig(params)\` \|
Create gaming studio multisig \| Object \| \|
\`createGuildMultisig(params)\` \| Create guild treasury multisig \|
Object \| \| \`proposeTransaction(params)\` \| Create transaction
proposal \| Object \| \| \`proposeTokenCreation(params)\` \| Propose
token creation \| Object \| \| \`proposeNFTCollection(params)\` \|
Propose NFT collection \| Object \| \| \`proposeBatchRewards(params)\`
\| Propose batch rewards \| Object \| \|
\`proposeLargeTransfer(params)\` \| Propose large ETH transfer \| Object
\| \| \`approveProposal(params)\` \| Approve/reject proposal \| Object
\| \| \`executeProposal(proposalId)\` \| Execute approved proposal \|
Object \| \| \`getMultisigGroup(id)\` \| Get multisig group info \|
Object \| \| \`getAllMultisigGroups()\` \| Get all multisig groups \|
Object\[\] \| \| \`getPendingProposals(multisigId)\` \| Get pending
proposals \| Object\[\] \| \|
\`getProposalsRequiringAction(walletName)\` \| Get proposals needing
action \| Object\[\] \|

\### Gaming Studio Methods

\| Method \| Description \| Returns \|
\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\| \|
\`setupGamingStudio(params)\` \| Complete gaming studio setup \| Object
\|

\### Utility Methods

\| Method \| Description \| Returns \|
\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\| \|
\`getSummary()\` \| Get kit summary with features \| Object \| \|
\`getNetworkInfo()\` \| Get network information \| Object \| \|
\`getBlockNumber()\` \| Get current block number \| BigInt \| \|
\`getGasPrice()\` \| Get current gas price \| BigInt \| \|
\`getBalance(address)\` \| Get ETH balance for address \| BigInt \| \|
\`getTotalBalance()\` \| Get total balance across wallets \| String \|
\| \`close()\` \| Cleanup and close kit \| void \|

\-\--

\## Usage Examples

\### Example 1: Basic Setup

\`\`\`javascript import { UmiAgentKit } from \'umi-agent-kit\';

// Initialize UmiAgentKit const kit = new UmiAgentKit({ network:
\'devnet\', multisigEnabled: true });

// Create wallet const wallet = kit.createWallet(); console.log(\'Wallet
created:\', wallet.getAddress());

// Check network const summary = await kit.getSummary();
console.log(\'Connected to:\', summary.network); \`\`\`

\### Example 2: Token Creation and Management

\`\`\`javascript // Create game token const gameToken = await
kit.createERC20Token({ deployerWallet: wallet, name: \'GameCoin\',
symbol: \'GAME\', decimals: 18, initialSupply: 1000000 });

console.log(\'Token deployed:\', gameToken.contractAddress);

// Mint tokens to players await kit.mintERC20Tokens({ ownerWallet:
wallet, tokenAddress: gameToken.contractAddress, to: playerAddress,
amount: 1000 });

// Check player balance const balance = await kit.getERC20Balance({
tokenAddress: gameToken.contractAddress, address: playerAddress });

console.log(\'Player balance:\', balance, \'GAME\'); \`\`\`

\### Example 3: NFT Collection and Minting

\`\`\`javascript // Create hero NFT collection const heroCollection =
await kit.createNFTCollection({ deployerWallet: wallet, name:
\'EpicHeroes\', symbol: \'HERO\', baseURI:
\'https://api.epicgame.com/heroes/\', maxSupply: 10000, mintPrice:
\'0.01\' });

// Mint hero NFT with gaming attributes const hero = await
kit.mintHeroNFT({ ownerWallet: wallet, contractAddress:
heroCollection.contractAddress, heroName: \'Fire Dragon\', heroClass:
\'Warrior\', level: 10, imageURL:
\'https://api.epicgame.com/heroes/fire-dragon.png\' });

console.log(\'Hero minted with ID:\', hero.tokenId);

// Batch mint multiple heroes await kit.batchMintNFTs({ ownerWallet:
wallet, contractAddress: heroCollection.contractAddress, recipients: \[
{ to: player1, tokenId: 2, metadataURI: \'hero2.json\' }, { to: player2,
tokenId: 3, metadataURI: \'hero3.json\' }, { to: player3, tokenId: 4,
metadataURI: \'hero4.json\' } \] }); \`\`\`

\### Example 4: Move NFTs with Gaming Features

\`\`\`javascript // Create Move NFT collection with gaming features
const moveHeroes = await kit.createGamingMoveNFTCollection({
deployerWallet: wallet, name: \'MoveWarriors\', symbol: \'WARRIOR\',
categories: \[\'weapon\', \'armor\', \'accessory\'\] });

// Mint upgradeable hero NFT const moveHero = await kit.mintMoveNFT({
ownerWallet: wallet, moduleAddress: moveHeroes.moduleAddress, recipient:
playerAddress, tokenId: 1, name: \'Lightning Warrior\', description: \'A
warrior wielding lightning powers\', imageURI:
\'https://api.game.com/warriors/lightning.png\', attributes: \[ {
trait_type: \'Class\', value: \'Warrior\' }, { trait_type: \'Element\',
value: \'Lightning\' }, { trait_type: \'Power\', value: \'85\' } \],
level: 5, rarity: \'rare\' });

// Upgrade the NFT after battle await kit.upgradeMoveNFT({ ownerWallet:
wallet, moduleAddress: moveHeroes.moduleAddress, tokenId: 1,
experienceGained: 250 }); \`\`\`

\### Example 5: Dual-VM Operations

\`\`\`javascript // Create NFT collection on both EVM and Move const
dualCollection = await kit.createDualNFTCollections({ deployerWallet:
wallet, name: \'CrossChainHeroes\', symbol: \'CCH\', description:
\'Heroes that exist on both chains\', maxSupply: 5000 });

console.log(\'ERC-721 Contract:\',
dualCollection.erc721.contractAddress); console.log(\'Move Module:\',
dualCollection.move.moduleAddress);

// Mint same NFT on both chains const dualHero = await kit.mintDualNFT({
ownerWallet: wallet, erc721ContractAddress:
dualCollection.erc721.contractAddress, moveModuleAddress:
dualCollection.move.moduleAddress, recipient: playerAddress, tokenId: 1,
name: \'Dual-Chain Guardian\', description: \'Guardian existing on both
EVM and Move\', imageURI: \'https://api.game.com/guardians/dual.png\',
attributes: \[ { trait_type: \'Type\', value: \'Guardian\' }, {
trait_type: \'Chain\', value: \'Dual\' } \] });

console.log(\'EVM Hash:\', dualHero.erc721.hash); console.log(\'Move
Hash:\', dualHero.move.hash); \`\`\`

\### Example 6: Gaming Studio with Multisig

\`\`\`javascript // Setup complete gaming studio const studio = await
kit.setupGamingStudio({ studioName: \"DragonForce Games\", teamMembers:
{ lead_dev: \"0x123\...\", artist: \"0x456\...\", designer:
\"0x789\...\", ceo: \"0xabc\...\" }, initialTokens: \[ { name:
\"DragonCoin\", symbol: \"DRAGON\", supply: 1000000 } \],
initialNFTCollections: \[ { name: \"DragonHeroes\", symbol: \"HERO\",
maxSupply: 10000 } \] });

console.log(\'Studio multisig created:\', studio.studioMultisig.id);

// Developer proposes new token const tokenProposal = await
kit.proposeTokenCreation({ multisigId: studio.studioMultisig.id,
proposerWalletName: \'lead_dev\', tokenName: \'BattlePoints\',
tokenSymbol: \'BP\', initialSupply: 500000, description: \'PvP battle
rewards token\' });

// CEO and artist approve await kit.approveProposal({ proposalId:
tokenProposal.id, approverWalletName: \'ceo\', decision: \'approve\',
comment: \'Great for PvP incentives!\' });

await kit.approveProposal({ proposalId: tokenProposal.id,
approverWalletName: \'artist\', decision: \'approve\', comment:
\'Approved for art rewards too\' });

// Token automatically deploys when threshold reached \`\`\`

\### Example 7: Guild Treasury Management

\`\`\`javascript // Create guild multisig const guild = await
kit.createGuildMultisig({ guildName: \"DragonSlayers\", officers: {
guild_leader: leaderWallet, officer1: officer1Wallet }, members: {
member1: member1Wallet, member2: member2Wallet, member3: member3Wallet }
});

// Propose guild member rewards const guildRewards = await
kit.proposeBatchRewards({ multisigId: guild.id, proposerWalletName:
\'guild_leader\', rewards: \[ { recipient: member1Wallet.getAddress(),
type: \'token\', amount: 500, description: \'Monthly contribution
reward\' }, { recipient: member2Wallet.getAddress(), type: \'nft\',
tokenId: 10, description: \'Achievement NFT for raid completion\' } \],
description: \'Monthly guild member rewards\' });

// Officer approves await kit.approveProposal({ proposalId:
guildRewards.id, approverWalletName: \'officer1\', decision:
\'approve\', comment: \'Well deserved rewards!\' }); \`\`\`

\### Example 8: Complex DeFi Application

\`\`\`javascript // Create DeFi protocol tokens const govToken = await
kit.createERC20Token({ deployerWallet: wallet, name: \'UmiDAO\', symbol:
\'UDAO\', decimals: 18, initialSupply: 1000000 });

const utilityToken = await kit.createMoveToken({ deployerWallet: wallet,
name: \'UmiUtility\', symbol: \'UUTIL\', decimals: 8, monitorSupply:
true });

// Create liquidity position NFTs const lpNFTs = await
kit.createNFTCollection({ deployerWallet: wallet, name: \'UmiLP\',
symbol: \'ULP\', baseURI: \'https://api.umidefi.com/lp/\', maxSupply:
100000 });

// Mint LP NFT for liquidity provider await kit.mintNFT({ ownerWallet:
wallet, contractAddress: lpNFTs.contractAddress, to: liquidityProvider,
tokenId: 1, metadataURI: \'https://api.umidefi.com/lp/1.json\' });

console.log(\'DeFi protocol deployed successfully\'); \`\`\`

\-\--

\## Error Handling

\### Common Error Types

\`\`\`javascript try { const result = await kit.createERC20Token({
deployerWallet: wallet, name: \'TestToken\', symbol: \'TEST\',
initialSupply: 1000000 }); } catch (error) { switch (error.message) {
case \'Deployer wallet is required\': console.error(\'Wallet missing:\',
error.message); break; case \'Insufficient funds\': console.error(\'Not
enough ETH for deployment\'); break; case \'Network connection failed\':
console.error(\'Check network connectivity\'); break; default:
console.error(\'Unexpected error:\', error.message); } } \`\`\`

\### Multisig Error Handling

\`\`\`javascript try { await kit.approveProposal({ proposalId:
\'invalid-id\', approverWalletName: \'dev1\', decision: \'approve\' });
} catch (error) { if (error.message.includes(\'Proposal not found\')) {
console.error(\'Invalid proposal ID\'); } else if
(error.message.includes(\'Permission denied\')) { console.error(\'Wallet
not authorized to approve\'); } else if
(error.message.includes(\'already voted\')) { console.error(\'Wallet has
already voted on this proposal\'); } } \`\`\`

\### Network Error Handling

\`\`\`javascript // Check network connectivity try { const blockNumber =
await kit.getBlockNumber(); console.log(\'Connected to block:\',
blockNumber); } catch (error) { console.error(\'Network connection
failed:\', error.message); // Implement retry logic or fallback }

// Check wallet balance before operations const balance = await
kit.getBalance(wallet.getAddress()); if
(parseFloat(ethers.formatEther(balance)) \< 0.1) { throw new
Error(\'Insufficient ETH for transaction\'); } \`\`\`

\-\--

\## Testing & Validation

\### Unit Testing Examples

\`\`\`javascript import { UmiAgentKit } from \'umi-agent-kit\'; import {
describe, it, expect } from \'vitest\';

describe(\'UmiAgentKit\', () =\> { let kit;

beforeEach(() =\> { kit = new UmiAgentKit({ network: \'devnet\' }); });

it(\'should create wallet successfully\', () =\> { const wallet =
kit.createWallet();
expect(wallet.getAddress()).toMatch(/\^0x\[a-fA-F0-9\]{40}\$/); });

it(\'should initialize with correct network\', () =\> { const
networkInfo = kit.getNetworkInfo();
expect(networkInfo.network).toBe(\'devnet\');
expect(networkInfo.chainId).toBe(42069); });

it(\'should create multisig group\', async () =\> { const kit = new
UmiAgentKit({ network: \'devnet\', multisigEnabled: true });

const dev = kit.createWallet(); const ceo = kit.createWallet();

kit.registerMultisigWallets({ dev, ceo });

const multisig = await kit.createMultisigGroup({ name: \"Test Group\",
members: \[ { walletName: \'dev\', role: \'developer\', weight: 1 }, {
walletName: \'ceo\', role: \'ceo\', weight: 2 } \], threshold: 2 });

expect(multisig.id).toBeDefined();
expect(multisig.members).toHaveLength(2); }); }); \`\`\`

\### Integration Testing

\`\`\`javascript // Full integration test describe(\'Gaming Studio
Integration\', () =\> { it(\'should setup complete gaming studio\',
async () =\> { const kit = new UmiAgentKit({ network: \'devnet\',
multisigEnabled: true });

// Create team wallets const teamWallets = { dev: kit.createWallet(),
artist: kit.createWallet(), ceo: kit.createWallet() };

// Setup studio const studio = await kit.setupGamingStudio({ studioName:
\"Test Studio\", teamMembers: { dev: teamWallets.dev.exportPrivateKey(),
artist: teamWallets.artist.exportPrivateKey(), ceo:
teamWallets.ceo.exportPrivateKey() } });

expect(studio.studioMultisig.id).toBeDefined();
expect(studio.teamWallets).toBeDefined();
expect(Object.keys(studio.teamWallets)).toHaveLength(3); }); }); \`\`\`

\### Manual Testing Checklist

\- \[ \] Wallet creation and import - \[ \] ETH transfers with gas
estimation - \[ \] ERC-20 token deployment and minting - \[ \] Move
token deployment and operations - \[ \] ERC-721 NFT collection and
minting - \[ \] Move NFT collection with gaming features - \[ \] Dual-VM
NFT operations - \[ \] Multisig group creation - \[ \] Proposal creation
and approval - \[ \] Gaming studio setup - \[ \] Guild treasury
management - \[ \] Error handling for edge cases - \[ \] Network
connectivity and recovery

\-\--

\## Deployment Guide

\### Development Environment

\`\`\`bash \# Clone or create project mkdir my-umi-project cd
my-umi-project

\# Initialize npm project npm init -y

\# Install UmiAgentKit npm install umi-agent-kit@1.0.0

\# Install additional dependencies npm install ethers@6 viem@2 \`\`\`

\### Environment Configuration

\`\`\`javascript // config.js export const config = { development: {
network: \'devnet\', rpcUrl: \'https://devnet.moved.network\',
multisigEnabled: true }, production: { network: \'mainnet\', rpcUrl:
\'https://mainnet.moved.network\', // When available multisigEnabled:
true } };

// main.js import { UmiAgentKit } from \'umi-agent-kit\'; import {
config } from \'./config.js\';

const env = process.env.NODE_ENV \|\| \'development\'; const kit = new
UmiAgentKit(config\[env\]); \`\`\`

\### Production Deployment

\`\`\`bash \# Build for production npm run build

\# Set environment variables export NODE_ENV=production export
PRIVATE_KEY=0x\... export RPC_URL=https://mainnet.moved.network

\# Deploy npm start \`\`\`

\### Docker Deployment

\`\`\`dockerfile \# Dockerfile FROM node:18-alpine

WORKDIR /app

COPY package\*.json ./ RUN npm ci \--only=production

COPY . .

EXPOSE 3000

CMD \[\"npm\", \"start\"\] \`\`\`

\`\`\`yaml \# docker-compose.yml version: \'3.8\' services: umi-app:
build: . ports:  - \"3000:3000\" environment:  - NODE_ENV=production  -
NETWORK=mainnet volumes:  - ./multisig_data:/app/multisig_data \`\`\`

\### Security Best Practices

1\. \*\*Private Key Management\*\* \`\`\`javascript // Use environment
variables const privateKey = process.env.PRIVATE_KEY;

// Never hardcode private keys // ❌ DON\'T DO THIS const wallet =
kit.importWallet(\'0x1234567890abcdef\...\');

// ✅ DO THIS const wallet = kit.importWallet(process.env.PRIVATE_KEY);
\`\`\`

2\. \*\*Network Validation\*\* \`\`\`javascript // Validate network
before operations const networkInfo = kit.getNetworkInfo(); if
(networkInfo.network !== \'mainnet\') { throw new Error(\'Invalid
network for production\'); } \`\`\`

3\. \*\*Balance Checks\*\* \`\`\`javascript // Always check balance
before operations const balance = await
kit.getBalance(wallet.getAddress()); const cost = await
kit.calculateTransactionCost(amount);

if (parseFloat(ethers.formatEther(balance)) \<
parseFloat(cost.totalCost)) { throw new Error(\'Insufficient funds\'); }
\`\`\`

4\. \*\*Multisig Security\*\* \`\`\`javascript // Use appropriate
thresholds const multisig = await kit.createMultisigGroup({ members:
teamMembers, threshold: Math.ceil(teamMembers.length \* 0.6), // 60%
threshold rules: { largeTransfer: { maxAmount: \'10\', // Limit large
transfers requiredRoles: \[\'ceo\', \'cfo\'\] } } }); \`\`\`

\-\--

\## Performance Optimization

\### Gas Optimization

\`\`\`javascript // Batch operations when possible const recipients = \[
{ to: player1, tokenId: 1, metadataURI: \'meta1.json\' }, { to: player2,
tokenId: 2, metadataURI: \'meta2.json\' }, { to: player3, tokenId: 3,
metadataURI: \'meta3.json\' } \];

// ✅ Efficient: Single batch transaction await kit.batchMintNFTs({
ownerWallet: wallet, contractAddress: collection.contractAddress,
recipients });

// ❌ Inefficient: Multiple separate transactions for (const recipient
of recipients) { await kit.mintNFT({ ownerWallet: wallet,
contractAddress: collection.contractAddress, \...recipient }); } \`\`\`

\### Caching Strategies

\`\`\`javascript // Cache frequently accessed data const cache = new
Map();

async function getCachedBalance(address) { const cacheKey =
\`balance\_\${address}\`;

if (cache.has(cacheKey)) { const cached = cache.get(cacheKey); if
(Date.now() - cached.timestamp \< 30000) { // 30 second cache return
cached.balance; } }

const balance = await kit.getBalance(address); cache.set(cacheKey, {
balance, timestamp: Date.now() });

return balance; } \`\`\`

\### Connection Pooling

\`\`\`javascript // Reuse UmiAgentKit instances class UmiAgentKitPool {
constructor(config) { this.config = config; this.instances = new Map();
}

getInstance(key = \'default\') { if (!this.instances.has(key)) {
this.instances.set(key, new UmiAgentKit(this.config)); } return
this.instances.get(key); } }

const pool = new UmiAgentKitPool({ network: \'devnet\' }); const kit =
pool.getInstance(); \`\`\`

\-\--

\## Version History

\### v1.0.0 (Current) - ✅ \*\*NEW: Complete Multisig System\*\* -
Server-based multisig coordination - ✅ \*\*NEW: Gaming Studio
Templates\*\* - Predefined roles and workflows - ✅ \*\*NEW: Guild
Treasury Management\*\* - Guild-specific multisig features - ✅ \*\*NEW:
Proposal Engine\*\* - Complete proposal lifecycle management - ✅
\*\*NEW: Permission System\*\* - Role-based access control - ✅ \*\*NEW:
Notification System\*\* - Team coordination notifications - ✅ \*\*NEW:
Data Persistence\*\* - Local storage for multisig data - ✅ Enhanced
error handling and validation - ✅ Complete test suite and documentation

\### v0.6.0 - ✅ Move NFT collections and gaming features - ✅ NFT
upgrade mechanics for gaming - ✅ Gaming Move NFT support - ✅ Cross-VM
NFT operations

\### v0.5.0 - ✅ ERC-721 NFT collections - ✅ Batch NFT operations - ✅
Gaming NFT helpers - ✅ Marketplace compatibility

\### v0.4.0 - ✅ Move token support - ✅ Dual-VM token operations - ✅
Cross-chain token features

\### v0.3.0 - ✅ ERC-20 token creation - ✅ Real-time Solidity
compilation - ✅ Token minting and transfers

\### v0.2.0 - ✅ ETH transfer operations - ✅ Gas estimation and
optimization - ✅ Transaction monitoring

\### v0.1.0 - ✅ Basic wallet operations - ✅ Network connectivity - ✅
Foundation architecture

\-\--

\## Support & Community

\### Documentation - \*\*Official Docs\*\*: https://docs.umiagentkit.com
(coming soon) - \*\*GitHub\*\*:
https://github.com/your-username/umiagentkit - \*\*NPM Package\*\*:
https://npmjs.com/package/umi-agent-kit

\### Community - \*\*Discord\*\*: https://discord.gg/umiagentkit (coming
soon) - \*\*Twitter\*\*: https://twitter.com/umiagentkit (coming soon) -
\*\*Telegram\*\*: https://t.me/umiagentkit (coming soon)

\### Support Channels - \*\*GitHub Issues\*\*: For bugs and feature
requests - \*\*Discord Support\*\*: For real-time help - \*\*Email\*\*:
support@umiagentkit.com (coming soon)

\### Contributing 1. Fork the repository 2. Create a feature branch 3.
Make your changes 4. Add tests 5. Submit a pull request

\### License MIT License - see LICENSE file for details

\-\--

\## Conclusion

UmiAgentKit v1.0.0 represents a revolutionary leap forward in blockchain
development tooling. With its comprehensive multisig functionality,
gaming-first design, and dual-VM support, it provides everything needed
to build sophisticated applications on Umi Network.

The toolkit\'s server-based multisig system is particularly
groundbreaking, offering unprecedented team coordination capabilities
that are essential for modern game development and DeFi projects.

Whether you\'re building the next great blockchain game, a DeFi
protocol, or an innovative NFT marketplace, UmiAgentKit provides the
foundation you need to succeed on Umi Network.

\-\--

\*\*UmiAgentKit v1.0.0\*\* - \*The Complete AI-Powered Toolkit for Umi
Network\*

\*© 2025 UmiAgentKit. All rights reserved.\*
