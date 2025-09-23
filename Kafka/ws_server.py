# ws_server.py
import asyncio
import json
from fastapi import FastAPI, WebSocket
from aiokafka import AIOKafkaConsumer
import uvicorn

app = FastAPI()
clients = set()

@app.websocket("/ws/fraud")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    print("WebSocket connected. Clients:", len(clients))
    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(10)
    except:
        pass
    finally:
        clients.remove(ws)
        print("WebSocket disconnected. Clients:", len(clients))

async def kafka_consumer_loop():
    consumer = AIOKafkaConsumer(
        "fraud_alerts",
        bootstrap_servers="192.168.21.148:9092",  # WSL IP
        group_id="fraud_ws_group",
        auto_offset_reset="latest"
    )
    await consumer.start()
    try:
        async for msg in consumer:
            alert = json.loads(msg.value)
            print("Consumed alert:", alert)
            # Broadcast to all connected clients
            for ws in clients.copy():  # use copy to avoid mutation issues
                try:
                    await ws.send_text(json.dumps(alert))
                except:
                    clients.remove(ws)
    finally:
        await consumer.stop()

# Run Kafka consumer on FastAPI startup
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(kafka_consumer_loop())

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
