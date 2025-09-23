"""Mock data service for generating realistic fraud detection data."""

import asyncio
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from ..models.schemas import WebSocketAlert, WebSocketTransaction, AlertSeverity, RiskLabel
from ..websockets.manager import connection_manager
from ..logging_config import get_logger

logger = get_logger(__name__)


class MockDataService:
    """Service for generating and sending mock fraud detection data."""
    
    def __init__(self):
        self.is_running = False
        self.task = None
        
        # Mock customer data
        self.customers = [
            {"id": "CUST001", "name": "John Smith", "risk_level": "Low"},
            {"id": "CUST002", "name": "Jane Doe", "risk_level": "High"},
            {"id": "CUST003", "name": "Bob Johnson", "risk_level": "Critical"},
            {"id": "CUST004", "name": "Alice Brown", "risk_level": "Medium"},
            {"id": "CUST005", "name": "Charlie Wilson", "risk_level": "High"},
        ]
        
        # Mock account data
        self.accounts = [
            {"id": "ACC001", "customer_id": "CUST001", "balance": 5000},
            {"id": "ACC002", "customer_id": "CUST002", "balance": 15000},
            {"id": "ACC003", "customer_id": "CUST003", "balance": 25000},
            {"id": "ACC004", "customer_id": "CUST004", "balance": 8000},
            {"id": "ACC005", "customer_id": "CUST005", "balance": 12000},
        ]
        
        # Alert types and descriptions
        self.alert_types = [
            {
                "type": "suspicious_transaction",
                "descriptions": [
                    "Unusual large transaction amount detected",
                    "Transaction outside normal business hours",
                    "Multiple rapid transactions from same account",
                    "Transaction to high-risk country",
                    "Unusual transaction pattern detected"
                ]
            },
            {
                "type": "account_anomaly",
                "descriptions": [
                    "Account balance dropped significantly",
                    "Unusual login pattern detected",
                    "Account accessed from new location",
                    "Multiple failed login attempts",
                    "Account activity outside normal hours"
                ]
            },
            {
                "type": "high_risk_customer",
                "descriptions": [
                    "Customer risk score increased",
                    "Customer on watchlist made transaction",
                    "Customer with previous fraud history active",
                    "High-risk customer pattern detected"
                ]
            }
        ]
    
    async def start(self):
        """Start the mock data service."""
        if self.is_running:
            logger.warning("Mock data service is already running")
            return
        
        self.is_running = True
        self.task = asyncio.create_task(self._run_mock_data_generator())
        logger.info("Mock data service started - sending data every 30 seconds")
    
    async def stop(self):
        """Stop the mock data service."""
        if not self.is_running:
            return
        
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        
        logger.info("Mock data service stopped")
    
    async def _run_mock_data_generator(self):
        """Main loop for generating mock data."""
        while self.is_running:
            try:
                # Generate and send mock data
                await self._generate_and_send_mock_data()
                
                # Wait 30 seconds for testing
                await asyncio.sleep(30)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in mock data generator", error=str(e))
                await asyncio.sleep(30)  # Wait 30 seconds before retrying
    
    async def _generate_and_send_mock_data(self):
        """Generate and send mock fraud detection data."""
        try:
            # Randomly decide what type of data to send (70% alerts, 30% transactions)
            if random.random() < 0.7:
                await self._send_mock_alert()
            else:
                await self._send_mock_transaction()
            
            # Occasionally send status update
            if random.random() < 0.1:  # 10% chance
                await self._send_status_update()
                
        except Exception as e:
            logger.error("Error generating mock data", error=str(e))
    
    async def _send_mock_alert(self):
        """Generate and send a mock alert."""
        alert_type = random.choice(self.alert_types)
        customer = random.choice(self.customers)
        account = random.choice([acc for acc in self.accounts if acc["customer_id"] == customer["id"]])
        
        # Generate alert severity based on customer risk level
        severity_map = {
            "Low": [AlertSeverity.LOW, AlertSeverity.MEDIUM],
            "Medium": [AlertSeverity.MEDIUM, AlertSeverity.HIGH],
            "High": [AlertSeverity.HIGH, AlertSeverity.CRITICAL],
            "Critical": [AlertSeverity.CRITICAL]
        }
        
        severity = random.choice(severity_map.get(customer["risk_level"], [AlertSeverity.MEDIUM]))
        
        alert = WebSocketAlert(
            alert_id=f"ALERT_{random.randint(1000, 9999)}",
            alert_type=alert_type["type"],
            severity=severity.value if hasattr(severity, 'value') else str(severity),
            status="new",
            description=random.choice(alert_type["descriptions"]),
            risk_score=random.randint(30, 95),  # Integer risk score 30-95
            transaction_id=f"TX_{random.randint(10000, 99999)}" if alert_type["type"] == "suspicious_transaction" else None,
            account_id=account["id"],
            customer_id=customer["id"],
            amount=random.randint(1000, 50000) if alert_type["type"] == "suspicious_transaction" else None,
            timestamp=datetime.utcnow()
        )
        
        await connection_manager.send_alert(alert)
        logger.info(f"Sent mock alert: {alert.alert_id} - {alert.description}")
    
    async def _send_mock_transaction(self):
        """Generate and send a mock high-risk transaction."""
        from_account = random.choice(self.accounts)
        to_account = random.choice([acc for acc in self.accounts if acc["id"] != from_account["id"]])
        
        # Generate transaction amount (higher amounts = higher risk)
        base_amount = random.uniform(100, 50000)
        risk_score = min(0.95, base_amount / 10000)  # Higher amounts = higher risk
        
        # Map risk score to risk label
        if risk_score < 0.3:
            risk_label = RiskLabel.LOW
        elif risk_score < 0.6:
            risk_label = RiskLabel.MEDIUM
        elif risk_score < 0.8:
            risk_label = RiskLabel.HIGH
        else:
            risk_label = RiskLabel.CRITICAL
        
        transaction = WebSocketTransaction(
            tx_id=f"TX_{random.randint(10000, 99999)}",
            amount=round(base_amount, 2),
            currency="USD",
            risk_score=round(risk_score, 2),
            risk_label=risk_label,
            timestamp=datetime.utcnow()
        )
        
        await connection_manager.send_transaction(transaction)
        logger.info(f"Sent mock transaction: {transaction.tx_id} - ${transaction.amount} (Risk: {transaction.risk_label})")
    
    async def _send_status_update(self):
        """Send a mock status update."""
        status_messages = [
            "System operating normally",
            "All fraud detection engines active",
            "Database connection stable",
            "Real-time monitoring active",
            "No system issues detected"
        ]
        
        await connection_manager.send_status_update(
            status="healthy",
            message=random.choice(status_messages)
        )
        logger.info("Sent mock status update")


# Global mock data service instance
mock_data_service = MockDataService()
