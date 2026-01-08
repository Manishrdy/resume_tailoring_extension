"""
Gemini AI Service for resume tailoring
Uses the new google-genai package
"""

import json
import time
import re
from typing import Dict, Any, Optional
from google import genai
from google.genai import types

from app.config import settings
from utils.logger import logger, log_ai_request, log_ai_error
from prompts.tailoring import (
    SYSTEM_INSTRUCTION,
    get_tailoring_prompt,
    get_keyword_extraction_prompt,
    add_json_enforcement,
)
from models.resume import Resume, TailorResponse


class GeminiService:
    """Service for interacting with Gemini AI"""

    def __init__(self):
        """Initialize Gemini client"""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")

        # Initialize client with API key from environment
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = settings.GEMINI_MODEL

        logger.info(f"✅ Gemini AI service initialized (model: {self.model})")

    def _make_request(
        self, prompt: str, retry_count: int = 0
    ) -> Optional[str]:
        """
        Make a request to Gemini API with retry logic

        Args:
            prompt: The prompt to send
            retry_count: Current retry attempt

        Returns:
            Response text or None if failed
        """
        try:
            start_time = time.time()

            # Generate content with configuration
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=settings.GEMINI_TEMPERATURE,
                    max_output_tokens=settings.GEMINI_MAX_TOKENS,
                    system_instruction=SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",  # ✅ FORCE JSON OUTPUT
                ),
            )

            duration_ms = (time.time() - start_time) * 1000

            # Extract text from response
            response_text = response.text

            # Validate response is not empty or truncated
            if not response_text:
                raise ValueError("Empty response from Gemini")
            
            # Check if response seems truncated (doesn't end with } or ])
            if not response_text.rstrip().endswith(('}', ']')):
                logger.warning("⚠️ Response may be truncated, missing closing brace/bracket")
                logger.warning(f"Response ends with: {response_text[-50:]}")

            # Log successful request
            log_ai_request(
                model=self.model,
                prompt_length=len(prompt),
                response_length=len(response_text),
                duration_ms=duration_ms,
            )

            # DEBUG: Log full response
            logger.debug("="*80)
            logger.debug("🔍 GEMINI RAW RESPONSE:")
            logger.debug(f"Response length: {len(response_text)} characters")
            logger.debug(f"Response preview: {response_text[:200]}...")
            logger.debug(f"Response ending: ...{response_text[-200:]}")
            logger.debug("="*80)

            return response_text

        except Exception as e:
            # Log error with context
            log_ai_error(
                e,
                {
                    "retry_count": retry_count,
                    "prompt_length": len(prompt),
                    "model": self.model,
                },
            )

            # Retry logic
            if retry_count < settings.GEMINI_RETRY_ATTEMPTS:
                delay = settings.GEMINI_RETRY_DELAY * (2**retry_count)  # Exponential backoff
                logger.warning(
                    f"Retrying Gemini request in {delay}s (attempt {retry_count + 1}/{settings.GEMINI_RETRY_ATTEMPTS})"
                )
                time.sleep(delay)
                return self._make_request(prompt, retry_count + 1)

            # All retries failed
            logger.error(f"Gemini request failed after {settings.GEMINI_RETRY_ATTEMPTS} attempts")
            return None

    def _build_tailoring_prompt(
        self,
        resume_json: str,
        job_description: str,
        force_changes: bool = False,
    ) -> str:
        """Build tailoring prompt with optional strict change requirements."""
        prompt = get_tailoring_prompt(resume_json, job_description)
        if force_changes:
            prompt += """

STRICT REQUIREMENTS:
- You MUST make visible improvements to the resume text.
- Rewrite the professional summary.
- Update at least 2 bullet points in work experience.
- Reorder skills by relevance to the job description.
- Do NOT return the original resume unchanged.
"""

        return add_json_enforcement(prompt)

    def _parse_json_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """
        Parse JSON response from Gemini, handling various formats

        Args:
            response_text: Raw response from Gemini

        Returns:
            Parsed JSON dict or None if parsing failed
        """
        try:
            # DEBUG: Log raw response before cleaning
            logger.debug("🔍 JSON PARSING - Raw response:")
            logger.debug(f"Raw text (first 500 chars): {response_text[:500]}...")
            
            # Remove markdown code blocks if present
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            # DEBUG: Log cleaned response
            logger.debug("🔍 JSON PARSING - After cleaning:")
            logger.debug(f"Cleaned text (first 500 chars): {cleaned[:500]}...")
            logger.debug(f"Cleaned text (last 200 chars): ...{cleaned[-200:]}")

            # Parse JSON
            parsed = json.loads(cleaned)
            logger.info("✅ Successfully parsed JSON response from Gemini")
            
            # DEBUG: Log parsed structure
            logger.debug("🔍 JSON PARSING - Parsed structure:")
            logger.debug(f"Keys in parsed JSON: {list(parsed.keys())}")
            
            return parsed

        except json.JSONDecodeError as e:
            logger.error("="*80)
            logger.error("❌ JSON PARSING ERROR:")
            logger.error(f"Error: {e}")
            logger.error(f"Error position: Line {e.lineno}, Column {e.colno}")
            logger.error(f"Response text (first 500): {response_text[:500]}...")
            logger.error(f"Response text (last 500): ...{response_text[-500:]}")
            
            # Attempt to repair truncated JSON
            logger.warning("🔧 Attempting to repair truncated JSON...")
            try:
                # Start with cleaned text (remove possible markdown fences)
                repaired = response_text.strip()
                if repaired.startswith("```json"):
                    repaired = repaired[7:]
                if repaired.startswith("```"):
                    repaired = repaired[3:]
                if repaired.endswith("```"):
                    repaired = repaired[:-3]
                repaired = repaired.strip()
                
                # If the content appears to end inside a string, close the quote
                # Detect odd number of unescaped quotes as a heuristic
                unescaped_quote_count = len(re.findall(r'(?<!\\)"', repaired))
                if unescaped_quote_count % 2 == 1:
                    repaired += '"'
                    logger.warning("Closed unterminated string by appending ending quote")

                # Count braces
                open_braces = repaired.count('{')
                close_braces = repaired.count('}')
                open_brackets = repaired.count('[')
                close_brackets = repaired.count(']')
                
                # Add missing closing characters
                if open_braces > close_braces:
                    repaired += '}' * (open_braces - close_braces)
                    logger.warning(f"Added {open_braces - close_braces} closing braces")
                
                if open_brackets > close_brackets:
                    repaired += ']' * (open_brackets - close_brackets)
                    logger.warning(f"Added {open_brackets - close_brackets} closing brackets")

                # Remove trailing commas before object/array closers (common truncation issue)
                # Example: {"email": "x",} -> {"email": "x"}
                repaired = re.sub(r",\s*(\}|\])", r"\1", repaired)

                # If the text ends with a dangling comma, drop it
                if repaired.rstrip().endswith(','):
                    repaired = repaired.rstrip()
                    repaired = repaired[:-1]
                    logger.warning("Removed trailing dangling comma at end of JSON")
                
                # Try parsing repaired JSON
                parsed = json.loads(repaired)
                logger.info("✅ Successfully repaired and parsed JSON!")
                return parsed
                
            except Exception as repair_error:
                logger.error(f"❌ JSON repair failed: {repair_error}")
                logger.error(f"Full response text for debugging:\n{response_text}")
                logger.error("="*80)
                return None

    def extract_keywords(self, job_description: str) -> Optional[Dict[str, Any]]:
        """
        Extract keywords from job description

        Args:
            job_description: The job description text

        Returns:
            Dict with extracted keywords or None if failed
        """
        logger.info("📝 Extracting keywords from job description")
        logger.debug("="*80)
        logger.debug("🔍 KEYWORD EXTRACTION - Input:")
        logger.debug(f"Job description length: {len(job_description)} characters")
        logger.debug(f"Job description preview: {job_description[:300]}...")
        logger.debug("="*80)

        prompt = add_json_enforcement(get_keyword_extraction_prompt(job_description))
        response_text = self._make_request(prompt)

        if not response_text:
            logger.error("❌ KEYWORD EXTRACTION - No response from Gemini")
            return None

        result = self._parse_json_response(response_text)
        
        # DEBUG: Log final result
        if result:
            logger.debug("🔍 KEYWORD EXTRACTION - Final result:")
            logger.debug(f"Result: {json.dumps(result, indent=2)}")
        
        return result

    def tailor_resume(
        self, resume: Resume, job_description: str
    ) -> Optional[TailorResponse]:
        """
        Tailor resume to match job description

        Args:
            resume: Original resume
            job_description: Target job description

        Returns:
            TailorResponse with optimized resume or None if failed
        """
        logger.info(f"🎯 Starting resume tailoring for: {resume.personalInfo.name}")
        logger.debug("="*80)
        logger.debug("🔍 RESUME TAILORING - Input:")
        logger.debug(f"Resume name: {resume.personalInfo.name}")
        logger.debug(f"Job description length: {len(job_description)} characters")
        logger.debug(f"Job description: {job_description[:500]}...")
        logger.debug("="*80)

        # Convert resume to JSON
        resume_json = resume.model_dump_json(indent=2)
        logger.debug("🔍 RESUME TAILORING - Resume JSON:")
        logger.debug(f"Resume JSON length: {len(resume_json)} characters")
        logger.debug(f"Resume JSON preview: {resume_json[:500]}...")

        # Generate prompt
        prompt = self._build_tailoring_prompt(resume_json, job_description)
        logger.debug("🔍 RESUME TAILORING - Generated prompt:")
        logger.debug(f"Prompt length: {len(prompt)} characters")

        # Make request
        response_text = self._make_request(prompt)

        if not response_text:
            logger.error("❌ Failed to get response from Gemini")
            return None

        # Parse response
        parsed_response = self._parse_json_response(response_text)

        if not parsed_response:
            # Attempt a single regeneration pass if the response looks truncated
            if not response_text.rstrip().endswith(('}', ']')):
                logger.warning("🔁 Response appears truncated. Requesting full JSON regeneration...")
                continuation_prompt = (
                    prompt
                    + "\n\nNOTE: Your previous response was truncated. Regenerate the FULL JSON object described above. Return ONLY valid JSON. Start with { and end with }. No markdown."
                )
                response_text_2 = self._make_request(continuation_prompt)
                if response_text_2:
                    parsed_response = self._parse_json_response(response_text_2)

            if not parsed_response:
                logger.error("❌ Failed to parse Gemini response")
                return None

        # DEBUG: Log parsed response structure
        logger.debug("="*80)
        logger.debug("🔍 RESUME TAILORING - Parsed response structure:")
        logger.debug(f"Top-level keys: {list(parsed_response.keys())}")
        for key in parsed_response.keys():
            if isinstance(parsed_response[key], (list, dict)):
                logger.debug(f"  {key}: {type(parsed_response[key]).__name__} with {len(parsed_response[key])} items")
            else:
                logger.debug(f"  {key}: {type(parsed_response[key]).__name__}")
        logger.debug("="*80)

        # Validate and construct TailorResponse
        try:
            # Extract tailored resume
            tailored_resume_data = parsed_response.get("tailoredResume")
            if not tailored_resume_data:
                logger.error("❌ Missing 'tailoredResume' in response")
                logger.error(f"Available keys: {list(parsed_response.keys())}")
                return None
            
            # DEBUG: Log tailored resume data
            logger.debug("🔍 RESUME TAILORING - Tailored resume data:")
            logger.debug(f"Tailored resume keys: {list(tailored_resume_data.keys())}")
            logger.debug(f"Tailored resume (formatted):\n{json.dumps(tailored_resume_data, indent=2)}")

            # Ensure AI output preserves required sections; fallback to original where missing
            tailored_resume_data = self._merge_with_original(resume, tailored_resume_data)

            # Parse tailored resume
            tailored_resume = Resume(**tailored_resume_data)

            # Retry once if the resume is unchanged from the original
            if self._is_resume_unchanged(resume, tailored_resume):
                logger.warning(
                    "⚠️ Tailored resume matches original; retrying with strict change requirements."
                )
                retry_prompt = self._build_tailoring_prompt(
                    resume_json,
                    job_description,
                    force_changes=True,
                )
                retry_response = self._make_request(retry_prompt)
                if retry_response:
                    retry_parsed = self._parse_json_response(retry_response)
                    retry_data = retry_parsed.get("tailoredResume") if retry_parsed else None
                    if retry_data:
                        retry_data = self._merge_with_original(resume, retry_data)
                        retry_resume = Resume(**retry_data)
                        if not self._is_resume_unchanged(resume, retry_resume):
                            tailored_resume = retry_resume
                            tailored_resume_data = retry_data
                            parsed_response = retry_parsed

            # Determine matched keywords (fallback if missing)
            matched_keywords = parsed_response.get("matchedKeywords", [])
            if not matched_keywords:
                matched_keywords = self._fallback_match_keywords(tailored_resume, job_description)

            # Calculate ATS score (hybrid approach)
            ats_score = self._calculate_ats_score(
                tailored_resume,
                job_description,
                matched_keywords,
            )

            # Construct response
            tailor_response = TailorResponse(
                tailoredResume=tailored_resume,
                atsScore=ats_score,
                matchedKeywords=matched_keywords,
                missingKeywords=parsed_response.get("missingKeywords", []),
                suggestions=parsed_response.get("suggestions", []),
                changes=parsed_response.get("changes", []),
            )

            logger.info(
                f"✅ Resume tailored successfully (ATS Score: {ats_score}/100)"
            )
            logger.info(
                f"   Matched: {len(tailor_response.matchedKeywords)} keywords"
            )
            logger.info(
                f"   Missing: {len(tailor_response.missingKeywords)} keywords"
            )
            
            # DEBUG: Log final tailor response
            logger.debug("="*80)
            logger.debug("🔍 RESUME TAILORING - FINAL RESPONSE:")
            logger.debug(f"ATS Score: {tailor_response.atsScore}")
            logger.debug(f"Matched keywords ({len(tailor_response.matchedKeywords)}): {tailor_response.matchedKeywords}")
            logger.debug(f"Missing keywords ({len(tailor_response.missingKeywords)}): {tailor_response.missingKeywords}")
            logger.debug(f"Suggestions ({len(tailor_response.suggestions)}): {tailor_response.suggestions}")
            logger.debug(f"Changes ({len(tailor_response.changes)}): {tailor_response.changes}")
            logger.debug(f"Tailored resume name: {tailor_response.tailoredResume.personalInfo.name}")
            logger.debug(f"Tailored resume skills: {tailor_response.tailoredResume.skills}")
            logger.info(f"Complete tailored response (JSON):\n{tailor_response.model_dump_json(indent=2)}")
            logger.debug("="*80)

            return tailor_response

        except Exception as e:
            logger.error("="*80)
            logger.error("❌ RESUME TAILORING - Failed to construct TailorResponse")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error message: {str(e)}")
            logger.error(f"Parsed response that caused error:\n{json.dumps(parsed_response, indent=2)}")
            logger.error("="*80)
            log_ai_error(e, {"parsed_response": parsed_response})
            return None

    def _calculate_ats_score(
        self,
        resume: Resume,
        job_description: str,
        matched_keywords: list,
    ) -> int:
        """
        Calculate ATS score using hybrid approach

        Args:
            resume: Tailored resume
            job_description: Job description
            matched_keywords: Keywords matched by AI

        Returns:
            ATS score (0-100)
        """
        # Extract text from resume for analysis
        resume_text = self._extract_resume_text(resume).lower()
        jd_lower = job_description.lower()

        # Count matched keywords
        keyword_matches = len(matched_keywords)

        # Extract important words from JD (simple approach)
        jd_words = set(
            word.strip(".,!?;:")
            for word in jd_lower.split()
            if len(word) > 4  # Filter out short words
        )

        # Count how many JD words appear in resume
        word_matches = sum(1 for word in jd_words if word in resume_text)
        total_jd_words = len(jd_words)

        # Calculate score components
        keyword_score = min(40, keyword_matches * 3)  # Up to 40 points
        word_match_score = (
            (word_matches / total_jd_words) * 40 if total_jd_words > 0 else 0
        )  # Up to 40 points
        completeness_score = 20  # Base score for having complete sections

        # Total score
        total_score = int(keyword_score + word_match_score + completeness_score)

        # Cap at 100
        return min(100, total_score)

    def _fallback_match_keywords(self, resume: Resume, job_description: str) -> list:
        """Fallback keyword matching when AI response doesn't provide them.

        Uses a simple intersection between resume skills and job description tokens.
        """
        jd_tokens = set(
            token.lower().strip(".,!?;:/()[]{}")
            for token in job_description.split()
            if len(token) >= 2
        )
        resume_skills = {skill.lower() for skill in resume.skills}
        matched = sorted(list(resume_skills.intersection(jd_tokens)))
        # Return capitalized form based on original skills order
        ordered = [skill for skill in resume.skills if skill.lower() in matched]
        return ordered

    def _is_resume_unchanged(self, original: Resume, tailored: Resume) -> bool:
        """Check if tailored resume is identical to the original."""
        original_data = original.model_dump(mode="json", exclude_none=False)
        tailored_data = tailored.model_dump(mode="json", exclude_none=False)
        return original_data == tailored_data

    def _merge_with_original(self, original: Resume, ai_data: Dict[str, Any]) -> Dict[str, Any]:
        """Merge AI output with original resume to ensure required fields are present.

        - Preserve `personalInfo` fields when AI returns nulls
        - Ensure `experience` and `skills` are non-empty; fallback to originals
        - Preserve `projects` and `education` if AI drops them entirely
        """
        orig = json.loads(original.model_dump_json())

        # Personal info: fill nulls from original
        if "personalInfo" in ai_data and isinstance(ai_data["personalInfo"], dict):
            for key, val in orig.get("personalInfo", {}).items():
                if ai_data["personalInfo"].get(key) is None:
                    ai_data["personalInfo"][key] = val
        else:
            ai_data["personalInfo"] = orig.get("personalInfo", {})

        # Experience: must have at least one item
        if not ai_data.get("experience"):
            ai_data["experience"] = orig.get("experience", [])

        # Skills: must have at least one item
        if not ai_data.get("skills"):
            ai_data["skills"] = orig.get("skills", [])

        # Education / Projects / Certifications: preserve if AI removed
        for section in ("education", "projects", "certifications"):
            if ai_data.get(section) is None:
                ai_data[section] = orig.get(section, [])

        # createdAt / updatedAt: preserve timestamps if AI set null
        for ts in ("createdAt", "updatedAt"):
            if ai_data.get(ts) is None and orig.get(ts) is not None:
                ai_data[ts] = orig.get(ts)

        return ai_data

    def _extract_resume_text(self, resume: Resume) -> str:
        """Extract all text from resume for analysis"""
        text_parts = [
            resume.personalInfo.name,
            resume.personalInfo.summary or "",
            " ".join(resume.skills),
        ]

        # Add experience
        for exp in resume.experience:
            text_parts.append(exp.company)
            text_parts.append(exp.position)
            text_parts.extend(exp.description)

        # Add projects
        for proj in resume.projects:
            text_parts.append(proj.name)
            text_parts.append(proj.description)
            text_parts.extend(proj.highlights)
            text_parts.extend(proj.technologies)

        # Add education
        for edu in resume.education:
            text_parts.append(edu.institution)
            text_parts.append(edu.degree)

        return " ".join(text_parts)


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create Gemini service instance"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
