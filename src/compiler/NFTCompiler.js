// Fixed NFTCompiler.js with complete OpenZeppelin ERC-721 implementation

import solc from 'solc';

export class NFTCompiler {
  /**
   * Compile simplified OpenZeppelin ERC-721 NFT collection
   */
  static compileERC721Collection(name, symbol, baseURI = "", maxSupply = 10000, mintPrice = "0") {
    try {
      // Simplified OpenZeppelin-style ERC-721 contract (self-contained)
      const contractSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ${name.replace(/[^a-zA-Z0-9]/g, '')}NFT {
    using Strings for uint256;
    
    string public name;
    string public symbol;
    uint256 public totalSupply;
    uint256 public maxSupply;
    uint256 public mintPrice;
    string public baseTokenURI;
    bool public paused;
    address public owner;
    
    uint256 private _tokenIdCounter = 1;
    
    // ERC721 storage
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    
    // Gaming features
    mapping(uint256 => uint256) public tokenLevel;
    mapping(uint256 => uint256) public tokenExperience;
    mapping(uint256 => string) public tokenAttributes;
    
    // Enumerable storage
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;
    uint256[] private _allTokens;
    mapping(uint256 => uint256) private _allTokensIndex;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event TokenMinted(address indexed to, uint256 indexed tokenId);
    event TokenLevelUp(uint256 indexed tokenId, uint256 newLevel);
    event ContractPaused(bool paused);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier tokenExists(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint256 _maxSupply,
        uint256 _mintPrice,
        address _owner
    ) {
        name = _name;
        symbol = _symbol;
        baseTokenURI = _baseURI;
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        owner = _owner;
        paused = false;
    }
    
    // ERC721 Implementation
    function balanceOf(address ownerAddr) public view returns (uint256) {
        require(ownerAddr != address(0), "ERC721: address zero is not a valid owner");
        return _balances[ownerAddr];
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _ownerOf(tokenId);
        require(tokenOwner != address(0), "ERC721: invalid token ID");
        return tokenOwner;
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "ERC721: invalid token ID");
        return bytes(baseTokenURI).length > 0 
            ? string(abi.encodePacked(baseTokenURI, tokenId.toString())) 
            : "";
    }
    
    function approve(address to, uint256 tokenId) public {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "ERC721: approval to current owner");
        require(
            msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender),
            "ERC721: approve caller is not token owner or approved for all"
        );
        _approve(to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "ERC721: invalid token ID");
        return _tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "ERC721: approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address ownerAddr, address operator) public view returns (bool) {
        return _operatorApprovals[ownerAddr][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _transfer(from, to, tokenId);
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _safeTransfer(from, to, tokenId, data);
    }
    
    // Minting functions
    function mint(address to) public payable whenNotPaused {
        require(totalSupply < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _initializeGamingAttributes(tokenId);
        
        emit TokenMinted(to, tokenId);
    }
    
    function ownerMint(address to, uint256 quantity) public onlyOwner {
        require(totalSupply + quantity <= maxSupply, "Would exceed max supply");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            
            _safeMint(to, tokenId);
            _initializeGamingAttributes(tokenId);
            
            emit TokenMinted(to, tokenId);
        }
    }
    
    function batchMint(address[] calldata recipients) public onlyOwner {
        require(totalSupply + recipients.length <= maxSupply, "Would exceed max supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            
            _safeMint(recipients[i], tokenId);
            _initializeGamingAttributes(tokenId);
            
            emit TokenMinted(recipients[i], tokenId);
        }
    }
    
    // Gaming features
    function addExperience(uint256 tokenId, uint256 exp) public onlyOwner tokenExists(tokenId) {
        tokenExperience[tokenId] += exp;
        
        uint256 currentLevel = tokenLevel[tokenId];
        uint256 newLevel = calculateLevel(tokenExperience[tokenId]);
        
        if (newLevel > currentLevel) {
            tokenLevel[tokenId] = newLevel;
            emit TokenLevelUp(tokenId, newLevel);
        }
    }
    
    function setTokenAttributes(uint256 tokenId, string calldata attributes) public onlyOwner tokenExists(tokenId) {
        tokenAttributes[tokenId] = attributes;
    }
    
    function calculateLevel(uint256 experience) public pure returns (uint256) {
        if (experience < 100) return 1;
        if (experience < 300) return 2;
        if (experience < 600) return 3;
        if (experience < 1000) return 4;
        if (experience < 1500) return 5;
        return 5 + (experience - 1500) / 500;
    }
    
    function getTokenInfo(uint256 tokenId) public view tokenExists(tokenId) returns (
        address tokenOwner,
        uint256 level,
        uint256 experience,
        string memory attributes
    ) {
        return (
            ownerOf(tokenId),
            tokenLevel[tokenId],
            tokenExperience[tokenId],
            tokenAttributes[tokenId]
        );
    }
    
    function getUserTokens(address user) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(user);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(user, i);
        }
        
        return tokenIds;
    }
    
    // Enumerable functions
    function tokenOfOwnerByIndex(address ownerAddr, uint256 index) public view returns (uint256) {
        require(index < balanceOf(ownerAddr), "ERC721Enumerable: owner index out of bounds");
        return _ownedTokens[ownerAddr][index];
    }
    
    function tokenByIndex(uint256 index) public view returns (uint256) {
        require(index < totalSupply, "ERC721Enumerable: global index out of bounds");
        return _allTokens[index];
    }
    
    // Admin functions
    function pause() public onlyOwner {
        paused = true;
        emit ContractPaused(true);
    }
    
    function unpause() public onlyOwner {
        paused = false;
        emit ContractPaused(false);
    }
    
    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }
    
    function setBaseURI(string calldata _baseURI) public onlyOwner {
        baseTokenURI = _baseURI;
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        owner = newOwner;
    }
    
    // Internal functions
    function _ownerOf(uint256 tokenId) internal view returns (address) {
        return _owners[tokenId];
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender);
    }
    
    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");
        
        _balances[to] += 1;
        _owners[tokenId] = to;
        totalSupply += 1;
        
        _addTokenToOwnerEnumeration(to, tokenId);
        _addTokenToAllTokensEnumeration(tokenId);
        
        emit Transfer(address(0), to, tokenId);
    }
    
    function _safeMint(address to, uint256 tokenId) internal {
        _mint(to, tokenId);
        require(_checkOnERC721Received(address(0), to, tokenId, ""), "ERC721: transfer to non ERC721Receiver implementer");
    }
    
    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");
        
        _approve(address(0), tokenId);
        
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        _removeTokenFromOwnerEnumeration(from, tokenId);
        _addTokenToOwnerEnumeration(to, tokenId);
        
        emit Transfer(from, to, tokenId);
    }
    
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "ERC721: transfer to non ERC721Receiver implementer");
    }
    
    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }
    
    function _initializeGamingAttributes(uint256 tokenId) internal {
        tokenLevel[tokenId] = 1;
        tokenExperience[tokenId] = 0;
    }
    
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        uint256 length = balanceOf(to);
        _ownedTokens[to][length] = tokenId;
        _ownedTokensIndex[tokenId] = length;
    }
    
    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }
    
    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 lastTokenIndex = balanceOf(from) - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];
        
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }
        
        delete _ownedTokensIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];
    }
    
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
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
    
    // ERC165
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC165 Interface ID for ERC165
            interfaceId == 0x80ac58cd || // ERC165 Interface ID for ERC721
            interfaceId == 0x5b5e139f || // ERC165 Interface ID for ERC721Metadata
            interfaceId == 0x780e9d63;   // ERC165 Interface ID for ERC721Enumerable
    }
}

// Required interfaces
interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

// String utility library (simplified)
library Strings {
    function toString(uint256 value) internal pure returns (string memory) {
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
}
`;

      const input = {
        language: 'Solidity',
        sources: {
          [`${name}NFT.sol`]: {
            content: contractSource,
          },
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode'],
            },
          },
        },
      };

      const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
      
      if (compiled.errors) {
        const hasErrors = compiled.errors.some(error => error.severity === 'error');
        if (hasErrors) {
          throw new Error('NFT compilation errors: ' + compiled.errors.map(e => e.message).join('\n'));
        }
      }

      const contractName = `${name.replace(/[^a-zA-Z0-9]/g, '')}NFT`;
      const contract = compiled.contracts[`${contractName}.sol`][contractName];
      
      return {
        abi: contract.abi,
        bytecode: '0x' + contract.evm.bytecode.object,
        contractName
      };

    } catch (error) {
      throw new Error(`OpenZeppelin NFT compilation failed: ${error.message}`);
    }
  }

  /**
   * Get simplified OpenZeppelin ERC-721 ABI
   */
  static getOpenZeppelinERC721ABI() {
    return [
      // Standard ERC-721 functions
      {
        "inputs": [],
        "name": "name",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol", 
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "maxSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "tokenURI",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "ownerOf",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "to", "type": "address"}],
        "name": "mint",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "quantity", "type": "uint256"}],
        "name": "ownerMint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address[]", "name": "recipients", "type": "address[]"}],
        "name": "batchMint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      // Gaming features
      {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}, {"internalType": "uint256", "name": "exp", "type": "uint256"}],
        "name": "addExperience",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}, {"internalType": "string", "name": "attributes", "type": "string"}],
        "name": "setTokenAttributes",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "getTokenInfo",
        "outputs": [
          {"internalType": "address", "name": "owner", "type": "address"},
          {"internalType": "uint256", "name": "level", "type": "uint256"},
          {"internalType": "uint256", "name": "experience", "type": "uint256"},
          {"internalType": "string", "name": "attributes", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "getUserTokens",
        "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
      },
      // Admin functions
      {
        "inputs": [],
        "name": "pause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "unpause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      // Events
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
          {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
        ],
        "name": "TokenMinted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "newLevel", "type": "uint256"}
        ],
        "name": "TokenLevelUp",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
          {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
          {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
        ],
        "name": "Transfer",
        "type": "event"
      }
    ];
  }
}