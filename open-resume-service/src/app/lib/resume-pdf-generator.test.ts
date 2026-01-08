/**
 * @jest-environment node
 */
import { generatePDF } from "lib/resume-pdf-generator";
import type { Resume } from "lib/redux/types";

const sampleResume: Resume = {
  profile: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "555-0101",
    location: "Remote",
    url: "linkedin.com/in/janedoe",
    portfolio: "janedoe.dev",
    github: "github.com/janedoe",
    summary: "Backend engineer focused on scalable services.",
  },
  workExperiences: [
    {
      company: "Acme",
      jobTitle: "Senior Engineer",
      date: "2021 - Present",
      descriptions: ["Built APIs used by 1M users."],
    },
  ],
  educations: [
    {
      school: "State University",
      degree: "B.S. Computer Science",
      date: "2016 - 2020",
      gpa: "3.8",
      descriptions: ["Graduated with honors."],
    },
  ],
  projects: [
    {
      project: "Resume Builder",
      date: "2023",
      descriptions: ["Implemented PDF rendering pipeline."],
      url: "https://github.com/janedoe/resume-builder",
    },
  ],
  skills: {
    featuredSkills: [{ skill: "Python", rating: 4 }],
    descriptions: ["Python, FastAPI, Postgres"],
  },
  custom: {
    descriptions: [],
  },
};

describe("generatePDF", () => {
  it("renders a PDF buffer with settings overrides", async () => {
    const pdfBuffer = await generatePDF(sampleResume, "default", {
      fontFamily: "Open Sans",
      fontSize: 10,
      documentSize: "LEGAL",
      themeColor: "#111111",
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
