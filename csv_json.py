import csv

# Read the CSV file and convert to dictionary
def convert_csv_to_dict(csv_file_path):
    txmap = {}
    
    with open(csv_file_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            transaction_type = row['TRANSACTION_TYPE'].strip()
            transaction_description = row['TRANSACTION_DESCRIPTION'].strip()
            channel = row['CHANNEL'].strip()
            
            # Skip empty transaction types
            if not transaction_type:
                continue
                
            txmap[transaction_type] = {
                "CHANNEL": channel,
                "TRANSACTION_DESCRIPTION": transaction_description
            }
    
    return txmap

# Convert the CSV to dictionary
csv_file_path = r"C:\Users\htwahirwa\Desktop\TxMap.csv"
TXMAP = convert_csv_to_dict(csv_file_path)

# Print the dictionary in the requested format
print("# Hardcoded TxMap (TRANSACTION_TYPE → {CHANNEL, TRANSACTION_DESCRIPTION})")
print("TXMAP = {")

for transaction_type, data in sorted(TXMAP.items()):
    channel = data["CHANNEL"]
    description = data["TRANSACTION_DESCRIPTION"]
    print(f'    "{transaction_type}": {{"CHANNEL": "{channel}", "TRANSACTION_DESCRIPTION": "{description}"}},')

print("}")

# Also save to a Python file for easy import
with open("txmap_dict.py", "w", encoding="utf-8") as f:
    f.write("# Hardcoded TxMap (TRANSACTION_TYPE → {CHANNEL, TRANSACTION_DESCRIPTION})\n")
    f.write("TXMAP = {\n")
    
    for transaction_type, data in sorted(TXMAP.items()):
        channel = data["CHANNEL"]
        description = data["TRANSACTION_DESCRIPTION"]
        f.write(f'    "{transaction_type}": {{"CHANNEL": "{channel}", "TRANSACTION_DESCRIPTION": "{description}"}},\n')
    
    f.write("}\n")

print(f"\nDictionary created with {len(TXMAP)} entries")
print("Saved to 'txmap_dict.py' for easy import")
