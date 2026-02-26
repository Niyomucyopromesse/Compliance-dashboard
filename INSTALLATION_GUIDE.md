# Installation Guide - Compliance Register Application

## Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- pip (Python package installer)
- npm (Node package manager)

## Step-by-Step Installation

### Step 1: Install Backend Dependencies

1. Open PowerShell or Command Prompt as Administrator

2. Navigate to the backend directory:
```powershell
cd "C:\Users\smutinda\Documents\DATA MANAGEMENT\2025\2025 Q4\FRAUD\Fraud_Detector\FraudBackend"
```

3. (Optional) Activate virtual environment if you want to use one:
```powershell
.\fraud\Scripts\Activate.ps1
```

4. Install required Python packages:
```powershell
pip install fastapi==0.104.1 uvicorn[standard]==0.24.0 pandas==2.1.4 openpyxl==3.1.2 pydantic==2.5.0 pydantic-settings==2.1.0 structlog==23.2.0 python-dotenv==1.0.0
```

5. Test the compliance service:
```powershell
python test_compliance.py
```

You should see output like:
```
==================================================
Testing Compliance Service
==================================================

1. Testing get_overview()...
   ✓ Total items: XX
   ✓ Compliant: XX
   ✓ Non-compliant: XX
   ✓ Pending: XX
   ✓ Compliance percentage: XX%
   ✓ Departments: X

2. Testing get_all_records()...
   ✓ Retrieved XX records
   ...

All tests passed successfully! ✓
```

### Step 2: Start Backend Server

1. From the FraudBackend directory, run:
```powershell
cd src
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or simply double-click `start.bat` in the FraudBackend folder.

2. Verify the backend is running by opening a browser to:
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

### Step 3: Install Frontend Dependencies

1. Open a new PowerShell window

2. Navigate to the frontend directory:
```powershell
cd "C:\Users\smutinda\Documents\DATA MANAGEMENT\2025\2025 Q4\FRAUD\Fraud_Detector\FraudFrontend"
```

3. Install Node.js dependencies:
```powershell
npm install
```

This will install React, Vite, TypeScript, Tailwind CSS, and other dependencies.

### Step 4: Start Frontend Server

1. From the FraudFrontend directory, run:
```powershell
npm run dev
```

Or simply double-click `start.bat` in the FraudFrontend folder.

2. Open your browser to: http://localhost:5173

You should now see the Compliance Register application!

## Verifying Everything Works

### Backend Verification

1. Open http://localhost:8000/docs in your browser
2. Try the GET /api/v1/compliance/overview endpoint
3. You should see JSON response with compliance statistics

### Frontend Verification

1. Open http://localhost:5173 in your browser
2. You should see the Overview page with:
   - Total compliance statistics
   - Global compliance percentage bar
   - Department breakdown with individual compliance levels
3. Click "Details" in the sidebar
4. You should see a table with all compliance records
5. Try editing a record by clicking "Edit"
6. Try adding a new record by clicking "Add New Record"

## Troubleshooting

### Backend Issues

**Error: "No module named 'pandas'"**
```powershell
pip install pandas openpyxl
```

**Error: "No module named 'fastapi'"**
```powershell
pip install fastapi uvicorn
```

**Error: "Port 8000 already in use"**
- Close any other applications using port 8000
- Or change the port: `python -m uvicorn app.main:app --reload --port 8001`

**Error: "Excel file not found"**
- Ensure `Compliance_Register.xlsx` exists in `FraudBackend/src/app/data/`
- Check the file is not open in Excel

### Frontend Issues

**Error: "npm: command not found"**
- Install Node.js from https://nodejs.org/

**Error: "Port 5173 already in use"**
- The Vite dev server will automatically try the next available port (5174, 5175, etc.)

**Error: "Cannot connect to backend"**
- Ensure the backend server is running on port 8000
- Check CORS settings if accessing from a different domain

## Daily Usage

### Starting the Application

1. **Start Backend** (First):
   - Navigate to `FraudBackend` folder
   - Double-click `start.bat` OR run:
     ```powershell
     cd src
     python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
     ```

2. **Start Frontend** (Second):
   - Navigate to `FraudFrontend` folder
   - Double-click `start.bat` OR run:
     ```powershell
     npm run dev
     ```

3. Open browser to http://localhost:5173

### Stopping the Application

- Press `Ctrl+C` in each terminal window
- Or close the terminal windows

## Configuration

### Backend Port
Edit `FraudBackend/src/app/config.py` to change the default port:
```python
app_port: int = 8000  # Change to desired port
```

### Frontend API URL
Edit `FraudFrontend/src/services/api.ts` to change the backend URL:
```typescript
baseURL: 'http://127.0.0.1:8000/api/v1'  // Change if backend is on different port/host
```

### Excel File Location
The Excel file must be located at:
```
FraudBackend/src/app/data/Compliance_Register.xlsx
```

To change this, edit `FraudBackend/src/app/services/compliance_service.py`:
```python
self.excel_file = self.data_dir / "Compliance_Register.xlsx"  # Change filename here
```

## Need Help?

If you encounter any issues not covered here, please check:
1. Python version: `python --version` (should be 3.8+)
2. Node version: `node --version` (should be 16+)
3. Backend logs in the terminal
4. Frontend logs in browser console (F12)
5. Backend API documentation at http://localhost:8000/docs

