"""Transactions API endpoints."""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from ..deps import get_pagination_params, get_search_params
from ...services.transactions_service import transactions_service
from ...models.schemas import (
    Transaction, TransactionResponse, TransactionListResponse, 
    SearchParams, TransactionAction
)
from ...logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/", response_model=TransactionListResponse)
async def get_transactions(
    pagination: Dict[str, Any] = Depends(get_pagination_params),
    search: Dict[str, Any] = Depends(get_search_params)
):
    """Get transactions with pagination and filters."""
    try:
        # Combine pagination and search parameters
        params = SearchParams(**pagination, **search)
        
        result = await transactions_service.get_transactions(params)

        return TransactionListResponse(
            success=True,
            data=result["transactions"],
            pagination={
                "total": result["total"],
                "page": result["page"],
                "page_size": result["page_size"],
                "total_pages": result["total_pages"]
            }
        )
    except Exception as e:
        logger.error("Failed to get transactions", error=str(e))
        return TransactionListResponse(
            success=False,
            message="Failed to retrieve transactions",
            data=[],
            pagination={"total": 0, "page": 1, "page_size": 20, "total_pages": 0}
        )


@router.get("/{tx_id}", response_model=TransactionResponse)
async def get_transaction(tx_id: str):
    """Get a specific transaction by ID."""
    try:
        transaction = await transactions_service.get_transaction(tx_id)
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        return TransactionResponse(
            success=True,
            data=transaction
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get transaction", tx_id=tx_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transaction"
        )


@router.get("/{tx_id}/graph")
async def get_transaction_graph(tx_id: str):
    """Get transaction graph for visualization."""
    try:
        graph_data = await transactions_service.get_transaction_graph(tx_id)
        return {
            "success": True,
            "data": graph_data
        }
    except Exception as e:
        logger.error("Failed to get transaction graph", tx_id=tx_id, error=str(e))
        return {
            "success": False,
            "message": "Failed to retrieve transaction graph"
        }


@router.post("/{tx_id}/actions")
async def perform_transaction_action(tx_id: str, action: TransactionAction):
    """Perform an action on a transaction."""
    try:
        if action.action == "investigate":
            success = await transactions_service.flag_transaction(tx_id, action.notes or "Flagged for investigation")
        elif action.action == "mark_false_positive":
            success = await transactions_service.mark_false_positive(tx_id, action.notes or "Marked as false positive")
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
        logger.error("Failed to perform transaction action", tx_id=tx_id, action=action.action, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform action"
        )


@router.get("/statistics/period/{period}")
async def get_transaction_statistics(period: str):
    """Get transaction statistics for a period."""
    try:
        stats = await transactions_service.get_transaction_statistics(period)
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        logger.error("Failed to get transaction statistics", period=period, error=str(e))
        return {
            "success": False,
            "message": "Failed to retrieve transaction statistics"
        }
