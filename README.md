# Fraud Detection System

A comprehensive fraud detection system with real-time monitoring, machine learning algorithms, and web-based dashboard.

## 🏗️ Project Structure

```
EC2_Project/
├── Fraud_detector/          # Core fraud detection engine with ML algorithms
├── FraudBackend/           # FastAPI backend service with Memgraph database
├── FraudFrontend/          # React/TypeScript frontend dashboard
├── Kafka/                  # Kafka streaming and data processing components
└── README.md              # This file
```

## ✨ Features

- **Real-time Transaction Monitoring**: Live fraud detection with Kafka integration
- **Machine Learning Algorithms**: Advanced fraud detection patterns and risk assessment
- **WebSocket-based Live Updates**: Real-time dashboard updates
- **Interactive Dashboard**: Charts, analytics, and transaction management
- **Graph Database Integration**: Memgraph for complex relationship analysis
- **Multi-component Architecture**: Scalable microservices design

## 🚀 Quick Start Guide

### Prerequisites

- **Python 3.11+** (for backend services)
- **Node.js 18+** (for frontend)
- **Docker & Docker Compose** (recommended for full stack)
- **Git** (for version control)

### System Requirements

- **Memory**: 8GB RAM minimum, 16GB recommended
- **Storage**: 10GB free space
- **Network**: Internet connection for dependencies

## 🛠️ Virtual Environment Setup

### 1. Fraud Detection Engine (Fraud_detector/)

```bash
# Navigate to fraud detection directory
cd Fraud_detector

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the fraud detection service
python start_service.py
```

### 2. Backend API (FraudBackend/)

```bash
# Navigate to backend directory
cd FraudBackend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start with Docker (recommended)
docker-compose up -d

# OR start locally
python -m uvicorn src.app.main:app --reload
```

### 3. Frontend Dashboard (FraudFrontend/)

```bash
# Navigate to frontend directory
cd FraudFrontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 4. Kafka Integration (Kafka/)

```bash
# Navigate to Kafka directory
cd Kafka

# Create virtual environment
python -m venv kafka_env

# Activate virtual environment
# Windows:
kafka_env\Scripts\activate
# Linux/Mac:
source kafka_env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Kafka streaming
python T24_Kafka.py
```

## 🐳 Docker Setup (Recommended)

### Full Stack with Docker Compose

```bash
# Start all services
cd FraudBackend
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Individual Services

```bash
# Backend only
cd FraudBackend
docker-compose up -d backend memgraph redis

# With frontend
cd FraudFrontend
docker build -t fraud-frontend .
docker run -p 3000:3000 fraud-frontend
```

## 🔧 Environment Configuration

### Backend Environment (.env)

Create `FraudBackend/.env`:

```env
# Application
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000

# Database
MEMGRAPH_URI=bolt://localhost:7687
MEMGRAPH_USER=mg_user
MEMGRAPH_PASSWORD=mg_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_ALGORITHM=HS256

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
```

### Frontend Environment (.env)

Create `FraudFrontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

## 🚦 Starting the Complete System

### Option 1: Manual Start (Development)

```bash
# Terminal 1: Start Backend
cd FraudBackend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m uvicorn src.app.main:app --reload

# Terminal 2: Start Frontend
cd FraudFrontend
npm install
npm run dev

# Terminal 3: Start Fraud Detection
cd Fraud_detector
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python start_service.py

# Terminal 4: Start Kafka Streaming
cd Kafka
python -m venv kafka_env
kafka_env\Scripts\activate  # Windows
pip install -r requirements.txt
python T24_Kafka.py
```

### Option 2: Docker Compose (Production-like)

```bash
# Start all services
cd FraudBackend
docker-compose up -d

# Start frontend separately
cd ../FraudFrontend
npm install
npm run dev
```

## 🛑 Stopping the System

### Manual Stop

```bash
# Stop each service (Ctrl+C in each terminal)
# Or use process managers:

# Windows
taskkill /f /im python.exe
taskkill /f /im node.exe

# Linux/Mac
pkill -f "python.*start_service"
pkill -f "uvicorn"
pkill -f "npm.*dev"
```

### Docker Stop

```bash
# Stop all Docker services
cd FraudBackend
docker-compose down

# Stop specific services
docker-compose stop backend
docker-compose stop memgraph
```

## 📊 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend Dashboard** | http://localhost:3000 | Main user interface |
| **Backend API** | http://localhost:8000 | REST API endpoints |
| **API Documentation** | http://localhost:8000/docs | Swagger/OpenAPI docs |
| **Memgraph UI** | http://localhost:7444 | Graph database interface |
| **Redis** | localhost:6379 | Cache and queue service |

## 🔍 Monitoring and Health Checks

### Service Health

```bash
# Backend health
curl http://localhost:8000/health

# Check Docker services
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f memgraph
```

### Performance Monitoring

```bash
# Backend metrics
curl http://localhost:8000/api/v1/metrics/overview

# System resources
docker stats
```

## 🧪 Testing the System

### Backend Tests

```bash
cd FraudBackend
python -m pytest src/tests/ -v
```

### Frontend Tests

```bash
cd FraudFrontend
npm test
```

### Integration Tests

```bash
# Test fraud detection
cd Fraud_detector
python test_service_integration.py

# Test Kafka integration
cd Kafka
python test_kafka_integration.py
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Conflicts

```bash
# Check what's using ports
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/Mac

# Kill processes
taskkill /PID <PID> /F         # Windows
kill -9 <PID>                 # Linux/Mac
```

#### 2. Virtual Environment Issues

```bash
# Recreate virtual environment
rm -rf venv
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

#### 3. Docker Issues

```bash
# Clean Docker system
docker system prune -a
docker-compose down -v
docker-compose up -d
```

#### 4. Database Connection Issues

```bash
# Check Memgraph status
docker-compose logs memgraph

# Reset database
docker-compose down -v
docker-compose up -d
```

### Debug Mode

```bash
# Backend debug
cd FraudBackend
python -m uvicorn src.app.main:app --reload --log-level debug

# Fraud detection debug
cd Fraud_detector
python start_service.py --log-level DEBUG
```

## 📚 Component Documentation

- **[Fraud Detection Engine](Fraud_detector/README.md)**: Core ML algorithms and real-time monitoring
- **[Backend API](FraudBackend/README.md)**: FastAPI service with Memgraph integration
- **[Frontend Dashboard](FraudFrontend/README.md)**: React/TypeScript user interface
- **[Kafka Integration](Kafka/README_Batch_Streaming.md)**: Data streaming and processing

## 🔧 Development Tools

### Code Quality

```bash
# Backend
cd FraudBackend
black src/
isort src/
flake8 src/

# Frontend
cd FraudFrontend
npm run lint
npm run type-check
```

### Database Management

```bash
# Access Memgraph console
cd FraudBackend
make db-shell

# Reset database
make db-reset

# Initialize with sample data
make init-db
```

## 🚀 Production Deployment

### Environment Setup

1. **Update environment variables** for production
2. **Configure SSL certificates**
3. **Set up reverse proxy** (Nginx)
4. **Configure monitoring** (Prometheus/Grafana)
5. **Set up logging** (ELK Stack)

### Security Considerations

- Change default passwords
- Use environment variables for secrets
- Enable HTTPS
- Configure firewall rules
- Regular security updates

## 📞 Support

For issues and questions:

1. **Check logs** for error details
2. **Verify configuration** settings
3. **Ensure dependencies** are installed
4. **Check network connectivity**
5. **Review component documentation**

## 📄 License

This project is licensed under the MIT License.
