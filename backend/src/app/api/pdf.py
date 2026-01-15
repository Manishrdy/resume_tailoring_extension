"""
Document Generation API endpoint - Template-Based System
Generates ATS-friendly PDFs and DOCX files using HTML templates + WeasyPrint
- PDF: HTML template → WeasyPrint → ATS-optimized PDF
- DOCX: Template data → python-docx → Editable Word doc
- 100% format consistency between formats
"""

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import Response
from datetime import datetime

from models.resume import GeneratePDFRequest
# NEW: Use template-based generator
from services.template_document_generator import get_template_generator
from utils import artifacts
from utils.logger import logger, log_error

router = APIRouter()


@router.post(
    "/generate-pdf",
    response_class=Response,
    status_code=status.HTTP_200_OK,
    summary="Generate PDF",
    description="Generate ATS-friendly PDF from resume JSON using self-contained document generator",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "PDF file",
        },
        500: {"description": "PDF generation failed"},
    },
)
async def generate_pdf(request: GeneratePDFRequest):
    try:
        logger.info("=" * 80)
        logger.info(f"📄 PDF generation request received")
        logger.info(f"   Resume ID: {request.resume.id}")
        logger.info(f"   Candidate: {request.resume.personalInfo.name}")
        logger.info(f"   Template: {request.template}")
        logger.info("=" * 80)

        # Get template-based document generator
        generator = get_template_generator()

        # Generate PDF from HTML template
        logger.info("🔄 Generating PDF from HTML template using WeasyPrint...")
        pdf_bytes = generator.generate_pdf(request.resume)

        # Check if generation succeeded
        if not pdf_bytes:
            logger.error("❌ PDF generation failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate PDF. Please try again.",
            )

        # Generate filename
        candidate_name = request.resume.personalInfo.name.replace(" ", "_")
        date_str = datetime.now().strftime("%Y-%m-%d")
        filename = f"{candidate_name}_Resume_{date_str}.pdf"

        logger.info("=" * 80)
        logger.info("✅ PDF generated successfully")
        logger.info(f"   Filename: {filename}")
        logger.info(f"   Size: {len(pdf_bytes) / 1024:.2f} KB")
        logger.info("=" * 80)

        # Save PDF to the latest artifact session (or create a new one)
        session_path = artifacts.get_latest_session(request.resume.id)
        if session_path is None:
            session_path = artifacts.start_session(request.resume)
        artifacts.save_pdf(session_path, pdf_bytes, filename)

        # Return PDF with proper headers
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
            },
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error in generate_pdf endpoint: {e}")
        log_error(
            e,
            {
                "resume_id": request.resume.id,
                "candidate_name": request.resume.personalInfo.name,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating PDF. Please try again later.",
        )


@router.post(
    "/generate-docx",
    response_class=Response,
    status_code=status.HTTP_200_OK,
    summary="Generate DOCX",
    description="Generate ATS-friendly DOCX from resume JSON using self-contained document generator",
    responses={
        200: {
            "content": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {}},
            "description": "DOCX file",
        },
        500: {"description": "DOCX generation failed"},
    },
)
async def generate_docx(request: GeneratePDFRequest):
    try:
        logger.info("=" * 80)
        logger.info(f"📝 DOCX generation request received")
        logger.info(f"   Resume ID: {request.resume.id}")
        logger.info(f"   Candidate: {request.resume.personalInfo.name}")
        logger.info(f"   Template: {request.template}")
        logger.info("=" * 80)

        # Get template-based document generator
        generator = get_template_generator()

        # Generate DOCX
        logger.info("🔄 Generating DOCX from template...")
        docx_bytes = generator.generate_docx(request.resume)

        # Check if generation succeeded
        if not docx_bytes:
            logger.error("❌ DOCX generation failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate DOCX. Please try again.",
            )

        # Generate filename
        candidate_name = request.resume.personalInfo.name.replace(" ", "_")
        date_str = datetime.now().strftime("%Y-%m-%d")
        filename = f"{candidate_name}_Resume_{date_str}.docx"

        logger.info("=" * 80)
        logger.info("✅ DOCX generated successfully")
        logger.info(f"   Filename: {filename}")
        logger.info(f"   Size: {len(docx_bytes) / 1024:.2f} KB")
        logger.info("=" * 80)

        # Save DOCX to the latest artifact session (or create a new one)
        session_path = artifacts.get_latest_session(request.resume.id)
        if session_path is None:
            session_path = artifacts.start_session(request.resume)

        # Save DOCX file
        docx_path = session_path / filename
        docx_path.write_bytes(docx_bytes)
        logger.info(f"💾 DOCX saved to: {docx_path}")

        # Return DOCX with proper headers
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(docx_bytes)),
            },
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error in generate_docx endpoint: {e}")
        log_error(
            e,
            {
                "resume_id": request.resume.id,
                "candidate_name": request.resume.personalInfo.name,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating DOCX. Please try again later.",
        )


@router.get(
    "/document/status",
    status_code=status.HTTP_200_OK,
    summary="Check Document Generation Service Status",
    description="Check if document generation service is available",
)
async def document_status():
    """
    Check if the document generation service is properly configured and available
    """
    try:
        generator = get_template_generator()

        return {
            "status": "available",
            "service": "Template-based Document Generator",
            "formats": ["PDF", "DOCX"],
            "template_engine": "Jinja2 + WeasyPrint",
            "message": "Document generation service is ready",
            "features": {
                "pdf": "HTML template → WeasyPrint → ATS-optimized PDF",
                "docx": "Template data → python-docx → Editable DOCX",
                "consistency": "100% format matching between PDF and DOCX",
                "ats_optimized": True,
            },
        }

    except Exception as e:
        logger.error(f"Document service status check failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "message": "Document generation service is not properly configured",
        }
