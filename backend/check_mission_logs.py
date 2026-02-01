"""
Check mission logs to see what happened during execution
"""
import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models import Mission, MissionLog
from app.core.config import settings

async def check_logs():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(database=client.outbound_ai, document_models=[Mission, MissionLog])
    
    # Get latest mission
    missions = await Mission.find().sort("-_id").limit(1).to_list()
    if not missions:
        print("No missions found")
        return
    
    mission = missions[0]
    
    print(f"Mission: {mission.objective}")
    print(f"ID: {str(mission.id)}")
    print(f"Status: {mission.status}")
    print("\n" + "="*80)
    print("MISSION LOGS:")
    print("="*80)
    
    logs = await MissionLog.find(MissionLog.mission_id == str(mission.id)).sort("+timestamp").to_list()
    
    for log in logs:
        print(f"\n[{log.role.upper()}] {log.log_type}")
        print(f"  {log.content}")
        if log.metadata:
            print(f"  Metadata: {log.metadata}")

if __name__ == "__main__":
    asyncio.run(check_logs())
