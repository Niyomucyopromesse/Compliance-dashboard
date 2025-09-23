#!/usr/bin/env python3
"""
Real-time Transaction Monitoring Service
Monitors incoming transactions and triggers fraud detection in real-time
"""

import gqlalchemy
from gqlalchemy import Memgraph
import datetime
import logging
import threading
import time
from typing import Dict, List, Optional
from fraud_detection_engine import EnhancedFraudDetector, AlertType, AlertSeverity
from utils import serialize_memgraph_result, safe_extract_count

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TransactionMonitor:
    """Real-time transaction monitoring service"""
    
    def __init__(self, memgraph_connection, socketio_instance):
        self.memgraph = memgraph_connection
        self.socketio = socketio_instance
        self.fraud_detector = EnhancedFraudDetector(memgraph_connection)
        self.monitoring_active = False
        self.monitor_thread = None
        
        # Configuration for monitoring
        self.config = {
            'check_interval_seconds': 10,  # Check for new transactions every 10 seconds
            'lookback_minutes': 5,         # Look back 5 minutes for new transactions
            'max_batch_size': 50,          # Process max 50 transactions per batch
            'enable_real_time_alerts': True
        }
    
    def start_monitoring(self):
        """Start the transaction monitoring service"""
        if self.monitoring_active:
            logger.warning("Transaction monitoring is already active")
            return
        
        self.monitoring_active = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        logger.info("Transaction monitoring service started")
    
    def stop_monitoring(self):
        """Stop the transaction monitoring service"""
        self.monitoring_active = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        logger.info("Transaction monitoring service stopped")
    
    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.monitoring_active:
            try:
                self._process_new_transactions()
                time.sleep(self.config['check_interval_seconds'])
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(30)  # Wait longer on error
    
    def _process_new_transactions(self):
        """Process new transactions and run fraud detection"""
        try:
            # Get new transactions from the last few minutes
            lookback_time = datetime.datetime.now() - datetime.timedelta(minutes=self.config['lookback_minutes'])
            
            query = """
            MATCH (a:Account)-[:SENT]->(t:Transaction)
            WHERE t.transaction_time > $lookback_time
            AND NOT EXISTS((t)-[:GENERATED_ALERT]->(:Alert))
            WITH t, a
            OPTIONAL MATCH (c:Customer)-[:OWNS]->(a)
            RETURN t.transaction_id AS transaction_id,
                   t.transaction_time AS transaction_time,
                   t.credit_amount AS credit_amount,
                   t.debit_amount AS debit_amount,
                   t.credit_account AS credit_account,
                   t.debit_account AS debit_account,
                   t.description AS description,
                   a.account_id AS account_id,
                   c.customer_id AS customer_id
            ORDER BY t.transaction_time DESC
            LIMIT $max_batch_size
            """
            
            params = {
                'lookback_time': lookback_time,
                'max_batch_size': self.config['max_batch_size']
            }
            
            new_transactions = list(self.memgraph.execute_and_fetch(query, params))
            
            if new_transactions:
                logger.info(f"Processing {len(new_transactions)} new transactions")
                
                for tx_data in new_transactions:
                    self._process_single_transaction(tx_data)
                
                # Emit real-time updates to frontend
                if self.config['enable_real_time_alerts']:
                    self._emit_transaction_updates(new_transactions)
            
        except Exception as e:
            logger.error(f"Error processing new transactions: {e}")
    
    def _process_single_transaction(self, transaction_data: Dict):
        """Process a single transaction for fraud detection"""
        try:
            # Convert datetime objects for processing
            if hasattr(transaction_data['transaction_time'], 'isoformat'):
                transaction_data['transaction_time'] = transaction_data['transaction_time'].isoformat()
            
            # Run comprehensive fraud detection
            alerts = self.fraud_detector.run_comprehensive_fraud_check(transaction_data)
            
            if alerts:
                logger.info(f"Fraud alerts generated for transaction {transaction_data.get('transaction_id', '')}: {len(alerts)} alerts")
                
                # Mark transaction as processed for alerts
                self._mark_transaction_processed(transaction_data['transaction_id'])
                
                # Emit real-time alert notifications
                self._emit_fraud_alerts(alerts)
            
        except Exception as e:
            logger.error(f"Error processing transaction {transaction_data.get('transaction_id', '')}: {e}")
    
    def _mark_transaction_processed(self, transaction_id: str):
        """Mark a transaction as processed for fraud detection"""
        try:
            # This prevents the same transaction from being processed multiple times
            # You could also create a relationship between Transaction and Alert nodes
            query = """
            MATCH (t:Transaction {transaction_id: $transaction_id})
            SET t.fraud_checked = true, t.fraud_check_time = datetime()
            """
            
            self.memgraph.execute(query, {'transaction_id': transaction_id})
            
        except Exception as e:
            logger.error(f"Error marking transaction as processed: {e}")
    
    def _emit_transaction_updates(self, transactions: List[Dict]):
        """Emit transaction updates to connected clients"""
        try:
            # Clean up transaction data for frontend
            clean_transactions = []
            for tx in transactions:
                clean_tx = {
                    'transaction_id': tx.get('transaction_id'),
                    'transaction_time': tx.get('transaction_time'),
                    'amount': max(tx.get('credit_amount', 0), tx.get('debit_amount', 0)),
                    'account_id': tx.get('account_id'),
                    'customer_id': tx.get('customer_id'),
                    'description': tx.get('description', '')
                }
                clean_transactions.append(clean_tx)
            
            self.socketio.emit('new_transactions', {
                'transactions': clean_transactions,
                'timestamp': datetime.datetime.now().isoformat(),
                'count': len(clean_transactions)
            })
            
        except Exception as e:
            logger.error(f"Error emitting transaction updates: {e}")
    
    def _emit_fraud_alerts(self, alerts: List):
        """Emit fraud alerts to connected clients"""
        try:
            # Convert alerts to serializable format
            serializable_alerts = []
            for alert in alerts:
                alert_dict = alert.__dict__.copy()
                # Convert datetime objects
                if hasattr(alert_dict['timestamp'], 'isoformat'):
                    alert_dict['timestamp'] = alert_dict['timestamp'].isoformat()
                # Convert enum values
                alert_dict['alert_type'] = alert_dict['alert_type'].value
                alert_dict['severity'] = alert_dict['severity'].value
                alert_dict['status'] = alert_dict['status'].value
                
                serializable_alerts.append(alert_dict)
            
            self.socketio.emit('fraud_alerts', {
                'alerts': serializable_alerts,
                'timestamp': datetime.datetime.now().isoformat(),
                'count': len(serializable_alerts)
            })
            
            logger.info(f"Emitted {len(serializable_alerts)} fraud alerts to frontend")
            
        except Exception as e:
            logger.error(f"Error emitting fraud alerts: {e}")
    
    def get_monitoring_stats(self) -> Dict:
        """Get monitoring service statistics"""
        try:
            # Get recent transaction count
            recent_tx_query = """
            MATCH (t:Transaction)
            WHERE t.transaction_time > localDateTime() - duration("PT30M")
            RETURN count(t) as recent_count
            """
            
            recent_result = list(self.memgraph.execute_and_fetch(recent_tx_query))
            recent_count = safe_extract_count(recent_result, 'recent_count', 0)
            
            # Get recent alert count
            recent_alert_query = """
            MATCH (a:Alert)
            WHERE a.timestamp > localDateTime() - duration("PT30M")
            RETURN count(a) as alert_count
            """
            
            alert_result = list(self.memgraph.execute_and_fetch(recent_alert_query))
            alert_count = safe_extract_count(alert_result, 'alert_count', 0)
            
            # Get high-risk transactions
            high_risk_query = """
            MATCH (t:Transaction)
            WHERE (t.credit_amount > 1000000 OR t.debit_amount > 1000000)
            AND t.transaction_time > localDateTime() - duration("PT60M")
            RETURN count(t) as high_risk_count
            """
            
            high_risk_result = list(self.memgraph.execute_and_fetch(high_risk_query))
            high_risk_count = safe_extract_count(high_risk_result, 'high_risk_count', 0)

            print(f"High risk count: {high_risk_count}")
            
            return {
                'monitoring_active': self.monitoring_active,
                'recent_transactions': recent_count,
                'recent_alerts': alert_count,
                'high_risk_transactions': high_risk_count,
                'last_check': datetime.datetime.now().isoformat(),
                'config': self.config
            }
            
        except Exception as e:
            logger.error(f"Error getting monitoring stats: {e}")
            return {'error': str(e)}
    
    def update_config(self, new_config: Dict):
        """Update monitoring configuration"""
        try:
            # Validate configuration
            if 'check_interval_seconds' in new_config:
                if new_config['check_interval_seconds'] < 5:
                    raise ValueError("Check interval must be at least 5 seconds")
                self.config['check_interval_seconds'] = new_config['check_interval_seconds']
            
            if 'lookback_minutes' in new_config:
                if new_config['lookback_minutes'] < 1:
                    raise ValueError("Lookback time must be at least 1 minute")
                self.config['lookback_minutes'] = new_config['lookback_minutes']
            
            if 'max_batch_size' in new_config:
                if new_config['max_batch_size'] < 10:
                    raise ValueError("Max batch size must be at least 10")
                self.config['max_batch_size'] = new_config['max_batch_size']
            
            if 'enable_real_time_alerts' in new_config:
                self.config['enable_real_time_alerts'] = new_config['enable_real_time_alerts']
            
            logger.info(f"Monitoring configuration updated: {self.config}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating configuration: {e}")
            return False
    
    def force_fraud_check(self, customer_id: str = None, account_id: str = None):
        """Force a fraud check on recent transactions"""
        try:
            where_conditions = []
            params = {}
            
            if customer_id:
                where_conditions.append("(c:Customer {customer_id: $customer_id})-[:OWNS]->(a:Account)")
                params['customer_id'] = customer_id
            elif account_id:
                where_conditions.append("(a:Account {account_id: $account_id})")
                params['account_id'] = account_id
            else:
                where_conditions.append("(a:Account)")
            
            where_clause = "MATCH " + where_conditions[0] if where_conditions else "MATCH (a:Account)"
            
            query = f"""
            {where_clause}
            MATCH (a)-[:SENT]->(t:Transaction)
            WHERE t.transaction_time > localDateTime() - duration("PT60M")
            AND (t.fraud_checked IS NULL OR t.fraud_checked = false)
            RETURN t.transaction_id AS transaction_id,
                   t.transaction_time AS transaction_time,
                   t.credit_amount AS credit_amount,
                   t.debit_amount AS debit_amount,
                   t.credit_account AS credit_account,
                   t.debit_account AS debit_account,
                   t.description AS description,
                   a.account_id AS account_id,
                   c.customer_id AS customer_id
            ORDER BY t.transaction_time DESC
            LIMIT 100
            """
            
            transactions = list(self.memgraph.execute_and_fetch(query, params))
            
            if transactions:
                logger.info(f"Force fraud check: processing {len(transactions)} transactions")
                
                for tx_data in transactions:
                    self._process_single_transaction(tx_data)
                
                return len(transactions)
            else:
                logger.info("No transactions found for force fraud check")
                return 0
                
        except Exception as e:
            logger.error(f"Error in force fraud check: {e}")
            return 0
