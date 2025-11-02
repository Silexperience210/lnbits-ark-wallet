"""
CRUD operations for Ark Wallet Extension
"""
from typing import Optional, List
from lnbits.db import Database
from lnbits.helpers import urlsafe_short_hash
from datetime import datetime

from .models import (
    ArkWallet,
    ArkTransaction,
    BoltzSwap,
    CreateWallet,
    SendArk,
    CreateSwap
)

db = Database("ext_ark_wallet")


# ==================== WALLET CRUD ====================

async def create_ark_wallet(user: str, data: CreateWallet) -> ArkWallet:
    """Create a new Ark wallet"""
    wallet_id = urlsafe_short_hash()
    now = datetime.now()
    
    wallet = ArkWallet(
        id=wallet_id,
        user=user,
        wallet_name=data.wallet_name,
        network=data.network,
        encrypted_key=data.encrypted_key,
        created_at=now,
        balance=0
    )
    
    await db.execute(
        """
        INSERT INTO ark_wallet.wallets 
        (id, user, wallet_name, network, encrypted_key, created_at, balance)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            wallet.id,
            wallet.user,
            wallet.wallet_name,
            wallet.network,
            wallet.encrypted_key,
            wallet.created_at.isoformat(),
            wallet.balance
        )
    )
    
    return wallet


async def get_ark_wallet(wallet_id: str) -> Optional[ArkWallet]:
    """Get an Ark wallet by ID"""
    row = await db.fetchone(
        "SELECT * FROM ark_wallet.wallets WHERE id = ?",
        (wallet_id,)
    )
    return ArkWallet(**row) if row else None


async def get_user_wallets(user: str) -> List[ArkWallet]:
    """Get all wallets for a user"""
    rows = await db.fetchall(
        "SELECT * FROM ark_wallet.wallets WHERE user = ? ORDER BY created_at DESC",
        (user,)
    )
    return [ArkWallet(**row) for row in rows]


async def update_wallet_balance(wallet_id: str, balance: int) -> None:
    """Update wallet balance"""
    await db.execute(
        """
        UPDATE ark_wallet.wallets 
        SET balance = ?, last_used = ?
        WHERE id = ?
        """,
        (balance, datetime.now().isoformat(), wallet_id)
    )


async def delete_ark_wallet(wallet_id: str) -> None:
    """Delete an Ark wallet"""
    await db.execute(
        "DELETE FROM ark_wallet.wallets WHERE id = ?",
        (wallet_id,)
    )


# ==================== TRANSACTION CRUD ====================

async def create_transaction(
    wallet_id: str,
    tx_type: str,
    amount: int,
    address: Optional[str] = None,
    memo: Optional[str] = None,
    network: str = "mutinynet"
) -> ArkTransaction:
    """Create a new transaction record"""
    tx_id = urlsafe_short_hash()
    now = datetime.now()
    
    transaction = ArkTransaction(
        id=tx_id,
        wallet_id=wallet_id,
        tx_type=tx_type,
        amount=amount,
        address=address,
        status="pending",
        network=network,
        created_at=now,
        memo=memo
    )
    
    await db.execute(
        """
        INSERT INTO ark_wallet.transactions 
        (id, wallet_id, tx_type, amount, address, status, network, created_at, memo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            transaction.id,
            transaction.wallet_id,
            transaction.tx_type,
            transaction.amount,
            transaction.address,
            transaction.status,
            transaction.network,
            transaction.created_at.isoformat(),
            transaction.memo
        )
    )
    
    return transaction


async def get_transaction(tx_id: str) -> Optional[ArkTransaction]:
    """Get a transaction by ID"""
    row = await db.fetchone(
        "SELECT * FROM ark_wallet.transactions WHERE id = ?",
        (tx_id,)
    )
    return ArkTransaction(**row) if row else None


async def get_wallet_transactions(wallet_id: str, limit: int = 50) -> List[ArkTransaction]:
    """Get transactions for a wallet"""
    rows = await db.fetchall(
        """
        SELECT * FROM ark_wallet.transactions 
        WHERE wallet_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
        """,
        (wallet_id, limit)
    )
    return [ArkTransaction(**row) for row in rows]


async def update_transaction_status(
    tx_id: str,
    status: str,
    txid: Optional[str] = None,
    fee: Optional[int] = None
) -> None:
    """Update transaction status"""
    confirmed_at = datetime.now().isoformat() if status == "confirmed" else None
    
    await db.execute(
        """
        UPDATE ark_wallet.transactions 
        SET status = ?, txid = ?, fee = ?, confirmed_at = ?
        WHERE id = ?
        """,
        (status, txid, fee, confirmed_at, tx_id)
    )


# ==================== BOLTZ SWAP CRUD ====================

async def create_boltz_swap(data: CreateSwap) -> BoltzSwap:
    """Create a new Boltz swap record"""
    swap_id = urlsafe_short_hash()
    now = datetime.now()
    
    swap = BoltzSwap(
        id=swap_id,
        wallet_id=data.wallet_id,
        swap_type=data.swap_type,
        amount=data.amount,
        invoice=data.invoice,
        onchain_address=data.onchain_address,
        swap_id="",  # Will be updated with Boltz ID
        status="pending",
        created_at=now
    )
    
    await db.execute(
        """
        INSERT INTO ark_wallet.boltz_swaps 
        (id, wallet_id, swap_type, amount, invoice, onchain_address, swap_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            swap.id,
            swap.wallet_id,
            swap.swap_type,
            swap.amount,
            swap.invoice,
            swap.onchain_address,
            swap.swap_id,
            swap.status,
            swap.created_at.isoformat()
        )
    )
    
    return swap


async def get_boltz_swap(swap_id: str) -> Optional[BoltzSwap]:
    """Get a Boltz swap by ID"""
    row = await db.fetchone(
        "SELECT * FROM ark_wallet.boltz_swaps WHERE id = ? OR swap_id = ?",
        (swap_id, swap_id)
    )
    return BoltzSwap(**row) if row else None


async def get_wallet_swaps(wallet_id: str, limit: int = 50) -> List[BoltzSwap]:
    """Get swaps for a wallet"""
    rows = await db.fetchall(
        """
        SELECT * FROM ark_wallet.boltz_swaps 
        WHERE wallet_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
        """,
        (wallet_id, limit)
    )
    return [BoltzSwap(**row) for row in rows]


async def update_boltz_swap(
    swap_id: str,
    status: str,
    boltz_swap_id: Optional[str] = None,
    timeout_block: Optional[int] = None,
    refund_tx: Optional[str] = None
) -> None:
    """Update Boltz swap status"""
    completed_at = datetime.now().isoformat() if status in ["completed", "failed", "refunded"] else None
    
    updates = ["status = ?", "completed_at = ?"]
    params = [status, completed_at]
    
    if boltz_swap_id:
        updates.append("swap_id = ?")
        params.append(boltz_swap_id)
    if timeout_block:
        updates.append("timeout_block = ?")
        params.append(timeout_block)
    if refund_tx:
        updates.append("refund_tx = ?")
        params.append(refund_tx)
    
    params.append(swap_id)
    
    await db.execute(
        f"""
        UPDATE ark_wallet.boltz_swaps 
        SET {', '.join(updates)}
        WHERE id = ?
        """,
        tuple(params)
    )
