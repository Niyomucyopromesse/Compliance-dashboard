# Quick Start Guide

## Prerequisites Check
Run these commands to verify you have the required software:
```powershell
python --version   # Should show Python 3.8+
node --version     # Should show Node 16+
pip --version      # Should show pip version
npm --version      # Should show npm version
```

## 🚀 Fast Setup (5 minutes)

### 1. Install Backend Dependencies
```powershell
cd FraudBackend
pip install fastapi uvicorn pandas openpyxl pydantic pydantic-settings structlog python-dotenv
```

### 2. Test Backend
```powershell
python test_compliance.py
```
✅ Should show "All tests passed successfully!"

### 3. Start Backend
```powershell
cd src
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
✅ Backend running at http://localhost:8000

### 4. Install Frontend (New Terminal)
```powershell
cd FraudFrontend
npm install
```

### 5. Start Frontend
```powershell
npm run dev
```
✅ Frontend running at http://localhost:5173

## 🎯 Open the App
Navigate to: **http://localhost:5173**

You should see:
- **Overview Page**: Compliance dashboard with department statistics
- **Details Page**: Editable table of compliance records

## 📝 First Actions to Try

1. **View Overview**: See global compliance percentage and department breakdown
2. **Navigate to Details**: Click "Details" in sidebar
3. **Edit a Record**: Click "Edit" on any row, modify values, click "Save"
4. **Add New Record**: Click "Add New Record", fill in fields, click "Save"
5. **Delete a Record**: Click "Delete" on any row (confirm deletion)

## 🔍 Verify Everything Works

- Backend API docs: http://localhost:8000/docs
- Backend health: http://localhost:8000/health
- Frontend app: http://localhost:5173

## ⚡ Daily Use

Use the provided batch files:
1. Double-click `FraudBackend/start.bat` 
2. Double-click `FraudFrontend/start.bat`
3. Open http://localhost:5173

## 🛑 Stop the Application

Press `Ctrl+C` in each terminal window.

## ⚠️ Common Issues

**"No module named pandas"**
→ Run: `pip install pandas openpyxl`

**"npm: command not found"**  
→ Install Node.js from https://nodejs.org/

**"Port already in use"**  
→ Close other applications or change port in config

**Excel file not found**  
→ Ensure `Compliance_Register.xlsx` is in `FraudBackend/src/app/data/`

---

For detailed installation instructions, see `INSTALLATION_GUIDE.md`

