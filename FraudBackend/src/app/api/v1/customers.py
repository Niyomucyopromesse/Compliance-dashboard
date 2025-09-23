"""Customers API endpoints."""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from ..deps import get_pagination_params, get_search_params
from ...services.customers_service import customers_service
from ...models.schemas import (
    Customer, CustomerResponse, CustomerListResponse, 
    SearchParams, CustomerUpdate
)
from ...logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/", response_model=CustomerListResponse)
async def get_customers(
    pagination: Dict[str, Any] = Depends(get_pagination_params),
    search: Dict[str, Any] = Depends(get_search_params)
):
    """Get customers with pagination and filters."""
    try:
        # Combine pagination and search parameters
        params = SearchParams(**pagination, **search)
        
        result = await customers_service.get_customers(params)
        
        return CustomerListResponse(
            success=True,
            data=result["customers"],
            pagination={
                "total": result["total"],
                "page": result["page"],
                "page_size": result["page_size"],
                "total_pages": result["total_pages"]
            }
        )
    except Exception as e:
        logger.error("Failed to get customers", error=str(e))
        return CustomerListResponse(
            success=False,
            message="Failed to retrieve customers",
            data=[],
            pagination={"total": 0, "page": 1, "page_size": 20, "total_pages": 0}
        )


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str):
    """Get a specific customer by ID."""
    try:
        customer = await customers_service.get_customer(customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        return CustomerResponse(
            success=True,
            data=customer
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get customer", customer_id=customer_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve customer"
        )


@router.put("/{customer_id}")
async def update_customer(customer_id: str, update_data: CustomerUpdate):
    """Update a customer."""
    try:
        customer = await customers_service.update_customer(customer_id, update_data)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        return CustomerResponse(
            success=True,
            data=customer,
            message="Customer updated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update customer", customer_id=customer_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update customer"
        )
