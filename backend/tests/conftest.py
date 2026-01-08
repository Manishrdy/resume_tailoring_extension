"""
Pytest configuration and fixtures
Provides reusable test fixtures for all tests
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import os
import sys
import json

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../src'))

from app.main import app
from models.resume import (
    Resume,
    PersonalInfo,
    Education,
    Experience,
    Project,
    TailorResponse,
)


@pytest.fixture(scope="session")
def test_client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


@pytest.fixture
def sample_personal_info():
    """Sample personal information"""
    return PersonalInfo(
        name="John Doe",
        email="john.doe@example.com",
        phone="+1-555-123-4567",
        location="San Francisco, CA",
        linkedin="https://linkedin.com/in/johndoe",
        github="https://github.com/johndoe",
        website="https://johndoe.com",
        summary="Experienced software engineer with 5+ years in full-stack development",
    )


@pytest.fixture
def sample_education():
    """Sample education entries"""
    return [
        Education(
            institution="Stanford University",
            degree="Bachelor of Science",
            field="Computer Science",
            startDate="2015-09",
            endDate="2019-06",
            gpa="3.8/4.0",
            achievements=[
                "Dean's List all semesters",
                "President of CS Student Association",
            ],
        )
    ]


@pytest.fixture
def sample_experience():
    """Sample work experience entries"""
    return [
        Experience(
            company="Tech Corp",
            position="Senior Software Engineer",
            location="San Francisco, CA",
            startDate="2021-01",
            endDate="Present",
            description=[
                "Led development of microservices architecture serving 10M+ users",
                "Reduced API response time by 40% through optimization",
                "Mentored 5 junior engineers in best practices",
            ],
        ),
        Experience(
            company="StartupXYZ",
            position="Software Engineer",
            location="Palo Alto, CA",
            startDate="2019-07",
            endDate="2020-12",
            description=[
                "Developed React-based dashboard with real-time analytics",
                "Implemented CI/CD pipeline reducing deployment time by 60%",
                "Collaborated with cross-functional teams of 20+ members",
            ],
        ),
    ]


@pytest.fixture
def sample_projects():
    """Sample project entries"""
    return [
        Project(
            name="Resume Tailor",
            description="AI-powered resume optimization tool using FastAPI and React",
            technologies=["Python", "FastAPI", "React", "TypeScript", "Docker"],
            link="https://github.com/johndoe/resume-tailor",
            highlights=[
                "Integrated Google Gemini AI for intelligent resume analysis",
                "Built Chrome extension with 1000+ active users",
            ],
            startDate="2024-01",
            endDate="2024-12",
        )
    ]


@pytest.fixture
def sample_resume(
    sample_personal_info, sample_education, sample_experience, sample_projects
):
    """Complete sample resume"""
    return Resume(
        id="test-resume-001",
        name="Software Engineer Resume",
        personalInfo=sample_personal_info,
        education=sample_education,
        experience=sample_experience,
        skills=[
            "Python",
            "JavaScript",
            "TypeScript",
            "React",
            "FastAPI",
            "Docker",
            "AWS",
            "PostgreSQL",
        ],
        projects=sample_projects,
        certifications=[],
        createdAt=datetime.now(),
        updatedAt=datetime.now(),
    )


@pytest.fixture
def sample_job_description():
    """Sample job description for testing"""
    return """
    Senior Software Engineer - Full Stack

    We are seeking an experienced Full Stack Engineer to join our team.

    Requirements:
    - 5+ years of experience in software development
    - Strong proficiency in Python and JavaScript/TypeScript
    - Experience with React and modern frontend frameworks
    - Experience with FastAPI or similar backend frameworks
    - Strong understanding of microservices architecture
    - Experience with Docker and containerization
    - Excellent problem-solving and communication skills
    - Bachelor's degree in Computer Science or related field

    Responsibilities:
    - Design and implement scalable microservices
    - Lead technical architecture decisions
    - Mentor junior engineers
    - Collaborate with cross-functional teams
    - Optimize application performance

    Nice to have:
    - AWS or cloud platform experience
    - Experience with CI/CD pipelines
    - Open source contributions
    """


@pytest.fixture(autouse=True)
def env_setup(monkeypatch):
    """Set up test environment variables"""
    monkeypatch.setenv("ENVIRONMENT", "testing")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key-12345678901234567890123456789012")
    monkeypatch.setenv("OPEN_RESUME_URL", "http://localhost:3000")
    monkeypatch.setenv("OPEN_RESUME_FONT_FAMILY", "Open Sans")
    monkeypatch.setenv("OPEN_RESUME_FONT_SIZE", "11")
    monkeypatch.setenv("OPEN_RESUME_THEME_COLOR", "#000000")
    monkeypatch.setenv("OPEN_RESUME_DOCUMENT_SIZE", "A4")
    monkeypatch.setenv("LOG_LEVEL", "ERROR")  # Reduce logging in tests


@pytest.fixture
def mock_gemini_response(sample_resume):
    """Mock successful Gemini API response"""
    tailored_resume = sample_resume.model_copy(deep=True)
    # Simulate AI enhancements
    tailored_resume.personalInfo.summary = "Experienced Full Stack Engineer with 5+ years in Python and React development"
    
    return {
        "tailoredResume": json.loads(tailored_resume.model_dump_json()),
        "matchedKeywords": ["Python", "React", "Docker", "FastAPI", "TypeScript"],
        "missingKeywords": ["AWS", "PostgreSQL"],
        "suggestions": [
            "Add AWS certification to strengthen cloud expertise",
            "Quantify achievements with specific metrics",
            "Highlight leadership experience more prominently",
        ],
        "changes": [
            "Enhanced professional summary to match job requirements",
            "Incorporated 5 key technical skills from job description",
            "Optimized 3 bullet points in work experience",
        ],
    }


@pytest.fixture
def mock_gemini_client(mocker, mock_gemini_response):
    """Mock Gemini client for testing"""
    mock_client = mocker.MagicMock()
    
    # Mock the generate_content method
    mock_response = mocker.MagicMock()
    mock_response.text = json.dumps(mock_gemini_response)
    
    mock_client.models.generate_content.return_value = mock_response
    
    # Patch the Client class
    mocker.patch("services.gemini.genai.Client", return_value=mock_client)
    
    return mock_client
