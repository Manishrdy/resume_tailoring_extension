"""
Test script for template-based document generation.
Tests both PDF and DOCX generation with sample resume data.
"""

import sys
from pathlib import Path

# Add src to path
backend_root = Path(__file__).parent
sys.path.insert(0, str(backend_root / "src"))

from models.resume import (
    Resume,
    PersonalInfo,
    Experience,
    Education,
    Project,
    Certification
)
from services.template_document_generator import TemplateDocumentGenerator


def create_sample_resume() -> Resume:
    """Create a comprehensive sample resume for testing"""

    personal_info = PersonalInfo(
        name="Sarah Johnson",
        email="sarah.johnson@example.com",
        phone="+1 (555) 123-4567",
        location="San Francisco, CA",
        linkedin="https://linkedin.com/in/sarahjohnson",
        github="https://github.com/sarahjohnson",
        website="https://sarahjohnson.dev",
        summary="Senior Software Engineer with 7+ years of experience building scalable web applications and distributed systems. Expert in Python, JavaScript, and cloud infrastructure. Passionate about clean code, mentorship, and delivering high-impact solutions that drive business value."
    )

    experience = [
        Experience(
            company="TechCorp Inc.",
            position="Senior Software Engineer",
            startDate="Jan 2021",
            endDate="Present",
            location="San Francisco, CA",
            bullets=[
                "Architected and deployed microservices platform serving 10M+ users using Python, FastAPI, and Kubernetes",
                "Improved system performance by 60% through database optimization and Redis caching strategies",
                "Led team of 5 engineers in migrating monolithic application to event-driven architecture",
                "Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes",
                "Mentored 3 junior engineers, conducting code reviews and technical design discussions"
            ]
        ),
        Experience(
            company="StartupXYZ",
            position="Full Stack Developer",
            startDate="Jun 2019",
            endDate="Dec 2020",
            location="Remote",
            bullets=[
                "Built REST APIs and React frontend for B2B SaaS platform with 50K+ active users",
                "Integrated Stripe payment processing and implemented subscription management system",
                "Reduced API response time by 45% through query optimization and caching",
                "Developed automated testing suite achieving 85% code coverage"
            ]
        ),
        Experience(
            company="Digital Agency Co.",
            position="Junior Developer",
            startDate="Jul 2017",
            endDate="May 2019",
            location="New York, NY",
            bullets=[
                "Developed responsive websites for 20+ clients using JavaScript, React, and Node.js",
                "Collaborated with designers to implement pixel-perfect UI components",
                "Maintained and optimized legacy PHP applications serving 100K+ monthly visitors"
            ]
        )
    ]

    education = [
        Education(
            institution="University of California, Berkeley",
            degree="Bachelor of Science",
            field="Computer Science",
            startDate="Sep 2013",
            endDate="May 2017",
            gpa="3.8",
            achievements=[
                "Dean's List all semesters",
                "CS Capstone: Built ML-powered recommendation engine",
                "Relevant Coursework: Algorithms, Distributed Systems, Machine Learning"
            ]
        )
    ]

    skills = [
        "Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI",
        "Django", "PostgreSQL", "MongoDB", "Redis", "AWS", "Docker",
        "Kubernetes", "CI/CD", "Git", "REST APIs", "GraphQL", "Microservices",
        "Redis", "Elasticsearch", "TDD", "Agile", "System Design"
    ]

    projects = [
        Project(
            name="Open Source Resume Builder",
            description="Contributed to popular open-source resume builder with 5K+ GitHub stars. Implemented PDF export feature and internationalization support.",
            technologies=["React", "TypeScript", "Tailwind CSS", "Vite"],
            url="https://github.com/sarahjohnson/resume-builder"
        ),
        Project(
            name="Real-time Chat Application",
            description="Built scalable chat app supporting 1K+ concurrent users with WebSocket connections, message persistence, and typing indicators.",
            technologies=["Node.js", "Socket.io", "Redis", "MongoDB", "React"],
            url="https://github.com/sarahjohnson/chat-app"
        )
    ]

    certifications = [
        Certification(
            name="AWS Certified Solutions Architect - Associate",
            issuer="Amazon Web Services",
            date="Mar 2023"
        ),
        Certification(
            name="Google Cloud Professional Cloud Developer",
            issuer="Google Cloud",
            date="Sep 2022"
        )
    ]

    return Resume(
        name="sarah-johnson-resume",
        personalInfo=personal_info,
        experience=experience,
        education=education,
        skills=skills,
        projects=projects,
        certifications=certifications
    )


def test_template_generation():
    """Test both PDF and DOCX generation"""

    print("=" * 60)
    print("Testing Template-Based Document Generation")
    print("=" * 60)
    print()

    # Create sample resume
    print("📝 Creating sample resume data...")
    resume = create_sample_resume()
    print(f"✓ Resume created: {resume.personalInfo.name}")
    print(f"  - Experience: {len(resume.experience)} positions")
    print(f"  - Education: {len(resume.education)} degrees")
    print(f"  - Skills: {len(resume.skills)} skills")
    print(f"  - Projects: {len(resume.projects)} projects")
    print(f"  - Certifications: {len(resume.certifications)} certifications")
    print()

    # Initialize generator
    print("🔧 Initializing TemplateDocumentGenerator...")
    generator = TemplateDocumentGenerator()
    print("✓ Generator initialized")
    print()

    # Test PDF generation
    print("📄 Generating PDF from HTML template...")
    try:
        pdf_bytes = generator.generate_pdf(resume)
        pdf_size = len(pdf_bytes) / 1024  # KB
        print(f"✓ PDF Generated: {pdf_size:.2f} KB")

        # Save to file for manual inspection
        pdf_path = backend_root / "test_resume_template.pdf"
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"✓ PDF saved to: {pdf_path}")
    except Exception as e:
        print(f"✗ PDF Generation FAILED: {str(e)}")
        import traceback
        traceback.print_exc()

    print()

    # Test DOCX generation
    print("📝 Generating DOCX...")
    try:
        docx_bytes = generator.generate_docx(resume)
        docx_size = len(docx_bytes) / 1024  # KB
        print(f"✓ DOCX Generated: {docx_size:.2f} KB")

        # Save to file for manual inspection
        docx_path = backend_root / "test_resume_template.docx"
        with open(docx_path, "wb") as f:
            f.write(docx_bytes)
        print(f"✓ DOCX saved to: {docx_path}")
    except Exception as e:
        print(f"✗ DOCX Generation FAILED: {str(e)}")
        import traceback
        traceback.print_exc()

    print()
    print("=" * 60)
    print("✅ Template Generation Test Complete!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Open test_resume_template.pdf to verify ATS-friendly formatting")
    print("2. Open test_resume_template.docx to verify editability")
    print("3. Check that both files have consistent formatting")
    print("4. Run through an ATS parser to verify compatibility")
    print()


if __name__ == "__main__":
    test_template_generation()
