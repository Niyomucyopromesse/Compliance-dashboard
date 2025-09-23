#--------------CUSTOMER--------------
import mgp
import json
import traceback
import re
from typing import Iterable, Any
from datetime import datetime

# Relevant entities to process
RELEVANT_ENTITIES = {
    "FBNK.CUSTOMER",
    "FBNK.ACCOUNT",
    "FBNK.FUNDS.TRANSFER",
    "FBNK_FUNDS_TRANSFER"
}

# --- helpers ----------------------------------------------------------
DATE_FORMATS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%Y/%m/%d"
]

DATETIME_FORMATS = [
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%d/%m/%Y %H:%M:%S",
    "%d-%m-%Y %H:%M:%S",
]

def is_epoch_ms(s: str) -> bool:
    return s.isdigit() and len(s) >= 12

def to_iso_date_if_valid(value: Any) -> str | None:
    """
    Return an ISO date 'YYYY-MM-DD' if value is a valid date or an epoch-ms.
    Otherwise return None so Cypher will not attempt date(...) on bad data.
    """
    if value is None:
        return None
    s = str(value).strip()
    if s.lower() in ("none", "null", ""):
        return None

    # If it's an epoch in ms -> convert to date
    if is_epoch_ms(s):
        try:
            ts = int(s)
            return datetime.utcfromtimestamp(ts / 1000).strftime("%Y-%m-%d")
        except Exception:
            return None

    # Already ISO date
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        return s

    # Try several common formats and return date part
    for fmt in DATE_FORMATS + DATETIME_FORMATS:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d")
        except Exception:
            pass

    # not a valid date
    return None

def convert_value(value: Any) -> Any:
    """
    Convert strings representing numbers, floats, or SDS epoch timestamps (ms)
    to proper int, float, or leave as-is for other strings.
    (Date/datetime handling is moved to dedicated helpers above.)
    """
    if value is None:
        return None

    s = str(value).strip()
    if s.lower() in ("none", "null", ""):
        return None

    # Integer conversion
    if s.lstrip("+-").isdigit():
        try:
            return int(s)
        except Exception:
            return s

    # Float conversion (simple heuristic)
    try:
        if "." in s:
            return float(s.replace(",", ""))
    except Exception:
        pass

    # leave everything else untouched
    return s

# --- transformer -----------------------------------------------------
@mgp.transformation
def keep_relevant(context: mgp.TransCtx, messages: mgp.Messages) -> Iterable[mgp.Record]:
    out = []
    logger = mgp.Logger()
    batch_count = messages.total_messages()
    logger.info(f"Processing batch with {batch_count} messages")

    for i in range(batch_count):
        msg = messages.message_at(i)
        try:
            payload_str = msg.payload().decode('utf-8')
            payload = json.loads(payload_str)
        except Exception as e:
            logger.warning(f"Skipping message at offset {msg.offset()}: bad JSON: {e}")
            logger.error(traceback.format_exc())
            continue

        if 'entity_name' not in payload or 'value' not in payload:
            logger.warning(f"Skipping message at offset {msg.offset()}: missing entity_name or value")
            continue

        entity_name = payload['entity_name']
        normalized = entity_name.replace('.', '_')
        if entity_name not in RELEVANT_ENTITIES and normalized not in RELEVANT_ENTITIES:
            continue

        data = payload['value']
        if not isinstance(data, dict):
            logger.warning(f"Skipping message at offset {msg.offset()}: 'value' must be an object")
            continue

        # Handle customers
        if entity_name in ("FBNK.CUSTOMER", "FBNK_CUSTOMER"):
            recid = data.get('RECID')
            if not recid:
                logger.warning(f"Skipping customer message at offset {msg.offset()}: RECID missing")
                continue

            # use specific date helpers so we only convert valid strings
            date_of_birth = to_iso_date_if_valid(data.get('DATE_OF_BIRTH'))
            customer_since = to_iso_date_if_valid(data.get('CUSTOMER_SINCE'))
            sds_date = to_iso_date_if_valid(data.get('SDS_DATE') or data.get('emittedTime'))

            params = {
                'RECID': str(recid),
                'GIVEN_NAMES': data.get('GIVEN_NAMES'),
                'FAMILY_NAME': data.get('FAMILY_NAME'),
                'DATE_OF_BIRTH': date_of_birth,
                'GENDER': data.get('GENDER'),
                'MARITAL_STATUS': data.get('MARITAL_STATUS'),
                'NATIONALITY': data.get('NATIONALITY'),
                'CUSTOMER_STATUS': data.get('CUSTOMER_STATUS'),
                'EMAIL_D_1': data.get('EMAIL_D_1'),
                'SMS_D_1': data.get('SMS_D_1'),
                'RESIDENCE': data.get('RESIDENCE'),
                'KYC_COMPLETE': data.get('KYC_COMPLETE'),
                'AML_RESULT': data.get('AML_RESULT'),
                'MANUAL_RISK_CLASS': data.get('MANUAL_RISK_CLASS'),
                'ACCOUNT_OFFICER': data.get('ACCOUNT_OFFICER'),
                'SEGMENT': data.get('SEGMENT'),
                'TARGET': data.get('TARGET'),
                'INDUSTRY': data.get('INDUSTRY'),
                'LANGUAGE': data.get('LANGUAGE'),
                'CUSTOMER_SINCE': customer_since,
                'BK_SPOUSE_NAME': data.get('BK_SPOUSE_NAME'),
                'BK_NEXT_KIN_NAME': data.get('BK_NEXT_KIN_NAME'),
                'SDS_DATE': sds_date,
                'TITLE': data.get('TITLE')
            }

            logger.info(
                f"Inserting Customer RECID={recid}, offset={msg.offset()}, "
                f"name={params['GIVEN_NAMES']} {params['FAMILY_NAME']}"
            )

            # Customer node — guard date with CASE WHEN checks
            cy_customer = '''
MERGE (c:Customer {customer_id: $RECID})
ON CREATE SET
    c.full_name = coalesce($GIVEN_NAMES, '') + ' ' + coalesce($FAMILY_NAME, ''),
    c.dob = CASE WHEN $DATE_OF_BIRTH IS NOT NULL AND $DATE_OF_BIRTH <> '' THEN date($DATE_OF_BIRTH) ELSE NULL END,
    c.gender = $GENDER,
    c.marital_status = $MARITAL_STATUS,
    c.nationality = $NATIONALITY,
    c.status = $CUSTOMER_STATUS,
    c.email = $EMAIL_D_1,
    c.phone = $SMS_D_1,
    c.residence = $RESIDENCE,
    c.kyc_complete = $KYC_COMPLETE,
    c.aml_result = $AML_RESULT,
    c.risk_class = $MANUAL_RISK_CLASS,
    c.account_officer = $ACCOUNT_OFFICER,
    c.industry = $INDUSTRY,
    c.segment = $SEGMENT,
    c.language = $LANGUAGE,
    c.target = $TARGET,
    c.customer_since = CASE WHEN $CUSTOMER_SINCE IS NOT NULL AND $CUSTOMER_SINCE <> '' THEN date($CUSTOMER_SINCE) ELSE NULL END,
    c.spouse_name = $BK_SPOUSE_NAME,
    c.next_of_kin_name = $BK_NEXT_KIN_NAME,
    c.last_updated_date = CASE WHEN $SDS_DATE IS NOT NULL AND $SDS_DATE <> '' THEN date($SDS_DATE) ELSE NULL END,
    c.title = $TITLE
ON MATCH SET
    c.phone = CASE WHEN $SMS_D_1 IS NOT NULL AND $SMS_D_1 <> '' THEN $SMS_D_1 ELSE c.phone END,
    c.segment = CASE WHEN $SEGMENT IS NOT NULL AND $SEGMENT <> '' THEN $SEGMENT ELSE c.segment END,
    c.target = CASE WHEN $TARGET IS NOT NULL AND $TARGET <> '' THEN $TARGET ELSE c.target END,
    c.language = CASE WHEN $LANGUAGE IS NOT NULL AND $LANGUAGE <> '' THEN $LANGUAGE ELSE c.language END,
    c.marital_status = CASE WHEN $MARITAL_STATUS IS NOT NULL AND $MARITAL_STATUS <> '' THEN $MARITAL_STATUS ELSE c.marital_status END,
    c.email = CASE WHEN $EMAIL_D_1 IS NOT NULL AND $EMAIL_D_1 <> '' THEN $EMAIL_D_1 ELSE c.email END,
    c.status = CASE WHEN $CUSTOMER_STATUS IS NOT NULL AND $CUSTOMER_STATUS <> '' THEN $CUSTOMER_STATUS ELSE c.status END,
    c.account_officer = CASE WHEN $ACCOUNT_OFFICER IS NOT NULL AND $ACCOUNT_OFFICER <> '' THEN $ACCOUNT_OFFICER ELSE c.account_officer END,
    c.industry = CASE WHEN $INDUSTRY IS NOT NULL AND $INDUSTRY <> '' THEN $INDUSTRY ELSE c.industry END,
    c.risk_class = CASE WHEN $MANUAL_RISK_CLASS IS NOT NULL AND $MANUAL_RISK_CLASS <> '' THEN $MANUAL_RISK_CLASS ELSE c.risk_class END,
    c.last_updated_date = CASE WHEN $SDS_DATE IS NOT NULL AND $SDS_DATE <> '' THEN date($SDS_DATE) ELSE c.last_updated_date END;
'''
            out.append(mgp.Record(query=cy_customer, parameters=params))

    if not out:
        logger.info("Batch produced 0 Cypher records (no relevant messages or all skipped)")

    return out


#-------------ACCOUNT TRANSFORMER-------------
import mgp
import json
import traceback
import re
from typing import Iterable, Any
from datetime import datetime

# Relevant entities to process
RELEVANT_ENTITIES = {
    "FBNK.ACCOUNT",
    "FBNK_ACCOUNT"
}

# --- helpers ----------------------------------------------------------
DATE_FORMATS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%Y/%m/%d"
]

DATETIME_FORMATS = [
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%d/%m/%Y %H:%M:%S",
    "%d-%m-%Y %H:%M:%S",
]

def is_epoch_ms(s: str) -> bool:
    return s.isdigit() and len(s) >= 12

def to_iso_date_if_valid(value: Any) -> str | None:
    """
    Return an ISO date 'YYYY-MM-DD' if value is a valid date or an epoch-ms.
    Otherwise return None so Cypher will not attempt date(...) on bad data.
    """
    if value is None:
        return None
    s = str(value).strip()
    if s.lower() in ("none", "null", ""):
        return None

    # If it's an epoch in ms -> convert to date
    if is_epoch_ms(s):
        try:
            ts = int(s)
            return datetime.utcfromtimestamp(ts / 1000).strftime("%Y-%m-%d")
        except Exception:
            return None

    # Already ISO date
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        return s

    # Try several common formats and return date part
    for fmt in DATE_FORMATS + DATETIME_FORMATS:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d")
        except Exception:
            pass

    # not a valid date
    return None

def convert_value(value: Any) -> Any:
    """
    Convert strings representing numbers, floats, or SDS epoch timestamps (ms)
    to proper int, float, or leave as-is for other strings.
    (Date/datetime handling is moved to dedicated helpers above.)
    """
    if value is None:
        return None

    s = str(value).strip()
    if s.lower() in ("none", "null", ""):
        return None

    # Integer conversion
    if s.lstrip("+-").isdigit():
        try:
            return int(s)
        except Exception:
            return s

    # Float conversion (simple heuristic)
    try:
        if "." in s:
            return float(s.replace(",", ""))
    except Exception:
        pass

    # leave everything else untouched
    return s

# --- transformer -----------------------------------------------------
@mgp.transformation
def keep_relevant(context: mgp.TransCtx, messages: mgp.Messages) -> Iterable[mgp.Record]:
    out = []
    logger = mgp.Logger()
    batch_count = messages.total_messages()
    logger.info(f"Processing batch with {batch_count} messages")

    for i in range(batch_count):
        msg = messages.message_at(i)
        try:
            payload_str = msg.payload().decode('utf-8')
            payload = json.loads(payload_str)
        except Exception as e:
            logger.warning(f"Skipping message at offset {msg.offset()}: bad JSON: {e}")
            logger.error(traceback.format_exc())
            continue

        if 'entity_name' not in payload or 'value' not in payload:
            logger.warning(f"Skipping message at offset {msg.offset()}: missing entity_name or value")
            continue

        entity_name = payload['entity_name']
        normalized = entity_name.replace('.', '_')
        if entity_name not in RELEVANT_ENTITIES and normalized not in RELEVANT_ENTITIES:
            continue

        data = payload['value']
        if not isinstance(data, dict):
            logger.warning(f"Skipping message at offset {msg.offset()}: 'value' must be an object")
            continue

        # Handle accounts
        if entity_name in ("FBNK.ACCOUNT", "FBNK_ACCOUNT"):
            recid = data.get('RECID')
            if not recid:
                logger.warning(f"Skipping account message at offset {msg.offset()}: RECID missing")
                continue

            # use specific date helpers so we only convert valid strings
            opening_date = to_iso_date_if_valid(data.get('OPENING_DATE'))
            date_last_cr_cust = to_iso_date_if_valid(data.get('DATE_LAST_CR_CUST'))
            date_last_cr_bank = to_iso_date_if_valid(data.get('DATE_LAST_CR_BANK'))
            date_last_dr_cust = to_iso_date_if_valid(data.get('DATE_LAST_DR_CUST'))
            date_last_dr_bank = to_iso_date_if_valid(data.get('DATE_LAST_DR_BANK'))
            sds_date = to_iso_date_if_valid(data.get('SDS_DATE') or data.get('emittedTime'))

            params = {
                'RECID': str(recid),
                'CUSTOMER': data.get('CUSTOMER'),
                'CATEGORY': data.get('CATEGORY'),
                'SHORT_TITLE': data.get('SHORT_TITLE'),
                'ACCOUNT_TITLE_D_1': data.get('ACCOUNT_TITLE_D_1'),
                'ACCOUNT_TITLE_D_2': data.get('ACCOUNT_TITLE_D_2'),
                'POSITION_TYPE': data.get('POSITION_TYPE'),
                'CURRENCY': data.get('CURRENCY'),
                'OPEN_ACTUAL_BAL': convert_value(data.get('OPEN_ACTUAL_BAL')),
                'OPEN_CLEARED_BAL': convert_value(data.get('OPEN_CLEARED_BAL')),
                'ONLINE_ACTUAL_BAL': convert_value(data.get('ONLINE_ACTUAL_BAL')),
                'ONLINE_CLEARED_BAL': convert_value(data.get('ONLINE_CLEARED_BAL')),
                'WORKING_BALANCE': convert_value(data.get('WORKING_BALANCE')),
                'LIMIT_REF': data.get('LIMIT_REF'),
                'ACCOUNT_OFFICER': data.get('ACCOUNT_OFFICER'),
                'OPENING_DATE': opening_date,
                'DATE_LAST_CR_CUST': date_last_cr_cust,
                'DATE_LAST_CR_BANK': date_last_cr_bank,
                'DATE_LAST_DR_CUST': date_last_dr_cust,
                'DATE_LAST_DR_BANK': date_last_dr_bank,
                'SDS_DATE': sds_date
            }

            logger.info(
                f"Inserting Account RECID={recid}, offset={msg.offset()}, "
                f"customer={params['CUSTOMER']}, category={params['CATEGORY']}"
            )

            # Account node — guard date with CASE WHEN checks
            cy_account = '''
MERGE (a:Account {account_id: $RECID})
ON CREATE SET
    a.customer_id = $CUSTOMER,
    a.category = $CATEGORY,
    a.short_title = $SHORT_TITLE,
    a.account_title_1 = $ACCOUNT_TITLE_D_1,
    a.account_title_2 = $ACCOUNT_TITLE_D_2,
    a.position_type = $POSITION_TYPE,
    a.currency = $CURRENCY,
    a.open_actual_bal = $OPEN_ACTUAL_BAL,
    a.open_cleared_bal = $OPEN_CLEARED_BAL,
    a.online_actual_bal = $ONLINE_ACTUAL_BAL,
    a.online_cleared_bal = $ONLINE_CLEARED_BAL,
    a.working_balance = $WORKING_BALANCE,
    a.limit_ref = $LIMIT_REF,
    a.account_officer = $ACCOUNT_OFFICER,
    a.opening_date = CASE WHEN $OPENING_DATE IS NOT NULL AND $OPENING_DATE <> '' THEN date($OPENING_DATE) ELSE NULL END,
    a.last_cr_cust_date = CASE WHEN $DATE_LAST_CR_CUST IS NOT NULL AND $DATE_LAST_CR_CUST <> '' THEN date($DATE_LAST_CR_CUST) ELSE NULL END,
    a.last_cr_bank_date = CASE WHEN $DATE_LAST_CR_BANK IS NOT NULL AND $DATE_LAST_CR_BANK <> '' THEN date($DATE_LAST_CR_BANK) ELSE NULL END,
    a.last_dr_cust_date = CASE WHEN $DATE_LAST_DR_CUST IS NOT NULL AND $DATE_LAST_DR_CUST <> '' THEN date($DATE_LAST_DR_CUST) ELSE NULL END,
    a.last_dr_bank_date = CASE WHEN $DATE_LAST_DR_BANK IS NOT NULL AND $DATE_LAST_DR_BANK <> '' THEN date($DATE_LAST_DR_BANK) ELSE NULL END,
    a.last_transaction_date = 
        CASE 
            WHEN $DATE_LAST_CR_CUST IS NOT NULL AND $DATE_LAST_CR_CUST <> '' AND 
                 ($DATE_LAST_CR_BANK IS NULL OR $DATE_LAST_CR_BANK = '' OR date($DATE_LAST_CR_CUST) >= date($DATE_LAST_CR_BANK)) AND
                 ($DATE_LAST_DR_CUST IS NULL OR $DATE_LAST_DR_CUST = '' OR date($DATE_LAST_CR_CUST) >= date($DATE_LAST_DR_CUST)) AND
                 ($DATE_LAST_DR_BANK IS NULL OR $DATE_LAST_DR_BANK = '' OR date($DATE_LAST_CR_CUST) >= date($DATE_LAST_DR_BANK)) THEN date($DATE_LAST_CR_CUST)
            WHEN $DATE_LAST_CR_BANK IS NOT NULL AND $DATE_LAST_CR_BANK <> '' AND 
                 ($DATE_LAST_DR_CUST IS NULL OR $DATE_LAST_DR_CUST = '' OR date($DATE_LAST_CR_BANK) >= date($DATE_LAST_DR_CUST)) AND
                 ($DATE_LAST_DR_BANK IS NULL OR $DATE_LAST_DR_BANK = '' OR date($DATE_LAST_CR_BANK) >= date($DATE_LAST_DR_BANK)) THEN date($DATE_LAST_CR_BANK)
            WHEN $DATE_LAST_DR_CUST IS NOT NULL AND $DATE_LAST_DR_CUST <> '' AND 
                 ($DATE_LAST_DR_BANK IS NULL OR $DATE_LAST_DR_BANK = '' OR date($DATE_LAST_DR_CUST) >= date($DATE_LAST_DR_BANK)) THEN date($DATE_LAST_DR_CUST)
            WHEN $DATE_LAST_DR_BANK IS NOT NULL AND $DATE_LAST_DR_BANK <> '' THEN date($DATE_LAST_DR_BANK)
            ELSE NULL
        END,
    a.last_updated_date = CASE WHEN $SDS_DATE IS NOT NULL AND $SDS_DATE <> '' THEN date($SDS_DATE) ELSE NULL END
ON MATCH SET
    a.category = $CATEGORY,
    a.open_actual_bal = $OPEN_ACTUAL_BAL,
    a.open_cleared_bal = $OPEN_CLEARED_BAL,
    a.online_actual_bal = $ONLINE_ACTUAL_BAL,
    a.online_cleared_bal = $ONLINE_CLEARED_BAL,
    a.working_balance = $WORKING_BALANCE,
    a.account_officer = $ACCOUNT_OFFICER,
    a.opening_date = COALESCE(CASE WHEN $OPENING_DATE IS NOT NULL AND $OPENING_DATE <> '' THEN date($OPENING_DATE) ELSE NULL END, a.opening_date),
    a.last_cr_cust_date = COALESCE(CASE WHEN $DATE_LAST_CR_CUST IS NOT NULL AND $DATE_LAST_CR_CUST <> '' THEN date($DATE_LAST_CR_CUST) ELSE NULL END, a.last_cr_cust_date),
    a.last_cr_bank_date = COALESCE(CASE WHEN $DATE_LAST_CR_BANK IS NOT NULL AND $DATE_LAST_CR_BANK <> '' THEN date($DATE_LAST_CR_BANK) ELSE NULL END, a.last_cr_bank_date),
    a.last_dr_cust_date = COALESCE(CASE WHEN $DATE_LAST_DR_CUST IS NOT NULL AND $DATE_LAST_DR_CUST <> '' THEN date($DATE_LAST_DR_CUST) ELSE NULL END, a.last_dr_cust_date),
    a.last_dr_bank_date = COALESCE(CASE WHEN $DATE_LAST_DR_BANK IS NOT NULL AND $DATE_LAST_DR_BANK <> '' THEN date($DATE_LAST_DR_BANK) ELSE NULL END, a.last_dr_bank_date),
    a.last_transaction_date = 
        CASE 
            WHEN $DATE_LAST_CR_CUST IS NOT NULL AND $DATE_LAST_CR_CUST <> '' AND 
                 ($DATE_LAST_CR_BANK IS NULL OR $DATE_LAST_CR_BANK = '' OR date($DATE_LAST_CR_CUST) >= date($DATE_LAST_CR_BANK)) AND
                 ($DATE_LAST_DR_CUST IS NULL OR $DATE_LAST_DR_CUST = '' OR date($DATE_LAST_CR_CUST) >= date($DATE_LAST_DR_CUST)) AND
                 ($DATE_LAST_DR_BANK IS NULL OR $DATE_LAST_DR_BANK = '' OR date($DATE_LAST_CR_CUST) >= date($DATE_LAST_DR_BANK)) THEN date($DATE_LAST_CR_CUST)
            WHEN $DATE_LAST_CR_BANK IS NOT NULL AND $DATE_LAST_CR_BANK <> '' AND 
                 ($DATE_LAST_DR_CUST IS NULL OR $DATE_LAST_DR_CUST = '' OR date($DATE_LAST_CR_BANK) >= date($DATE_LAST_DR_CUST)) AND
                 ($DATE_LAST_DR_BANK IS NULL OR $DATE_LAST_DR_BANK = '' OR date($DATE_LAST_CR_BANK) >= date($DATE_LAST_DR_BANK)) THEN date($DATE_LAST_CR_BANK)
            WHEN $DATE_LAST_DR_CUST IS NOT NULL AND $DATE_LAST_DR_CUST <> '' AND 
                 ($DATE_LAST_DR_BANK IS NULL OR $DATE_LAST_DR_BANK = '' OR date($DATE_LAST_DR_CUST) >= date($DATE_LAST_DR_BANK)) THEN date($DATE_LAST_DR_CUST)
            WHEN $DATE_LAST_DR_BANK IS NOT NULL AND $DATE_LAST_DR_BANK <> '' THEN date($DATE_LAST_DR_BANK)
            ELSE a.last_transaction_date
        END,
    a.last_updated_date = COALESCE(CASE WHEN $SDS_DATE IS NOT NULL AND $SDS_DATE <> '' THEN date($SDS_DATE) ELSE NULL END, a.last_updated_date);
'''
            out.append(mgp.Record(query=cy_account, parameters=params))

            # Create OWNS relationship if customer exists
            if params['CUSTOMER']:
                cy_owns = '''
MATCH (c:Customer {customer_id: $CUSTOMER})
MATCH (a:Account {account_id: $RECID})
MERGE (c)-[:OWNS]->(a);
'''
                out.append(mgp.Record(query=cy_owns, parameters=params))

    if not out:
        logger.info("Batch produced 0 Cypher records (no relevant messages or all skipped)")

    return out





#-------------FUNDS TRANSFER-------------
import mgp
import json
import traceback
import re
from typing import Iterable, Any
from datetime import datetime

# Relevant entities to process
RELEVANT_ENTITIES = {
    "FBNK.CUSTOMER",
    "FBNK.ACCOUNT",
    "FBNK.FUNDS.TRANSFER",
    "FBNK_FUNDS_TRANSFER"
}

# --- helpers ----------------------------------------------------------
DATE_FORMATS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%Y/%m/%d"
]

DATETIME_FORMATS = [
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%d/%m/%Y %H:%M:%S",
    "%d-%m-%Y %H:%M:%S",
]

def is_epoch_ms(s: str) -> bool:
    return s.isdigit() and len(s) >= 12

def to_iso_date_if_valid(value: Any) -> str | None:
    """
    Return an ISO date 'YYYY-MM-DD' if value is a valid date or an epoch-ms.
    Otherwise return None so Cypher will not attempt date(...) on bad data.
    """
    if value is None:
        return None
    s = str(value).strip()
    if s.lower() in ("none", "null", ""):
        return None

    # If it's an epoch in ms -> convert to date
    if is_epoch_ms(s):
        try:
            ts = int(s)
            return datetime.utcfromtimestamp(ts / 1000).strftime("%Y-%m-%d")
        except Exception:
            return None

    # Already ISO date
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        return s

    # Try several common formats and return date part
    for fmt in DATE_FORMATS + DATETIME_FORMATS:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d")
        except Exception:
            pass

    # not a valid date
    return None

def to_iso_datetime_if_valid(value: Any) -> str | None:
    """
    Return a datetime string 'YYYY-MM-DD HH:MM:SS' (space-separated) if value is a valid
    datetime or epoch-ms. Otherwise return None so Cypher won't call localdatetime on bad data.
    (We keep a space here because your Cypher does replace($TRANSACTION_TIME, ' ', 'T').)
    """
    if value is None:
        return None
    s = str(value).strip()
    if s.lower() in ("none", "null", ""):
        return None

    # epoch ms -> datetime
    if is_epoch_ms(s):
        try:
            ts = int(s)
            return datetime.utcfromtimestamp(ts / 1000).strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return None

    # ISO datetime with 'T' or space
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?", s):
        # normalize to 'YYYY-MM-DD HH:MM:SS' (drop subseconds)
        normalized = s.replace("T", " ")
        try:
            dt = datetime.fromisoformat(normalized)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            pass

    # try parsing common formats
    for fmt in DATETIME_FORMATS:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            pass

    return None

def convert_value(value: Any) -> Any:
    """
    Convert strings representing numbers, floats, or SDS epoch timestamps (ms)
    to proper int, float, or leave as-is for other strings.
    (Date/datetime handling is moved to dedicated helpers above.)
    """
    if value is None:
        return None

    s = str(value).strip()
    if s.lower() in ("none", "null", ""):
        return None

    # Integer conversion
    if s.lstrip("+-").isdigit():
        try:
            return int(s)
        except Exception:
            return s

    # Float conversion (simple heuristic)
    try:
        if "." in s:
            return float(s.replace(",", ""))
    except Exception:
        pass

    # leave everything else untouched
    return s

# --- transformer -----------------------------------------------------
@mgp.transformation
def keep_relevant(context: mgp.TransCtx, messages: mgp.Messages) -> Iterable[mgp.Record]:
    out = []
    logger = mgp.Logger()
    batch_count = messages.total_messages()
    logger.info(f"Processing batch with {batch_count} messages")

    for i in range(batch_count):
        msg = messages.message_at(i)
        try:
            payload_str = msg.payload().decode('utf-8')
            payload = json.loads(payload_str)
        except Exception as e:
            logger.warning(f"Skipping message at offset {msg.offset()}: bad JSON: {e}")
            logger.error(traceback.format_exc())
            continue

        if 'entity_name' not in payload or 'value' not in payload:
            logger.warning(f"Skipping message at offset {msg.offset()}: missing entity_name or value")
            continue

        entity_name = payload['entity_name']
        normalized = entity_name.replace('.', '_')
        if entity_name not in RELEVANT_ENTITIES and normalized not in RELEVANT_ENTITIES:
            continue

        data = payload['value']
        if not isinstance(data, dict):
            logger.warning(f"Skipping message at offset {msg.offset()}: 'value' must be an object")
            continue

        # Handle funds transfers
        if entity_name in ("FBNK.FUNDS.TRANSFER", "FBNK_FUNDS_TRANSFER", "FBNK.FUNDS_TRANSFER"):
            recid = data.get('RECID')
            if not recid:
                logger.warning(f"Skipping transfer message at offset {msg.offset()}: RECID missing")
                continue

            # use specific date/datetime helpers so we only convert valid strings
            debit_value_date = to_iso_date_if_valid(data.get('DEBIT_VALUE_DATE') or data.get('emittedTime'))
            processing_date = to_iso_date_if_valid(data.get('PROCESSING_DATE'))
            transaction_time = to_iso_datetime_if_valid(data.get('TRANSACTION_TIME'))

            params = {
                'RECID': str(recid),
                'PAYMENT_DETAILS': data.get('PAYMENT_DETAILS'),
                'TRANSACTION_TYPE': data.get('TRANSACTION_TYPE'),
                'DEBIT_ACCT_NO': data.get('DEBIT_ACCT_NO'),
                'CREDIT_ACCT_NO': data.get('CREDIT_ACCT_NO'),
                'DEBIT_CUST_NO': data.get('DEBIT_CUST_NO'),
                'CREDIT_CUST_NO': data.get('CREDIT_CUST_NO'),
                'LOC_AMT_DEBITED': convert_value(data.get('LOC_AMT_DEBITED')),
                'LOC_AMT_CREDITED': convert_value(data.get('LOC_AMT_CREDITED')),
                'LOCAL_CHARGE_AMT': convert_value(data.get('LOCAL_CHARGE_AMT')),
                'DEBIT_VALUE_DATE': debit_value_date,
                'PROCESSING_DATE': processing_date,
                'TRANSACTION_TIME': transaction_time
            }

            logger.info(
                f"Inserting Transaction RECID={recid}, offset={msg.offset()}, "
                f"debit={params['DEBIT_ACCT_NO']}, credit={params['CREDIT_ACCT_NO']}"
            )

            # 1️⃣ Transaction node — guard date/localdatetime with CASE WHEN checks
            cy_tx = '''
MERGE (t:Transaction {transaction_id: $RECID})
ON CREATE SET
    t.debit_account = $DEBIT_ACCT_NO,
    t.credit_account = $CREDIT_ACCT_NO,
    t.debit_customer = $DEBIT_CUST_NO,
    t.credit_customer = $CREDIT_CUST_NO,
    t.debit_amount = $LOC_AMT_DEBITED,
    t.credit_amount = $LOC_AMT_CREDITED,
    t.local_charge_amt = $LOCAL_CHARGE_AMT,
    t.value_date = CASE WHEN $DEBIT_VALUE_DATE IS NOT NULL AND $DEBIT_VALUE_DATE <> '' THEN date($DEBIT_VALUE_DATE) ELSE NULL END,
    t.payment_details = $PAYMENT_DETAILS,
    t.transaction_type = $TRANSACTION_TYPE,
    t.processing_date = CASE WHEN $PROCESSING_DATE IS NOT NULL AND $PROCESSING_DATE <> '' THEN date($PROCESSING_DATE) ELSE NULL END,
    t.transaction_time = CASE WHEN $TRANSACTION_TIME IS NOT NULL AND $TRANSACTION_TIME <> '' THEN localdatetime(replace($TRANSACTION_TIME, ' ', 'T')) ELSE NULL END
ON MATCH SET
    t.debit_customer = COALESCE($DEBIT_CUST_NO, t.debit_customer),
    t.credit_customer = COALESCE($CREDIT_CUST_NO, t.credit_customer),
    t.debit_amount = COALESCE($LOC_AMT_DEBITED, t.debit_amount),
    t.credit_amount = COALESCE($LOC_AMT_CREDITED, t.credit_amount),
    t.local_charge_amt = COALESCE($LOCAL_CHARGE_AMT, t.local_charge_amt),
    t.value_date = COALESCE(CASE WHEN $DEBIT_VALUE_DATE IS NOT NULL AND $DEBIT_VALUE_DATE <> '' THEN date($DEBIT_VALUE_DATE) ELSE NULL END, t.value_date),
    t.processing_date = COALESCE(CASE WHEN $PROCESSING_DATE IS NOT NULL AND $PROCESSING_DATE <> '' THEN date($PROCESSING_DATE) ELSE NULL END, t.processing_date);
'''
            out.append(mgp.Record(query=cy_tx, parameters=params))

            # 2️⃣ Credit relationship
            cy_credit = '''
MATCH (a_credit:Account) WHERE a_credit.account_id = $CREDIT_ACCT_NO AND $CREDIT_ACCT_NO IS NOT NULL AND $CREDIT_ACCT_NO <> ''
MATCH (t:Transaction {transaction_id: $RECID})
MERGE (t)-[r:RECEIVED]->(a_credit)
ON CREATE SET
    r.timestamp = t.transaction_time,
    r.amount = t.credit_amount,
    r.transaction_id = t.transaction_id
ON MATCH SET
    r.timestamp = t.transaction_time,
    r.amount = t.credit_amount,
    r.transaction_id = t.transaction_id;
'''
            out.append(mgp.Record(query=cy_credit, parameters=params))

            # 3️⃣ Debit relationship
            cy_debit = '''
MATCH (a_debit:Account) WHERE a_debit.account_id = $DEBIT_ACCT_NO AND $DEBIT_ACCT_NO IS NOT NULL AND $DEBIT_ACCT_NO <> ''
MATCH (t:Transaction {transaction_id: $RECID})
MERGE (a_debit)-[s:SENT]->(t)
ON CREATE SET
    s.timestamp = t.transaction_time,
    s.amount = t.debit_amount,
    s.transaction_id = t.transaction_id
ON MATCH SET
    s.timestamp = t.transaction_time,
    s.amount = t.debit_amount,
    s.transaction_id = t.transaction_id;
'''
            out.append(mgp.Record(query=cy_debit, parameters=params))

    if not out:
        logger.info("Batch produced 0 Cypher records (no relevant messages or all skipped)")

    return out
