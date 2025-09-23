// Creating Docker container:
docker run -d   --name memgraph-mage   -p 7687:7687   -p 7444:7444   -v memgraph_data_volume:/var/lib/memgraph   memgraph/memgraph-mage:latest   --storage-mode IN_MEMORY_ANALYTICAL   --query-execution-timeout-sec=0
docker run -d   --name memgraph-mage   -p 7687:7687   -p 7444:7444   -v memgraph_data_volume:/var/lib/memgraph   memgraph/memgraph-mage:latest   --storage-mode IN_MEMORY_ANALYTICAL   --query-execution-timeout-sec=0   --schema-info-enabled


// Creating Memgraph lab container
docker run -d \
  --name memgraph-lab \
  -p 3000:3000 \
  --link memgraph-mage:memgraph \
  memgraph/lab:latest



// Migrate Customer

CREATE INDEX ON :Customer(customer_id);
CALL migrate.sql_server(
    'SELECT 
    RECID,
    GIVEN_NAMES,
    FAMILY_NAME,
    CONVERT(VARCHAR(8), DATE_OF_BIRTH, 112) AS DATE_OF_BIRTH,
    GENDER,
    MARITAL_STATUS,
    NATIONALITY,
    CUSTOMER_STATUS,
    EMAIL_D_1,
    SMS_D_1,
    RESIDENCE,
    KYC_COMPLETE,
    AML_RESULT,
    MANUAL_RISK_CLASS,
    ACCOUNT_OFFICER,
    SEGMENT,
    TARGET,
    INDUSTRY,
    LANGUAGE,
    CONVERT(VARCHAR(8), CUSTOMER_SINCE, 112) AS CUSTOMER_SINCE,
    BK_SPOUSE_NAME,
    BK_NEXT_KIN_NAME,
    CONVERT(VARCHAR(8), SDS_DATE, 112) AS SDS_DATE,
    TITLE
FROM BK_SDS.dbo.FBNK_CUSTOMER

',
    {
        user: 'aiuser',
        password: 'AIuser123',
        host: '10.24.34.190',
        database: 'BK_SDS',
        Encrypt: 'no',
        TrustServerCertificate: 'yes',
        Driver: 'ODBC Driver 18 for SQL Server'
    }
) YIELD row
MERGE (c:Customer {customer_id: row.RECID})
ON CREATE SET
    c.full_name = coalesce(row.GIVEN_NAMES, '') + ' ' + coalesce(row.FAMILY_NAME, ''),
    c.dob = CASE 
        WHEN row.DATE_OF_BIRTH IS NOT NULL AND row.DATE_OF_BIRTH <> '' THEN 
            date(toString(
                substring(row.DATE_OF_BIRTH, 0, 4) + '-' +
                substring(row.DATE_OF_BIRTH, 4, 2) + '-' +
                substring(row.DATE_OF_BIRTH, 6, 2)
            ))
        ELSE NULL 
    END,
    c.gender = row.GENDER,
    c.marital_status = row.MARITAL_STATUS,
    c.nationality = row.NATIONALITY,
    c.status = row.CUSTOMER_STATUS,
    c.email = row.EMAIL_D_1,
    c.phone = row.SMS_D_1,
    c.residence = row.RESIDENCE,
    c.kyc_complete = row.KYC_COMPLETE,
    c.aml_result = row.AML_RESULT,
    c.risk_class = row.MANUAL_RISK_CLASS,
    c.account_officer = row.ACCOUNT_OFFICER,
    c.industry = row.INDUSTRY,
    c.segment = row.SEGMENT,
    c.language = row.LANGUAGE,
    c.target = row.TARGET,
    c.customer_since = CASE 
        WHEN row.CUSTOMER_SINCE IS NOT NULL AND row.CUSTOMER_SINCE <> '' THEN 
            date(toString(
                substring(row.CUSTOMER_SINCE, 0, 4) + '-' +
                substring(row.CUSTOMER_SINCE, 4, 2) + '-' +
                substring(row.CUSTOMER_SINCE, 6, 2)
            ))
        ELSE NULL 
    END,
    c.spouse_name = row.BK_SPOUSE_NAME,
    c.next_of_kin_name = row.BK_NEXT_KIN_NAME,
    c.last_updated_date = CASE 
        WHEN row.SDS_DATE IS NOT NULL AND row.SDS_DATE <> '' THEN 
            date(toString(
                substring(row.SDS_DATE, 0, 4) + '-' +
                substring(row.SDS_DATE, 4, 2) + '-' +
                substring(row.SDS_DATE, 6, 2)
            ))
        ELSE NULL 
    END,
    c.title = row.TITLE
ON MATCH SET
    c.phone = CASE WHEN row.SMS_D_1 IS NOT NULL AND row.SMS_D_1 <> '' THEN row.SMS_D_1 ELSE c.phone END,
    c.segment = CASE WHEN row.SEGMENT IS NOT NULL AND row.SEGMENT <> '' THEN row.SEGMENT END,
    c.target = CASE WHEN row.TARGET IS NOT NULL AND row.TARGET <> '' THEN row.TARGET END,
    c.language = CASE WHEN row.LANGUAGE IS NOT NULL AND row.LANGUAGE <> '' THEN row.LANGUAGE END,
    c.marital_status = CASE WHEN row.MARITAL_STATUS IS NOT NULL AND row.MARITAL_STATUS <> '' THEN row.MARITAL_STATUS END,
    c.email = CASE WHEN row.EMAIL_D_1 IS NOT NULL AND row.EMAIL_D_1 <> '' THEN row.EMAIL_D_1 ELSE c.email END,
    c.status = CASE WHEN row.CUSTOMER_STATUS IS NOT NULL AND row.CUSTOMER_STATUS <> '' THEN row.CUSTOMER_STATUS ELSE c.status END,
    c.account_officer = CASE WHEN row.ACCOUNT_OFFICER IS NOT NULL AND row.ACCOUNT_OFFICER <> '' THEN row.ACCOUNT_OFFICER ELSE c.account_officer END,
    c.industry = CASE WHEN row.INDUSTRY IS NOT NULL AND row.INDUSTRY <> '' THEN row.INDUSTRY ELSE c.industry END,
    c.risk_class = CASE WHEN row.MANUAL_RISK_CLASS IS NOT NULL AND row.MANUAL_RISK_CLASS <> '' THEN row.MANUAL_RISK_CLASS ELSE c.risk_class END,
    c.last_updated_date = CASE 
        WHEN row.SDS_DATE IS NOT NULL AND row.SDS_DATE <> '' THEN 
            date(toString(
                substring(row.SDS_DATE, 0, 4) + '-' +
                substring(row.SDS_DATE, 4, 2) + '-' +
                substring(row.SDS_DATE, 6, 2)
            ))
        ELSE c.last_updated_date END;






// Migrate accounts table

CREATE INDEX ON :Account(account_id);
CALL migrate.sql_server(
    'SELECT 
    RECID,
    CATEGORY,
    CUSTOMER,
    SHORT_TITLE,
    ACCOUNT_TITLE_D_1,
    ACCOUNT_TITLE_D_2,
    POSITION_TYPE,
    CURRENCY,
    OPEN_ACTUAL_BAL,
    OPEN_CLEARED_BAL,
    ONLINE_ACTUAL_BAL,
    ONLINE_CLEARED_BAL,
    WORKING_BALANCE,
    LIMIT_REF,
    ACCOUNT_OFFICER,
    CONVERT(VARCHAR(8), DATE_LAST_CR_CUST, 112) AS DATE_LAST_CR_CUST,
    CONVERT(VARCHAR(8), DATE_LAST_CR_BANK, 112) AS DATE_LAST_CR_BANK,
    CONVERT(VARCHAR(8), DATE_LAST_DR_CUST, 112) AS DATE_LAST_DR_CUST,
    CONVERT(VARCHAR(8), DATE_LAST_DR_BANK, 112) AS DATE_LAST_DR_BANK,
    CONVERT(VARCHAR(8), OPENING_DATE, 112) AS OPENING_DATE,
    CONVERT(VARCHAR(8), SDS_DATE, 112) AS SDS_DATE
            FROM BK_SDS.dbo.FBNK_ACCOUNTS',
    {
        user: 'aiuser',
        password: 'AIuser123',
        host: '10.24.34.190',
        database: 'BK_SDS',
        Encrypt: 'no',
        TrustServerCertificate: 'yes',
        Driver: 'ODBC Driver 18 for SQL Server'
    }
) YIELD row

WITH row,
     CASE WHEN row.OPENING_DATE IS NOT NULL AND row.OPENING_DATE <> '' 
          THEN date(toString(substring(row.OPENING_DATE,0,4) + '-' + substring(row.OPENING_DATE,4,2) + '-' + substring(row.OPENING_DATE,6,2))) 
          ELSE NULL END AS opening_date,
     CASE WHEN row.DATE_LAST_CR_CUST IS NOT NULL AND row.DATE_LAST_CR_CUST <> '' 
          THEN date(toString(substring(row.DATE_LAST_CR_CUST,0,4) + '-' + substring(row.DATE_LAST_CR_CUST,4,2) + '-' + substring(row.DATE_LAST_CR_CUST,6,2))) 
          ELSE NULL END AS last_cr_cust_date,
     CASE WHEN row.DATE_LAST_CR_BANK IS NOT NULL AND row.DATE_LAST_CR_BANK <> '' 
          THEN date(toString(substring(row.DATE_LAST_CR_BANK,0,4) + '-' + substring(row.DATE_LAST_CR_BANK,4,2) + '-' + substring(row.DATE_LAST_CR_BANK,6,2))) 
          ELSE NULL END AS last_cr_bank_date,
     CASE WHEN row.DATE_LAST_DR_CUST IS NOT NULL AND row.DATE_LAST_DR_CUST <> '' 
          THEN date(toString(substring(row.DATE_LAST_DR_CUST,0,4) + '-' + substring(row.DATE_LAST_DR_CUST,4,2) + '-' + substring(row.DATE_LAST_DR_CUST,6,2))) 
          ELSE NULL END AS last_dr_cust_date,
     CASE WHEN row.DATE_LAST_DR_BANK IS NOT NULL AND row.DATE_LAST_DR_BANK <> '' 
          THEN date(toString(substring(row.DATE_LAST_DR_BANK,0,4) + '-' + substring(row.DATE_LAST_DR_BANK,4,2) + '-' + substring(row.DATE_LAST_DR_BANK,6,2))) 
          ELSE NULL END AS last_dr_bank_date,
     CASE WHEN row.SDS_DATE IS NOT NULL AND row.SDS_DATE <> '' 
          THEN date(toString(substring(row.SDS_DATE,0,4) + '-' + substring(row.SDS_DATE,4,2) + '-' + substring(row.SDS_DATE,6,2))) 
          ELSE NULL END AS sds_date

MERGE (a:Account {account_id: row.RECID})
ON CREATE SET
    a.customer_id = row.CUSTOMER,
    a.category = row.CATEGORY,
    a.short_title = row.SHORT_TITLE,
    a.account_title_1 = row.ACCOUNT_TITLE_D_1,
    a.account_title_2 = row.ACCOUNT_TITLE_D_2,
    a.position_type = row.POSITION_TYPE,
    a.currency = row.CURRENCY,
    a.open_actual_bal = toFloat(row.OPEN_ACTUAL_BAL),
    a.open_cleared_bal = toFloat(row.OPEN_CLEARED_BAL),
    a.online_actual_bal = toFloat(row.ONLINE_ACTUAL_BAL),
    a.online_cleared_bal = toFloat(row.ONLINE_CLEARED_BAL),
    a.working_balance = toFloat(row.WORKING_BALANCE),
    a.limit_ref = row.LIMIT_REF,
    a.account_officer = row.ACCOUNT_OFFICER,
    a.opening_date = opening_date,
    a.last_cr_cust_date = last_cr_cust_date,
    a.last_cr_bank_date = last_cr_bank_date,
    a.last_dr_cust_date = last_dr_cust_date,
    a.last_dr_bank_date = last_dr_bank_date,
    a.last_transaction_date = 
        CASE 
            WHEN last_cr_cust_date >= last_cr_bank_date AND last_cr_cust_date >= last_dr_cust_date AND last_cr_cust_date >= last_dr_bank_date THEN last_cr_cust_date
            WHEN last_cr_bank_date >= last_cr_cust_date AND last_cr_bank_date >= last_dr_cust_date AND last_cr_bank_date >= last_dr_bank_date THEN last_cr_bank_date
            WHEN last_dr_cust_date >= last_cr_cust_date AND last_dr_cust_date >= last_cr_bank_date AND last_dr_cust_date >= last_dr_bank_date THEN last_dr_cust_date
            ELSE last_dr_bank_date
        END,
    a.last_updated_date = sds_date

ON MATCH SET
    a.category = row.CATEGORY,
    a.open_actual_bal = toFloat(row.OPEN_ACTUAL_BAL),
    a.open_cleared_bal = toFloat(row.OPEN_CLEARED_BAL),
    a.online_actual_bal = toFloat(row.ONLINE_ACTUAL_BAL),
    a.online_cleared_bal = toFloat(row.ONLINE_CLEARED_BAL),
    a.working_balance = toFloat(row.WORKING_BALANCE),
    a.account_officer = row.ACCOUNT_OFFICER,
    a.opening_date = COALESCE(opening_date, a.opening_date),
    a.last_cr_cust_date = COALESCE(last_cr_cust_date, a.last_cr_cust_date),
    a.last_cr_bank_date = COALESCE(last_cr_bank_date, a.last_cr_bank_date),
    a.last_dr_cust_date = COALESCE(last_dr_cust_date, a.last_dr_cust_date),
    a.last_dr_bank_date = COALESCE(last_dr_bank_date, a.last_dr_bank_date),
    a.last_transaction_date = 
        CASE 
            WHEN last_cr_cust_date >= last_cr_bank_date AND last_cr_cust_date >= last_dr_cust_date AND last_cr_cust_date >= last_dr_bank_date THEN last_cr_cust_date
            WHEN last_cr_bank_date >= last_cr_cust_date AND last_cr_bank_date >= last_dr_cust_date AND last_cr_bank_date >= last_dr_bank_date THEN last_cr_bank_date
            WHEN last_dr_cust_date >= last_cr_cust_date AND last_dr_cust_date >= last_cr_bank_date AND last_dr_cust_date >= last_dr_bank_date THEN last_dr_cust_date
            ELSE last_dr_bank_date
        END,
    a.last_updated_date = COALESCE(sds_date, a.last_updated_date);



// -------------------------------
// Create or Update OWNS Relationships
// -------------------------------
MATCH (c:Customer), (a:Account)
WHERE c.customer_id IS NOT NULL
  AND a.customer_id IS NOT NULL
  AND c.customer_id = a.customer_id
MERGE (c)-[:OWNS]->(a);







// Migrate funds transfer data

CREATE INDEX ON :Transaction(transaction_id);
CREATE INDEX ON :Transaction(transaction_time);
CREATE INDEX ON :Transaction(channel);

CALL migrate.sql_server(
'
SELECT
    RECID,
    PAYMENT_DETAILS,
    TRANSACTION_TYPE,
    DEBIT_ACCT_NO,
    CREDIT_ACCT_NO,
    DEBIT_CUSTOMER,
    CREDIT_CUSTOMER,
    LOC_AMT_DEBITED,
    LOC_AMT_CREDITED,
    LOCAL_CHARGE_AMT,
    CONVERT(VARCHAR(8), DEBIT_VALUE_DATE, 112) AS DEBIT_VALUE_DATE,
    CONVERT(VARCHAR(8), PROCESSING_DATE, 112) AS PROCESSING_DATE,
    -- convert epoch ms to ISO 8601 (YYYY-MM-DDThh:mm:ss.mmm) using DATETIMEFROMPARTS(1970-01-01)
    CONVERT(varchar(23),
      DATEADD(ms,
        CONVERT(bigint, CREATION_TIME_DL) % 1000,
        DATEADD(second, CONVERT(bigint, CREATION_TIME_DL) / 1000, DATETIMEFROMPARTS(1970,1,1,0,0,0,0))
      ),
      126
    ) AS CREATION_TIME_ISO
FROM [BK_SDS].[dbo].[FBNK_FUNDS_TRANSFER] 
WHERE AUTH_DATE > '20250620'
',
{
    user: 'aiuser',
    password: 'AIuser123',
    host: '10.24.34.190',
    database: 'BK_SDS',
    Encrypt: 'no',
    TrustServerCertificate: 'yes',
    Driver: 'ODBC Driver 18 for SQL Server'
}
) YIELD row

MERGE (t:Transaction {transaction_id: row.RECID})
ON CREATE SET
    t.debit_account = row.DEBIT_ACCT_NO,
    t.credit_account = row.CREDIT_ACCT_NO,
    t.credit_customer =row.CREDIT_CUSTOMER,
    t.debit_customer = row.DEBIT_CUSTOMER,
    t.debit_amount = CASE WHEN row.LOC_AMT_DEBITED IS NOT NULL AND row.LOC_AMT_DEBITED <> '' THEN toFloat(row.LOC_AMT_DEBITED) ELSE NULL END,
    t.credit_amount = CASE WHEN row.LOC_AMT_CREDITED IS NOT NULL AND row.LOC_AMT_CREDITED <> '' THEN toFloat(row.LOC_AMT_CREDITED) ELSE NULL END,
    t.local_charge_amt = CASE WHEN row.LOCAL_CHARGE_AMT IS NOT NULL AND row.LOCAL_CHARGE_AMT <> '' THEN toFloat(row.LOCAL_CHARGE_AMT) ELSE NULL END,
    t.transaction_time = CASE WHEN row.CREATION_TIME_ISO IS NOT NULL AND row.CREATION_TIME_ISO <> '' THEN localDateTime(row.CREATION_TIME_ISO) ELSE NULL END,
    t.value_date = CASE
        WHEN row.DEBIT_VALUE_DATE IS NOT NULL AND row.DEBIT_VALUE_DATE <> '' THEN
            date(toString(
                substring(row.DEBIT_VALUE_DATE, 0, 4) + '-' +
                substring(row.DEBIT_VALUE_DATE, 4, 2) + '-' +
                substring(row.DEBIT_VALUE_DATE, 6, 2)
            ))
        ELSE NULL
    END,
    t.payment_details = row.PAYMENT_DETAILS,
    t.transaction_type = row.TRANSACTION_TYPE,
    t.processing_date = CASE
        WHEN row.PROCESSING_DATE IS NOT NULL AND row.PROCESSING_DATE <> '' THEN
            date(toString(
                substring(row.PROCESSING_DATE, 0, 4) + '-' +
                substring(row.PROCESSING_DATE, 4, 2) + '-' +
                substring(row.PROCESSING_DATE, 6, 2)
            ))
        ELSE NULL
    END
ON MATCH SET
    t.debit_amount = CASE WHEN row.LOC_AMT_DEBITED IS NOT NULL AND row.LOC_AMT_DEBITED <> '' THEN toFloat(row.LOC_AMT_DEBITED) ELSE t.debit_amount END,
    t.credit_amount = CASE WHEN row.LOC_AMT_CREDITED IS NOT NULL AND row.LOC_AMT_CREDITED <> '' THEN toFloat(row.LOC_AMT_CREDITED) ELSE t.credit_amount END,
    t.local_charge_amt = CASE WHEN row.LOCAL_CHARGE_AMT IS NOT NULL AND row.LOCAL_CHARGE_AMT <> '' THEN toFloat(row.LOCAL_CHARGE_AMT) ELSE t.local_charge_amt END,
    t.transaction_time = CASE WHEN row.CREATION_TIME_ISO IS NOT NULL AND row.CREATION_TIME_ISO <> '' THEN localDateTime(row.CREATION_TIME_ISO) ELSE t.transaction_time END,
    t.value_date = CASE
        WHEN row.DEBIT_VALUE_DATE IS NOT NULL AND row.DEBIT_VALUE_DATE <> '' THEN
            date(toString(
                substring(row.DEBIT_VALUE_DATE, 0, 4) + '-' +
                substring(row.DEBIT_VALUE_DATE, 4, 2) + '-' +
                substring(row.DEBIT_VALUE_DATE, 6, 2)
            ))
        ELSE t.value_date
    END,
    t.processing_date = CASE
        WHEN row.PROCESSING_DATE IS NOT NULL AND row.PROCESSING_DATE <> '' THEN
            date(toString(
                substring(row.PROCESSING_DATE, 0, 4) + '-' +
                substring(row.PROCESSING_DATE, 4, 2) + '-' +
                substring(row.PROCESSING_DATE, 6, 2)
            ))
        ELSE t.processing_date
    END;




// -------------------------------
// Create or Update SENT Relationships (Account -> Transaction)
// -------------------------------
MATCH (a:Account), (t:Transaction)
WHERE a.account_id = t.debit_account AND t.debit_account IS NOT NULL
MERGE (a)-[r:SENT]->(t)
ON CREATE SET
    r.timestamp = t.transaction_time,
    r.amount = t.debit_amount,
    r.transaction_id = t.transaction_id
ON MATCH SET
    r.timestamp = t.transaction_time,
    r.amount = t.debit_amount,
    r.transaction_id = t.transaction_id;

// -------------------------------
// Create or Update RECEIVED Relationships (Transaction -> Account)
// -------------------------------
MATCH (t:Transaction), (a:Account)
WHERE t.credit_account = a.account_id AND t.credit_account IS NOT NULL
MERGE (t)-[r:RECEIVED]->(a)
ON CREATE SET
    r.timestamp = t.transaction_time,
    r.amount = t.credit_amount,
    r.transaction_id = t.transaction_id
ON MATCH SET
    r.timestamp = t.transaction_time,
    r.amount = t.credit_amount,
    r.transaction_id = t.transaction_id;








// -------------------------------
// Helper functions for date processing
// -------------------------------

MATCH (t:Transaction)
WHERE t.processing_date = date('2025-08-27')
AND t.transaction_time IS NOT NULL
WITH t, substring(t.transaction_time, 11, 5) AS time_str
WHERE time_str =~ '^\\d{2}:\\d{2}$'  // Matches hh:mm format
WITH t, localTime(time_str) AS valid_time
RETURN t
ORDER BY t.processing_date DESC;



MATCH (t:Transaction)
WHERE t.transaction_time IS NOT NULL
WITH t, trim(toString(t.transaction_time)) AS tx_str
// Convert "YYYY-MM-DD" → "YYYY-MM-DDT00:00:00" and "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SS"
WITH t,
     CASE
         WHEN tx_str =~ '\\d{4}-\\d{2}-\\d{2}$' THEN tx_str + 'T00:00:00'
         WHEN tx_str =~ '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}' THEN replace(tx_str, ' ', 'T')
         ELSE NULL
     END AS cleaned_tx_str
WHERE cleaned_tx_str IS NOT NULL
SET t.transaction_time = localdatetime(cleaned_tx_str)
RETURN count(*) AS updated_transaction_time;



MATCH (t:Transaction)
WHERE t.processing_date =~ ".*"  // This filters nodes where the property is stored as string
RETURN t.transaction_id, t.processing_date
LIMIT 20;



//  Misceraneout


// TxMap indexes
CREATE INDEX ON :TxMap(TRANSACTION_TYPE);
CREATE INDEX ON :TxMap(CHANNEL);

// Alert index
CREATE INDEX ON :Alert(alert_id);