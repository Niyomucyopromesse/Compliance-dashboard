"""Database connection management for Memgraph."""

import asyncio
from typing import Any, Dict, List, Optional, Union
from contextlib import asynccontextmanager
import neo4j
from neo4j import AsyncGraphDatabase
from ..config import settings
from ..logging_config import get_logger

logger = get_logger(__name__)


class DatabaseConnection:
    """Manages Memgraph database connections using Neo4j driver."""
    
    def __init__(self):
        self.driver: Optional[neo4j.AsyncDriver] = None
        self._connection_pool_size = 50
        self._max_connection_lifetime = 3600  # 1 hour
        self._connection_timeout = 30  # 30 seconds
        
    async def connect(self) -> None:
        """Initialize database connection."""
        try:
            self.driver = AsyncGraphDatabase.driver(
                settings.memgraph_uri,
                auth=(settings.memgraph_user, settings.memgraph_password),
                max_connection_pool_size=self._connection_pool_size,
                max_connection_lifetime=self._max_connection_lifetime,
                connection_timeout=self._connection_timeout,
                keep_alive=True,
            )
            
            # Test connection
            async with self.driver.session() as session:
                await session.run("RETURN 1")
                
            logger.info("Successfully connected to Memgraph", uri=settings.memgraph_uri)
            
        except Exception as e:
            logger.error("Failed to connect to Memgraph", error=str(e), uri=settings.memgraph_uri)
            raise
    
    async def disconnect(self) -> None:
        """Close database connection."""
        if self.driver:
            await self.driver.close()
            logger.info("Disconnected from Memgraph")
    
    @asynccontextmanager
    async def get_session(self):
        """Get a database session with automatic cleanup."""
        if not self.driver:
            raise RuntimeError("Database not connected")
        
        session = self.driver.session()
        try:
            yield session
        finally:
            await session.close()
    
    async def execute_read(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute a read-only query."""
        async with self.get_session() as session:
            result = await session.run(query, parameters or {})
            records = await result.data()
            logger.debug("Executed read query", query=query, record_count=len(records))
            return records
    
    async def execute_write(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute a write query."""
        async with self.get_session() as session:
            result = await session.run(query, parameters or {})
            records = await result.data()
            logger.debug("Executed write query", query=query, record_count=len(records))
            return records
    
    async def execute_write_transaction(self, queries: List[tuple]) -> List[Dict[str, Any]]:
        """Execute multiple write queries in a transaction."""
        async with self.get_session() as session:
            async with session.begin_transaction() as tx:
                results = []
                for query, parameters in queries:
                    result = await tx.run(query, parameters or {})
                    records = await result.data()
                    results.extend(records)
                
                logger.debug("Executed write transaction", query_count=len(queries))
                return results
    
    async def health_check(self) -> bool:
        """Check if database is healthy."""
        try:
            async with self.get_session() as session:
                result = await session.run("RETURN 1 as health")
                records = await result.data()
                return len(records) > 0 and records[0].get("health") == 1
        except Exception as e:
            logger.error("Database health check failed", error=str(e))
            return False


# Global database connection instance
db_connection = DatabaseConnection()


async def get_database() -> DatabaseConnection:
    """Get the global database connection."""
    return db_connection
