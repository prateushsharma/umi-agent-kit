// Default configuration for UmiAgentKit
export const DEFAULT_CONFIG = {
  devnet: {
    name: 'Umi Devnet',
    rpcUrl: 'https://devnet.uminetwork.com',
    chainId: 42069,
    currency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    blockExplorer: 'https://devnet.explorer.moved.network'
  },
  mainnet: {
    name: 'Umi Mainnet',
    rpcUrl: 'https://mainnet.moved.network', // Update when available
    chainId: 1, // Update when available
    currency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    blockExplorer: 'https://explorer.moved.network' // Update when available
  }
};

export function validateConfig(config) {
  if (!config.network) {
    throw new Error('Network is required (devnet or mainnet)');
  }
  
  if (!['devnet', 'mainnet'].includes(config.network)) {
    throw new Error('Network must be either "devnet" or "mainnet"');
  }
  
  return true;
}