"""Service for alert operations."""

from typing import Dict, Any, List, Optional
from datetime import datetime
from ..repositories.memgraph_repo import memgraph_repo
from ..models.schemas import Alert, AlertCreate, AlertUpdate, SearchParams, WebSocketAlert
from ..utils.helpers import generate_alert_id
from ..logging_config import get_logger
from ..websockets.manager import connection_manager

logger = get_logger(__name__)


class AlertsService:
    """Service for alert operations."""
    
    def __init__(self):
        self.repo = memgraph_repo
    
    async def get_alert(self, alert_id: str) -> Optional[Alert]:
        """Get an alert by ID."""
        try:
            raw_alert = await self.repo.get_alert_by_id(alert_id)
            if not raw_alert:
                return None
            
            return Alert(**raw_alert)
        except Exception as e:
            logger.error("Failed to get alert", alert_id=alert_id, error=str(e))
            return None
    
    async def get_alerts(self, params: SearchParams) -> Dict[str, Any]:
        """Get alerts with pagination and filters."""
        try:
            raw_data = await self.repo.get_alerts(
                page=params.page,
                page_size=params.page_size,
                sort_by=params.sort_by or "timestamp",
                sort_order=params.sort_order.upper()
            )
            
            # Convert to Alert objects
            alerts = [Alert(**alert) for alert in raw_data.get("alerts", [])]
            
            return {
                "alerts": alerts,
                "total": raw_data.get("total", 0),
                "page": raw_data.get("page", 1),
                "page_size": raw_data.get("page_size", 20),
                "total_pages": raw_data.get("total_pages", 0)
            }
        except Exception as e:
            logger.error("Failed to get alerts", error=str(e))
            return {
                "alerts": [],
                "total": 0,
                "page": params.page,
                "page_size": params.page_size,
                "total_pages": 0
            }
    
    async def create_alert(self, alert_data: AlertCreate) -> Optional[Alert]:
        """Create a new alert."""
        try:
            # Generate alert ID if not provided
            if not alert_data.alert_id:
                alert_data.alert_id = generate_alert_id()
            
            # Convert to dict for database
            alert_dict = alert_data.dict()
            alert_dict["timestamp"] = alert_data.timestamp.isoformat()
            alert_dict["created_at"] = alert_data.timestamp.isoformat()
            alert_dict["updated_at"] = alert_data.timestamp.isoformat()
            
            # Create in database
            result = await self.repo.create_alert(alert_dict)
            if not result:
                return None
            
            # Create relationships if target IDs provided
            if alert_data.transaction_id:
                await self.repo.create_alerts_relationship(
                    alert_data.alert_id,
                    alert_data.transaction_id
                )
            
            if alert_data.customer_id:
                await self.repo.create_alerts_relationship(
                    alert_data.alert_id,
                    alert_data.customer_id
                )
            
            # Create Alert object for return
            created_alert = Alert(**alert_data.dict())
            
            # Broadcast alert via WebSocket
            try:
                websocket_alert = WebSocketAlert(
                    alert_id=alert_data.alert_id,
                    alert_type=alert_data.alert_type,
                    severity=alert_data.severity,
                    status=alert_data.status,
                    description=alert_data.description,
                    amount=alert_data.amount,
                    customer_id=alert_data.customer_id,
                    account_id=alert_data.account_id,
                    transaction_id=alert_data.transaction_id,
                    risk_score=alert_data.risk_score,
                    timestamp=alert_data.timestamp,
                    additional_data=alert_data.additional_data
                )
                
                await connection_manager.send_alert(websocket_alert)
                logger.info(f"Alert broadcasted via WebSocket: {alert_data.alert_id}")
                
            except Exception as ws_error:
                logger.error("Failed to broadcast alert via WebSocket", 
                           alert_id=alert_data.alert_id, error=str(ws_error))
                # Don't fail the alert creation if WebSocket broadcast fails
            
            return created_alert
        except Exception as e:
            logger.error("Failed to create alert", error=str(e))
            return None
    
    async def update_alert(self, alert_id: str, update_data: AlertUpdate) -> Optional[Alert]:
        """Update an alert."""
        try:
            # Prepare update data with updated_at timestamp
            update_dict = update_data.dict(exclude_unset=True)
            update_dict["updated_at"] = datetime.utcnow().isoformat()
            
            # Update in database
            result = await self.repo.update_alert(alert_id, update_dict)
            if not result:
                return None
            
            # Get the updated alert
            updated_alert = await self.repo.get_alert_by_id(alert_id)
            if updated_alert:
                return Alert(**updated_alert)
            return None
        except Exception as e:
            logger.error("Failed to update alert", alert_id=alert_id, error=str(e))
            return None
    
    async def acknowledge_alert(self, alert_id: str, notes: Optional[str] = None) -> bool:
        """Acknowledge an alert."""
        try:
            update_data = AlertUpdate(
                status="acknowledged",
                notes=notes
            )
            
            result = await self.update_alert(alert_id, update_data)
            return result is not None
        except Exception as e:
            logger.error("Failed to acknowledge alert", alert_id=alert_id, error=str(e))
            return False
    
    async def escalate_alert(self, alert_id: str, assigned_to: str, notes: Optional[str] = None) -> bool:
        """Escalate an alert."""
        try:
            update_data = AlertUpdate(
                status="investigating",
                assigned_to=assigned_to,
                notes=notes
            )
            
            result = await self.update_alert(alert_id, update_data)
            return result is not None
        except Exception as e:
            logger.error("Failed to escalate alert", alert_id=alert_id, error=str(e))
            return False
    
    async def resolve_alert(self, alert_id: str, notes: Optional[str] = None) -> bool:
        """Resolve an alert."""
        try:
            update_data = AlertUpdate(
                status="resolved",
                notes=notes
            )
            
            result = await self.update_alert(alert_id, update_data)
            return result is not None
        except Exception as e:
            logger.error("Failed to resolve alert", alert_id=alert_id, error=str(e))
            return False
    
    async def mark_false_positive(self, alert_id: str, notes: Optional[str] = None) -> bool:
        """Mark an alert as false positive."""
        try:
            update_data = AlertUpdate(
                status="false_positive",
                notes=notes
            )
            
            result = await self.update_alert(alert_id, update_data)
            return result is not None
        except Exception as e:
            logger.error("Failed to mark alert as false positive", alert_id=alert_id, error=str(e))
            return False

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
            result = await self.repo.get_alerts_overview(
                severity=severity,
                status=status,
                alert_type=alert_type,
                assigned_to=assigned_to,
                date_from=date_from,
                date_to=date_to
            )
            return result
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


# Global service instance
alerts_service = AlertsService()
