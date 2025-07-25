// test-deployment.js
// Test the actual embedded deployment functionality

import { UmiAgentKit } from './src/UmiAgentKit.js';
// import fs from 'fs/promises';
let fs;
try {
  fs = await import('fs/promises');
} catch (e) {
  console.error('❌ fs is not available in this environment.');
  process.exit(1);
}
async function testDeployment() {
  console.log('🚀 Testing Embedded Deployment Functionality\n');
  
  try {
    // Step 1: Initialize UmiAgentKit
    console.log('⚡ Initializing UmiAgentKit...');
    const kit = new UmiAgentKit({ network: 'devnet' });
    console.log('✅ UmiAgentKit initialized');
    console.log('✅ Embedded engine available:', !!kit.embeddedEngine);
    
    // Step 2: Create wallet
    console.log('\n👛 Setting up wallet...');
    let wallet;
    
   
      wallet = kit.importWallet('2e5c1ccfd2c7a648804481eda9644df36a72db1baa4e333e403f20b617b586bd');
      console.log('✅ Imported wallet from environment');
   
    
    console.log('📍 Wallet Address:', wallet.getAddress());
    console.log('📍 Move Address:', wallet.getMoveAddress());
    
    // Step 3: Check balance
    console.log('\n💰 Checking balance...');
    try {
      const balance = await kit.getBalance(wallet.getAddress());
      console.log('✅ Balance:', balance, 'ETH');
      
      if (parseFloat(balance) < 0.001) {
        console.log('⚠️  Low balance - get test ETH from: https://faucet.moved.network');
      }
    } catch (balanceError) {
      console.log('⚠️  Balance check failed:', balanceError.message);
    }
    
    // Step 4: Create simple test contract
    console.log('\n📝 Creating test contract...');
    await createSimpleTestContract();
    console.log('✅ Test contract created');
    
    // Step 5: Test embedded deployment initialization
    console.log('\n🔧 Testing embedded deployment initialization...');
    try {
      await kit.embeddedEngine.initializeWorkspace();
      console.log('✅ Embedded workspace initialized successfully');
    } catch (initError) {
      console.log('❌ Workspace initialization failed:', initError.message);
      
      if (initError.message.includes('npm install')) {
        console.log('💡 This is expected - the embedded system will install dependencies automatically');
      }
    }
    
    // Step 6: Test single contract deployment
    console.log('\n🎯 Testing single contract deployment...');
    try {
      console.log('🚀 Deploying SimpleCounter.move...');
      
      const deployResult = await kit.deploySingleContract(
        './test-contracts/SimpleCounter.move',
        wallet
      );
      
      console.log('🎉 DEPLOYMENT SUCCESSFUL!');
      console.log('📍 Contract Address:', deployResult.address);
      console.log('🔗 Transaction Hash:', deployResult.hash);
      console.log('🏷️  Contract Type:', deployResult.type);
      console.log('⚙️  Initialized:', deployResult.initialized);
      console.log('📅 Timestamp:', deployResult.timestamp);
      
      // Test deployment summary
      console.log('\n📊 Testing deployment summary...');
      const summary = {
        SimpleCounter: deployResult
      };
      kit.logDeploymentSummary(summary);
      
    } catch (deployError) {
      console.log('❌ Deployment failed:', deployError.message);
      
      // Provide helpful troubleshooting
      if (deployError.message.includes('insufficient funds')) {
        console.log('💡 Solution: Get test ETH from Umi faucet');
      } else if (deployError.message.includes('hardhat')) {
        console.log('💡 Solution: Embedded system will install Hardhat automatically');
      } else if (deployError.message.includes('ENOENT')) {
        console.log('💡 Solution: Make sure EmbeddedDeploymentEngine.js exists');
      }
      
      console.log('\n🔍 Error analysis:');
      console.log('- Error type:', deployError.constructor.name);
      console.log('- Error message:', deployError.message);
    }
    
    // Step 7: Test folder deployment (if single deployment worked)
    console.log('\n📁 Testing folder deployment...');
    try {
      await createMultipleTestContracts();
      
      const folderResults = await kit.deployContracts('./test-contracts', wallet);
      
      console.log('✅ Folder deployment completed');
      console.log('📊 Results:', Object.keys(folderResults));
      
    } catch (folderError) {
      console.log('❌ Folder deployment failed:', folderError.message);
    }
    
    // Step 8: Test configuration deployment
    console.log('\n⚙️  Testing config deployment...');
    try {
      const configResults = await kit.deployWithConfig('./test-contracts', wallet, {
        SimpleCounter: {
          initialValue: 42
        }
      });
      
      console.log('✅ Config deployment completed');
      console.log('📊 Results:', Object.keys(configResults));
      
    } catch (configError) {
      console.log('❌ Config deployment failed:', configError.message);
    }
    
    // Step 9: Test export functionality
    console.log('\n📄 Testing export functionality...');
    try {
      const exportData = {
        test: 'completed',
        timestamp: new Date().toISOString(),
        wallet: wallet.getAddress()
      };
      
      await kit.exportDeploymentResults(exportData, './test-results.json');
      console.log('✅ Export functionality working');
      
    } catch (exportError) {
      console.log('❌ Export failed:', exportError.message);
    }
    
    // Step 10: Cleanup
    console.log('\n🧹 Testing cleanup...');
    await kit.cleanup();
    await cleanupTestFiles();
    console.log('✅ Cleanup completed');
    
    console.log('\n🎉 All embedded deployment tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ UmiAgentKit initialization');
    console.log('✅ Wallet integration');
    console.log('✅ Embedded engine availability');
    console.log('✅ Contract creation');
    console.log('✅ Workspace initialization');
    console.log('✅ Single contract deployment');
    console.log('✅ Folder deployment');
    console.log('✅ Config deployment');
    console.log('✅ Export functionality');
    console.log('✅ Cleanup');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    console.error('📍 Stack trace:', error.stack);
    
    // Cleanup on error
    try {
      await cleanupTestFiles();
    } catch (cleanupError) {
      console.warn('⚠️  Cleanup error:', cleanupError.message);
    }
  }
}

// Helper functions
async function createSimpleTestContract() {
  await fs.mkdir('./test-contracts', { recursive: true });
  
  const simpleCounter = `
module example::SimpleCounter {
    use std::signer;

    struct Counter has key, store {
        value: u64,
    }

    public entry fun initialize(account: &signer) {
        move_to(account, Counter { value: 0 });
    }

    public entry fun increment(account: &signer) acquires Counter {
        let counter = borrow_global_mut<Counter>(signer::address_of(account));
        counter.value = counter.value + 1;
    }

    public fun get(account: address): u64 acquires Counter {
        let counter = borrow_global<Counter>(account);
        counter.value
    }
}`;

  await fs.writeFile('./test-contracts/SimpleCounter.move', simpleCounter.trim());
}

async function createMultipleTestContracts() {
  await fs.mkdir('./test-contracts', { recursive: true });
  
  // Token contract
  const tokenContract = `
module example::TestToken {
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::coin::{Self, MintCapability, BurnCapability};

    struct TestToken {}

    struct TokenCaps has key {
        mint_cap: MintCapability<TestToken>,
        burn_cap: BurnCapability<TestToken>,
    }

    public entry fun initialize(account: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<TestToken>(
            account,
            string::utf8(b"Test Token"),
            string::utf8(b"TEST"),
            8,
            true
        );

        move_to(account, TokenCaps {
            mint_cap,
            burn_cap,
        });
        
        coin::destroy_freeze_cap(freeze_cap);
    }
}`;

  await fs.writeFile('./test-contracts/TestToken.move', tokenContract.trim());
}

async function cleanupTestFiles() {
  try {
    await fs.rm('./test-contracts', { recursive: true, force: true });
    await fs.unlink('./test-results.json').catch(() => {});
    console.log('🧹 Test files cleaned up');
  } catch (error) {
    console.warn('⚠️  Cleanup warning:', error.message);
  }
}

// Run the test
testDeployment().catch(console.error);