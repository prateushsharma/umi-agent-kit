
export class MoveNFTCompiler {
  
  /**
   * Generate Move NFT collection contract
   */
  static generateMoveNFTCollection(name, symbol, description, maxSupply = 10000) {
    const moduleName = `${name.toLowerCase()}_nft`;
    const structName = `${name}NFT`;
    
    return `
module DEPLOYER_ADDRESS::${moduleName} {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_token_objects::collection;
    use aptos_token_objects::token;
    use aptos_token_objects::royalty;
    use aptos_token_objects::property_map;

    /// Collection information
    struct CollectionConfig has key {
        name: String,
        symbol: String,
        description: String,
        max_supply: u64,
        minted_count: u64,
        base_uri: String,
        royalty_numerator: u64,
        royalty_denominator: u64,
    }

    /// Individual NFT data
    struct ${structName} has key {
        token_id: u64,
        name: String,
        description: String,
        image_uri: String,
        attributes: vector<Attribute>,
        level: u64,
        experience: u64,
        rarity: String,
    }

    /// NFT attribute structure
    struct Attribute has store, copy, drop {
        trait_type: String,
        value: String,
    }

    /// Events
    #[event]
    struct CollectionCreated has drop, store {
        creator: address,
        collection_name: String,
        max_supply: u64,
        timestamp: u64,
    }

    #[event]
    struct NFTMinted has drop, store {
        creator: address,
        recipient: address,
        token_id: u64,
        name: String,
        timestamp: u64,
    }

    #[event]
    struct NFTTransferred has drop, store {
        from: address,
        to: address,
        token_id: u64,
        timestamp: u64,
    }

    /// Error codes
    const ECOLLECTION_ALREADY_EXISTS: u64 = 1;
    const ECOLLECTION_NOT_FOUND: u64 = 2;
    const EMAX_SUPPLY_REACHED: u64 = 3;
    const ENFT_NOT_FOUND: u64 = 4;
    const ENOT_OWNER: u64 = 5;
    const EINVALID_PARAMETERS: u64 = 6;

    /// Initialize NFT collection
    public entry fun create_collection(
        creator: &signer,
        name: String,
        symbol: String,
        description: String,
        max_supply: u64,
        base_uri: String,
        royalty_numerator: u64,
        royalty_denominator: u64,
    ) {
        let creator_addr = signer::address_of(creator);
        
        // Ensure collection doesn't already exist
        assert!(!exists<CollectionConfig>(creator_addr), ECOLLECTION_ALREADY_EXISTS);
        
        // Create the collection
        let collection_config = CollectionConfig {
            name,
            symbol,
            description,
            max_supply,
            minted_count: 0,
            base_uri,
            royalty_numerator,
            royalty_denominator,
        };
        
        move_to(creator, collection_config);
        
        // Emit collection created event
        event::emit(CollectionCreated {
            creator: creator_addr,
            collection_name: name,
            max_supply,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Mint NFT to recipient
    public entry fun mint_nft(
        creator: &signer,
        recipient: address,
        token_id: u64,
        name: String,
        description: String,
        image_uri: String,
        attributes: vector<Attribute>,
        level: u64,
        rarity: String,
    ) acquires CollectionConfig {
        let creator_addr = signer::address_of(creator);
        
        // Ensure collection exists
        assert!(exists<CollectionConfig>(creator_addr), ECOLLECTION_NOT_FOUND);
        
        let collection_config = borrow_global_mut<CollectionConfig>(creator_addr);
        
        // Check max supply
        assert!(collection_config.minted_count < collection_config.max_supply, EMAX_SUPPLY_REACHED);
        
        // Create NFT
        let nft = ${structName} {
            token_id,
            name,
            description,
            image_uri,
            attributes,
            level,
            experience: 0,
            rarity,
        };
        
        // Move NFT to recipient (simplified - in production you'd use proper token objects)
        move_to(&account::create_signer_with_capability(&account::create_test_signer_cap(recipient)), nft);
        
        // Update minted count
        collection_config.minted_count = collection_config.minted_count + 1;
        
        // Emit mint event
        event::emit(NFTMinted {
            creator: creator_addr,
            recipient,
            token_id,
            name,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Batch mint NFTs
    public entry fun batch_mint_nfts(
        creator: &signer,
        recipients: vector<address>,
        token_ids: vector<u64>,
        names: vector<String>,
        descriptions: vector<String>,
        image_uris: vector<String>,
        rarities: vector<String>,
    ) acquires CollectionConfig {
        let length = vector::length(&recipients);
        assert!(
            length == vector::length(&token_ids) &&
            length == vector::length(&names) &&
            length == vector::length(&descriptions) &&
            length == vector::length(&image_uris) &&
            length == vector::length(&rarities),
            EINVALID_PARAMETERS
        );

        let i = 0;
        while (i < length) {
            let recipient = *vector::borrow(&recipients, i);
            let token_id = *vector::borrow(&token_ids, i);
            let name = *vector::borrow(&names, i);
            let description = *vector::borrow(&descriptions, i);
            let image_uri = *vector::borrow(&image_uris, i);
            let rarity = *vector::borrow(&rarities, i);
            
            // Create basic attributes
            let attributes = vector::empty<Attribute>();
            vector::push_back(&mut attributes, Attribute {
                trait_type: string::utf8(b"Rarity"),
                value: rarity,
            });
            
            mint_nft(
                creator,
                recipient,
                token_id,
                name,
                description,
                image_uri,
                attributes,
                1, // Default level
                rarity,
            );
            
            i = i + 1;
        };
    }

    /// Transfer NFT (simplified)
    public entry fun transfer_nft(
        from: &signer,
        to: address,
        token_id: u64,
    ) acquires ${structName} {
        let from_addr = signer::address_of(from);
        
        // Check if NFT exists and is owned by sender
        assert!(exists<${structName}>(from_addr), ENFT_NOT_FOUND);
        
        // Move NFT from sender to recipient
        let nft = move_from<${structName}>(from_addr);
        move_to(&account::create_signer_with_capability(&account::create_test_signer_cap(to)), nft);
        
        // Emit transfer event
        event::emit(NFTTransferred {
            from: from_addr,
            to,
            token_id,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Upgrade NFT (gaming feature)
    public entry fun upgrade_nft(
        owner: &signer,
        token_id: u64,
        experience_gained: u64,
    ) acquires ${structName} {
        let owner_addr = signer::address_of(owner);
        
        assert!(exists<${structName}>(owner_addr), ENFT_NOT_FOUND);
        
        let nft = borrow_global_mut<${structName}>(owner_addr);
        assert!(nft.token_id == token_id, ENFT_NOT_FOUND);
        
        // Add experience
        nft.experience = nft.experience + experience_gained;
        
        // Level up logic (every 100 experience = 1 level)
        let new_level = nft.experience / 100;
        if (new_level > nft.level) {
            nft.level = new_level;
        };
    }

    /// Add attribute to NFT
    public entry fun add_attribute(
        owner: &signer,
        token_id: u64,
        trait_type: String,
        value: String,
    ) acquires ${structName} {
        let owner_addr = signer::address_of(owner);
        
        assert!(exists<${structName}>(owner_addr), ENFT_NOT_FOUND);
        
        let nft = borrow_global_mut<${structName}>(owner_addr);
        assert!(nft.token_id == token_id, ENFT_NOT_FOUND);
        
        let new_attribute = Attribute {
            trait_type,
            value,
        };
        
        vector::push_back(&mut nft.attributes, new_attribute);
    }

    // ========== VIEW FUNCTIONS ==========

    /// Get collection info
    #[view]
    public fun get_collection_info(creator: address): (String, String, String, u64, u64) acquires CollectionConfig {
        assert!(exists<CollectionConfig>(creator), ECOLLECTION_NOT_FOUND);
        
        let config = borrow_global<CollectionConfig>(creator);
        (
            config.name,
            config.symbol, 
            config.description,
            config.max_supply,
            config.minted_count
        )
    }

    /// Get NFT info
    #[view]
    public fun get_nft_info(owner: address): (u64, String, String, String, u64, u64, String) acquires ${structName} {
        assert!(exists<${structName}>(owner), ENFT_NOT_FOUND);
        
        let nft = borrow_global<${structName}>(owner);
        (
            nft.token_id,
            nft.name,
            nft.description,
            nft.image_uri,
            nft.level,
            nft.experience,
            nft.rarity
        )
    }

    /// Get NFT attributes
    #[view]
    public fun get_nft_attributes(owner: address): vector<Attribute> acquires ${structName} {
        assert!(exists<${structName}>(owner), ENFT_NOT_FOUND);
        
        let nft = borrow_global<${structName}>(owner);
        nft.attributes
    }

    /// Check if address owns NFT
    #[view]
    public fun owns_nft(owner: address): bool {
        exists<${structName}>(owner)
    }

    /// Get collection minted count
    #[view]
    public fun get_minted_count(creator: address): u64 acquires CollectionConfig {
        assert!(exists<CollectionConfig>(creator), ECOLLECTION_NOT_FOUND);
        
        let config = borrow_global<CollectionConfig>(creator);
        config.minted_count
    }
}`;
  }

  /**
   * Generate gaming-specific Move NFT contract
   */
  static generateGamingMoveNFT(name, symbol, categories = []) {
    const moduleName = `${name.toLowerCase()}_gaming`;
    const structName = `${name}Asset`;
    
    // Default categories if none provided
    const gameCategories = categories.length > 0 ? categories : ['weapon', 'armor', 'accessory', 'consumable'];
    
    return `
module DEPLOYER_ADDRESS::${moduleName} {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// Game asset categories
    const CATEGORY_WEAPON: u8 = 1;
    const CATEGORY_ARMOR: u8 = 2;
    const CATEGORY_ACCESSORY: u8 = 3;
    const CATEGORY_CONSUMABLE: u8 = 4;

    /// Rarity levels
    const RARITY_COMMON: u8 = 1;
    const RARITY_RARE: u8 = 2;
    const RARITY_EPIC: u8 = 3;
    const RARITY_LEGENDARY: u8 = 4;

    /// Game asset structure
    struct ${structName} has key {
        token_id: u64,
        name: String,
        description: String,
        category: u8,
        rarity: u8,
        level: u64,
        experience: u64,
        attack: u64,
        defense: u64,
        speed: u64,
        durability: u64,
        max_durability: u64,
        is_tradeable: bool,
        equipped_by: Option<address>,
        created_at: u64,
    }

    /// Gaming collection config
    struct GamingCollectionConfig has key {
        name: String,
        symbol: String,
        max_supply: u64,
        minted_count: u64,
        base_experience_per_level: u64,
        max_level: u64,
    }

    /// Events
    #[event]
    struct AssetMinted has drop, store {
        recipient: address,
        token_id: u64,
        category: u8,
        rarity: u8,
        attack: u64,
        defense: u64,
    }

    #[event]
    struct AssetUpgraded has drop, store {
        owner: address,
        token_id: u64,
        old_level: u64,
        new_level: u64,
    }

    #[event]
    struct AssetEquipped has drop, store {
        owner: address,
        equipped_by: address,
        token_id: u64,
    }

    /// Error codes
    const ECOLLECTION_NOT_FOUND: u64 = 1;
    const EASSET_NOT_FOUND: u64 = 2;
    const EMAX_LEVEL_REACHED: u64 = 3;
    const ENOT_TRADEABLE: u64 = 4;
    const EASSET_EQUIPPED: u64 = 5;

    /// Create gaming collection
    public entry fun create_gaming_collection(
        creator: &signer,
        name: String,
        symbol: String,
        max_supply: u64,
        base_experience_per_level: u64,
        max_level: u64,
    ) {
        let creator_addr = signer::address_of(creator);
        
        let config = GamingCollectionConfig {
            name,
            symbol,
            max_supply,
            minted_count: 0,
            base_experience_per_level,
            max_level,
        };
        
        move_to(creator, config);
    }

    /// Mint gaming asset
    public entry fun mint_gaming_asset(
        creator: &signer,
        recipient: address,
        token_id: u64,
        name: String,
        description: String,
        category: u8,
        rarity: u8,
        attack: u64,
        defense: u64,
        speed: u64,
        durability: u64,
    ) acquires GamingCollectionConfig {
        let creator_addr = signer::address_of(creator);
        
        assert!(exists<GamingCollectionConfig>(creator_addr), ECOLLECTION_NOT_FOUND);
        
        let config = borrow_global_mut<GamingCollectionConfig>(creator_addr);
        
        let asset = ${structName} {
            token_id,
            name,
            description,
            category,
            rarity,
            level: 1,
            experience: 0,
            attack,
            defense,
            speed,
            durability,
            max_durability: durability,
            is_tradeable: true,
            equipped_by: option::none(),
            created_at: timestamp::now_seconds(),
        };
        
        move_to(&account::create_signer_with_capability(&account::create_test_signer_cap(recipient)), asset);
        
        config.minted_count = config.minted_count + 1;
        
        event::emit(AssetMinted {
            recipient,
            token_id,
            category,
            rarity,
            attack,
            defense,
        });
    }

    /// Level up asset
    public entry fun level_up_asset(
        owner: &signer,
        token_id: u64,
        experience_gained: u64,
    ) acquires ${structName}, GamingCollectionConfig {
        let owner_addr = signer::address_of(owner);
        
        assert!(exists<${structName}>(owner_addr), EASSET_NOT_FOUND);
        
        let asset = borrow_global_mut<${structName}>(owner_addr);
        assert!(asset.token_id == token_id, EASSET_NOT_FOUND);
        
        let old_level = asset.level;
        asset.experience = asset.experience + experience_gained;
        
        // Calculate new level based on experience
        let new_level = (asset.experience / 1000) + 1; // 1000 exp per level
        
        if (new_level > asset.level) {
            asset.level = new_level;
            
            // Boost stats on level up
            asset.attack = asset.attack + (new_level - old_level) * 5;
            asset.defense = asset.defense + (new_level - old_level) * 3;
            asset.speed = asset.speed + (new_level - old_level) * 2;
            
            event::emit(AssetUpgraded {
                owner: owner_addr,
                token_id,
                old_level,
                new_level,
            });
        };
    }

    /// Equip asset to character
    public entry fun equip_asset(
        owner: &signer,
        token_id: u64,
        character_address: address,
    ) acquires ${structName} {
        let owner_addr = signer::address_of(owner);
        
        assert!(exists<${structName}>(owner_addr), EASSET_NOT_FOUND);
        
        let asset = borrow_global_mut<${structName}>(owner_addr);
        assert!(asset.token_id == token_id, EASSET_NOT_FOUND);
        
        asset.equipped_by = option::some(character_address);
        
        event::emit(AssetEquipped {
            owner: owner_addr,
            equipped_by: character_address,
            token_id,
        });
    }

    /// Repair asset (restore durability)
    public entry fun repair_asset(
        owner: &signer,
        token_id: u64,
        repair_amount: u64,
    ) acquires ${structName} {
        let owner_addr = signer::address_of(owner);
        
        assert!(exists<${structName}>(owner_addr), EASSET_NOT_FOUND);
        
        let asset = borrow_global_mut<${structName}>(owner_addr);
        assert!(asset.token_id == token_id, EASSET_NOT_FOUND);
        
        let new_durability = asset.durability + repair_amount;
        if (new_durability > asset.max_durability) {
            asset.durability = asset.max_durability;
        } else {
            asset.durability = new_durability;
        };
    }

    // ========== VIEW FUNCTIONS ==========

    /// Get asset stats
    #[view]
    public fun get_asset_stats(owner: address): (u64, u64, u64, u64, u64, u64) acquires ${structName} {
        assert!(exists<${structName}>(owner), EASSET_NOT_FOUND);
        
        let asset = borrow_global<${structName}>(owner);
        (
            asset.level,
            asset.experience,
            asset.attack,
            asset.defense,
            asset.speed,
            asset.durability
        )
    }

    /// Get asset info
    #[view]
    public fun get_asset_info(owner: address): (u64, String, u8, u8, bool) acquires ${structName} {
        assert!(exists<${structName}>(owner), EASSET_NOT_FOUND);
        
        let asset = borrow_global<${structName}>(owner);
        (
            asset.token_id,
            asset.name,
            asset.category,
            asset.rarity,
            asset.is_tradeable
        )
    }
}`;
  }

  /**
   * Get the module address placeholder that needs to be replaced
   */
  static getAddressPlaceholder() {
    return 'DEPLOYER_ADDRESS';
  }

  /**
   * Replace address placeholder with actual address
   */
  static replaceAddress(contractSource, deployerAddress) {
    // Convert ETH address to Move address format
    const moveAddress = deployerAddress.replace('0x', '0x000000000000000000000000');
    return contractSource.replace(/DEPLOYER_ADDRESS/g, moveAddress);
  }

  /**
   * Generate Move.toml file content
   */
  static generateMoveToml(packageName, deployerAddress) {
    const moveAddress = deployerAddress.replace('0x', '0x000000000000000000000000');
    
    return `[package]
name = "${packageName}"
version = "1.0.0"
authors = []

[addresses]
DEPLOYER_ADDRESS = "${moveAddress}"

[dependencies.AptosFramework]
git = "https://github.com/aptos-labs/aptos-framework.git"
rev = "aptos-release-v1.27"
subdir = "aptos-framework"

[dependencies.AptosTokenObjects]
git = "https://github.com/aptos-labs/aptos-framework.git"
rev = "aptos-release-v1.27"
subdir = "aptos-token-objects"`;
  }
}