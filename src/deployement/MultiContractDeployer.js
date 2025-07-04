/**
 * FILE LOCATION: src/deployment/MultiContractDeployer.js
 * 
 * Main multi-contract deployment orchestrator
 * Implements all 3 deployment options:
 * 1. Deploy now, constructor later
 * 2. Deploy with deployment.json
 * 3. Deploy with config object
 */

import { DependencyResolver } from './DependencyResolver.js';
import { MoveDeploymentEngine } from './MoveDeploymentEngine.js';
import fs from 'fs/promises';
import path from 'path';

export class MultiContractDeployer {
  constructor(umiKit) {
    this.kit = umiKit;
    this.dependencyResolver = new DependencyResolver();
    this.moveEngine = new MoveDeploymentEngine(umiKit);
  }

  // ========== OPTION 1: DEPLOY NOW, CONSTRUCTOR LATER ==========

  /**
   * Deploy contracts without constructor values
   * Constructor values will be set later via separate function calls
   */
  async deployContractsOnly(contractsPath, deployerWallet) {
    console.log(`🚀 Deploying contracts from ${contractsPath} (no constructor values)`);
    
    try {
      // 1. Scan contracts folder
      const contracts = await this.scanContractsFolder(contractsPath);
      console.log(`📁 Found ${contracts.length} contract(s): ${contracts.map(c => c.name).join(', ')}`);
      
      // 2. Resolve deployment order based on dependencies
      const deploymentOrder = this.dependencyResolver.autoResolve(contracts);
      
      // 3. Deploy contracts WITHOUT calling initialize functions
      const deployed = {};
      for (const contract of deploymentOrder) {
        console.log(`📦 Deploying ${contract.name} (module only)...`);
        
        const result = await this.deployModuleOnly(contract, deployerWallet);
        deployed[contract.name] = result;
        
        console.log(`✅ ${contract.name} deployed: ${result.address}`);
      }
      
      console.log(`🎉 All contracts deployed! Use setConstructorValues() to initialize them.`);
      return deployed;

    } catch (error) {
      throw new Error(`Deploy contracts only failed: ${error.message}`);
    }
  }

  /**
   * Set constructor values after deployment
   * Call this after deployContractsOnly()
   */
  async setConstructorValues(contractAddress, constructorArgs, callerWallet) {
    console.log(`⚙️ Setting constructor values for ${contractAddress}`);
    console.log(`📝 Arguments:`, constructorArgs);
    
    try {
      // Call the initialize function with constructor arguments
      const initResult = await this.callInitializeFunction(
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

  /**
   * Deploy contracts using deployment.json configuration file
   * Traditional approach with full configuration
   */
  async deployWithJson(contractsPath, deployerWallet, configFile = null) {
    console.log(`🚀 Deploying contracts with deployment.json`);
    
    try {
      // 1. Load deployment.json configuration
      const configPath = configFile || path.join(contractsPath, 'deployment.json');
      const config = await this.loadDeploymentConfig(configPath);
      console.log(`📋 Loaded config with ${Object.keys(config.contracts).length} contract(s)`);
      
      // 2. Scan contracts folder
      const contracts = await this.scanContractsFolder(contractsPath);
      
      // 3. Resolve dependencies from config
      const deploymentOrder = this.dependencyResolver.resolveFromConfig(contracts, config);
      
      // 4. Deploy contracts with constructor values from JSON
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
        
        const result = await this.deployWithConstructor(
          contract,
          deployerWallet,
          constructorArgs
        );
        deployed[contract.name] = result;
        
        console.log(`✅ ${contract.name} deployed: ${result.address}`);
      }
      
      // 5. Handle post-deployment operations if specified in JSON
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

  /**
   * Deploy contracts with JavaScript config object
   * No JSON files needed - pass config directly
   */
  async deployWithConfig(contractsPath, deployerWallet, configObject = {}) {
    console.log(`🚀 Deploying contracts with config object`);
    console.log(`📝 Config:`, configObject);
    
    try {
      // 1. Scan contracts folder
      const contracts = await this.scanContractsFolder(contractsPath);
      console.log(`📁 Found ${contracts.length} contract(s): ${contracts.map(c => c.name).join(', ')}`);
      
      // 2. Auto-resolve dependencies (since no explicit config file)
      const deploymentOrder = this.dependencyResolver.autoResolve(contracts);
      
      // 3. Deploy contracts with config object values
      const deployed = {};
      for (const contract of deploymentOrder) {
        console.log(`🚀 Deploying ${contract.name} with config object...`);
        
        // Get constructor args from config object
        const constructorArgs = configObject[contract.name] || {};
        
        // Resolve any references to other contracts
        const resolvedArgs = await this.resolveReferences(constructorArgs, deployed);
        
        const result = await this.deployWithConstructor(
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

  // ========== CORE DEPLOYMENT METHODS ==========

  /**
   * Deploy module only (no constructor call)
   * Used by Option 1
   */
  async deployModuleOnly(contract, deployerWallet) {
    try {
      // 1. Compile Move contract
      const compiled = await this.moveEngine.compileMoveContract(
        contract.content,
        contract.name
      );
      
      // 2. Create module deployment transaction
      const deployTx = await this.moveEngine.createModuleDeploymentTransaction(compiled);
      
      // 3. Submit to Umi Network
      const txHash = await this.moveEngine.submitToUmiNetwork(deployTx, deployerWallet);
      
      // 4. Wait for confirmation
      const receipt = await this.kit.client.waitForTransaction(txHash);
      
      // 5. Get module address
      const moduleAddress = this.moveEngine.getModuleAddress(
        deployerWallet.getAddress(),
        contract.name
      );
      
      return {
        name: contract.name,
        address: moduleAddress,
        txHash,
        functions: compiled.functions,
        type: 'move',
        initialized: false, // Not initialized yet
        deployerAddress: deployerWallet.getAddress()
      };

    } catch (error) {
      throw new Error(`Deploy module only failed for ${contract.name}: ${error.message}`);
    }
  }

  /**
   * Deploy with constructor values
   * Used by Options 2 and 3
   */
  async deployWithConstructor(contract, deployerWallet, constructorArgs) {
    try {
      // 1. Deploy module first
      const moduleResult = await this.deployModuleOnly(contract, deployerWallet);
      
      // 2. Call initialize function if constructor args provided
      if (Object.keys(constructorArgs).length > 0) {
        console.log(`⚙️ Initializing ${contract.name} with args:`, constructorArgs);
        
        const initResult = await this.callInitializeFunction(
          moduleResult.address,
          constructorArgs,
          deployerWallet
        );
        
        moduleResult.initTxHash = initResult.hash;
        moduleResult.initialized = true;
        moduleResult.constructorArgs = constructorArgs;
      }
      
      return moduleResult;

    } catch (error) {
      throw new Error(`Deploy with constructor failed for ${contract.name}: ${error.message}`);
    }
  }

  /**
   * Call initialize function with constructor arguments
   */
  async callInitializeFunction(contractAddress, constructorArgs, callerWallet) {
    try {
      // 1. Create initialize transaction
      const initTx = await this.moveEngine.createInitializeTransaction(
        contractAddress,
        constructorArgs
      );
      
      // 2. Submit to Umi Network
      const txHash = await this.moveEngine.submitToUmiNetwork(initTx, callerWallet);
      
      // 3. Wait for confirmation
      const receipt = await this.kit.client.waitForTransaction(txHash);
      
      return {
        hash: txHash,
        receipt,
        args: constructorArgs
      };

    } catch (error) {
      throw new Error(`Initialize function call failed: ${error.message}`);
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * Scan contracts folder for .move files
   */
  async scanContractsFolder(contractsPath) {
    try {
      const files = await fs.readdir(contractsPath);
      
      const contracts = [];
      for (const file of files) {
        if (file.endsWith('.move')) {
          const filePath = path.join(contractsPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          contracts.push({
            name: file.replace('.move', ''),
            fileName: file,
            content,
            path: filePath
          });
        }
      }
      
      if (contracts.length === 0) {
        throw new Error(`No .move files found in ${contractsPath}`);
      }
      
      return contracts;

    } catch (error) {
      throw new Error(`Failed to scan contracts folder: ${error.message}`);
    }
  }

  /**
   * Load deployment.json configuration
   */
  async loadDeploymentConfig(configPath) {
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      // Validate config structure
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
   * Resolve config arguments (handle @references to other contracts)
   */
  async resolveConfigArgs(configArgs, deployedContracts) {
    const resolved = {};
    
    for (const [key, value] of Object.entries(configArgs)) {
      if (typeof value === 'string' && value.startsWith('@')) {
        // Reference to deployed contract: "@GameToken"
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

  /**
   * Resolve references in config object (same as resolveConfigArgs)
   */
  async resolveReferences(args, deployedContracts) {
    return await this.resolveConfigArgs(args, deployedContracts);
  }

  /**
   * Handle post-deployment operations from JSON config
   */
  async handlePostDeployment(deployedContracts, postConfig) {
    try {
      if (postConfig.permissions) {
        console.log(`🔐 Setting up permissions...`);
        for (const permission of postConfig.permissions) {
          await this.grantPermission(deployedContracts, permission);
        }
      }
      
      if (postConfig.linkContracts) {
        console.log(`🔗 Linking contracts...`);
        await this.linkContracts(deployedContracts);
      }
      
      if (postConfig.initializeAll) {
        console.log(`⚙️ Running additional initialization...`);
        await this.initializeAll(deployedContracts, postConfig.initializeAll);
      }

    } catch (error) {
      console.warn(`Post-deployment operations failed: ${error.message}`);
    }
  }

  /**
   * Grant permission between contracts
   */
  async grantPermission(deployedContracts, permission) {
    try {
      const { contract, grantTo, permission: permissionType } = permission;
      
      let contractAddress = contract;
      let grantToAddress = grantTo;
      
      // Resolve contract references
      if (contract.startsWith('@')) {
        const contractName = contract.substring(1);
        contractAddress = deployedContracts[contractName]?.address;
      }
      
      if (grantTo.startsWith('@')) {
        const contractName = grantTo.substring(1);
        grantToAddress = deployedContracts[contractName]?.address;
      }
      
      if (!contractAddress || !grantToAddress) {
        throw new Error(`Invalid permission setup: ${contract} -> ${grantTo}`);
      }
      
      console.log(`🔐 Granting ${permissionType} permission: ${contractAddress} -> ${grantToAddress}`);
      
      // TODO: Implement actual permission granting logic
      // This would depend on the specific permission system in your contracts
      
    } catch (error) {
      console.warn(`Failed to grant permission: ${error.message}`);
    }
  }

  /**
   * Link contracts together
   */
  async linkContracts(deployedContracts) {
    try {
      console.log(`🔗 Linking ${Object.keys(deployedContracts).length} contracts...`);
      
      // TODO: Implement contract linking logic
      // This would involve calling functions to register other contract addresses
      
      for (const [name, contract] of Object.entries(deployedContracts)) {
        console.log(`🔗 ${name}: ${contract.address}`);
      }
      
    } catch (error) {
      console.warn(`Failed to link contracts: ${error.message}`);
    }
  }

  /**
   * Initialize all contracts with additional setup
   */
  async initializeAll(deployedContracts, initConfig) {
    try {
      for (const [contractName, initArgs] of Object.entries(initConfig)) {
        if (deployedContracts[contractName]) {
          console.log(`⚙️ Additional initialization for ${contractName}...`);
          
          // Resolve arguments
          const resolvedArgs = await this.resolveConfigArgs(initArgs, deployedContracts);
          
          // TODO: Call specific initialization functions
          // This would depend on your contract's additional setup requirements
        }
      }
      
    } catch (error) {
      console.warn(`Failed to initialize all contracts: ${error.message}`);
    }
  }

  /**
   * Get deployment summary
   */
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
        functions: contract.functions?.length || 0,
        txHash: contract.txHash
      };
    }
    
    return summary;
  }

  /**
   * Validate contracts before deployment
   */
  async validateContracts(contracts) {
    for (const contract of contracts) {
      // Check if contract has valid Move syntax
      if (!contract.content.includes('module')) {
        throw new Error(`Invalid Move contract: ${contract.name} - missing module declaration`);
      }
      
      // Check for basic Move structure
      if (!contract.content.includes('fun ')) {
        console.warn(`Warning: ${contract.name} contains no functions`);
      }
    }
    
    return true;
  }

  /**
   * Get contract functions after deployment
   */
  getContractFunctions(deployedContract) {
    return deployedContract.functions || [];
  }

  /**
   * Call any contract function
   */
  async callContractFunction(contractAddress, functionName, args, callerWallet) {
    try {
      console.log(`📞 Calling ${contractAddress}::${functionName} with args:`, args);
      
      // Create function call transaction
      const functionTx = await this.moveEngine.createFunctionCallTransaction(
        contractAddress,
        functionName,
        args
      );
      
      // Submit to network
      const txHash = await this.moveEngine.submitToUmiNetwork(functionTx, callerWallet);
      
      // Wait for confirmation
      const receipt = await this.kit.client.waitForTransaction(txHash);
      
      return {
        hash: txHash,
        receipt,
        functionName,
        args
      };

    } catch (error) {
      throw new Error(`Contract function call failed: ${error.message}`);
    }
  }

  /**
   * Export deployment results to file
   */
  async exportDeploymentResults(deployedContracts, outputPath) {
    try {
      const results = {
        timestamp: new Date().toISOString(),
        network: this.kit.config.network,
        summary: this.getDeploymentSummary(deployedContracts),
        contracts: deployedContracts
      };
      
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
      console.log(`📄 Deployment results exported to: ${outputPath}`);
      
    } catch (error) {
      console.warn(`Failed to export deployment results: ${error.message}`);
    }
  }
}