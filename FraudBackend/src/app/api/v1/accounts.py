"""Accounts API endpoints."""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from ..deps import get_pagination_params, get_search_params
from ...services.accounts_service import accounts_service
from ...models.schemas import (
    Account, AccountResponse, AccountListResponse, 
    SearchParams, AccountUpdate, AccountAction
)
from ...logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/", response_model=AccountListResponse)
async def get_accounts(
    pagination: Dict[str, Any] = Depends(get_pagination_params),
    search: Dict[str, Any] = Depends(get_search_params)
):
    """Get accounts with pagination and filters."""
    try:
        # Combine pagination and search parameters
        params = SearchParams(**pagination, **search)
        
        result = await accounts_service.get_accounts(params)
        
        return AccountListResponse(
            success=True,
            data=result["accounts"],
            pagination={
                "total": result["total"],
                "page": result["page"],
                "page_size": result["page_size"],
                "total_pages": result["total_pages"]
            }
        )
    except Exception as e:
        logger.error("Failed to get accounts", error=str(e))
        return AccountListResponse(
            success=False,
            message="Failed to retrieve accounts",
            data=[],
            pagination={"total": 0, "page": 1, "page_size": 20, "total_pages": 0}
        )


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(account_id: str):
    """Get a specific account by ID."""
    try:
        account = await accounts_service.get_account(account_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        return AccountResponse(
            success=True,
            data=account
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get account", account_id=account_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve account"
        )


@router.get("/{account_id}/transactions/recent")
async def get_account_recent_transactions(account_id: str):
    """Get recent transactions for an account."""
    try:
        transactions = await accounts_service.get_account_recent_transactions(account_id)
        
        return {
            "success": True,
            "data": transactions,
            "message": f"Retrieved {len(transactions)} recent transactions"
        }
    except Exception as e:
        logger.error("Failed to get account recent transactions", account_id=account_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recent transactions"
        )


@router.put("/{account_id}")
async def update_account(account_id: str, update_data: AccountUpdate):
    """Update an account."""
    try:
        account = await accounts_service.update_account(account_id, update_data)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        return AccountResponse(
            success=True,
            data=account,
            message="Account updated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update account", account_id=account_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update account"
        )


@router.post("/{account_id}/actions")
async def perform_account_action(account_id: str, action: AccountAction):
    """Perform an action on an account."""
    try:
        if action.action == "freeze":
            success = await accounts_service.freeze_account(account_id, action.reason, action.duration)
        elif action.action == "unfreeze":
            success = await accounts_service.unfreeze_account(account_id, action.reason)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown action: {action.action}"
            )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to perform action"
            )
        
        return {
            "success": True,
            "message": f"Action '{action.action}' performed successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to perform account action", account_id=account_id, action=action.action, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform action"
        )
