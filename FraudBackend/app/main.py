"""Simple FastAPI application for testing."""

from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import pandas as pd
from pathlib import Path

# Create FastAPI application
app = FastAPI(
    title="Fraud Detection Backend (Test Mode)",
    description="Simple test API for fraud detection system",
    version="1.0.0-test",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple data models
class Transaction(BaseModel):
    id: str
    amount: float
    status: str
    timestamp: str

class Customer(BaseModel):
    id: str
    name: str
    risk_score: float
    status: str

class Alert(BaseModel):
    id: str
    type: str
    severity: str
    message: str
    timestamp: str

# Mock data storage
mock_transactions: List[Transaction] = []
mock_customers: List[Customer] = []
mock_alerts: List[Alert] = []

# Initialize some mock data
def init_mock_data():
    global mock_transactions, mock_customers, mock_alerts
    
    # Mock transactions
    for i in range(5):
        mock_transactions.append(Transaction(
            id=f"TXN{1000+i}",
            amount=round(random.uniform(100, 10000), 2),
            status=random.choice(["completed", "pending", "flagged"]),
            timestamp=datetime.now().isoformat()
        ))
    
    # Mock customers
    for i in range(5):
        mock_customers.append(Customer(
            id=f"CUST{100+i}",
            name=f"Customer {i+1}",
            risk_score=round(random.uniform(0, 100), 2),
            status=random.choice(["active", "suspicious", "blocked"])
        ))
    
    # Mock alerts
    for i in range(3):
        mock_alerts.append(Alert(
            id=f"ALERT{200+i}",
            type=random.choice(["suspicious_transaction", "unusual_pattern", "high_risk"]),
            severity=random.choice(["low", "medium", "high"]),
            message=f"Alert message {i+1}",
            timestamp=datetime.now().isoformat()
        ))

# Initialize mock data on startup
init_mock_data()


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Fraud Detection Backend API (Test Mode)",
        "version": "1.0.0-test",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "mode": "test",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "api": "healthy",
            "database": "mock",
            "websocket": "disabled"
        }
    }


# Metrics endpoints
@app.get("/api/v1/metrics")
async def get_metrics():
    """Get system metrics."""
    return {
        "total_transactions": len(mock_transactions),
        "total_customers": len(mock_customers),
        "total_alerts": len(mock_alerts),
        "flagged_transactions": len([t for t in mock_transactions if t.status == "flagged"]),
        "high_risk_customers": len([c for c in mock_customers if c.risk_score > 70]),
        "timestamp": datetime.now().isoformat()
    }


# Transaction endpoints
@app.get("/api/v1/transactions")
async def get_transactions(limit: int = 10):
    """Get all transactions."""
    return {
        "success": True,
        "data": mock_transactions[:limit],
        "total": len(mock_transactions)
    }


@app.get("/api/v1/transactions/{transaction_id}")
async def get_transaction(transaction_id: str):
    """Get a specific transaction."""
    transaction = next((t for t in mock_transactions if t.id == transaction_id), None)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {
        "success": True,
        "data": transaction
    }


# Customer endpoints
@app.get("/api/v1/customers")
async def get_customers(limit: int = 10):
    """Get all customers."""
    return {
        "success": True,
        "data": mock_customers[:limit],
        "total": len(mock_customers)
    }


@app.get("/api/v1/customers/{customer_id}")
async def get_customer(customer_id: str):
    """Get a specific customer."""
    customer = next((c for c in mock_customers if c.id == customer_id), None)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        "success": True,
        "data": customer
    }


# Alert endpoints
@app.get("/api/v1/alerts")
async def get_alerts(limit: int = 10):
    """Get all alerts."""
    return {
        "success": True,
        "data": mock_alerts[:limit],
        "total": len(mock_alerts)
    }


@app.get("/api/v1/alerts/{alert_id}")
async def get_alert(alert_id: str):
    """Get a specific alert."""
    alert = next((a for a in mock_alerts if a.id == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {
        "success": True,
        "data": alert
    }


# Test data generation endpoints
@app.post("/api/v1/test/generate-transaction")
async def generate_transaction():
    """Generate a new mock transaction."""
    new_transaction = Transaction(
        id=f"TXN{1000 + len(mock_transactions)}",
        amount=round(random.uniform(100, 10000), 2),
        status=random.choice(["completed", "pending", "flagged"]),
        timestamp=datetime.now().isoformat()
    )
    mock_transactions.append(new_transaction)
    return {
        "success": True,
        "message": "Transaction generated",
        "data": new_transaction
    }


@app.post("/api/v1/test/generate-alert")
async def generate_alert():
    """Generate a new mock alert."""
    new_alert = Alert(
        id=f"ALERT{200 + len(mock_alerts)}",
        type=random.choice(["suspicious_transaction", "unusual_pattern", "high_risk"]),
        severity=random.choice(["low", "medium", "high"]),
        message=f"Test alert generated at {datetime.now().strftime('%H:%M:%S')}",
        timestamp=datetime.now().isoformat()
    )
    mock_alerts.append(new_alert)
    return {
        "success": True,
        "message": "Alert generated",
        "data": new_alert
    }


@app.post("/api/v1/test/reset-data")
async def reset_data():
    """Reset all mock data."""
    init_mock_data()
    return {
        "success": True,
        "message": "All data has been reset",
        "timestamp": datetime.now().isoformat()
    }


# Account endpoints (simplified)
@app.get("/api/v1/accounts")
async def get_accounts():
    """Get mock accounts."""
    return {
        "success": True,
        "data": [
            {"id": "ACC001", "balance": 10000.00, "status": "active"},
            {"id": "ACC002", "balance": 25000.00, "status": "active"},
            {"id": "ACC003", "balance": 5000.00, "status": "flagged"}
        ],
        "total": 3
    }


# Compliance Register endpoints
# Define the data directory path - using absolute path as specified
DATA_DIR = Path(r"C:\Users\smutinda\Documents\DATA MANAGEMENT\2025\2025 Q4\FRAUD\Fraud_Detector\FraudBackend\app\data")
COMPLIANCE_FILE = DATA_DIR / "Compliance_Register.xlsx"

# Simple cache for combined dataframe (cleared on updates)
_cached_df = None
_cached_sheet_map = None
_cache_timestamp = None

def read_all_sheets_from_excel(excel_path: Path, use_cache: bool = True):
    """Read all sheets from Excel file and combine them into one DataFrame."""
    global _cached_df, _cached_sheet_map, _cache_timestamp
    
    # Use cache if available and file hasn't been modified
    if use_cache and _cached_df is not None and _cached_sheet_map is not None:
        if excel_path.exists():
            file_mtime = excel_path.stat().st_mtime
            if _cache_timestamp is not None and file_mtime <= _cache_timestamp:
                return _cached_df.copy(), _cached_sheet_map.copy()
    
    try:
        # Read all sheets (limit to first 5 non-empty sheets as requested)
        excel_file = pd.ExcelFile(excel_path, engine='openpyxl')
        sheet_names = excel_file.sheet_names
        
        all_dataframes = []
        sheet_data_map = {}  # Store original sheet data for writing back
        
        non_empty_count = 0
        for sheet_name in sheet_names:
            try:
                df = pd.read_excel(excel_path, sheet_name=sheet_name, engine='openpyxl')
                
                # Skip empty sheets
                if df.empty:
                    sheet_data_map[sheet_name] = df
                    continue
                
                # Respect the limit of 5 non-empty sheets
                if non_empty_count >= 5:
                    sheet_data_map[sheet_name] = df
                    continue
                non_empty_count += 1
                
                # Store original sheet data
                sheet_data_map[sheet_name] = df.copy()
                
                # Add a column to track the source sheet (department name)
                # Only add if it doesn't already exist
                if 'SOURCE_SHEET' not in df.columns:
                    df['SOURCE_SHEET'] = sheet_name
                
                # Also try to set department column if it doesn't exist or is empty
                dept_col = None
                for col in df.columns:
                    if 'department' in col.lower() or 'responsible' in col.lower():
                        dept_col = col
                        break
                
                # If department column exists but has empty values, fill with sheet name
                if dept_col:
                    df[dept_col] = df[dept_col].fillna(sheet_name)
                elif 'RESPONSIBLE DEPARTMENT' not in df.columns and 'Responsible Department' not in df.columns:
                    # Add department column if it doesn't exist
                    df['RESPONSIBLE DEPARTMENT'] = sheet_name
                
                all_dataframes.append(df)
            except Exception as e:
                # Skip sheets that can't be read
                print(f"Warning: Could not read sheet '{sheet_name}': {str(e)}")
                sheet_data_map[sheet_name] = pd.DataFrame()
                continue
        
        if not all_dataframes:
            return pd.DataFrame(), sheet_data_map
        
        # Combine all dataframes
        combined_df = pd.concat(all_dataframes, ignore_index=True)
        
        # Cache the result
        _cached_df = combined_df.copy()
        _cached_sheet_map = sheet_data_map.copy()
        _cache_timestamp = excel_path.stat().st_mtime if excel_path.exists() else None
        
        return combined_df, sheet_data_map
        
    except Exception as e:
        import traceback
        error_detail = f"Error reading Excel sheets: {str(e)}\nTraceback: {traceback.format_exc()}"
        raise Exception(error_detail)

def save_to_all_sheets(excel_path: Path, combined_df: pd.DataFrame, sheet_data_map: Dict[str, pd.DataFrame]):
    """Save combined dataframe back to individual sheets based on SOURCE_SHEET column."""
    try:
        from openpyxl import load_workbook
        
        # Load the workbook
        wb = load_workbook(excel_path)
        
        # Get all sheet names from the workbook
        existing_sheets = wb.sheetnames.copy()
        
        # Group records by source sheet
        if 'SOURCE_SHEET' in combined_df.columns:
            # Get unique sheet names from the combined dataframe
            unique_sheets = combined_df['SOURCE_SHEET'].unique().tolist()
            
            # Process each sheet
            for sheet_name in unique_sheets:
                # Get records for this sheet
                sheet_df = combined_df[combined_df['SOURCE_SHEET'] == sheet_name].copy()
                
                # Drop SOURCE_SHEET and 'id' columns before saving
                sheet_df = sheet_df.drop(columns=['SOURCE_SHEET', 'id'], errors='ignore')
                
                # Remove the sheet if it exists
                if sheet_name in wb.sheetnames:
                    wb.remove(wb[sheet_name])
                
                # Create new sheet
                ws = wb.create_sheet(sheet_name)
                
                # Write headers
                if not sheet_df.empty:
                    headers = list(sheet_df.columns)
                    ws.append(headers)
                    
                    # Write data
                    for _, row in sheet_df.iterrows():
                        row_data = []
                        for col in headers:
                            val = row[col]
                            if pd.isna(val):
                                row_data.append(None)
                            else:
                                row_data.append(val)
                        ws.append(row_data)
                else:
                    # Create empty sheet with headers from original
                    if sheet_name in sheet_data_map and not sheet_data_map[sheet_name].empty:
                        headers = list(sheet_data_map[sheet_name].columns)
                        ws.append(headers)
        
        # Save the workbook
        wb.save(excel_path)
        
        # Clear cache after saving
        global _cached_df, _cached_sheet_map, _cache_timestamp
        _cached_df = None
        _cached_sheet_map = None
        _cache_timestamp = None
        
    except Exception as e:
        import traceback
        print(f"Error saving to sheets: {str(e)}\nTraceback: {traceback.format_exc()}")
        # Fallback: save to first sheet only
        try:
            df_to_save = combined_df.drop(columns=['SOURCE_SHEET', 'id'], errors='ignore')
            with pd.ExcelWriter(excel_path, engine='openpyxl', mode='w') as writer:
                df_to_save.to_excel(writer, index=False, sheet_name='Sheet1')
        except Exception as e2:
            raise Exception(f"Failed to save Excel file: {str(e2)}")

@app.get("/api/v1/compliance/debug-path")
async def get_compliance_debug_path():
    """Debug endpoint to check the file path being used."""
    return {
        "data_dir": str(DATA_DIR),
        "compliance_file": str(COMPLIANCE_FILE),
        "file_exists": COMPLIANCE_FILE.exists(),
        "data_dir_exists": DATA_DIR.exists()
    }

@app.get("/api/v1/compliance/stats")
async def get_compliance_stats():
    """Get statistics from the Compliance Register Excel file."""
    try:
        # Use the absolute path to the Excel file
        excel_path = COMPLIANCE_FILE
        
        if not excel_path.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Compliance Register file not found at: {excel_path}. Please ensure the file exists at this location."
            )
        
        # Read all sheets from the Excel file
        try:
            df, _ = read_all_sheets_from_excel(excel_path)
        except ImportError as e:
            raise HTTPException(
                status_code=500, 
                detail=f"openpyxl library is required to read Excel files. Please install it with: pip install openpyxl. Error: {str(e)}"
            )
        except FileNotFoundError:
            raise HTTPException(
                status_code=404,
                detail=f"Excel file not found at: {excel_path}"
            )
        except Exception as e:
            import traceback
            error_detail = f"Error reading Excel file: {str(e)}\nFile path: {excel_path}\nTraceback: {traceback.format_exc()}"
            raise HTTPException(status_code=500, detail=error_detail)
        
        # Check if dataframe is empty
        if df.empty:
            return {
                "success": True,
                "data": {
                    "total_records": 0,
                    "columns": [],
                    "summary": {
                        "total_entries": 0,
                        "data_quality": {
                            "complete_records": 0,
                            "incomplete_records": 0,
                            "completion_rate": "0%"
                        }
                    },
                    "timestamp": datetime.now().isoformat()
                }
            }
        
        # Calculate statistics
        total_records = len(df)
        
        # Get unique values for categorical columns (adjust column names based on your actual Excel file)
        stats = {
            "total_records": total_records,
            "columns": list(df.columns),
            "summary": {
                "total_entries": total_records,
                "data_quality": {
                    "complete_records": int(df.dropna().shape[0]),
                    "incomplete_records": int(df.shape[0] - df.dropna().shape[0]),
                    "completion_rate": f"{(df.dropna().shape[0] / df.shape[0] * 100):.1f}%"
                }
            },
            "timestamp": datetime.now().isoformat()
        }
        
        # Add column-specific statistics
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            stats["numeric_summary"] = {}
            for col in numeric_cols[:5]:  # Limit to first 5 numeric columns
                stats["numeric_summary"][col] = {
                    "mean": float(df[col].mean()) if not df[col].isna().all() else 0,
                    "min": float(df[col].min()) if not df[col].isna().all() else 0,
                    "max": float(df[col].max()) if not df[col].isna().all() else 0
                }
        
        return {
            "success": True,
            "data": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Error reading compliance data: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@app.get("/api/v1/compliance/records")
async def get_compliance_records(
    limit: int = 1000, 
    offset: int = 0,
    department: Optional[str] = None,
    status: Optional[str] = None
):
    """Get records from the Compliance Register with optional filters."""
    try:
        # Use the absolute path to the Excel file
        excel_path = COMPLIANCE_FILE
        
        if not excel_path.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Compliance Register file not found at: {excel_path}. Please ensure the file exists at this location."
            )
        
        # Read all sheets from the Excel file
        try:
            df, _ = read_all_sheets_from_excel(excel_path)
        except ImportError as e:
            raise HTTPException(
                status_code=500, 
                detail=f"openpyxl library is required to read Excel files. Please install it with: pip install openpyxl. Error: {str(e)}"
            )
        except FileNotFoundError:
            raise HTTPException(
                status_code=404,
                detail=f"Excel file not found at: {excel_path}"
            )
        except Exception as e:
            import traceback
            error_detail = f"Error reading Excel file: {str(e)}\nFile path: {excel_path}\nTraceback: {traceback.format_exc()}"
            raise HTTPException(status_code=500, detail=error_detail)
        
        # Check if dataframe is empty
        if df.empty:
            return {
                "success": True,
                "data": [],
                "total": 0,
                "limit": limit,
                "offset": offset
            }
        
        # Store original index as 'id' for API use (overwrite if 'id' column exists)
        df['id'] = df.index
        
        # Apply filters
        if department:
            # Try to find department column (case-insensitive)
            dept_col = None
            for col in df.columns:
                if 'department' in col.lower() or 'responsible' in col.lower():
                    dept_col = col
                    break
            if dept_col:
                try:
                    df = df[df[dept_col].astype(str).str.contains(department, case=False, na=False)]
                except Exception as e:
                    # If filtering fails, continue without filter
                    pass
        
        if status:
            # Try to find status column (case-insensitive)
            status_col = None
            for col in df.columns:
                if 'status' in col.lower() or 'compliance' in col.lower():
                    status_col = col
                    break
            if status_col:
                try:
                    df = df[df[status_col].astype(str).str.contains(status, case=False, na=False)]
                except Exception as e:
                    # If filtering fails, continue without filter
                    pass
        
        # Reset index for display, but keep 'id' as original row number
        df = df.reset_index(drop=True)
        
        # Handle empty dataframe
        if len(df) == 0:
            return {
                "success": True,
                "data": [],
                "total": 0,
                "limit": limit,
                "offset": offset
            }
        
        # Ensure offset is within bounds
        offset = max(0, min(offset, len(df)))
        
        # Convert to records
        end_idx = min(offset + limit, len(df))
        records = df.iloc[offset:end_idx].to_dict('records')
        
        # Convert NaN to None for JSON serialization
        for record in records:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
        
        return {
            "success": True,
            "data": records,
            "total": len(df),
            "limit": limit,
            "offset": offset
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_detail = f"Error reading compliance records: {str(e)}"
        raise HTTPException(status_code=500, detail=error_detail)


@app.put("/api/v1/compliance/records/{record_id}")
async def update_compliance_record(record_id: int, record_data: Dict[str, Any] = Body(...)):
    """Update a compliance record."""
    try:
        # Use the absolute path to the Excel file
        excel_path = COMPLIANCE_FILE
        
        if not excel_path.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Compliance Register file not found at: {excel_path}. Please ensure the file exists at this location."
            )
        
        # Read all sheets from the Excel file
        try:
            df, sheet_data_map = read_all_sheets_from_excel(excel_path)
        except ImportError as e:
            raise HTTPException(
                status_code=500, 
                detail=f"openpyxl library is required to read Excel files. Please install it with: pip install openpyxl. Error: {str(e)}"
            )
        except FileNotFoundError:
            raise HTTPException(
                status_code=404,
                detail=f"Excel file not found at: {excel_path}"
            )
        except Exception as e:
            import traceback
            error_detail = f"Error reading Excel file: {str(e)}\nFile path: {excel_path}\nTraceback: {traceback.format_exc()}"
            raise HTTPException(status_code=500, detail=error_detail)
        
        # Check if dataframe is empty
        if df.empty:
            raise HTTPException(status_code=404, detail="No records found in Excel file")
        
        # Store original index as 'id' for API use
        df['id'] = df.index
        
        # Find the record by id (which is the index in our system)
        if record_id < 0 or record_id >= len(df):
            raise HTTPException(status_code=404, detail="Record not found")
        
        # Update the record - exclude 'id', 'index', and 'SOURCE_SHEET' from updates
        for key, value in record_data.items():
            if key in df.columns and key not in ['id', 'index', 'SOURCE_SHEET']:
                df.at[record_id, key] = value
        
        # Save back to all sheets
        try:
            save_to_all_sheets(excel_path, df, sheet_data_map)
        except ImportError:
            raise HTTPException(
                status_code=500, 
                detail="openpyxl library is required to write Excel files. Please install it with: pip install openpyxl"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error writing Excel file: {str(e)}")
        
        # Return updated record
        updated_record = df.iloc[record_id].to_dict()
        updated_record['id'] = record_id
        for key, value in updated_record.items():
            if pd.isna(value):
                updated_record[key] = None
        
        return {
            "success": True,
            "message": "Record updated successfully",
            "data": updated_record
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating compliance record: {str(e)}")


@app.post("/api/v1/compliance/records")
async def create_compliance_record(record_data: Dict[str, Any] = Body(...)):
    """Add a new compliance record."""
    try:
        # Use the absolute path to the Excel file
        excel_path = COMPLIANCE_FILE
        
        if not excel_path.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Compliance Register file not found at: {excel_path}. Please ensure the file exists at this location."
            )
        
        # Read all sheets from the Excel file
        try:
            df, sheet_data_map = read_all_sheets_from_excel(excel_path)
        except ImportError as e:
            raise HTTPException(
                status_code=500, 
                detail=f"openpyxl library is required to read Excel files. Please install it with: pip install openpyxl. Error: {str(e)}"
            )
        except FileNotFoundError:
            raise HTTPException(
                status_code=404,
                detail=f"Excel file not found at: {excel_path}"
            )
        except Exception as e:
            import traceback
            error_detail = f"Error reading Excel file: {str(e)}\nFile path: {excel_path}\nTraceback: {traceback.format_exc()}"
            raise HTTPException(status_code=500, detail=error_detail)
        
        # Determine which sheet to add the record to based on department
        target_sheet = None
        dept_col = None
        for col in df.columns:
            if 'department' in col.lower() or 'responsible' in col.lower():
                dept_col = col
                break
        
        if dept_col and dept_col in record_data and record_data[dept_col]:
            target_sheet = str(record_data[dept_col]).strip()
        elif 'SOURCE_SHEET' in df.columns and len(df) > 0:
            # Use the first sheet as default
            target_sheet = df['SOURCE_SHEET'].iloc[0] if 'SOURCE_SHEET' in df.columns else None
        else:
            # Get first sheet name from Excel file
            try:
                excel_file = pd.ExcelFile(excel_path, engine='openpyxl')
                target_sheet = excel_file.sheet_names[0] if excel_file.sheet_names else 'Sheet1'
            except:
                target_sheet = 'Sheet1'
        
        # Create new row - only include columns that exist in the dataframe
        new_row = {}
        for col in df.columns:
            # Skip 'id', 'index', and 'SOURCE_SHEET' columns as they're auto-generated
            if col not in ['id', 'index', 'SOURCE_SHEET']:
                new_row[col] = record_data.get(col, None)
        
        # Set SOURCE_SHEET for the new record
        new_row['SOURCE_SHEET'] = target_sheet
        
        # Append new row
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        
        # Calculate the new record's ID (it will be the last row index)
        new_record_id = len(df) - 1
        df.at[new_record_id, 'id'] = new_record_id
        
        # Save back to all sheets
        try:
            save_to_all_sheets(excel_path, df, sheet_data_map)
        except ImportError:
            raise HTTPException(
                status_code=500, 
                detail="openpyxl library is required to write Excel files. Please install it with: pip install openpyxl"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error writing Excel file: {str(e)}")
        
        # Return new record with the correct ID
        new_record = df.iloc[-1].to_dict()
        new_record['id'] = new_record_id
        for key, value in new_record.items():
            if pd.isna(value):
                new_record[key] = None
        
        return {
            "success": True,
            "message": "Record created successfully",
            "data": new_record
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating compliance record: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
