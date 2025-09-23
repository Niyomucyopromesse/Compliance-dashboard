"""Service for customer operations."""

from typing import Dict, Any, List, Optional
from datetime import datetime
from ..repositories.memgraph_repo import memgraph_repo
from ..models.schemas import Customer, CustomerCreate, CustomerUpdate, SearchParams
from ..utils.helpers import generate_customer_id, calculate_risk_score, get_risk_label
from ..logging_config import get_logger

logger = get_logger(__name__)


class CustomersService:
    """Service for customer operations."""
    
    def __init__(self):
        self.repo = memgraph_repo
    
    async def get_customer(self, customer_id: str) -> Optional[Customer]:
        """Get a customer by ID."""
        try:
            raw_customer = await self.repo.get_customer_by_id(customer_id)
            if not raw_customer:
                return None
            
            return Customer(**raw_customer)
        except Exception as e:
            logger.error("Failed to get customer", customer_id=customer_id, error=str(e))
            return None
    
    async def get_customers(self, params: SearchParams) -> Dict[str, Any]:
        """Get customers with pagination and filters."""
        try:
            raw_data = await self.repo.get_customers(
                page=params.page,
                page_size=params.page_size,
                search=params.search,
                risk_level=params.risk_level.value if params.risk_level else None,
                sort_by=params.sort_by or "created_at",
                sort_order=params.sort_order.upper()
            )
            
            # Convert to Customer objects
            customers = [Customer(**customer) for customer in raw_data.get("customers", [])]
            
            return {
                "customers": customers,
                "total": raw_data.get("total", 0),
                "page": raw_data.get("page", 1),
                "page_size": raw_data.get("page_size", 20),
                "total_pages": raw_data.get("total_pages", 0)
            }
        except Exception as e:
            logger.error("Failed to get customers", error=str(e))
            return {
                "customers": [],
                "total": 0,
                "page": params.page,
                "page_size": params.page_size,
                "total_pages": 0
            }
    
    async def create_customer(self, customer_data: CustomerCreate) -> Optional[Customer]:
        """Create a new customer."""
        try:
            # Generate customer ID if not provided
            if not customer_data.customer_id:
                customer_data.customer_id = generate_customer_id()
            
            # Convert to dict for database
            customer_dict = customer_data.dict()
            customer_dict["created_at"] = customer_data.created_at.isoformat()
            customer_dict["updated_at"] = customer_data.updated_at.isoformat()
            
            # Create in database
            result = await self.repo.create_customer(customer_dict)
            if not result:
                return None
            
            # Return as Customer object
            return Customer(**customer_data.dict())
        except Exception as e:
            logger.error("Failed to create customer", error=str(e))
            return None
    
    async def update_customer(self, customer_id: str, update_data: CustomerUpdate) -> Optional[Customer]:
        """Update a customer."""
        try:
            # Get existing customer
            existing = await self.repo.get_customer_by_id(customer_id)
            if not existing:
                return None
            
            # Update fields
            update_dict = update_data.dict(exclude_unset=True)
            for key, value in update_dict.items():
                existing[key] = value
            
            # Update risk label if risk score changed
            if "risk_score" in update_dict:
                existing["risk_label"] = get_risk_label(update_dict["risk_score"])
            
            # Update timestamp
            existing["updated_at"] = datetime.utcnow().isoformat()
            
            # Update in database
            # Note: This would need an UPDATE query in the repository
            # For now, we'll return the updated customer
            return Customer(**existing)
        except Exception as e:
            logger.error("Failed to update customer", customer_id=customer_id, error=str(e))
            return None


# Global service instance
customers_service = CustomersService()
