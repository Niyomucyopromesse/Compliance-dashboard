#!/usr/bin/env python3
"""
Integration test for Fraud Detection Service

This test verifies that the service can properly communicate with the FraudBackend.
"""

import unittest
import time
import requests
import json
from unittest.mock import Mock, patch, MagicMock
from fraud_service import FraudDetectionService

class TestFraudServiceIntegration(unittest.TestCase):
    """Test cases for fraud service integration"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.service = FraudDetectionService(
            memgraph_host="localhost",
            memgraph_port=7687,
            backend_url="http://localhost:8000"
        )
    
    def test_service_initialization(self):
        """Test service initializes correctly"""
        self.assertIsNotNone(self.service)
        self.assertFalse(self.service.is_running)
        self.assertEqual(self.service.backend_url, "http://localhost:8000")
    
    @patch('fraud_service.Memgraph')
    def test_memgraph_connection_success(self, mock_memgraph):
        """Test successful Memgraph connection"""
        mock_memgraph.return_value = Mock()
        
        service = FraudDetectionService()
        self.assertIsNotNone(service.memgraph)
    
    @patch('fraud_service.Memgraph')
    def test_memgraph_connection_failure(self, mock_memgraph):
        """Test Memgraph connection failure handling"""
        mock_memgraph.side_effect = Exception("Connection failed")
        
        service = FraudDetectionService()
        self.assertIsNone(service.memgraph)
    
    @patch('requests.post')
    def test_send_alerts_to_backend_success(self, mock_post):
        """Test successful alert sending to backend"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        # Mock alerts
        mock_alert = Mock()
        mock_alert.alert_id = "test_alert_1"
        mock_alert.customer_id = "test_customer"
        mock_alert.transaction_id = "test_transaction"
        mock_alert.alert_type.value = "HIGH_FREQUENCY"
        mock_alert.severity.value = "HIGH"
        mock_alert.status.value = "OPEN"
        mock_alert.description = "Test alert"
        mock_alert.timestamp.isoformat.return_value = "2024-01-15T10:30:00Z"
        mock_alert.metadata = {}
        
        # Mock the enhanced fraud detector
        self.service.enhanced_fraud_detector = Mock()
        self.service.enhanced_fraud_detector.get_active_alerts.return_value = [mock_alert]
        
        # Test sending alerts
        self.service._send_alerts_to_backend()
        
        # Verify request was made
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        self.assertEqual(call_args[0][0], "http://localhost:8000/api/v1/alerts/bulk")
        
        # Verify request data
        request_data = call_args[1]['json']
        self.assertIn('alerts', request_data)
        self.assertEqual(len(request_data['alerts']), 1)
        self.assertEqual(request_data['alerts'][0]['alert_id'], "test_alert_1")
    
    @patch('requests.post')
    def test_send_alerts_to_backend_failure(self, mock_post):
        """Test alert sending failure handling"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_post.return_value = mock_response
        
        # Mock alerts
        mock_alert = Mock()
        mock_alert.alert_id = "test_alert_1"
        mock_alert.customer_id = "test_customer"
        mock_alert.transaction_id = "test_transaction"
        mock_alert.alert_type.value = "HIGH_FREQUENCY"
        mock_alert.severity.value = "HIGH"
        mock_alert.status.value = "OPEN"
        mock_alert.description = "Test alert"
        mock_alert.timestamp.isoformat.return_value = "2024-01-15T10:30:00Z"
        mock_alert.metadata = {}
        
        # Mock the enhanced fraud detector
        self.service.enhanced_fraud_detector = Mock()
        self.service.enhanced_fraud_detector.get_active_alerts.return_value = [mock_alert]
        
        # Test sending alerts (should not raise exception)
        self.service._send_alerts_to_backend()
        
        # Verify request was made
        mock_post.assert_called_once()
    
    @patch('requests.get')
    def test_health_check_backend_connected(self, mock_get):
        """Test health check with backend connected"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        # Mock memgraph
        self.service.memgraph = Mock()
        self.service.memgraph.execute_and_fetch.return_value = [{'count': 100}]
        
        health = self.service.health_check()
        
        self.assertEqual(health['status'], 'stopped')  # Service not running
        self.assertTrue(health['memgraph_connected'])
        self.assertTrue(health['backend_connected'])
        self.assertEqual(health['customer_count'], 100)
    
    @patch('requests.get')
    def test_health_check_backend_disconnected(self, mock_get):
        """Test health check with backend disconnected"""
        mock_get.side_effect = requests.exceptions.RequestException("Connection failed")
        
        # Mock memgraph
        self.service.memgraph = Mock()
        self.service.memgraph.execute_and_fetch.return_value = [{'count': 100}]
        
        health = self.service.health_check()
        
        self.assertEqual(health['status'], 'stopped')  # Service not running
        self.assertTrue(health['memgraph_connected'])
        self.assertFalse(health['backend_connected'])
        self.assertEqual(health['customer_count'], 100)
    
    def test_get_service_stats(self):
        """Test service statistics"""
        stats = self.service.get_service_stats()
        
        self.assertIn('is_running', stats)
        self.assertIn('memgraph_connected', stats)
        self.assertIn('stats', stats)
        self.assertIn('cache_size', stats)
        self.assertIn('backend_url', stats)
        
        self.assertFalse(stats['is_running'])
        self.assertEqual(stats['backend_url'], "http://localhost:8000")
    
    @patch('fraud_service.Memgraph')
    def test_service_start_stop(self, mock_memgraph):
        """Test service start and stop"""
        mock_memgraph.return_value = Mock()
        
        service = FraudDetectionService()
        
        # Test start
        service.start()
        self.assertTrue(service.is_running)
        self.assertIsNotNone(service.monitoring_thread)
        
        # Test stop
        service.stop()
        self.assertFalse(service.is_running)
    
    def test_fraud_analysis_no_transactions(self):
        """Test fraud analysis with no transactions"""
        # Mock memgraph to return no transactions
        self.service.memgraph = Mock()
        self.service.memgraph.execute_and_fetch.return_value = []
        
        result = self.service.run_fraud_analysis("test_customer")
        
        self.assertIn('error', result)
        self.assertEqual(result['error'], 'No transactions found for customer')
    
    @patch('fraud_service.Memgraph')
    def test_fraud_analysis_with_transactions(self, mock_memgraph):
        """Test fraud analysis with transactions"""
        # Mock memgraph responses
        mock_memgraph_instance = Mock()
        mock_memgraph.return_value = mock_memgraph_instance
        
        # Mock transaction data
        mock_transactions = [
            {
                'transaction_id': 'txn_1',
                'transaction_time': '2024-01-15T10:00:00Z',
                'credit_amount': 1000,
                'debit_amount': 0,
                'credit_account': 'acc_1',
                'debit_account': 'acc_2',
                'description': 'Test transaction',
                'account_id': 'acc_1',
                'customer_id': 'test_customer'
            }
        ]
        
        mock_customer = {
            'customer_id': 'test_customer',
            'full_name': 'Test Customer',
            'segment': 'PREMIUM',
            'risk_class': 'LOW'
        }
        
        # Configure mock responses
        mock_memgraph_instance.execute_and_fetch.side_effect = [
            mock_transactions,  # First call for transactions
            [mock_customer]     # Second call for customer profile
        ]
        
        # Mock enhanced fraud detector
        service = FraudDetectionService()
        service.memgraph = mock_memgraph_instance
        service.enhanced_fraud_detector = Mock()
        service.enhanced_fraud_detector.run_comprehensive_fraud_check.return_value = []
        
        result = service.run_fraud_analysis("test_customer")
        
        self.assertIn('customer_id', result)
        self.assertEqual(result['customer_id'], 'test_customer')
        self.assertIn('total_transactions', result)
        self.assertEqual(result['total_transactions'], 1)
        self.assertIn('risk_level', result)


class TestServiceConfiguration(unittest.TestCase):
    """Test service configuration options"""
    
    def test_custom_configuration(self):
        """Test service with custom configuration"""
        service = FraudDetectionService(
            memgraph_host="custom_host",
            memgraph_port=9999,
            backend_url="http://custom-backend:9000"
        )
        
        self.assertEqual(service.backend_url, "http://custom-backend:9000")
    
    def test_backend_url_normalization(self):
        """Test backend URL normalization"""
        service = FraudDetectionService(backend_url="http://localhost:8000/")
        self.assertEqual(service.backend_url, "http://localhost:8000")


if __name__ == '__main__':
    # Run tests
    unittest.main(verbosity=2)
