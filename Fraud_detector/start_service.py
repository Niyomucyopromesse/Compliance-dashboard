#!/usr/bin/env python3
"""
Startup script for the Fraud Detection Service

This script provides an easy way to start the fraud detection service
with different configurations.
"""

import sys
import os
import argparse
import logging
from fraud_service import FraudDetectionService

def setup_logging(level=logging.INFO):
    """Setup logging configuration"""
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('fraud_service.log')
        ]
    )

def main():
    """Main startup function"""
    parser = argparse.ArgumentParser(description='Start Fraud Detection Service')
    parser.add_argument('--memgraph-host', default='10.24.38.54', 
                       help='Memgraph database host (default: 10.24.38.54)')
    parser.add_argument('--memgraph-port', type=int, default=7687,
                       help='Memgraph database port (default: 7687)')
    parser.add_argument('--backend-url', default='http://localhost:8000',
                       help='FraudBackend API URL (default: http://localhost:8000)')
    parser.add_argument('--auto-create-alerts', action='store_true',
                       help='Automatically create alerts in database (default: False)')
    parser.add_argument('--daemon', action='store_true',
                       help='Run as daemon (background service)')
    parser.add_argument('--log-level', default='INFO',
                       choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                       help='Logging level (default: INFO)')
    parser.add_argument('--config', help='Configuration file path')
    
    args = parser.parse_args()
    
    # Setup logging
    log_level = getattr(logging, args.log_level.upper())
    setup_logging(log_level)
    logger = logging.getLogger(__name__)
    
    logger.info("Starting Fraud Detection Service")
    logger.info(f"Memgraph: {args.memgraph_host}:{args.memgraph_port}")
    logger.info(f"Backend: {args.backend_url}")
    logger.info(f"Auto-create alerts: {args.auto_create_alerts}")
    logger.info(f"Daemon mode: {args.daemon}")
    
    try:
        # Create and start service
        service = FraudDetectionService(
            memgraph_host=args.memgraph_host,
            memgraph_port=args.memgraph_port,
            backend_url=args.backend_url,
            auto_create_alerts=args.auto_create_alerts
        )
        
        # Perform initial health check
        health = service.health_check()
        logger.info(f"Health check: {health}")
        
        if health['status'] != 'healthy':
            logger.warning("Service health check failed, but continuing...")
        
        # Start the service
        service.start()
        
        if args.daemon:
            logger.info("Running as daemon service...")
            import time
            try:
                while True:
                    time.sleep(60)
                    # Log periodic status
                    stats = service.get_service_stats()
                    logger.info(f"Service running - Transactions processed: {stats['stats']['transactions_processed']}, "
                              f"Alerts generated: {stats['stats']['alerts_generated']}")
            except KeyboardInterrupt:
                logger.info("Received interrupt signal")
        else:
            logger.info("Service started in interactive mode. Press Ctrl+C to stop.")
            import time
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                logger.info("Received interrupt signal")
                
    except Exception as e:
        logger.error(f"Failed to start service: {e}")
        sys.exit(1)
    finally:
        try:
            service.stop()
            logger.info("Service stopped successfully")
        except:
            pass

if __name__ == '__main__':
    main()
