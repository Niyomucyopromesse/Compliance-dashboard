#!/usr/bin/env python3
"""
Enhanced Fraud Detection Engine
Monitors quick money movement and high transaction amounts in real-time
"""

import gqlalchemy
from gqlalchemy import Memgraph
import datetime
import logging
import uuid
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from utils import serialize_memgraph_result, safe_extract_value

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertType(Enum):
    """Types of fraud alerts"""
    HIGH_AMOUNT = "HIGH_AMOUNT"
    QUICK_MOVEMENT = "QUICK_MOVEMENT"
    FREQUENT_TRANSACTIONS = "FREQUENT_TRANSACTIONS"
    SUSPICIOUS_PATTERN = "SUSPICIOUS_PATTERN"
    VELOCITY_ANOMALY = "VELOCITY_ANOMALY"

class AlertSeverity(Enum):
    """Alert severity levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AlertStatus(Enum):
    """Alert status"""
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"

@dataclass
class FraudAlert:
    """Fraud alert data structure matching unified Memgraph schema"""
    alert_id: str
    alert_type: str  # VELOCITY_ANOMALY, HIGH_AMOUNT, QUICK_MOVEMENT, etc.
    severity: str    # CRITICAL, HIGH, MEDIUM, LOW
    status: str      # OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    timestamp: datetime.datetime
    description: str
    amount: float
    customer_id: str
    account_id: str
    transaction_id: str
    risk_score: int  # 0-100 scale
    additional_data: Dict = None

class EnhancedFraudDetector:
    """Enhanced fraud detection engine with real-time monitoring"""
    
    def __init__(self, memgraph_connection, auto_create_alerts: bool = False):
        self.memgraph = memgraph_connection
        self.auto_create_alerts = auto_create_alerts
        self.config = {
            # High amount thresholds (in currency units)
            'high_amount_thresholds': {
                'LOW': 10000000,      # 10M
                'MEDIUM': 20000000,   # 20M
                'HIGH': 50000000,    # 5OM
                'CRITICAL': 100000000 # 100M
            },
            
            # Quick movement thresholds
            'quick_movement': {
                'time_window_minutes': 5,    # 5 minutes
                'transaction_count_threshold': 3,  # 3+ transactions
                'amount_threshold': 100000   # 100K+ total
            },
            
            # Velocity monitoring
            'velocity_monitoring': {
                'time_window_hours': 1,      # 1 hour
                'amount_threshold': 1000000, # 1M total
                'transaction_count_threshold': 5  # 5+ transactions
            },
            
            # Frequency monitoring
            'frequency_monitoring': {
                'time_window_minutes': 10,   # 10 minutes
                'transaction_count_threshold': 10  # 10+ transactions
            }
        }
    
    def create_alert(self, alert_data: Dict, force_create: bool = False) -> bool:
        """Create a new fraud alert in the database"""
        # Only create alerts if auto_create_alerts is enabled or force_create is True
        if not self.auto_create_alerts and not force_create:
            logger.info(f"Alert creation skipped (auto_create_alerts=False): {alert_data.get('alert_type', 'unknown')} - {alert_data.get('description', 'No description')}")
            return False
            
        try:
            # Use alert data directly since it now uses string values
            db_data = alert_data.copy()
            
            query = """
            CREATE (a:Alert {
                alert_id: $alert_id,
                alert_type: $alert_type,
                severity: $severity,
                status: $status,
                timestamp: $timestamp,
                description: $description,
                amount: $amount,
                customer_id: $customer_id,
                account_id: $account_id,
                transaction_id: $transaction_id,
                risk_score: $risk_score,
                additional_data: $additional_data
            })
            """
            
            self.memgraph.execute(query, db_data)
            logger.warning(f"🚨 FRAUD ALERT CREATED: {db_data['alert_type']} - {db_data['severity']} - {db_data['description']}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating alert: {e}")
            return False
    
    def detect_high_amount_transactions(self, transaction_data: Dict) -> Optional[FraudAlert]:
        """Detect transactions with unusually high amounts"""
        try:
            amount = max(transaction_data.get('credit_amount', 0), 
                        transaction_data.get('debit_amount', 0))
            
            # Determine severity based on amount
            severity = None
            if amount >= self.config['high_amount_thresholds']['CRITICAL']:
                severity = "CRITICAL"
            elif amount >= self.config['high_amount_thresholds']['HIGH']:
                severity = "HIGH"
            elif amount >= self.config['high_amount_thresholds']['MEDIUM']:
                severity = "MEDIUM"
            elif amount >= self.config['high_amount_thresholds']['LOW']:
                severity = "LOW"
            
            if severity:
                alert = FraudAlert(
                    alert_id=f"ALERT_{uuid.uuid4().hex[:8].upper()}",
                    alert_type="HIGH_AMOUNT",
                    severity=severity,
                    status="OPEN",
                    timestamp=datetime.datetime.now(),
                    description=f"High amount transaction detected: {amount:,.2f}",
                    amount=amount,
                    customer_id=transaction_data.get('customer_id', ''),
                    account_id=transaction_data.get('account_id', ''),
                    transaction_id=transaction_data.get('transaction_id', ''),
                    risk_score=self._calculate_risk_score(severity, amount),
                    additional_data={'original_transaction': transaction_data}
                )
                
                # Create alert in database (if auto_create_alerts is enabled)
                self.create_alert(alert.__dict__)
                return alert
            
            return None
            
        except Exception as e:
            logger.error(f"Error in high amount detection: {e}")
            return None
    
    def detect_quick_money_movement(self, customer_id: str, account_id: str) -> Optional[FraudAlert]:
        """Detect quick movement of money from an account"""
        try:
            time_window = self.config['quick_movement']['time_window_minutes']
            count_threshold = self.config['quick_movement']['transaction_count_threshold']
            amount_threshold = self.config['quick_movement']['amount_threshold']
            
            query = """
            MATCH (a:Account {account_id: $account_id})-[:SENT]->(t:Transaction)
            WHERE t.transaction_time > localDateTime() - duration($time_window)
            WITH a, count(t) as tx_count, sum(t.debit_amount) as total_amount
            WHERE tx_count >= $count_threshold AND total_amount >= $amount_threshold
            RETURN tx_count, total_amount
            """
            
            result = list(self.memgraph.execute_and_fetch(query, {
                'account_id': account_id,
                'time_window': f"PT{time_window}M",  # Convert minutes to ISO-8601 duration
                'count_threshold': count_threshold,
                'amount_threshold': amount_threshold
            }))
            
            if result:
                tx_count = safe_extract_value(result, 'tx_count', 0)
                total_amount = safe_extract_value(result, 'total_amount', 0)
                
                # Determine severity based on velocity
                severity = "MEDIUM"
                if tx_count >= count_threshold * 2:
                    severity = "HIGH"
                if total_amount >= amount_threshold * 3:
                    severity = "CRITICAL"
                
                alert = FraudAlert(
                    alert_id=f"ALERT_{uuid.uuid4().hex[:8].upper()}",
                    alert_type="QUICK_MOVEMENT",
                    severity=severity,
                    status="OPEN",
                    timestamp=datetime.datetime.now(),
                    description=f"Quick money movement detected: {tx_count} transactions, {total_amount:,.2f} total in {time_window} minutes",
                    amount=total_amount,
                    customer_id=customer_id,
                    account_id=account_id,
                    transaction_id='',
                    risk_score=self._calculate_risk_score(severity, total_amount),
                    additional_data={
                        'transaction_count': tx_count,
                        'time_window_minutes': time_window,
                        'total_amount': total_amount
                    }
                )
                
                # Create alert in database (if auto_create_alerts is enabled)
                self.create_alert(alert.__dict__)
                return alert
            
            return None
            
        except Exception as e:
            logger.error(f"Error in quick movement detection: {e}")
            return None
    
    def detect_velocity_anomaly(self, customer_id: str) -> Optional[FraudAlert]:
        """Detect velocity anomalies (unusual transaction patterns)"""
        try:
            time_window = self.config['velocity_monitoring']['time_window_hours']
            amount_threshold = self.config['velocity_monitoring']['amount_threshold']
            count_threshold = self.config['velocity_monitoring']['transaction_count_threshold']
            
            query = """
            MATCH (c:Customer {customer_id: $customer_id})-[:OWNS]->(a:Account)-[:SENT]->(t:Transaction)
            WHERE t.transaction_time > localDateTime() - duration($time_window)
            WITH c, count(t) as tx_count, sum(t.debit_amount) as total_amount
            WHERE tx_count >= $count_threshold AND total_amount >= $amount_threshold
            RETURN tx_count, total_amount
            """
            
            result = list(self.memgraph.execute_and_fetch(query, {
                'customer_id': customer_id,
                'time_window': f"PT{time_window}H",  # Convert hours to ISO-8601 duration
                'count_threshold': count_threshold,
                'amount_threshold': amount_threshold
            }))
            
            if result:
                tx_count = safe_extract_value(result, 'tx_count', 0)
                total_amount = safe_extract_value(result, 'total_amount', 0)
                
                # Calculate velocity score
                velocity_score = (total_amount / amount_threshold) * (tx_count / count_threshold)
                
                severity = "MEDIUM"
                if velocity_score > 5:
                    severity = "HIGH"
                if velocity_score > 10:
                    severity = "CRITICAL"
                
                alert = FraudAlert(
                    alert_id=f"ALERT_{uuid.uuid4().hex[:8].upper()}",
                    alert_type="VELOCITY_ANOMALY",
                    severity=severity,
                    status="OPEN",
                    timestamp=datetime.datetime.now(),
                    description=f"Velocity anomaly detected: {tx_count} transactions, {total_amount:,.2f} total in {time_window} hours (score: {velocity_score:.2f})",
                    amount=total_amount,
                    customer_id=customer_id,
                    account_id='',
                    transaction_id='',
                    risk_score=self._calculate_risk_score(severity, total_amount),
                    additional_data={
                        'transaction_count': tx_count,
                        'time_window_hours': time_window,
                        'total_amount': total_amount,
                        'velocity_score': velocity_score
                    }
                )
                
                # Create alert in database (if auto_create_alerts is enabled)
                self.create_alert(alert.__dict__)
                return alert
            
            return None
            
        except Exception as e:
            logger.error(f"Error in velocity anomaly detection: {e}")
            return None
    
    def detect_frequent_transactions(self, customer_id: str) -> Optional[FraudAlert]:
        """Detect unusually frequent transactions"""
        try:
            time_window = self.config['frequency_monitoring']['time_window_minutes']
            count_threshold = self.config['frequency_monitoring']['transaction_count_threshold']
            
            query = """
            MATCH (c:Customer {customer_id: $customer_id})-[:OWNS]->(a:Account)-[:SENT]->(t:Transaction)
            WHERE t.transaction_time > localDateTime() - duration($time_window)
            WITH c, count(t) as tx_count
            WHERE tx_count >= $count_threshold
            RETURN tx_count
            """
            
            result = list(self.memgraph.execute_and_fetch(query, {
                'customer_id': customer_id,
                'time_window': f"PT{time_window}M",  # Convert minutes to ISO-8601 duration
                'count_threshold': count_threshold
            }))
            
            if result:
                tx_count = safe_extract_value(result, 'tx_count', 0)
                
                severity = "MEDIUM"
                if tx_count >= count_threshold * 2:
                    severity = "HIGH"
                if tx_count >= count_threshold * 3:
                    severity = "CRITICAL"
                
                alert = FraudAlert(
                    alert_id=f"ALERT_{uuid.uuid4().hex[:8].upper()}",
                    alert_type="FREQUENT_TRANSACTIONS",
                    severity=severity,
                    status="OPEN",
                    timestamp=datetime.datetime.now(),
                    description=f"Frequent transactions detected: {tx_count} transactions in {time_window} minutes",
                    amount=0,
                    customer_id=customer_id,
                    account_id='',
                    transaction_id='',
                    risk_score=self._calculate_risk_score(severity, tx_count),
                    additional_data={
                        'transaction_count': tx_count,
                        'time_window_minutes': time_window
                    }
                )
                
                # Create alert in database (if auto_create_alerts is enabled)
                self.create_alert(alert.__dict__)
                return alert
            
            return None
            
        except Exception as e:
            logger.error(f"Error in frequent transaction detection: {e}")
            return None
    
    def _calculate_risk_score(self, severity: str, amount: float) -> int:
        """Calculate risk score based on severity and amount"""
        base_scores = {
            "LOW": 10,
            "MEDIUM": 30,
            "HIGH": 60,
            "CRITICAL": 100
        }
        
        base_score = base_scores.get(severity, 0)
        
        # Adjust score based on amount (logarithmic scale)
        if amount > 0:
            amount_factor = min(20, max(0, (amount / 1000000) * 10))
            return min(100, base_score + amount_factor)
        
        return base_score
    
    def run_comprehensive_fraud_check(self, transaction_data: Dict) -> List[FraudAlert]:
        """Run comprehensive fraud detection on a transaction"""
        alerts = []
        
        try:
            # Extract customer and account info
            customer_id = transaction_data.get('customer_id', '')
            account_id = transaction_data.get('account_id', '')
            
            # 1. Check for high amount transactions
            high_amount_alert = self.detect_high_amount_transactions(transaction_data)
            if high_amount_alert:
                alerts.append(high_amount_alert)
            
            # 2. Check for quick money movement (if we have account info)
            if account_id:
                quick_movement_alert = self.detect_quick_money_movement(customer_id, account_id)
                if quick_movement_alert:
                    alerts.append(quick_movement_alert)
            
            # 3. Check for velocity anomalies
            if customer_id:
                velocity_alert = self.detect_velocity_anomaly(customer_id)
                if velocity_alert:
                    alerts.append(velocity_alert)
                
                # 4. Check for frequent transactions
                frequent_alert = self.detect_frequent_transactions(customer_id)
                if frequent_alert:
                    alerts.append(frequent_alert)
            
            logger.info(f"Fraud check completed for transaction {transaction_data.get('transaction_id', '')}: {len(alerts)} alerts generated")
            
        except Exception as e:
            logger.error(f"Error in comprehensive fraud check: {e}")
        
        return alerts
    
    def get_active_alerts(self, customer_id: str = None, alert_type: AlertType = None, 
                         severity: AlertSeverity = None, limit: int = 100) -> List[Dict]:
        """Get active fraud alerts with optional filtering"""
        try:
            where_conditions = ["a.status = 'OPEN'"]
            params = {'limit': limit}
            
            if customer_id:
                where_conditions.append("a.customer_id = $customer_id")
                params['customer_id'] = customer_id
            
            if alert_type:
                where_conditions.append("a.alert_type = $alert_type")
                params['alert_type'] = alert_type.value
            
            if severity:
                where_conditions.append("a.severity = $severity")
                params['severity'] = severity.value
            
            where_clause = " AND ".join(where_conditions)
            
            query = f"""
            MATCH (a:Alert)
            WHERE {where_clause}
            RETURN a
            ORDER BY a.timestamp DESC, a.risk_score DESC
            LIMIT $limit
            """
            
            result = list(self.memgraph.execute_and_fetch(query, params))
            
            # Use utility function to serialize Memgraph data
            alerts = serialize_memgraph_result(result)
            
            return alerts
            
        except Exception as e:
            logger.error(f"Error fetching alerts: {e}")
            return []
    
    def update_alert_status(self, alert_id: str, new_status: AlertStatus, 
                           notes: str = None) -> bool:
        """Update alert status"""
        try:
            # Convert enum to string if needed
            status_value = new_status.value if hasattr(new_status, 'value') else str(new_status)
            
            query = """
            MATCH (a:Alert {alert_id: $alert_id})
            SET a.status = $new_status
            """
            
            params = {'alert_id': alert_id, 'new_status': status_value}
            
            if notes:
                query += ", a.notes = $notes"
                params['notes'] = notes
            
            self.memgraph.execute(query, params)
            logger.info(f"Alert {alert_id} status updated to {status_value}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating alert status: {e}")
            return False
