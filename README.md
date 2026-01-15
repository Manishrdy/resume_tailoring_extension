# Resume Tailor AI

> AI-powered resume optimization platform with ATS scoring, intelligent tailoring, and multi-format document generation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Google Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-blue?logo=google)](https://ai.google.dev/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome)](https://developer.chrome.com/docs/extensions/)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Resume Tailor AI** is a production-ready platform that helps job seekers optimize their resumes for specific job applications using artificial intelligence. The system combines Google's Gemini AI with professional document generation to create ATS-friendly resumes that get past automated screening systems.

### Why Resume Tailor AI?

- **🤖 AI-Powered Optimization** - Gemini 2.5 Flash analyzes and tailors your resume to match job descriptions
- **📊 ATS Scoring** - Get 0-100 compatibility scores with actionable improvement suggestions
- **📄 Multi-Format Export** - Generate professional PDF and DOCX files with template-based consistency
- **🎯 Job Site Integration** - Auto-scrape job descriptions from LinkedIn, Indeed, Greenhouse, Glassdoor, and Ashby
- **🔒 Privacy-First** - All data stored locally, zero external tracking
- **⚡ Production-Ready** - Docker support, comprehensive testing (90%+ coverage), structured logging
- **🎨 Template-Based Generation** - Jinja2 templates ensure 100% format consistency between PDF and DOCX

### System Components

```
┌─────────────────────┐
│  Chrome Extension   │  ← User Interface
│  (Popup + Scraper)  │
└──────────┬──────────┘
           │ REST API
           ▼
┌─────────────────────┐
│   FastAPI Backend   │  ← Core Orchestration
│                     │
│  ┌───────────────┐  │
│  │  Gemini AI    │  │  ← Resume Tailoring
│  │  Service      │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │  Document     │  │  ← PDF/DOCX Generation
│  │  Generator    │  │     (Template-based)
│  └───────────────┘  │
└─────────────────────┘
```

---

## Key Features

### 🎯 AI Resume Tailoring

- **Smart Keyword Matching** - Automatically identify and incorporate relevant keywords from job descriptions
- **Bullet Point Optimization** - Rewrite experience bullets to highlight relevant skills and achievements
- **Skills Gap Analysis** - Identify missing skills and suggest improvements
- **Professional Summary Rewriting** - Tailor your summary to match job requirements
- **Contextual Understanding** - AI maintains factual accuracy while optimizing language

### 📊 ATS Compatibility

- **0-100 Scoring System** - Quantitative assessment of resume compatibility
- **Keyword Analysis** - See exactly which keywords are matched or missing
- **Actionable Suggestions** - Specific recommendations to improve your score
- **Industry Standards** - Follows ATS best practices for formatting and structure

### 📄 Document Generation

#### Template-Based System (Current)
- **DOCX Templates** - Jinja2-powered Word templates for strict formatting
- **100% Format Consistency** - Identical layout in both PDF and DOCX
- **ATS-Friendly Design** - Single-column layout, standard fonts, proper spacing
- **Easy Customization** - Edit templates directly in Microsoft Word

#### Supported Formats
- **PDF** - ATS-optimized, professional layout (converted from DOCX)
- **DOCX** - Fully editable Word documents with preserved formatting

### 🌐 Job Site Support

Built-in scrapers for major job platforms:

| Platform | Status | Features |
|----------|--------|----------|
| LinkedIn | ✅ Active | Title, company, description, location |
| Indeed | ✅ Active | Full job details and requirements |
| Greenhouse | ✅ Active | Complete job postings |
| Glassdoor | ✅ Active | Job details and company info |
| Ashby | ✅ Active | Technical role details |
| Manual Entry | ✅ Active | Paste any job description |

### 🔧 Chrome Extension Features

- **Profile Management** - Create and manage multiple resume versions
- **Auto-Save** - Never lose your work with automatic saving
- **History Tracking** - Review all previously tailored resumes
- **Dark/Light Theme** - Choose your preferred interface
- **Import/Export** - Backup and restore your resume profiles
- **Real-time Validation** - Input validation with helpful error messages

---

## Architecture

### Technology Stack

#### Backend (FastAPI)
```python
Framework:    FastAPI 0.109.0
Server:       Uvicorn (ASGI)
AI Engine:    Google Gemini 2.5 Flash (google-genai 0.2.0)
Validation:   Pydantic 2.5.3
Documents:    docxtpl 0.18.0 + python-docx 1.1.0 + docx2pdf 0.1.8
Logging:      Loguru 0.7.2
Testing:      pytest 7.4.4 + pytest-asyncio + pytest-cov
```

#### Frontend (Chrome Extension)
```javascript
Language:     Vanilla JavaScript (ES6+)
UI:           HTML5/CSS3
Storage:      Chrome Storage API
Manifest:     V3 (modern Chrome extension standard)
```

#### Document Generation
```
Template Engine:  Jinja2 3.1.3
DOCX Creation:    docxtpl 0.18.0 (template-based)
DOCX → PDF:       docx2pdf 0.1.8 (Windows, preserves 100% formatting)
Fallback:         ReportLab 4.0.9 (deprecated)
```

#### Infrastructure
```yaml
Containerization:   Docker + Docker Compose
Orchestration:      Make commands for simplified workflows
Logging:            File-based with rotation (logs/app.log, logs/gemini.log)
Monitoring:         Health check endpoints with service status
```

### Data Flow

```
1. User opens job posting
   ↓
2. Extension scrapes job description
   ↓
3. User clicks "Tailor Resume"
   ↓
4. POST /api/tailor → FastAPI Backend
   ↓
5. Gemini AI analyzes job + resume
   ↓
6. Return tailored resume + ATS score + keywords
   ↓
7. User clicks "Download PDF" or "Download DOCX"
   ↓
8. POST /api/generate-pdf or /api/generate-docx
   ↓
9. Document Generator creates file from template
   ↓
10. Browser downloads professional resume
```

---

## Quick Start

### Prerequisites

- **Python 3.11+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/)) - Optional, for development
- **Google Gemini API Key** ([Get Free Key](https://ai.google.dev/))
- **Chrome Browser** ([Download](https://www.google.com/chrome/))
- **Docker** ([Download](https://www.docker.com/)) - Recommended for production

### 5-Minute Setup

```bash
# 1. Clone repository
git clone https://github.com/Manishrdy/resume_tailoring_extension.git
cd resume_tailoring_extension

# 2. Setup environment
make setup
# OR manually:
cp backend/.env.example backend/.env
# Edit backend/.env and add: GEMINI_API_KEY=your_actual_key_here

# 3. Start with Docker (Recommended)
make prod
# Services will start at:
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs

# 4. Load Chrome Extension
# Open chrome://extensions/
# Enable "Developer mode" (top right)
# Click "Load unpacked"
# Select the extension/ folder

# 5. Verify installation
make health
# Should return: {"status": "healthy", ...}
```

### Alternative: Manual Setup (Development)

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cd src
uvicorn app.main:app --reload --port 8000

# Extension (in new terminal)
cd extension
# Load in Chrome as described above
```

---

## Installation

### Option 1: Docker (Production - Recommended)

```bash
# Clone repository
git clone https://github.com/Manishrdy/resume_tailoring_extension.git
cd resume_tailoring_extension

# Setup environment
make setup

# Edit backend/.env and configure:
nano backend/.env
# Required: GEMINI_API_KEY=your_actual_key_here

# Start all services
make prod

# View logs
make logs

# Check health
make health
```

**Available Make Commands:**

```bash
make help              # Show all available commands
make install           # Install Python dependencies
make dev               # Start in development mode (hot-reload)
make prod              # Start in production mode
make stop              # Stop all services
make logs              # View all logs
make test              # Run test suite
make test-coverage     # Run tests with coverage report
make clean             # Clean up containers and cache
make rebuild           # Rebuild and restart
```

### Option 2: Manual Installation

#### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
.\venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Add your GEMINI_API_KEY

# Run backend
cd src
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Chrome Extension Setup

```bash
# No build step required for basic usage

# Load in Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode" (toggle in top-right)
# 3. Click "Load unpacked"
# 4. Select the extension/ folder
# 5. Pin the extension to your toolbar
```

---

## Configuration

### Backend Environment Variables

Create `backend/.env`:

```ini
# =======================
# Environment
# =======================
ENVIRONMENT=production
DEBUG=false

# =======================
# API Configuration
# =======================
API_HOST=0.0.0.0
API_PORT=8000
API_URL=http://localhost:8000

# =======================
# CORS Settings
# =======================
CORS_ORIGINS=chrome-extension://*,http://localhost:*,https://yourdomain.com

# =======================
# Google Gemini AI
# =======================
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=8192
GEMINI_TIMEOUT=30
GEMINI_RETRY_ATTEMPTS=3

# =======================
# Logging
# =======================
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_ROTATION=10 MB
LOG_RETENTION=30 days

# =======================
# Request Settings
# =======================
REQUEST_TIMEOUT=60
MAX_RESUME_SIZE=5242880  # 5MB
MAX_JOB_DESCRIPTION_LENGTH=50000
```

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | - | ✅ Yes |
| `GEMINI_MODEL` | AI model version | `gemini-2.0-flash-exp` | No |
| `GEMINI_TEMPERATURE` | AI creativity (0.0-1.0) | `0.7` | No |
| `API_PORT` | Backend port | `8000` | No |
| `LOG_LEVEL` | Logging level | `INFO` | No |
| `ENVIRONMENT` | Environment mode | `development` | No |

### Extension Configuration

Configure via the Settings panel in the extension:

- **API URL**: Backend endpoint (default: `http://localhost:8000`)
- **Auto-save**: Enable automatic profile saving
- **Theme**: Dark or light mode
- **Download Location**: Where PDFs are saved

---

## Usage

### Creating Your First Resume

1. **Open the Extension**
   - Click the Resume Tailor AI icon in Chrome toolbar
   - Or use the keyboard shortcut (if configured)

2. **Create a Profile**
   - Click "New Profile" or "Add Resume"
   - Fill in the form:
     - **Personal Info**: Name, email, phone, location, LinkedIn, GitHub, portfolio
     - **Summary**: Professional summary (2-3 sentences)
     - **Experience**: Company, role, dates, bullet points (achievements)
     - **Education**: Institution, degree, dates, GPA (optional)
     - **Skills**: Technical and soft skills (comma-separated)
     - **Projects**: Optional portfolio projects
     - **Certifications**: Optional professional certifications
   - Click "Save Profile"

3. **Name Your Profile**
   - Use descriptive names: "Software Engineer - Backend", "Data Scientist - ML"
   - Helps when managing multiple resume versions

### Tailoring for a Job

1. **Navigate to Job Posting**
   - Visit supported job sites (LinkedIn, Indeed, Greenhouse, Glassdoor, Ashby)
   - Open the specific job you want to apply for

2. **Scrape Job Description**
   - Click the extension icon
   - Select your resume profile
   - Click "Scrape Job Description"
   - Review extracted text (edit if needed)
   - Alternatively: Click "Manual Entry" to paste job description

3. **Tailor Resume**
   - Click "Tailor Resume"
   - Wait 10-20 seconds (AI processing time)
   - Review results:
     - **ATS Score**: 0-100 compatibility rating
     - **Matched Keywords**: Skills found in your resume
     - **Missing Keywords**: Important skills to add
     - **Suggestions**: Specific improvements

4. **Review Tailored Content**
   - See side-by-side comparison (original vs. tailored)
   - Verify all factual information is preserved
   - Check that optimizations make sense

### Generating Documents

1. **Download PDF**
   - Click "Download PDF" button
   - PDF generates in 1-2 seconds
   - File saved to Downloads folder
   - Naming: `resume_tailored_YYYY-MM-DD_JobTitle.pdf`

2. **Download DOCX**
   - Click "Download DOCX" button
   - Editable Word document
   - Same formatting as PDF (template-based)
   - Modify further if needed

3. **Document Features**
   - ATS-friendly single-column layout
   - Professional fonts (Arial, Calibri)
   - Proper spacing and margins
   - Clean, readable design
   - A4/Letter size compatible

### Managing Profiles

1. **Multiple Resumes**
   - Create different profiles for different job types
   - Examples:
     - "Backend Engineer - Python/Node.js"
     - "Frontend Developer - React/Vue"
     - "Full Stack - MERN"

2. **Switch Profiles**
   - Use dropdown in extension
   - Select active profile
   - All changes auto-save

3. **Export/Import**
   - Export profiles as JSON backup
   - Import to restore or transfer
   - Settings → Export/Import Profiles

### History Management

1. **View History**
   - Click "History" tab
   - See all tailored resumes
   - Sorted by date (newest first)

2. **Access Past Resumes**
   - Click entry to view details
   - Re-download PDF/DOCX
   - Review ATS scores

3. **Delete Entries**
   - Remove unwanted history items
   - Files remain in Downloads folder

---

## API Documentation

### Base URL

```
http://localhost:8000
```

### Endpoints

#### 1. Health Check

Check backend service health and status.

```http
GET /api/health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "services": {
    "fastapi": "running",
    "gemini": "available",
    "document_generator": "available"
  },
  "timestamp": "2026-01-14T10:30:00Z"
}
```

---

#### 2. Tailor Resume

Optimize resume content for a specific job description using AI.

```http
POST /api/tailor
Content-Type: application/json
```

**Request Body**:
```json
{
  "resume": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-234-567-8900",
    "location": "San Francisco, CA",
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe",
    "website": "https://johndoe.com",
    "summary": "Software engineer with 5 years of experience in backend development...",
    "experience": [
      {
        "company": "Tech Corp",
        "position": "Senior Backend Engineer",
        "startDate": "2020-01",
        "endDate": "2025-01",
        "location": "San Francisco, CA",
        "bullets": [
          "Built scalable microservices using Python and FastAPI",
          "Improved system performance by 40% through optimization",
          "Led team of 5 engineers on cloud migration project"
        ]
      }
    ],
    "education": [
      {
        "institution": "Stanford University",
        "degree": "Bachelor of Science",
        "field": "Computer Science",
        "startDate": "2015-09",
        "endDate": "2019-06",
        "gpa": "3.8"
      }
    ],
    "skills": ["Python", "FastAPI", "Docker", "AWS", "PostgreSQL", "Redis"],
    "projects": [
      {
        "name": "Open Source Contributor",
        "description": "Contributed to popular Python libraries",
        "technologies": ["Python", "Git"],
        "url": "https://github.com/johndoe/project"
      }
    ],
    "certifications": [
      {
        "name": "AWS Certified Solutions Architect",
        "issuer": "Amazon Web Services",
        "date": "2023-05"
      }
    ]
  },
  "jobDescription": "We're looking for a Senior Backend Engineer with Python expertise. You'll build scalable microservices, optimize performance, and work with AWS cloud infrastructure. Requirements: 5+ years Python, FastAPI/Django, Docker, Kubernetes, AWS, PostgreSQL."
}
```

**Response** (200 OK):
```json
{
  "tailored_resume": {
    "name": "John Doe",
    "email": "john@example.com",
    "summary": "Backend engineer with 5+ years specializing in Python microservices, FastAPI, and AWS cloud infrastructure. Proven track record of building scalable systems and optimizing performance...",
    "experience": [
      {
        "company": "Tech Corp",
        "position": "Senior Backend Engineer",
        "bullets": [
          "Architected and deployed scalable microservices using Python and FastAPI, handling 10M+ requests/day",
          "Optimized system performance by 40% through database query optimization and Redis caching",
          "Led cloud migration to AWS, implementing Docker containerization and Kubernetes orchestration"
        ]
      }
    ],
    "skills": ["Python", "FastAPI", "Docker", "Kubernetes", "AWS", "PostgreSQL", "Redis", "Microservices"]
  },
  "ats_score": 92,
  "matched_keywords": [
    "Python",
    "FastAPI",
    "Microservices",
    "Docker",
    "AWS",
    "PostgreSQL",
    "Performance Optimization",
    "Scalable Systems"
  ],
  "missing_keywords": [
    "Kubernetes",
    "CI/CD",
    "REST API"
  ],
  "suggestions": [
    "Add Kubernetes experience to skills and work bullets",
    "Mention CI/CD pipeline implementation if applicable",
    "Quantify microservices scale (e.g., requests/day, number of services)",
    "Highlight specific AWS services used (EC2, RDS, Lambda, etc.)"
  ]
}
```

**Error Responses**:

```json
// 422 Validation Error
{
  "detail": [
    {
      "loc": ["body", "resume", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}

// 500 AI Processing Error
{
  "detail": "AI processing failed: Connection timeout"
}
```

---

#### 3. Generate PDF

Create ATS-friendly PDF from resume data using template-based generation.

```http
POST /api/generate-pdf
Content-Type: application/json
```

**Request Body**:
```json
{
  "resume": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-234-567-8900",
    "summary": "Software engineer...",
    "experience": [...],
    "education": [...],
    "skills": [...],
    "projects": [...],
    "certifications": [...]
  }
}
```

**Response** (200 OK):
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="resume_john_doe.pdf"

[PDF Binary Data]
```

**Features**:
- ATS-optimized single-column layout
- Professional fonts (Arial, Calibri)
- Proper spacing and margins
- Template-based (100% consistent with DOCX)

---

#### 4. Generate DOCX

Create editable Word document from resume data.

```http
POST /api/generate-docx
Content-Type: application/json
```

**Request Body**: Same as PDF endpoint

**Response** (200 OK):
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="resume_john_doe.docx"

[DOCX Binary Data]
```

**Features**:
- Fully editable in Microsoft Word
- Identical formatting to PDF
- Template-based with Jinja2
- Clean structure for further customization

---

#### 5. Document Service Status

Get information about document generation capabilities.

```http
GET /api/document/status
```

**Response** (200 OK):
```json
{
  "status": "available",
  "formats": ["PDF", "DOCX"],
  "template_engine": "Jinja2 + docxtpl",
  "pdf_generator": "docx2pdf (template-based)",
  "version": "2.0.0",
  "features": {
    "format_consistency": "100%",
    "template_based": true,
    "editable_docx": true,
    "ats_optimized": true
  }
}
```

---

### Interactive Documentation

When backend is running, visit:

- **Swagger UI** (interactive): http://localhost:8000/docs
- **ReDoc** (reference): http://localhost:8000/redoc

Test endpoints directly in the browser with Swagger UI.

---

## Development

### Running in Development Mode

#### Backend with Hot Reload

```bash
# Using Make
make dev

# Or manually
cd backend/src
uvicorn app.main:app --reload --port 8000 --log-level debug
```

#### Extension Development

```bash
cd extension

# Make changes to files
# Reload extension in chrome://extensions/
# Click the refresh icon for "Resume Tailor AI"

# Test changes immediately
```

### Code Quality

#### Python (Backend)

```bash
cd backend

# Format code
black src/

# Lint code
flake8 src/ --max-line-length=100

# Type checking
mypy src/

# Run all checks
black src/ && flake8 src/ && mypy src/ && pytest
```

**Style Guide**: PEP 8 (Black formatter)

#### JavaScript (Extension)

```bash
# Use ESLint (if configured)
npm run lint

# Format with Prettier (if configured)
npm run format
```

**Style Guide**: Airbnb JavaScript + ES6+

### Adding New Features

#### New API Endpoint

1. Create route in `backend/src/app/api/`
2. Define Pydantic models in `backend/src/models/`
3. Implement service logic in `backend/src/services/`
4. Add tests in `backend/tests/`
5. Update API documentation

**Example**:

```python
# backend/src/app/api/analyze.py
from fastapi import APIRouter, HTTPException
from models.resume import Resume
from services.analyzer import analyze_resume

router = APIRouter(prefix="/api", tags=["analyze"])

@router.post("/analyze")
async def analyze_resume_endpoint(resume: Resume):
    """Analyze resume for improvements."""
    try:
        analysis = await analyze_resume(resume)
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### New Job Site Scraper

1. Identify site's HTML structure using browser DevTools
2. Add scraper function in `extension/content/scraper.js`
3. Update site detection logic
4. Test on multiple live job postings
5. Handle edge cases (missing fields, dynamic content)

**Example**:

```javascript
// extension/content/scraper.js
function scrapeMonster() {
    return {
        title: document.querySelector('.job-title')?.textContent?.trim(),
        company: document.querySelector('.company-name')?.textContent?.trim(),
        location: document.querySelector('.location')?.textContent?.trim(),
        description: document.querySelector('.job-description')?.textContent?.trim()
    };
}

// Add to PRIMARY_SOURCES
if (hostname.includes('monster.com')) {
    return scrapeMonster();
}
```

### Debugging

#### Backend Debugging

```bash
# Enable debug logging
# Edit backend/.env:
LOG_LEVEL=DEBUG
DEBUG=true

# View logs in real-time
tail -f backend/logs/app.log
tail -f backend/logs/gemini.log

# Or with Docker
make logs-api
```

#### Extension Debugging

```bash
# Open extension popup
# Right-click → Inspect

# View console logs
# Check Network tab for API calls

# Test content script
# Open any webpage
# F12 → Console
# Check for scraper errors
```

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov=models --cov=services --cov-report=html --cov-report=term

# Run specific test file
pytest tests/test_tailor.py -v

# Run with debug output
pytest -s

# Run tests matching pattern
pytest -k "test_health"
```

### Test Coverage

Current coverage: **92%**

Test modules:
- `test_health.py` - Health check endpoints (3 tests)
- `test_tailor.py` - AI tailoring logic (8 tests)
- `test_pdf.py` - PDF generation (5 tests)
- `test_models.py` - Pydantic validation (12 tests)
- `test_document_generator.py` - Document generation (6 tests)

### Coverage Report

```bash
make test-coverage

# Open HTML report
open backend/htmlcov/index.html  # macOS
start backend/htmlcov/index.html  # Windows
xdg-open backend/htmlcov/index.html  # Linux
```

### Integration Testing

```bash
# 1. Start services
make dev

# 2. Run integration tests
cd backend
pytest tests/integration/ -v

# 3. Manual end-to-end test
# - Create resume in extension
# - Scrape job description
# - Tailor resume
# - Generate PDF
# - Verify output
```

### Manual Testing Checklist

- [ ] Backend starts without errors
- [ ] API health check returns 200
- [ ] Extension loads in Chrome
- [ ] Can create resume profile
- [ ] Can scrape job from LinkedIn
- [ ] Can scrape job from Indeed
- [ ] AI tailoring completes successfully
- [ ] ATS score is 0-100
- [ ] Keywords are accurate
- [ ] PDF downloads successfully
- [ ] DOCX downloads successfully
- [ ] Documents are ATS-friendly
- [ ] History tracking works
- [ ] Profile switching works
- [ ] Export/Import works
- [ ] Dark mode toggle works

---

## Deployment

### Docker Deployment (Recommended)

#### Production on Server

```bash
# 1. Clone on server
git clone https://github.com/Manishrdy/resume_tailoring_extension.git
cd resume_tailoring_extension

# 2. Configure environment
cp backend/.env.example backend/.env
nano backend/.env
# Add: GEMINI_API_KEY=your_production_key
# Set: ENVIRONMENT=production
# Set: LOG_LEVEL=INFO

# 3. Build and start
make prod

# 4. Check logs
make logs

# 5. Verify health
curl http://localhost:8000/api/health
```

#### Production Environment Variables

```ini
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
LOG_FORMAT=json
GEMINI_API_KEY=your_production_key
API_URL=https://api.yourdomain.com
CORS_ORIGINS=chrome-extension://*,https://yourdomain.com
```

### Cloud Deployment

#### AWS EC2

```bash
# 1. Launch Ubuntu 22.04 instance
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 3. Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# 4. Clone and setup
git clone https://github.com/Manishrdy/resume_tailoring_extension.git
cd resume_tailoring_extension
make setup

# 5. Configure .env
nano backend/.env

# 6. Start services
make prod

# 7. Configure security group
# Allow ports: 8000 (API)
```

#### Google Cloud Run

```bash
# Build container
docker build -t gcr.io/PROJECT_ID/resume-tailor-api backend/

# Push to GCR
docker push gcr.io/PROJECT_ID/resume-tailor-api

# Deploy
gcloud run deploy resume-tailor-api \
  --image gcr.io/PROJECT_ID/resume-tailor-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key
```

#### DigitalOcean App Platform

```yaml
# app.yaml
name: resume-tailor-api
services:
  - name: api
    dockerfile_path: backend/Dockerfile
    github:
      repo: Manishrdy/resume_tailoring_extension
      branch: main
    envs:
      - key: GEMINI_API_KEY
        value: your_key
        type: SECRET
    http_port: 8000
```

### Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/resume-tailor
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Publishing Chrome Extension

1. **Prepare for Publishing**

```bash
cd extension

# Create production manifest
# Update manifest.json:
# - Set production API URL
# - Update version number
# - Add privacy policy URL

# Create ZIP
zip -r resume-tailor-extension.zip . -x "*.git*" -x "node_modules/*"
```

2. **Chrome Web Store**

- Visit [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- Pay $5 one-time developer fee
- Upload `resume-tailor-extension.zip`
- Fill in store listing:
  - Name: Resume Tailor AI
  - Description: AI-powered resume optimizer
  - Category: Productivity
  - Language: English
- Add screenshots (1280x800 or 640x400)
- Add privacy policy URL
- Submit for review (typically 1-3 days)

---

## Project Structure

```
resume-tailor/
├── backend/                              # FastAPI Backend
│   ├── src/
│   │   ├── app/
│   │   │   ├── main.py                  # FastAPI app initialization
│   │   │   ├── config.py                # Pydantic Settings
│   │   │   └── api/
│   │   │       ├── health.py            # Health endpoints
│   │   │       ├── tailor.py            # AI tailoring endpoint
│   │   │       └── pdf.py               # Document generation
│   │   ├── models/
│   │   │   └── resume.py                # Pydantic models
│   │   ├── services/
│   │   │   ├── gemini.py                # Gemini AI client
│   │   │   └── document_generator.py    # PDF/DOCX generation
│   │   ├── prompts/
│   │   │   └── tailoring.py             # AI prompt templates
│   │   └── utils/
│   │       ├── logger.py                # Loguru setup
│   │       └── artifacts.py             # File storage
│   ├── tests/                           # Test suite (92% coverage)
│   │   ├── test_health.py
│   │   ├── test_tailor.py
│   │   ├── test_pdf.py
│   │   ├── test_models.py
│   │   ├── test_document_generator.py
│   │   └── conftest.py
│   ├── logs/                            # Application logs
│   ├── artifacts/                       # Generated documents
│   ├── requirements.txt                 # Python dependencies
│   ├── Dockerfile                       # Container config
│   └── .env.example                     # Environment template
│
├── extension/                           # Chrome Extension
│   ├── manifest.json                    # Extension config (V3)
│   ├── popup/
│   │   ├── popup.html                   # Extension UI
│   │   └── popup.js                     # UI logic
│   ├── background/
│   │   └── background.js                # Service worker
│   ├── content/
│   │   └── scraper.js                   # Job scraper
│   └── assets/
│       ├── js/
│       │   ├── api.js                   # API client
│       │   └── storage.js               # Storage wrapper
│       ├── css/
│       │   └── styles.css               # Styling
│       └── icons/                       # Extension icons
│
├── docker-compose.yml                   # Production orchestration
├── docker-compose.dev.yml               # Development orchestration
├── Makefile                             # Command shortcuts
├── .gitignore                           # Git exclusions
├── README.md                            # This file
└── LICENSE                              # MIT License
```

---

## Troubleshooting

### Common Issues

#### Backend Won't Start

**Error**: `ModuleNotFoundError: No module named 'app'`

```bash
# Solution: Run from correct directory
cd backend/src
uvicorn app.main:app --reload
```

**Error**: `Connection refused to Gemini API`

```bash
# Solution: Check API key
cat backend/.env | grep GEMINI_API_KEY

# Test API key
curl -H "Authorization: Bearer YOUR_KEY" \
  https://generativelanguage.googleapis.com/v1/models
```

**Error**: `Port 8000 already in use`

```bash
# Solution: Find and kill process
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8000 | xargs kill -9
```

#### Extension Issues

**Error**: `Extension popup is blank`

```bash
# Solutions:
# 1. Check browser console (F12 on popup)
# 2. Verify API URL in extension settings
# 3. Check CORS in backend/.env
# 4. Reload extension in chrome://extensions/
```

**Error**: `API connection failed`

```bash
# Solution: Verify backend is running
curl http://localhost:8000/api/health

# Check CORS settings in backend/.env
CORS_ORIGINS=chrome-extension://*
```

**Error**: `Job scraping returns empty`

```bash
# Solutions:
# 1. Check if site structure changed
# 2. Use "Manual Entry" option
# 3. Open browser console and check for errors
# 4. Report issue with job posting URL
```

#### Document Generation

**Error**: `PDF generation failed: docx2pdf not found`

```bash
# Solution: docx2pdf requires Microsoft Word (Windows only)
# Alternatives:
# 1. Use DOCX format (always works)
# 2. Install LibreOffice and use unoconv
# 3. Deploy on Windows server
```

**Error**: `DOCX missing content`

```bash
# Solution: Check template file
ls backend/templates/resume_template.docx

# Verify template variables
# Check logs for template errors
tail -f backend/logs/app.log
```

#### AI Processing

**Error**: `Gemini API timeout`

```bash
# Solution: Increase timeout
# Edit backend/.env:
GEMINI_TIMEOUT=60

# Or reduce resume/JD size
# Check token count in logs
```

**Error**: `Rate limit exceeded`

```bash
# Solution:
# 1. Wait 60 seconds (free tier limit)
# 2. Upgrade Gemini API plan
# 3. Implement request queuing
```

### Debug Mode

Enable comprehensive debugging:

```bash
# backend/.env
DEBUG=true
LOG_LEVEL=DEBUG
ENVIRONMENT=development

# View all logs
tail -f backend/logs/app.log
tail -f backend/logs/gemini.log
tail -f backend/logs/error.log
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/api/health

# Check all services
make health

# Expected response:
{
  "status": "healthy",
  "services": {
    "fastapi": "running",
    "gemini": "available",
    "document_generator": "available"
  }
}
```

### Getting Help

1. **Check Logs**: Most issues show up in logs
   - Backend: `backend/logs/app.log`
   - Extension: F12 → Console
   - Docker: `make logs`

2. **Search Issues**: [GitHub Issues](https://github.com/Manishrdy/resume_tailoring_extension/issues)

3. **Open Issue**: Include:
   - OS and version
   - Python/Node.js version
   - Error messages
   - Steps to reproduce
   - Logs (remove API keys!)

---

## Contributing

We welcome contributions! This project is designed to be beginner-friendly.

### How to Contribute

1. **Fork the Repository**
   - Visit [GitHub Repo](https://github.com/Manishrdy/resume_tailoring_extension)
   - Click "Fork"

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/resume_tailoring_extension.git
   cd resume_tailoring_extension
   ```

3. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number
   ```

4. **Make Changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests for new features
   - Update documentation

5. **Test Your Changes**
   ```bash
   make test
   make test-coverage
   ```

6. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   git push origin feature/your-feature-name
   ```

7. **Open Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Fill in description
   - Link related issues

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new job scraper for Monster.com
fix: resolve PDF generation timeout
docs: update API documentation
test: add tests for tailor endpoint
refactor: simplify Gemini service
chore: update dependencies
```

### Code Style

**Python**: PEP 8 (Black formatter, line length 88)
**JavaScript**: Airbnb + ES6+

### Areas to Contribute

- **Good First Issues**: Beginner-friendly tasks
- **Job Scrapers**: Add support for more job sites
- **AI Prompts**: Improve tailoring quality
- **UI/UX**: Extension interface improvements
- **Documentation**: Guides and tutorials
- **Testing**: Increase test coverage
- **Templates**: New resume designs

---

## Performance

### Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| Resume Tailoring | 10-20s | Gemini AI processing |
| PDF Generation | 1-2s | Template-based |
| DOCX Generation | 0.5-1s | Template-based |
| Job Scraping | <1s | Instant |
| Extension Popup | <100ms | Fast load |
| API Response | <50ms | Excluding AI/docs |

### Optimization Tips

**Reduce Tailoring Time**:
- Use `gemini-2.0-flash-exp` (fastest model)
- Reduce `GEMINI_MAX_TOKENS` if responses too long
- Keep job descriptions concise (<5000 chars)

**Improve Document Speed**:
- Simplify resume template
- Reduce number of sections
- Minimize custom formatting

**Extension Performance**:
- Limit profiles to <10
- Clear history periodically
- Use pagination for large lists

---

## Security

### Best Practices

- ✅ API keys in `.env` files (never committed)
- ✅ CORS restricted to specific origins
- ✅ Input validation via Pydantic
- ✅ Rate limiting (implement in production)
- ✅ Data stored locally (privacy-first)
- ✅ HTTPS in production
- ✅ Regular dependency updates
- ✅ Minimal extension permissions

### Security Checklist

- [ ] `.env` files in `.gitignore`
- [ ] CORS configured for production
- [ ] API keys stored securely
- [ ] No sensitive data in logs
- [ ] HTTPS enabled in production
- [ ] Dependencies up to date
- [ ] Extension permissions minimal
- [ ] Input sanitization enabled

---

## Roadmap

### Upcoming Features

- [ ] Multiple resume templates (modern, classic, minimal)
- [ ] Cover letter generation
- [ ] LinkedIn profile optimization
- [ ] Resume comparison tool
- [ ] A/B testing for resume versions
- [ ] Analytics dashboard
- [ ] Team collaboration
- [ ] Resume version history
- [ ] Custom branding (colors, fonts)
- [ ] Integration with job boards

### Under Consideration

- [ ] Mobile app (React Native)
- [ ] Web interface (Next.js)
- [ ] API rate limiting
- [ ] User authentication
- [ ] Cloud storage sync
- [ ] Premium features

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Manish Reddy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

You are free to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Use privately
- ✅ Sublicense

---

## Acknowledgments

### Technologies

This project is built with:

- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python web framework
- **[Google Gemini AI](https://ai.google.dev/)** - AI-powered resume optimization
- **[Pydantic](https://docs.pydantic.dev/)** - Data validation
- **[ReportLab](https://www.reportlab.com/)** - PDF generation (fallback)
- **[python-docx](https://python-docx.readthedocs.io/)** - DOCX manipulation
- **[docxtpl](https://docxtpl.readthedocs.io/)** - Jinja2 templates for DOCX
- **[Loguru](https://github.com/Delgan/loguru)** - Python logging
- **[pytest](https://pytest.org/)** - Testing framework

### Contributors

- **Manish Reddy** ([@Manishrdy](https://github.com/Manishrdy)) - Creator & Maintainer
- **Claude Sonnet 4.5** - AI Development Assistant

### Special Thanks

- Google Gemini team for powerful AI API
- FastAPI community for excellent documentation
- Chrome Extensions team for developer tools
- Open source community for inspiration

---

## Support

### Documentation

- **README**: You're reading it!
- **API Docs**: http://localhost:8000/docs
- **GitHub Issues**: [Report bugs](https://github.com/Manishrdy/resume_tailoring_extension/issues)

### Contact

- **GitHub**: [@Manishrdy](https://github.com/Manishrdy)
- **Email**: Contact via GitHub
- **Issues**: [GitHub Issues](https://github.com/Manishrdy/resume_tailoring_extension/issues)

### Show Your Support

If you find Resume Tailor AI helpful:

- ⭐ Star this repository
- 🐛 Report bugs
- 💡 Suggest features
- 🔀 Contribute code
- 📖 Improve documentation
- 📢 Share with others

---

## Project Stats

- **Lines of Code**: 6,000+
- **Test Coverage**: 92%
- **API Endpoints**: 5
- **Supported Job Sites**: 5+
- **Document Formats**: PDF, DOCX
- **AI Model**: Gemini 2.5 Flash
- **Language**: Python, JavaScript
- **License**: MIT
- **Status**: Production Ready ✅

---

**Made with ❤️ for job seekers everywhere**

*Helping you land your dream job, one tailored resume at a time.*

---

## Quick Links

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [GitHub Repository](https://github.com/Manishrdy/resume_tailoring_extension)
- [Report Bug](https://github.com/Manishrdy/resume_tailoring_extension/issues/new)
- [Request Feature](https://github.com/Manishrdy/resume_tailoring_extension/issues/new)

---

**Version**: 2.0.0
**Last Updated**: January 14, 2026
**Status**: 🟢 Production Ready
