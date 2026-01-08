"""
Unit tests for AI tailoring endpoint and Gemini service
"""

import pytest
from fastapi import status
import json


@pytest.mark.unit
def test_tailor_endpoint_success(test_client, sample_resume, sample_job_description, mock_gemini_client):
    """Test successful resume tailoring"""
    response = test_client.post(
        "/api/tailor",
        json={
            "resume": json.loads(sample_resume.model_dump_json()),
            "jobDescription": sample_job_description,
            "preserveStructure": True,
        },
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check response structure
    assert "tailoredResume" in data
    assert "atsScore" in data
    assert "matchedKeywords" in data
    assert "missingKeywords" in data
    assert "suggestions" in data
    assert "changes" in data
    
    # Check ATS score is valid
    assert 0 <= data["atsScore"] <= 100
    
    # Check we have keywords
    assert len(data["matchedKeywords"]) > 0


@pytest.mark.unit
def test_tailor_endpoint_retries_when_unchanged(
    test_client, sample_resume, sample_job_description, mocker
):
    """Ensure tailoring retries when AI returns an unchanged resume."""
    original_payload = {
        "tailoredResume": json.loads(sample_resume.model_dump_json()),
        "matchedKeywords": ["Python"],
        "missingKeywords": [],
        "suggestions": ["Update summary to align with role"],
        "changes": ["No changes detected"],
    }

    updated_resume = sample_resume.model_copy(deep=True)
    updated_resume.personalInfo.summary = (
        "Full-stack engineer with 5+ years optimizing Python and React systems"
    )
    updated_payload = {
        "tailoredResume": json.loads(updated_resume.model_dump_json()),
        "matchedKeywords": ["Python", "React"],
        "missingKeywords": ["Microservices"],
        "suggestions": ["Emphasize microservices leadership"],
        "changes": ["Rewrote summary and reordered skills"],
    }

    from app.config import settings

    settings.GEMINI_API_KEY = "test-key-unchanged-retry"

    mock_client = mocker.MagicMock()
    first_response = mocker.MagicMock()
    second_response = mocker.MagicMock()
    first_response.text = json.dumps(original_payload)
    second_response.text = json.dumps(updated_payload)
    mock_client.models.generate_content.side_effect = [first_response, second_response]
    mocker.patch("services.gemini.genai.Client", return_value=mock_client)

    from services import gemini as gemini_service

    gemini_service._gemini_service = None

    response = test_client.post(
        "/api/tailor",
        json={
            "resume": json.loads(sample_resume.model_dump_json()),
            "jobDescription": sample_job_description,
            "preserveStructure": True,
        },
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["tailoredResume"]["personalInfo"]["summary"] == updated_resume.personalInfo.summary
    assert mock_client.models.generate_content.call_count == 2


@pytest.mark.unit
def test_tailor_endpoint_invalid_job_description(test_client, sample_resume):
    """Test tailoring with too short job description"""
    response = test_client.post(
        "/api/tailor",
        json={
            "resume": json.loads(sample_resume.model_dump_json()),
            "jobDescription": "Too short",  # Less than 50 chars
        },
    )
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.unit
def test_tailor_endpoint_missing_resume(test_client, sample_job_description):
    """Test tailoring without resume"""
    response = test_client.post(
        "/api/tailor",
        json={
            "jobDescription": sample_job_description,
        },
    )
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.unit
def test_tailor_status_endpoint(test_client):
    """Test tailor service status check"""
    response = test_client.get("/api/tailor/status")
    
    # Should return 200 or 503 depending on configuration
    assert response.status_code in [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE]
    
    data = response.json()
    assert "status" in data


@pytest.mark.unit
def test_gemini_service_initialization():
    """Test Gemini service can be initialized"""
    from services.gemini import GeminiService
    
    # Should not raise exception with test API key
    service = GeminiService()
    assert service.model is not None


@pytest.mark.unit
def test_keyword_extraction_from_resume(sample_resume):
    """Test extracting text from resume"""
    from services.gemini import GeminiService
    
    service = GeminiService()
    text = service._extract_resume_text(sample_resume)
    
    # Check key information is extracted
    assert "John Doe" in text
    assert "Tech Corp" in text
    assert "Python" in text
    assert "FastAPI" in text


@pytest.mark.unit
def test_ats_score_calculation(sample_resume, sample_job_description):
    """Test ATS score calculation"""
    from services.gemini import GeminiService
    
    service = GeminiService()
    matched_keywords = ["Python", "React", "Docker"]
    
    score = service._calculate_ats_score(
        sample_resume,
        sample_job_description,
        matched_keywords,
    )
    
    # Score should be reasonable
    assert 0 <= score <= 100
    assert score > 20  # Should have some matches


@pytest.mark.unit
def test_json_response_parsing():
    """Test JSON response parsing from Gemini"""
    from services.gemini import GeminiService
    
    service = GeminiService()
    
    # Test with clean JSON
    clean_json = '{"key": "value"}'
    parsed = service._parse_json_response(clean_json)
    assert parsed == {"key": "value"}
    
    # Test with markdown code blocks
    markdown_json = '```json\n{"key": "value"}\n```'
    parsed = service._parse_json_response(markdown_json)
    assert parsed == {"key": "value"}
    
    # Test with invalid JSON
    invalid = 'not json'
    parsed = service._parse_json_response(invalid)
    assert parsed is None

    # Test with truncated JSON ending mid-string (should repair)
    truncated_string = '{"email": "user@example.com'
    repaired = service._parse_json_response(truncated_string)
    assert repaired == {"email": "user@example.com"}


@pytest.mark.integration
def test_full_tailoring_flow(test_client, sample_resume, sample_job_description, mock_gemini_client):
    """Integration test: Full tailoring flow"""
    # Make request
    response = test_client.post(
        "/api/tailor",
        json={
            "resume": json.loads(sample_resume.model_dump_json()),
            "jobDescription": sample_job_description,
        },
    )
    
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    
    # Verify tailored resume structure
    tailored = data["tailoredResume"]
    assert tailored["id"] == sample_resume.id
    assert tailored["personalInfo"]["name"] == sample_resume.personalInfo.name
    
    # Verify keywords
    assert len(data["matchedKeywords"]) > 0
    
    # Verify suggestions
    assert len(data["suggestions"]) > 0
    
    # Verify changes recorded
    assert len(data["changes"]) > 0
