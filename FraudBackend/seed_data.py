#!/usr/bin/env python3
"""Seed sample data into Memgraph database."""

import asyncio
import sys
import os
from datetime import datetime, timedelta
import random

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app.db.connection import get_database
from app.logging_config import get_logger

logger = get_logger(__name__)

async def seed_data():
    """Seed sample data into the database."""
    db = await get_database()
    
    # Clear existing data
    logger.info("Clearing existing data...")
    await db.execute_write("MATCH (n) DETACH DELETE n")
    
    # Create sample customers
    customers = [
        {
            "customer_id": "cust-001",
            "name": "John Smith",
            "email": "john.smith@example.com",
            "phone": "+1-555-0101",
            "address": "123 Main St, New York, NY 10001",
            "risk_score": 0.2,
            "risk_label": "Low",
            "status": "active",
            "created_at": datetime.utcnow() - timedelta(days=30),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "customer_id": "cust-002",
            "name": "Jane Doe",
            "email": "jane.doe@example.com",
            "phone": "+1-555-0102",
            "address": "456 Oak Ave, Los Angeles, CA 90210",
            "risk_score": 0.8,
            "risk_label": "High",
            "status": "active",
            "created_at": datetime.utcnow() - timedelta(days=25),
            "updated_at": datetime.utcnow() - timedelta(days=2)
        },
        {
            "customer_id": "cust-003",
            "name": "Bob Johnson",
            "email": "bob.johnson@example.com",
            "phone": "+1-555-0103",
            "address": "789 Pine St, Chicago, IL 60601",
            "risk_score": 0.95,
            "risk_label": "Critical",
            "status": "suspended",
            "created_at": datetime.utcnow() - timedelta(days=20),
            "updated_at": datetime.utcnow() - timedelta(days=3)
        }
    ]
    
    # Create customers
    for customer in customers:
        query = """
        CREATE (c:Customer {
            customer_id: $customer_id,
            name: $name,
            email: $email,
            phone: $phone,
            address: $address,
            risk_score: $risk_score,
            risk_label: $risk_label,
            status: $status,
            created_at: $created_at,
            updated_at: $updated_at
        })
        """
        await db.execute_write(query, customer)
        logger.info(f"Created customer: {customer['name']}")
    
    # Create sample accounts
    accounts = [
        {
            "account_id": "acc-001",
            "account_number": "ACC001234567",
            "account_type": "current",
            "balance": 5000.00,
            "currency": "USD",
            "risk_score": 0.3,
            "risk_label": "Low",
            "status": "active",
            "created_at": datetime.utcnow() - timedelta(days=30),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "account_id": "acc-002",
            "account_number": "ACC002345678",
            "account_type": "savings",
            "balance": 15000.00,
            "currency": "USD",
            "risk_score": 0.1,
            "risk_label": "Low",
            "status": "active",
            "created_at": datetime.utcnow() - timedelta(days=25),
            "updated_at": datetime.utcnow() - timedelta(days=2)
        },
        {
            "account_id": "acc-003",
            "account_number": "ACC003456789",
            "account_type": "current",
            "balance": 2500.00,
            "currency": "USD",
            "risk_score": 0.9,
            "risk_label": "Critical",
            "status": "frozen",
            "created_at": datetime.utcnow() - timedelta(days=20),
            "updated_at": datetime.utcnow() - timedelta(days=3)
        }
    ]
    
    # Create accounts
    for account in accounts:
        query = """
        CREATE (a:Account {
            account_id: $account_id,
            account_number: $account_number,
            account_type: $account_type,
            balance: $balance,
            currency: $currency,
            risk_score: $risk_score,
            risk_label: $risk_label,
            status: $status,
            created_at: $created_at,
            updated_at: $updated_at
        })
        """
        await db.execute_write(query, account)
        logger.info(f"Created account: {account['account_number']}")
    
    # Create customer-account relationships
    relationships = [
        ("cust-001", "acc-001"),
        ("cust-002", "acc-002"),
        ("cust-003", "acc-003")
    ]
    
    for customer_id, account_id in relationships:
        query = """
        MATCH (c:Customer {customer_id: $customer_id}), (a:Account {account_id: $account_id})
        CREATE (c)-[:OWNS]->(a)
        """
        await db.execute_write(query, {"customer_id": customer_id, "account_id": account_id})
        logger.info(f"Created relationship: {customer_id} -> {account_id}")
    
    # Create sample transactions
    transactions = []
    risk_labels = ["Low", "Medium", "High", "Critical"]
    transaction_types = ["transfer", "deposit", "withdrawal", "payment"]
    
    for i in range(50):
        risk_score = random.uniform(0.0, 1.0)
        if risk_score < 0.3:
            risk_label = "Low"
        elif risk_score < 0.6:
            risk_label = "Medium"
        elif risk_score < 0.8:
            risk_label = "High"
        else:
            risk_label = "Critical"
        
        transaction = {
            "tx_id": f"tx-{i+1:03d}",
            "amount": round(random.uniform(10.0, 5000.0), 2),
            "currency": "USD",
            "transaction_type": random.choice(transaction_types),
            "description": f"Transaction {i+1}",
            "risk_score": risk_score,
            "risk_label": risk_label,
            "status": "completed" if risk_score < 0.8 else "flagged",
            "timestamp": datetime.utcnow() - timedelta(hours=random.randint(0, 168)),
            "created_at": datetime.utcnow() - timedelta(hours=random.randint(0, 168))
        }
        transactions.append(transaction)
    
    # Create transactions
    for transaction in transactions:
        query = """
        CREATE (t:Transaction {
            tx_id: $tx_id,
            amount: $amount,
            currency: $currency,
            transaction_type: $transaction_type,
            description: $description,
            risk_score: $risk_score,
            risk_label: $risk_label,
            status: $status,
            timestamp: $timestamp,
            created_at: $created_at
        })
        """
        await db.execute_write(query, transaction)
    
    # Create transaction-account relationships
    for i, transaction in enumerate(transactions):
        account_id = f"acc-{(i % 3) + 1:03d}"
        query = """
        MATCH (t:Transaction {tx_id: $tx_id}), (a:Account {account_id: $account_id})
        CREATE (t)-[:INVOLVES]->(a)
        """
        await db.execute_write(query, {"tx_id": transaction["tx_id"], "account_id": account_id})
    
    # Create sample alerts
    alerts = [
        {
            "alert_id": "alert-001",
            "alert_type": "suspicious_transaction",
            "title": "High-value transaction detected",
            "description": "Transaction amount exceeds normal threshold",
            "severity": "high",
            "status": "new",
            "created_at": datetime.utcnow() - timedelta(hours=2),
            "updated_at": datetime.utcnow() - timedelta(hours=2)
        },
        {
            "alert_id": "alert-002",
            "alert_type": "unusual_pattern",
            "title": "Unusual spending pattern",
            "description": "Customer showing unusual transaction patterns",
            "severity": "medium",
            "status": "acknowledged",
            "created_at": datetime.utcnow() - timedelta(hours=5),
            "updated_at": datetime.utcnow() - timedelta(hours=1)
        },
        {
            "alert_id": "alert-003",
            "alert_type": "high_risk_customer",
            "title": "High-risk customer activity",
            "description": "Customer with high risk score performing transactions",
            "severity": "critical",
            "status": "investigating",
            "created_at": datetime.utcnow() - timedelta(hours=1),
            "updated_at": datetime.utcnow() - timedelta(minutes=30)
        }
    ]
    
    # Create alerts
    for alert in alerts:
        query = """
        CREATE (a:Alert {
            alert_id: $alert_id,
            alert_type: $alert_type,
            title: $title,
            description: $description,
            severity: $severity,
            status: $status,
            created_at: $created_at,
            updated_at: $updated_at
        })
        """
        await db.execute_write(query, alert)
        logger.info(f"Created alert: {alert['title']}")
    
    logger.info("Data seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())





