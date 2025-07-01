/**
 * File Location: src/compiler/NFTCompiler.js
 * NFT Compiler - Compiles ERC-721 NFT contracts for Umi Network
 * 
 * Features:
 * - Generate ERC-721 contract source code
 * - Compile to bytecode using solc
 * - Support for metadata, batch minting, and marketplace integration
 * - Optimized for gaming and collectibles use cases
 */

import solc from 'solc';

export class NFTCompiler {
  /**
   * Compile ERC-721 NFT collection contract
   */
  static compileERC721Collection(name, symbol, baseURI, maxSupply, mintPrice) {
    const contractSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ${name}NFT {
    string public name = "${name}";
    string public symbol = "${symbol}";
    string private _baseTokenURI = "${baseURI}";
    uint256 public maxSupply = ${maxSupply};
    uint256 public mintPrice = ${mintPrice} ether;
    uint256 public totalSupply = 0;
    
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => string) private _tokenURIs;
    
    address public owner;
    bool public publicMintEnabled = false;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event Mint(address indexed to, uint256 indexed tokenId, string tokenURI);
    event BatchMint(address[] recipients, uint256[] tokenIds, uint256 count);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier tokenExists(uint256 tokenId) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    // ============ Core ERC-721 Functions ============
    
    function balanceOf(address tokenOwner) public view returns (uint256) {
        require(tokenOwner != address(0), "Invalid address");
        return _balances[tokenOwner];
    }
    
    function ownerOf(uint256 tokenId) public view tokenExists(tokenId) returns (address) {
        return _owners[tokenId];
    }
    
    function approve(address to, uint256 tokenId) public {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "Cannot approve to current owner");
        require(
            msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender),
            "Not approved to manage this token"
        );
        
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view tokenExists(tokenId) returns (address) {
        return _tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "Cannot approve to yourself");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address tokenOwner, address operator) public view returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved to transfer");
        _transfer(from, to, tokenId);
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved to transfer");
        _safeTransfer(from, to, tokenId, data);
    }
    
    // ============ Metadata Functions ============
    
    function tokenURI(uint256 tokenId) public view tokenExists(tokenId) returns (string memory) {
        string memory _tokenURI = _tokenURIs[tokenId];
        
        // If token has specific URI, return it
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        
        // Otherwise, concatenate base URI with token ID
        if (bytes(_baseTokenURI).length > 0) {
            return string(abi.encodePacked(_baseTokenURI, _toString(tokenId)));
        }
        
        return "";
    }
    
    function setTokenURI(uint256 tokenId, string memory uri) public onlyOwner tokenExists(tokenId) {
        _tokenURIs[tokenId] = uri;
    }
    
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _baseTokenURI = newBaseURI;
    }
    
    // ============ Minting Functions ============
    
    function mintTo(address to, uint256 tokenId, string memory metadataURI) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(_owners[tokenId] == address(0), "Token already exists");
        require(totalSupply < maxSupply, "Max supply reached");
        
        _owners[tokenId] = to;
        _balances[to] += 1;
        totalSupply += 1;
        
        if (bytes(metadataURI).length > 0) {
            _tokenURIs[tokenId] = metadataURI;
        }
        
        emit Transfer(address(0), to, tokenId);
        emit Mint(to, tokenId, metadataURI);
    }
    
    function publicMint(uint256 tokenId, string memory metadataURI) public payable {
        require(publicMintEnabled, "Public mint not enabled");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(totalSupply < maxSupply, "Max supply reached");
        
        mintTo(msg.sender, tokenId, metadataURI);
        
        // Refund excess payment
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
    }
    
    function batchMint(address[] memory recipients, uint256[] memory tokenIds, string[] memory metadataURIs) public onlyOwner {
        require(recipients.length == tokenIds.length, "Arrays length mismatch");
        require(recipients.length == metadataURIs.length, "Metadata arrays length mismatch");
        require(totalSupply + recipients.length <= maxSupply, "Would exceed max supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            require(_owners[tokenIds[i]] == address(0), "Token already exists");
            
            _owners[tokenIds[i]] = recipients[i];
            _balances[recipients[i]] += 1;
            
            if (bytes(metadataURIs[i]).length > 0) {
                _tokenURIs[tokenIds[i]] = metadataURIs[i];
            }
            
            emit Transfer(address(0), recipients[i], tokenIds[i]);
            emit Mint(recipients[i], tokenIds[i], metadataURIs[i]);
        }
        
        totalSupply += recipients.length;
        emit BatchMint(recipients, tokenIds, recipients.length);
    }
    
    // ============ Owner Functions ============
    
    function setPublicMintEnabled(bool enabled) public onlyOwner {
        publicMintEnabled = enabled;
    }
    
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner).transfer(balance);
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
    
    // ============ Internal Functions ============
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        address tokenOwner = _owners[tokenId];
        return (spender == tokenOwner || getApproved(tokenId) == spender || isApprovedForAll(tokenOwner, spender));
    }
    
    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "Transfer from incorrect owner");
        require(to != address(0), "Transfer to zero address");
        
        // Clear approvals from the previous owner
        _approve(address(0), tokenId);
        
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }
    
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "Transfer to non ERC721Receiver");
    }
    
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("Transfer to non ERC721Receiver");
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    // ============ ERC165 Support ============
    
    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC165
            interfaceId == 0x80ac58cd || // ERC721
            interfaceId == 0x5b5e139f;   // ERC721Metadata
    }
}

// IERC721Receiver interface
interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}`;

    const input = {
      language: 'Solidity',
      sources: {
        [`${name}NFT.sol`]: {
          content: contractSource
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode.object']
          }
        }
      }
    };

    try {
      const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
      
      if (compiled.errors) {
        const hasErrors = compiled.errors.some(error => error.severity === 'error');
        if (hasErrors) {
          throw new Error('Compilation errors: ' + compiled.errors.map(e => e.message).join('\n'));
        }
      }

      const contractName = `${name}NFT`;
      const contract = compiled.contracts[`${contractName}.sol`][contractName];
      
      return {
        abi: contract.abi,
        bytecode: '0x' + contract.evm.bytecode.object,
        contractName
      };

    } catch (error) {
      throw new Error(`NFT compilation failed: ${error.message}`);
    }
  }

  /**
   * Get standard ERC-721 ABI for already deployed contracts
   */
  static getStandardERC721ABI() {
    return [
      {
        "inputs": [{"name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
      },
      {
        "inputs": [{"name": "tokenId", "type": "uint256"}],
        "name": "ownerOf",
        "outputs": [{"name": "", "type": "address"}],
        "type": "function"
      },
      {
        "inputs": [{"name": "to", "type": "address"}, {"name": "tokenId", "type": "uint256"}],
        "name": "approve",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [{"name": "tokenId", "type": "uint256"}],
        "name": "getApproved",
        "outputs": [{"name": "", "type": "address"}],
        "type": "function"
      },
      {
        "inputs": [{"name": "operator", "type": "address"}, {"name": "approved", "type": "bool"}],
        "name": "setApprovalForAll",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [{"name": "owner", "type": "address"}, {"name": "operator", "type": "address"}],
        "name": "isApprovedForAll",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      },
      {
        "inputs": [{"name": "from", "type": "address"}, {"name": "to", "type": "address"}, {"name": "tokenId", "type": "uint256"}],
        "name": "transferFrom",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [{"name": "from", "type": "address"}, {"name": "to", "type": "address"}, {"name": "tokenId", "type": "uint256"}],
        "name": "safeTransferFrom",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [{"name": "tokenId", "type": "uint256"}],
        "name": "tokenURI",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
      },
      {
        "inputs": [{"name": "to", "type": "address"}, {"name": "tokenId", "type": "uint256"}, {"name": "metadataURI", "type": "string"}],
        "name": "mintTo",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [{"name": "recipients", "type": "address[]"}, {"name": "tokenIds", "type": "uint256[]"}, {"name": "metadataURIs", "type": "string[]"}],
        "name": "batchMint",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [{"name": "tokenId", "type": "uint256"}, {"name": "metadataURI", "type": "string"}],
        "name": "publicMint",
        "outputs": [],
        "type": "function",
        "payable": true
      },
      {
        "inputs": [{"name": "enabled", "type": "bool"}],
        "name": "setPublicMintEnabled",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [{"name": "newPrice", "type": "uint256"}],
        "name": "setMintPrice",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [{"name": "newBaseURI", "type": "string"}],
        "name": "setBaseURI",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [{"name": "tokenId", "type": "uint256"}, {"name": "uri", "type": "string"}],
        "name": "setTokenURI",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [{"name": "newOwner", "type": "address"}],
        "name": "transferOwnership",
        "outputs": [],
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "from", "type": "address"}, {"indexed": true, "name": "to", "type": "address"}, {"indexed": true, "name": "tokenId", "type": "uint256"}],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "owner", "type": "address"}, {"indexed": true, "name": "approved", "type": "address"}, {"indexed": true, "name": "tokenId", "type": "uint256"}],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "owner", "type": "address"}, {"indexed": true, "name": "operator", "type": "address"}, {"name": "approved", "type": "bool"}],
        "name": "ApprovalForAll",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [{"indexed": true, "name": "to", "type": "address"}, {"indexed": true, "name": "tokenId", "type": "uint256"}, {"name": "tokenURI", "type": "string"}],
        "name": "Mint",
        "type": "event"
      }
    ];
  }

  /**
   * Generate gaming-specific NFT contract (weapons, characters, etc.)
   */
  static compileGamingNFT(name, symbol, baseURI, categories = []) {
    // Categories like ["weapon", "character", "item", "land"]
    const categoryEnum = categories.length > 0 ? 
      `enum Category { ${categories.map(c => c.toUpperCase()).join(', ')} }` : 
      'enum Category { COMMON, RARE, EPIC, LEGENDARY }';

    const contractSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ${name}Gaming {
    string public name = "${name}";
    string public symbol = "${symbol}";
    string private _baseTokenURI = "${baseURI}";
    
    ${categoryEnum}
    
    struct GameAsset {
        Category category;
        uint256 level;
        uint256 experience;
        string attributes; // JSON string of attributes
        bool tradeable;
    }
    
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => GameAsset) public gameAssets;
    mapping(uint256 => string) private _tokenURIs;
    
    address public owner;
    uint256 public totalSupply = 0;
    
    event AssetCreated(uint256 indexed tokenId, Category category, uint256 level);
    event AssetUpgraded(uint256 indexed tokenId, uint256 newLevel, uint256 newExperience);
    
    constructor() {
        owner = msg.sender;
    }
    
    function mintGameAsset(
        address to,
        uint256 tokenId,
        Category category,
        uint256 level,
        string memory attributes,
        string memory metadataURI
    ) public {
        require(msg.sender == owner, "Not authorized");
        require(_owners[tokenId] == address(0), "Token exists");
        
        _owners[tokenId] = to;
        _balances[to] += 1;
        totalSupply += 1;
        
        gameAssets[tokenId] = GameAsset({
            category: category,
            level: level,
            experience: 0,
            attributes: attributes,
            tradeable: true
        });
        
        _tokenURIs[tokenId] = metadataURI;
        
        emit AssetCreated(tokenId, category, level);
    }
    
    function upgradeAsset(uint256 tokenId, uint256 newLevel, uint256 experience) public {
        require(msg.sender == owner, "Not authorized");
        require(_owners[tokenId] != address(0), "Token does not exist");
        
        gameAssets[tokenId].level = newLevel;
        gameAssets[tokenId].experience = experience;
        
        emit AssetUpgraded(tokenId, newLevel, experience);
    }
    
    function setTradeable(uint256 tokenId, bool tradeable) public {
        require(msg.sender == owner, "Not authorized");
        gameAssets[tokenId].tradeable = tradeable;
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _owners[tokenId];
    }
    
    function balanceOf(address tokenOwner) public view returns (uint256) {
        return _balances[tokenOwner];
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        return _tokenURIs[tokenId];
    }
}`;

    return this.compileCustomContract(contractSource, `${name}Gaming`);
  }

  /**
   * Compile custom contract source
   */
  static compileCustomContract(contractSource, contractName) {
    const input = {
      language: 'Solidity',
      sources: {
        [`${contractName}.sol`]: {
          content: contractSource
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode.object']
          }
        }
      }
    };

    try {
      const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
      
      if (compiled.errors) {
        const hasErrors = compiled.errors.some(error => error.severity === 'error');
        if (hasErrors) {
          throw new Error('Compilation errors: ' + compiled.errors.map(e => e.message).join('\n'));
        }
      }

      const contract = compiled.contracts[`${contractName}.sol`][contractName];
      
      return {
        abi: contract.abi,
        bytecode: '0x' + contract.evm.bytecode.object,
        contractName
      };

    } catch (error) {
      throw new Error(`Custom contract compilation failed: ${error.message}`);
    }
  }
}