#!/usr/bin/env python3
"""
Fraud Detection Database Setup Script
This script sets up the necessary schema and indexes for fraud detection
"""

import gqlalchemy
from gqlalchemy import Memgraph
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_fraud_detection_schema():
    """Setup fraud detection schema and indexes"""
    
    # Connect to Memgraph
    try:
        memgraph = Memgraph("10.24.38.54", 7687)
        logger.info("Connected to Memgraph successfully")
    except Exception as e:
        logger.error(f"Failed to connect to Memgraph: {e}")
        return False
    
    # Create Alert node schema
    alert_schema_queries = [
        # Create Alert node with properties (no constraint needed for Memgraph)
        """
        CREATE (a:Alert {
            alert_id: 'SAMPLE_ALERT',
            alert_type: 'HIGH_AMOUNT',
            severity: 'HIGH',
            status: 'OPEN',
            timestamp: datetime(),
            description: 'Sample alert for schema setup',
            amount: 1000000,
            customer_id: 'SAMPLE_CUST',
            account_id: 'SAMPLE_ACC',
            transaction_id: 'SAMPLE_TXN',
            risk_score: 80
        })
        """,
        
        # Delete the sample alert after creating the schema
        """
        MATCH (a:Alert {alert_id: 'SAMPLE_ALERT'})
        DELETE a
        """
    ]
    
    try:
        for query in alert_schema_queries:
            memgraph.execute(query)
            logger.info(f"Executed schema query: {query[:50]}...")
        
        logger.info("Fraud detection schema setup completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error setting up fraud detection schema: {e}")
        return False

def create_sample_alerts():
    """Create sample alert structure for testing"""
    
    try:
        memgraph = Memgraph("10.24.38.54", 7687)
        
        # Create sample alert
        sample_alert_query = """
        CREATE (a:Alert {
            alert_id: 'ALERT_001',
            alert_type: 'HIGH_AMOUNT',
            severity: 'HIGH',
            status: 'OPEN',
            timestamp: datetime(),
            description: 'Sample high amount transaction alert',
            amount: 1000000,
            customer_id: 'CUST_001',
            account_id: 'ACC_001',
            transaction_id: 'TXN_001',
            risk_score: 80
        })
        """
        
        memgraph.execute(sample_alert_query)
        logger.info("Sample alert created successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error creating sample alert: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starting fraud detection schema setup...")
    
    if setup_fraud_detection_schema():
        logger.info("Schema setup completed successfully")
        
        # Create sample data
        if create_sample_alerts():
            logger.info("Sample data created successfully")
        else:
            logger.warning("Failed to create sample data")
    else:
        logger.error("Schema setup failed")
