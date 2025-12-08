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
        
        # Read the Excel file
        try:
            df = pd.read_excel(excel_path, engine='openpyxl')
        except ImportError:
            raise HTTPException(
                status_code=500, 
                detail="openpyxl library is required to read Excel files. Please install it with: pip install openpyxl"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading Excel file: {str(e)}")
        
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
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading compliance data: {str(e)}")


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
        
        # Read the Excel file
        try:
            df = pd.read_excel(excel_path, engine='openpyxl')
        except ImportError:
            raise HTTPException(
                status_code=500, 
                detail="openpyxl library is required to read Excel files. Please install it with: pip install openpyxl"
            )
        except Exception as e:
            error_msg = f"Error reading Excel file at {excel_path}: {str(e)}"
            raise HTTPException(status_code=500, detail=error_msg)
        
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
        
        # Read the Excel file
        try:
            df = pd.read_excel(excel_path, engine='openpyxl')
        except ImportError:
            raise HTTPException(
                status_code=500, 
                detail="openpyxl library is required to read Excel files. Please install it with: pip install openpyxl"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading Excel file: {str(e)}")
        
        # Find the record by id (which is the index in our system)
        if record_id < 0 or record_id >= len(df):
            raise HTTPException(status_code=404, detail="Record not found")
        
        # Update the record - exclude 'id' and 'index' from updates
        for key, value in record_data.items():
            if key in df.columns and key not in ['id', 'index']:
                df.at[record_id, key] = value
        
        # Save back to Excel (drop 'id' column if it exists, as it's only for API use)
        df_to_save = df.drop(columns=['id'], errors='ignore')
        try:
            df_to_save.to_excel(excel_path, index=False, engine='openpyxl')
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
        
        # Read the Excel file
        try:
            df = pd.read_excel(excel_path, engine='openpyxl')
        except ImportError:
            raise HTTPException(
                status_code=500, 
                detail="openpyxl library is required to read Excel files. Please install it with: pip install openpyxl"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading Excel file: {str(e)}")
        
        # Create new row - only include columns that exist in the dataframe
        new_row = {}
        for col in df.columns:
            # Skip 'id' and 'index' columns as they're auto-generated
            if col not in ['id', 'index']:
                new_row[col] = record_data.get(col, None)
        
        # Append new row
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        
        # Calculate the new record's ID (it will be the last row index)
        new_record_id = len(df) - 1
        
        # Save back to Excel (drop 'id' column if it exists, as it's only for API use)
        df_to_save = df.drop(columns=['id'], errors='ignore')
        try:
            df_to_save.to_excel(excel_path, index=False, engine='openpyxl')
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
