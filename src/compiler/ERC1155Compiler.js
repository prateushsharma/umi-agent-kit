// File: src/compiler/ERC1155Compiler.js
// Complete OpenZeppelin ERC1155 implementation with ALL contracts embedded

import solc from 'solc';

export class ERC1155Compiler {
  /**
   * Compile ERC1155 contract using OpenZeppelin (like TokenManager pattern)
   */
  static compileERC1155Contract(contractName, baseURI = "") {
    try {
      // OpenZeppelin-based ERC1155 contract
      const contractSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ${contractName.replace(/[^a-zA-Z0-9]/g, '')} is ERC1155, ERC1155Burnable, ERC1155Supply, Ownable, Pausable {
    using Strings for uint256;
    
    string public name;
    uint256 private _tokenIdCounter = 1;
    
    // Token info mappings
    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => uint256) public mintPrice;
    mapping(uint256 => string) public tokenMetadata;
    mapping(uint256 => bool) public tokenExists;
    
    event TokenCreated(uint256 indexed tokenId, uint256 maxSupply, uint256 mintPrice, string metadataURI);
    event TokenMinted(address indexed to, uint256 indexed tokenId, uint256 amount);
    event BatchTokenMinted(address indexed to, uint256[] tokenIds, uint256[] amounts);
    
    modifier tokenMustExist(uint256 tokenId) {
        require(tokenExists[tokenId], "Token does not exist");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _baseURI,
        address _owner
    ) ERC1155(_baseURI) Ownable(_owner) {
        name = _name;
    }
    
    /**
     * Create new token type
     */
    function createToken(
        string memory metadataURI,
        uint256 _maxSupply,
        uint256 _mintPrice
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        
        maxSupply[tokenId] = _maxSupply;
        mintPrice[tokenId] = _mintPrice;
        tokenMetadata[tokenId] = metadataURI;
        tokenExists[tokenId] = true;
        
        emit TokenCreated(tokenId, _maxSupply, _mintPrice, metadataURI);
        return tokenId;
    }
    
    /**
     * Public mint function (requires payment)
     */
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount
    ) external payable whenNotPaused tokenMustExist(tokenId) {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(
            totalSupply(tokenId) + amount <= maxSupply[tokenId],
            "Exceeds maximum supply"
        );
        require(
            msg.value >= mintPrice[tokenId] * amount,
            "Insufficient payment"
        );
        
        _mint(to, tokenId, amount, "");
        emit TokenMinted(to, tokenId, amount);
    }
    
    /**
     * Batch mint multiple token types (requires payment)
     */
    function batchMint(
        address to,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external payable whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(tokenIds.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalCost = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(tokenExists[tokenIds[i]], "Token does not exist");
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(
                totalSupply(tokenIds[i]) + amounts[i] <= maxSupply[tokenIds[i]],
                "Exceeds maximum supply"
            );
            totalCost += mintPrice[tokenIds[i]] * amounts[i];
        }
        
        require(msg.value >= totalCost, "Insufficient payment");
        
        _mintBatch(to, tokenIds, amounts, "");
        emit BatchTokenMinted(to, tokenIds, amounts);
    }
    
    /**
     * Admin mint (owner only, no payment required)
     */
    function adminMint(
        address to,
        uint256 tokenId,
        uint256 amount
    ) external onlyOwner tokenMustExist(tokenId) {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(
            totalSupply(tokenId) + amount <= maxSupply[tokenId],
            "Exceeds maximum supply"
        );
        
        _mint(to, tokenId, amount, "");
        emit TokenMinted(to, tokenId, amount);
    }
    
    /**
     * Admin batch mint (owner only, no payment required)
     */
    function adminBatchMint(
        address to,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(tokenIds.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(tokenExists[tokenIds[i]], "Token does not exist");
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(
                totalSupply(tokenIds[i]) + amounts[i] <= maxSupply[tokenIds[i]],
                "Exceeds maximum supply"
            );
        }
        
        _mintBatch(to, tokenIds, amounts, "");
        emit BatchTokenMinted(to, tokenIds, amounts);
    }
    
    /**
     * Get token URI (override to use custom metadata)
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(tokenExists[tokenId], "Token does not exist");
        
        string memory baseURI = super.uri(tokenId);
        return bytes(baseURI).length > 0
            ? string(abi.encodePacked(baseURI, tokenMetadata[tokenId]))
            : tokenMetadata[tokenId];
    }
    
    /**
     * Set base URI (owner only)
     */
    function setURI(string memory newURI) external onlyOwner {
        _setURI(newURI);
    }
    
    /**
     * Update token metadata (owner only)
     */
    function setTokenMetadata(uint256 tokenId, string memory newMetadata) 
        external onlyOwner tokenMustExist(tokenId) {
        tokenMetadata[tokenId] = newMetadata;
    }
    
    /**
     * Update token mint price (owner only)
     */
    function setTokenMintPrice(uint256 tokenId, uint256 newPrice) 
        external onlyOwner tokenMustExist(tokenId) {
        mintPrice[tokenId] = newPrice;
    }
    
    /**
     * Pause contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * Unpause contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * Withdraw contract balance (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * Get all tokens owned by address (helper function)
     */
    function getOwnedTokens(address ownerAddr) external view returns (
        uint256[] memory ownedTokenIds,
        uint256[] memory ownedAmounts
    ) {
        uint256 tokenCount = 0;
        
        // Count non-zero balances
        for (uint256 i = 1; i < _tokenIdCounter; i++) {
            if (balanceOf(ownerAddr, i) > 0) {
                tokenCount++;
            }
        }
        
        ownedTokenIds = new uint256[](tokenCount);
        ownedAmounts = new uint256[](tokenCount);
        
        uint256 index = 0;
        for (uint256 i = 1; i < _tokenIdCounter; i++) {
            uint256 balance = balanceOf(ownerAddr, i);
            if (balance > 0) {
                ownedTokenIds[index] = i;
                ownedAmounts[index] = balance;
                index++;
            }
        }
        
        return (ownedTokenIds, ownedAmounts);
    }
    
    /**
     * Override required by Solidity for multiple inheritance
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
    
    /**
     * Check if contract supports interface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`;

      const input = {
        language: 'Solidity',
        sources: {
          [`${contractName}.sol`]: {
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

      // Import OpenZeppelin contracts (FIXED PATHS)
      const findImports = (importPath) => {
        const contractsPath = {
          // Core ERC1155 contracts
          "@openzeppelin/contracts/token/ERC1155/ERC1155.sol": this.getOpenZeppelinContract('ERC1155'),
          "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol": this.getOpenZeppelinContract('ERC1155Burnable'),
          "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol": this.getOpenZeppelinContract('ERC1155Supply'),
          
          // Access control
          "@openzeppelin/contracts/access/Ownable.sol": this.getOpenZeppelinContract('Ownable'),
          
          // Security
          "@openzeppelin/contracts/security/Pausable.sol": this.getOpenZeppelinContract('Pausable'),
          
          // Utilities - FIXED PATHS
          "@openzeppelin/contracts/utils/Strings.sol": this.getOpenZeppelinContract('Strings'),
          "@openzeppelin/contracts/utils/Context.sol": this.getOpenZeppelinContract('Context'),
          "@openzeppelin/contracts/utils/introspection/ERC165.sol": this.getOpenZeppelinContract('ERC165'),
          
          // Interfaces - FIXED PATHS
          "@openzeppelin/contracts/token/ERC1155/IERC1155.sol": this.getOpenZeppelinContract('IERC1155'),
          "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol": this.getOpenZeppelinContract('IERC1155Receiver'),
          "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol": this.getOpenZeppelinContract('IERC1155MetadataURI'),
          "@openzeppelin/contracts/utils/introspection/IERC165.sol": this.getOpenZeppelinContract('IERC165'),
          
          // Math and other utilities
          "@openzeppelin/contracts/utils/math/Math.sol": this.getOpenZeppelinContract('Math'),
          "@openzeppelin/contracts/utils/Address.sol": this.getOpenZeppelinContract('Address'),
        };
        
        return contractsPath[importPath] 
          ? { contents: contractsPath[importPath] }
          : { error: 'File not found' };
      };

      const compiled = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
      
      if (compiled.errors) {
        const hasErrors = compiled.errors.some(error => error.severity === 'error');
        if (hasErrors) {
          throw new Error('OpenZeppelin ERC1155 compilation errors: ' + compiled.errors.map(e => e.message).join('\n'));
        }
      }

      const finalContractName = contractName.replace(/[^a-zA-Z0-9]/g, '');
      const contract = compiled.contracts[`${contractName}.sol`][finalContractName];
      
      return {
        success: true,
        contractName: finalContractName,
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
        source: contractSource,
        compiler: 'solc-openzeppelin'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        contractName: null,
        abi: null,
        bytecode: null
      };
    }
  }

  /**
   * Get ALL OpenZeppelin contract source code (COMPLETE LIBRARY)
   */
  static getOpenZeppelinContract(contractType) {
    const contracts = {
      
      // ===== CORE ERC1155 CONTRACTS =====
      
      'ERC1155': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC1155.sol";
import "./IERC1155Receiver.sol";
import "./extensions/IERC1155MetadataURI.sol";
import "../../utils/Context.sol";
import "../../utils/introspection/ERC165.sol";

contract ERC1155 is Context, ERC165, IERC1155, IERC1155MetadataURI {
    mapping(uint256 => mapping(address => uint256)) private _balances;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    string private _uri;
    
    constructor(string memory uri_) {
        _setURI(uri_);
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC1155).interfaceId ||
            interfaceId == type(IERC1155MetadataURI).interfaceId ||
            super.supportsInterface(interfaceId);
    }
    
    function uri(uint256) public view virtual override returns (string memory) {
        return _uri;
    }
    
    function balanceOf(address account, uint256 id) public view virtual override returns (uint256) {
        require(account != address(0), "ERC1155: address zero is not a valid owner");
        return _balances[id][account];
    }
    
    function balanceOfBatch(address[] memory accounts, uint256[] memory ids)
        public view virtual override returns (uint256[] memory) {
        require(accounts.length == ids.length, "ERC1155: accounts and ids length mismatch");
        
        uint256[] memory batchBalances = new uint256[](accounts.length);
        
        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }
        
        return batchBalances;
    }
    
    function setApprovalForAll(address operator, bool approved) public virtual override {
        _setApprovalForAll(_msgSender(), operator, approved);
    }
    
    function isApprovedForAll(address account, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[account][operator];
    }
    
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERC1155: caller is not token owner or approved"
        );
        _safeTransferFrom(from, to, id, amount, data);
    }
    
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERC1155: caller is not token owner or approved"
        );
        _safeBatchTransferFrom(from, to, ids, amounts, data);
    }
    
    function _safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual {
        require(to != address(0), "ERC1155: transfer to the zero address");
        
        address operator = _msgSender();
        uint256[] memory ids = _asSingletonArray(id);
        uint256[] memory amounts = _asSingletonArray(amount);
        
        _beforeTokenTransfer(operator, from, to, ids, amounts, data);
        
        uint256 fromBalance = _balances[id][from];
        require(fromBalance >= amount, "ERC1155: insufficient balance for transfer");
        unchecked {
            _balances[id][from] = fromBalance - amount;
        }
        _balances[id][to] += amount;
        
        emit TransferSingle(operator, from, to, id, amount);
        
        _afterTokenTransfer(operator, from, to, ids, amounts, data);
        
        _doSafeTransferAcceptanceCheck(operator, from, to, id, amount, data);
    }
    
    function _safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual {
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
        require(to != address(0), "ERC1155: transfer to the zero address");
        
        address operator = _msgSender();
        
        _beforeTokenTransfer(operator, from, to, ids, amounts, data);
        
        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];
            
            uint256 fromBalance = _balances[id][from];
            require(fromBalance >= amount, "ERC1155: insufficient balance for transfer");
            unchecked {
                _balances[id][from] = fromBalance - amount;
            }
            _balances[id][to] += amount;
        }
        
        emit TransferBatch(operator, from, to, ids, amounts);
        
        _afterTokenTransfer(operator, from, to, ids, amounts, data);
        
        _doSafeBatchTransferAcceptanceCheck(operator, from, to, ids, amounts, data);
    }
    
    function _setURI(string memory newuri) internal virtual {
        _uri = newuri;
    }
    
    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual {
        require(to != address(0), "ERC1155: mint to the zero address");
        
        address operator = _msgSender();
        uint256[] memory ids = _asSingletonArray(id);
        uint256[] memory amounts = _asSingletonArray(amount);
        
        _beforeTokenTransfer(operator, address(0), to, ids, amounts, data);
        
        _balances[id][to] += amount;
        emit TransferSingle(operator, address(0), to, id, amount);
        
        _afterTokenTransfer(operator, address(0), to, ids, amounts, data);
        
        _doSafeTransferAcceptanceCheck(operator, address(0), to, id, amount, data);
    }
    
    function _mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual {
        require(to != address(0), "ERC1155: mint to the zero address");
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
        
        address operator = _msgSender();
        
        _beforeTokenTransfer(operator, address(0), to, ids, amounts, data);
        
        for (uint256 i = 0; i < ids.length; i++) {
            _balances[ids[i]][to] += amounts[i];
        }
        
        emit TransferBatch(operator, address(0), to, ids, amounts);
        
        _afterTokenTransfer(operator, address(0), to, ids, amounts, data);
        
        _doSafeBatchTransferAcceptanceCheck(operator, address(0), to, ids, amounts, data);
    }
    
    function _burn(
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ERC1155: burn from the zero address");
        
        address operator = _msgSender();
        uint256[] memory ids = _asSingletonArray(id);
        uint256[] memory amounts = _asSingletonArray(amount);
        
        _beforeTokenTransfer(operator, from, address(0), ids, amounts, "");
        
        uint256 fromBalance = _balances[id][from];
        require(fromBalance >= amount, "ERC1155: burn amount exceeds balance");
        unchecked {
            _balances[id][from] = fromBalance - amount;
        }
        
        emit TransferSingle(operator, from, address(0), id, amount);
        
        _afterTokenTransfer(operator, from, address(0), ids, amounts, "");
    }
    
    function _burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal virtual {
        require(from != address(0), "ERC1155: burn from the zero address");
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
        
        address operator = _msgSender();
        
        _beforeTokenTransfer(operator, from, address(0), ids, amounts, "");
        
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];
            
            uint256 fromBalance = _balances[id][from];
            require(fromBalance >= amount, "ERC1155: burn amount exceeds balance");
            unchecked {
                _balances[id][from] = fromBalance - amount;
            }
        }
        
        emit TransferBatch(operator, from, address(0), ids, amounts);
        
        _afterTokenTransfer(operator, from, address(0), ids, amounts, "");
    }
    
    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual {
        require(owner != operator, "ERC1155: setting approval status for self");
        _operatorApprovals[owner][operator] = approved;
        emit ApprovalForAll(owner, operator, approved);
    }
    
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual {}
    
    function _afterTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual {}
    
    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        if (to.code.length > 0) {
            try IERC1155Receiver(to).onERC1155Received(operator, from, id, amount, data) returns (bytes4 response) {
                if (response != IERC1155Receiver.onERC1155Received.selector) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non-ERC1155Receiver implementer");
            }
        }
    }
    
    function _doSafeBatchTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) private {
        if (to.code.length > 0) {
            try IERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, amounts, data) returns (
                bytes4 response
            ) {
                if (response != IERC1155Receiver.onERC1155BatchReceived.selector) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non-ERC1155Receiver implementer");
            }
        }
    }
    
    function _asSingletonArray(uint256 element) private pure returns (uint256[] memory) {
        uint256[] memory array = new uint256[](1);
        array[0] = element;
        return array;
    }
}`,

      // ===== ERC1155 EXTENSIONS =====
      
      'ERC1155Burnable': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ERC1155.sol";

abstract contract ERC1155Burnable is ERC1155 {
    function burn(
        address account,
        uint256 id,
        uint256 value
    ) public virtual {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not token owner or approved"
        );
        
        _burn(account, id, value);
    }
    
    function burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory values
    ) public virtual {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not token owner or approved"
        );
        
        _burnBatch(account, ids, values);
    }
}`,

      'ERC1155Supply': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ERC1155.sol";

abstract contract ERC1155Supply is ERC1155 {
    mapping(uint256 => uint256) private _totalSupply;
    
    function totalSupply(uint256 id) public view virtual returns (uint256) {
        return _totalSupply[id];
    }
    
    function exists(uint256 id) public view virtual returns (bool) {
        return ERC1155Supply.totalSupply(id) > 0;
    }
    
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        
        if (from == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                _totalSupply[ids[i]] += amounts[i];
            }
        }
        
        if (to == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                uint256 id = ids[i];
                uint256 amount = amounts[i];
                uint256 supply = _totalSupply[id];
                require(supply >= amount, "ERC1155: burn amount exceeds totalSupply");
                unchecked {
                    _totalSupply[id] = supply - amount;
                }
            }
        }
    }
}`,

      // ===== ACCESS CONTROL =====
      
      'Ownable': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../utils/Context.sol";

abstract contract Ownable is Context {
    address private _owner;
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }
    
    modifier onlyOwner() {
        _checkOwner();
        _;
    }
    
    function owner() public view virtual returns (address) {
        return _owner;
    }
    
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }
    
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }
    
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }
    
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}`,

      // ===== SECURITY =====
      
      'Pausable': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../utils/Context.sol";

abstract contract Pausable is Context {
    event Paused(address account);
    event Unpaused(address account);
    
    bool private _paused;
    
    constructor() {
        _paused = false;
    }
    
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }
    
    modifier whenPaused() {
        _requirePaused();
        _;
    }
    
    function paused() public view virtual returns (bool) {
        return _paused;
    }
    
    function _requireNotPaused() internal view virtual {
        require(!paused(), "Pausable: paused");
    }
    
    function _requirePaused() internal view virtual {
        require(paused(), "Pausable: not paused");
    }
    
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }
    
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}`,

      // ===== UTILITIES =====
      
      'Context': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
    
    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}`,

      'Strings': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Strings {
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";
    uint8 private constant _ADDRESS_LENGTH = 20;
    
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
    
    function toHexString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0x00";
        }
        uint256 temp = value;
        uint256 length = 0;
        while (temp != 0) {
            length++;
            temp >>= 8;
        }
        return toHexString(value, length);
    }
    
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _HEX_SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }
    
    function toHexString(address addr) internal pure returns (string memory) {
        return toHexString(uint256(uint160(addr)), _ADDRESS_LENGTH);
    }
}`,

      'ERC165': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC165.sol";

abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}`,

      'Math': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Math {
    enum Rounding {
        Down,
        Up,
        Zero
    }
    
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a & b) + (a ^ b) / 2;
    }
    
    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        return a == 0 ? 0 : (a - 1) / b + 1;
    }
    
    function mulDiv(
        uint256 x,
        uint256 y,
        uint256 denominator
    ) internal pure returns (uint256 result) {
        unchecked {
            uint256 prod0;
            uint256 prod1;
            assembly {
                let mm := mulmod(x, y, not(0))
                prod0 := mul(x, y)
                prod1 := sub(sub(mm, prod0), lt(mm, prod0))
            }
            
            if (prod1 == 0) {
                return prod0 / denominator;
            }
            
            require(denominator > prod1);
            
            uint256 remainder;
            assembly {
                remainder := mulmod(x, y, denominator)
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
            }
            
            uint256 twos = denominator & (~denominator + 1);
            assembly {
                denominator := div(denominator, twos)
                prod0 := div(prod0, twos)
                twos := add(div(sub(0, twos), twos), 1)
            }
            
            prod0 |= prod1 * twos;
            
            uint256 inverse = (3 * denominator) ^ 2;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            
            result = prod0 * inverse;
            return result;
        }
    }
}`,

      'Address': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Address {
    function isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }
    
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");
        
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }
    
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, "Address: low-level call failed");
    }
    
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }
    
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }
    
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }
    
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }
    
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }
    
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }
    
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }
    
    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        if (success) {
            if (returndata.length == 0) {
                require(isContract(target), "Address: call to non-contract");
            }
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }
    
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }
    
    function _revert(bytes memory returndata, string memory errorMessage) private pure {
        if (returndata.length > 0) {
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert(errorMessage);
        }
    }
}`,

      // ===== INTERFACES =====
      
      'IERC1155': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../utils/introspection/IERC165.sol";

interface IERC1155 is IERC165 {
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);
    
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) external view returns (uint256[] memory);
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address account, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;
}`,

      'IERC1155Receiver': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../utils/introspection/IERC165.sol";

interface IERC1155Receiver is IERC165 {
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4);
    
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4);
}`,

      'IERC1155MetadataURI': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IERC1155.sol";

interface IERC1155MetadataURI is IERC1155 {
    function uri(uint256 id) external view returns (string memory);
}`,

      'IERC165': `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}`
    };
    
    return contracts[contractType] || '';
  }

  /**
   * Get OpenZeppelin ERC1155 ABI
   */
  static getOpenZeppelinERC1155ABI() {
    return [
      // Standard ERC1155 functions
      {
        "inputs": [],
        "name": "name",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
        "name": "uri",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {"internalType": "uint256", "name": "id", "type": "uint256"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address[]", "name": "accounts", "type": "address[]"}, {"internalType": "uint256[]", "name": "ids", "type": "uint256[]"}],
        "name": "balanceOfBatch",
        "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "operator", "type": "address"}, {"internalType": "bool", "name": "approved", "type": "bool"}],
        "name": "setApprovalForAll",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {"internalType": "address", "name": "operator", "type": "address"}],
        "name": "isApprovedForAll",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "id", "type": "uint256"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "bytes", "name": "data", "type": "bytes"}],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256[]", "name": "ids", "type": "uint256[]"}, {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}, {"internalType": "bytes", "name": "data", "type": "bytes"}],
        "name": "safeBatchTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      // Custom functions for token management
      {
        "inputs": [{"internalType": "string", "name": "metadataURI", "type": "string"}, {"internalType": "uint256", "name": "_maxSupply", "type": "uint256"}, {"internalType": "uint256", "name": "_mintPrice", "type": "uint256"}],
        "name": "createToken",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
        "name": "mint",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]"}, {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
        "name": "batchMint",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
        "name": "adminMint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]"}, {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
        "name": "adminBatchMint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "ownerAddr", "type": "address"}],
        "name": "getOwnedTokens",
        "outputs": [{"internalType": "uint256[]", "name": "ownedTokenIds", "type": "uint256[]"}, {"internalType": "uint256[]", "name": "ownedAmounts", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
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
      {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {"internalType": "uint256", "name": "id", "type": "uint256"}, {"internalType": "uint256", "name": "value", "type": "uint256"}],
        "name": "burn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {"internalType": "uint256[]", "name": "ids", "type": "uint256[]"}, {"internalType": "uint256[]", "name": "values", "type": "uint256[]"}],
        "name": "burnBatch",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
  }
}