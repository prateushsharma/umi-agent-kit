
export class DependencyResolver {
  constructor() {
    this.dependencies = new Map();
  }

  /**
   * Auto-resolve dependencies by analyzing Move contract imports and usage
   */
  autoResolve(contracts) {
    console.log('🔍 Auto-resolving contract dependencies...');
    
    const dependencies = this.analyzeDependencies(contracts);
    const deploymentOrder = this.topologicalSort(contracts, dependencies);
    
    console.log(`📋 Deployment order: ${deploymentOrder.map(c => c.name).join(' → ')}`);
    return deploymentOrder;
  }

  /**
   * Resolve dependencies from deployment.json config
   */
  resolveFromConfig(contracts, config) {
    console.log('🔍 Resolving dependencies from config...');
    
    const dependencies = new Map();
    
    // Build dependency map from config
    for (const [contractName, contractConfig] of Object.entries(config.contracts)) {
      dependencies.set(contractName, contractConfig.dependencies || []);
    }
    
    const deploymentOrder = this.topologicalSort(contracts, dependencies);
    
    console.log(`📋 Deployment order: ${deploymentOrder.map(c => c.name).join(' → ')}`);
    return deploymentOrder;
  }

  /**
   * Analyze Move contracts to detect dependencies automatically
   */
  analyzeDependencies(contracts) {
    const dependencies = new Map();
    
    for (const contract of contracts) {
      const deps = this.parseContractDependencies(contract, contracts);
      dependencies.set(contract.name, deps);
    }
    
    return dependencies;
  }

  /**
   * Parse a single Move contract to find its dependencies
   */
  parseContractDependencies(contract, allContracts) {
    const dependencies = [];
    const content = contract.content;
    
    // 1. Parse 'use' statements
    const useStatements = this.parseUseStatements(content);
    
    // 2. Parse function calls to other modules
    const moduleCalls = this.parseModuleCalls(content);
    
    // 3. Parse struct usage from other modules
    const structUsage = this.parseStructUsage(content);
    
    // Match found dependencies with available contracts
    for (const otherContract of allContracts) {
      if (otherContract.name === contract.name) continue;
      
      const otherModuleName = otherContract.name.toLowerCase();
      
      // Check if this contract uses the other contract
      if (this.usesDependency(useStatements, moduleCalls, structUsage, otherModuleName)) {
        dependencies.push(otherContract.name);
      }
    }
    
    return dependencies;
  }

  /**
   * Parse 'use' statements from Move code
   */
  parseUseStatements(content) {
    const useRegex = /use\s+([^;]+);/g;
    const useStatements = [];
    let match;
    
    while ((match = useRegex.exec(content)) !== null) {
      useStatements.push(match[1].trim());
    }
    
    return useStatements;
  }

  /**
   * Parse module function calls (module::function)
   */
  parseModuleCalls(content) {
    const callRegex = /(\w+)::\w+\s*\(/g;
    const calls = [];
    let match;
    
    while ((match = callRegex.exec(content)) !== null) {
      calls.push(match[1].toLowerCase());
    }
    
    return calls;
  }

  /**
   * Parse struct usage from other modules
   */
  parseStructUsage(content) {
    const structRegex = /(\w+)::\w+\s*{/g;
    const structs = [];
    let match;
    
    while ((match = structRegex.exec(content)) !== null) {
      structs.push(match[1].toLowerCase());
    }
    
    return structs;
  }

  /**
   * Check if contract uses a specific dependency
   */
  usesDependency(useStatements, moduleCalls, structUsage, dependencyName) {
    // Check use statements
    for (const useStmt of useStatements) {
      if (useStmt.toLowerCase().includes(dependencyName)) {
        return true;
      }
    }
    
    // Check module calls
    if (moduleCalls.includes(dependencyName)) {
      return true;
    }
    
    // Check struct usage
    if (structUsage.includes(dependencyName)) {
      return true;
    }
    
    return false;
  }

  /**
   * Topological sort to determine deployment order
   */
  topologicalSort(contracts, dependencies) {
    const visited = new Set();
    const visiting = new Set();
    const result = [];
    
    const contractMap = new Map();
    for (const contract of contracts) {
      contractMap.set(contract.name, contract);
    }
    
    const visit = (contractName) => {
      if (visiting.has(contractName)) {
        throw new Error(`Circular dependency detected involving ${contractName}`);
      }
      
      if (visited.has(contractName)) {
        return;
      }
      
      visiting.add(contractName);
      
      const contractDeps = dependencies.get(contractName) || [];
      for (const dep of contractDeps) {
        if (contractMap.has(dep)) {
          visit(dep);
        }
      }
      
      visiting.delete(contractName);
      visited.add(contractName);
      
      const contract = contractMap.get(contractName);
      if (contract) {
        result.push(contract);
      }
    };
    
    // Visit all contracts
    for (const contract of contracts) {
      visit(contract.name);
    }
    
    return result;
  }

  /**
   * Validate deployment order
   */
  validateOrder(contracts, dependencies) {
    const deployed = new Set();
    
    for (const contract of contracts) {
      const contractDeps = dependencies.get(contract.name) || [];
      
      for (const dep of contractDeps) {
        if (!deployed.has(dep)) {
          throw new Error(
            `Dependency error: ${contract.name} depends on ${dep}, but ${dep} is not deployed yet`
          );
        }
      }
      
      deployed.add(contract.name);
    }
    
    return true;
  }

  /**
   * Get dependency graph for visualization
   */
  getDependencyGraph(contracts) {
    const dependencies = this.analyzeDependencies(contracts);
    const graph = {};
    
    for (const contract of contracts) {
      graph[contract.name] = dependencies.get(contract.name) || [];
    }
    
    return graph;
  }
}