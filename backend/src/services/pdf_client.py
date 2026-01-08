"""
PDF Client Service for Open Resume integration
Handles communication with Open Resume service for PDF generation
"""

import httpx
from typing import Optional, List, Dict, Any
import time
import re

from app.config import settings
from utils.logger import logger, log_error
from models.resume import Resume


class PDFClientService:
    """Service for generating PDFs via Open Resume"""

    def __init__(self):
        """Initialize PDF client"""
        self.base_url = settings.OPEN_RESUME_URL
        self.timeout = settings.OPEN_RESUME_API_TIMEOUT

        logger.info(f"✅ PDF Client initialized (Open Resume: {self.base_url})")

    @staticmethod
    def _format_date_range(start: Optional[str], end: Optional[str]) -> str:
        if start and end:
            return start if start == end else f"{start} - {end}"
        return start or end or ""

    @staticmethod
    def _split_description_to_bullets(description: Optional[str]) -> List[str]:
        if not description:
            return []
        primary_parts = [
            part.strip()
            for part in re.split(r"(?:\r?\n|•|\u2022|;)", description)
            if part.strip()
        ]
        if len(primary_parts) > 1:
            return primary_parts

        sentence_parts = [
            part.strip()
            for part in re.split(r"(?<=[.!?])\s+", description)
            if part.strip()
        ]
        return sentence_parts or primary_parts

    def _to_open_resume_payload(self, resume: Resume) -> Dict[str, Any]:
        profile = resume.personalInfo
        open_profile = {
            "name": profile.name,
            "summary": profile.summary or "",
            "email": profile.email,
            "phone": profile.phone or "",
            "location": profile.location or "",
            "url": profile.linkedin or profile.website or "",
            "portfolio": profile.website or "",
            "github": profile.github or "",
        }

        work_experiences = [
            {
                "company": exp.company,
                "jobTitle": exp.position,
                "date": self._format_date_range(exp.startDate, exp.endDate),
                "descriptions": exp.description,
            }
            for exp in resume.experience
        ]

        educations = [
            {
                "school": edu.institution,
                "degree": edu.degree if not edu.field else f"{edu.degree} in {edu.field}",
                "date": self._format_date_range(edu.startDate, edu.endDate),
                "gpa": edu.gpa,
                "descriptions": edu.achievements,
            }
            for edu in resume.education
        ]

        projects = []
        for project in resume.projects:
            descriptions = (
                project.highlights
                if project.highlights
                else self._split_description_to_bullets(project.description)
            )
            projects.append(
                {
                    "project": project.name,
                    "date": self._format_date_range(
                        project.startDate, project.endDate
                    ),
                    "descriptions": descriptions,
                    "url": project.link or "",
                }
            )

        skills_list = resume.skills
        skills_description = ", ".join(skills_list) if skills_list else ""

        return {
            "resume": {
                "profile": open_profile,
                "workExperiences": work_experiences,
                "educations": educations,
                "projects": projects,
                "skills": {
                    "featuredSkills": [],
                    "descriptions": [skills_description]
                    if skills_description
                    else [],
                },
                "custom": {"descriptions": []},
            },
            "settings": {
                "fontFamily": settings.OPEN_RESUME_FONT_FAMILY,
                "fontSize": settings.OPEN_RESUME_FONT_SIZE,
                "themeColor": settings.OPEN_RESUME_THEME_COLOR,
                "documentSize": settings.OPEN_RESUME_DOCUMENT_SIZE,
            },
        }

    async def generate_pdf(self, resume: Resume) -> Optional[bytes]:
        """
        Generate PDF from resume using Open Resume service

        Args:
            resume: Resume object to convert to PDF

        Returns:
            PDF bytes or None if failed
        """
        try:
            start_time = time.time()

            logger.info(f"📄 Generating PDF for: {resume.personalInfo.name}")
            logger.info(f"   Resume ID: {resume.id}")

            # Convert resume to JSON-friendly dict (ensure datetime serialization)
            # Using Pydantic's JSON encoding to handle datetimes and other types
            payload = self._to_open_resume_payload(resume)

            # Call Open Resume API
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate-pdf",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

                duration_ms = (time.time() - start_time) * 1000

                if response.status_code == 200:
                    pdf_bytes = response.content
                    pdf_size_kb = len(pdf_bytes) / 1024

                    logger.info(
                        f"✅ PDF generated successfully in {duration_ms:.2f}ms"
                    )
                    logger.info(f"   Size: {pdf_size_kb:.2f} KB")

                    return pdf_bytes
                else:
                    logger.error(
                        f"❌ Open Resume returned error: {response.status_code}"
                    )
                    logger.error(f"   Response: {response.text[:200]}")
                    return None

        except httpx.TimeoutException as e:
            logger.error(f"❌ PDF generation timeout after {self.timeout}s")
            log_error(
                e,
                {
                    "resume_id": resume.id,
                    "resume_name": resume.personalInfo.name,
                    "timeout": self.timeout,
                },
            )
            return None

        except httpx.ConnectError as e:
            logger.error(f"❌ Cannot connect to Open Resume service at {self.base_url}")
            logger.error(
                f"   Make sure Open Resume is running on {self.base_url}"
            )
            log_error(e, {"service_url": self.base_url})
            return None

        except Exception as e:
            logger.error(f"❌ Unexpected error during PDF generation: {e}")
            log_error(
                e,
                {
                    "resume_id": resume.id,
                    "resume_name": resume.personalInfo.name,
                },
            )
            return None

    async def check_service_health(self) -> bool:
        """
        Check if Open Resume service is available

        Returns:
            True if service is healthy, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/health")
                return response.status_code == 200
        except Exception:
            return False


# Singleton instance
_pdf_client: Optional[PDFClientService] = None


def get_pdf_client() -> PDFClientService:
    """Get or create PDF client instance"""
    global _pdf_client
    if _pdf_client is None:
        _pdf_client = PDFClientService()
    return _pdf_client
