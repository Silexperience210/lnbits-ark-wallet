"""
API Views for Ark Wallet Extension
"""
from fastapi import Depends, HTTPException, Query
from lnbits.core.models import User, WalletTypeInfo
from lnbits.decorators import require_admin_key, require_invoice_key
from typing import List

from . import ark_wallet_ext
from .crud import *
from .models import *


# ==================== CONFIGURATION ====================

@ark_wallet_ext.get("/api/config")
async def get_config():
    """Get wallet configuration"""
    return {
        "networks": {
            "mainnet": {
                "arkServerUrl": "https://mainnet.arklabs.to",
                "boltzApiUrl": "https://api.boltz.exchange",
                "enabled": True
            },
            "testnet": {
                "arkServerUrl": "https://testnet.arklabs.to",
                "boltzApiUrl": "https://api.testnet.boltz.exchange",
                "enabled": True
            },
            "mutinynet": {
                "arkServerUrl": "https://master.mutinynet.arklabs.to",
                "boltzApiUrl": "https://api.testnet.boltz.exchange",
                "enabled": True
            }
        },
        "limits": {
            "minSwapAmount": 100000,  # 100k sats
            "maxSwapAmount": 25000000,  # 25M sats
            "minOnboard": 50000  # 50k sats
        },
        "fees": {
            "estimatedSwapFee": 0.005,  # 0.5%
            "minerFee": "dynamic"
        },
        "features": {
            "ark": True,
            "lightning": True,
            "boltzSwaps": True,
            "encryption": "AES-256-GCM",
            "vtxo": True,
            "onboard": True,
            "offboard": True
        }
    }


# ==================== WALLET ENDPOINTS ====================

@ark_wallet_ext.post("/api/wallets")
async def create_wallet(
    data: CreateWallet,
    wallet: WalletTypeInfo = Depends(require_admin_key)
):
    """Create a new Ark wallet"""
    try:
        ark_wallet = await create_ark_wallet(wallet.wallet.user, data)
        return ark_wallet.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@ark_wallet_ext.get("/api/wallets")
async def get_wallets(
    wallet: WalletTypeInfo = Depends(require_invoice_key)
) -> List[dict]:
    """Get all wallets for the current user"""
    try:
        wallets = await get_user_wallets(wallet.wallet.user)
        return [w.dict() for w in wallets]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@ark_wallet_ext.get("/api/wallets/{wallet_id}")
async def get_wallet(
    wallet_id: str,
    wallet: WalletTypeInfo = Depends(require_invoice_key)
):
    """Get a specific wallet"""
    ark_wallet = await get_ark_wallet(wallet_id)
    if not ark_wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    if ark_wallet.user != wallet.wallet.user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return ark_wallet.dict()


@ark_wallet_ext.delete("/api/wallets/{wallet_id}")
async def delete_wallet(
    wallet_id: str,
    wallet: WalletTypeInfo = Depends(require_admin_key)
):
    """Delete a wallet"""
    ark_wallet = await get_ark_wallet(wallet_id)
    if not ark_wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    if ark_wallet.user != wallet.wallet.user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await delete_ark_wallet(wallet_id)
    return {"success": True}


@ark_wallet_ext.put("/api/wallets/{wallet_id}/balance")
async def update_balance(
    wallet_id: str,
    balance: int,
    wallet: WalletTypeInfo = Depends(require_admin_key)
):
    """Update wallet balance"""
    ark_wallet = await get_ark_wallet(wallet_id)
    if not ark_wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    if ark_wallet.user != wallet.wallet.user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await update_wallet_balance(wallet_id, balance)
    return {"success": True, "balance": balance}


# ==================== TRANSACTION ENDPOINTS ====================

@ark_wallet_ext.get("/api/wallets/{wallet_id}/transactions")
async def get_transactions(
    wallet_id: str,
    limit: int = Query(50, ge=1, le=100),
    wallet: WalletTypeInfo = Depends(require_invoice_key)
) -> List[dict]:
    """Get transactions for a wallet"""
    ark_wallet = await get_ark_wallet(wallet_id)
    if not ark_wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    if ark_wallet.user != wallet.wallet.user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    transactions = await get_wallet_transactions(wallet_id, limit)
    return [tx.dict() for tx in transactions]


@ark_wallet_ext.post("/api/transactions")
async def send_transaction(
    data: SendArk,
    wallet: WalletTypeInfo = Depends(require_admin_key)
):
    """Create a new Ark transaction"""
    ark_wallet = await get_ark_wallet(data.wallet_id)
    if not ark_wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    if ark_wallet.user != wallet.wallet.user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create transaction record
    transaction = await create_transaction(
        wallet_id=data.wallet_id,
        tx_type="send",
        amount=data.amount,
        address=data.to_address,
        memo=data.memo,
        network=ark_wallet.network
    )
    
    return transaction.dict()


@ark_wallet_ext.get("/api/transactions/{tx_id}")
async def get_transaction_details(
    tx_id: str,
    wallet: WalletTypeInfo = Depends(require_invoice_key)
):
    """Get transaction details"""
    transaction = await get_transaction(tx_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify user owns the wallet
    ark_wallet = await get_ark_wallet(transaction.wallet_id)
    if not ark_wallet or ark_wallet.user != wallet.wallet.user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return transaction.dict()


# ==================== BOLTZ SWAP ENDPOINTS ====================

@ark_wallet_ext.post("/api/swaps")
async def create_swap(
    data: CreateSwap,
    wallet: WalletTypeInfo = Depends(require_admin_key)
):
    """Create a new Boltz swap"""
    ark_wallet = await get_ark_wallet(data.wallet_id)
    if not ark_wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    if ark_wallet.user != wallet.wallet.user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    swap = await create_boltz_swap(data)
    return swap.dict()


@ark_wallet_ext.get("/api/wallets/{wallet_id}/swaps")
async def get_swaps(
    wallet_id: str,
    limit: int = Query(50, ge=1, le=100),
    wallet: WalletTypeInfo = Depends(require_invoice_key)
) -> List[dict]:
    """Get swaps for a wallet"""
    ark_wallet = await get_ark_wallet(wallet_id)
    if not ark_wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    if ark_wallet.user != wallet.wallet.user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    swaps = await get_wallet_swaps(wallet_id, limit)
    return [swap.dict() for swap in swaps]


@ark_wallet_ext.get("/api/swaps/{swap_id}")
async def get_swap_details(
    swap_id: str,
    wallet: WalletTypeInfo = Depends(require_invoice_key)
):
    """Get swap details"""
    swap = await get_boltz_swap(swap_id)
    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")
    
    # Verify user owns the wallet
    ark_wallet = await get_ark_wallet(swap.wallet_id)
    if not ark_wallet or ark_wallet.user != wallet.wallet.user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return swap.dict()


# ==================== STATS ====================

@ark_wallet_ext.get("/api/stats")
async def get_stats(wallet: WalletTypeInfo = Depends(require_invoice_key)):
    """Get wallet statistics"""
    wallets = await get_user_wallets(wallet.wallet.user)
    
    total_balance = sum(w.balance for w in wallets)
    total_wallets = len(wallets)
    
    return {
        "totalWallets": total_wallets,
        "totalBalance": total_balance,
        "networks": {
            "mainnet": len([w for w in wallets if w.network == "mainnet"]),
            "testnet": len([w for w in wallets if w.network == "testnet"]),
            "mutinynet": len([w for w in wallets if w.network == "mutinynet"])
        }
    }


# ==================== HEALTH CHECK ====================

@ark_wallet_ext.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "extension": "ark_wallet"
    }
