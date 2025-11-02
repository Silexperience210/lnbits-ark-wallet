"""
Ark Wallet Extension for LNbits
Secure, self-custodial Ark wallet with Lightning Network integration via Boltz
"""
import asyncio
from fastapi import APIRouter
from lnbits.db import Database
from lnbits.helpers import template_renderer

db = Database("ext_ark_wallet")

ark_wallet_ext: APIRouter = APIRouter(prefix="/ark_wallet", tags=["Ark Wallet"])

ark_wallet_static_files = [
    {
        "path": "/ark_wallet/static",
        "name": "ark_wallet_static",
    }
]


def ark_wallet_renderer():
    return template_renderer(["ark_wallet/templates"])


from .views import *  # noqa
from .views_api import *  # noqa
