
import { createWalletClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NFTCompiler } from '../compiler/NFTCompiler.js';

export class NFTManager {
  constructor(client, chain) {
    this.client = client;
    this.chain = chain;
  }

  /**
   * Deploy ERC-721 NFT collection using Umi-specific method
   */
  async deployNFTCollection({ 
    deployerPrivateKey, 
    name, 
    symbol,
    baseURI = "",
    maxSupply = 10000,
    mintPrice = "0" // in ETH
  }) {
    try {
      // Validate inputs
      if (!deployerPrivateKey) throw new Error('Deployer private key required');
      if (!name) throw new Error('Collection name required');
      if (!symbol) throw new Error('Collection symbol required');

      console.log(`🎨 Compiling ${name} NFT collection...`);

      // Compile the NFT contract
      const compiled = NFTCompiler.compileERC721Collection(name, symbol, baseURI, maxSupply, mintPrice);
      console.log(`✅ NFT contract compiled successfully`);

      // Format private key
      const formattedKey = deployerPrivateKey.startsWith('0x') 
        ? deployerPrivateKey 
        : '0x' + deployerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      console.log(`🚀 Deploying NFT collection from ${account.address}...`);

      // Use Umi-specific deployment method (same as tokens)
      const serializedBytecode = this._serializeForUmi(compiled.bytecode);

      console.log(`📦 Serialized bytecode for Umi network`);

      // Deploy using Umi-compatible transaction
      const hash = await walletClient.sendTransaction({
        to: null, // Contract creation
        data: serializedBytecode,
        gas: 3000000n, // Higher gas for NFT contracts
      });

      console.log(`📝 Transaction hash: ${hash}`);

      // Wait for deployment
      const receipt = await this.client.waitForTransaction(hash);
      
      console.log(`✅ NFT collection deployed at: ${receipt.contractAddress}`);

      return {
        hash,
        contractAddress: receipt.contractAddress,
        deployer: account.address,
        name,
        symbol,
        baseURI,
        maxSupply: maxSupply.toString(),
        mintPrice: mintPrice.toString(),
        type: 'ERC721',
        abi: compiled.abi,
        bytecode: compiled.bytecode
      };

    } catch (error) {
      throw new Error(`NFT collection deployment failed: ${error.message}`);
    }
  }

  /**
   * Mint NFT to specific address
   */
  async mintNFT({
    ownerPrivateKey,
    contractAddress,
    to,
    tokenId,
    metadataURI = ""
  }) {
    try {
      const formattedKey = ownerPrivateKey.startsWith('0x') 
        ? ownerPrivateKey 
        : '0x' + ownerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      // Encode mint function call
      const data = encodeFunctionData({
        abi: NFTCompiler.getStandardERC721ABI(),
        functionName: 'mintTo',
        args: [to, tokenId, metadataURI]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 200000n,
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        to,
        tokenId: tokenId.toString(),
        metadataURI,
        contractAddress,
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`NFT mint failed: ${error.message}`);
    }
  }

  /**
   * Batch mint NFTs (more efficient for multiple NFTs)
   */
  async batchMintNFTs({
    ownerPrivateKey,
    contractAddress,
    recipients, // Array of {to, tokenId, metadataURI}
  }) {
    try {
      const formattedKey = ownerPrivateKey.startsWith('0x') 
        ? ownerPrivateKey 
        : '0x' + ownerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      // Prepare batch data
      const addresses = recipients.map(r => r.to);
      const tokenIds = recipients.map(r => r.tokenId);
      const metadataURIs = recipients.map(r => r.metadataURI || "");

      // Encode batch mint function call
      const data = encodeFunctionData({
        abi: NFTCompiler.getStandardERC721ABI(),
        functionName: 'batchMint',
        args: [addresses, tokenIds, metadataURIs]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: BigInt(200000 * recipients.length), // Scale gas with batch size
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        recipients,
        contractAddress,
        count: recipients.length,
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`Batch NFT mint failed: ${error.message}`);
    }
  }

  /**
   * Transfer NFT between addresses
   */
  async transferNFT({
    fromPrivateKey,
    contractAddress,
    from,
    to,
    tokenId
  }) {
    try {
      const formattedKey = fromPrivateKey.startsWith('0x') 
        ? fromPrivateKey 
        : '0x' + fromPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      const data = encodeFunctionData({
        abi: NFTCompiler.getStandardERC721ABI(),
        functionName: 'safeTransferFrom',
        args: [from, to, tokenId]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 150000n,
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        from,
        to,
        tokenId: tokenId.toString(),
        contractAddress,
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`NFT transfer failed: ${error.message}`);
    }
  }

  /**
   * Get NFT owner
   */
  async getNFTOwner({
    contractAddress,
    tokenId
  }) {
    try {
      const data = encodeFunctionData({
        abi: NFTCompiler.getStandardERC721ABI(),
        functionName: 'ownerOf',
        args: [tokenId]
      });

      const result = await this.client.call({
        to: contractAddress,
        data,
      });

      if (!result.data) return null;

      // Decode the result (address)
      const owner = '0x' + result.data.slice(-40); // Last 20 bytes as hex
      return owner;

    } catch (error) {
      throw new Error(`Failed to get NFT owner: ${error.message}`);
    }
  }

  /**
   * Get NFT metadata URI
   */
  async getNFTMetadata({
    contractAddress,
    tokenId
  }) {
    try {
      const data = encodeFunctionData({
        abi: NFTCompiler.getStandardERC721ABI(),
        functionName: 'tokenURI',
        args: [tokenId]
      });

      const result = await this.client.call({
        to: contractAddress,
        data,
      });

      if (!result.data) return "";

      // Decode the result (string)
      // This is a simplified decoder - in practice you'd use proper ABI decoding
      return this._decodeStringResult(result.data);

    } catch (error) {
      throw new Error(`Failed to get NFT metadata: ${error.message}`);
    }
  }

  /**
   * Get NFT balance (how many NFTs an address owns)
   */
  async getNFTBalance({
    contractAddress,
    address
  }) {
    try {
      const data = encodeFunctionData({
        abi: NFTCompiler.getStandardERC721ABI(),
        functionName: 'balanceOf',
        args: [address]
      });

      const result = await this.client.call({
        to: contractAddress,
        data,
      });

      if (!result.data) return 0;

      // Decode the result (uint256)
      const balance = BigInt(result.data);
      return Number(balance);

    } catch (error) {
      throw new Error(`Failed to get NFT balance: ${error.message}`);
    }
  }

  /**
   * Get collection information
   */
  async getCollectionInfo({
    contractAddress
  }) {
    try {
      // Get name
      const nameData = encodeFunctionData({
        abi: NFTCompiler.getStandardERC721ABI(),
        functionName: 'name',
        args: []
      });

      // Get symbol
      const symbolData = encodeFunctionData({
        abi: NFTCompiler.getStandardERC721ABI(),
        functionName: 'symbol',
        args: []
      });

      // Get total supply
      const totalSupplyData = encodeFunctionData({
        abi: NFTCompiler.getStandardERC721ABI(),
        functionName: 'totalSupply',
        args: []
      });

      // Execute calls
      const [nameResult, symbolResult, totalSupplyResult] = await Promise.all([
        this.client.call({ to: contractAddress, data: nameData }),
        this.client.call({ to: contractAddress, data: symbolData }),
        this.client.call({ to: contractAddress, data: totalSupplyData }),
      ]);

      return {
        contractAddress,
        name: this._decodeStringResult(nameResult.data),
        symbol: this._decodeStringResult(symbolResult.data),
        totalSupply: Number(BigInt(totalSupplyResult.data || 0)),
        type: 'ERC721'
      };

    } catch (error) {
      throw new Error(`Failed to get collection info: ${error.message}`);
    }
  }

  /**
   * Set approval for all NFTs (useful for marketplaces)
   */
  async setApprovalForAll({
    ownerPrivateKey,
    contractAddress,
    operator,
    approved = true
  }) {
    try {
      const formattedKey = ownerPrivateKey.startsWith('0x') 
        ? ownerPrivateKey 
        : '0x' + ownerPrivateKey;

      const account = privateKeyToAccount(formattedKey);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.chain.rpcUrls.default.http[0])
      });

      const data = encodeFunctionData({
        abi: NFTCompiler.getStandardERC721ABI(),
        functionName: 'setApprovalForAll',
        args: [operator, approved]
      });

      const hash = await walletClient.sendTransaction({
        to: contractAddress,
        data,
        gas: 100000n,
      });

      const receipt = await this.client.waitForTransaction(hash);

      return {
        hash,
        owner: account.address,
        operator,
        approved,
        contractAddress,
        status: receipt.status === 'success' ? 'confirmed' : 'failed'
      };

    } catch (error) {
      throw new Error(`Set approval failed: ${error.message}`);
    }
  }

  /**
   * Serialize bytecode for Umi Network (reuse from TokenManager)
   */
  _serializeForUmi(bytecode) {
    try {
      // Remove 0x prefix if present
      const cleanBytecode = bytecode.replace('0x', '');
      
      // Convert to bytes array
      const code = new Uint8Array(Buffer.from(cleanBytecode, 'hex'));
      
      // Umi-specific serialization (same as tokens)
      const serialized = this._createUmiContractWrapper(code);
      
      return '0x' + Buffer.from(serialized).toString('hex');
      
    } catch (error) {
      throw new Error(`Umi serialization failed: ${error.message}`);
    }
  }

  /**
   * Create Umi contract wrapper (same as TokenManager)
   */
  _createUmiContractWrapper(contractBytes) {
    const length = contractBytes.length;
    const lengthBytes = this._encodeLength(length);
    
    // Create the wrapper: [enum_variant, length, bytecode]
    const wrapper = new Uint8Array(1 + lengthBytes.length + contractBytes.length);
    
    // Enum variant for EVM contract
    wrapper[0] = 2; // EvmContract variant
    
    // Copy length encoding
    wrapper.set(lengthBytes, 1);
    
    // Copy contract bytecode
    wrapper.set(contractBytes, 1 + lengthBytes.length);
    
    return wrapper;
  }

  /**
   * Encode length as varint (same as TokenManager)
   */
  _encodeLength(length) {
    if (length < 128) {
      return new Uint8Array([length]);
    } else if (length < 16384) {
      return new Uint8Array([
        (length & 0x7F) | 0x80,
        length >> 7
      ]);
    } else {
      // For larger lengths, use 4-byte encoding
      return new Uint8Array([
        (length & 0xFF),
        (length >> 8) & 0xFF,
        (length >> 16) & 0xFF,
        (length >> 24) & 0xFF
      ]);
    }
  }

  /**
   * Simple string decoder for contract calls
   */
  _decodeStringResult(data) {
    if (!data || data === '0x') return '';
    
    try {
      // Simple string decoding - skip offset and length, get the actual string
      const cleanData = data.replace('0x', '');
      if (cleanData.length < 128) return '';
      
      // Skip the first 64 chars (offset) and next 64 chars (length), then decode
      const stringData = cleanData.slice(128);
      const bytes = [];
      
      for (let i = 0; i < stringData.length; i += 2) {
        const byte = parseInt(stringData.substr(i, 2), 16);
        if (byte !== 0) bytes.push(byte);
      }
      
      return String.fromCharCode(...bytes);
    } catch (error) {
      return '';
    }
  }
}