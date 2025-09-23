import logging
from datetime import datetime
from confluent_kafka import DeserializingConsumer
from confluent_kafka.serialization import StringDeserializer
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroDeserializer
from confluent_kafka.error import ValueDeserializationError
import json

logging.basicConfig(level=logging.INFO)

# Entities we care about
RELEVANT_ENTITIES = {
    "FBNK.CUSTOMER",
    "FBNK.ACCOUNT",
    "FBNK.FUNDS.TRANSFER"

}

RELAVANT_COLUMNS = {
    "FBNK.CUSTOMER": [
        "eventId", "emittedTime", "entityId", "payload_recId", "payload_Mnemonic",
        "payload_GivenNames", "payload_FamilyName", "payload_Title", "payload_DateOfBirth",
        "payload_Gender", "payload_MaritalStatus", "payload_CustomerType", "payload_CustomerSince",
        "payload_ARRAY_Address", "payload_Residence", "payload_ResidenceRegion",
        "payload_ARRAY_ResidenceStatus", "payload_ARRAY_Phone_D_1", "payload_ARRAY_BkNextkinName",
        "payload_ARRAY_BkSpouseName", "payload_AccountOfficer", "payload_Sector",
        "payload_Industry", "payload_BkTypeOfCust", "payload_CrbCheck", "payload_AmlCheck",
        "payload_AmlResult", "payload_RiskStatus", "payload_ManualRiskClass", "payload_CalcRiskClass",
        "payload_ARRAY_Inputter", "payload_Authoriser", "payload_CoCode", "payload_DeptCode",
        "payload_BkSalRange", "payload_BkEcoSector", "payload_EntityType",
        "payload_ARRAY_EmploymentStatus", "payload_ARRAY_LegalId", "payload_ARRAY_Nationality",
        "context_operation", "context_function"  # added
    ],
    "FBNK.ACCOUNT": [
        "eventId", "emittedTime", "entityId", "payload_recId", "payload_AccountNumber",
        "payload_Customer", "payload_Category", "payload_PositionType", "payload_OpenActualBal",
        "payload_OpenClearedBal", "payload_OnlineActualBal", "payload_OnlineClearedBal",
        "payload_WorkingBalance", "payload_OpenAvailableBal", "payload_AccountOfficer", "payload_CoCode",
        "payload_ARRAY_AccountTitle_D_1", "payload_ARRAY_ShortTitle", "payload_Mnemonic",
        "payload_OpeningDate", "payload_DateLastUpdate", "payload_ARRAY_AltAcctType",
        "context_operation", "context_function"  # added
    ],
    "FBNK.FUNDS.TRANSFER": [
        "eventId", "emittedTime", "entityId", "payload_recId", "payload_TransactionType",
        "payload_DebitAcctNo", "payload_CreditAcctNo", "payload_DebitCurrency", "payload_CreditCurrency",
        "payload_AmountDebited", "payload_AmountCredited", "payload_DebitValueDate", "payload_CreditValueDate",
        "payload_IbanDebit", "payload_IbanCredit", "payload_TotalChargeAmt", "payload_LocalChargeAmt",
        "payload_ChargeCode", "payload_ChargesAcctNo", "payload_ProfitCentreCust",
        "payload_DebitCustomer", "payload_CreditCustomer", "payload_ProcessingDate",
        "payload_AtUniqueId", "payload_ApiUniqueId", "payload_Authoriser",
        "payload_ARRAY_OrderingCust", "payload_ARRAY_OrderingBank",
        "payload_ARRAY_BenCustomer", "payload_ARRAY_BenBank",
        "payload_ARRAY_PaymentDetails", "payload_ARRAY_InPayDetails",
        "payload_CommissionCode", "payload_ChargeComDisplay", "payload_ChargedCustomer",
        "payload_Status", "payload_CustGroupLevel",
        "context_operation", "context_function"  # added
    ]
}


# Aggregation state
dashboard_metrics = {
    "total_active_customers": 0,
    "new_customers_today": 0,
    "total_accounts": 0,
    "total_transfers_today": 0,
    "total_balance": 0,
    "customer_type_count": {},     # e.g., {"NDIV": 5000, "NONINDIV": 3000}
    "customers_by_sector": {},     # e.g., {"Travel": 100, "Energy": 200}
    "balance_distribution": {},    # e.g., {"0-100k": 100, "100k-500k": 50}
    "accounts_by_category": {},    # e.g., {"10001": 200, "10002": 150}
    "top_accounts": {},            # {"RWF10001…": balance}
    "recent_accounts": [],         # list of last 20
    "recent_transactions": [],     # list of last 50
}



def update_aggregates(entity_name, data):
    if entity_name == "FBNK.CUSTOMER":
        dashboard_metrics["total_active_customers"] += 1
        cust_type = data.get("payload_CustomerType", "UNKNOWN")
        dashboard_metrics["customer_type_count"][cust_type] = dashboard_metrics["customer_type_count"].get(cust_type, 0) + 1

        # Sector
        sector = data.get("payload_Sector")
        if sector:
            dashboard_metrics["customers_by_sector"][sector] = dashboard_metrics["customers_by_sector"].get(sector, 0) + 1

        # Recent 10 customers
        dashboard_metrics.setdefault("recent_customers", []).insert(0, data)
        dashboard_metrics["recent_customers"] = dashboard_metrics["recent_customers"][:10]

    elif entity_name == "FBNK.ACCOUNT":
        dashboard_metrics["total_accounts"] += 1
        balance = data.get("payload_WorkingBalance")
        if balance:
            try:
                balance = int(float(balance))
            except (ValueError, TypeError):
                balance = 0
            dashboard_metrics["total_balance"] += balance

            # Balance distribution
            if balance < 100_000:
                bucket = "0-100k"
            elif balance < 500_000:
                bucket = "100k-500k"
            else:
                bucket = "500k+"
            dashboard_metrics["balance_distribution"][bucket] = dashboard_metrics["balance_distribution"].get(bucket, 0) + 1

        # Accounts by category
        category = data.get("payload_Category")
        if category:
            dashboard_metrics["accounts_by_category"][category] = dashboard_metrics["accounts_by_category"].get(category, 0) + 1

        # Recent 20 accounts
        dashboard_metrics["recent_accounts"].insert(0, data)
        dashboard_metrics["recent_accounts"] = dashboard_metrics["recent_accounts"][:2]

    elif entity_name == "FBNK.FUNDS.TRANSFER":
        dashboard_metrics["total_transfers_today"] += 1
        amount = data.get("payload_AmountDebited")
        if amount:
            try:
                # Strip currency prefixes and convert to int
                amount_clean = amount.replace("RWF", "").replace("USD", "").replace(",", "")
                amount_int = int(float(amount_clean))
            except (ValueError, TypeError):
                amount_int = 0
            dashboard_metrics["total_balance"] += amount_int

        # Recent 50 transactions
        dashboard_metrics["recent_transactions"].insert(0, data)
        dashboard_metrics["recent_transactions"] = dashboard_metrics["recent_transactions"][:2]




# Track which entities we've already printed
printed_entities = set()

def flatten_json(nested_json, parent_key='', sep='_'):
    """Flatten nested JSON into key-value pairs, arrays converted to JSON strings."""
    flattened_json = {}

    def flatten(item, prefix=''):
        if isinstance(item, dict):
            for key, value in item.items():
                new_prefix = f"{prefix}{sep}{key}" if prefix else key
                flatten(value, new_prefix)
        elif isinstance(item, list):
            if all(isinstance(elem, dict) for elem in item):
                # Convert list of dicts to JSON string
                flattened_json[prefix] = json.dumps(item)
            else:
                for i, elem in enumerate(item):
                    flatten(elem, f"{prefix}{sep}{i}" if prefix else str(i))
            if not item:
                flattened_json[prefix] = None
        else:
            flattened_json[prefix] = item

    flatten(nested_json, parent_key)
    return flattened_json


def extract_relevant(value, entity_name):
    """Flatten message first, then pick only relevant columns."""
    flattened = flatten_json(value)
    columns = RELAVANT_COLUMNS.get(entity_name, [])
    relevant_data = {col: flattened.get(col) for col in columns}
    return relevant_data


def create_consumer():
    logging.info(f"✈️ Streaming started {datetime.now()}")
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

def main():
    consumer = create_consumer()
    try:
        while RELEVANT_ENTITIES - printed_entities:
            try:
                msg = consumer.poll(1.0)
                if msg is None:
                    continue
                if msg.error():
                    logging.error(f"Consumer error: {msg.error()}")
                    continue

                value = msg.value()
                entity_name = value.get("entityName", "UnknownEntity")

                if entity_name in RELEVANT_ENTITIES and entity_name not in printed_entities:
                    relevant_flattened = extract_relevant(value, entity_name)
                    logging.info(f"🌟 Sample message for {entity_name}: {relevant_flattened}")
                    # print(f"🌟 Full message for {entity_name}: {json.dumps(value, indent=2)}")
                    update_aggregates(entity_name, relevant_flattened)
                    # print(json.dumps(dashboard_metrics, indent=2))
                    printed_entities.add(entity_name)

            except ValueDeserializationError as e:
                logging.warning(f"⚠️ Deserialization error: {e}. Skipping message.")

    except KeyboardInterrupt:
        logging.info("👋 Stopping consumer.")
    finally:
        consumer.close()

if __name__ == '__main__':
    main()
