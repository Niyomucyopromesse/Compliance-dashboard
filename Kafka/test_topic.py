#!/usr/bin/env python3
"""
Test script to check if the table-update topic is working
"""

import json
import time
import logging
from datetime import datetime
from confluent_kafka import SerializingProducer, DeserializingConsumer
from confluent_kafka.serialization import StringSerializer, StringDeserializer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
BOOTSTRAP_SERVERS = '10.24.38.44:35002'
TOPIC_NAME = 'table-update'
GROUP_ID = 'test_group'

def create_producer():
    """Create a simple JSON producer"""
    try:
        producer_config = {
            'bootstrap.servers': BOOTSTRAP_SERVERS,
            'key.serializer': StringSerializer('utf_8'),
            'value.serializer': StringSerializer('utf_8'),
            'acks': 'all',
            'retries': 3
        }
        
        producer = SerializingProducer(producer_config)
        logger.info("✅ Producer created successfully")
        return producer
        
    except Exception as e:
        logger.error(f"❌ Failed to create producer: {e}")
        return None

def create_consumer():
    """Create a simple JSON consumer"""
    try:
        consumer_config = {
            'bootstrap.servers': BOOTSTRAP_SERVERS,
            'group.id': GROUP_ID,
            'auto.offset.reset': 'latest',
            'key.deserializer': StringDeserializer('utf_8'),
            'value.deserializer': StringDeserializer('utf_8'),
            'enable.auto.commit': True,
            'auto.commit.interval.ms': 1000
        }
        
        consumer = DeserializingConsumer(consumer_config)
        consumer.subscribe([TOPIC_NAME])
        logger.info("✅ Consumer created successfully")
        return consumer
        
    except Exception as e:
        logger.error(f"❌ Failed to create consumer: {e}")
        return None

def test_produce_message(producer):
    """Test producing a message to the topic"""
    try:
        test_message = {
            "test": True,
            "timestamp": datetime.now().isoformat(),
            "message": "This is a test message for table-update topic",
            "entityName": "TEST_ENTITY"
        }
        
        key = f"test_{int(time.time())}"
        message_json = json.dumps(test_message)
        
        producer.produce(
            topic=TOPIC_NAME,
            key=key,
            value=message_json
        )
        
        producer.flush()
        logger.info(f"📤 Test message sent successfully: {key}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send test message: {e}")
        return False

def test_consume_message(consumer, timeout=10):
    """Test consuming a message from the topic"""
    try:
        logger.info(f"🎧 Listening for messages on topic '{TOPIC_NAME}' for {timeout} seconds...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            msg = consumer.poll(1.0)
            
            if msg is None:
                continue
                
            if msg.error():
                logger.error(f"❌ Consumer error: {msg.error()}")
                continue
            
            logger.info("📨 Message received!")
            logger.info(f"🔑 Key: {msg.key()}")
            logger.info(f"📋 Topic: {msg.topic()}")
            logger.info(f"📍 Partition: {msg.partition()}")
            logger.info(f"📊 Offset: {msg.offset()}")
            logger.info(f"📄 Value: {msg.value()}")
            
            return True
        
        logger.warning("⏰ No messages received within timeout period")
        return False
        
    except Exception as e:
        logger.error(f"❌ Error while consuming: {e}")
        return False

def main():
    """Main test function"""
    logger.info("🧪 Testing table-update topic")
    logger.info("=" * 50)
    
    # Test 1: Create producer and send a message
    logger.info("📤 Test 1: Testing message production...")
    producer = create_producer()
    if not producer:
        logger.error("❌ Cannot proceed without producer")
        return
    
    if not test_produce_message(producer):
        logger.error("❌ Message production failed")
        return
    
    logger.info("✅ Message production test passed")
    
    # Test 2: Create consumer and try to read the message
    logger.info("📥 Test 2: Testing message consumption...")
    consumer = create_consumer()
    if not consumer:
        logger.error("❌ Cannot proceed without consumer")
        return
    
    if test_consume_message(consumer, timeout=15):
        logger.info("✅ Message consumption test passed")
    else:
        logger.warning("⚠️ Message consumption test failed - no messages received")
    
    # Cleanup
    producer.flush()
    consumer.close()
    
    logger.info("🏁 Topic test completed")

if __name__ == "__main__":
    main()
