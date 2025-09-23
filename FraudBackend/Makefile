# Fraud Detection Backend Makefile

.PHONY: help install dev test clean build up down logs shell

# Default target
help:
	@echo "Available targets:"
	@echo "  install    - Install dependencies"
	@echo "  dev        - Start development environment"
	@echo "  test       - Run tests"
	@echo "  clean      - Clean up containers and volumes"
	@echo "  build      - Build Docker images"
	@echo "  up         - Start all services"
	@echo "  down       - Stop all services"
	@echo "  logs       - Show logs"
	@echo "  shell      - Open shell in backend container"

# Install dependencies
install:
	pip install -r requirements.txt

# Start development environment
dev: up
	@echo "Development environment started"
	@echo "Backend API: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"
	@echo "Memgraph UI: http://localhost:7444"
	@echo "Redis: localhost:6379"

# Run tests
test:
	python -m pytest src/tests/ -v

# Clean up
clean:
	docker-compose down -v
	docker system prune -f

# Build Docker images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Show logs
logs:
	docker-compose logs -f

# Open shell in backend container
shell:
	docker-compose exec backend bash

# Initialize database with sample data
init-db:
	@echo "Initializing database with sample data..."
	docker-compose exec backend python -c "from src.app.tasks.sample_data import create_sample_data; import asyncio; asyncio.run(create_sample_data())"

# Run specific service
up-memgraph:
	docker-compose up -d memgraph

up-redis:
	docker-compose up -d redis

up-backend:
	docker-compose up -d backend

# Development helpers
restart-backend:
	docker-compose restart backend

restart-all:
	docker-compose restart

# Database operations
db-shell:
	docker-compose exec memgraph mgconsole

db-reset:
	docker-compose down -v
	docker-compose up -d memgraph
	sleep 10
	make init-db

# Monitoring
status:
	docker-compose ps

health:
	curl -f http://localhost:8000/health || echo "Backend not healthy"
