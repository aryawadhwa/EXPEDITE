import httpx
import asyncio
import jwt
import time

def create_test_token():
    return jwt.encode(
        {"sub": "user_2test123", "email": "test@example.com", "exp": time.time() + 3600},
        "secret",
        algorithm="HS256"
    )

async def verify_timeline():
    # 1. Get Token
    token = create_test_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Call Timeline Endpoint
    async with httpx.AsyncClient() as client:
        try:
            print("Fetching timeline...")
            response = await client.get("http://localhost:8000/api/v1/timeline", headers=headers)
            
            if response.status_code == 200:
                print("SUCCESS: Timeline API is working.")
                data = response.json()
                print(f"Items found: {len(data)}")
                print(data)
            else:
                print(f"ERROR: Failed with status {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    asyncio.run(verify_timeline())
