from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # Map user_id to list of websockets
        self.user_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.user_connections:
            self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        """Send message to all connections of a specific user"""
        if user_id in self.user_connections:
            msg_str = json.dumps(message)
            for ws in self.user_connections[user_id]:
                try:
                    await ws.send_text(msg_str)
                except:
                    pass

    async def broadcast(self, message: dict):
        """Broadcast to all connected users"""
        msg_str = json.dumps(message)
        for user_id, connections in self.user_connections.items():
            for ws in connections:
                try:
                    await ws.send_text(msg_str)
                except:
                    pass

# Global manager instance
manager = ConnectionManager()

def get_connection_manager():
    return manager
