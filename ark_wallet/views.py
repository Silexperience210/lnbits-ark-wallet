"""
HTML Views for Ark Wallet Extension
"""
from fastapi import Depends, Request
from fastapi.responses import HTMLResponse
from lnbits.core.models import User
from lnbits.decorators import check_user_exists

from . import ark_wallet_ext, ark_wallet_renderer


@ark_wallet_ext.get("/", response_class=HTMLResponse)
async def index(request: Request, user: User = Depends(check_user_exists)):
    """Main wallet interface"""
    return ark_wallet_renderer().TemplateResponse(
        "ark_wallet/index.html",
        {"request": request, "user": user.dict()}
    )
