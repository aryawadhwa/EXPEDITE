"""
Test Suite for New Endpoints
Tests scraper and sales agent functionality
"""

import asyncio
import httpx
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

# Mock auth token - replace with real token for authenticated tests
AUTH_TOKEN = "test_token"

class EndpointTester:
    def __init__(self):
        self.results = []
    
    async def test_health(self):
        """Test basic health endpoint"""
        print("\n🔍 Testing Health Endpoint...")
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/health")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
            self.results.append(("Health Check", response.status_code == 200))
    
    async def test_scraper_status(self):
        """Test scraper status endpoint (no auth required)"""
        print("\n🔍 Testing Scraper Status...")
        async with httpx.AsyncClient() as client:
            # Try without auth first
            response = await client.get(f"{BASE_URL}/api/v1/scraper/scraper/status")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print(f"Response: {response.json()}")
                self.results.append(("Scraper Status", True))
            else:
                print(f"Response: {response.text}")
                self.results.append(("Scraper Status", False))
    
    async def test_sales_agent_capabilities(self):
        """Test sales agent capabilities endpoint"""
        print("\n🔍 Testing Sales Agent Capabilities...")
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/api/v1/sales-agent/agent/capabilities")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Model: {data.get('model')}")
                print(f"Features: {list(data.get('features', {}).keys())}")
                print(f"Stages: {data.get('conversation_stages', [])}")
                self.results.append(("Sales Agent Capabilities", True))
            else:
                print(f"Response: {response.text}")
                self.results.append(("Sales Agent Capabilities", False))
    
    async def test_openapi_schema(self):
        """Test that all endpoints are in OpenAPI schema"""
        print("\n🔍 Testing OpenAPI Schema...")
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/openapi.json")
            data = response.json()
            paths = list(data.get('paths', {}).keys())
            
            scraper_endpoints = [p for p in paths if 'scraper' in p]
            sales_endpoints = [p for p in paths if 'sales-agent' in p]
            
            print(f"Total endpoints: {len(paths)}")
            print(f"Scraper endpoints: {len(scraper_endpoints)}")
            print(f"Sales-agent endpoints: {len(sales_endpoints)}")
            
            # Check for our new endpoints
            expected_scraper = [
                '/api/v1/scraper/scrape-emails',
                '/api/v1/scraper/scrape-jobs',
                '/api/v1/scraper/research-company'
            ]
            
            expected_sales = [
                '/api/v1/sales-agent/conversations/start',
                '/api/v1/sales-agent/conversations/message',
                '/api/v1/sales-agent/agent/capabilities'
            ]
            
            scraper_ok = all(ep in paths for ep in expected_scraper)
            sales_ok = all(ep in paths for ep in expected_sales)
            
            print(f"✅ Scraper endpoints registered: {scraper_ok}")
            print(f"✅ Sales-agent endpoints registered: {sales_ok}")
            
            self.results.append(("OpenAPI Schema", scraper_ok and sales_ok))
    
    async def run_all_tests(self):
        """Run all tests"""
        print("=" * 60)
        print("🚀 TESTING NEW ENDPOINTS")
        print("=" * 60)
        
        await self.test_health()
        await self.test_openapi_schema()
        await self.test_scraper_status()
        await self.test_sales_agent_capabilities()
        
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS")
        print("=" * 60)
        
        for test_name, passed in self.results:
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status} - {test_name}")
        
        total = len(self.results)
        passed = sum(1 for _, p in self.results if p)
        print(f"\n{passed}/{total} tests passed ({passed/total*100:.0f}%)")
        
        return passed == total


async def main():
    tester = EndpointTester()
    success = await tester.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
