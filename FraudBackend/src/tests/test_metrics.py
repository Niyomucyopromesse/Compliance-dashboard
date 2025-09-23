"""Tests for metrics endpoints."""

import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "websocket" in data


def test_root_endpoint(client: TestClient):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


def test_overview_metrics(client: TestClient):
    """Test overview metrics endpoint."""
    response = client.get("/api/v1/metrics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
    assert "data" in data


def test_transactions_chart(client: TestClient):
    """Test transactions chart endpoint."""
    response = client.get("/api/v1/metrics/transactions-chart")
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
    assert "data" in data


def test_risk_distribution(client: TestClient):
    """Test risk distribution endpoint."""
    response = client.get("/api/v1/metrics/risk-distribution")
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
    assert "data" in data
