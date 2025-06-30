import { ethers } from 'ethers';
import { AccountAddress } from '@aptos-labs/ts-sdk';

export class UmiWallet {
  constructor(privateKey, client) {
    if (!privateKey) {
      throw new Error('Private key is required');
    }
    
    this.privateKey = privateKey;
    this.client = client;
    this.ethersWallet = new ethers.Wallet(privateKey);
    this.address = this.ethersWallet.address;
  }

  /**
   * Get the wallet's Ethereum-style address
   */
  getAddress() {
    return this.address;
  }

  /**
   * Get the wallet's Move-style address (32-byte format)
   */
  getMoveAddress() {
    // Convert Ethereum address to Move address format
    const ethAddr = this.address.replace('0x', '');
    const moveAddr = '0x000000000000000000000000' + ethAddr;
    return moveAddr;
  }

  /**
   * Get wallet balance in ETH
   */
  async getBalance() {
    if (!this.client) {
      throw new Error('Client not available');
    }
    
    try {
      const balance = await this.client.getBalance(this.address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Sign a message
   */
  async signMessage(message) {
    return await this.ethersWallet.signMessage(message);
  }

  /**
   * Get wallet info
   */
  getInfo() {
    return {
      address: this.address,
      moveAddress: this.getMoveAddress(),
      publicKey: this.ethersWallet.publicKey
    };
  }

  /**
   * Export private key (use with caution)
   */
  exportPrivateKey() {
    // Ensure private key has 0x prefix for Viem compatibility
    return this.privateKey.startsWith('0x') ? this.privateKey : '0x' + this.privateKey;
  }
}

/**
 * Utility function to convert Ethereum address to Move address
 */
export function ethToMoveAddress(ethAddress) {
  const cleanAddr = ethAddress.replace('0x', '');
  return '0x000000000000000000000000' + cleanAddr;
}

/**
 * Utility function to convert Move address to Ethereum address
 */
export function moveToEthAddress(moveAddress) {
  // Take the last 20 bytes (40 hex chars) of the Move address
  const cleanAddr = moveAddress.replace('0x', '');
  if (cleanAddr.length !== 64) {
    throw new Error('Invalid Move address length');
  }
  return '0x' + cleanAddr.slice(-40);
}