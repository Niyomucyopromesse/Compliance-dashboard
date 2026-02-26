"""Service for metrics and analytics operations."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from ..repositories.memgraph_repo import memgraph_repo
from ..models.schemas import OverviewMetrics, TimeSeriesPoint, RiskDistribution
from ..logging_config import get_logger

logger = get_logger(__name__)


class MetricsService:
    """Service for metrics and analytics operations."""
    
    def __init__(self):
        self.repo = memgraph_repo
    
    async def get_overview_metrics(self) -> OverviewMetrics:
        """Get overview metrics for the dashboard."""
        try:
            raw_metrics = await self.repo.get_overview_metrics()
            
            if not raw_metrics:
                return OverviewMetrics(
                    total_transactions=0,
                    flagged_transactions=0,
                    total_customers=0,
                    total_accounts=0,
                    transactions_last_24h=0,
                    high_risk_customers=0,
                    total_alerts=0,
                    unresolved_alerts=0,
                    total_amount=0.0,
                    flagged_amount=0.0,
                    fraud_rate=0.0,
                    detection_rate=0.0
                )
            
            return OverviewMetrics(
                total_transactions=raw_metrics.get("total_transactions", 0),
                flagged_transactions=raw_metrics.get("flagged_transactions", 0),
                total_customers=raw_metrics.get("total_customers", 0),
                total_accounts=raw_metrics.get("total_accounts", 0),
                transactions_last_24h=raw_metrics.get("transactions_last_24h", 0),
                high_risk_customers=raw_metrics.get("high_risk_customers", 0),
                total_alerts=raw_metrics.get("total_alerts", 0),
                unresolved_alerts=raw_metrics.get("unresolved_alerts", 0),
                total_amount=raw_metrics.get("total_amount", 0.0),
                flagged_amount=raw_metrics.get("flagged_amount", 0.0),
                fraud_rate=raw_metrics.get("fraud_rate", 0.0),
                detection_rate=raw_metrics.get("detection_rate", 0.0)
            )
        except Exception as e:
            logger.error("Failed to get overview metrics", error=str(e))
            return OverviewMetrics(
                total_transactions=0,
                flagged_transactions=0,
                total_customers=0,
                total_accounts=0,
                transactions_last_24h=0,
                high_risk_customers=0,
                total_alerts=0,
                unresolved_alerts=0,
                total_amount=0.0,
                flagged_amount=0.0,
                fraud_rate=0.0,
                detection_rate=0.0
            )
    
    async def get_transactions_chart(
        self,
        period: str = "24h",
        granularity: str = "hour"
    ) -> List[TimeSeriesPoint]:
        """Get transaction chart data."""
        try:
            # Calculate date range based on period
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
            
            date_to = now
            
            # Get raw data
            raw_data = await self.repo.get_transactions_by_hour(date_from, date_to)
            # Convert to TimeSeriesPoint objects
            points = []
            for item in raw_data:
                # Convert Neo4j DateTime to Python datetime
                neo4j_datetime = item["hour"]
                timestamp = datetime(
                    neo4j_datetime.year,
                    neo4j_datetime.month,
                    neo4j_datetime.day,
                    neo4j_datetime.hour,
                    neo4j_datetime.minute,
                    neo4j_datetime.second
                )
                points.append(TimeSeriesPoint(
                    timestamp=timestamp,
                    value=item["cnt"],
                    label=timestamp.strftime("%H:%M"),
                    channel=item.get("channel")
                ))
            return points
        except Exception as e:
            logger.error("Failed to get transactions chart", error=str(e))
            return []

    async def get_transactions_chart_by_day_30min(self) -> List[TimeSeriesPoint]:
        """Get transaction chart data by 30-minute intervals for the last day."""
        try:
            raw_data = await self.repo.get_transactions_by_day_30min()
            points = []
            for item in raw_data:
                neo4j_datetime = item["time"]
                timestamp = datetime(
                    neo4j_datetime.year,
                    neo4j_datetime.month,
                    neo4j_datetime.day,
                    neo4j_datetime.hour,
                    neo4j_datetime.minute,
                    neo4j_datetime.second
                )
                points.append(TimeSeriesPoint(
                    timestamp=timestamp,
                    value=item["cnt"],
                    label=timestamp.strftime("%H:%M"),
                    channel=item.get("channel"),
                    total_amount=item.get("total_amount"),
                    avg_amount=item.get("avg_amount")
                ))
            return points
        except Exception as e:
            logger.error("Failed to get transactions chart by day (30min)", error=str(e))
            return []

    async def get_transactions_chart_by_week_8hour(self) -> List[TimeSeriesPoint]:
        """Get transaction chart data by 8-hour intervals for the last week."""
        try:
            raw_data = await self.repo.get_transactions_by_week_8hour()
            points = []
            for item in raw_data:
                neo4j_datetime = item["time"]
                timestamp = datetime(
                    neo4j_datetime.year,
                    neo4j_datetime.month,
                    neo4j_datetime.day,
                    neo4j_datetime.hour,
                    neo4j_datetime.minute,
                    neo4j_datetime.second
                )
                points.append(TimeSeriesPoint(
                    timestamp=timestamp,
                    value=item["cnt"],
                    label=timestamp.strftime("%m/%d %H:%M"),
                    channel=item.get("channel"),
                    total_amount=item.get("total_amount"),
                    avg_amount=item.get("avg_amount")
                ))
            return points
        except Exception as e:
            logger.error("Failed to get transactions chart by week (8hour)", error=str(e))
            return []

    async def get_transactions_chart_by_month_day(self) -> List[TimeSeriesPoint]:
        """Get transaction chart data by day for the last month."""
        try:
            raw_data = await self.repo.get_transactions_by_month_day()
            points = []
            for item in raw_data:
                neo4j_datetime = item["time"]
                timestamp = datetime(
                    neo4j_datetime.year,
                    neo4j_datetime.month,
                    neo4j_datetime.day,
                    neo4j_datetime.hour,
                    neo4j_datetime.minute,
                    neo4j_datetime.second
                )
                points.append(TimeSeriesPoint(
                    timestamp=timestamp,
                    value=item["cnt"],
                    label=timestamp.strftime("%m/%d %H:%M"),
                    channel=item.get("channel"),
                    total_amount=item.get("total_amount"),
                    avg_amount=item.get("avg_amount")
                ))
            return points
        except Exception as e:
            logger.error("Failed to get transactions chart by month (day)", error=str(e))
            return []

    async def get_transactions_chart_by_3months_2day(self) -> List[TimeSeriesPoint]:
        """Get transaction chart data by 2-day intervals for the last 3 months."""
        try:
            raw_data = await self.repo.get_transactions_by_3months_2day()
            points = []
            for item in raw_data:
                neo4j_datetime = item["time"]
                timestamp = datetime(
                    neo4j_datetime.year,
                    neo4j_datetime.month,
                    neo4j_datetime.day,
                    neo4j_datetime.hour,
                    neo4j_datetime.minute,
                    neo4j_datetime.second
                )
                points.append(TimeSeriesPoint(
                    timestamp=timestamp,
                    value=item["cnt"],
                    label=timestamp.strftime("%m/%d"),
                    channel=item.get("channel"),
                    total_amount=item.get("total_amount"),
                    avg_amount=item.get("avg_amount")
                ))
            return points
        except Exception as e:
            logger.error("Failed to get transactions chart by 3 months (2day)", error=str(e))
            return []

    async def get_transactions_chart_by_year_day(self) -> List[TimeSeriesPoint]:
        """Get transaction chart data by day for the last year."""
        try:
            raw_data = await self.repo.get_transactions_by_year_day()
            points = []
            for item in raw_data:
                neo4j_datetime = item["time"]
                timestamp = datetime(
                    neo4j_datetime.year,
                    neo4j_datetime.month,
                    neo4j_datetime.day,
                    neo4j_datetime.hour,
                    neo4j_datetime.minute,
                    neo4j_datetime.second
                )
                points.append(TimeSeriesPoint(
                    timestamp=timestamp,
                    value=item["cnt"],
                    label=timestamp.strftime("%m/%d"),
                    channel=item.get("channel"),
                    total_amount=item.get("total_amount"),
                    avg_amount=item.get("avg_amount")
                ))
            return points
        except Exception as e:
            logger.error("Failed to get transactions chart by year (day)", error=str(e))
            return []
    
    async def get_risk_distribution(
        self,
        period: str = "24h"
    ) -> List[RiskDistribution]:
        """Get risk distribution data."""
        try:
            # Calculate date range based on period
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
            
            date_to = now
            
            # Get raw data
            raw_data = await self.repo.get_risk_distribution(date_from, date_to)
            
            # Convert to RiskDistribution objects
            distributions = []
            for item in raw_data:
                distributions.append(RiskDistribution(
                    label=item["label"],
                    count=item["count"],
                    percentage=item["percentage"]
                ))
            
            return distributions
        except Exception as e:
            logger.error("Failed to get risk distribution", error=str(e))
            return []
    
    async def get_customer_metrics(self, customer_id: str) -> Dict[str, Any]:
        """Get metrics for a specific customer."""
        try:
            # Get customer data
            customer = await self.repo.get_customer_by_id(customer_id)
            if not customer:
                return {}
            
            # Get account data
            accounts_data = await self.repo.get_accounts(customer_id=customer_id, page_size=1000)
            accounts = accounts_data.get("accounts", [])
            
            # Calculate metrics
            total_balance = sum(account.get("balance", 0) for account in accounts)
            account_count = len(accounts)
            
            # Get transaction data for last 30 days
            date_from = datetime.utcnow() - timedelta(days=30)
            transactions_data = await self.repo.get_transactions(
                customer_id=customer_id,
                date_from=date_from,
                page_size=1000
            )
            transactions = transactions_data.get("transactions", [])
            
            # Calculate transaction metrics
            total_transactions = len(transactions)
            total_amount = sum(tx.get("amount", 0) for tx in transactions)
            high_risk_transactions = len([tx for tx in transactions if tx.get("risk_label") in ["Critical", "High"]])
            
            return {
                "customer_id": customer_id,
                "name": customer.get("name"),
                "email": customer.get("email"),
                "risk_score": customer.get("risk_score", 0),
                "risk_label": customer.get("risk_label"),
                "status": customer.get("status"),
                "account_count": account_count,
                "total_balance": total_balance,
                "total_transactions_30d": total_transactions,
                "total_amount_30d": total_amount,
                "high_risk_transactions_30d": high_risk_transactions,
                "fraud_rate_30d": high_risk_transactions / total_transactions if total_transactions > 0 else 0
            }
        except Exception as e:
            logger.error("Failed to get customer metrics", customer_id=customer_id, error=str(e))
            return {}
    
    async def get_account_metrics(self, account_id: str) -> Dict[str, Any]:
        """Get metrics for a specific account."""
        try:
            # Get account data
            account = await self.repo.get_account_by_id(account_id)
            if not account:
                return {}
            
            # Get transaction data for last 30 days
            date_from = datetime.utcnow() - timedelta(days=30)
            transactions_data = await self.repo.get_transactions(
                account_id=account_id,
                date_from=date_from,
                page_size=1000
            )
            transactions = transactions_data.get("transactions", [])
            
            # Calculate metrics
            total_transactions = len(transactions)
            total_amount_in = sum(tx.get("amount", 0) for tx in transactions if tx.get("to_account") == account_id)
            total_amount_out = sum(tx.get("amount", 0) for tx in transactions if tx.get("from_account") == account_id)
            high_risk_transactions = len([tx for tx in transactions if tx.get("risk_label") in ["Critical", "High"]])
            
            return {
                "account_id": account_id,
                "account_number": account.get("account_number"),
                "account_type": account.get("account_type"),
                "balance": account.get("balance", 0),
                "currency": account.get("currency"),
                "risk_score": account.get("risk_score", 0),
                "risk_label": account.get("risk_label"),
                "status": account.get("status"),
                "total_transactions_30d": total_transactions,
                "total_amount_in_30d": total_amount_in,
                "total_amount_out_30d": total_amount_out,
                "high_risk_transactions_30d": high_risk_transactions,
                "fraud_rate_30d": high_risk_transactions / total_transactions if total_transactions > 0 else 0
            }
        except Exception as e:
            logger.error("Failed to get account metrics", account_id=account_id, error=str(e))
            return {}


# Global service instance
metrics_service = MetricsService()
