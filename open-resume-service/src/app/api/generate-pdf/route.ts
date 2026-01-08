import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate-pdf
 * Generate a PDF from resume JSON using open-resume internals
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { resume, template = "default", settings } = body;

    if (!resume) {
      return NextResponse.json(
        { error: "Resume data is required" },
        { status: 400 }
      );
    }

    // Import the PDF generation utility
    // This uses the same rendering as the web interface
    const { generatePDF } = await import("../../../lib/resume-pdf-generator");

    // Generate PDF
    const pdfBuffer = await generatePDF(resume, template, settings);

    // Return PDF as binary response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        message: message,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
