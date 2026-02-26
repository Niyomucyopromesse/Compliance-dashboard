"""Repository for Memgraph database operations."""

from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from ..db.connection import get_database
from ..utils.cypher_queries import CypherQueries
from ..logging_config import get_logger

logger = get_logger(__name__)


class MemgraphRepository:
    """Repository for Memgraph database operations."""
    
    def __init__(self):
        self.db = None
        self.queries = CypherQueries()
    
    async def initialize(self):
        """Initialize the database connection."""
        self.db = await get_database()
    
    # Health and metrics
    async def health_check(self) -> bool:
        """Check database health."""
        try:
            result = await self.db.execute_read(self.queries.HEALTH_CHECK)
            return len(result) > 0 and result[0].get("health") == 1
        except Exception as e:
            logger.error("Health check failed", error=str(e))
            return False
    
    async def get_node_counts(self) -> Dict[str, int]:
        """Get counts of all node types."""
        try:
            result = await self.db.execute_read(self.queries.GET_NODE_COUNTS)
            if result:
                return {
                    "customers": result[0].get("customers", 0),
                    "accounts": result[0].get("accounts", 0),
                    "transactions": result[0].get("transactions", 0),
                    "alerts": result[0].get("alerts", 0)
                }
            return {"customers": 0, "accounts": 0, "transactions": 0, "alerts": 0}
        except Exception as e:
            logger.error("Failed to get node counts", error=str(e))
            return {"customers": 0, "accounts": 0, "transactions": 0, "alerts": 0}
    
    # Customer operations
    async def get_customer_by_id(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get customer by ID."""
        try:
            result = await self.db.execute_read(
                self.queries.GET_CUSTOMER_BY_ID,
                {"customer_id": customer_id}
            )
            if result:
                customer = result[0]["customer"]
                customer["accounts"] = result[0]["accounts"]
                return customer
            return None
        except Exception as e:
            logger.error("Failed to get customer", customer_id=customer_id, error=str(e))
            return None
    
    async def get_customers(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        risk_level: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "DESC"
    ) -> Dict[str, Any]:
        """Get customers with pagination and filters."""
        try:
            offset = (page - 1) * page_size
            parameters = {
                "search": search,
                "risk_level": risk_level,
                "status": status,
                "offset": offset,
                "limit": page_size,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
            
            # Get customers
            logger.info("Executing customers query", query=self.queries.GET_CUSTOMERS, parameters=parameters)
            customers_result = await self.db.execute_read(
                self.queries.GET_CUSTOMERS,
                parameters
            )
            # logger.info("Customers query result", result=customers_result)
            
            # Get total count
            count_result = await self.db.execute_read(
                self.queries.GET_CUSTOMERS_COUNT,
                parameters
            )
            
            total = count_result[0]["total"] if count_result else 0
            
            return {
                "customers": [c["customer"] for c in customers_result],
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size
            }
        except Exception as e:
            logger.error("Failed to get customers", error=str(e))
            return {"customers": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}
    
    async def create_customer(self, customer_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new customer."""
        try:
            result = await self.db.execute_write(
                self.queries.CREATE_CUSTOMER,
                customer_data
            )
            return result[0] if result else None
        except Exception as e:
            logger.error("Failed to create customer", error=str(e))
            return None
    
    # Account operations
    async def get_account_by_id(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Get account by ID."""
        try:
            result = await self.db.execute_read(
                self.queries.GET_ACCOUNT_BY_ID,
                {"account_id": account_id}
            )
            if result:
                account = result[0]["account"]
                account["customer"] = result[0]["customer"]
                return account
            return None
        except Exception as e:
            logger.error("Failed to get account", account_id=account_id, error=str(e))
            return None
    
    async def get_account_recent_transactions(self, account_id: str) -> Dict[str, Any]:
        """Get recent transactions for an account."""
        try:
            result = await self.db.execute_read(
                self.queries.GET_ACCOUNT_RECENT_TRANSACTIONS,
                {"account_id": account_id}
            )
            if result:
                return {"transactions": result[0]["transactions"]}
            return {"transactions": []}
        except Exception as e:
            logger.error("Failed to get account recent transactions", account_id=account_id, error=str(e))
            return {"transactions": []}
    
    async def get_accounts(
        self,
        page: int = 1,
        page_size: int = 20,
        customer_id: Optional[str] = None,
        account_type: Optional[str] = None,
        risk_level: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "DESC"
    ) -> Dict[str, Any]:
        """Get accounts with pagination and filters."""
        try:
            offset = (page - 1) * page_size
            parameters = {
                "customer_id": customer_id,
                "account_type": account_type,
                "risk_level": risk_level,
                "status": status,
                "offset": offset,
                "limit": page_size,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
            
            # Get accounts
            accounts_result = await self.db.execute_read(
                self.queries.GET_ACCOUNTS,
                parameters
            )

            # logger.info("Accounts query result", result=accounts_result)
            
            # Get total count
            count_result = await self.db.execute_read(
                self.queries.GET_ACCOUNTS_COUNT,
                parameters
            )
            
            total = count_result[0]["total"] if count_result else 0
            
            return {
                "accounts": [a["account"] for a in accounts_result],
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size
            }
        except Exception as e:
            logger.error("Failed to get accounts", error=str(e))
            return {"accounts": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}
    
    async def create_account(self, account_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new account."""
        try:
            result = await self.db.execute_write(
                self.queries.CREATE_ACCOUNT,
                account_data
            )
            return result[0] if result else None
        except Exception as e:
            logger.error("Failed to create account", error=str(e))
            return None
    
    # Transaction operations
    async def get_transaction_by_id(self, tx_id: str) -> Optional[Dict[str, Any]]:
        """Get transaction by ID."""
        try:
            result = await self.db.execute_read(
                self.queries.GET_TRANSACTION_BY_ID,
                {"tx_id": tx_id}
            )
            return result[0]["transaction"] if result else None
        except Exception as e:
            logger.error("Failed to get transaction", tx_id=tx_id, error=str(e))
            return None
    
    async def get_transactions(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        risk_level: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        customer_id: Optional[str] = None,
        account_id: Optional[str] = None,
        sort_by: str = "timestamp",
        sort_order: str = "DESC"
    ) -> Dict[str, Any]:
        """Get transactions with pagination and filters."""
        try:
            offset = (page - 1) * page_size
            parameters = {
                "search": search,
                "risk_level": risk_level,
                "date_from": date_from.isoformat() if date_from else None,
                "date_to": date_to.isoformat() if date_to else None,
                "customer_id": customer_id,
                "account_id": account_id,
                "offset": offset,
                "limit": page_size,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
            
            # Get transactions
            transactions_result = await self.db.execute_read(
                self.queries.GET_TRANSACTIONS,
                parameters
            )
            
            # Get total count
            count_result = await self.db.execute_read(
                self.queries.GET_TRANSACTIONS_COUNT,
                parameters
            )
            
            total = count_result[0]["total"] if count_result else 0
            
            return {
                "transactions": [t["transaction"] for t in transactions_result],
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size
            }
        except Exception as e:
            logger.error("Failed to get transactions", error=str(e))
            return {"transactions": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}
    
    async def create_transaction(self, transaction_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new transaction."""
        try:
            result = await self.db.execute_write(
                self.queries.CREATE_TRANSACTION,
                transaction_data
            )
            return result[0] if result else None
        except Exception as e:
            logger.error("Failed to create transaction", error=str(e))
            return None
    
    # Alert operations
    async def get_alert_by_id(self, alert_id: str) -> Optional[Dict[str, Any]]:
        """Get alert by ID."""
        try:
            result = await self.db.execute_read(
                self.queries.GET_ALERT_BY_ID,
                {"alert_id": alert_id}
            )
            if result:
                alert = result[0]["alert"]
                alert["transaction"] = result[0]["transaction"]
                alert["customer"] = result[0]["customer"]
                return alert
            return None
        except Exception as e:
            logger.error("Failed to get alert", alert_id=alert_id, error=str(e))
            return None
    
    async def get_alerts(
        self,
        page: int = 1,
        page_size: int = 20,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        alert_type: Optional[str] = None,
        assigned_to: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sort_by: str = "created_at",
        sort_order: str = "DESC"
    ) -> Dict[str, Any]:
        """Get alerts with pagination and filters."""
        try:
            offset = (page - 1) * page_size
            parameters = {
                "severity": severity,
                "status": status,
                "alert_type": alert_type,
                "assigned_to": assigned_to,
                "date_from": date_from.isoformat() if date_from else None,
                "date_to": date_to.isoformat() if date_to else None,
                "offset": offset,
                "limit": page_size,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
            
            # Get alerts
            alerts_result = await self.db.execute_read(
                self.queries.GET_ALERTS,
                parameters
            )
            
            # Get total count
            count_result = await self.db.execute_read(
                self.queries.GET_ALERTS_COUNT,
                parameters
            )
            
            total = count_result[0]["total"] if count_result else 0
            
            return {
                "alerts": [a["alert"] for a in alerts_result],
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size
            }
        except Exception as e:
            logger.error("Failed to get alerts", error=str(e))
            return {"alerts": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}

    async def get_alerts_overview(
        self,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        alert_type: Optional[str] = None,
        assigned_to: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get alerts overview with severity counts and total count."""
        try:
            parameters = {
                "severity": severity,
                "status": status,
                "alert_type": alert_type,
                "assigned_to": assigned_to,
                "date_from": date_from.isoformat() if date_from else None,
                "date_to": date_to.isoformat() if date_to else None
            }
            
            # Get total count
            count_result = await self.db.execute_read(
                self.queries.GET_ALERTS_COUNT,
                parameters
            )
            
            # Get severity counts
            severity_count_result = await self.db.execute_read(
                self.queries.GET_ALERTS_SEVERITY_COUNT,
                parameters
            )
            
            total = count_result[0]["total"] if count_result else 0
            severity_count = severity_count_result[0]["severity_count"] if severity_count_result else {
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
                "info": 0
            }
            
            return {
                "total": total,
                "severity_count": severity_count
            }
        except Exception as e:
            logger.error("Failed to get alerts overview", error=str(e))
            return {
                "total": 0,
                "severity_count": {
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                    "info": 0
                }
            }
    
    async def create_alert(self, alert_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new alert."""
        try:
            result = await self.db.execute_write(
                self.queries.CREATE_ALERT,
                alert_data
            )
            return result[0] if result else None
        except Exception as e:
            logger.error("Failed to create alert", error=str(e))
            return None
    
    async def update_alert(self, alert_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an alert."""
        try:
            update_data["alert_id"] = alert_id
            result = await self.db.execute_write(
                self.queries.UPDATE_ALERT,
                update_data
            )
            return result[0] if result else None
        except Exception as e:
            logger.error("Failed to update alert", alert_id=alert_id, error=str(e))
            return None
    
    # Metrics operations
    async def get_overview_metrics(self) -> Dict[str, Any]:
        """Get overview metrics."""
        try:
            logger.info("Executing overview metrics query", query=self.queries.GET_OVERVIEW_METRICS)
            result = await self.db.execute_read(self.queries.GET_OVERVIEW_METRICS)
            # logger.info("Overview metrics query result", result=result)
            if result:
                return result[0]
            return {}
        except Exception as e:
            logger.error("Failed to get overview metrics", error=str(e))
            return {}
    
    async def get_transactions_by_hour(
        self,
        date_from: datetime,
        date_to: datetime
    ) -> List[Dict[str, Any]]:
        """Get transaction counts by hour."""
        try:
            result = await self.db.execute_read(
                self.queries.GET_TRANSACTIONS_BY_HOUR,
                {
                    "date_from": date_from.isoformat(),
                    "date_to": date_to.isoformat()
                }
            )
            return result
        except Exception as e:
            logger.error("Failed to get transactions by hour", error=str(e))
            return []

    async def get_transactions_by_day_30min(self) -> List[Dict[str, Any]]:
        """Get transaction counts by 30-minute intervals for the last day."""
        try:
            result = await self.db.execute_read(
                self.queries.GET_TRANSACTIONS_BY_DAY_30MIN,
                {}
            )
            return result
        except Exception as e:
            logger.error("Failed to get transactions by day (30min)", error=str(e))
            return []

    async def get_transactions_by_week_8hour(self) -> List[Dict[str, Any]]:
        """Get transaction counts by 8-hour intervals for the last week."""
        try:
            result = await self.db.execute_read(
                self.queries.GET_TRANSACTIONS_BY_WEEK_8HOUR,
                {}
            )
            return result
        except Exception as e:
            logger.error("Failed to get transactions by week (8hour)", error=str(e))
            return []

    async def get_transactions_by_month_day(self) -> List[Dict[str, Any]]:
        """Get transaction counts by day for the last month."""
        try:
            result = await self.db.execute_read(
                self.queries.GET_TRANSACTIONS_BY_MONTH_DAY,
                {}
            )
            return result
        except Exception as e:
            logger.error("Failed to get transactions by month (day)", error=str(e))
            return []

    async def get_transactions_by_3months_2day(self) -> List[Dict[str, Any]]:
        """Get transaction counts by 2-day intervals for the last 3 months."""
        try:
            result = await self.db.execute_read(
                self.queries.GET_TRANSACTIONS_BY_3MONTHS_2DAY,
                {}
            )
            return result
        except Exception as e:
            logger.error("Failed to get transactions by 3 months (2day)", error=str(e))
            return []

    async def get_transactions_by_year_day(self) -> List[Dict[str, Any]]:
        """Get transaction counts by day for the last year."""
        try:
            result = await self.db.execute_read(
                self.queries.GET_TRANSACTIONS_BY_YEAR_DAY,
                {}
            )
            return result
        except Exception as e:
            logger.error("Failed to get transactions by year (day)", error=str(e))
            return []
    
    async def get_risk_distribution(
        self,
        date_from: datetime,
        date_to: datetime
    ) -> List[Dict[str, Any]]:
        """Get risk distribution."""
        try:
            result = await self.db.execute_read(
                self.queries.GET_RISK_DISTRIBUTION,
                {
                    "date_from": date_from.isoformat(),
                    "date_to": date_to.isoformat()
                }
            )
            return result
        except Exception as e:
            logger.error("Failed to get risk distribution", error=str(e))
            return []
    
    # Relationship operations
    async def create_owns_relationship(self, customer_id: str, account_id: str) -> bool:
        """Create OWNS relationship between customer and account."""
        try:
            await self.db.execute_write(
                self.queries.CREATE_OWNS_RELATIONSHIP,
                {"customer_id": customer_id, "account_id": account_id}
            )
            return True
        except Exception as e:
            logger.error("Failed to create OWNS relationship", error=str(e))
            return False
    
    async def create_alerts_relationship(self, alert_id: str, target_id: str) -> bool:
        """Create ALERTS relationship between alert and target."""
        try:
            await self.db.execute_write(
                self.queries.CREATE_ALERTS_RELATIONSHIP,
                {"alert_id": alert_id, "target_id": target_id}
            )
            return True
        except Exception as e:
            logger.error("Failed to create ALERTS relationship", error=str(e))
            return False


# Global repository instance
memgraph_repo = MemgraphRepository()
