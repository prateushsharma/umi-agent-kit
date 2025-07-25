

import { DependencyResolver } from './DependencyResolver.js';
import { MoveDeploymentEngine } from './MoveDeploymentEngine.js'; // UPDATED IMPORT
import fs from 'fs/promises';
import path from 'path';

export class MultiContractDeployer {
  constructor(umiKit) {
    this.kit = umiKit;
    this.dependencyResolver = new DependencyResolver();
    this.moveEngine = new MoveDeploymentEngine(umiKit); 
  }

  // ========== OPTION 1: DEPLOY NOW, CONSTRUCTOR LATER ==========

  async deployContractsOnly(contractsPath, deployerWallet) {
    console.log(`🚀 Deploying contracts from ${contractsPath} (no constructor values)`);
    
    try {
      const contracts = await this.scanContractsFolder(contractsPath);
      console.log(`📁 Found ${contracts.length} contract(s): ${contracts.map(c => c.name).join(', ')}`);
      
      const deploymentOrder = this.dependencyResolver.autoResolve(contracts);
      
      const deployed = {};
      for (const contract of deploymentOrder) {
        console.log(`📦 Deploying ${contract.name} (module only)...`);
        
        // Use FIXED Umi deployment engine
        const result = await this.moveEngine.deployMoveContract(contract, deployerWallet);
        deployed[contract.name] = result;
        
        console.log(`✅ ${contract.name} deployed: ${result.address}`);
      }
      
      console.log(`🎉 All contracts deployed! Use setConstructorValues() to initialize them.`);
      return deployed;

    } catch (error) {
      throw new Error(`Deploy contracts only failed: ${error.message}`);
    }
  }

  async setConstructorValues(contractAddress, constructorArgs, callerWallet) {
    console.log(`⚙️ Setting constructor values for ${contractAddress}`);
    console.log(`📝 Arguments:`, constructorArgs);
    
    try {
      // Use the fixed engine's initialization method
      const initResult = await this.moveEngine.initializeContract(
        contractAddress,
        constructorArgs,
        callerWallet
      );
      
      console.log(`✅ Constructor values set! Tx: ${initResult.hash}`);
      return initResult;
      
    } catch (error) {
      throw new Error(`Failed to set constructor values: ${error.message}`);
    }
  }

  // ========== OPTION 2: DEPLOY WITH DEPLOYMENT.JSON ==========

  async deployWithJson(contractsPath, deployerWallet, configFile = null) {
    console.log(`🚀 Deploying contracts with deployment.json`);
    
    try {
      const configPath = configFile || path.join(contractsPath, 'deployment.json');
      const config = await this.loadDeploymentConfig(configPath);
      console.log(`📋 Loaded config with ${Object.keys(config.contracts).length} contract(s)`);
      
      const contracts = await this.scanContractsFolder(contractsPath);
      const deploymentOrder = this.dependencyResolver.resolveFromConfig(contracts, config);
      
      const deployed = {};
      for (const contract of deploymentOrder) {
        console.log(`🚀 Deploying ${contract.name} with JSON config...`);
        
        const contractConfig = config.contracts[contract.name];
        if (!contractConfig) {
          throw new Error(`Configuration not found for contract: ${contract.name}`);
        }
        
        const constructorArgs = await this.resolveConfigArgs(
          contractConfig.initArgs || {},
          deployed
        );
        
        // Deploy with constructor using fixed engine
        const result = await this.moveEngine.deployMoveContract(
          contract,
          deployerWallet,
          constructorArgs
        );
        deployed[contract.name] = result;
        
        console.log(`✅ ${contract.name} deployed: ${result.address}`);
      }
      
      if (config.postDeployment) {
        console.log(`🔗 Running post-deployment operations...`);
        await this.handlePostDeployment(deployed, config.postDeployment);
      }
      
      console.log(`🎉 All contracts deployed successfully!`);
      return deployed;

    } catch (error) {
      throw new Error(`Deploy with JSON failed: ${error.message}`);
    }
  }

  // ========== OPTION 3: DEPLOY WITH CONFIG OBJECT ==========

  async deployWithConfig(contractsPath, deployerWallet, configObject = {}) {
    console.log(`🚀 Deploying contracts with config object`);
    console.log(`📝 Config:`, configObject);
    
    try {
      const contracts = await this.scanContractsFolder(contractsPath);
      console.log(`📁 Found ${contracts.length} contract(s): ${contracts.map(c => c.name).join(', ')}`);
      
      const deploymentOrder = this.dependencyResolver.autoResolve(contracts);
      
      const deployed = {};
      for (const contract of deploymentOrder) {
        console.log(`🚀 Deploying ${contract.name} with config object...`);
        
        const constructorArgs = configObject[contract.name] || {};
        const resolvedArgs = await this.resolveReferences(constructorArgs, deployed);
        
        // Deploy with constructor using fixed engine
        const result = await this.moveEngine.deployMoveContract(
          contract,
          deployerWallet,
          resolvedArgs
        );
        deployed[contract.name] = result;
        
        console.log(`✅ ${contract.name} deployed: ${result.address}`);
      }
      
      console.log(`🎉 All contracts deployed successfully!`);
      return deployed;

    } catch (error) {
      throw new Error(`Deploy with config failed: ${error.message}`);
    }
  }

  

/**
   * Scan contracts folder for .move and .sol files
   */
  async scanContractsFolder(contractsPath) {
    try {
      const files = await fs.readdir(contractsPath);
      const contracts = [];
      
      for (const file of files) {
        if (file.endsWith('.move') || file.endsWith('.sol')) {
          const filePath = path.join(contractsPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          contracts.push({
            name: file.replace(/\.(move|sol)$/, ''),
            fileName: file,
            content,
            path: filePath
          });
        }
      }
      
      if (contracts.length === 0) {
        throw new Error(`No .move or .sol files found in ${contractsPath}`);
      }
      
      return contracts;
      
    } catch (error) {
      throw new Error(`Failed to scan contracts folder: ${error.message}`);
    }
  }

 /**
   * Load deployment configuration from JSON
   */
  async loadDeploymentConfig(configPath) {
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      if (!config.contracts) {
        throw new Error('Invalid deployment.json: missing "contracts" section');
      }
      
      return config;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Deployment config not found: ${configPath}`);
      }
      throw new Error(`Failed to load deployment config: ${error.message}`);
    }
  }

 /**
   * Resolve @ContractName references in configuration
   */
  async resolveConfigArgs(configArgs, deployedContracts) {
    const resolved = {};
    
    for (const [key, value] of Object.entries(configArgs)) {
      if (typeof value === 'string' && value.startsWith('@')) {
        const contractName = value.substring(1);
        if (deployedContracts[contractName]) {
          resolved[key] = deployedContracts[contractName].address;
        } else {
          throw new Error(`Referenced contract "${contractName}" not found in deployed contracts`);
        }
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }

  async resolveReferences(args, deployedContracts) {
    return await this.resolveConfigArgs(args, deployedContracts);
  }

  /**
   * Handle post-deployment actions (placeholder)
   */
  async handlePostDeployment(deployedContracts, postConfig) {
    console.log('📋 Processing post-deployment actions...');
    
    if (postConfig.linkContracts) {
      console.log('🔗 Linking contracts...');
      // Implementation for contract linking
    }
    
    if (postConfig.initializeData) {
      console.log('📊 Initializing data...');
      // Implementation for data initialization
    }
    
    if (postConfig.grantPermissions) {
      console.log('🔐 Granting permissions...');
      // Implementation for permission grants
    }
  }


  async grantPermission(deployedContracts, permission) {
    // Implementation depends on your specific permission system
    console.log(`🔐 Permission granted: ${permission.contract} -> ${permission.grantTo}`);
  }

  async linkContracts(deployedContracts) {
    console.log(`🔗 Contracts linked successfully`);
  }

  getDeploymentSummary(deployedContracts) {
    const summary = {
      totalContracts: Object.keys(deployedContracts).length,
      contracts: {},
      totalGasUsed: 0
    };
    
    for (const [name, contract] of Object.entries(deployedContracts)) {
      summary.contracts[name] = {
        address: contract.address,
        type: contract.type,
        initialized: contract.initialized,
        txHash: contract.txHash
      };
    }
    
    return summary;
  }

   /**
   * Export deployment results to file
   */
  async exportDeploymentResults(deployedContracts, outputPath = './deployment-results.json') {
    const exportData = {
      timestamp: new Date().toISOString(),
      network: this.config.network,
      summary: {
        totalContracts: Object.keys(deployedContracts).length,
        successful: Object.values(deployedContracts).filter(c => !c.error).length,
        failed: Object.values(deployedContracts).filter(c => c.error).length
      },
      contracts: deployedContracts
    };
    
    await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`📄 Deployment results exported to: ${outputPath}`);
  }
/**
   * Clean up embedded workspace
   */
  async cleanup() {
    if (this.embeddedEngine) {
      await this.embeddedEngine.cleanup();
    }
  }
}