# Compliance Register Application

This application manages the bank's compliance register with an interactive dashboard showing compliance levels by department and detailed record management.

## Features

### 1. Overview Page
- **Global Compliance Metrics**: Total items, compliant, non-compliant, and pending counts
- **Bank-wide Compliance Percentage**: Visual progress bar showing overall compliance
- **Department Breakdown**: Individual compliance levels for each department with detailed statistics

### 2. Details Page
- **View All Records**: Complete list of compliance register entries
- **Edit Records**: Update Article Description, Responsible Department, Compliance Status, and Comments
- **Add New Records**: Create new compliance entries with all required fields
- **Delete Records**: Remove obsolete or incorrect entries

## Data Source

The application reads from and writes to the Excel file located at:
```
FraudBackend/src/app/data/Compliance_Register.xlsx
```

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd FraudBackend
```

2. Activate virtual environment (if exists):
```bash
fraud\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the backend server:
```bash
cd src
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or simply run:
```bash
start.bat
```

The backend API will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd FraudFrontend
```

2. Install dependencies (first time only):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Or simply run:
```bash
start.bat
```

The frontend will be available at: `http://localhost:5173`

## API Endpoints

### Compliance Overview
- `GET /api/v1/compliance/overview` - Get compliance statistics by department

### Compliance Records
- `GET /api/v1/compliance/records` - Get all records
- `GET /api/v1/compliance/records/{id}` - Get specific record
- `POST /api/v1/compliance/records` - Create new record
- `PUT /api/v1/compliance/records/{id}` - Update record
- `DELETE /api/v1/compliance/records/{id}` - Delete record

## Excel File Structure

The `Compliance_Register.xlsx` file should have the following columns:
- **ARTICLE-DESCRIPTION**: Description of the compliance article
- **RESPONSIBLE DEPARTMENT**: Department responsible for compliance
- **COMPLIANCE STATUS**: Status (Compliant/Non-Compliant/Pending)
- **COMMENTS**: Additional notes or comments

## Navigation

The application has two main pages accessible from the sidebar:

1. **Overview** - Dashboard showing compliance levels
2. **Details** - Interactive table for managing records

## Technologies Used

### Backend
- FastAPI - Modern Python web framework
- Pandas - Excel file processing
- Pydantic - Data validation
- Uvicorn - ASGI server

### Frontend
- React + TypeScript - UI framework
- Vite - Build tool
- Tailwind CSS - Styling
- React Router - Navigation

## Notes

- The Excel file is automatically saved when records are created, updated, or deleted
- Compliance percentages are calculated based on "Compliant" status count
- Department statistics are grouped by the "RESPONSIBLE DEPARTMENT" field
- The application supports real-time updates to the Excel file

## Troubleshooting

### Backend won't start
- Ensure Python 3.8+ is installed
- Check if port 8000 is available
- Verify all dependencies are installed: `pip install -r requirements.txt`

### Frontend won't start
- Ensure Node.js 16+ is installed
- Check if port 5173 is available
- Delete `node_modules` and run `npm install` again

### Excel file issues
- Ensure the Excel file exists at `FraudBackend/src/app/data/Compliance_Register.xlsx`
- Make sure the file is not open in Excel when the backend is running
- Verify column names match the expected format

