# Fraud Detection Backend

A FastAPI-based backend service for fraud detection and monitoring, integrated with Memgraph graph database.

## Features

- **REST API**: Comprehensive REST endpoints for fraud detection operations
- **Real-time Updates**: WebSocket support for live monitoring
- **Graph Database**: Memgraph integration for complex fraud pattern detection
- **Authentication**: JWT-based authentication and authorization
- **Metrics & Analytics**: Real-time metrics and dashboard data
- **Docker Support**: Complete containerized deployment

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Memgraph      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (Graph DB)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis         │
                       │   (Cache/Queue) │
                       └─────────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- Make (optional, for convenience commands)

### Using Docker (Recommended)

1. **Clone and navigate to the project:**
   ```bash
   cd FraudBackend
   ```

2. **Start all services:**
   ```bash
   make dev
   # or
   docker-compose up -d
   ```

3. **Access the services:**
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Memgraph UI: http://localhost:7444
   - Redis: localhost:6379

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start Memgraph and Redis:**
   ```bash
   make up-memgraph
   make up-redis
   ```

3. **Run the backend:**
   ```bash
   python -m uvicorn src.app.main:app --reload
   ```

## API Endpoints

### Core Endpoints

- `GET /health` - Health check
- `GET /` - API information

### Metrics
- `GET /api/v1/metrics/overview` - Dashboard overview metrics
- `GET /api/v1/metrics/transactions-chart` - Transaction chart data
- `GET /api/v1/metrics/risk-distribution` - Risk distribution data

### Transactions
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/{tx_id}` - Get transaction details
- `POST /api/v1/transactions/{tx_id}/actions` - Perform transaction actions

### Customers
- `GET /api/v1/customers` - List customers
- `GET /api/v1/customers/{customer_id}` - Get customer details
- `PUT /api/v1/customers/{customer_id}` - Update customer

### Accounts
- `GET /api/v1/accounts` - List accounts
- `GET /api/v1/accounts/{account_id}` - Get account details
- `POST /api/v1/accounts/{account_id}/actions` - Perform account actions

### Alerts
- `GET /api/v1/alerts` - List alerts
- `GET /api/v1/alerts/{alert_id}` - Get alert details
- `POST /api/v1/alerts/{alert_id}/actions` - Perform alert actions

### WebSocket
- `WS /ws/monitor` - Real-time monitoring feed

## Configuration

Environment variables can be set in `.env` file:

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

## Development

### Project Structure

```
src/
├── app/
│   ├── api/           # API routes and dependencies
│   ├── db/            # Database connection and client
│   ├── models/        # Pydantic schemas and data models
│   ├── repositories/  # Data access layer
│   ├── services/      # Business logic layer
│   ├── websockets/    # WebSocket management
│   └── utils/         # Utility functions
└── tests/             # Test files
```

### Running Tests

```bash
make test
# or
python -m pytest src/tests/ -v
```

### Database Operations

```bash
# Access Memgraph console
make db-shell

# Reset database
make db-reset

# Initialize with sample data
make init-db
```

## WebSocket Usage

Connect to the WebSocket endpoint for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/monitor');

ws.onopen = () => {
    // Subscribe to alerts
    ws.send(JSON.stringify({
        type: 'subscribe',
        data: { type: 'alerts' }
    }));
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received:', message);
};
```

## Monitoring

### Health Checks

- Backend: `GET /health`
- Memgraph: Built-in health check
- Redis: Built-in health check

### Logs

```bash
# All services
make logs

# Specific service
docker-compose logs -f backend
docker-compose logs -f memgraph
```

## Production Deployment

1. **Update environment variables** for production
2. **Build and push Docker images**
3. **Deploy using Docker Compose or Kubernetes**
4. **Set up monitoring and logging**
5. **Configure load balancing and SSL**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
