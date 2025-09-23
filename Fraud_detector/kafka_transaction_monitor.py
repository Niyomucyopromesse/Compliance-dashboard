#!/usr/bin/env python3
"""
Kafka-based Real-time Transaction Monitoring Service
Monitors incoming T24 transactions from Kafka and triggers fraud detection in real-time
"""

import json
import logging
import threading
import time
from datetime import datetime
from typing import Dict, List, Optional, Callable
from confluent_kafka import DeserializingConsumer
from confluent_kafka.serialization import StringDeserializer
from confluent_kafka.error import KafkaError

from fraud_detection_engine import EnhancedFraudDetector, AlertType, AlertSeverity
from utils import serialize_memgraph_result, safe_extract_count

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KafkaTransactionMonitor:
    """Kafka-based real-time transaction monitoring service"""
    
    def __init__(self, memgraph_connection, kafka_config: Dict = None, alert_callback: Callable = None):
        """
        Initialize the Kafka transaction monitor
        
        Args:
            memgraph_connection: Memgraph database connection
            kafka_config: Kafka configuration dictionary
            alert_callback: Callback function to handle fraud alerts
        """
        self.memgraph = memgraph_connection
        self.fraud_detector = EnhancedFraudDetector(memgraph_connection)
        self.alert_callback = alert_callback
        self.monitoring_active = False
        self.monitor_thread = None
        self.consumer = None
        
        # Default Kafka configuration
        self.kafka_config = kafka_config or {
            'bootstrap.servers': '10.24.38.44:35002',
            'group.id': 'fraud_detection_group1',
            'topic': 'table-update-json',
            'auto.offset.reset': 'latest',
            'enable.auto.commit': True,
            'auto.commit.interval.ms': 1000
        }
        
        # Monitoring configuration
        self.config = {
            'poll_timeout_seconds': 1.0,
            'max_batch_size': 50,
            'enable_real_time_alerts': True,
            'retry_attempts': 3,
            'retry_delay_seconds': 5
        }
        
        # Statistics
        self.stats = {
            'messages_processed': 0,
            'transactions_processed': 0,
            'alerts_generated': 0,
            'errors_encountered': 0,
            'last_message_time': None,
            'start_time': None
        }
    
    def start_monitoring(self):
        """Start the Kafka transaction monitoring service"""
        if self.monitoring_active:
            logger.warning("Kafka transaction monitoring is already active")
            return
        
        try:
            # Create Kafka consumer
            self.consumer = self._create_consumer()
            if not self.consumer:
                logger.error("Failed to create Kafka consumer")
                return
            
            self.monitoring_active = True
            self.stats['start_time'] = datetime.now()
            self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
            self.monitor_thread.start()
            logger.info("Kafka transaction monitoring service started")
            
        except Exception as e:
            logger.error(f"Failed to start Kafka monitoring: {e}")
            self.monitoring_active = False
    
    def stop_monitoring(self):
        """Stop the Kafka transaction monitoring service"""
        self.monitoring_active = False
        
        if self.monitor_thread:
            self.monitor_thread.join(timeout=10)
        
        if self.consumer:
            try:
                self.consumer.close()
            except Exception as e:
                logger.error(f"Error closing Kafka consumer: {e}")
        
        logger.info("Kafka transaction monitoring service stopped")
    
    def _create_consumer(self):
        """Create and configure the Kafka consumer"""
        try:
            consumer_config = {
                'bootstrap.servers': self.kafka_config['bootstrap.servers'],
                'group.id': self.kafka_config['group.id'],
                'auto.offset.reset': self.kafka_config['auto.offset.reset'],
                'key.deserializer': StringDeserializer('utf_8'),
                'value.deserializer': StringDeserializer('utf_8'),
                'enable.auto.commit': self.kafka_config['enable.auto.commit'],
                'auto.commit.interval.ms': self.kafka_config['auto.commit.interval.ms']
            }
            
            consumer = DeserializingConsumer(consumer_config)
            consumer.subscribe([self.kafka_config['topic']])
            logger.info(f"✅ Kafka consumer created and subscribed to topic: {self.kafka_config['topic']}")
            return consumer
            
        except Exception as e:
            logger.error(f"❌ Failed to create Kafka consumer: {e}")
            return None
    
    def _monitor_loop(self):
        """Main Kafka monitoring loop"""
        logger.info("Starting Kafka transaction monitoring loop")
        
        while self.monitoring_active:
            try:
                # Poll for messages
                msg = self.consumer.poll(self.config['poll_timeout_seconds'])
                
                if msg is None:
                    continue
                
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        # End of partition event - not an error
                        continue
                    else:
                        logger.error(f"❌ Kafka consumer error: {msg.error()}")
                        self.stats['errors_encountered'] += 1
                        continue
                
                # Process the message
                self._process_kafka_message(msg)
                
            except Exception as e:
                logger.error(f"Error in Kafka monitoring loop: {e}")
                self.stats['errors_encountered'] += 1
                time.sleep(self.config['retry_delay_seconds'])
    
    def _process_kafka_message(self, message):
        """Process a single Kafka message"""
        try:
            self.stats['messages_processed'] += 1
            self.stats['last_message_time'] = datetime.now()
            
            # Parse the JSON message
            message_data = json.loads(message.value())
            
            logger.info(f"📨 Processing Kafka message - Topic: {message.topic()}, "
                       f"Partition: {message.partition()}, Offset: {message.offset()}")
            
            # Extract transaction data from T24 message
            transaction_data = self._extract_transaction_data(message_data)
            
            if transaction_data:
                # Process the transaction for fraud detection
                self._process_transaction_for_fraud(transaction_data)
            else:
                logger.debug("No transaction data found in message")
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON message: {e}")
            self.stats['errors_encountered'] += 1
        except Exception as e:
            logger.error(f"Error processing Kafka message: {e}")
            self.stats['errors_encountered'] += 1
    
    def _extract_transaction_data(self, message_data: Dict) -> Optional[Dict]:
        """
        Extract transaction data from T24 Kafka message
        
        T24 message structure:
        {
            "entity_name": "FBNK_FUNDS_TRANSFER",
            "value": {
                "TRANSACTION_TIME": "2025-09-17 10:44:32",
                "RECID": "FTCM25260VOVWTVL7",
                "TRANSACTION_TYPE": "ACJD",
                "DEBIT_ACCT_NO": "100214659478",
                "CREDIT_ACCT_NO": "100068155481",
                "DEBIT_CUST_NO": "100214659478",
                "CREDIT_CUST_NO": "100068155481",
                "LOC_AMT_DEBITED": "190",
                "LOC_AMT_CREDITED": "190",
                "PAYMENT_DETAILS": "25079494027522949826186"
            },
            "timestamp": "2025-09-17T10:44:38.854280"
        }
        """
        try:
            logger.debug(f"Processing T24 message: {message_data}")
            
            if not isinstance(message_data, dict):
                return None
            
            # Check if this is a T24 FUNDS_TRANSFER message
            entity_name = message_data.get('entity_name', '')
            if entity_name != 'FBNK_FUNDS_TRANSFER':
                logger.debug(f"Skipping non-transaction message: {entity_name}")
                return None
            
            # Extract the transaction data from the 'value' field
            value_data = message_data.get('value', {})
            if not isinstance(value_data, dict):
                logger.warning("T24 message 'value' field is not a dictionary")
                return None
            
            transaction_data = {}
            
            # Extract transaction ID (RECID field)
            transaction_data['transaction_id'] = value_data.get('RECID', f"kafka_tx_{int(time.time() * 1000)}")
            
            # Extract account information
            debit_account = value_data.get('DEBIT_ACCT_NO', '')
            credit_account = value_data.get('CREDIT_ACCT_NO', '')
            
            # Use debit account as primary account for fraud detection
            transaction_data['account_id'] = debit_account if debit_account else 'unknown_account'
            transaction_data['credit_account'] = credit_account
            transaction_data['debit_account'] = debit_account
            
            # Extract customer information
            debit_customer = value_data.get('DEBIT_CUST_NO', '')
            credit_customer = value_data.get('CREDIT_CUST_NO', '')
            
            # Use debit customer as primary customer for fraud detection
            transaction_data['customer_id'] = debit_customer if debit_customer else None
            transaction_data['debit_customer_id'] = debit_customer
            transaction_data['credit_customer_id'] = credit_customer
            
            # print(f"Customer IDs extracted - Debit: {debit_customer}, Credit: {credit_customer}, Primary: {transaction_data['customer_id']}")
            
            # Extract amounts
            try:
                debit_amount = float(value_data.get('LOC_AMT_DEBITED', '0'))
                credit_amount = float(value_data.get('LOC_AMT_CREDITED', '0'))
                
                transaction_data['debit_amount'] = debit_amount
                transaction_data['credit_amount'] = credit_amount
            except (ValueError, TypeError):
                transaction_data['debit_amount'] = 0
                transaction_data['credit_amount'] = 0
            
            # Extract transaction time
            transaction_time = value_data.get('TRANSACTION_TIME', '')
            if transaction_time:
                # Convert T24 datetime format to ISO format
                try:
                    # T24 format: "2025-09-17 10:44:32"
                    dt = datetime.strptime(transaction_time, '%Y-%m-%d %H:%M:%S')
                    transaction_data['transaction_time'] = dt.isoformat()
                except ValueError:
                    # Fallback to message timestamp
                    transaction_data['transaction_time'] = message_data.get('timestamp', datetime.now().isoformat())
            else:
                transaction_data['transaction_time'] = message_data.get('timestamp', datetime.now().isoformat())
            
            # Extract transaction type and description
            transaction_data['transaction_type'] = value_data.get('TRANSACTION_TYPE', '')
            transaction_data['description'] = value_data.get('PAYMENT_DETAILS', '')
            
            # Extract additional T24 fields
            transaction_data['processing_date'] = value_data.get('PROCESSING_DATE', '')
            transaction_data['debit_value_date'] = value_data.get('DEBIT_VALUE_DATE', '')
            transaction_data['local_charge_amt'] = value_data.get('LOCAL_CHARGE_AMT', '')
            
            # Customer information already extracted above
            
            # logger.info(f"✅ Extracted T24 transaction data: {transaction_data}")
            return transaction_data
            
        except Exception as e:
            logger.error(f"Error extracting T24 transaction data: {e}")
            return None
    
    def _process_transaction_for_fraud(self, transaction_data: Dict):
        """Process a single transaction for fraud detection"""
        try:
            self.stats['transactions_processed'] += 1      
            logger.info(f"🔍 Running fraud detection on transaction: {transaction_data.get('transaction_id', 'unknown')}")            
            # Run comprehensive fraud detection
            alerts = self.fraud_detector.run_comprehensive_fraud_check(transaction_data)
            
            if alerts:
                self.stats['alerts_generated'] += len(alerts)
                logger.warning(f"🚨 Fraud alerts generated for transaction {transaction_data.get('transaction_id', '')}: {len(alerts)} alerts")
                
                # Handle alerts
                self._handle_fraud_alerts(alerts, transaction_data)
            else:
                logger.debug(f"✅ No fraud detected for transaction: {transaction_data.get('transaction_id', '')}")
                
        except Exception as e:
            logger.error(f"Error processing transaction for fraud: {e}")
            self.stats['errors_encountered'] += 1
    
    def _handle_fraud_alerts(self, alerts: List, transaction_data: Dict):
        """Handle generated fraud alerts"""
        try:
            # Convert alerts to serializable format
            serializable_alerts = []
            for alert in alerts:
                alert_dict = alert.__dict__.copy()
                # Convert datetime objects
                if hasattr(alert_dict['timestamp'], 'isoformat'):
                    alert_dict['timestamp'] = alert_dict['timestamp'].isoformat()
                # Alert fields are already strings, no conversion needed
                
                serializable_alerts.append(alert_dict)
            
            # Log alert details
            # for alert in serializable_alerts:
            #     logger.warning(f"🚨 FRAUD ALERT: {alert['alert_type']} - {alert['severity']} - {alert['description']}")
            
            # Call alert callback if provided

            
            if self.alert_callback:
                try:
                    self.alert_callback(serializable_alerts, transaction_data)
                except Exception as e:
                    logger.error(f"Error in alert callback: {e}")
            
            # # Store alerts in database if needed
            # self._store_alerts_in_database(serializable_alerts, transaction_data)
            
        except Exception as e:
            logger.error(f"Error handling fraud alerts: {e}")
    
    def _store_alerts_in_database(self, alerts: List[Dict], transaction_data: Dict):
        """Store fraud alerts in the database"""
        try:
            # This method can be used to store alerts in Memgraph or another database
            # For now, we'll just log that we would store them
            logger.info(f"Would store {len(alerts)} alerts in database for transaction {transaction_data.get('transaction_id', '')}")
            
            # Example of storing in Memgraph (uncomment if needed):
            # for alert in alerts:
            #     query = """
            #     MATCH (t:Transaction {transaction_id: $transaction_id})
            #     CREATE (a:Alert {
            #         alert_id: $alert_id,
            #         alert_type: $alert_type,
            #         severity: $severity,
            #         description: $description,
            #         timestamp: datetime($timestamp)
            #     })
            #     CREATE (t)-[:GENERATED_ALERT]->(a)
            #     """
            #     self.memgraph.execute(query, alert)
            
        except Exception as e:
            logger.error(f"Error storing alerts in database: {e}")
    
    def get_monitoring_stats(self) -> Dict:
        """Get monitoring service statistics"""
        try:
            uptime = None
            if self.stats['start_time']:
                uptime = (datetime.now() - self.stats['start_time']).total_seconds()
            
            return {
                'monitoring_active': self.monitoring_active,
                'kafka_topic': self.kafka_config['topic'],
                'kafka_servers': self.kafka_config['bootstrap.servers'],
                'messages_processed': self.stats['messages_processed'],
                'transactions_processed': self.stats['transactions_processed'],
                'alerts_generated': self.stats['alerts_generated'],
                'errors_encountered': self.stats['errors_encountered'],
                'last_message_time': self.stats['last_message_time'].isoformat() if self.stats['last_message_time'] else None,
                'uptime_seconds': uptime,
                'config': self.config
            }
            
        except Exception as e:
            logger.error(f"Error getting monitoring stats: {e}")
            return {'error': str(e)}
    
    def update_config(self, new_config: Dict):
        """Update monitoring configuration"""
        try:
            # Validate and update configuration
            if 'poll_timeout_seconds' in new_config:
                if new_config['poll_timeout_seconds'] < 0.1:
                    raise ValueError("Poll timeout must be at least 0.1 seconds")
                self.config['poll_timeout_seconds'] = new_config['poll_timeout_seconds']
            
            if 'max_batch_size' in new_config:
                if new_config['max_batch_size'] < 1:
                    raise ValueError("Max batch size must be at least 1")
                self.config['max_batch_size'] = new_config['max_batch_size']
            
            if 'enable_real_time_alerts' in new_config:
                self.config['enable_real_time_alerts'] = new_config['enable_real_time_alerts']
            
            if 'retry_attempts' in new_config:
                if new_config['retry_attempts'] < 1:
                    raise ValueError("Retry attempts must be at least 1")
                self.config['retry_attempts'] = new_config['retry_attempts']
            
            if 'retry_delay_seconds' in new_config:
                if new_config['retry_delay_seconds'] < 1:
                    raise ValueError("Retry delay must be at least 1 second")
                self.config['retry_delay_seconds'] = new_config['retry_delay_seconds']
            
            logger.info(f"Kafka monitoring configuration updated: {self.config}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating configuration: {e}")
            return False
    
    def update_kafka_config(self, new_kafka_config: Dict):
        """Update Kafka configuration (requires restart to take effect)"""
        try:
            # Validate Kafka configuration
            required_fields = ['bootstrap.servers', 'group.id', 'topic']
            for field in required_fields:
                if field not in new_kafka_config:
                    raise ValueError(f"Missing required Kafka config field: {field}")
            
            self.kafka_config.update(new_kafka_config)
            logger.info(f"Kafka configuration updated: {self.kafka_config}")
            logger.warning("⚠️ Kafka configuration changes require service restart to take effect")
            return True
            
        except Exception as e:
            logger.error(f"Error updating Kafka configuration: {e}")
            return False


def create_alert_callback(backend_url: str = "http://localhost:8000"):
    """
    Create an alert callback function that sends alerts to FraudBackend
    
    Args:
        backend_url: URL of the FraudBackend API
    
    Returns:
        Callback function for handling fraud alerts
    """
    import requests
    
    def alert_callback(alerts: List[Dict], transaction_data: Dict):
        """Callback function to send alerts to FraudBackend"""
        try:
            # Prepare alert data for backend
            alert_payload = {
                'alerts': alerts,
                'transaction_data': transaction_data,
                'source': 'kafka_monitor',
                'timestamp': datetime.now().isoformat()
            }
            
            # Send to FraudBackend
            response = requests.post(
                f"{backend_url}/api/v1/alerts/bulk",
                json=alert_payload,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Successfully sent {len(alerts)} alerts to FraudBackend")
            else:
                logger.warning(f"⚠️ Failed to send alerts to FraudBackend: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error sending alerts to FraudBackend: {e}")
        except Exception as e:
            logger.error(f"❌ Error in alert callback: {e}")
    
    return alert_callback


# Example usage
if __name__ == "__main__":
    import gqlalchemy
    from gqlalchemy import Memgraph
    
    # Initialize Memgraph connection
    try:
        memgraph = Memgraph("10.24.38.54", 7687)
        logger.info("Connected to Memgraph successfully")
    except Exception as e:
        logger.error(f"Failed to connect to Memgraph: {e}")
        memgraph = None
    
    if memgraph:
        # Create alert callback for FraudBackend
        alert_callback = create_alert_callback("http://localhost:8000")
        
        # Create Kafka monitor
        kafka_monitor = KafkaTransactionMonitor(
            memgraph_connection=memgraph,
            alert_callback=alert_callback
        )
        
        try:
            # Start monitoring
            kafka_monitor.start_monitoring()
            
            # Keep running
            logger.info("Kafka transaction monitoring started. Press Ctrl+C to stop.")
            while True:
                time.sleep(60)
                # Log stats every minute
                stats = kafka_monitor.get_monitoring_stats()
                logger.info(f"📊 Monitoring stats: {stats}")
                
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
        finally:
            kafka_monitor.stop_monitoring()
            logger.info("Kafka monitoring stopped")
