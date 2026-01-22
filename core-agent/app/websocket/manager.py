import asyncio
import json
import logging
from typing import Dict, Set
from fastapi import WebSocket
from redis.asyncio import Redis

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[WebSocket, Set[str]] = {}
        # We need an async redis client for asyncio loop
        from common.configs import RedisConfig

        self.redis_client = Redis(
            host=RedisConfig.REDIS_HOST,
            port=RedisConfig.REDIS_PORT,
            db=RedisConfig.REDIS_DB,
            decode_responses=True,
        )
        self.pubsub = self.redis_client.pubsub()
        self.listening_task = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[websocket] = set()
        print("New WebSocket connection")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]
            print("WebSocket disconnected")

    async def subscribe(self, websocket: WebSocket, topic: str):
        if websocket in self.active_connections:
            self.active_connections[websocket].add(topic)
            await self.pubsub.subscribe(topic)
            print(f"Client subscribed to {topic}")

    async def unsubscribe(self, websocket: WebSocket, topic: str):
        if websocket in self.active_connections:
            self.active_connections[websocket].discard(topic)
            # We don't unsubscribe from Redis globally because other clients might be listening
            # Optimization could be added here if needed

    async def start_listening(self):
        """Start listening to Redis channels in a background task."""
        if self.listening_task:
            return

        async def listen_loop():
            try:
                # Use async iterator for listening
                await self.pubsub.subscribe("heartbeat")
                async for message in self.pubsub.listen():
                    if message["type"] == "message":
                        await self.broadcast(message["channel"], message["data"])
            except Exception as e:
                print(f"Redis listener error: {e}")

        self.listening_task = asyncio.create_task(listen_loop())
        print("Started Redis listener")

    async def broadcast(self, topic: str, message: str):
        """Send message to all clients subscribed to the topic."""
        # Clean up closed connections first/during
        to_remove = []

        try:
            # message should be a JSON string from the publisher
            # We wrap it in a structure for the client
            payload = json.dumps({"topic": topic, "data": json.loads(message)})
        except json.JSONDecodeError:
            # Fallback if message isn't JSON
            payload = json.dumps({"topic": topic, "data": message})

        for connection, topics in self.active_connections.items():
            if topic in topics:
                try:
                    print(f"Sending to client on topic {topic}: {payload}")
                    await connection.send_text(payload)
                except Exception as e:
                    print(f"Error sending to client: {e}")
                    to_remove.append(connection)

        for ws in to_remove:
            self.disconnect(ws)

    async def close(self):
        """Cleanup resources on shutdown"""
        if self.listening_task:
            self.listening_task.cancel()
            try:
                await self.listening_task
            except asyncio.CancelledError:
                pass

        await self.redis_client.close()
        print("Redis connection closed")


manager = WebSocketManager()
