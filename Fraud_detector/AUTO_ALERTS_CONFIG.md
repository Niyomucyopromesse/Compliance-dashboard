# Auto-Alerts Configuration

This document explains how to control automatic alert creation in the fraud detection system.

## Overview

By default, the fraud detection system will **NOT** automatically create alerts in the database unless explicitly configured to do so. This prevents the frontend from being flooded with automatically generated alerts.

## Configuration

### Command Line Usage

```bash
# Run with auto-alerts disabled (default)
python start_service.py

# Run with auto-alerts enabled
python start_service.py --auto-create-alerts
```

### Programmatic Usage

```python
from fraud_service import FraudDetectionService

# Disable automatic alert creation (default)
service = FraudDetectionService(auto_create_alerts=False)

# Enable automatic alert creation
service = FraudDetectionService(auto_create_alerts=True)
```

### Direct FraudDetector Usage

```python
from fraud_detection_engine import EnhancedFraudDetector

# Disable automatic alert creation (default)
detector = EnhancedFraudDetector(memgraph_connection, auto_create_alerts=False)

# Enable automatic alert creation
detector = EnhancedFraudDetector(memgraph_connection, auto_create_alerts=True)
```

## Behavior

### When Auto-Create Alerts is Disabled (Default)

- Fraud detection algorithms still run and generate alert objects
- Alert objects are **always returned** by detection methods (not None)
- Alerts are logged for monitoring purposes
- Alerts are **NOT** automatically stored in the database
- Alerts can still be sent to the backend via callbacks if configured
- Manual alert creation is still possible using the `force_create=True` parameter

### When Auto-Create Alerts is Enabled

- Fraud detection algorithms run and generate alert objects
- Alerts are automatically stored in the database
- Alerts are sent to connected frontend clients via WebSocket
- All alert processing happens automatically

## Force Alert Creation

Even when auto-create is disabled, you can force individual alerts to be created:

```python
# Force create a specific alert
fraud_detector.create_alert(alert_data, force_create=True)
```

## Examples

### Development/Testing Environment

```bash
# Enable auto-alerts for testing
python start_service.py --auto-create-alerts
```

### Production Environment

```bash
# Disable auto-alerts for production (default)
python start_service.py --daemon
```

### Manual Alert Creation Only

```python
# Create service without auto-alerts
service = FraudDetectionService(auto_create_alerts=False)

# Manually create alerts when needed
detector = service.enhanced_fraud_detector
detector.create_alert(alert_data, force_create=True)
```

## Logging

The system will log the auto-alert configuration:

```
INFO - Alert creation skipped (auto_create_alerts=False): HIGH_AMOUNT - Large transaction detected
WARNING - 🚨 FRAUD ALERT CREATED: HIGH_AMOUNT - HIGH - Large transaction detected
```

## Migration Notes

- Existing installations will continue to work with auto-alerts disabled by default
- To enable auto-alerts on existing systems, use the `--auto-create-alerts` flag
- No database migration is required
