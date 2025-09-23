# Date Conversion Functionality

This document describes the date conversion functionality added to the T24_Kafka.py file.

## Overview

The T24_Kafka.py file now includes automatic date conversion for various date fields in the T24 banking data. This ensures that date fields are properly formatted for downstream processing and analytics.

## Date Fields Supported

The following date fields are automatically converted:

### Funds Transfer Fields
- **DEBIT_VALUE_DATE**: Converts from YYYYMMDD format (e.g., "20250826") to YYYY-MM-DD format (e.g., "2025-08-26")
- **PROCESSING_DATE**: Converts from YYYYMMDD format (e.g., "20250826") to YYYY-MM-DD format (e.g., "2025-08-26")
- **SDS_DATE**: Converts from milliseconds timestamp to YYYY-MM-DD HH:MM:SS format

### Customer Fields
- **DATE_OF_BIRTH**: Converts from YYYYMMDD format (e.g., "19900515") to YYYY-MM-DD format (e.g., "1990-05-15")
- **CUSTOMER_SINCE**: Converts from YYYYMMDD format (e.g., "20200101") to YYYY-MM-DD format (e.g., "2020-01-01")
- **SDS_DATE**: Converts from milliseconds timestamp to YYYY-MM-DD HH:MM:SS format

## Configuration

Date field configurations are defined in the `DATE_FIELDS` dictionary:

```python
DATE_FIELDS = {
    "DEBIT_VALUE_DATE": "%Y%m%d",  # Format: 20250826
    "PROCESSING_DATE": "%Y%m%d",   # Format: 20250826
    "DATE_OF_BIRTH": "%Y%m%d",     # Format: YYYYMMDD
    "CUSTOMER_SINCE": "%Y%m%d",    # Format: YYYYMMDD
    "SDS_DATE": "timestamp_ms"     # Timestamp in milliseconds
}
```

## How It Works

1. **Date String Conversion**: For fields with YYYYMMDD format, the system parses the string and converts it to YYYY-MM-DD format
2. **Timestamp Conversion**: For SDS_DATE fields (milliseconds timestamp), the system converts to YYYY-MM-DD HH:MM:SS format
3. **Error Handling**: If conversion fails, the original value is preserved and a warning is logged

## Sample Data Transformation

### Before Conversion (Original Data)
```
DEBIT_VALUE_DATE: 20250826
PROCESSING_DATE: 20250826
DATE_OF_BIRTH: 19900515
CUSTOMER_SINCE: 20200101
SDS_DATE: 1756211632723
```

### After Conversion (Processed Data)
```
DEBIT_VALUE_DATE: 2025-08-26
PROCESSING_DATE: 2025-08-26
DATE_OF_BIRTH: 1990-05-15
CUSTOMER_SINCE: 2020-01-01
SDS_DATE: 2025-01-26 12:33:52
```

## Testing

### Test the Date Conversion
Run the standalone test script:
```bash
python test_date_conversion.py
```

### Test with Main Application
Run the main application in test mode:
```bash
python T24_Kafka.py --test
```

## Integration

The date conversion is automatically applied in the `process_message` function:

```python
def process_message(msg, messages_batch):
    # ... existing code ...
    
    # Apply mapping to rename keys
    mapped_value = {field_mapping[k]: v for k, v in flattened_value.items() if k in field_mapping}
    
    # Convert date fields to proper format
    mapped_value = convert_date_fields(mapped_value)
    
    # ... rest of the function ...
```

## Benefits

1. **Standardized Date Format**: All date fields are converted to ISO 8601 format (YYYY-MM-DD)
2. **Improved Analytics**: Proper date formatting enables better data analysis and reporting
3. **Database Compatibility**: Standard date formats work better with most database systems
4. **Error Resilience**: Failed conversions don't break the data pipeline

## Error Handling

- Invalid date formats are logged as warnings
- Original values are preserved if conversion fails
- The system continues processing other fields and messages

## Future Enhancements

Potential improvements could include:
- Support for additional date formats
- Timezone handling for timestamp conversions
- Configurable output date formats
- Date validation and range checking 