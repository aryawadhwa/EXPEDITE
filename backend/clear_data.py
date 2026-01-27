
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models import Mission, Prospect, Draft, MissionLog, EmailThread, ContactHistory, UserAsset

async def clear_data():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.MONGODB_URI, tlsAllowInvalidCertificates=True)
    await init_beanie(database=client.outbound_ai, document_models=[Mission, Prospect, Draft, MissionLog, EmailThread, ContactHistory, UserAsset])
    
    print("Clearing transactional data...")
    
    await Mission.delete_all()
    print("- Missions cleared")
    
    await Prospect.delete_all()
    print("- Prospects cleared")
    
    await Draft.delete_all()
    print("- Drafts cleared")
    
    await MissionLog.delete_all()
    print("- MissionLogs cleared")
    
    await EmailThread.delete_all()
    print("- EmailThreads cleared")
    
    await ContactHistory.delete_all()
    print("- ContactHistory cleared")
    
    await UserAsset.delete_all()
    print("- UserAssets cleared")
    
    print("NOTE: Users and Agents configurations were preserved.")
    print("Done.")

if __name__ == "__main__":
    asyncio.run(clear_data())
