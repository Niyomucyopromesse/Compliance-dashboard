"""Test script for compliance service"""
import sys
sys.path.insert(0, 'src')

try:
    from app.services.compliance_service import compliance_service
    
    print("=" * 50)
    print("Testing Compliance Service")
    print("=" * 50)
    
    # Test getting overview
    print("\n1. Testing get_overview()...")
    overview = compliance_service.get_overview()
    print(f"   ✓ Total items: {overview.total_items}")
    print(f"   ✓ Compliant: {overview.compliant}")
    print(f"   ✓ Non-compliant: {overview.non_compliant}")
    print(f"   ✓ Pending: {overview.pending}")
    print(f"   ✓ Compliance percentage: {overview.compliance_percentage}%")
    print(f"   ✓ Departments: {len(overview.departments)}")
    
    # Test getting all records
    print("\n2. Testing get_all_records()...")
    records = compliance_service.get_all_records()
    print(f"   ✓ Retrieved {len(records)} records")
    if records:
        print(f"   ✓ First record ID: {records[0].id}")
        print(f"   ✓ First record department: {records[0].responsible_department}")
    
    # Test getting a specific record
    if records:
        print("\n3. Testing get_record()...")
        record = compliance_service.get_record(0)
        if record:
            print(f"   ✓ Retrieved record {record.id}")
            print(f"   ✓ Status: {record.compliance_status}")
    
    print("\n" + "=" * 50)
    print("All tests passed successfully! ✓")
    print("=" * 50)
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

