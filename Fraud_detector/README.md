# Fraud Detection Service

A standalone fraud detection service that monitors transactions in real-time and feeds fraud alerts to the FraudBackend API.

## Overview

This service has been refactored from a full-stack Flask application to a lightweight, standalone service that:

- Connects to Memgraph database to monitor transactions
- Runs comprehensive fraud detection algorithms
- Generates fraud alerts and risk assessments
- Feeds alerts to the FraudBackend API
- Runs as a background service without web interface

## Features

- **Real-time Kafka Transaction Monitoring**: Consumes T24 transaction data from Kafka topics
- **Advanced Fraud Detection**: Uses multiple algorithms to detect suspicious patterns
- **Alert Generation**: Creates detailed fraud alerts with severity levels
- **Backend Integration**: Automatically sends alerts to FraudBackend API
- **T24 Integration**: Processes real-time transaction data from T24 core banking system
- **Performance Optimization**: Includes caching and efficient message processing
- **Health Monitoring**: Built-in health checks and statistics
- **Configurable**: Easy configuration via command-line arguments

## Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd Fraud_detector
   ```

2. **Create virtual environment (recommended)**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

The service can be configured via command-line arguments:

- `--memgraph-host`: Memgraph database host (default: 10.24.38.54)
- `--memgraph-port`: Memgraph database port (default: 7687)
- `--backend-url`: FraudBackend API URL (default: http://localhost:8000)
- `--daemon`: Run as background daemon
- `--log-level`: Logging level (DEBUG, INFO, WARNING, ERROR)

### Kafka Configuration

The service connects to Kafka to consume T24 transaction data. Default configuration:

- **Bootstrap Servers**: `10.24.38.44:35002`
- **Topic**: `table-update-json`
- **Group ID**: `fraud_detection_group`
- **Auto Offset Reset**: `latest`

You can customize Kafka settings by modifying the `kafka_config` in the service code or by updating the configuration at runtime.

### T24 Message Format

The service expects T24 messages in JSON format from the `table-update-json` topic. The message structure should include:

```json
{
  "table_name": "FUNDS_TRANSFER",
  "operation": "INSERT",
  "data": {
    "id": "FT123456789",
    "debit_account": "ACC001",
    "credit_account": "ACC002",
    "amount": 50000.00,
    "transaction_date": "2024-01-15",
    "narrative": "Transfer to savings account",
    "customer_id": "CUST001"
  }
}
```

The service automatically extracts transaction data from these messages and runs fraud detection algorithms.

## Usage

### Quick Start

**Windows:**
```bash
start_service.bat
```

**Linux/Mac:**
```bash
python start_service.py
```

### Advanced Usage

**Run as daemon:**
```bash
python start_service.py --daemon
```

**Custom configuration:**
```bash
python start_service.py --memgraph-host 192.168.1.100 --backend-url http://backend:8000 --daemon
```

**Direct service usage:**
```python
from fraud_service import FraudDetectionService

service = FraudDetectionService(
    memgraph_host="10.24.38.54",
    memgraph_port=7687,
    backend_url="http://localhost:8000"
)

service.start()
# Service runs in background
```

## Service Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   T24 System    │───►│  Kafka Topics    │───►│  Fraud Service  │
│                 │    │                  │    │                 │
│ - Transactions  │    │ - table-update-  │    │ - Kafka Monitor │
│ - Accounts      │    │   json           │    │ - Fraud Detect  │
│ - Customers     │    │                  │    │ - Alert Gen     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Memgraph DB   │◄───│  Fraud Service   │───►│  FraudBackend   │
│                 │    │                  │    │                 │
│ - Transactions  │    │ - Data Storage   │    │ - API Endpoints │
│ - Customers     │    │ - Analysis       │    │ - WebSocket     │
│ - Accounts      │    │ - Alerts         │    │ - Frontend      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Fraud Detection Algorithms

The service implements multiple fraud detection patterns:

1. **High Frequency Transactions**: Detects unusually high transaction frequency
2. **Large Amount Transactions**: Identifies transactions exceeding thresholds
3. **Unusual Hours Activity**: Flags transactions during suspicious hours
4. **New Account Activity**: Monitors suspicious activity on new accounts
5. **Rapid Fund Movement**: Detects rapid money movement between accounts
6. **Pattern Analysis**: Advanced pattern recognition using machine learning

## API Integration

The service automatically sends fraud alerts to the FraudBackend via HTTP POST requests:

```json
POST /api/v1/alerts/bulk
{
  "alerts": [
    {
      "alert_id": "alert_123",
      "customer_id": "cust_456",
      "transaction_id": "txn_789",
      "alert_type": "HIGH_FREQUENCY",
      "severity": "HIGH",
      "status": "OPEN",
      "description": "Unusually high transaction frequency detected",
      "timestamp": "2024-01-15T10:30:00Z",
      "metadata": {...}
    }
  ]
}
```

## Monitoring and Health Checks

The service provides comprehensive monitoring:

- **Health Check**: `/health` endpoint (if running with web interface)
- **Statistics**: Transaction processing and alert generation metrics
- **Logging**: Detailed logs with configurable levels
- **Error Handling**: Robust error handling and recovery

## Logging

Logs are written to both console and `fraud_service.log` file:

```
2024-01-15 10:30:00 - fraud_service - INFO - Fraud detection service started
2024-01-15 10:30:30 - fraud_service - INFO - Processed 15 recent transactions
2024-01-15 10:30:30 - fraud_service - INFO - Generated 2 alerts for transaction txn_123
```

## Dependencies

- **gqlalchemy**: Memgraph database connectivity
- **requests**: HTTP client for backend communication
- **python-dateutil**: Date/time utilities
- **structlog**: Structured logging

## Troubleshooting

### Common Issues

1. **Memgraph Connection Failed**
   - Check if Memgraph is running
   - Verify host and port configuration
   - Check network connectivity

2. **Backend Connection Failed**
   - Ensure FraudBackend is running
   - Verify backend URL configuration
   - Check firewall settings

3. **Service Won't Start**
   - Check Python version (3.7+ required)
   - Verify all dependencies are installed
   - Check log files for detailed error messages

### Debug Mode

Run with debug logging for detailed information:

```bash
python start_service.py --log-level DEBUG
```

## Development

### Running Tests

```bash
pytest test_fraud_detection.py
```

### Code Quality

```bash
black fraud_service.py
isort fraud_service.py
flake8 fraud_service.py
```

## Migration from Flask App

This service has been migrated from the original Flask application:

- **Removed**: All frontend components (templates, static files, web routes)
- **Removed**: Flask, SocketIO, and web-related dependencies
- **Added**: Standalone service architecture
- **Added**: Backend API integration
- **Improved**: Performance and resource usage

## Support

For issues and questions:
1. Check the log files for error details
2. Verify configuration settings
3. Ensure all dependencies are properly installed
4. Check network connectivity to Memgraph and FraudBackend