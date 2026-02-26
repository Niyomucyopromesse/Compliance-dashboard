# Fraud Detection Backend

FastAPI-based backend for the fraud detection system.

## Quick Start

### Option 1: Using start.bat (Recommended for Windows)

Simply double-click `start.bat` or run:

```bash
start.bat
```

This will automatically:
- Create a virtual environment (if not exists)
- Install all dependencies
- Start the FastAPI server

### Option 2: Manual Setup

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   ```

2. **Activate virtual environment**:
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   - Copy `env.example` to `.env`
   - Update settings as needed

5. **Run the server**:
   ```bash
   cd ..
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

## Access

- **API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **WebSocket**: ws://localhost:8000/ws/monitor

## Project Structure

```
app/
├── api/              # API endpoints
│   └── v1/          # API version 1
├── db/              # Database clients
├── models/          # Data models
├── services/        # Business logic
├── repositories/    # Data access layer
├── websockets/      # WebSocket manager
├── utils/           # Helper functions
├── main.py          # Application entry point
├── config.py        # Configuration
└── .env             # Environment variables
```

## Environment Variables

Key settings in `.env`:

- `APP_PORT`: Server port (default: 8000)
- `APP_DEBUG`: Debug mode (default: true)
- `USE_MOCK_DATA`: Use mock data if Memgraph unavailable (default: true)
- `MEMGRAPH_HOST`: Memgraph database host
- `CORS_ORIGINS`: Allowed CORS origins

## Features

- 🚀 FastAPI framework
- 📊 Real-time WebSocket connections
- 🔍 Fraud detection monitoring
- 📈 Metrics and analytics
- 🔄 Live transaction tracking
- 🚨 Alert system
- 🔐 Security and authentication ready

## Development

- Hot reload is enabled in development mode
- API documentation available at `/docs`
- Health check endpoint at `/health`

## Support

For issues or questions, refer to the main project documentation.

