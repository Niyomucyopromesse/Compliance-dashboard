#!/usr/bin/env python3
"""
Simple Kafka consumer to read messages from table-update-json topic
"""

import json
import logging
from datetime import datetime
from confluent_kafka import DeserializingConsumer
from confluent_kafka.serialization import StringDeserializer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
TOPIC_NAME = 'table-update-json'
BOOTSTRAP_SERVERS = '10.24.38.44:35002'
GROUP_ID = 'test_consumer_group'

def create_consumer():
    """Create and configure the Kafka consumer"""
    try:
        consumer_config = {
            'bootstrap.servers': BOOTSTRAP_SERVERS,
            'group.id': GROUP_ID,
            'auto.offset.reset': 'latest',  # Start reading from latest messages
            'key.deserializer': StringDeserializer('utf_8'),
            'value.deserializer': StringDeserializer('utf_8'),
            'enable.auto.commit': True,
            'auto.commit.interval.ms': 1000
        }
        
        consumer = DeserializingConsumer(consumer_config)
        consumer.subscribe([TOPIC_NAME])
        logger.info(f"✅ Consumer created and subscribed to topic: {TOPIC_NAME}")
        return consumer
        
    except Exception as e:
        logger.error(f"❌ Failed to create consumer: {e}")
        return None

def format_message(message):
    """Format the message for display"""
    try:
        # Parse the JSON message
        data = json.loads(message.value())
        
        # Format the output
        formatted_output = f"""
{'='*80}
📨 MESSAGE RECEIVED
{'='*80}
🔑 Key: {message.key() if message.key() else 'No key'}
📋 Topic: {message.topic()}
📍 Partition: {message.partition()}
📊 Offset: {message.offset()}
⏰ Timestamp: {datetime.fromtimestamp(message.timestamp()[1]/1000).isoformat() if message.timestamp() else 'N/A'}

📄 MESSAGE CONTENT:
{'-'*50}"""
        
        # Pretty print the JSON data
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, dict):
                    formatted_output += f"\n{key}:"
                    for sub_key, sub_value in value.items():
                        # Truncate long values for readability
                        if isinstance(sub_value, str) and len(sub_value) > 100:
                            display_value = sub_value[:100] + "..."
                        else:
                            display_value = sub_value
                        formatted_output += f"\n  {sub_key}: {display_value}"
                else:
                    # Truncate long values for readability
                    if isinstance(value, str) and len(value) > 100:
                        display_value = value[:100] + "..."
                    else:
                        display_value = value
                    formatted_output += f"\n{key}: {display_value}"
        else:
            formatted_output += f"\n{data}"
        
        formatted_output += f"\n{'='*80}\n"
        return formatted_output
        
    except json.JSONDecodeError as e:
        return f"""
{'='*80}
📨 MESSAGE RECEIVED (RAW)
{'='*80}
🔑 Key: {message.key() if message.key() else 'No key'}
📋 Topic: {message.topic()}
📍 Partition: {message.partition()}
📊 Offset: {message.offset()}
⏰ Timestamp: {datetime.fromtimestamp(message.timestamp()[1]/1000).isoformat() if message.timestamp() else 'N/A'}

📄 RAW MESSAGE:
{'-'*50}
{message.value()}
{'='*80}\n"""

def consume_messages(consumer, max_messages=None):
    """Consume messages from the topic"""
    message_count = 0
    
    logger.info(f"🎧 Starting to consume messages from topic: {TOPIC_NAME}")
    logger.info("Press Ctrl+C to stop consuming")
    logger.info("="*80)
    
    try:
        while True:
            # Poll for messages
            msg = consumer.poll(1.0)            
            if msg is None:
                print("No message received")
                continue
                
            if msg.error():
                logger.error(f"❌ Consumer error: {msg.error()}")
                continue
            
            # Process the message
            message_count += 1
            formatted_message = format_message(msg)
            print('Formatted message:')
            print(formatted_message)
            
            # Check if we've reached the max messages limit
            if max_messages and message_count >= max_messages:
                logger.info(f"✅ Reached maximum message count ({max_messages}). Stopping...")
                break
                
    except KeyboardInterrupt:
        logger.info("\n⏹️ Stopping consumer...")
    except Exception as e:
        logger.error(f"❌ Error while consuming messages: {e}")
    finally:
        consumer.close()
        logger.info(f"📊 Total messages consumed: {message_count}")

def main():
    """Main function"""
    logger.info("🚀 Starting T24 Kafka Consumer Test")
    logger.info("="*60)
    
    # Create consumer
    consumer = create_consumer()
    if not consumer:
        logger.error("❌ Failed to create consumer. Exiting...")
        return
    
    # Start consuming messages
    # Set max_messages=None to consume indefinitely, or set a number like 10 to limit
    consume_messages(consumer, max_messages=None)

if __name__ == "__main__":
    main() 