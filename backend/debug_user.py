import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models import User
from app.core.config import settings

async def debug_user():
    # Connect to DB
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(database=client.outbound_ai, document_models=[User])
    
    # Find all users
    users = await User.find_all().to_list()
    print(f"Found {len(users)} users")
    
    for u in users:
        print(f"User: {u.email} ({u.clerk_id})")
        print(f"  Gmail Connection ID: {u.gmail_connection_id}")
        print(f"  Other Connections: {u.other_connections}")
        
    if not users:
        print("No users found in database.")

if __name__ == "__main__":
    # Load env vars manually if needed, but config.settings should load from .env
    asyncio.run(debug_user())
