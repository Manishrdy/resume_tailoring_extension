"""
Prompt templates for Gemini AI resume tailoring
Separated for easy modification without touching code
"""

# System instruction for Gemini
SYSTEM_INSTRUCTION = """You are an expert ATS (Applicant Tracking System) resume optimizer and career coach.

Your job is to tailor resumes to match specific job descriptions while maintaining complete authenticity.

CRITICAL RULES:
1. NEVER invent or fabricate experiences, skills, or achievements
2. ONLY enhance and rephrase existing content to match job requirements
3. Incorporate relevant keywords from the job description naturally
4. Maintain all factual information (dates, companies, titles, education)
5. Keep the original structure and organization
6. Return ONLY valid JSON - no markdown, no explanations, no preamble
7. You MAY add at most 1-2 adjacent technologies **only if** they are strongly implied by the job description and are a reasonable extension of existing skills (e.g., add Redis if already using caching + databases). Do not add unrelated technologies.

OUTPUT FORMAT:
You must return a valid JSON object matching this exact structure:
{
  "tailoredResume": { <complete resume object with enhanced content> },
  "matchedKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword3", "keyword4", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "changes": ["change1", "change2", ...]
}
"""


def get_tailoring_prompt(resume_json: str, job_description: str) -> str:
    """
    Generate the main tailoring prompt
    
    Args:
        resume_json: JSON string of the original resume
        job_description: The job description text
        
    Returns:
        Complete prompt for Gemini
    """
    return f"""
TASK: Optimize this resume for the following job description.

JOB DESCRIPTION:
{job_description}

ORIGINAL RESUME (JSON):
{resume_json}

INSTRUCTIONS:
1. **Extract Keywords**: Identify important keywords, skills, and requirements from the job description
2. **Professional Summary**: Rewrite to align with the target role, incorporating key skills and requirements
3. **Work Experience**: Enhance bullet points to:
   - Include relevant keywords naturally
   - Emphasize achievements that match job requirements
   - Keep company names, titles, and dates unchanged
   - Quantify achievements where possible
   - Rewrite bullet points; do not return the same bullets unchanged
4. **Projects**: Enhance descriptions and highlights to:
   - Match technical requirements
   - Include relevant technologies mentioned in JD
   - Keep project names and links unchanged
5. **Skills**: Reorder skills by relevance to the job (most relevant first)
   - If the JD highlights missing but adjacent technologies, add at most 1-2 in the skills list
6. **Education & Certifications**: Keep unchanged

IMPORTANT:
- Maintain ALL factual information (companies, dates, titles, schools)
- Only enhance phrasing and keyword integration
- Keep JSON structure identical to input
- You must make visible edits to summary and at least 2 experience bullets
- Return ONLY the JSON object, nothing else

OUTPUT:
Return a JSON object with:
- tailoredResume: Complete enhanced resume (same structure as input)
- matchedKeywords: Array of keywords from JD that exist in resume
- missingKeywords: Array of relevant JD keywords not in resume
- suggestions: Array of 3-5 actionable suggestions for user
- changes: Array of summary of changes made (e.g., "Enhanced 5 bullet points in work experience")

Remember: Output must be ONLY valid JSON, no markdown formatting, no explanations.
"""


def get_keyword_extraction_prompt(job_description: str) -> str:
    """
    Generate prompt for extracting keywords from job description
    Used for initial analysis before full tailoring
    
    Args:
        job_description: The job description text
        
    Returns:
        Prompt for keyword extraction
    """
    return f"""
Extract key requirements from this job description.

JOB DESCRIPTION:
{job_description}

EXTRACT:
1. Technical skills (programming languages, frameworks, tools)
2. Soft skills (leadership, communication, etc.)
3. Required qualifications (education, certifications)
4. Experience requirements (years, domains)
5. Key responsibilities

Return ONLY a JSON object:
{{
  "technical_skills": ["skill1", "skill2", ...],
  "soft_skills": ["skill1", "skill2", ...],
  "qualifications": ["qual1", "qual2", ...],
  "experience_requirements": ["req1", "req2", ...],
  "key_responsibilities": ["resp1", "resp2", ...]
}}

No markdown, no explanations, ONLY the JSON object.
"""


# Validation prompt to ensure JSON output
JSON_ENFORCEMENT_SUFFIX = """

CRITICAL: Your response must be ONLY a valid JSON object. Do not include:
- Markdown code blocks (```json)
- Explanatory text before or after
- Any formatting except the raw JSON

Start your response with { and end with }
"""


def add_json_enforcement(prompt: str) -> str:
    """Add JSON enforcement to any prompt"""
    return prompt + JSON_ENFORCEMENT_SUFFIX
