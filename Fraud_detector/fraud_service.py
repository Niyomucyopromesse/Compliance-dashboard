"""
Standalone Fraud Detection Service

This service provides fraud detection capabilities and can feed data to the FraudBackend.
It runs as a background service without a web interface.
"""

import gqlalchemy
from gqlalchemy import Memgraph
import json
import datetime
import threading
import time
import logging
import requests
from collections import defaultdict
from typing import Dict, List, Optional, Any

from utils import serialize_memgraph_result, safe_extract_value
from fraud_detection_engine import EnhancedFraudDetector, AlertType, AlertSeverity, AlertStatus
from kafka_transaction_monitor import KafkaTransactionMonitor, create_alert_callback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FraudDetectionService:
    """Standalone fraud detection service that can feed data to FraudBackend"""
    
    def __init__(self, memgraph_host: str = "10.24.38.54", memgraph_port: int = 7687, 
                 backend_url: str = "http://localhost:8000", auto_create_alerts: bool = False):
        """
        Initialize the fraud detection service
        
        Args:
            memgraph_host: Memgraph database host
            memgraph_port: Memgraph database port
            backend_url: FraudBackend API URL
            auto_create_alerts: Whether to automatically create alerts in database
        """
        self.backend_url = backend_url.rstrip('/')
        self.is_running = False
        self.monitoring_thread = None
        
        # Memgraph connection
        try:
            self.memgraph = Memgraph(memgraph_host, memgraph_port)
            logger.info("Connected to Memgraph successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Memgraph: {e}")
            self.memgraph = None
        
        # Initialize fraud detection components
        self.enhanced_fraud_detector = EnhancedFraudDetector(self.memgraph, auto_create_alerts=auto_create_alerts)
        
        # Create alert callback for FraudBackend integration
        self.alert_callback = create_alert_callback(backend_url)
        
        # Initialize Kafka-based transaction monitor
        self.transaction_monitor = KafkaTransactionMonitor(
            memgraph_connection=self.memgraph,
            alert_callback=self.alert_callback
        )
        
        # Cache implementation for performance
        self.cache = self._init_cache()
        
        # Statistics
        self.stats = {
            'transactions_processed': 0,
            'alerts_generated': 0,
            'last_activity': None,
            'service_start_time': None
        }
    
    def _init_cache(self):
        """Initialize cache for performance optimization"""
        class Cache:
            def __init__(self, ttl=600):
                self.ttl = ttl
                self.store = {}
                self.ts = {}

            def get(self, key):
                v = self.store.get(key)
                t = self.ts.get(key)
                if v is None or t is None:
                    return None
                if time.time() - t > self.ttl:
                    self.store.pop(key, None)
                    self.ts.pop(key, None)
                    return None
                return v

            def set(self, key, value):
                self.store[key] = value
                self.ts[key] = time.time()
        
        return Cache(ttl=600)
    
    def start(self):
        """Start the fraud detection service"""
        if self.is_running:
            logger.warning("Service is already running")
            return
        
        if not self.memgraph:
            logger.error("Cannot start service: Memgraph connection not available")
            return
        
        self.is_running = True
        self.stats['service_start_time'] = datetime.datetime.now()
        
        # Start Kafka transaction monitoring
        self.transaction_monitor.start_monitoring()
        
        logger.info("Fraud detection service started")
    
    def stop(self):
        """Stop the fraud detection service"""
        if not self.is_running:
            logger.warning("Service is not running")
            return
        
        self.is_running = False
        
        # Stop Kafka transaction monitoring
        self.transaction_monitor.stop_monitoring()
        
        logger.info("Fraud detection service stopped")
    
    def _update_statistics(self):
        """Update service statistics from Kafka monitor"""
        try:
            kafka_stats = self.transaction_monitor.get_monitoring_stats()
            self.stats['transactions_processed'] = kafka_stats.get('transactions_processed', 0)
            self.stats['alerts_generated'] = kafka_stats.get('alerts_generated', 0)
            self.stats['last_activity'] = datetime.datetime.now()
        except Exception as e:
            logger.error(f"Error updating statistics: {e}")
    
    
    def run_fraud_analysis(self, customer_id: str) -> Dict[str, Any]:
        """Run comprehensive fraud analysis on a specific customer"""
        try:
            # Get customer transactions for analysis
            query = """
            MATCH (c:Customer {customer_id: $customer_id})-[:OWNS]->(a:Account)-[:SENT]->(t:Transaction)
            WHERE t.transaction_time > datetime() - duration({days: 30})
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
            LIMIT 1000
            """
            
            transactions = list(self.memgraph.execute_and_fetch(query, {'customer_id': customer_id}))
            
            if not transactions:
                return {'error': 'No transactions found for customer'}
            
            # Run fraud detection on each transaction
            all_alerts = []
            for tx_data in transactions:
                alerts = self.enhanced_fraud_detector.run_comprehensive_fraud_check(tx_data)
                all_alerts.extend(alerts)
            
            # Get customer profile
            customer_query = """
            MATCH (c:Customer {customer_id: $customer_id})
            RETURN c.customer_id, c.full_name, c.segment, c.risk_class
            """
            customer_result = list(self.memgraph.execute_and_fetch(customer_query, {'customer_id': customer_id}))
            customer_profile = {}
            if customer_result and len(customer_result) > 0 and isinstance(customer_result[0], dict):
                customer_profile = customer_result[0]
            
            # Calculate overall risk metrics
            total_alerts = len(all_alerts)
            critical_alerts = len([a for a in all_alerts if a.severity == AlertSeverity.CRITICAL])
            high_alerts = len([a for a in all_alerts if a.severity == AlertSeverity.HIGH])
            
            # Calculate total transaction volume
            total_volume = sum(max(tx.get('credit_amount', 0), tx.get('debit_amount', 0)) for tx in transactions)
            
            analysis_result = {
                'customer_id': customer_id,
                'customer_profile': customer_profile,
                'analysis_timestamp': datetime.datetime.now().isoformat(),
                'analysis_period_days': 30,
                'total_transactions': len(transactions),
                'total_volume': total_volume,
                'total_alerts': total_alerts,
                'critical_alerts': critical_alerts,
                'high_alerts': high_alerts,
                'risk_level': 'LOW',
                'alerts': []
            }
            
            # Determine overall risk level
            if critical_alerts > 0:
                analysis_result['risk_level'] = 'CRITICAL'
            elif high_alerts > 2:
                analysis_result['risk_level'] = 'HIGH'
            elif high_alerts > 0 or total_alerts > 5:
                analysis_result['risk_level'] = 'MEDIUM'
            
            # Convert alerts to serializable format
            for alert in all_alerts:
                alert_dict = alert.__dict__.copy()
                if hasattr(alert_dict['timestamp'], 'isoformat'):
                    alert_dict['timestamp'] = alert_dict['timestamp'].isoformat()
                alert_dict['alert_type'] = alert_dict['alert_type'].value
                alert_dict['severity'] = alert_dict['severity'].value
                alert_dict['status'] = alert_dict['status'].value
                analysis_result['alerts'].append(alert_dict)
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error running fraud analysis: {e}")
            return {'error': str(e)}
    
    def get_service_stats(self) -> Dict[str, Any]:
        """Get service statistics"""
        # Update statistics from Kafka monitor
        self._update_statistics()
        
        # Get Kafka monitor stats
        kafka_stats = self.transaction_monitor.get_monitoring_stats()
        
        return {
            'is_running': self.is_running,
            'memgraph_connected': self.memgraph is not None,
            'stats': self.stats,
            'kafka_monitor_stats': kafka_stats,
            'cache_size': len(self.cache.store),
            'backend_url': self.backend_url
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Perform health check"""
        try:
            if not self.memgraph:
                return {
                    'status': 'unhealthy',
                    'error': 'Memgraph connection not available'
                }
            
            # Test Memgraph connection
            result = list(self.memgraph.execute_and_fetch("MATCH (c:Customer) RETURN count(c) as count"))
            customer_count = 0
            if result and len(result) > 0 and isinstance(result[0], dict):
                customer_count = result[0].get('count', 0)
            
            # Test backend connection
            backend_healthy = False
            try:
                response = requests.get(f"{self.backend_url}/health", timeout=5)
                backend_healthy = response.status_code == 200
            except:
                backend_healthy = False
            
            return {
                'status': 'healthy' if self.is_running else 'stopped',
                'memgraph_connected': True,
                'customer_count': customer_count,
                'backend_connected': backend_healthy,
                'service_running': self.is_running,
                'timestamp': datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.datetime.now().isoformat()
            }


def main():
    """Main function to run the fraud detection service"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fraud Detection Service')
    parser.add_argument('--memgraph-host', default='10.24.38.54', help='Memgraph host')
    parser.add_argument('--memgraph-port', type=int, default=7687, help='Memgraph port')
    parser.add_argument('--backend-url', default='http://localhost:8000', help='FraudBackend URL')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon')
    
    args = parser.parse_args()
    
    # Create and start service
    service = FraudDetectionService(
        memgraph_host=args.memgraph_host,
        memgraph_port=args.memgraph_port,
        backend_url=args.backend_url
    )
    
    try:
        service.start()
        
        if args.daemon:
            # Run as daemon
            logger.info("Running as daemon...")
            while True:
                time.sleep(60)
                # Log status every minute
                stats = service.get_service_stats()
                logger.info(f"Service stats: {stats}")
        else:
            # Interactive mode
            logger.info("Service started. Press Ctrl+C to stop.")
            while True:
                time.sleep(1)
                
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
    finally:
        service.stop()
        logger.info("Service stopped")


if __name__ == '__main__':
    main()
