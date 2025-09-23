import json
import pyodbc
from confluent_kafka import DeserializingConsumer, SerializingProducer
from confluent_kafka.serialization import StringDeserializer,StringSerializer
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroDeserializer
import logging
from datetime import datetime, date
from concurrent.futures import ThreadPoolExecutor
import time
# from teams_logging import FilteredTeamsLoggingHandler
from confluent_kafka.error import ValueDeserializationError
from stop_service import stop_service

# Production logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Configuration
BATCH_SIZE = 10  # Number of messages to batch before streaming
OUTPUT_TOPIC = 'table-update-json'  # Topic to stream processed data to
ENABLE_DEBUG_LOGGING = False  # Set to True for detailed delivery reports
PRINT_STREAMED_DATA = True  # Set to False for production - no console output

# webhook_url = "https://bankofkigalirw.webhook.office.com/webhookb2/738d38e9-fdd2-44b4-bba0-b515f895fe6c@9766f6af-73b8-40a2-8694-ede49d30d84e/IncomingWebhook/8865308e770c458a96fee69528b2066a/d8e49520-1de0-4aba-bac7-ea055974c5c5"  
# teams_handler = FilteredTeamsLoggingHandler(webhook_url)
# logging.getLogger().addHandler(teams_handler)




# Customer field mapping
CUSTOMER_SOURCE_TO_DEST_MAPPING = {
    "payload_recId": "RECID",
    "payload_GivenNames": "GIVEN_NAMES",
    "payload_FamilyName": "FAMILY_NAME",
    "payload_DateOfBirth": "DATE_OF_BIRTH",
    "payload_Gender": "GENDER",
    "payload_MaritalStatus": "MARITAL_STATUS",
    "payload_Nationality": "NATIONALITY",
    "payload_CustomerStatus": "CUSTOMER_STATUS",
    "Email_D_1": "EMAIL_D_1",
    "Sms_D_1": "SMS_D_1",
    "ARRAY_Address_Address": "RESIDENCE",
    "payload_KycComplete": "KYC_COMPLETE",
    "payload_AmlResult": "AML_RESULT",
    "payload_ManualRiskClass": "MANUAL_RISK_CLASS",
    "payload_AccountOfficer": "ACCOUNT_OFFICER",
    "payload_Segment": "SEGMENT",
    "payload_Industry": "INDUSTRY",
    "payload_CustomerSince": "CUSTOMER_SINCE",
    "payload_SpName": "BK_SPOUSE_NAME",
    "RECORD_BkNextkinName_BkNextkinName": "BK_NEXT_KIN_NAME",
    "emittedTime": "SDS_DATE",
    "payload_Title": "TITLE",
    "payload_Language": "LANGUAGE",
    "payload_Target": "TARGET"
}

ACCOUNT_SOURCE_TO_DEST_MAPPING = {
    "payload_recId": "RECID",
    "payload_AccountNumber": "ACCOUNT_NUMBER",
    "payload_Customer": "CUSTOMER",
    "payload_Category": "CATEGORY",
    "payload_PositionType": "POSITION_TYPE",
    "payload_OpenActualBal": "OPEN_ACTUAL_BAL",
    "payload_OpenClearedBal": "OPEN_CLEARED_BAL",
    "payload_OnlineActualBal": "ONLINE_ACTUAL_BAL",
    "payload_OnlineClearedBal": "ONLINE_CLEARED_BAL",
    "payload_WorkingBalance": "WORKING_BALANCE",
    "payload_OpenAvailableBal": "OPEN_AVAILABLE_BAL",
    "payload_AccountOfficer": "ACCOUNT_OFFICER",
    "payload_CoCode": "CO_CODE",
    "payload_ARRAY_AccountTitle_D_1": "ACCOUNT_TITLE_D_1",
    "AccountTitle_D_1": "ACCOUNT_TITLE_D_1",  # Alternative mapping
    "payload_ARRAY_ShortTitle": "SHORT_TITLE",
    "ARRAY_ShortTitle_ShortTitle": "SHORT_TITLE",  # Alternative mapping
    "payload_Mnemonic": "MNEMONIC",
    "payload_OpeningDate": "OPENING_DATE",
    "payload_DateLastUpdate": "DATE_LAST_UPDATE",
    "payload_ARRAY_AltAcctType": "ALT_ACCT_TYPE",
    "context_operation": "OPERATION",
    "context_function": "FUNCTION",
    
    # Currency and Market Information
    "payload_Currency": "CURRENCY",
    "payload_CurrencyMarket": "CURRENCY_MARKET",
    
    # Transaction History Fields
    "payload_DateLastCrCust": "DATE_LAST_CR_CUST",
    "payload_AmntLastCrCust": "AMNT_LAST_CR_CUST",
    "payload_TranLastCrCust": "TRAN_LAST_CR_CUST",
    "payload_DateLastDrCust": "DATE_LAST_DR_CUST",
    "payload_AmntLastDrCust": "AMNT_LAST_DR_CUST",
    "payload_TranLastDrCust": "TRAN_LAST_DR_CUST",
    
    # Additional Transaction History Fields
    "payload_DateLastCrAuto": "DATE_LAST_CR_AUTO",
    "payload_AmntLastCrAuto": "AMNT_LAST_CR_AUTO",
    "payload_TranLastCrAuto": "TRAN_LAST_CR_AUTO",
    "payload_DateLastCrBank": "DATE_LAST_CR_BANK",
    "payload_AmntLastCrBank": "AMNT_LAST_CR_BANK",
    "payload_TranLastCrBank": "TRAN_LAST_CR_BANK",
    "payload_DateLastDrAuto": "DATE_LAST_DR_AUTO",
    "payload_AmntLastDrAuto": "AMNT_LAST_DR_AUTO",
    "payload_TranLastDrAuto": "TRAN_LAST_DR_AUTO",
    "payload_DateLastDrBank": "DATE_LAST_DR_BANK",
    "payload_AmntLastDrBank": "AMNT_LAST_DR_BANK",
    "payload_TranLastDrBank": "TRAN_LAST_DR_BANK",
    
    # Account Status and Control Fields
    "payload_CreditCheck": "CREDIT_CHECK",
    "payload_AvailableBalUpd": "AVAILABLE_BAL_UPD",
    "payload_ClosureDate": "CLOSURE_DATE",
    
    # Alternative Account Identifiers
    "RECORD_AltAcctType_AltAcctType": "ALT_ACCT_TYPE",
    "RECORD_AltAcctType_AltAcctId": "ALT_ACCT_ID",
    
    # Event and Request Information
    "RECORD_Event_Event": "EVENT_TYPE",
    "RECORD_Event_RequestId": "REQUEST_ID",
    
    # Additional Date Fields
    "ARRAY_CapDateCharge_CapDateCharge": "CAP_DATE_CHARGE",
    "ARRAY_DateTime_DateTime": "DATE_TIME",
    "ARRAY_AccDebLimit_AccDebLimit": "ACC_DEB_LIMIT",
    
    # Timestamps
    "emittedTime": "SDS_DATE",
    "processingTime": "PROCESSING_TIME"
}

# Funds Transfer field mapping
FUNDS_TRANSFER_SOURCE_TO_DEST_MAPPING = {
    "payload_recId": "RECID",
    "payload_PaymentDetails": "PAYMENT_DETAILS",
    "payload_TransactionType": "TRANSACTION_TYPE",
    "payload_DebitAcctNo": "DEBIT_ACCT_NO",
    "payload_DebitCustomer":"DEBIT_CUST_NO",
    "payload_CreditCustomer":"CREDIT_CUST_NO",
    "payload_CreditAcctNo": "CREDIT_ACCT_NO",
    "payload_LocAmtDebited": "LOC_AMT_DEBITED",
    "payload_LocAmtCredited": "LOC_AMT_CREDITED",
    "payload_LocalChargeAmt": "LOCAL_CHARGE_AMT",
    "payload_DebitValueDate": "DEBIT_VALUE_DATE",
    "payload_ProcessingDate": "PROCESSING_DATE",
    "ARRAY_PaymentDetails_PaymentDetails": "PAYMENT_DETAILS",
    "processingTime": "TRANSACTION_TIME"
}



# Entity mapping configuration
ENTITY_MAPPINGS = {
    "FBNK_CUSTOMER": CUSTOMER_SOURCE_TO_DEST_MAPPING,
    "FBNK_FUNDS_TRANSFER": FUNDS_TRANSFER_SOURCE_TO_DEST_MAPPING,
    "FBNK_ACCOUNT": ACCOUNT_SOURCE_TO_DEST_MAPPING
}

# Date field configurations
DATE_FIELDS = {
    "DEBIT_VALUE_DATE": "%Y%m%d",  # Format: 20250826
    "PROCESSING_DATE": "%Y%m%d",   # Format: 20250826
    "DATE_OF_BIRTH": "%Y%m%d",     # Format: YYYYMMDD
    "CUSTOMER_SINCE": "%Y%m%d",    # Format: YYYYMMDD
    "TRANSACTION_TIME": "timestamp_ms",     # Timestamp in milliseconds
    "OPENING_DATE": "%Y%m%d",      # Format: YYYYMMDD
    "DATE_LAST_UPDATE": "%Y%m%d",  # Format: YYYYMMDD
    "DATE_LAST_CR_CUST": "%Y%m%d", # Format: YYYYMMDD
    "DATE_LAST_DR_CUST": "%Y%m%d", # Format: YYYYMMDD
    "CLOSURE_DATE": "%Y%m%d",      # Format: YYYYMMDD
    "SDS_DATE": "timestamp_ms",    # Timestamp in milliseconds
    "PROCESSING_TIME": "timestamp_ms",  # Timestamp in milliseconds
    
    # Additional date fields from T24 data
    "DATE_LAST_CR_AUTO": "%Y%m%d", # Format: YYYYMMDD
    "DATE_LAST_CR_BANK": "%Y%m%d", # Format: YYYYMMDD
    "DATE_LAST_DR_AUTO": "%Y%m%d", # Format: YYYYMMDD
    "DATE_LAST_DR_BANK": "%Y%m%d", # Format: YYYYMMDD
    "CAP_DATE_CHARGE": "%Y%m%d",   # Format: YYYYMMDD
    "DATE_TIME": "%Y%m%d%H%M",     # Format: YYYYMMDDHHMM
    "ACC_DEB_LIMIT": "%Y%m%d"      # Format: YYYYMMDD
}


def flatten_json(nested_json, parent_key='', sep='_', list_delimiter='~'):
    flattened_json = {}

    def flatten(item, prefix=''):
        if isinstance(item, dict):
            for key, value in item.items():
                new_prefix = f"{prefix}{sep}{key}" if prefix else key
                flatten(value, new_prefix)
        elif isinstance(item, list):
            values = []
            for element in item:
                if isinstance(element, dict):
                    for sub_key, sub_value in element.items():
                        sub_prefix = f"{prefix}{sep}{sub_key}" if prefix else sub_key
                        flatten(sub_value, sub_prefix)
                else:
                    values.append(element)
            if values:
                last_two_levels_key = sep.join(prefix.split(sep)[-3:])
                current_value = flattened_json.get(last_two_levels_key, '')
                flattened_json[last_two_levels_key] = f"{current_value}{list_delimiter}{','.join(map(str, values))}" if current_value else ','.join(map(str, values))
        else:
            last_two_levels_key = sep.join(prefix.split(sep)[-3:])
            current_value = flattened_json.get(last_two_levels_key, '')
            flattened_json[last_two_levels_key] = f"{current_value}{list_delimiter}{item}" if current_value else str(item)

    flatten(nested_json)
    return {key: val for key, val in flattened_json.items()}

def convert_date_fields(data_dict):
    """
    Convert date fields in the data dictionary to proper date format
    """
    converted_data = data_dict.copy()
    
    for field_name, field_value in converted_data.items():
        if field_name in DATE_FIELDS and field_value:
            try:
                date_format = DATE_FIELDS[field_name]
                
                if date_format == "timestamp_ms":
                    # Convert milliseconds timestamp to datetime
                    if isinstance(field_value, (int, str)) and str(field_value).isdigit():
                        timestamp_ms = int(field_value)
                        # Convert milliseconds to seconds
                        timestamp_s = timestamp_ms / 1000
                        converted_date = datetime.fromtimestamp(timestamp_s)
                        converted_data[field_name] = converted_date.strftime("%Y-%m-%d %H:%M:%S")
                else:
                    # Convert date string to proper format
                    if isinstance(field_value, str) and len(field_value) == 8:
                        # Parse the date string
                        parsed_date = datetime.strptime(field_value, date_format)
                        converted_data[field_name] = parsed_date.strftime("%Y-%m-%d")
                    elif isinstance(field_value, str) and len(field_value) == 6:
                        # Handle YYMMDD format
                        parsed_date = datetime.strptime(field_value, "%y%m%d")
                        converted_data[field_name] = parsed_date.strftime("%Y-%m-%d")
                        
            except (ValueError, TypeError) as e:
                # If conversion fails, keep original value and log warning
                logging.warning(f"Failed to convert date field {field_name} with value {field_value}: {e}")
                continue
    
    return converted_data

def generate_sample_data():
    """
    Generate sample data to demonstrate date conversion
    """
    import time
    
    # Sample Funds Transfer data
    sample_funds_transfer = {
        "RECID": "FTCM25238RT4LHJDS",
        "TRANSACTION_TYPE": "ACQW",
        "DEBIT_ACCT_NO": "100014461568",
        "DEBIT_VALUE_DATE": "20250826",  # Will be converted to 2025-08-26
        "CREDIT_ACCT_NO": "100068155597",
        "PROCESSING_DATE": "20250826",   # Will be converted to 2025-08-26
        "PAYMENT_DETAILS": "250798710363 1Paul UWAMAHORO",
        "LOC_AMT_DEBITED": "78417",
        "LOC_AMT_CREDITED": "78417",
        "LOCAL_CHARGE_AMT": "200",
        "SDS_DATE": str(int(time.time() * 1000))  # Current timestamp in milliseconds
    }
    
    # Sample Customer data
    sample_customer = {
        "RECID": "CUST123456789",
        "GIVEN_NAMES": "John",
        "FAMILY_NAME": "Doe",
        "DATE_OF_BIRTH": "19900515",     # Will be converted to 1990-05-15
        "GENDER": "M",
        "MARITAL_STATUS": "SINGLE",
        "NATIONALITY": "RW",
        "CUSTOMER_STATUS": "ACTIVE",
        "EMAIL_D_1": "john.doe@email.com",
        "SMS_D_1": "+250788123456",
        "RESIDENCE": "Kigali, Rwanda",
        "KYC_COMPLETE": "Y",
        "AML_RESULT": "PASS",
        "MANUAL_RISK_CLASS": "LOW",
        "ACCOUNT_OFFICER": "AO001",
        "SEGMENT": "RETAIL",
        "INDUSTRY": "SERVICES",
        "CUSTOMER_SINCE": "20200101",    # Will be converted to 2020-01-01
        "BK_SPOUSE_NAME": "",
        "BK_NEXT_KIN_NAME": "Jane Doe",
        "SDS_DATE": str(int(time.time() * 1000)),  # Current timestamp in milliseconds
        "TITLE": "MR",
        "LANGUAGE": "EN",
        "TARGET": "RETAIL"
    }
    
    return {
        "FBNK_FUNDS_TRANSFER": sample_funds_transfer,
        "FBNK_CUSTOMER": sample_customer
    }

def test_date_conversion():
    """
    Test function to demonstrate date conversion
    """
    print("🧪 Testing Date Conversion Functionality")
    print("=" * 60)
    
    sample_data = generate_sample_data()
    
    for entity_name, data in sample_data.items():
        print(f"\n📊 {entity_name} - Original Data:")
        print("-" * 40)
        for field, value in data.items():
            print(f"  {field}: {value}")
        
        # Apply date conversion
        converted_data = convert_date_fields(data)
        
        print(f"\n📅 {entity_name} - After Date Conversion:")
        print("-" * 40)
        for field, value in converted_data.items():
            print(f"  {field}: {value}")
        
        print("\n" + "=" * 60)

def create_consumer():
    logging.info("Creating Kafka consumer...")
    schema_registry_conf = {'url': 'http://10.24.38.44:35003'}
    try:
        schema_registry_client = SchemaRegistryClient(schema_registry_conf)
        logging.info("Connected to Schema Registry")
    except Exception as e:
        logging.error(f"Failed to connect to Schema Registry: {e}")
        raise

    try:
        value_deserializer = AvroDeserializer(schema_registry_client=schema_registry_client)
    except Exception as e:
        logging.error(f"Failed to set up Avro deserializer: {e}")
        raise

    consumer_config = {
        'bootstrap.servers': '10.24.38.44:35002',
        'group.id': 'RAINING_CONSUME_211',
        'auto.offset.reset': 'latest',
        'key.deserializer': StringDeserializer('utf_8'),
        'value.deserializer': value_deserializer
    }

    try:
        consumer = DeserializingConsumer(consumer_config)
        consumer.subscribe(['table-update'])
        logging.info("Consumer configured and subscribed to topic 'table-update'")
    except Exception as e:
        logging.error(f"Failed to configure and subscribe consumer: {e}")
        raise

    return consumer


def create_json_producer():
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
        'enable.idempotence': True,  # Prevent duplicate messages
    }
    return SerializingProducer(producer_conf)

distinct_entities = set()

def process_messages(consumer, producer, executor, batch_size=10):
    messages_batch = []
    message_count = 0
    batch_count = 0
    total_success = 0
    total_errors = 0
    
    logging.info(f"Starting message processing with batch size: {batch_size}")
    
    while True:
        try:
            msg = consumer.poll(1.0)
            if msg is None:
                if len(messages_batch) >= batch_size:
                    batch_count += 1
                    future = executor.submit(stream_batch_to_producer, messages_batch.copy(), producer)
                    messages_batch.clear()
                # Log when no messages are received
                if message_count % 100 == 0:  # Log every 100 polls
                    logging.info("No messages received in this poll cycle")
                continue
            if msg.error():
                logging.error(f"Consumer error: {msg.error()}")
                continue

            message_count += 1
            logging.info(f"Message {message_count} received")
            process_message(msg, messages_batch)

            if len(messages_batch) >= batch_size:
                batch_count += 1
                future = executor.submit(stream_batch_to_producer, messages_batch.copy(), producer)
                messages_batch.clear()

            # Log progress every 1000 messages
            if message_count % 1000 == 0:
                logging.info(f"Processed {message_count} messages, {batch_count} batches sent")

        except ValueDeserializationError as e:
            logging.warning(f"Deserialization error: {e}. Ignoring and continuing.")
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
            break

def process_message(msg, messages_batch):
    message_value = msg.value()
    flattened_value = flatten_json(message_value)

    # Get entity name and filter
    entity_name = flattened_value.get('entityName', 'UnknownEntity').replace(' ', '_').replace('.', '_')
    logging.info(f"Processing entity: {entity_name}")
    if entity_name not in {"FBNK_CUSTOMER", "FBNK_ACCOUNT", "FBNK_FUNDS_TRANSFER"}: 
        logging.info(f"Skipping non-relevant entity: {entity_name}")
        return  # Skip non-relevant entities
    
    # Get the appropriate mapping for this entity
    field_mapping = ENTITY_MAPPINGS.get(entity_name, {})

    # Apply mapping to rename keys - only include keys that are explicitly mapped
    mapped_value = {field_mapping[k]: v for k, v in flattened_value.items() if k in field_mapping}

    # Convert date fields to proper format
    mapped_value = convert_date_fields(mapped_value)

    # Print formatted message for testing
    # print(f"\n{'='*80}")
    # print(f"📊 PROCESSING {entity_name}")
    # print(f"{'='*80}")
    # print(f"🆔 Entity ID: {flattened_value.get('entityId', 'N/A')}")
    # print(f"🏢 Company: {flattened_value.get('company', 'N/A')}")
    # print(f"📅 Processing Time: {flattened_value.get('processingTime', 'N/A')}")
    # print(f"🔄 Operation: {flattened_value.get('context_operation', 'N/A')}")
    # print(f"⚙️  Function: {flattened_value.get('context_function', 'N/A')}")
    # print(f"{'='*80}")
    # print("📋 MAPPED DATA:")
    # for key, value in mapped_value.items():
    #     if isinstance(value, str) and len(value) > 50:
    #         print(f"  {key}: {value[:50]}...")
    #     else:
    #         print(f"  {key}: {value}")
    # print(f"{'='*80}\n")

    message_data = {
        "entity_name": entity_name,
        "value": mapped_value
    }
    messages_batch.append(message_data)


def stream_batch_to_producer(messages_batch, producer):
    """
    Stream batch of messages to Kafka producer
    """
    batch_size = len(messages_batch)
    
    success_count = 0
    error_count = 0
    
    for i, message in enumerate(messages_batch, 1):
        try:
            entity_name = message["entity_name"]
            value = message["value"]
            
            # Create a unique key for each message
            message_key = f"{entity_name}_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}_{i}"
            
            # Convert message to JSON string
            message_json = json.dumps({
                "entity_name": entity_name,
                "value": value,
                "timestamp": datetime.now().isoformat(),
                "batch_index": i,
                "batch_size": batch_size
            })
            
            # Send to producer
            producer.produce(
                topic=OUTPUT_TOPIC,
                key=message_key,
                value=message_json
            )
            
            success_count += 1
                
        except Exception as e:
            error_count += 1
            logging.error(f"Error streaming message {i}: {e}")
            continue
    
    # Flush producer to ensure all messages are sent
    producer.flush()
    
    # Log batch summary
    if error_count > 0:
        logging.warning(f"Batch completed with {error_count} errors out of {batch_size} messages")
    else:
        logging.info(f"Batch of {batch_size} messages successfully streamed")
    
    return success_count, error_count

def log_delivery_status(success_count, error_count, batch_size):
    """
    Log delivery status for batch processing
    """
    if ENABLE_DEBUG_LOGGING:
        logging.debug(f"Batch delivery summary: {success_count}/{batch_size} successful")
    if error_count > 0:
        logging.warning(f"{error_count} messages failed to send in this batch")

def main():
    import sys
    
    # Check if test mode is requested
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        test_date_conversion()
        return
    
    start_time = datetime.now()
    logging.info("Starting T24 Kafka streaming service...")
    
    consumer = create_consumer()
    producer = create_json_producer()
    executor = ThreadPoolExecutor(max_workers=20)

    try:
        logging.info(f"Service started successfully. Target topic: {OUTPUT_TOPIC}")
        process_messages(consumer, producer, executor, BATCH_SIZE)
    except KeyboardInterrupt:
        logging.info("Service stopped by user")
    except Exception as e:
        logging.error(f"Service error: {e}")
    finally:
        executor.shutdown(wait=True)
        producer.flush()
        duration = datetime.now() - start_time
        logging.info(f"Service shutdown. Total runtime: {duration}")

if __name__ == '__main__':
    main()
