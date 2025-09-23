"""Main FastAPI application."""

import asyncio
import json
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from .config import settings
from .logging_config import configure_logging, get_logger
from .db.connection import db_connection
from .db.memgraph_client import memgraph_client
from .db.mock_client import mock_client
from .repositories.memgraph_repo import memgraph_repo
from .websockets.manager import connection_manager
from .services.mock_data_service import mock_data_service
from .api.v1 import metrics, transactions, customers, accounts, alerts
from .api.deps import get_current_user

# Configure logging
configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting Fraud Detection Backend")
    
    try:
        # Try to initialize database connection
        try:
            await db_connection.connect()
            logger.info("Database connected")
            
            # Initialize Memgraph client
            await memgraph_client.initialize()
            # await memgraph_client.create_indexes()
            logger.info("Memgraph client initialized")
            
            # Initialize repository
            await memgraph_repo.initialize()
            logger.info("Repository initialized")
            
        except Exception as db_error:
            logger.error("Failed to connect to Memgraph database", error=str(db_error))
            raise db_error
        
        # Start WebSocket manager
        await connection_manager.start()
        logger.info("WebSocket manager started")
        
        # Start mock data service for demonstration (DISABLED - using real fraud service)
        # await mock_data_service.start()
        # logger.info("Mock data service started")
        
        logger.info("Application startup completed")
        
    except Exception as e:
        logger.error("Failed to start application", error=str(e))
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Fraud Detection Backend")
    
    try:
        # Stop mock data service (DISABLED - using real fraud service)
        # await mock_data_service.stop()
        # logger.info("Mock data service stopped")
        
        # Stop WebSocket manager
        await connection_manager.stop()
        logger.info("WebSocket manager stopped")
        
        # Disconnect from database
        await db_connection.disconnect()
        logger.info("Database disconnected")
        
        logger.info("Application shutdown completed")
        
    except Exception as e:
        logger.error("Error during shutdown", error=str(e))


# Create FastAPI application
app = FastAPI(
    title="Fraud Detection Backend",
    description="Backend API for fraud detection and monitoring system",
    version="1.0.0",
    docs_url="/docs" if settings.app_debug else None,
    redoc_url="/redoc" if settings.app_debug else None,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.app_debug else ["localhost", "127.0.0.1"]
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error": str(exc) if settings.app_debug else "An unexpected error occurred"
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Check database health
        try:
            db_healthy = await db_connection.health_check()
        except:
            # If database is not available, check if we're using mock client
            db_healthy = hasattr(memgraph_client, 'db') and memgraph_client.db == mock_client
        
        # Check WebSocket manager
        ws_healthy = len(connection_manager.active_connections) >= 0
        
        overall_health = db_healthy and ws_healthy
        
        return {
            "status": "healthy" if overall_health else "unhealthy",
            "database": "healthy" if db_healthy else "unhealthy",
            "websocket": "healthy" if ws_healthy else "unhealthy",
            "mode": "mock" if hasattr(memgraph_client, 'db') and memgraph_client.db == mock_client else "database",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )


# Include API routers
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])
app.include_router(transactions.router, prefix="/api/v1/transactions", tags=["transactions"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["customers"])
app.include_router(accounts.router, prefix="/api/v1/accounts", tags=["accounts"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])


# WebSocket endpoint
@app.websocket("/ws/monitor")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time monitoring."""
    connection_id = f"conn_{id(websocket)}"
    
    try:
        logger.info(f"WebSocket connection attempt from {websocket.client.host if websocket.client else 'unknown'}")
        await connection_manager.connect(websocket, connection_id)
        logger.info(f"WebSocket connected: {connection_id}")
        
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "subscribe":
                # Support both formats: {data: {type: "alerts"}} and {channel: "alerts"}
                subscription_type = message.get("data", {}).get("type") or message.get("channel")
                if subscription_type:
                    await connection_manager.subscribe(connection_id, subscription_type)
                    logger.info(f"Subscribed {connection_id} to {subscription_type}")
                    
                    # Send subscription acknowledgment
                    await connection_manager.send_personal_message({
                        "type": "subscribed",
                        "channel": subscription_type,
                        "data": {
                            "subscription": subscription_type,
                            "status": "subscribed"
                        },
                        "timestamp": datetime.utcnow().isoformat()
                    }, connection_id)
                    
            
            elif message.get("type") == "unsubscribe":
                # Support both formats: {data: {type: "alerts"}} and {channel: "alerts"}
                subscription_type = message.get("data", {}).get("type") or message.get("channel")
                if subscription_type:
                    await connection_manager.unsubscribe(connection_id, subscription_type)
                    logger.info(f"Unsubscribed {connection_id} from {subscription_type}")
                    
                    # Send unsubscription acknowledgment
                    await connection_manager.send_personal_message({
                        "type": "unsubscribed",
                        "channel": subscription_type,
                        "data": {
                            "subscription": subscription_type,
                            "status": "unsubscribed"
                        },
                        "timestamp": datetime.utcnow().isoformat()
                    }, connection_id)
            
            elif message.get("type") == "ping":
                await connection_manager.send_personal_message({
                    "type": "pong",
                    "timestamp": "2025-09-12T15:58:00Z"
                }, connection_id)
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected normally: {connection_id}")
        await connection_manager.disconnect(connection_id)
    except Exception as e:
        logger.error("WebSocket error", connection_id=connection_id, error=str(e), error_type=type(e).__name__)
        await connection_manager.disconnect(connection_id)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Fraud Detection Backend API",
        "version": "1.0.0",
        "docs": "/docs" if settings.app_debug else "Documentation not available in production",
        "health": "/health"
    }


# Mock data service status endpoint
@app.get("/api/v1/mock/status")
async def get_mock_data_status():
    """Get the status of the mock data service."""
    return {
        "is_running": mock_data_service.is_running,
        "message": "Mock data service is running" if mock_data_service.is_running else "Mock data service is stopped"
    }

# Restart mock data service endpoint
@app.post("/api/v1/mock/restart")
async def restart_mock_data_service():
    """Restart the mock data service with new settings."""
    try:
        await mock_data_service.stop()
        await asyncio.sleep(1)  # Brief pause
        await mock_data_service.start()
        return {
            "success": True,
            "message": "Mock data service restarted successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to restart mock data service: {str(e)}"
        }

# WebSocket connection status endpoint
@app.get("/api/v1/websocket/status")
async def get_websocket_status():
    """Get the status of WebSocket connections."""
    connections = await connection_manager.get_all_connections()
    return {
        "active_connections": len(connection_manager.active_connections),
        "connections": connections,
        "subscriptions": dict(connection_manager.subscriptions)
    }

# Mock data endpoints for testing
@app.post("/api/v1/mock/send-alert")
async def send_mock_alert():
    """Manually trigger a mock alert for testing."""
    try:
        await mock_data_service._send_mock_alert()
        return {
            "success": True,
            "message": "Mock alert sent successfully"
        }
    except Exception as e:
        logger.error("Failed to send mock alert", error=str(e))
        return {
            "success": False,
            "message": f"Failed to send mock alert: {str(e)}"
        }


@app.post("/api/v1/mock/send-transaction")
async def send_mock_transaction():
    """Manually trigger a mock transaction for testing."""
    try:
        await mock_data_service._send_mock_transaction()
        return {
            "success": True,
            "message": "Mock transaction sent successfully"
        }
    except Exception as e:
        logger.error("Failed to send mock transaction", error=str(e))
        return {
            "success": False,
            "message": f"Failed to send mock transaction: {str(e)}"
        }


@app.post("/api/v1/mock/send-status")
async def send_mock_status():
    """Manually trigger a mock status update for testing."""
    try:
        await mock_data_service._send_status_update()
        return {
            "success": True,
            "message": "Mock status update sent successfully"
        }
    except Exception as e:
        logger.error("Failed to send mock status", error=str(e))
        return {
            "success": False,
            "message": f"Failed to send mock status: {str(e)}"
        }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.reload,
        log_level=settings.log_level.lower()
    )
