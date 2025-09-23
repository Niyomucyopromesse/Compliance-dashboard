"""Test configuration and fixtures."""

import pytest
import asyncio
from fastapi.testclient import TestClient
from ..app.main import app
from ..app.db.connection import db_connection
from ..app.db.memgraph_client import memgraph_client


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
async def db():
    """Database fixture."""
    await db_connection.connect()
    await memgraph_client.initialize()
    yield db_connection
    await db_connection.disconnect()


@pytest.fixture
async def sample_data():
    """Create sample data for testing."""
    from ..app.tasks.sample_data import create_sample_data
    await create_sample_data()
    yield
    # Clean up sample data if needed
