#!/usr/bin/env python3
"""
Example script showing how to use the Kafka Transaction Monitor independently
"""

import time
import logging
from kafka_transaction_monitor import KafkaTransactionMonitor, create_alert_callback

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def custom_alert_handler(alerts, transaction_data):
    """Custom alert handler for fraud alerts"""
    logger.warning(f"🚨 FRAUD DETECTED! {len(alerts)} alerts for transaction {transaction_data.get('transaction_id', 'unknown')}")
    
    for alert in alerts:
        logger.warning(f"  - {alert['alert_type']}: {alert['description']} (Severity: {alert['severity']})")
    
    # You can add custom logic here:
    # - Send emails
    # - Create tickets
    # - Block transactions
    # - Notify compliance team
    # etc.

def main():
    """Main function to run the Kafka monitor example"""
    logger.info("🚀 Starting Kafka Transaction Monitor Example")
    
    # Mock Memgraph connection (replace with real connection in production)
    class MockMemgraph:
        def execute_and_fetch(self, query, params=None):
            return []
        def execute(self, query, params=None):
            pass
    
    memgraph = MockMemgraph()
    
    # Custom Kafka configuration
    kafka_config = {
        'bootstrap.servers': '10.24.38.44:35002',
        'group.id': 'fraud_detection_example',
        'topic': 'table-update-json',
        'auto.offset.reset': 'latest',
        'enable.auto.commit': True,
        'auto.commit.interval.ms': 1000
    }
    
    # Create alert callback (you can use custom_alert_handler or create_alert_callback)
    alert_callback = custom_alert_handler
    # Or use the built-in FraudBackend callback:
    # alert_callback = create_alert_callback("http://localhost:8000")
    
    # Create Kafka monitor
    monitor = KafkaTransactionMonitor(
        memgraph_connection=memgraph,
        kafka_config=kafka_config,
        alert_callback=alert_callback
    )
    
    try:
        # Start monitoring
        logger.info("Starting Kafka transaction monitoring...")
        monitor.start_monitoring()
        
        # Keep running and show stats
        logger.info("Kafka monitor is running. Press Ctrl+C to stop.")
        logger.info("="*60)
        
        while True:
            time.sleep(30)  # Show stats every 30 seconds
            
            stats = monitor.get_monitoring_stats()
            logger.info(f"📊 Monitor Stats:")
            logger.info(f"  - Messages processed: {stats['messages_processed']}")
            logger.info(f"  - Transactions processed: {stats['transactions_processed']}")
            logger.info(f"  - Alerts generated: {stats['alerts_generated']}")
            logger.info(f"  - Errors encountered: {stats['errors_encountered']}")
            logger.info(f"  - Last message time: {stats['last_message_time']}")
            logger.info("-" * 40)
            
    except KeyboardInterrupt:
        logger.info("\n⏹️ Received interrupt signal")
    except Exception as e:
        logger.error(f"❌ Error running Kafka monitor: {e}")
    finally:
        # Stop monitoring
        logger.info("Stopping Kafka monitor...")
        monitor.stop_monitoring()
        logger.info("✅ Kafka monitor stopped")

if __name__ == "__main__":
    main()
