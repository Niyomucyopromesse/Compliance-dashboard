"""Centralized Cypher queries for the fraud detection system."""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta


class CypherQueries:
    """Centralized Cypher queries for Memgraph operations."""
    
    # Health and metrics queries
    HEALTH_CHECK = "RETURN 1 as health"
    
    GET_NODE_COUNTS = """
    MATCH (c:Customer), (a:Account), (t:Transaction), (al:Alert)
    RETURN count(c) as customers, count(a) as accounts, 
           count(t) as transactions, count(al) as alerts
    """
    
    # Customer queries
    GET_CUSTOMER_BY_ID = """
    MATCH (c:Customer {customer_id: $customer_id})
    OPTIONAL MATCH (c)-[:OWNS]->(a:Account)
    RETURN c {.customer_id, .full_name, .email, .phone, .residence, .risk_class, 
              .status, .customer_since, .kyc_complete, .aml_result, .account_officer,
              .dob, .gender, .industry, .language, .last_updated_date, .marital_status,
              .nationality, .next_of_kin_name, .segment, .spouse_name, .target, .title} as customer,
           collect(a {.account_id, .account_officer, .account_title_1, .category, .currency,
                     .customer_id, .last_updated_date, .limit_ref, .opening_date, 
                     .position_type, .short_title, .working_balance}) as accounts
    """
    
    GET_CUSTOMERS = """
    MATCH (c:Customer)
    WHERE ($search IS NULL OR c.customer_id CONTAINS $search OR c.full_name CONTAINS $search OR c.email CONTAINS $search)
    AND ($risk_level IS NULL OR c.risk_class = $risk_level)
    AND ($status IS NULL OR c.status = $status)
    WITH c
    ORDER BY c.customer_id ASC
    SKIP $offset
    LIMIT $limit
    RETURN c {.customer_id, .full_name, .email, .phone, .residence, .risk_class, 
              .status, .customer_since, .kyc_complete, .aml_result, .account_officer,
              .dob, .gender, .industry, .language, .last_updated_date, .marital_status,
              .nationality, .next_of_kin_name, .segment, .spouse_name, .target, .title} as customer
    """
    
    GET_CUSTOMERS_COUNT = """
    MATCH (c:Customer)
    WHERE ($search IS NULL OR c.customer_id CONTAINS $search OR c.full_name CONTAINS $search OR c.email CONTAINS $search)
    AND ($risk_level IS NULL OR c.risk_class = $risk_level)
    AND ($status IS NULL OR c.status = $status)
    RETURN count(c) as total
    """
    
    # Account queries
    GET_ACCOUNT_BY_ID = """
    MATCH (a:Account {account_id: $account_id})
    OPTIONAL MATCH (c:Customer)-[:OWNS]->(a)
    RETURN a {.account_id, .account_officer, .account_title_1, .category, .currency,
              .customer_id, .last_updated_date, .limit_ref, .opening_date, 
              .position_type, .short_title, .working_balance} as account,
           c {.customer_id, .full_name, .email, .phone, .residence, .risk_class, 
              .status, .customer_since, .kyc_complete, .aml_result, .account_officer,
              .dob, .gender, .industry, .language, .last_updated_date, .marital_status,
              .nationality, .next_of_kin_name, .segment, .spouse_name, .target, .title} as customer
    """
    
    GET_ACCOUNTS = """
    MATCH (a:Account)
    OPTIONAL MATCH (c:Customer {customer_id: $customer_id})-[:OWNS]->(a)
    WHERE ($customer_id IS NULL OR c IS NOT NULL)
    AND ($account_type IS NULL OR a.category = $account_type)
    AND ($risk_level IS NULL OR a.risk_class = $risk_level)
    AND ($status IS NULL OR a.status = $status)
    WITH a
    ORDER BY a.account_id ASC
    SKIP $offset
    LIMIT $limit
    RETURN a {.account_id, .account_officer, .account_title_1, .category, .currency,
              .customer_id, .last_updated_date, .limit_ref, .opening_date, 
              .position_type, .short_title, .working_balance} as account
    """
    
    GET_ACCOUNTS_COUNT = """
    MATCH (a:Account)
    OPTIONAL MATCH (c:Customer {customer_id: $customer_id})-[:OWNS]->(a)
    WHERE ($customer_id IS NULL OR c IS NOT NULL)
    AND ($account_type IS NULL OR a.category = $account_type)
    AND ($risk_level IS NULL OR a.risk_class = $risk_level)
    AND ($status IS NULL OR a.status = $status)
    RETURN count(a) as total
    """
    
    GET_ACCOUNT_RECENT_TRANSACTIONS = """
    MATCH (t:Transaction)
    WHERE t.credit_account = $account_id OR t.debit_account = $account_id
    WITH t
    ORDER BY t.transaction_time DESC
    LIMIT 5
    RETURN collect(t {.transaction_id, .processing_date, .value_date, .transaction_time,
                     .credit_amount, .debit_amount, .credit_account, .debit_account,
                     .transaction_type, .payment_details, .local_charge_amt, .risk_score,
                     .risk_label, .alert_id, .meta, .status}) as transactions
    """
    
    # Transaction queries
    GET_TRANSACTION_BY_ID = """
    MATCH (t:Transaction {transaction_id: $tx_id})
    RETURN t {.transaction_id, .processing_date, .value_date, .transaction_time,
              .credit_amount, .debit_amount, .credit_account, .debit_account,
              .transaction_type, .payment_details, .local_charge_amt, .risk_score,
              .risk_label, .alert_id, .meta, .status} as transaction
    """
    
    GET_TRANSACTIONS = """
    MATCH (t:Transaction)
    WHERE ($search IS NULL OR t.transaction_id CONTAINS $search OR t.payment_details CONTAINS $search)
    AND ($date_from IS NULL OR t.transaction_time >= localdatetime($date_from))
    AND ($date_to IS NULL OR t.transaction_time <= localdatetime($date_to))
    AND ($account_id IS NULL OR t.credit_account = $account_id OR t.debit_account = $account_id)
    WITH t
    ORDER BY t.transaction_time DESC
    SKIP $offset
    LIMIT $limit
    RETURN t {.transaction_id, .processing_date, .value_date, .transaction_time,
              .credit_amount, .debit_amount, .credit_account, .debit_account,
              .transaction_type, .payment_details, .local_charge_amt, .risk_score,
              .risk_label, .alert_id, .meta, .status} as transaction
    """
    
    GET_TRANSACTIONS_COUNT = """
    MATCH (t:Transaction)
    WHERE ($search IS NULL OR t.transaction_id CONTAINS $search OR t.payment_details CONTAINS $search)
    AND ($date_from IS NULL OR t.transaction_time >= localdatetime($date_from))
    AND ($date_to IS NULL OR t.transaction_time <= localdatetime($date_to))
    AND ($account_id IS NULL OR t.credit_account = $account_id OR t.debit_account = $account_id)
    RETURN count(t) as total
    """
    
    # Alert queries
    GET_ALERT_BY_ID = """
    MATCH (a:Alert {alert_id: $alert_id})
    OPTIONAL MATCH (a)-[:ALERTS]->(t:Transaction)
    OPTIONAL MATCH (a)-[:ALERTS]->(c:Customer)
    RETURN a {.alert_id, .alert_type, .severity, .status, .description, 
              .amount, .customer_id, .account_id, .transaction_id, .risk_score, 
              .timestamp, .created_at, .updated_at, .additional_data, .assigned_to, .notes} as alert,
           t {.transaction_id, .processing_date, .value_date, .transaction_time,
              .credit_amount, .debit_amount, .credit_account, .debit_account,
              .transaction_type, .payment_details, .local_charge_amt, .risk_score,
              .risk_label, .alert_id, .meta, .status} as transaction,
           c {.customer_id, .full_name, .email} as customer
    """
    
    GET_ALERTS = """
    MATCH (a:Alert)
    WHERE ($severity IS NULL OR a.severity = $severity)
    AND ($status IS NULL OR a.status = $status)
    AND ($alert_type IS NULL OR a.alert_type = $alert_type)
    AND ($date_from IS NULL OR a.timestamp >= $date_from)
    AND ($date_to IS NULL OR a.timestamp <= $date_to)
    WITH a
    ORDER BY a.timestamp DESC
    SKIP $offset
    LIMIT $limit
    RETURN a {.alert_id, .alert_type, .severity, .status, .description, 
              .amount, .customer_id, .account_id, .transaction_id, .risk_score, 
              .timestamp, .created_at, .updated_at, .additional_data, .assigned_to, .notes} as alert
    """
    
    GET_ALERTS_COUNT = """
    MATCH (a:Alert)
    WHERE ($severity IS NULL OR a.severity = $severity)
    AND ($status IS NULL OR a.status = $status)
    AND ($alert_type IS NULL OR a.alert_type = $alert_type)
    AND ($date_from IS NULL OR a.timestamp >= $date_from)
    AND ($date_to IS NULL OR a.timestamp <= $date_to)
    RETURN count(a) as total
    """
    
    GET_ALERTS_SEVERITY_COUNT = """
    MATCH (a:Alert)
    WHERE ($severity IS NULL OR a.severity = $severity)
    AND ($status IS NULL OR a.status = $status)
    AND ($alert_type IS NULL OR a.alert_type = $alert_type)
    AND ($date_from IS NULL OR a.timestamp >= $date_from)
    AND ($date_to IS NULL OR a.timestamp <= $date_to)
    WITH a.severity as severity, count(a) as count
    RETURN {
        critical: sum(CASE WHEN severity = 'CRITICAL' THEN count ELSE 0 END),
        high: sum(CASE WHEN severity = 'HIGH' THEN count ELSE 0 END),
        medium: sum(CASE WHEN severity = 'MEDIUM' THEN count ELSE 0 END),
        low: sum(CASE WHEN severity = 'LOW' THEN count ELSE 0 END),
        info: sum(CASE WHEN severity = 'INFO' THEN count ELSE 0 END)
    } as severity_count
    """
    
    # Metrics queries
    GET_OVERVIEW_METRICS = """
    CALL {
      MATCH (c:Customer) RETURN count(c) AS total_customers
    }
    CALL {
      MATCH (a:Account) RETURN count(a) AS total_accounts
    }
    CALL {
      MATCH (t:Transaction) RETURN count(t) AS total_transactions
    }
    CALL {
      MATCH (t:Transaction)
      WHERE t.transaction_time >= localdatetime() - duration('P1D')
      RETURN count(t) AS transactions_last_24h
    }
    CALL {
      MATCH (t:Transaction)
      WHERE t.risk_label IN ['High','Medium']
      RETURN count(t) AS flagged_transactions, sum(coalesce(toFloat(t.amount),0)) AS flagged_amount
    }
    CALL {
      OPTIONAL MATCH (al:Alert) RETURN count(al) AS total_alerts, sum(CASE WHEN al.status = 'Open' OR al.status IS NULL THEN 1 ELSE 0 END) AS unresolved_alerts
    }
    RETURN total_customers, total_accounts, total_transactions, transactions_last_24h, flagged_transactions, flagged_amount, total_alerts, unresolved_alerts
    """
    
    # GET_TRANSACTIONS_BY_HOUR = """
    # WITH localdatetime() AS now
    # UNWIND range(0,23) AS i
    # WITH now - duration('PT' + toString(i) + 'H') AS dt
    # WITH localdatetime({
    #        year: dt.year,
    #        month: dt.month,
    #        day: dt.day,
    #        hour: dt.hour
    #      }) AS hourBucket
    # OPTIONAL MATCH (t:Transaction)
    #   WHERE t.transaction_time >= hourBucket
    #     AND t.transaction_time <  hourBucket + duration('PT1H')
    # RETURN hourBucket AS hour, count(t) AS cnt
    # ORDER BY hour
    # """

    GET_TRANSACTIONS_BY_DAY_30MIN = """
    WITH localdatetime() AS now
        UNWIND range(0, 47) AS i
        WITH now - duration('PT' + toString(i * 30) + 'M') AS dt
        WITH localdatetime({
            year: dt.year,
            month: dt.month,
            day: dt.day,
            hour: dt.hour,
            minute: dt.minute - (dt.minute % 30)
            }) AS timeBucket
        OPTIONAL MATCH (t:Transaction), (ch:Channel)
        WHERE t.transaction_time >= timeBucket
        AND t.transaction_time < timeBucket + duration('PT30M')
        AND t.transaction_type = ch.TRANSACTION_TYPE
        WITH timeBucket AS time,
             ch.CHANNEL AS channel,
             count(t) AS cnt,
             sum(coalesce(t.credit_amount, t.debit_amount, 0)) AS total_amount,
             avg(coalesce(t.credit_amount, t.debit_amount, 0)) AS avg_amount
        RETURN time, channel, cnt, total_amount, avg_amount
        ORDER BY time, channel;
        """

    GET_TRANSACTIONS_BY_WEEK_8HOUR = """
    WITH localdatetime() AS now
        UNWIND range(0, 20) AS i
        WITH now - duration('PT' + toString(i * 8) + 'H') AS dt
        WITH localdatetime({
            year: dt.year,
            month: dt.month,
            day: dt.day,
            hour: dt.hour - (dt.hour % 8)
            }) AS timeBucket
        OPTIONAL MATCH (t:Transaction), (ch:Channel)
        WHERE t.transaction_time >= timeBucket
        AND t.transaction_time < timeBucket + duration('PT8H')
        AND t.transaction_type = ch.TRANSACTION_TYPE
        WITH timeBucket AS time,
             ch.CHANNEL AS channel,
             count(t) AS cnt,
             sum(coalesce(t.credit_amount, t.debit_amount, 0)) AS total_amount,
             avg(coalesce(t.credit_amount, t.debit_amount, 0)) AS avg_amount
        RETURN time, channel, cnt, total_amount, avg_amount
        ORDER BY time, channel;
        """

    GET_TRANSACTIONS_BY_MONTH_DAY = """
    WITH localdatetime() AS now
        UNWIND range(0, 29) AS i
        WITH now - duration('P' + toString(i) + 'D') AS dt
        WITH localdatetime({
            year: dt.year,
            month: dt.month,
            day: dt.day
            }) AS dayBucket
        OPTIONAL MATCH (t:Transaction), (ch:Channel)
        WHERE t.transaction_time >= dayBucket
        AND t.transaction_time < dayBucket + duration('P1D')
        AND t.transaction_type = ch.TRANSACTION_TYPE
        WITH dayBucket AS time,
             ch.CHANNEL AS channel,
             count(t) AS cnt,
             sum(coalesce(t.credit_amount, t.debit_amount, 0)) AS total_amount,
             avg(coalesce(t.credit_amount, t.debit_amount, 0)) AS avg_amount
        RETURN time, channel, cnt, total_amount, avg_amount
        ORDER BY time, channel;
        """

    GET_TRANSACTIONS_BY_3MONTHS_2DAY = """
    WITH localdatetime() AS now
        UNWIND range(0, 44) AS i
        WITH now - duration('P' + toString(i * 2) + 'D') AS dt
        WITH localdatetime({
            year: dt.year,
            month: dt.month,
            day: dt.day
            }) AS dayBucket
        OPTIONAL MATCH (t:Transaction), (ch:Channel)
        WHERE t.transaction_time >= dayBucket
        AND t.transaction_time < dayBucket + duration('P2D')
        AND t.transaction_type = ch.TRANSACTION_TYPE
        WITH dayBucket AS time,
             ch.CHANNEL AS channel,
             count(t) AS cnt,
             sum(coalesce(t.credit_amount, t.debit_amount, 0)) AS total_amount,
             avg(coalesce(t.credit_amount, t.debit_amount, 0)) AS avg_amount
        RETURN time, channel, cnt, total_amount, avg_amount
        ORDER BY time, channel;
        """

    GET_TRANSACTIONS_BY_YEAR_DAY = """
    WITH localdatetime() AS now
        UNWIND range(0, 364) AS i
        WITH now - duration('P' + toString(i) + 'D') AS dt
        WITH localdatetime({
            year: dt.year,
            month: dt.month,
            day: dt.day
            }) AS dayBucket
        OPTIONAL MATCH (t:Transaction), (ch:Channel)
        WHERE t.transaction_time >= dayBucket
        AND t.transaction_time < dayBucket + duration('P1D')
        AND t.transaction_type = ch.TRANSACTION_TYPE
        WITH dayBucket AS time,
             ch.CHANNEL AS channel,
             count(t) AS cnt,
             sum(coalesce(t.credit_amount, t.debit_amount, 0)) AS total_amount,
             avg(coalesce(t.credit_amount, t.debit_amount, 0)) AS avg_amount
        RETURN time, channel, cnt, total_amount, avg_amount
        ORDER BY time, channel;
        """
    
    GET_RISK_DISTRIBUTION = """
    MATCH (t:Transaction)
    WHERE t.transaction_time >= localdatetime($date_from) AND t.transaction_time <= localdatetime($date_to)
    WITH t.transaction_type as label, count(t) as count
    MATCH (t2:Transaction)
    WHERE t2.transaction_time >= localdatetime($date_from) AND t2.transaction_time <= localdatetime($date_to)
    WITH label, count, count(t2) as total_count
    ORDER BY count DESC
    RETURN label, count,
           toFloat(count) / total_count * 100 as percentage
    """
    
    # Transaction graph queries
    GET_TRANSACTION_NEIGHBORHOOD = """
    MATCH p = (a)-[r*1..3]-(b)
    WHERE any(n IN nodes(p) WHERE n.tx_id = $tx_id OR n.account_id = $account_id)
    RETURN p LIMIT 100
    """
    
    # Create/Update queries
    CREATE_CUSTOMER = """
    CREATE (c:Customer {
        customer_id: $customer_id,
        name: $name,
        email: $email,
        phone: $phone,
        address: $address,
        risk_score: $risk_score,
        risk_label: $risk_label,
        status: $status,
        created_at: datetime($created_at),
        updated_at: datetime($updated_at)
    })
    RETURN c
    """
    
    CREATE_ACCOUNT = """
    CREATE (a:Account {
        account_id: $account_id,
        account_number: $account_number,
        account_type: $account_type,
        balance: $balance,
        currency: $currency,
        risk_score: $risk_score,
        risk_label: $risk_label,
        status: $status,
        created_at: datetime($created_at),
        last_transaction: $last_transaction
    })
    RETURN a
    """
    
    CREATE_TRANSACTION = """
    CREATE (t:Transaction {
        tx_id: $tx_id,
        timestamp: datetime($timestamp),
        from_account: $from_account,
        to_account: $to_account,
        amount: $amount,
        currency: $currency,
        type: $type,
        risk_score: $risk_score,
        risk_label: $risk_label,
        status: $status,
        alert_id: $alert_id,
        meta: $meta
    })
    RETURN t
    """
    
    CREATE_ALERT = """
    CREATE (a:Alert {
        alert_id: $alert_id,
        alert_type: $alert_type,
        severity: $severity,
        status: $status,
        description: $description,
        amount: $amount,
        customer_id: $customer_id,
        account_id: $account_id,
        transaction_id: $transaction_id,
        risk_score: $risk_score,
        timestamp: datetime($timestamp),
        created_at: datetime($created_at),
        updated_at: datetime($updated_at),
        additional_data: $additional_data,
        assigned_to: $assigned_to,
        notes: $notes
    })
    RETURN a
    """
    
    # Relationship queries
    CREATE_OWNS_RELATIONSHIP = """
    MATCH (c:Customer {customer_id: $customer_id}), (a:Account {account_id: $account_id})
    CREATE (c)-[:OWNS]->(a)
    """
    
    CREATE_ALERTS_RELATIONSHIP = """
    MATCH (a:Alert {alert_id: $alert_id}), (target:Transaction {tx_id: $target_id})
    CREATE (a)-[:ALERTS]->(target)
    """
    
    # Update queries
    UPDATE_CUSTOMER = """
    MATCH (c:Customer {customer_id: $customer_id})
    SET c.name = $name,
        c.email = $email,
        c.phone = $phone,
        c.address = $address,
        c.risk_score = $risk_score,
        c.risk_label = $risk_label,
        c.status = $status,
        c.updated_at = datetime($updated_at)
    RETURN c
    """
    
    UPDATE_ACCOUNT = """
    MATCH (a:Account {account_id: $account_id})
    SET a.account_type = $account_type,
        a.risk_score = $risk_score,
        a.risk_label = $risk_label,
        a.status = $status,
        a.last_transaction = $last_transaction
    RETURN a
    """
    
    UPDATE_TRANSACTION = """
    MATCH (t:Transaction {tx_id: $tx_id})
    SET t.risk_score = $risk_score,
        t.risk_label = $risk_label,
        t.status = $status,
        t.alert_id = $alert_id,
        t.meta = $meta
    RETURN t
    """
    
    UPDATE_ALERT = """
    MATCH (a:Alert {alert_id: $alert_id})
    SET a.status = $status,
        a.assigned_to = $assigned_to,
        a.notes = $notes,
        a.updated_at = datetime($updated_at)
    RETURN a
    """
    
    # Index creation
    CREATE_INDEXES = [
        "CREATE INDEX ON :Customer(customer_id) IF NOT EXISTS",
        "CREATE INDEX ON :Account(account_id) IF NOT EXISTS",
        "CREATE INDEX ON :Transaction(tx_id) IF NOT EXISTS",
        "CREATE INDEX ON :Transaction(timestamp) IF NOT EXISTS",
        "CREATE INDEX ON :Transaction(risk_score) IF NOT EXISTS",
        "CREATE INDEX ON :Alert(alert_id) IF NOT EXISTS",
        "CREATE INDEX ON :Alert(created_at) IF NOT EXISTS",
    ]


# Query builder helper
def build_pagination_params(page: int, page_size: int, sort_by: str = "created_at", sort_order: str = "DESC") -> Dict[str, Any]:
    """Build pagination parameters for queries."""
    return {
        "offset": (page - 1) * page_size,
        "limit": page_size,
        "sort_by": sort_by,
        "sort_order": sort_order
    }


def build_date_range_params(date_from: Optional[datetime] = None, date_to: Optional[datetime] = None) -> Dict[str, Any]:
    """Build date range parameters for queries."""
    params = {}
    if date_from:
        params["date_from"] = date_from.isoformat()
    if date_to:
        params["date_to"] = date_to.isoformat()
    return params
