"""Mock database client for development without Memgraph."""

from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import random
from ..logging_config import get_logger

logger = get_logger(__name__)


class MockMemgraphClient:
    """Mock Memgraph client for development without database."""
    
    def __init__(self):
        self.mock_data = self._generate_mock_data()
    
    def _generate_mock_data(self) -> Dict[str, Any]:
        """Generate mock data for development."""
        customers = [
            {
                "customer_id": "cust-001",
                "name": "John Smith",
                "email": "john.smith@example.com",
                "phone": "+1-555-0101",
                "address": "123 Main St, New York, NY 10001",
                "risk_score": 0.2,
                "risk_label": "Low",
                "status": "active",
                "created_at": datetime.utcnow() - timedelta(days=30),
                "updated_at": datetime.utcnow() - timedelta(days=1),
                "accounts": [
                    {
                        "account_id": "acc-001",
                        "account_number": "ACC1001",
                        "account_type": "checking",
                        "balance": 5000.0,
                        "currency": "USD",
                        "risk_score": 0.2,
                        "risk_label": "Low",
                        "status": "active"
                    }
                ]
            },
            {
                "customer_id": "cust-002",
                "name": "Jane Doe",
                "email": "jane.doe@example.com",
                "phone": "+1-555-0102",
                "address": "456 Oak Ave, Los Angeles, CA 90210",
                "risk_score": 0.7,
                "risk_label": "High",
                "status": "active",
                "created_at": datetime.utcnow() - timedelta(days=25),
                "updated_at": datetime.utcnow() - timedelta(days=2),
                "accounts": [
                    {
                        "account_id": "acc-002",
                        "account_number": "ACC1002",
                        "account_type": "savings",
                        "balance": 15000.0,
                        "currency": "USD",
                        "risk_score": 0.7,
                        "risk_label": "High",
                        "status": "active"
                    }
                ]
            }
        ]
        
        transactions = []
        for i in range(50):
            transactions.append({
                "tx_id": f"tx-{i+1:03d}",
                "timestamp": datetime.utcnow() - timedelta(hours=i),
                "from_account": f"acc-{(i % 2) + 1:03d}",
                "to_account": f"acc-{((i + 1) % 2) + 1:03d}",
                "amount": random.uniform(100, 5000),
                "currency": "USD",
                "type": "transfer",
                "risk_score": random.uniform(0.1, 0.9),
                "risk_label": "High" if random.random() > 0.7 else "Low",
                "status": "completed",
                "alert_id": f"alert-{i+1:03d}" if random.random() > 0.8 else None,
                "meta": {
                    "transaction_type": "wire_transfer",
                    "channel": "online",
                    "device_id": f"device_{i % 5}",
                    "ip_address": f"192.168.1.{i % 255}"
                }
            })
        
        alerts = []
        for i in range(10):
            alerts.append({
                "alert_id": f"alert-{i+1:03d}",
                "alert_type": "suspicious_transaction",
                "severity": "high" if random.random() > 0.5 else "medium",
                "status": "new",
                "description": f"Suspicious transaction pattern detected: ${random.uniform(1000, 10000):.2f}",
                "risk_score": random.uniform(0.7, 0.9),
                "assigned_to": None,
                "notes": None,
                "created_at": datetime.utcnow() - timedelta(hours=i*2),
                "updated_at": datetime.utcnow() - timedelta(hours=i*2)
            })
        
        return {
            "customers": customers,
            "transactions": transactions,
            "alerts": alerts
        }
    
    async def get_health_metrics(self) -> Dict[str, Any]:
        """Get mock health metrics."""
        return {
            "customers": len(self.mock_data["customers"]),
            "accounts": sum(len(c["accounts"]) for c in self.mock_data["customers"]),
            "transactions": len(self.mock_data["transactions"]),
            "alerts": len(self.mock_data["alerts"]),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def get_transaction_by_id(self, tx_id: str) -> Optional[Dict[str, Any]]:
        """Get mock transaction by ID."""
        for tx in self.mock_data["transactions"]:
            if tx["tx_id"] == tx_id:
                return tx
        return None
    
    async def get_customer_by_id(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get mock customer by ID."""
        for customer in self.mock_data["customers"]:
            if customer["customer_id"] == customer_id:
                return customer
        return None
    
    async def get_account_by_id(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Get mock account by ID."""
        for customer in self.mock_data["customers"]:
            for account in customer["accounts"]:
                if account["account_id"] == account_id:
                    return {
                        **account,
                        "customer": {
                            "customer_id": customer["customer_id"],
                            "name": customer["name"],
                            "email": customer["email"]
                        }
                    }
        return None
    
    async def get_alert_by_id(self, alert_id: str) -> Optional[Dict[str, Any]]:
        """Get mock alert by ID."""
        for alert in self.mock_data["alerts"]:
            if alert["alert_id"] == alert_id:
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
        """Search mock transactions."""
        transactions = self.mock_data["transactions"].copy()
        
        # Apply filters
        if search:
            transactions = [tx for tx in transactions if search.lower() in tx["tx_id"].lower()]
        
        if risk_level:
            transactions = [tx for tx in transactions if tx["risk_label"].lower() == risk_level.lower()]
        
        # Sort
        reverse = sort_order.upper() == "DESC"
        if sort_by == "timestamp":
            transactions.sort(key=lambda x: x["timestamp"], reverse=reverse)
        elif sort_by == "amount":
            transactions.sort(key=lambda x: x["amount"], reverse=reverse)
        
        # Paginate
        total = len(transactions)
        transactions = transactions[offset:offset + limit]
        
        return {
            "transactions": transactions,
            "total": total,
            "page": (offset // limit) + 1,
            "page_size": limit,
            "total_pages": (total + limit - 1) // limit
        }
    
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
        """Get mock customers."""
        customers = self.mock_data["customers"].copy()
        
        # Apply filters
        if search:
            customers = [c for c in customers if search.lower() in c["name"].lower() or search.lower() in c["email"].lower()]
        
        if risk_level:
            customers = [c for c in customers if c["risk_label"].lower() == risk_level.lower()]
        
        if status:
            customers = [c for c in customers if c["status"].lower() == status.lower()]
        
        # Sort
        reverse = sort_order.upper() == "DESC"
        if sort_by == "created_at":
            customers.sort(key=lambda x: x["created_at"], reverse=reverse)
        elif sort_by == "name":
            customers.sort(key=lambda x: x["name"], reverse=reverse)
        
        # Paginate
        total = len(customers)
        offset = (page - 1) * page_size
        customers = customers[offset:offset + page_size]
        
        return {
            "customers": customers,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    
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
        """Get mock accounts."""
        accounts = []
        for customer in self.mock_data["customers"]:
            for account in customer["accounts"]:
                account_with_customer = {
                    **account,
                    "customer": {
                        "customer_id": customer["customer_id"],
                        "name": customer["name"],
                        "email": customer["email"]
                    }
                }
                accounts.append(account_with_customer)
        
        # Apply filters
        if customer_id:
            accounts = [a for a in accounts if a["customer"]["customer_id"] == customer_id]
        
        if account_type:
            accounts = [a for a in accounts if a["account_type"].lower() == account_type.lower()]
        
        if risk_level:
            accounts = [a for a in accounts if a["risk_label"].lower() == risk_level.lower()]
        
        if status:
            accounts = [a for a in accounts if a["status"].lower() == status.lower()]
        
        # Sort
        reverse = sort_order.upper() == "DESC"
        if sort_by == "created_at":
            accounts.sort(key=lambda x: x.get("created_at", datetime.utcnow()), reverse=reverse)
        elif sort_by == "balance":
            accounts.sort(key=lambda x: x["balance"], reverse=reverse)
        
        # Paginate
        total = len(accounts)
        offset = (page - 1) * page_size
        accounts = accounts[offset:offset + page_size]
        
        return {
            "accounts": accounts,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    
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
        """Get mock alerts."""
        alerts = self.mock_data["alerts"].copy()
        
        # Apply filters
        if severity:
            alerts = [a for a in alerts if a["severity"].lower() == severity.lower()]
        
        if status:
            alerts = [a for a in alerts if a["status"].lower() == status.lower()]
        
        if alert_type:
            alerts = [a for a in alerts if a["alert_type"].lower() == alert_type.lower()]
        
        # Sort
        reverse = sort_order.upper() == "DESC"
        if sort_by == "created_at":
            alerts.sort(key=lambda x: x["created_at"], reverse=reverse)
        elif sort_by == "severity":
            severity_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
            alerts.sort(key=lambda x: severity_order.get(x["severity"].lower(), 0), reverse=reverse)
        
        # Paginate
        total = len(alerts)
        offset = (page - 1) * page_size
        alerts = alerts[offset:offset + page_size]
        
        return {
            "alerts": alerts,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    
    async def get_overview_metrics(self) -> Dict[str, Any]:
        """Get mock overview metrics."""
        transactions = self.mock_data["transactions"]
        customers = self.mock_data["customers"]
        alerts = self.mock_data["alerts"]
        
        total_transactions = len(transactions)
        flagged_transactions = len([t for t in transactions if t["risk_label"] in ["Critical", "High"]])
        total_customers = len(customers)
        high_risk_customers = len([c for c in customers if c["risk_label"] in ["Critical", "High"]])
        total_alerts = len(alerts)
        unresolved_alerts = len([a for a in alerts if a["status"] == "new"])
        total_amount = sum(t["amount"] for t in transactions)
        flagged_amount = sum(t["amount"] for t in transactions if t["risk_label"] in ["Critical", "High"])
        
        return {
            "total_transactions": total_transactions,
            "flagged_transactions": flagged_transactions,
            "total_customers": total_customers,
            "high_risk_customers": high_risk_customers,
            "total_alerts": total_alerts,
            "unresolved_alerts": unresolved_alerts,
            "total_amount": total_amount,
            "flagged_amount": flagged_amount,
            "fraud_rate": flagged_transactions / total_transactions if total_transactions > 0 else 0,
            "detection_rate": flagged_transactions / total_transactions if total_transactions > 0 else 0
        }
    
    async def get_transactions_by_hour(
        self,
        date_from: datetime,
        date_to: datetime
    ) -> List[Dict[str, Any]]:
        """Get mock transactions by hour."""
        # Generate mock hourly data
        hours = []
        current = date_from.replace(minute=0, second=0, microsecond=0)
        while current <= date_to:
            count = random.randint(5, 25)
            hours.append({
                "ts": current.isoformat(),
                "cnt": count
            })
            current += timedelta(hours=1)
        return hours
    
    async def get_risk_distribution(
        self,
        date_from: datetime,
        date_to: datetime
    ) -> List[Dict[str, Any]]:
        """Get mock risk distribution."""
        return [
            {"label": "Low", "count": 35, "percentage": 70.0},
            {"label": "Medium", "count": 10, "percentage": 20.0},
            {"label": "High", "count": 4, "percentage": 8.0},
            {"label": "Critical", "count": 1, "percentage": 2.0}
        ]


# Global mock client instance
mock_client = MockMemgraphClient()
