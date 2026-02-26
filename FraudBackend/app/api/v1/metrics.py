"""Metrics API endpoints."""

from typing import Dict, Any
from fastapi import APIRouter, Depends, Query
from ..deps import get_pagination_params, get_search_params
from ...services.metrics_service import metrics_service
from ...models.schemas import MetricsResponse, OverviewMetrics, TimeSeriesPoint, RiskDistribution
from ...logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/overview", response_model=MetricsResponse)
async def get_overview_metrics():
    """Get overview metrics for the dashboard."""
    try:
        metrics = await metrics_service.get_overview_metrics()
        return MetricsResponse(
            success=True,
            data=metrics
        )
    except Exception as e:
        logger.error("Failed to get overview metrics", error=str(e))
        return MetricsResponse(
            success=False,
            message="Failed to retrieve overview metrics"
        )


@router.get("/transactions-chart", response_model=MetricsResponse)
async def get_transactions_chart(
    period: str = Query("24h", description="Time period for the chart"),
    granularity: str = Query("hour", description="Data granularity")
):
    """Get transaction chart data."""
    try:
        chart_data = await metrics_service.get_transactions_chart(period, granularity)
        return MetricsResponse(
            success=True,
            data=chart_data
        )
    except Exception as e:
        logger.error("Failed to get transactions chart", error=str(e))
        return MetricsResponse(
            success=False,
            message="Failed to retrieve transaction chart data"
        )

@router.get("/transactions-chart/day-30min", response_model=MetricsResponse)
async def get_transactions_chart_day_30min():
    """Get transaction chart data by 30-minute intervals for the last day."""
    try:
        chart_data = await metrics_service.get_transactions_chart_by_day_30min()
        return MetricsResponse(
            success=True,
            data=chart_data
        )
    except Exception as e:
        logger.error("Failed to get transactions chart by day (30min)", error=str(e))
        return MetricsResponse(
            success=False,
            message="Failed to retrieve transaction chart data"
        )

@router.get("/transactions-chart/week-8hour", response_model=MetricsResponse)
async def get_transactions_chart_week_8hour():
    """Get transaction chart data by 8-hour intervals for the last week."""
    try:
        chart_data = await metrics_service.get_transactions_chart_by_week_8hour()
        return MetricsResponse(
            success=True,
            data=chart_data
        )
    except Exception as e:
        logger.error("Failed to get transactions chart by week (8hour)", error=str(e))
        return MetricsResponse(
            success=False,
            message="Failed to retrieve transaction chart data"
        )

@router.get("/transactions-chart/month-day", response_model=MetricsResponse)
async def get_transactions_chart_month_day():
    """Get transaction chart data by day for the last month."""
    try:
        chart_data = await metrics_service.get_transactions_chart_by_month_day()
        return MetricsResponse(
            success=True,
            data=chart_data
        )
    except Exception as e:
        logger.error("Failed to get transactions chart by month (day)", error=str(e))
        return MetricsResponse(
            success=False,
            message="Failed to retrieve transaction chart data"
        )

@router.get("/transactions-chart/3months-2day", response_model=MetricsResponse)
async def get_transactions_chart_3months_2day():
    """Get transaction chart data by 2-day intervals for the last 3 months."""
    try:
        chart_data = await metrics_service.get_transactions_chart_by_3months_2day()
        return MetricsResponse(
            success=True,
            data=chart_data
        )
    except Exception as e:
        logger.error("Failed to get transactions chart by 3 months (2day)", error=str(e))
        return MetricsResponse(
            success=False,
            message="Failed to retrieve transaction chart data"
        )

@router.get("/transactions-chart/year-day", response_model=MetricsResponse)
async def get_transactions_chart_year_day():
    """Get transaction chart data by day for the last year."""
    try:
        chart_data = await metrics_service.get_transactions_chart_by_year_day()
        return MetricsResponse(
            success=True,
            data=chart_data
        )
    except Exception as e:
        logger.error("Failed to get transactions chart by year (day)", error=str(e))
        return MetricsResponse(
            success=False,
            message="Failed to retrieve transaction chart data"
        )


@router.get("/risk-distribution", response_model=MetricsResponse)
async def get_risk_distribution(
    period: str = Query("24h", description="Time period for the distribution")
):
    """Get risk distribution data."""
    try:
        distribution = await metrics_service.get_risk_distribution(period)
        return MetricsResponse(
            success=True,
            data=distribution
        )
    except Exception as e:
        logger.error("Failed to get risk distribution", error=str(e))
        return MetricsResponse(
            success=False,
            message="Failed to retrieve risk distribution data"
        )


@router.get("/customers/{customer_id}/metrics")
async def get_customer_metrics(customer_id: str):
    """Get metrics for a specific customer."""
    try:
        metrics = await metrics_service.get_customer_metrics(customer_id)
        return {
            "success": True,
            "data": metrics
        }
    except Exception as e:
        logger.error("Failed to get customer metrics", customer_id=customer_id, error=str(e))
        return {
            "success": False,
            "message": "Failed to retrieve customer metrics"
        }


@router.get("/accounts/{account_id}/metrics")
async def get_account_metrics(account_id: str):
    """Get metrics for a specific account."""
    try:
        metrics = await metrics_service.get_account_metrics(account_id)
        return {
            "success": True,
            "data": metrics
        }
    except Exception as e:
        logger.error("Failed to get account metrics", account_id=account_id, error=str(e))
        return {
            "success": False,
            "message": "Failed to retrieve account metrics"
        }
