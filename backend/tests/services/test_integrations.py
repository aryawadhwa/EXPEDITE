import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.integrations import HunterIntegration, LLMService

@pytest.fixture
def mock_httpx_client():
    with patch("httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_client.return_value = mock_instance
        yield mock_instance

@pytest.mark.asyncio
async def test_hunter_domain_search_success(mock_httpx_client):
    # Setup mock response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": {
            "emails": [
                {"value": "test1@stripe.com", "confidence": 95, "first_name": "Test1", "last_name": "User"},
                {"value": "test2@stripe.com", "confidence": 40, "first_name": "Test2", "last_name": "User"} # Should be filtered out (<70)
            ]
        }
    }
    mock_httpx_client.get.return_value = mock_response

    async with HunterIntegration() as hunter:
        hunter.api_key = "test_key"
        results = await hunter.domain_search("stripe.com")

    # Assertions
    assert len(results) == 1
    assert results[0]["email"] == "test1@stripe.com"
    assert results[0]["score"] == 95
    assert results[0]["verified"] is True
    
    mock_httpx_client.get.assert_called_once()
    args, kwargs = mock_httpx_client.get.call_args
    assert "domain-search" in args[0]
    assert kwargs["params"]["domain"] == "stripe.com"

@pytest.mark.asyncio
async def test_hunter_find_email_success(mock_httpx_client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": {
            "email": "elon@tesla.com",
            "score": 99,
            "status": "valid"
        }
    }
    mock_httpx_client.get.return_value = mock_response

    async with HunterIntegration() as hunter:
        hunter.api_key = "test_key"
        result = await hunter.find_email("Elon", "Musk", "tesla.com")

    assert result["email"] == "elon@tesla.com"
    assert result["verified"] is True
    assert result["score"] == 99

@pytest.mark.asyncio
async def test_llm_service_fallback():
    service = LLMService()
    
    # Mock Groq to fail and OpenAI to succeed
    service.groq.generate_json = AsyncMock(return_value={})
    service.openai.generate_json = AsyncMock(return_value={"success": True})
    
    result = await service.generate_json("Test prompt")
    
    # Ensure it returned the OpenAI result
    assert result == {"success": True}
    service.groq.generate_json.assert_called_once_with("Test prompt")
    service.openai.generate_json.assert_called_once_with("Test prompt")
