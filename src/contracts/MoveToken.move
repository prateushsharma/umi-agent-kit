module token_creator::coin {
    use std::signer;
    use std::string::{Self, String};
    use std::option;
    use aptos_framework::coin::{Self, Coin, MintCapability, BurnCapability};
    use aptos_framework::account;

    /// Error codes
    const E_NOT_OWNER: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_ALREADY_INITIALIZED: u64 = 3;

    /// Token metadata struct
    struct TokenInfo<phantom CoinType> has key {
        name: String,
        symbol: String,
        decimals: u8,
        mint_cap: MintCapability<CoinType>,
        burn_cap: BurnCapability<CoinType>,
        owner: address,
    }

    /// Initialize a new token
    public entry fun initialize_token<CoinType>(
        account: &signer,
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        monitor_supply: bool,
    ) {
        let account_addr = signer::address_of(account);
        
        // Ensure token hasn't been initialized yet
        assert!(!exists<TokenInfo<CoinType>>(account_addr), E_ALREADY_INITIALIZED);

        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<CoinType>(
            account,
            string::utf8(name),
            string::utf8(symbol),
            decimals,
            monitor_supply,
        );

        // Destroy freeze capability as we don't need it
        coin::destroy_freeze_cap(freeze_cap);

        // Store token info
        move_to(account, TokenInfo<CoinType> {
            name: string::utf8(name),
            symbol: string::utf8(symbol),
            decimals,
            mint_cap,
            burn_cap,
            owner: account_addr,
        });
    }

    /// Mint tokens to a specific address
    public entry fun mint<CoinType>(
        owner: &signer,
        to: address,
        amount: u64,
    ) acquires TokenInfo {
        let owner_addr = signer::address_of(owner);
        let token_info = borrow_global<TokenInfo<CoinType>>(owner_addr);
        
        // Only owner can mint
        assert!(owner_addr == token_info.owner, E_NOT_OWNER);

        let coins = coin::mint<CoinType>(amount, &token_info.mint_cap);
        coin::deposit<CoinType>(to, coins);
    }

    /// Burn tokens from sender's account
    public entry fun burn<CoinType>(
        account: &signer,
        amount: u64,
    ) acquires TokenInfo {
        let account_addr = signer::address_of(account);
        
        // Get token info from owner's account (assuming same address for simplicity)
        let token_info = borrow_global<TokenInfo<CoinType>>(account_addr);
        
        let coins = coin::withdraw<CoinType>(account, amount);
        coin::burn<CoinType>(coins, &token_info.burn_cap);
    }

    /// Transfer tokens between accounts
    public entry fun transfer<CoinType>(
        from: &signer,
        to: address,
        amount: u64,
    ) {
        let coins = coin::withdraw<CoinType>(from, amount);
        coin::deposit<CoinType>(to, coins);
    }

    /// Get balance of an account
    public fun balance<CoinType>(account: address): u64 {
        coin::balance<CoinType>(account)
    }

    /// Get token metadata
    public fun get_token_info<CoinType>(owner: address): (String, String, u8) acquires TokenInfo {
        let token_info = borrow_global<TokenInfo<CoinType>>(owner);
        (token_info.name, token_info.symbol, token_info.decimals)
    }

    /// Check if address is token owner
    public fun is_owner<CoinType>(owner_addr: address, account: address): bool acquires TokenInfo {
        if (!exists<TokenInfo<CoinType>>(owner_addr)) {
            return false
        };
        let token_info = borrow_global<TokenInfo<CoinType>>(owner_addr);
        token_info.owner == account
    }

    /// Register account to receive tokens
    public entry fun register<CoinType>(account: &signer) {
        coin::register<CoinType>(account);
    }
}