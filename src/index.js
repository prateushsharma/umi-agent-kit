/**
 * FILE LOCATION: src/index.js (in your umi-agent-kit source)
 * 
 * REPLACE your existing src/index.js with this updated version
 */

export { UmiAgentKit } from './UmiAgentKit.js';
export { UmiWallet, ethToMoveAddress, moveToEthAddress } from './wallet/UmiWallet.js';
export { WalletManager } from './wallet/WalletManager.js';
export { UmiClient } from './client/UmiClient.js';
export { TransferManager } from './transfer/TransferManager.js';
export { TokenManager } from './token/TokenManager.js';
export { NFTManager } from './nft/NFTManager.js';
export { SolidityCompiler } from './compiler/SolidityCompiler.js';
export { NFTCompiler } from './compiler/NFTCompiler.js';
export { MoveNFTCompiler } from './compiler/MoveNFTCompiler.js';
export { DEFAULT_CONFIG } from './config.js';

// AI exports
export { AIManager } from './ai/AIManager.js';
export { GroqEngine } from './ai/GroqEngine.js';
export { UmiAIWrapper } from './ai/UmiAIWrapper.js';
export { FunctionRegistry } from './ai/FunctionRegistry.js';
export { ContextManager } from './ai/ContextManager.js';

// Multisig exports
export { ServerMultisigManager } from './multisig/ServerMultisigManager.js';
export { ProposalEngine } from './multisig/ProposalEngine.js';
export { PermissionSystem } from './multisig/PermissionSystem.js';
export { NotificationService } from './multisig/NotificationService.js';
export { MultisigStorage } from './multisig/MultisigStorage.js';

// NEW: Deployment exports (FIXED PATHS)
export { MultiContractDeployer } from './deployment/MultiContractDeployer.js';
export { DependencyResolver } from './deployment/DependencyResolver.js';
export { MoveDeploymentEngine } from './deployment/MoveDeploymentEngine.js'; 

export { ERC1155Manager } from './erc1155/ERC1155Manager.js';
export { ERC1155Compiler } from './compiler/ERC1155Compiler.js';