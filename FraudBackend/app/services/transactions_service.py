"""Service for transaction operations."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from ..repositories.memgraph_repo import memgraph_repo
from ..models.schemas import Transaction, TransactionCreate, TransactionUpdate, SearchParams
from ..utils.helpers import generate_tx_id, calculate_risk_score, get_risk_label
from ..logging_config import get_logger

logger = get_logger(__name__)


class TransactionsService:
    """Service for transaction operations."""
    
    def __init__(self):
        self.repo = memgraph_repo
    
    async def get_transaction(self, tx_id: str) -> Optional[Transaction]:
        """Get a transaction by ID."""
        try:
            raw_transaction = await self.repo.get_transaction_by_id(tx_id)
            if not raw_transaction:
                return None
            
            return Transaction(**raw_transaction)
        except Exception as e:
            logger.error("Failed to get transaction", tx_id=tx_id, error=str(e))
            return None
    
    async def get_transactions(self, params: SearchParams) -> Dict[str, Any]:
        """Get transactions with pagination and filters."""
        try:
            raw_data = await self.repo.get_transactions(
                page=params.page,
                page_size=params.page_size,
                search=params.search,
                risk_level=params.risk_level.value if params.risk_level else None,
                date_from=params.date_from,
                date_to=params.date_to,
                sort_by=params.sort_by or "timestamp",
                sort_order=params.sort_order.upper()
            )
            
            # Convert to Transaction objects
            transactions = [Transaction(**tx) for tx in raw_data.get("transactions", [])]
            
            return {
                "transactions": transactions,
                "total": raw_data.get("total", 0),
                "page": raw_data.get("page", 1),
                "page_size": raw_data.get("page_size", 20),
                "total_pages": raw_data.get("total_pages", 0)
            }
        except Exception as e:
            logger.error("Failed to get transactions", error=str(e))
            return {
                "transactions": [],
                "total": 0,
                "page": params.page,
                "page_size": params.page_size,
                "total_pages": 0
            }
    
    async def create_transaction(self, transaction_data: TransactionCreate) -> Optional[Transaction]:
        """Create a new transaction."""
        try:
            # Generate transaction ID if not provided
            if not transaction_data.tx_id:
                transaction_data.tx_id = generate_tx_id()
            
            # Calculate risk score if not provided
            if transaction_data.risk_score == 0:
                # This is a simplified risk calculation
                # In a real system, this would be more sophisticated
                risk_score = calculate_risk_score(
                    amount=transaction_data.amount,
                    frequency=1,  # Would need to calculate from history
                    time_of_day=transaction_data.timestamp.hour,
                    amount_anomaly=transaction_data.amount > 10000
                )
                transaction_data.risk_score = risk_score
                transaction_data.risk_label = get_risk_label(risk_score)
            
            # Convert to dict for database
            tx_dict = transaction_data.dict()
            tx_dict["timestamp"] = transaction_data.timestamp.isoformat()
            
            # Create in database
            result = await self.repo.create_transaction(tx_dict)
            if not result:
                return None
            
            # Return as Transaction object
            return Transaction(**transaction_data.dict())
        except Exception as e:
            logger.error("Failed to create transaction", error=str(e))
            return None
    
    async def update_transaction(self, tx_id: str, update_data: TransactionUpdate) -> Optional[Transaction]:
        """Update a transaction."""
        try:
            # Get existing transaction
            existing = await self.repo.get_transaction_by_id(tx_id)
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
            # For now, we'll return the updated transaction
            return Transaction(**existing)
        except Exception as e:
            logger.error("Failed to update transaction", tx_id=tx_id, error=str(e))
            return None
    
    async def get_transaction_graph(self, tx_id: str) -> Dict[str, Any]:
        """Get transaction graph for visualization."""
        try:
            # This would use the transaction neighborhood query
            # For now, return a placeholder
            return {
                "tx_id": tx_id,
                "nodes": [],
                "edges": [],
                "message": "Graph visualization not implemented yet"
            }
        except Exception as e:
            logger.error("Failed to get transaction graph", tx_id=tx_id, error=str(e))
            return {"tx_id": tx_id, "nodes": [], "edges": [], "error": str(e)}
    
    async def flag_transaction(self, tx_id: str, reason: str) -> bool:
        """Flag a transaction for investigation."""
        try:
            # Get transaction
            transaction = await self.repo.get_transaction_by_id(tx_id)
            if not transaction:
                return False
            
            # Update risk score and label
            update_data = TransactionUpdate(
                risk_score=0.8,  # High risk
                risk_label="High",
                meta={"flagged": True, "flag_reason": reason, "flagged_at": datetime.utcnow().isoformat()}
            )
            
            result = await self.update_transaction(tx_id, update_data)
            return result is not None
        except Exception as e:
            logger.error("Failed to flag transaction", tx_id=tx_id, error=str(e))
            return False
    
    async def mark_false_positive(self, tx_id: str, notes: str) -> bool:
        """Mark a transaction as false positive."""
        try:
            # Get transaction
            transaction = await self.repo.get_transaction_by_id(tx_id)
            if not transaction:
                return False
            
            # Update as false positive
            update_data = TransactionUpdate(
                risk_score=0.1,  # Low risk
                risk_label="Low",
                meta={
                    **transaction.get("meta", {}),
                    "false_positive": True,
                    "false_positive_notes": notes,
                    "false_positive_at": datetime.utcnow().isoformat()
                }
            )
            
            result = await self.update_transaction(tx_id, update_data)
            return result is not None
        except Exception as e:
            logger.error("Failed to mark transaction as false positive", tx_id=tx_id, error=str(e))
            return False
    
    async def get_transaction_statistics(self, period: str = "24h") -> Dict[str, Any]:
        """Get transaction statistics for a period."""
        try:
            # Calculate date range
            now = datetime.utcnow()
            if period == "1h":
                date_from = now - timedelta(hours=1)
            elif period == "24h":
                date_from = now - timedelta(hours=24)
            elif period == "7d":
                date_from = now - timedelta(days=7)
            elif period == "30d":
                date_from = now - timedelta(days=30)
            else:
                date_from = now - timedelta(hours=24)
            
            # Get transactions for period
            transactions_data = await self.repo.get_transactions(
                date_from=date_from,
                page_size=10000  # Get all transactions for the period
            )
            transactions = transactions_data.get("transactions", [])
            
            # Calculate statistics
            total_count = len(transactions)
            total_amount = sum(tx.get("amount", 0) for tx in transactions)
            high_risk_count = len([tx for tx in transactions if tx.get("risk_label") in ["Critical", "High"]])
            avg_amount = total_amount / total_count if total_count > 0 else 0
            fraud_rate = high_risk_count / total_count if total_count > 0 else 0
            
            # Risk distribution
            risk_distribution = {}
            for tx in transactions:
                risk_label = tx.get("risk_label", "Unknown")
                risk_distribution[risk_label] = risk_distribution.get(risk_label, 0) + 1
            
            return {
                "period": period,
                "total_transactions": total_count,
                "total_amount": total_amount,
                "average_amount": avg_amount,
                "high_risk_transactions": high_risk_count,
                "fraud_rate": fraud_rate,
                "risk_distribution": risk_distribution,
                "date_from": date_from.isoformat(),
                "date_to": now.isoformat()
            }
        except Exception as e:
            logger.error("Failed to get transaction statistics", error=str(e))
            return {
                "period": period,
                "total_transactions": 0,
                "total_amount": 0,
                "average_amount": 0,
                "high_risk_transactions": 0,
                "fraud_rate": 0,
                "risk_distribution": {},
                "error": str(e)
            }


# Global service instance
transactions_service = TransactionsService()
