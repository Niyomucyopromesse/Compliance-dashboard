"""WebSocket connection manager for real-time updates."""

import asyncio
import json
from typing import Dict, List, Set, Any, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from ..models.schemas import WebSocketMessage, WebSocketAlert, WebSocketTransaction
from ..logging_config import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and message broadcasting."""
    
    def __init__(self):
        # Store active connections
        self.active_connections: Dict[str, WebSocket] = {}
        # Store connection metadata
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}
        # Store subscription filters
        self.subscriptions: Dict[str, Set[str]] = {}
        # Message queue for buffering
        self.message_queue: asyncio.Queue = asyncio.Queue()
        # Background task for processing messages
        self._message_processor_task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start the connection manager."""
        self._message_processor_task = asyncio.create_task(self._process_messages())
        logger.info("WebSocket connection manager started")
    
    async def stop(self):
        """Stop the connection manager."""
        if self._message_processor_task:
            self._message_processor_task.cancel()
            try:
                await self._message_processor_task
            except asyncio.CancelledError:
                pass
        
        # Close all connections
        for connection_id in list(self.active_connections.keys()):
            await self.disconnect(connection_id)
        
        logger.info("WebSocket connection manager stopped")
    
    async def connect(self, websocket: WebSocket, connection_id: str, client_info: Optional[Dict[str, Any]] = None) -> str:
        """Accept a WebSocket connection."""
        await websocket.accept()
        
        self.active_connections[connection_id] = websocket
        self.connection_metadata[connection_id] = {
            "connected_at": datetime.utcnow(),
            "client_info": client_info or {},
            "subscriptions": set()
        }
        self.subscriptions[connection_id] = set()
        
        logger.info("WebSocket connected", connection_id=connection_id, client_info=client_info)
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connection",
            "data": {
                "connection_id": connection_id,
                "status": "connected",
                "timestamp": datetime.utcnow().isoformat()
            }
        }, connection_id)
        
        return connection_id
    
    async def disconnect(self, connection_id: str):
        """Disconnect a WebSocket connection."""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            try:
                # Check if the WebSocket is still open before attempting to close
                if hasattr(websocket, 'client_state') and websocket.client_state.name == 'CONNECTED':
                    await websocket.close()
                elif hasattr(websocket, 'client_state'):
                    logger.debug("WebSocket already closed", connection_id=connection_id, state=websocket.client_state.name)
            except Exception as e:
                logger.warning("Error closing WebSocket", connection_id=connection_id, error=str(e))
            
            # Always clean up the connection data, even if close failed
            del self.active_connections[connection_id]
            if connection_id in self.connection_metadata:
                del self.connection_metadata[connection_id]
            if connection_id in self.subscriptions:
                del self.subscriptions[connection_id]
            
            logger.info("WebSocket disconnected", connection_id=connection_id)
    
    async def send_personal_message(self, message: Dict[str, Any], connection_id: str):
        """Send a message to a specific connection."""
        if connection_id in self.active_connections:
            try:
                websocket = self.active_connections[connection_id]
                # Check if WebSocket is still open before sending
                if hasattr(websocket, 'client_state') and websocket.client_state.name != 'CONNECTED':
                    logger.warning("WebSocket not connected, skipping message", connection_id=connection_id, state=websocket.client_state.name)
                    return
                
                # Serialize datetime objects to ISO format strings
                serialized_message = self._serialize_datetime_objects(message)
                message_json = json.dumps(serialized_message)
                await websocket.send_text(message_json)
                logger.debug("Message sent successfully", connection_id=connection_id, message_type=message.get("type"))
            except Exception as e:
                logger.error("Error sending personal message", connection_id=connection_id, error=str(e), message_type=message.get("type"))
                # Only disconnect if it's a critical error, not just a send failure
                if "Connection closed" not in str(e) and "WebSocket is closed" not in str(e):
                    await self.disconnect(connection_id)
    
    async def broadcast(self, message: Dict[str, Any], exclude: Optional[Set[str]] = None):
        """Broadcast a message to all connected clients."""
        exclude = exclude or set()
        
        for connection_id in list(self.active_connections.keys()):
            if connection_id not in exclude:
                await self.send_personal_message(message, connection_id)
    
    async def broadcast_to_subscribers(self, message: Dict[str, Any], subscription_type: str):
        """Broadcast a message to subscribers of a specific type."""
        logger.info(f"Broadcasting {message.get('type')} to {subscription_type} subscribers. Active connections: {len(self.active_connections)}, Subscriptions: {dict(self.subscriptions)}")
        # Create a copy of the subscriptions to avoid modification during iteration
        subscriptions_copy = dict(self.subscriptions)
        for connection_id, subscriptions in subscriptions_copy.items():
            if subscription_type in subscriptions:
                logger.info(f"Sending {message.get('type')} to {connection_id}")
                try:
                    await self.send_personal_message(message, connection_id)
                except Exception as e:
                    logger.error(f"Error sending message to {connection_id}", error=str(e), message_type=message.get('type'))
    
    async def subscribe(self, connection_id: str, subscription_type: str):
        """Subscribe a connection to a specific message type."""
        if connection_id in self.subscriptions:
            self.subscriptions[connection_id].add(subscription_type)
            self.connection_metadata[connection_id]["subscriptions"].add(subscription_type)
            
            logger.info("Connection subscribed", connection_id=connection_id, subscription=subscription_type)
    
    async def unsubscribe(self, connection_id: str, subscription_type: str):
        """Unsubscribe a connection from a specific message type."""
        if connection_id in self.subscriptions:
            self.subscriptions[connection_id].discard(subscription_type)
            self.connection_metadata[connection_id]["subscriptions"].discard(subscription_type)
            
            logger.info("Connection unsubscribed", connection_id=connection_id, subscription=subscription_type)
    
    async def get_connection_info(self, connection_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a connection."""
        if connection_id in self.connection_metadata:
            return {
                "connection_id": connection_id,
                "connected_at": self.connection_metadata[connection_id]["connected_at"],
                "client_info": self.connection_metadata[connection_id]["client_info"],
                "subscriptions": list(self.connection_metadata[connection_id]["subscriptions"]),
                "is_active": connection_id in self.active_connections
            }
        return None
    
    async def get_all_connections(self) -> List[Dict[str, Any]]:
        """Get information about all connections."""
        connections = []
        for connection_id in self.connection_metadata:
            info = await self.get_connection_info(connection_id)
            if info:
                connections.append(info)
        return connections
    
    async def _process_messages(self):
        """Background task to process queued messages."""
        while True:
            try:
                message = await self.message_queue.get()
                await self._handle_queued_message(message)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error processing queued message", error=str(e), message_type=message.get("type") if 'message' in locals() else "unknown")
    
    async def _handle_queued_message(self, message: Dict[str, Any]):
        """Handle a queued message."""
        message_type = message.get("type")
        
        try:
            if message_type == "alert":
                await self.broadcast_to_subscribers(message, "alerts")
            elif message_type == "transaction":
                await self.broadcast_to_subscribers(message, "transactions")
            elif message_type == "status":
                await self.broadcast(message)
            else:
                await self.broadcast(message)
        except Exception as e:
            logger.error("Error handling queued message", message_type=message_type, error=str(e))
    
    async def queue_message(self, message: Dict[str, Any]):
        """Queue a message for processing."""
        await self.message_queue.put(message)
    
    # Specific message types
    async def send_alert(self, alert: WebSocketAlert):
        """Send an alert message."""
        message = {
            "type": "alert",
            "data": alert.dict(),
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.queue_message(message)
    
    async def send_transaction(self, transaction: WebSocketTransaction):
        """Send a transaction message."""
        message = {
            "type": "transaction",
            "data": transaction.dict(),
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.queue_message(message)
    
    async def send_status_update(self, status: str, message: str = ""):
        """Send a status update message."""
        status_message = {
            "type": "status",
            "data": {
                "status": status,
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        await self.queue_message(status_message)
    
    async def send_heartbeat(self):
        """Send heartbeat to all connections."""
        heartbeat = {
            "type": "heartbeat",
            "data": {
                "timestamp": datetime.utcnow().isoformat(),
                "active_connections": len(self.active_connections)
            }
        }
        await self.broadcast(heartbeat)
    
    def _serialize_datetime_objects(self, obj: Any) -> Any:
        """Recursively serialize datetime objects to ISO format strings."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {key: self._serialize_datetime_objects(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._serialize_datetime_objects(item) for item in obj]
        elif hasattr(obj, 'dict'):  # Pydantic models
            return self._serialize_datetime_objects(obj.dict())
        else:
            return obj


# Global connection manager instance
connection_manager = ConnectionManager()
