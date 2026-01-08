"""
Tests for Open Resume PDF client settings mapping.
"""

from app.config import settings
from services.pdf_client import PDFClientService


def test_pdf_payload_includes_open_resume_settings(sample_resume):
    settings.OPEN_RESUME_FONT_FAMILY = "Roboto"
    settings.OPEN_RESUME_FONT_SIZE = 10
    settings.OPEN_RESUME_THEME_COLOR = "#112233"
    settings.OPEN_RESUME_DOCUMENT_SIZE = "LEGAL"

    client = PDFClientService()
    payload = client._to_open_resume_payload(sample_resume)

    assert payload["settings"] == {
        "fontFamily": "Roboto",
        "fontSize": 10,
        "themeColor": "#112233",
        "documentSize": "LEGAL",
    }
    assert payload["resume"]["profile"]["name"] == sample_resume.personalInfo.name
