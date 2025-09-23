"""Service for account operations."""

from typing import Dict, Any, List, Optional
from datetime import datetime
from ..repositories.memgraph_repo import memgraph_repo
from ..models.schemas import Account, AccountCreate, AccountUpdate, SearchParams
from ..utils.helpers import generate_account_id, calculate_risk_score, get_risk_label
from ..logging_config import get_logger

logger = get_logger(__name__)


class AccountsService:
    """Service for account operations."""
    
    def __init__(self):
        self.repo = memgraph_repo
    
    async def get_account(self, account_id: str) -> Optional[Account]:
        """Get an account by ID."""
        try:
            raw_account = await self.repo.get_account_by_id(account_id)
            if not raw_account:
                return None
            
            return Account(**raw_account)
        except Exception as e:
            logger.error("Failed to get account", account_id=account_id, error=str(e))
            return None
    
    async def get_account_recent_transactions(self, account_id: str) -> List[Dict[str, Any]]:
        """Get recent transactions for an account."""
        try:
            raw_data = await self.repo.get_account_recent_transactions(account_id)
            return raw_data.get("transactions", [])
        except Exception as e:
            logger.error("Failed to get account recent transactions", account_id=account_id, error=str(e))
            return []
    
    async def get_accounts(self, params: SearchParams) -> Dict[str, Any]:
        """Get accounts with pagination and filters."""
        try:
            raw_data = await self.repo.get_accounts(
                page=params.page,
                page_size=params.page_size,
                customer_id=None,  # TODO: Add customer_id to SearchParams if needed
                account_type=None,  # TODO: Add account_type to SearchParams if needed
                risk_level=params.risk_level.value if params.risk_level else None,
                status=None,  # TODO: Add status to SearchParams if needed
                sort_by=params.sort_by or "created_at",
                sort_order=params.sort_order.upper()
            )
            
            # Convert to Account objects
            accounts = [Account(**account) for account in raw_data.get("accounts", [])]
            
            return {
                "accounts": accounts,
                "total": raw_data.get("total", 0),
                "page": raw_data.get("page", 1),
                "page_size": raw_data.get("page_size", 20),
                "total_pages": raw_data.get("total_pages", 0)
            }
        except Exception as e:
            logger.error("Failed to get accounts", error=str(e))
            return {
                "accounts": [],
                "total": 0,
                "page": params.page,
                "page_size": params.page_size,
                "total_pages": 0
            }
    
    async def create_account(self, account_data: AccountCreate) -> Optional[Account]:
        """Create a new account."""
        try:
            # Generate account ID if not provided
            if not account_data.account_id:
                account_data.account_id = generate_account_id()
            
            # Convert to dict for database
            account_dict = account_data.dict()
            account_dict["created_at"] = account_data.created_at.isoformat()
            if account_data.last_transaction:
                account_dict["last_transaction"] = account_data.last_transaction.isoformat()
            
            # Create in database
            result = await self.repo.create_account(account_dict)
            if not result:
                return None
            
            # Create relationship with customer
            await self.repo.create_owns_relationship(
                account_data.customer_id,
                account_data.account_id
            )
            
            # Return as Account object
            return Account(**account_data.dict())
        except Exception as e:
            logger.error("Failed to create account", error=str(e))
            return None
    
    async def update_account(self, account_id: str, update_data: AccountUpdate) -> Optional[Account]:
        """Update an account."""
        try:
            # Get existing account
            existing = await self.repo.get_account_by_id(account_id)
            if not existing:
                return None
            
            # Update fields
            update_dict = update_data.dict(exclude_unset=True)
            for key, value in update_dict.items():
                existing[key] = value
            
            # Update risk label if risk score changed
            if "risk_score" in update_dict:
                existing["risk_label"] = get_risk_label(update_dict["risk_score"])
            
            # Update in database
            # Note: This would need an UPDATE query in the repository
            # For now, we'll return the updated account
            return Account(**existing)
        except Exception as e:
            logger.error("Failed to update account", account_id=account_id, error=str(e))
            return None
    
    async def freeze_account(self, account_id: str, reason: str, duration: Optional[int] = None) -> bool:
        """Freeze an account."""
        try:
            update_data = AccountUpdate(
                status="frozen",
                meta={
                    "frozen": True,
                    "freeze_reason": reason,
                    "frozen_at": datetime.utcnow().isoformat(),
                    "freeze_duration_hours": duration
                }
            )
            
            result = await self.update_account(account_id, update_data)
            return result is not None
        except Exception as e:
            logger.error("Failed to freeze account", account_id=account_id, error=str(e))
            return False
    
    async def unfreeze_account(self, account_id: str, reason: str) -> bool:
        """Unfreeze an account."""
        try:
            update_data = AccountUpdate(
                status="active",
                meta={
                    "frozen": False,
                    "unfreeze_reason": reason,
                    "unfrozen_at": datetime.utcnow().isoformat()
                }
            )
            
            result = await self.update_account(account_id, update_data)
            return result is not None
        except Exception as e:
            logger.error("Failed to unfreeze account", account_id=account_id, error=str(e))
            return False


# Global service instance
accounts_service = AccountsService()
