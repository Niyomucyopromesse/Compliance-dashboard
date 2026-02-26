# 🎯 START HERE - Compliance Register Application

## 📋 What This Application Does

This is a **Compliance Register Management System** for tracking departmental compliance across your bank. It provides:

1. **Overview Dashboard**: Visual display of compliance levels for each department and overall bank compliance
2. **Details Management**: Interactive table to view, edit, add, and delete compliance records
3. **Excel Integration**: All data is stored in and synced with `Compliance_Register.xlsx`

---

## 🚀 How to Start the Application

### Option 1: Quick Start with Batch Files (Easiest)

1. **Install dependencies first** (one-time only):
   ```powershell
   cd FraudBackend
   pip install fastapi uvicorn pandas openpyxl pydantic pydantic-settings structlog python-dotenv
   
   cd ../FraudFrontend
   npm install
   ```

2. **Start Backend**: Double-click `FraudBackend/start.bat`
3. **Start Frontend**: Double-click `FraudFrontend/start.bat`
4. **Open Browser**: Go to http://localhost:5173

### Option 2: Manual Start (More Control)

**Terminal 1 (Backend):**
```powershell
cd "FraudBackend"
cd src
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```powershell
cd "FraudFrontend"
npm run dev
```

**Browser:**
Open http://localhost:5173

---

## ✅ First-Time Setup Checklist

Before running the app, make sure you have:

- [ ] **Python 3.8+** installed (check: `python --version`)
- [ ] **Node.js 16+** installed (check: `node --version`)
- [ ] **pip** installed (check: `pip --version`)
- [ ] **npm** installed (check: `npm --version`)
- [ ] **Excel file** exists at: `FraudBackend/src/app/data/Compliance_Register.xlsx`
- [ ] **Backend dependencies** installed (see commands above)
- [ ] **Frontend dependencies** installed (see commands above)

---

## 📊 Using the Application

### Overview Page (Dashboard)
- **What you see**: Compliance statistics and department breakdown
- **What you can do**: 
  - View total items, compliant, non-compliant, and pending counts
  - See overall bank compliance percentage
  - Check each department's compliance level
  - Identify departments that need attention (color-coded: red < 60%, yellow 60-80%, green > 80%)

### Details Page (Data Management)
- **What you see**: Complete table of all compliance records
- **What you can do**:
  - **Edit**: Click "Edit" on any row → Modify fields → Click "Save"
  - **Add**: Click "Add New Record" → Fill in form → Click "Save"
  - **Delete**: Click "Delete" on any row → Confirm deletion
  - **View**: See Article Description, Department, Status, and Comments

### Navigation
- Use the **sidebar** on the left to switch between Overview and Details
- Click the **hamburger menu** to collapse/expand sidebar
- Your user info appears at the bottom of the sidebar

---

## 🔍 Verifying Everything Works

### Backend Check
1. Open http://localhost:8000 → Should show: `{"message": "Compliance Register Backend API", ...}`
2. Open http://localhost:8000/docs → Should show interactive API documentation
3. Open http://localhost:8000/health → Should show: `{"status": "healthy", ...}`

### Frontend Check
1. Open http://localhost:5173 → Should see Overview page with statistics
2. Click "Details" in sidebar → Should see table with compliance records
3. Try editing a record → Changes should save to Excel file
4. Try adding a new record → Should appear in table and Excel file

---

## 📝 Excel File Format

**Location:** `FraudBackend/src/app/data/Compliance_Register.xlsx`

**Required Columns:**
- **ARTICLE-DESCRIPTION**: What compliance requirement this is
- **RESPONSIBLE DEPARTMENT**: Which department is responsible
- **COMPLIANCE STATUS**: One of: `Compliant`, `Non-Compliant`, or `Pending`
- **COMMENTS**: Optional notes or additional information

**Example:**
| ARTICLE-DESCRIPTION | RESPONSIBLE DEPARTMENT | COMPLIANCE STATUS | COMMENTS |
|---------------------|------------------------|-------------------|----------|
| KYC Documentation | Risk Department | Compliant | All docs up to date |
| AML Training | HR Department | Pending | Training scheduled for Q2 |
| Audit Reports | Compliance | Non-Compliant | Missing 2 reports |

---

## ⚠️ Troubleshooting

### "No module named 'pandas'" or similar errors
**Solution:** Install backend dependencies
```powershell
cd FraudBackend
pip install fastapi uvicorn pandas openpyxl pydantic pydantic-settings structlog python-dotenv
```

### "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Backend won't start (port 8000 in use)
**Solution:** 
1. Close any other applications using port 8000
2. Or start on different port: `python -m uvicorn app.main:app --reload --port 8001`
3. Then update frontend API URL in `FraudFrontend/src/services/api.ts`

### Frontend shows "Failed to fetch" or connection errors
**Solution:**
1. Ensure backend is running (check http://localhost:8000/health)
2. Check backend is on port 8000
3. Check browser console for specific errors (F12)

### Excel file not found or can't open
**Solution:**
1. Ensure `Compliance_Register.xlsx` exists in `FraudBackend/src/app/data/`
2. Close the Excel file if it's open in Microsoft Excel
3. Check file permissions (should be readable/writable)

### Changes not saving to Excel
**Solution:**
1. Close the Excel file if it's open
2. Check backend console for error messages
3. Ensure file has write permissions
4. Try restarting the backend

---

## 🛑 Stopping the Application

1. In each terminal window, press **Ctrl+C**
2. Or simply close the terminal windows
3. Changes are automatically saved to the Excel file

---

## 📚 Additional Documentation

For more detailed information, see:
- **QUICK_START.md** - 5-minute setup guide
- **INSTALLATION_GUIDE.md** - Comprehensive installation instructions
- **README_COMPLIANCE.md** - Full application documentation
- **CHANGES_SUMMARY.md** - Technical details of what was changed

---

## 🔄 Daily Workflow

### Morning (Starting Work)
1. Open two terminals or double-click the two `start.bat` files
2. Wait for both servers to start
3. Open browser to http://localhost:5173
4. Review compliance overview

### During Day (Managing Records)
1. Navigate to Details page
2. Edit records as needed (updates save to Excel automatically)
3. Add new compliance items as they arise
4. Delete obsolete entries

### Evening (End of Day)
1. Review overview to check compliance percentages
2. Backup Excel file if desired: Copy `Compliance_Register.xlsx`
3. Press Ctrl+C in terminals to stop servers

---

## 💾 Backup Recommendations

**Manual Backup:**
```powershell
copy "FraudBackend\src\app\data\Compliance_Register.xlsx" "FraudBackend\src\app\data\Compliance_Register_backup_$(Get-Date -Format 'yyyy-MM-dd').xlsx"
```

**Automated Backup:** Consider setting up a scheduled task to backup the Excel file daily.

---

## 🎨 Customization

### Change Department Names
- Edit directly in Excel or via the Details page
- Department statistics update automatically

### Change Compliance Status Options
- Edit `FraudFrontend/src/pages/DetailsPage.tsx`
- Find the `<select>` element with status options
- Add/remove options as needed

### Change Color Thresholds
- Edit `FraudFrontend/src/pages/OverviewPage.tsx`
- Find `getStatusColor` and `getStatusBgColor` functions
- Adjust percentage thresholds (default: 80% green, 60% yellow, <60% red)

### Change Backend Port
- Edit `FraudBackend/src/app/config.py`
- Change `app_port` value
- Update frontend API URL in `FraudFrontend/src/services/api.ts`

---

## 🆘 Getting Help

1. Check the **Troubleshooting** section above
2. Review error messages in terminal/console
3. Check backend logs in terminal where backend is running
4. Check frontend console (F12 in browser)
5. Review API documentation at http://localhost:8000/docs
6. Check that Excel file format matches expected structure

---

## ✨ Success Indicators

You'll know everything is working when you can:
- ✅ See compliance statistics on Overview page
- ✅ View all records in Details page table
- ✅ Edit a record and see it update immediately
- ✅ Add a new record and find it in the table
- ✅ Delete a record and see it removed
- ✅ Open Excel file and see your changes reflected
- ✅ Refresh browser and see latest data from Excel

---

## 🎉 You're Ready!

Your Compliance Register application is now set up and ready to use. Start by exploring the Overview page to see your current compliance levels, then head to Details to manage your records.

**Need more help?** See the documentation files listed above or check the troubleshooting section.

---

**Version:** 1.0.0  
**Last Updated:** December 2025

