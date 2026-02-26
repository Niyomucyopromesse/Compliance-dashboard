"""Alerts API endpoints."""

from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..deps import get_pagination_params, get_search_params
from ...services.alerts_service import alerts_service
from ...models.schemas import (
    Alert, AlertResponse, AlertListResponse, 
    SearchParams, AlertUpdate, AlertAction, AlertCreate
)
from ...logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/", response_model=AlertListResponse)
async def get_alerts(
    pagination: Dict[str, Any] = Depends(get_pagination_params),
    search: Dict[str, Any] = Depends(get_search_params)
):
    """Get alerts with pagination and filters."""
    try:
        # Combine pagination and search parameters
        params = SearchParams(**pagination, **search)
        
        result = await alerts_service.get_alerts(params)
        
        return AlertListResponse(
            success=True,
            data=result["alerts"],
            pagination={
                "total": result["total"],
                "page": result["page"],
                "page_size": result["page_size"],
                "total_pages": result["total_pages"]
            }
        )
    except Exception as e:
        logger.error("Failed to get alerts", error=str(e))
        return AlertListResponse(
            success=False,
            message="Failed to retrieve alerts",
            data=[],
            pagination={"total": 0, "page": 1, "page_size": 20, "total_pages": 0}
        )


@router.get("/overview")
async def get_alerts_overview(
    severity: Optional[str] = Query(None, description="Filter by severity"),
    status: Optional[str] = Query(None, description="Filter by status"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned user"),
    date_from: Optional[str] = Query(None, description="Filter from date (ISO format)"),
    date_to: Optional[str] = Query(None, description="Filter to date (ISO format)")
):
    """Get alerts overview with severity counts and total count."""
    try:
        # Parse date parameters
        parsed_date_from = None
        parsed_date_to = None
        
        if date_from:
            try:
                parsed_date_from = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date_from format. Use ISO format (e.g., 2023-01-01T00:00:00Z)"
                )
        
        if date_to:
            try:
                parsed_date_to = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date_to format. Use ISO format (e.g., 2023-01-01T00:00:00Z)"
                )
        
        result = await alerts_service.get_alerts_overview(
            severity=severity,
            status=status,
            alert_type=alert_type,
            assigned_to=assigned_to,
            date_from=parsed_date_from,
            date_to=parsed_date_to
        )
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error("Failed to get alerts overview", error=str(e))
        return {
            "success": False,
            "message": "Failed to retrieve alerts overview",
            "data": {
                "total": 0,
                "severity_count": {
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                    "info": 0
                }
            }
        }


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str):
    """Get a specific alert by ID."""
    try:
        alert = await alerts_service.get_alert(alert_id)
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alert not found"
            )
        
        return AlertResponse(
            success=True,
            data=alert
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get alert", alert_id=alert_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve alert"
        )


@router.put("/{alert_id}")
async def update_alert(alert_id: str, update_data: AlertUpdate):
    """Update an alert."""
    try:
        alert = await alerts_service.update_alert(alert_id, update_data)
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alert not found"
            )
        
        return AlertResponse(
            success=True,
            data=alert,
            message="Alert updated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update alert", alert_id=alert_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update alert"
        )


@router.post("/bulk")
async def create_bulk_alerts(alert_payload: Dict[str, Any]):
    """Create multiple alerts from fraud detection service."""
    try:
        alerts_data = alert_payload.get('alerts', [])
        transaction_data = alert_payload.get('transaction_data', {})
        source = alert_payload.get('source', 'unknown')
        
        logger.info(f"Processing bulk alerts from {source}: {len(alerts_data)} alerts")
        
        created_alerts = []
        for alert_data in alerts_data:
            try:
                # Use alert data directly without transformation since it now matches the unified schema
                alert_create = AlertCreate(**alert_data)
                
                # Create alert using unified schema
                alert = await alerts_service.create_alert(alert_create)
                if alert:
                    created_alerts.append(alert)
                    logger.info(f"Successfully created and broadcasted alert: {alert.alert_id}")
                    
            except Exception as e:
                logger.error("Failed to create individual alert", alert_data=alert_data, error=str(e))
                continue
        
        logger.info(f"Bulk alert creation completed: {len(created_alerts)}/{len(alerts_data)} alerts created and broadcasted")
        
        return {
            "success": True,
            "message": f"Created {len(created_alerts)} out of {len(alerts_data)} alerts",
            "created_count": len(created_alerts),
            "total_count": len(alerts_data)
        }
        
    except Exception as e:
        logger.error("Failed to create bulk alerts", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create bulk alerts"
        )




@router.post("/{alert_id}/actions")
async def perform_alert_action(alert_id: str, action: AlertAction):
    """Perform an action on an alert."""
    try:
        if action.action == "acknowledge":
            success = await alerts_service.acknowledge_alert(alert_id, action.notes)
        elif action.action == "escalate":
            success = await alerts_service.escalate_alert(alert_id, action.assigned_to or "system", action.notes)
        elif action.action == "resolve":
            success = await alerts_service.resolve_alert(alert_id, action.notes)
        elif action.action == "mark_false_positive":
            success = await alerts_service.mark_false_positive(alert_id, action.notes)
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
        logger.error("Failed to perform alert action", alert_id=alert_id, action=action.action, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform action"
        )