#!/usr/bin/env python3
"""
Test script for Kafka-based fraud detection integration
"""

import unittest
import time
import json
from unittest.mock import Mock, patch, MagicMock
from kafka_transaction_monitor import KafkaTransactionMonitor, create_alert_callback

class TestKafkaIntegration(unittest.TestCase):
    """Test cases for Kafka integration"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_memgraph = Mock()
        self.kafka_config = {
            'bootstrap.servers': 'localhost:9092',
            'group.id': 'test_group',
            'topic': 'test-topic'
        }
        
        self.monitor = KafkaTransactionMonitor(
            memgraph_connection=self.mock_memgraph,
            kafka_config=self.kafka_config
        )
    
    def test_monitor_initialization(self):
        """Test monitor initializes correctly"""
        self.assertIsNotNone(self.monitor)
        self.assertFalse(self.monitor.monitoring_active)
        self.assertEqual(self.monitor.kafka_config['topic'], 'test-topic')
    
    def test_extract_transaction_data_valid(self):
        """Test transaction data extraction from valid message"""
        message_data = {
            'transaction_id': 'txn_123',
            'account_id': 'acc_456',
            'amount': 1000.50,
            'transaction_time': '2024-01-15T10:30:00Z',
            'description': 'Test transaction'
        }
        
        result = self.monitor._extract_transaction_data(message_data)
        
        self.assertIsNotNone(result)
        self.assertEqual(result['transaction_id'], 'txn_123')
        self.assertEqual(result['account_id'], 'acc_456')
        self.assertEqual(result['credit_amount'], 1000.50)
        self.assertEqual(result['debit_amount'], 0)
        self.assertEqual(result['description'], 'Test transaction')
    
    def test_extract_transaction_data_negative_amount(self):
        """Test transaction data extraction with negative amount"""
        message_data = {
            'transaction_id': 'txn_123',
            'account_id': 'acc_456',
            'amount': -500.25,
            'transaction_time': '2024-01-15T10:30:00Z'
        }
        
        result = self.monitor._extract_transaction_data(message_data)
        
        self.assertIsNotNone(result)
        self.assertEqual(result['credit_amount'], 0)
        self.assertEqual(result['debit_amount'], 500.25)
    
    def test_extract_transaction_data_missing_fields(self):
        """Test transaction data extraction with missing fields"""
        message_data = {
            'id': 'txn_123',  # Different field name
            'account': 'acc_456',  # Different field name
            'amount': 1000
        }
        
        result = self.monitor._extract_transaction_data(message_data)
        
        self.assertIsNotNone(result)
        self.assertEqual(result['transaction_id'], 'txn_123')
        self.assertEqual(result['account_id'], 'acc_456')
        self.assertEqual(result['credit_amount'], 1000)
        self.assertEqual(result['debit_amount'], 0)
    
    def test_extract_transaction_data_invalid(self):
        """Test transaction data extraction with invalid data"""
        message_data = "invalid json string"
        
        result = self.monitor._extract_transaction_data(message_data)
        
        self.assertIsNone(result)
    
    def test_extract_transaction_data_empty(self):
        """Test transaction data extraction with empty data"""
        message_data = {}
        
        result = self.monitor._extract_transaction_data(message_data)
        
        self.assertIsNotNone(result)
        self.assertIn('transaction_id', result)
        self.assertIn('account_id', result)
        self.assertIn('credit_amount', result)
        self.assertIn('debit_amount', result)
    
    @patch('kafka_transaction_monitor.DeserializingConsumer')
    def test_create_consumer_success(self, mock_consumer_class):
        """Test successful consumer creation"""
        mock_consumer = Mock()
        mock_consumer_class.return_value = mock_consumer
        
        consumer = self.monitor._create_consumer()
        
        self.assertIsNotNone(consumer)
        mock_consumer.subscribe.assert_called_once_with(['test-topic'])
    
    @patch('kafka_transaction_monitor.DeserializingConsumer')
    def test_create_consumer_failure(self, mock_consumer_class):
        """Test consumer creation failure"""
        mock_consumer_class.side_effect = Exception("Connection failed")
        
        consumer = self.monitor._create_consumer()
        
        self.assertIsNone(consumer)
    
    def test_get_monitoring_stats(self):
        """Test monitoring statistics"""
        self.monitor.stats['messages_processed'] = 10
        self.monitor.stats['transactions_processed'] = 8
        self.monitor.stats['alerts_generated'] = 2
        self.monitor.stats['errors_encountered'] = 1
        
        stats = self.monitor.get_monitoring_stats()
        
        self.assertIn('monitoring_active', stats)
        self.assertIn('kafka_topic', stats)
        self.assertIn('messages_processed', stats)
        self.assertIn('transactions_processed', stats)
        self.assertIn('alerts_generated', stats)
        self.assertIn('errors_encountered', stats)
        
        self.assertEqual(stats['messages_processed'], 10)
        self.assertEqual(stats['transactions_processed'], 8)
        self.assertEqual(stats['alerts_generated'], 2)
        self.assertEqual(stats['errors_encountered'], 1)
    
    def test_update_config_valid(self):
        """Test configuration update with valid values"""
        new_config = {
            'poll_timeout_seconds': 2.0,
            'max_batch_size': 100,
            'enable_real_time_alerts': False,
            'retry_attempts': 5,
            'retry_delay_seconds': 10
        }
        
        result = self.monitor.update_config(new_config)
        
        self.assertTrue(result)
        self.assertEqual(self.monitor.config['poll_timeout_seconds'], 2.0)
        self.assertEqual(self.monitor.config['max_batch_size'], 100)
        self.assertFalse(self.monitor.config['enable_real_time_alerts'])
        self.assertEqual(self.monitor.config['retry_attempts'], 5)
        self.assertEqual(self.monitor.config['retry_delay_seconds'], 10)
    
    def test_update_config_invalid(self):
        """Test configuration update with invalid values"""
        new_config = {
            'poll_timeout_seconds': -1.0,  # Invalid
            'max_batch_size': 0,  # Invalid
            'retry_attempts': 0  # Invalid
        }
        
        result = self.monitor.update_config(new_config)
        
        self.assertFalse(result)
        # Original values should remain unchanged
        self.assertEqual(self.monitor.config['poll_timeout_seconds'], 1.0)
        self.assertEqual(self.monitor.config['max_batch_size'], 50)
        self.assertEqual(self.monitor.config['retry_attempts'], 3)
    
    def test_update_kafka_config_valid(self):
        """Test Kafka configuration update with valid values"""
        new_kafka_config = {
            'bootstrap.servers': 'new-server:9092',
            'group.id': 'new-group',
            'topic': 'new-topic'
        }
        
        result = self.monitor.update_kafka_config(new_kafka_config)
        
        self.assertTrue(result)
        self.assertEqual(self.monitor.kafka_config['bootstrap.servers'], 'new-server:9092')
        self.assertEqual(self.monitor.kafka_config['group.id'], 'new-group')
        self.assertEqual(self.monitor.kafka_config['topic'], 'new-topic')
    
    def test_update_kafka_config_invalid(self):
        """Test Kafka configuration update with missing required fields"""
        new_kafka_config = {
            'bootstrap.servers': 'new-server:9092'
            # Missing group.id and topic
        }
        
        result = self.monitor.update_kafka_config(new_kafka_config)
        
        self.assertFalse(result)
    
    @patch('requests.post')
    def test_alert_callback_success(self, mock_post):
        """Test alert callback with successful backend response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        alert_callback = create_alert_callback("http://localhost:8000")
        
        alerts = [{'alert_id': 'alert_1', 'severity': 'HIGH'}]
        transaction_data = {'transaction_id': 'txn_1'}
        
        # Should not raise exception
        alert_callback(alerts, transaction_data)
        
        mock_post.assert_called_once()
    
    @patch('requests.post')
    def test_alert_callback_failure(self, mock_post):
        """Test alert callback with failed backend response"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_post.return_value = mock_response
        
        alert_callback = create_alert_callback("http://localhost:8000")
        
        alerts = [{'alert_id': 'alert_1', 'severity': 'HIGH'}]
        transaction_data = {'transaction_id': 'txn_1'}
        
        # Should not raise exception even on failure
        alert_callback(alerts, transaction_data)
        
        mock_post.assert_called_once()


class TestT24MessageParsing(unittest.TestCase):
    """Test cases for T24 message parsing scenarios"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_memgraph = Mock()
        self.monitor = KafkaTransactionMonitor(
            memgraph_connection=self.mock_memgraph
        )
    
    def test_t24_transaction_message(self):
        """Test parsing of typical T24 transaction message"""
        t24_message = {
            'table_name': 'FUNDS_TRANSFER',
            'operation': 'INSERT',
            'data': {
                'id': 'FT123456789',
                'debit_account': 'ACC001',
                'credit_account': 'ACC002',
                'amount': 50000.00,
                'transaction_date': '2024-01-15',
                'value_date': '2024-01-15',
                'narrative': 'Transfer to savings account',
                'customer_id': 'CUST001'
            }
        }
        
        result = self.monitor._extract_transaction_data(t24_message)
        
        self.assertIsNotNone(result)
        # Should extract from nested data structure
        self.assertEqual(result['transaction_id'], 'FT123456789')
        self.assertEqual(result['account_id'], 'ACC001')
        self.assertEqual(result['credit_amount'], 50000.00)
        self.assertEqual(result['debit_amount'], 0)
        self.assertEqual(result['description'], 'Transfer to savings account')
        self.assertEqual(result['customer_id'], 'CUST001')
    
    def test_t24_account_message(self):
        """Test parsing of T24 account update message"""
        t24_message = {
            'table_name': 'ACCOUNT',
            'operation': 'UPDATE',
            'data': {
                'account_id': 'ACC001',
                'balance': 150000.00,
                'last_transaction_date': '2024-01-15T14:30:00Z'
            }
        }
        
        result = self.monitor._extract_transaction_data(t24_message)
        
        # Account updates might not be transactions
        # This depends on your business logic
        if result:
            self.assertEqual(result['account_id'], 'ACC001')
    
    def test_t24_customer_message(self):
        """Test parsing of T24 customer update message"""
        t24_message = {
            'table_name': 'CUSTOMER',
            'operation': 'UPDATE',
            'data': {
                'customer_id': 'CUST001',
                'status': 'ACTIVE',
                'last_login': '2024-01-15T10:00:00Z'
            }
        }
        
        result = self.monitor._extract_transaction_data(t24_message)
        
        # Customer updates are typically not transactions
        # This should return None or minimal data
        if result:
            self.assertEqual(result['customer_id'], 'CUST001')


if __name__ == '__main__':
    # Run tests
    unittest.main(verbosity=2)
