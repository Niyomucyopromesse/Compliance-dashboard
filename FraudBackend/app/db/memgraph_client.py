"""Memgraph client with convenience methods for common operations."""

from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timedelta
from .connection import get_database
from ..logging_config import get_logger

logger = get_logger(__name__)


class MemgraphClient:
    """High-level client for Memgraph operations."""
    
    def __init__(self):
        self.db = None
    
    async def initialize(self):
        """Initialize the database connection."""
        self.db = await get_database()
    
    async def create_indexes(self) -> None:
        """Create necessary indexes for optimal performance."""
        indexes = [
            "CREATE INDEX ON :Customer(customer_id)",
            "CREATE INDEX ON :Account(account_id)",
            "CREATE INDEX ON :Transaction(tx_id)",
            "CREATE INDEX ON :Transaction(timestamp)",
            "CREATE INDEX ON :Transaction(risk_score)",
            "CREATE INDEX ON :Alert(alert_id)",
            "CREATE INDEX ON :Alert(created_at)",
        ]
        
        for index_query in indexes:
            try:
                await self.db.execute_write(index_query)
                logger.info("Created index", query=index_query)
            except Exception as e:
                logger.warning("Failed to create index", query=index_query, error=str(e))
    
    async def get_health_metrics(self) -> Dict[str, Any]:
        """Get basic health metrics from the database."""
        try:
            # Get node counts
            customer_count = await self.db.execute_read("MATCH (c:Customer) RETURN count(c) as count")
            account_count = await self.db.execute_read("MATCH (a:Account) RETURN count(a) as count")
            transaction_count = await self.db.execute_read("MATCH (t:Transaction) RETURN count(t) as count")
            alert_count = await self.db.execute_read("MATCH (a:Alert) RETURN count(a) as count")
            
            return {
                "customers": customer_count[0]["count"] if customer_count else 0,
                "accounts": account_count[0]["count"] if account_count else 0,
                "transactions": transaction_count[0]["count"] if transaction_count else 0,
                "alerts": alert_count[0]["count"] if alert_count else 0,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error("Failed to get health metrics", error=str(e))
            return {
                "customers": 0,
                "accounts": 0,
                "transactions": 0,
                "alerts": 0,
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }
    
    async def get_transaction_by_id(self, tx_id: str) -> Optional[Dict[str, Any]]:
        """Get a transaction by its ID."""
        query = """
        MATCH (t:Transaction {tx_id: $tx_id})
        RETURN t {.tx_id, .timestamp, .from_account, .to_account, .amount, .currency, 
                  .type, .risk_score, .risk_label, .alert_id, .meta} as transaction
        """
        result = await self.db.execute_read(query, {"tx_id": tx_id})
        return result[0]["transaction"] if result else None
    
    async def get_customer_by_id(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get a customer by their ID."""
        query = """
        MATCH (c:Customer {customer_id: $customer_id})
        OPTIONAL MATCH (c)-[:OWNS]->(a:Account)
        RETURN c {.customer_id, .name, .email, .phone, .address, .risk_score, 
                  .risk_label, .status, .created_at, .updated_at} as customer,
               collect(a {.account_id, .account_number, .account_type, .balance, 
                         .currency, .risk_score, .risk_label, .status}) as accounts
        """
        result = await self.db.execute_read(query, {"customer_id": customer_id})
        if result:
            customer = result[0]["customer"]
            customer["accounts"] = result[0]["accounts"]
            return customer
        return None
    
    async def get_account_by_id(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Get an account by its ID."""
        query = """
        MATCH (a:Account {account_id: $account_id})
        OPTIONAL MATCH (c:Customer)-[:OWNS]->(a)
        RETURN a {.account_id, .account_number, .account_type, .balance, .currency,
                  .risk_score, .risk_label, .status, .created_at, .last_transaction} as account,
               c {.customer_id, .name, .email} as customer
        """
        result = await self.db.execute_read(query, {"account_id": account_id})
        if result:
            account = result[0]["account"]
            account["customer"] = result[0]["customer"]
            return account
        return None
    
    async def get_alert_by_id(self, alert_id: str) -> Optional[Dict[str, Any]]:
        """Get an alert by its ID."""
        query = """
        MATCH (a:Alert {alert_id: $alert_id})
        OPTIONAL MATCH (a)-[:ALERTS]->(t:Transaction)
        OPTIONAL MATCH (a)-[:ALERTS]->(c:Customer)
        RETURN a {.alert_id, .alert_type, .severity, .status, .description, 
                  .risk_score, .created_at, .updated_at, .assigned_to, .notes} as alert,
               t {.tx_id, .timestamp, .amount, .currency} as transaction,
               c {.customer_id, .name, .email} as customer
        """
        result = await self.db.execute_read(query, {"alert_id": alert_id})
        if result:
            alert = result[0]["alert"]
            alert["transaction"] = result[0]["transaction"]
            alert["customer"] = result[0]["customer"]
            return alert
        return None
    
    async def search_transactions(
        self,
        limit: int = 20,
        offset: int = 0,
        search: Optional[str] = None,
        risk_level: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sort_by: str = "timestamp",
        sort_order: str = "DESC"
    ) -> Dict[str, Any]:
        """Search transactions with filters and pagination."""
        
        # Build WHERE clause
        where_conditions = []
        parameters = {"limit": limit, "offset": offset}
        
        if search:
            where_conditions.append(
                "(t.tx_id CONTAINS $search OR t.from_account CONTAINS $search OR t.to_account CONTAINS $search)"
            )
            parameters["search"] = search
        
        if risk_level:
            where_conditions.append("t.risk_label = $risk_level")
            parameters["risk_level"] = risk_level
        
        if date_from:
            where_conditions.append("t.timestamp >= $date_from")
            parameters["date_from"] = date_from.isoformat()
        
        if date_to:
            where_conditions.append("t.timestamp <= $date_to")
            parameters["date_to"] = date_to.isoformat()
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        # Build query
        query = f"""
        MATCH (t:Transaction)
        {where_clause}
        WITH t
        ORDER BY t.{sort_by} {sort_order}
        SKIP $offset
        LIMIT $limit
        RETURN t {{.tx_id, .timestamp, .from_account, .to_account, .amount, 
                  .currency, .type, .risk_score, .risk_label, .alert_id, .meta}} as transaction
        """
        
        # Get total count
        count_query = f"""
        MATCH (t:Transaction)
        {where_clause}
        RETURN count(t) as total
        """
        
        try:
            transactions = await self.db.execute_read(query, parameters)
            count_result = await self.db.execute_read(count_query, parameters)
            total = count_result[0]["total"] if count_result else 0
            
            return {
                "transactions": [t["transaction"] for t in transactions],
                "total": total,
                "page": (offset // limit) + 1,
                "page_size": limit,
                "total_pages": (total + limit - 1) // limit
            }
        except Exception as e:
            logger.error("Failed to search transactions", error=str(e))
            return {
                "transactions": [],
                "total": 0,
                "page": 1,
                "page_size": limit,
                "total_pages": 0
            }


# Global client instance
memgraph_client = MemgraphClient()
