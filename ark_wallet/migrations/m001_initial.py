"""
Initial database schema for Ark Wallet Extension
"""

async def m001_initial(db):
    """
    Initial tables for Ark Wallet
    """
    await db.execute(
        """
        CREATE TABLE ark_wallet.wallets (
            id TEXT PRIMARY KEY,
            user TEXT NOT NULL,
            wallet_name TEXT NOT NULL,
            network TEXT NOT NULL,
            encrypted_key TEXT NOT NULL,
            created_at TEXT NOT NULL,
            last_used TEXT,
            balance INTEGER NOT NULL DEFAULT 0
        );
        """
    )
    
    await db.execute(
        """
        CREATE INDEX idx_wallets_user ON ark_wallet.wallets (user);
        """
    )
    
    await db.execute(
        """
        CREATE TABLE ark_wallet.transactions (
            id TEXT PRIMARY KEY,
            wallet_id TEXT NOT NULL,
            tx_type TEXT NOT NULL,
            amount INTEGER NOT NULL,
            address TEXT,
            txid TEXT,
            status TEXT NOT NULL,
            network TEXT NOT NULL,
            created_at TEXT NOT NULL,
            confirmed_at TEXT,
            fee INTEGER,
            memo TEXT,
            FOREIGN KEY (wallet_id) REFERENCES ark_wallet.wallets(id) ON DELETE CASCADE
        );
        """
    )
    
    await db.execute(
        """
        CREATE INDEX idx_transactions_wallet ON ark_wallet.transactions (wallet_id);
        """
    )
    
    await db.execute(
        """
        CREATE INDEX idx_transactions_status ON ark_wallet.transactions (status);
        """
    )
    
    await db.execute(
        """
        CREATE TABLE ark_wallet.boltz_swaps (
            id TEXT PRIMARY KEY,
            wallet_id TEXT NOT NULL,
            swap_type TEXT NOT NULL,
            amount INTEGER NOT NULL,
            invoice TEXT,
            onchain_address TEXT,
            swap_id TEXT NOT NULL,
            status TEXT NOT NULL,
            timeout_block INTEGER,
            created_at TEXT NOT NULL,
            completed_at TEXT,
            refund_tx TEXT,
            FOREIGN KEY (wallet_id) REFERENCES ark_wallet.wallets(id) ON DELETE CASCADE
        );
        """
    )
    
    await db.execute(
        """
        CREATE INDEX idx_swaps_wallet ON ark_wallet.boltz_swaps (wallet_id);
        """
    )
    
    await db.execute(
        """
        CREATE INDEX idx_swaps_status ON ark_wallet.boltz_swaps (status);
        """
    )
    
    await db.execute(
        """
        CREATE INDEX idx_swaps_swap_id ON ark_wallet.boltz_swaps (swap_id);
        """
    )
