import logging
from datetime import datetime
from confluent_kafka import DeserializingConsumer, SerializingProducer
from confluent_kafka.serialization import StringDeserializer, StringSerializer
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroDeserializer
from confluent_kafka.error import ValueDeserializationError
import json
import re

logging.basicConfig(level=logging.INFO)

RELEVANT_ENTITIES = {
    "FBNK.CUSTOMER",
    "FBNK.ACCOUNT",
    "FBNK.FUNDS.TRANSFER"
}

# Define data type conversions for each field
FIELD_CONVERSIONS = {
    "FBNK.CUSTOMER": {
        "DateOfBirth": "date",
        "CustomerSince": "date",
        "AccountOfficer": "integer",
        "Sector": "integer",
        "Industry": "integer",
        "DeptCode": "integer",
        "EntityType": "integer",
        "emittedTime": "timestamp"
    },
    "FBNK.ACCOUNT": {
        "OpenActualBal": "decimal",
        "OpenClearedBal": "decimal",
        "OnlineActualBal": "decimal",
        "OnlineClearedBal": "decimal",
        "WorkingBalance": "decimal",
        "OpenAvailableBal": "decimal",
        "AccountOfficer": "integer",
        "CoCode": "string",
        "OpeningDate": "date",
        "DateLastUpdate": "date",
        "emittedTime": "timestamp"
    },
    "FBNK.FUNDS.TRANSFER": {
        "AmountDebited": "currency",
        "AmountCredited": "currency",
        "TotalChargeAmt": "decimal",
        "LocalChargeAmt": "decimal",
        "DebitValueDate": "date",
        "CreditValueDate": "date",
        "ProcessingDate": "date",
        "emittedTime": "timestamp"
    }
}


RELEVANT_COLUMNS = {
    "FBNK.CUSTOMER": [
        "eventId", "emittedTime", "entityId", "recId", "Mnemonic",
        "GivenNames", "FamilyName", "Title", "DateOfBirth",
        "Gender", "MaritalStatus", "CustomerType", "CustomerSince",
        "Address", "Residence", "ResidenceRegion",
        "ResidenceStatus", "Phone", "BkNextkinName",
        "BkSpouseName", "AccountOfficer", "Sector",
        "Industry", "BkTypeOfCust", "CrbCheck", "AmlCheck",
        "AmlResult", "RiskStatus", "ManualRiskClass", "CalcRiskClass",
        "Inputter", "Authoriser", "CoCode", "DeptCode",
        "BkSalRange", "BkEcoSector", "EntityType",
        "EmploymentStatus", "LegalId", "Nationality",
        "context_operation", "context_function"
    ],
    "FBNK.ACCOUNT": [
        "eventId", "emittedTime", "entityId", "recId", "AccountNumber",
        "Customer", "Category", "PositionType", "OpenActualBal",
        "OpenClearedBal", "OnlineActualBal", "OnlineClearedBal",
        "WorkingBalance", "OpenAvailableBal", "AccountOfficer", "CoCode",
        "AccountTitle", "ShortTitle", "Mnemonic",
        "OpeningDate", "DateLastUpdate", "AltAcctType",
        "context_operation", "context_function"
    ],
    "FBNK.FUNDS.TRANSFER": [
        "eventId", "emittedTime", "entityId", "recId", "TransactionType",
        "DebitAcctNo", "CreditAcctNo", "DebitCurrency", "CreditCurrency",
        "AmountDebited", "AmountCredited", "DebitValueDate", "CreditValueDate",
        "IbanDebit", "IbanCredit", "TotalChargeAmt", "LocalChargeAmt",
        "ChargeCode", "ChargesAcctNo", "ProfitCentreCust",
        "DebitCustomer", "CreditCustomer", "ProcessingDate",
        "AtUniqueId", "ApiUniqueId", "Authoriser",
        "OrderingCust", "OrderingBank",
        "BenCustomer", "BenBank",
        "PaymentDetails", "InPayDetails",
        "CommissionCode", "ChargeComDisplay", "ChargedCustomer",
        "Status", "CustGroupLevel",
        "context_operation", "context_function"
    ]
}


def convert_data_type(value, data_type):
    """Convert value to specified data type"""
    if value is None:
        return None
    
    try:
        if data_type == "integer":
            # Handle string numbers and remove any currency symbols
            if isinstance(value, str):
                # Remove currency symbols and extract number
                cleaned = re.sub(r'[^\d.-]', '', value)
                return int(cleaned) if cleaned else None
            return int(value)
        
        elif data_type == "decimal":
            # Handle currency strings like "RWF40000" or "8966255"
            if isinstance(value, str):
                # Extract numeric part
                cleaned = re.sub(r'[^\d.-]', '', value)
                return float(cleaned) if cleaned else None
            return float(value)
        
        elif data_type == "currency":
            # Extract currency amount from strings like "RWF40000"
            if isinstance(value, str):
                # Extract numeric part
                cleaned = re.sub(r'[^\d.-]', '', value)
                return float(cleaned) if cleaned else None
            return float(value)
        
        elif data_type == "date":
            # Convert date strings like "20230524" to ISO format
            if isinstance(value, str) and len(value) == 8:
                try:
                    year = int(value[:4])
                    month = int(value[4:6])
                    day = int(value[6:8])
                    return f"{year:04d}-{month:02d}-{day:02d}"
                except ValueError:
                    return value
            elif isinstance(value, int) and len(str(value)) == 8:
                # Handle integer dates
                date_str = str(value)
                year = int(date_str[:4])
                month = int(date_str[4:6])
                day = int(date_str[6:8])
                return f"{year:04d}-{month:02d}-{day:02d}"
            return value
        
        elif data_type == "timestamp":
            # Convert timestamp to ISO format
            if isinstance(value, (int, float)):
                try:
                    # Convert milliseconds to datetime
                    dt = datetime.fromtimestamp(value / 1000)
                    return dt.isoformat()
                except (ValueError, OSError):
                    return value
            return value
        
        elif data_type == "string":
            return str(value)
        
        else:
            return value
            
    except (ValueError, TypeError, AttributeError):
        # Return original value if conversion fails
        return value


def apply_data_conversions(result, entity_name):
    """Apply data type conversions to the result dictionary"""
    conversions = FIELD_CONVERSIONS.get(entity_name, {})
    
    for field, data_type in conversions.items():
        if field in result and result[field] is not None:
            result[field] = convert_data_type(result[field], data_type)
    
    return result


def flatten_json(nested_json, parent_key='', sep='_'):
    flattened_json = {}
    def flatten(item, prefix=''):
        if isinstance(item, dict):
            for key, value in item.items():
                new_prefix = f"{prefix}{sep}{key}" if prefix else key
                flatten(value, new_prefix)
        elif isinstance(item, list):
            if all(isinstance(elem, dict) for elem in item):
                # For arrays of objects, take the first element and flatten it
                if item:
                    flatten(item[0], prefix)
                else:
                    flattened_json[prefix] = None
            else:
                # For simple arrays, take the first value
                if item:
                    flattened_json[prefix] = item[0]
                else:
                    flattened_json[prefix] = None
        elif isinstance(item, str):
            # Try to parse JSON strings that might contain arrays or objects
            try:
                parsed = json.loads(item)
                if isinstance(parsed, list):
                    if parsed:
                        if isinstance(parsed[0], dict):
                            # Array of objects - take first element and flatten
                            flatten(parsed[0], prefix)
                        else:
                            # Simple array - take first value
                            flattened_json[prefix] = parsed[0]
                    else:
                        flattened_json[prefix] = None
                elif isinstance(parsed, dict):
                    # Object - flatten it
                    flatten(parsed, prefix)
                else:
                    # Simple value
                    flattened_json[prefix] = parsed
            except (json.JSONDecodeError, ValueError):
                # Not JSON, treat as regular string
                flattened_json[prefix] = item
        else:
            flattened_json[prefix] = item
    flatten(nested_json, parent_key)
    return flattened_json

def extract_relevant(value, entity_name):
    flattened = flatten_json(value)
    columns = RELEVANT_COLUMNS.get(entity_name, [])
    
    # Create standardized output by removing payload_ prefix and mapping to clean column names
    result = {}
    for col in columns:
        # Special handling for Phone field which has complex naming
        if col == "Phone" and entity_name == "FBNK.CUSTOMER":
            # Try to find the actual phone number from the complex nested structure
            # Look for SMS phone number first, then regular phone
            sms_keys = [k for k in flattened.keys() if "sms" in k.lower()]
            phone_keys = [k for k in flattened.keys() if "phone" in k.lower() and "sms" not in k.lower()]
            
            if sms_keys:
                result[col] = flattened[sms_keys[0]]
            elif phone_keys:
                result[col] = flattened[phone_keys[0]]
            else:
                result[col] = None
        else:
            # Try multiple possible keys for each column
            possible_keys = [
                f"payload_{col}",  # Standard payload_ prefix
                f"payload_ARRAY_{col}",  # Array prefix
                f"payload_ARRAY_{col}_D_1",  # Array with _D_1 suffix
                f"payload_ARRAY_{col}_1",  # Array with _1 suffix
                col  # Direct match
            ]
            
            found_value = None
            for key in possible_keys:
                if key in flattened:
                    found_value = flattened[key]
                    break
            
            result[col] = found_value
    
    # Apply data type conversions
    result = apply_data_conversions(result, entity_name)
    
    return result

def create_consumer():
    schema_registry_conf = {'url': 'http://10.24.38.44:35003'}
    schema_registry_client = SchemaRegistryClient(schema_registry_conf)
    value_deserializer = AvroDeserializer(schema_registry_client=schema_registry_client)

    consumer_config = {
        'bootstrap.servers': '10.24.38.44:35002',
        'group.id': 'TRAINING_CONSUMER',
        'auto.offset.reset': 'latest',
        'key.deserializer': StringDeserializer('utf_8'),
        'value.deserializer': value_deserializer,
    }

    consumer = DeserializingConsumer(consumer_config)
    consumer.subscribe(['table-update'])
    return consumer

def create_json_producer():
    producer_conf = {
        'bootstrap.servers': '10.24.38.44:35002',
        'key.serializer': StringSerializer('utf_8'),
        'value.serializer': StringSerializer('utf_8'),
    }
    return SerializingProducer(producer_conf)

def main():
    consumer = create_consumer()
    producer = create_json_producer()
    topic_out = "table-update-json"

    logging.info(f"🚀 Streaming started at {datetime.now()}")

    try:
        while True:
            try:
                msg = consumer.poll(1.0)
                if msg is None:
                    continue
                if msg.error():
                    logging.error(f"Consumer error: {msg.error()}")
                    continue

                value = msg.value()
                entity_name = value.get("entityName", "UnknownEntity")

                if entity_name in RELEVANT_ENTITIES:
                    relevant_flattened = extract_relevant(value, entity_name)
                    logging.info(f"🌟 Streaming {entity_name}: {relevant_flattened}")

                    producer.produce(
                        topic=topic_out,
                        key=entity_name,
                        value=json.dumps(relevant_flattened)
                    )
                    producer.poll(0)

            except ValueDeserializationError as e:
                logging.warning(f"⚠️ Deserialization error: {e}. Skipping message.")

    except KeyboardInterrupt:
        logging.info("👋 Stopping consumer.")
    finally:
        consumer.close()
        producer.flush()

if __name__ == '__main__':
    main()
