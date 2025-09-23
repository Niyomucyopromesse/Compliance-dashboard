# JSON Extraction Methods Guide

This guide explains the different approaches for extracting useful information from nested JSON data, specifically focusing on the `payload_ARRAY_Address` field and other nested arrays.

## Problem Statement

The original data structure contains deeply nested arrays like:
```json
{
  "payload_ARRAY_Address": [
    {
      "SUB_ARRAY_Address": [
        {"Address": "KIGALI-RWANDA"}
      ]
    }
  ]
}
```

The goal is to extract the actual address values ("KIGALI-RWANDA") instead of storing the entire JSON structure.

## Method 1: Enhanced Flattening (Recommended for Database Storage)

### Overview
This method flattens the JSON structure while intelligently extracting meaningful values from nested arrays.

### Key Features
- **Special handling for address arrays**: Properly navigates the `SUB_ARRAY_Address` structure
- **Smart array processing**: Extracts meaningful string values from complex arrays
- **Fallback handling**: Converts complex objects to JSON strings when needed
- **Consistent output**: All arrays are converted to semicolon-separated strings

### Usage
```python
# In main function
processing_method = "flatten"
relevant_data = extract_relevant(value, entity_name, method=processing_method)
```

### Output Example
```json
{
  "payload_ARRAY_Address": "KIGALI-RWANDA; 123 Main Street, Kigali; P.O. Box 456, Kigali",
  "payload_ARRAY_Phone_D_1": "+250788123456; +250788789012",
  "payload_ARRAY_EmploymentStatus": "EMPLOYED; TechCorp"
}
```

### Advantages
- ✅ Perfect for database storage (flat structure)
- ✅ Easy to query and analyze
- ✅ Consistent format across all arrays
- ✅ Handles edge cases gracefully

### Disadvantages
- ❌ Loses some structural information
- ❌ May not preserve all relationships

## Method 2: Specific Fields Extraction

### Overview
This method directly accesses specific fields without flattening the entire structure.

### Key Features
- **Targeted extraction**: Only extracts predefined fields
- **Direct navigation**: Uses `.get()` methods to access nested data
- **Custom array processing**: Special logic for each array type
- **Performance optimized**: No unnecessary flattening

### Usage
```python
processing_method = "specific"
relevant_data = extract_relevant(value, entity_name, method=processing_method)
```

### Output Example
```json
{
  "eventId": "evt_12345",
  "payload_recId": "CUST001",
  "payload_ARRAY_Address": "KIGALI-RWANDA; 123 Main Street, Kigali",
  "payload_GivenNames": "John",
  "payload_FamilyName": "Doe"
}
```

### Advantages
- ✅ Fast and efficient
- ✅ Only extracts needed fields
- ✅ Maintains field names from original structure
- ✅ Good for specific use cases

### Disadvantages
- ❌ Requires manual field mapping
- ❌ Less flexible for new fields
- ❌ Still flattens arrays to strings

## Method 3: Nested Structure Preservation

### Overview
This method preserves some nested structure while extracting key information.

### Key Features
- **Hierarchical output**: Maintains logical groupings
- **Summary fields**: Creates high-level summaries
- **Array preservation**: Keeps arrays as lists when beneficial
- **Relationship maintenance**: Preserves data relationships

### Usage
```python
processing_method = "nested"
relevant_data = extract_relevant(value, entity_name, method=processing_method)
```

### Output Example
```json
{
  "eventId": "evt_12345",
  "entityName": "FBNK.CUSTOMER",
  "payload_summary": {
    "customer_id": "CUST001",
    "name": "John Doe",
    "customer_type": "INDIVIDUAL",
    "risk_status": "LOW"
  },
  "addresses": ["KIGALI-RWANDA", "123 Main Street, Kigali"],
  "phone_numbers": ["+250788123456", "+250788789012"],
  "employment_status": ["EMPLOYED", "TechCorp"]
}
```

### Advantages
- ✅ Preserves data relationships
- ✅ Easy to understand structure
- ✅ Good for analytics and reporting
- ✅ Maintains array format where beneficial

### Disadvantages
- ❌ Not suitable for flat database storage
- ❌ More complex to query
- ❌ Larger output size

## Alternative Approaches Without Flattening

### 1. JSON Path Queries
Instead of flattening, use JSON path expressions to extract specific values:

```python
import jsonpath_ng as jsonpath

# Extract all addresses
addresses = jsonpath.parse('$.payload.ARRAY_Address[*].SUB_ARRAY_Address[*].Address').find(data)
address_list = [match.value for match in addresses]
```

### 2. Streaming Processing
Process the data as it comes without storing the full structure:

```python
def process_streaming_data(data_stream):
    for record in data_stream:
        # Extract only what you need immediately
        customer_id = record.get('payload', {}).get('recId')
        addresses = extract_addresses(record.get('payload', {}).get('ARRAY_Address', []))
        
        # Process and discard
        yield process_customer(customer_id, addresses)
```

### 3. Schema-Based Extraction
Define schemas for different data types and extract accordingly:

```python
CUSTOMER_SCHEMA = {
    'basic_info': ['recId', 'GivenNames', 'FamilyName'],
    'addresses': 'ARRAY_Address',
    'contacts': 'ARRAY_Phone_D_1'
}

def extract_by_schema(data, schema):
    result = {}
    for field_type, fields in schema.items():
        if isinstance(fields, list):
            result[field_type] = {field: data.get(field) for field in fields}
        else:
            result[field_type] = extract_special_field(data, fields)
    return result
```

### 4. Event-Driven Processing
Process data based on events rather than structure:

```python
def handle_customer_event(event_data):
    event_type = event_data.get('context', {}).get('operation')
    
    if event_type == 'CREATE':
        return extract_new_customer_data(event_data)
    elif event_type == 'UPDATE':
        return extract_updated_customer_data(event_data)
    elif event_type == 'DELETE':
        return extract_deletion_data(event_data)
```

## Recommendations

### For Database Storage
Use **Method 1 (Enhanced Flattening)** because:
- Creates flat tables easily
- Consistent format for all records
- Good for SQL queries and analytics

### For Real-time Processing
Use **Method 2 (Specific Fields)** because:
- Fastest processing
- Minimal memory usage
- Good for streaming applications

### For Analytics and Reporting
Use **Method 3 (Nested Structure)** because:
- Preserves data relationships
- Better for complex analysis
- More intuitive for business users

### For API Responses
Consider **JSON Path Queries** because:
- Flexible extraction
- No data transformation
- Maintains original structure

## Implementation Tips

1. **Choose the right method** based on your use case
2. **Test with real data** to ensure proper extraction
3. **Handle edge cases** like empty arrays and malformed data
4. **Monitor performance** especially for large datasets
5. **Document your choice** for team consistency

## Testing

Run the test script to see all methods in action:
```bash
python test_extraction_methods.py
```

This will show you the output of each method with sample data and help you choose the best approach for your specific needs. 