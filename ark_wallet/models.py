"""
Models for Ark Wallet Extension
"""
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class ArkWallet(BaseModel):
    """Ark wallet model"""
    id: str
    user: str
    wallet_name: str
    network: str  # mainnet, testnet, mutinynet
    encrypted_key: str
    created_at: datetime
    last_used: Optional[datetime] = None
    balance: int = 0  # in satoshis


class ArkTransaction(BaseModel):
    """Ark transaction model"""
    id: str
    wallet_id: str
    tx_type: str  # send, receive, onboard, offboard, swap_in, swap_out
    amount: int  # in satoshis
    address: Optional[str] = None
    txid: Optional[str] = None
    status: str  # pending, confirmed, failed
    network: str
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    fee: Optional[int] = None
    memo: Optional[str] = None


class BoltzSwap(BaseModel):
    """Boltz swap model"""
    id: str
    wallet_id: str
    swap_type: str  # submarine (LN->onchain), reverse (onchain->LN)
    amount: int
    invoice: Optional[str] = None
    onchain_address: Optional[str] = None
    swap_id: str  # Boltz swap ID
    status: str  # pending, completed, failed, refunded
    timeout_block: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    refund_tx: Optional[str] = None


class CreateWallet(BaseModel):
    """Create wallet request"""
    wallet_name: str
    network: str = "mutinynet"
    encrypted_key: str


class SendArk(BaseModel):
    """Send Ark transaction request"""
    wallet_id: str
    to_address: str
    amount: int
    memo: Optional[str] = None


class CreateSwap(BaseModel):
    """Create Boltz swap request"""
    wallet_id: str
    swap_type: str  # "submarine" or "reverse"
    amount: int
    invoice: Optional[str] = None  # For submarine swaps
    onchain_address: Optional[str] = None  # For reverse swaps
