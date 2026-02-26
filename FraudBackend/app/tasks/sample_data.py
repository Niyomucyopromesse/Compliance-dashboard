"""Sample data creation for development and testing."""

import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any
from ..db.connection import db_connection
from ..db.memgraph_client import memgraph_client
from ..utils.helpers import generate_customer_id, generate_account_id, generate_tx_id, generate_alert_id
from ..logging_config import get_logger

logger = get_logger(__name__)


async def create_sample_data():
    """Create sample data for development and testing."""
    try:
        logger.info("Creating sample data...")
        
        # Initialize database connection
        await db_connection.connect()
        await memgraph_client.initialize()
        
        # Create customers
        customers = await create_sample_customers()
        logger.info(f"Created {len(customers)} customers")
        
        # Create accounts
        accounts = await create_sample_accounts(customers)
        logger.info(f"Created {len(accounts)} accounts")
        
        # Create transactions
        transactions = await create_sample_transactions(accounts)
        logger.info(f"Created {len(transactions)} transactions")
        
        # Create alerts
        alerts = await create_sample_alerts(transactions)
        logger.info(f"Created {len(alerts)} alerts")
        
        logger.info("Sample data creation completed")
        
    except Exception as e:
        logger.error("Failed to create sample data", error=str(e))
        raise


async def create_sample_customers() -> List[Dict[str, Any]]:
    """Create sample customers."""
    customers = [
        {
            "customer_id": generate_customer_id(),
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
            "customer_id": generate_customer_id(),
            "name": "Jane Doe",
            "email": "jane.doe@example.com",
            "phone": "+1-555-0102",
            "address": "456 Oak Ave, Los Angeles, CA 90210",
            "risk_score": 0.7,
            "risk_label": "High",
            "status": "active",
            "created_at": datetime.utcnow() - timedelta(days=25),
            "updated_at": datetime.utcnow() - timedelta(days=2)
        },
        {
            "customer_id": generate_customer_id(),
            "name": "Bob Johnson",
            "email": "bob.johnson@example.com",
            "phone": "+1-555-0103",
            "address": "789 Pine St, Chicago, IL 60601",
            "risk_score": 0.9,
            "risk_label": "Critical",
            "status": "suspended",
            "created_at": datetime.utcnow() - timedelta(days=20),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "customer_id": generate_customer_id(),
            "name": "Alice Brown",
            "email": "alice.brown@example.com",
            "phone": "+1-555-0104",
            "address": "321 Elm St, Houston, TX 77001",
            "risk_score": 0.3,
            "risk_label": "Low",
            "status": "active",
            "created_at": datetime.utcnow() - timedelta(days=15),
            "updated_at": datetime.utcnow() - timedelta(days=3)
        },
        {
            "customer_id": generate_customer_id(),
            "name": "Charlie Wilson",
            "email": "charlie.wilson@example.com",
            "phone": "+1-555-0105",
            "address": "654 Maple Dr, Phoenix, AZ 85001",
            "risk_score": 0.6,
            "risk_label": "High",
            "status": "active",
            "created_at": datetime.utcnow() - timedelta(days=10),
            "updated_at": datetime.utcnow() - timedelta(days=1)
        }
    ]
    
    for customer in customers:
        await memgraph_client.db.execute_write(
            """
            CREATE (c:Customer {
                customer_id: $customer_id,
                name: $name,
                email: $email,
                phone: $phone,
                address: $address,
                risk_score: $risk_score,
                risk_label: $risk_label,
                status: $status,
                created_at: datetime($created_at),
                updated_at: datetime($updated_at)
            })
            """,
            customer
        )
    
    return customers


async def create_sample_accounts(customers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create sample accounts."""
    accounts = []
    
    for i, customer in enumerate(customers):
        # Each customer gets 1-3 accounts
        num_accounts = (i % 3) + 1
        
        for j in range(num_accounts):
            account = {
                "account_id": generate_account_id(),
                "customer_id": customer["customer_id"],
                "account_number": f"ACC{1000 + i * 10 + j}",
                "account_type": ["checking", "savings", "business"][j % 3],
                "balance": 1000 + (i * 500) + (j * 200),
                "currency": "USD",
                "risk_score": customer["risk_score"] + (j * 0.1),
                "risk_label": "High" if customer["risk_score"] + (j * 0.1) > 0.6 else "Low",
                "status": "active" if customer["status"] == "active" else "frozen",
                "created_at": customer["created_at"],
                "last_transaction": datetime.utcnow() - timedelta(hours=j * 2)
            }
            
            await memgraph_client.db.execute_write(
                """
                CREATE (a:Account {
                    account_id: $account_id,
                    account_number: $account_number,
                    account_type: $account_type,
                    balance: $balance,
                    currency: $currency,
                    risk_score: $risk_score,
                    risk_label: $risk_label,
                    status: $status,
                    created_at: datetime($created_at),
                    last_transaction: $last_transaction
                })
                """,
                account
            )
            
            # Create OWNS relationship
            await memgraph_client.db.execute_write(
                """
                MATCH (c:Customer {customer_id: $customer_id}), (a:Account {account_id: $account_id})
                CREATE (c)-[:OWNS]->(a)
                """,
                {"customer_id": customer["customer_id"], "account_id": account["account_id"]}
            )
            
            accounts.append(account)
    
    return accounts


async def create_sample_transactions(accounts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create sample transactions."""
    transactions = []
    
    for i in range(100):  # Create 100 transactions
        from_account = accounts[i % len(accounts)]
        to_account = accounts[(i + 1) % len(accounts)]
        
        # Skip if same account
        if from_account["account_id"] == to_account["account_id"]:
            to_account = accounts[(i + 2) % len(accounts)]
        
        amount = 50 + (i * 25) + (i % 10 * 100)
        risk_score = 0.1 + (i % 10 * 0.1)
        
        transaction = {
            "tx_id": generate_tx_id(),
            "timestamp": datetime.utcnow() - timedelta(hours=i),
            "from_account": from_account["account_id"],
            "to_account": to_account["account_id"],
            "amount": amount,
            "currency": "USD",
            "type": "transfer",
            "risk_score": risk_score,
            "risk_label": "High" if risk_score > 0.6 else "Low",
            "status": "completed",
            "alert_id": None,
            "meta": {
                "transaction_type": "wire_transfer",
                "channel": "online",
                "device_id": f"device_{i % 5}",
                "ip_address": f"192.168.1.{i % 255}"
            }
        }
        
        # Add alert for high-risk transactions
        if risk_score > 0.7:
            alert_id = generate_alert_id()
            transaction["alert_id"] = alert_id
            
            # Create alert
            await memgraph_client.db.execute_write(
                """
                CREATE (a:Alert {
                    alert_id: $alert_id,
                    alert_type: $alert_type,
                    severity: $severity,
                    status: $status,
                    description: $description,
                    risk_score: $risk_score,
                    created_at: datetime($created_at),
                    updated_at: datetime($updated_at)
                })
                """,
                {
                    "alert_id": alert_id,
                    "alert_type": "suspicious_transaction",
                    "severity": "high",
                    "status": "new",
                    "description": f"High-risk transaction detected: ${amount}",
                    "risk_score": risk_score,
                    "created_at": transaction["timestamp"].isoformat(),
                    "updated_at": transaction["timestamp"].isoformat()
                }
            )
        
        await memgraph_client.db.execute_write(
            """
            CREATE (t:Transaction {
                tx_id: $tx_id,
                timestamp: datetime($timestamp),
                from_account: $from_account,
                to_account: $to_account,
                amount: $amount,
                currency: $currency,
                type: $type,
                risk_score: $risk_score,
                risk_label: $risk_label,
                status: $status,
                alert_id: $alert_id,
                meta: $meta
            })
            """,
            transaction
        )
        
        transactions.append(transaction)
    
    return transactions


async def create_sample_alerts(transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create sample alerts."""
    alerts = []
    
    # Create additional alerts for high-risk transactions
    high_risk_transactions = [t for t in transactions if t["risk_score"] > 0.7]
    
    for i, transaction in enumerate(high_risk_transactions[:20]):  # Create 20 alerts
        alert = {
            "alert_id": generate_alert_id(),
            "alert_type": "suspicious_transaction",
            "severity": "high" if transaction["risk_score"] > 0.8 else "medium",
            "status": "new",
            "description": f"Suspicious transaction pattern detected: ${transaction['amount']}",
            "risk_score": transaction["risk_score"],
            "assigned_to": None,
            "notes": None,
            "created_at": transaction["timestamp"],
            "updated_at": transaction["timestamp"]
        }
        
        await memgraph_client.db.execute_write(
            """
            CREATE (a:Alert {
                alert_id: $alert_id,
                alert_type: $alert_type,
                severity: $severity,
                status: $status,
                description: $description,
                risk_score: $risk_score,
                assigned_to: $assigned_to,
                notes: $notes,
                created_at: datetime($created_at),
                updated_at: datetime($updated_at)
            })
            """,
            alert
        )
        
        # Create ALERTS relationship
        await memgraph_client.db.execute_write(
            """
            MATCH (a:Alert {alert_id: $alert_id}), (t:Transaction {tx_id: $tx_id})
            CREATE (a)-[:ALERTS]->(t)
            """,
            {"alert_id": alert["alert_id"], "tx_id": transaction["tx_id"]}
        )
        
        alerts.append(alert)
    
    return alerts


if __name__ == "__main__":
    asyncio.run(create_sample_data())
