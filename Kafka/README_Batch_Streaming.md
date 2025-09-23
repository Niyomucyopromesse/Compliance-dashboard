# Batch Streaming to Kafka Producer

This document describes the batch streaming functionality implemented in `T24_Kafka.py` that processes messages in batches and streams them to a Kafka producer.

## Overview

The system now processes incoming Kafka messages in configurable batches and streams them to an output Kafka topic. This approach provides:

- **Better Performance**: Batch processing reduces overhead
- **Improved Throughput**: Efficient producer configuration with compression
- **Error Handling**: Robust error handling and retry mechanisms
- **Monitoring**: Comprehensive logging and delivery reports

## Configuration

### Key Configuration Parameters

```python
# Configuration
BATCH_SIZE = 10  # Number of messages to batch before streaming
OUTPUT_TOPIC = 'table-update-json'  # Topic to stream processed data to
ENABLE_DEBUG_LOGGING = False  # Set to True for detailed delivery reports
PRINT_STREAMED_DATA = True  # Set to True to print streamed data to console
```

### Producer Configuration

The producer is configured with optimized settings for high throughput:

```python
producer_conf = {
    'bootstrap.servers': '10.24.38.44:35002',
    'key.serializer': StringSerializer('utf_8'),
    'value.serializer': StringSerializer('utf_8'),
    'batch.size': 16384,  # 16KB batch size for better throughput
    'linger.ms': 5,       # Wait up to 5ms to batch messages
         'compression.type': 'snappy',  # Enable compression
     'acks': 'all',        # Wait for all replicas acknowledgment (required for idempotence)
     'retries': 3,         # Retry failed sends
    'max.in.flight.requests.per.connection': 5,
    'request.timeout.ms': 30000,
    'delivery.timeout.ms': 120000,
}
```

## How It Works

### 1. Message Processing Flow

1. **Consume Messages**: Messages are consumed from the source topic (`table-update`)
2. **Batch Collection**: Messages are collected into batches of configurable size
3. **Data Transformation**: Each message is flattened and mapped using the `SOURCE_TO_DEST_MAPPING`
4. **Batch Streaming**: When batch size is reached, messages are streamed to the output topic
5. **Parallel Processing**: Batches are processed in parallel using ThreadPoolExecutor

### 2. Message Structure

Each message sent to the output topic has the following structure:

```json
{
    "entity_name": "FBNK_CUSTOMER",
    "value": {
        "RECID": "CUST001",
        "GIVEN_NAMES": "John",
        "FAMILY_NAME": "Doe",
        "DATE_OF_BIRTH": "1990-01-01",
        "GENDER": "M",
        "NATIONALITY": "RW",
        "CUSTOMER_STATUS": "ACTIVE",
        "EMAIL_D_1": "john.doe@example.com",
        "SMS_D_1": "+250781234567",
        "RESIDENCE": "Kigali, Rwanda",
        "KYC_COMPLETE": "Y",
        "AML_RESULT": "PASS",
        "MANUAL_RISK_CLASS": "LOW",
        "ACCOUNT_OFFICER": "AO001",
        "SEGMENT": "RETAIL",
        "INDUSTRY": "PERSONAL",
        "CUSTOMER_SINCE": "2020-01-01",
        "SDS_DATE": "2024-01-15T10:30:00"
    },
    "timestamp": "2024-01-15T10:30:00.123456",
    "batch_index": 1,
    "batch_size": 10
}
```

### 3. Key Functions

#### `stream_batch_to_producer(messages_batch, producer)`
- Streams a batch of messages to the Kafka producer
- Creates unique keys for each message
- Handles errors gracefully
- Provides progress logging for large batches
- Returns success and error counts

#### `log_delivery_status(success_count, error_count, batch_size)`
- Logs delivery status for batch processing
- Provides batch-level success/error reporting
- Configurable debug logging

#### `process_messages(consumer, producer, executor, batch_size)`
- Main processing loop
- Manages batch collection and streaming
- Handles consumer errors and deserialization issues
- Provides comprehensive logging

## Usage

### Running the Application

```bash
cd EC2_Project/Kafka
python T24_Kafka.py
```

### Testing the Functionality

Use the provided test script to verify the streaming functionality:

```bash
# Test the producer fix
python test_producer_fix.py

# Test the data printing functionality
python test_data_printing.py

# Test the full streaming functionality
python test_streaming.py
```

**Note**: Update the Kafka server address in the test scripts to match your environment.

## Monitoring and Logging

### Log Messages

The system provides comprehensive logging:

- 🚀 **Streaming Started**: Initial setup and configuration
- 📊 **Processing Stats**: Batch size and target topic information
- 📦 **Batch Submission**: When batches are submitted for streaming
- 📤 **Progress Updates**: Progress for large batches
- ✅ **Success Reports**: Successful message deliveries
- ❌ **Error Reports**: Failed deliveries and processing errors

### Performance Metrics

The system tracks:
- Total messages processed
- Batch count
- Success/error rates
- Processing duration

## Error Handling

### Producer Errors
- Automatic retries (up to 3 attempts)
- Delivery timeout handling
- Graceful error logging

### Consumer Errors
- Deserialization error handling
- Connection error recovery
- Graceful shutdown on interruption

### Batch Processing Errors
- Individual message error isolation
- Batch continuation on partial failures
- Error count tracking

## Performance Optimization

### Batch Size Tuning
- **Small batches (5-10)**: Lower latency, higher overhead
- **Large batches (50-100)**: Higher throughput, higher latency
- **Optimal range**: 10-50 messages per batch

### Producer Tuning
- **Compression**: Snappy compression for better throughput
- **Batching**: 16KB batch size with 5ms linger
- **Parallelism**: 20 worker threads for batch processing

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify Kafka server address and port
   - Check network connectivity
   - Ensure Kafka cluster is running

2. **Delivery Failures**
   - Check topic exists and has proper permissions
   - Verify producer configuration
   - Monitor broker logs

3. **Performance Issues**
   - Adjust batch size based on message volume
   - Tune producer configuration
   - Monitor system resources

4. **Producer Errors**
   - **Callback Parameter Error**: `SerializingProducer.produce()` got an unexpected keyword argument 'callback'
     - **Solution**: Remove the `callback` parameter from `producer.produce()` calls
     - **Note**: `SerializingProducer` doesn't support callbacks like the regular `Producer`
     - **Alternative**: Use batch-level logging and error tracking instead
   
   - **Invalid Configuration Error**: `No such configuration property: "max.request.size"`
     - **Solution**: Remove `max.request.size` from producer configuration
     - **Note**: `SerializingProducer` doesn't support this configuration property
     - **Alternative**: Use `batch.size` and `linger.ms` for message size control
   
   - **Idempotence Configuration Error**: `acks` must be set to `all` when `enable.idempotence` is true
     - **Solution**: Change `acks` from `'1'` to `'all'` when using idempotence
     - **Note**: Idempotence requires all replicas to acknowledge messages
     - **Alternative**: Disable idempotence if you want to use `acks: '1'`

### Recent Fixes

- **Fixed**: Removed unsupported `callback` parameter from `SerializingProducer.produce()`
- **Fixed**: Removed invalid `max.request.size` configuration property from `SerializingProducer`
- **Fixed**: Changed `acks` from `'1'` to `'all'` to support idempotence configuration
- **Added**: Enhanced error handling and batch-level delivery status logging
- **Improved**: Producer configuration with idempotence and better timeout settings

### Debug Mode

Enable detailed logging by setting:
```python
ENABLE_DEBUG_LOGGING = True
```

This will show individual message delivery confirmations.

### Data Printing Mode

Enable detailed data printing by setting:
```python
PRINT_STREAMED_DATA = True
```

This will show:
- Complete customer data for each message
- Message keys and metadata
- Batch summaries
- Streaming progress

**Example Output:**
```
================================================================================
📤 STREAMING MESSAGE 1/10 TO PRODUCER
================================================================================
🔑 Message Key: FBNK_CUSTOMER_20240115_103000_123456_1
📋 Entity: FBNK_CUSTOMER
⏰ Timestamp: 2024-01-15T10:30:00.123456
📦 Batch Info: 1/10
📄 Topic: table-update-json

📊 CUSTOMER DATA:
--------------------------------------------------
  RECID: CUST001
  GIVEN_NAMES: John
  FAMILY_NAME: Doe
  DATE_OF_BIRTH: 1990-01-01
  GENDER: M
  NATIONALITY: RW
  CUSTOMER_STATUS: ACTIVE
  EMAIL_D_1: john.doe@example.com
  SMS_D_1: +250781234567
  RESIDENCE: Kigali, Rwanda
  KYC_COMPLETE: Y
  AML_RESULT: PASS
  MANUAL_RISK_CLASS: LOW
  ACCOUNT_OFFICER: AO001
  SEGMENT: RETAIL
  INDUSTRY: PERSONAL
  CUSTOMER_SINCE: 2020-01-01
  SDS_DATE: 2024-01-15T10:30:00
================================================================================
✅ Message 1 ready for streaming
================================================================================
```

## Future Enhancements

- **Metrics Collection**: Integration with monitoring systems
- **Dynamic Batching**: Adaptive batch sizes based on load
- **Schema Evolution**: Support for schema changes
- **Dead Letter Queue**: Failed message handling
- **Circuit Breaker**: Automatic failure detection and recovery 