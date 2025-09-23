# WebSocket Integration for Fraud Detection Alerts

This document explains how the fraud detection service integrates with the backend WebSocket system to broadcast real-time alerts to the frontend.

## Overview

The integration allows fraud detection alerts to be automatically broadcast to connected frontend clients in real-time, providing immediate notification of suspicious activities.

## How It Works

### 1. Alert Creation Flow

When your fraud detection service posts alerts to the `/api/v1/alerts/bulk` endpoint:

1. **Alert Processing**: Each alert in the bulk payload is processed individually
2. **Database Storage**: Alerts are stored in the Memgraph database
3. **WebSocket Broadcast**: Each successfully created alert is automatically broadcast via WebSocket
4. **Frontend Notification**: Connected frontend clients receive the alert in real-time

### 2. WebSocket Message Format

Alerts are broadcast using the following WebSocket message format:

```json
{
  "type": "alert",
  "data": {
    "alert_id": "ALERT_12345",
    "alert_type": "suspicious_transaction",
    "severity": "high",
    "status": "open",
    "description": "Unusual large transaction amount detected",
    "risk_score": 85,
    "transaction_id": "TX_67890",
    "account_id": "ACC001",
    "customer_id": "CUST001",
    "amount": 5000.00,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Frontend Integration

Frontend clients need to:

1. **Connect to WebSocket**: Connect to `ws://localhost:8000/ws/monitor`
2. **Subscribe to Alerts**: Send subscription message:
   ```json
   {
     "type": "subscribe",
     "data": {"type": "alerts"}
   }
   ```
3. **Handle Alert Messages**: Listen for messages with `type: "alert"`

## API Endpoints

### POST /api/v1/alerts/bulk

This is the main endpoint your fraud detection service should use to send alerts.

**Request Format:**
```json
{
  "alerts": [
    {
      "alert_id": "ALERT_12345",
      "alert_type": "suspicious_transaction",
      "severity": "high",
      "status": "open",
      "description": "Unusual large transaction amount detected",
      "amount": 5000.00,
      "customer_id": "CUST001",
      "account_id": "ACC001",
      "transaction_id": "TX_67890",
      "risk_score": 85,
      "additional_data": {
        "custom_field": "value"
      }
    }
  ],
  "transaction_data": {
    "amount": 5000.00,
    "currency": "USD"
  },
  "source": "fraud_detection_service"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Created 1 out of 1 alerts",
  "created_count": 1,
  "total_count": 1
}
```

### WebSocket Endpoint

- **URL**: `ws://localhost:8000/ws/monitor`
- **Purpose**: Real-time communication with frontend clients

## Testing the Integration

### 1. Run the Test Script

```bash
cd FraudBackend
python test_websocket_integration.py
```

This script will:
- Test WebSocket connection
- Send a test alert via the bulk endpoint
- Verify the alert is broadcast via WebSocket

### 2. Manual Testing

1. **Start the Backend**:
   ```bash
   cd FraudBackend
   uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Connect to WebSocket** (using a WebSocket client or browser):
   ```javascript
   const ws = new WebSocket('ws://localhost:8000/ws/monitor');
   
   ws.onopen = function() {
     // Subscribe to alerts
     ws.send(JSON.stringify({
       type: "subscribe",
       data: { type: "alerts" }
     }));
   };
   
   ws.onmessage = function(event) {
     const message = JSON.parse(event.data);
     if (message.type === 'alert') {
       console.log('New alert received:', message.data);
     }
   };
   ```

3. **Send Test Alert**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/alerts/bulk \
     -H "Content-Type: application/json" \
     -d '{
       "alerts": [{
         "alert_id": "TEST_123",
         "alert_type": "suspicious_transaction",
         "severity": "high",
         "status": "open",
         "description": "Test alert",
         "risk_score": 80,
         "customer_id": "CUST001",
         "account_id": "ACC001"
       }],
       "source": "test"
     }'
   ```

## Error Handling

The integration includes robust error handling:

- **WebSocket Failures**: If WebSocket broadcast fails, the alert is still created in the database
- **Partial Failures**: If some alerts in a bulk request fail, successful ones are still processed
- **Connection Management**: WebSocket connections are automatically cleaned up on disconnect

## Logging

The integration provides detailed logging:

- Alert creation and broadcast success/failure
- WebSocket connection events
- Error details for troubleshooting

Check the backend logs for messages like:
- `"Alert broadcasted via WebSocket: ALERT_12345"`
- `"Processing bulk alerts from fraud_detection_service: 3 alerts"`
- `"Successfully created and broadcasted alert: ALERT_12345"`

## Configuration

No additional configuration is required. The WebSocket integration is automatically enabled when the backend starts.

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure the backend is running on port 8000
   - Check firewall settings
   - Verify WebSocket URL is correct

2. **Alerts Not Broadcasting**
   - Check backend logs for error messages
   - Verify alert data format matches the schema
   - Ensure WebSocket connections are active

3. **Frontend Not Receiving Alerts**
   - Verify frontend is subscribed to "alerts" channel
   - Check WebSocket connection status
   - Review browser console for errors

### Debug Endpoints

- **WebSocket Status**: `GET /api/v1/websocket/status`
- **Health Check**: `GET /health`
- **Mock Alert**: `POST /api/v1/mock/send-alert`

## Integration with Your Fraud Service

To integrate with your existing fraud detection service:

1. **Replace Mock Data**: Stop the mock data service if running
2. **Update Endpoint**: Point your fraud service to `http://localhost:8000/api/v1/alerts/bulk`
3. **Format Data**: Ensure your alert data matches the expected schema
4. **Test**: Use the test script to verify the integration works

The WebSocket broadcasting will happen automatically for all alerts created through the bulk endpoint.
