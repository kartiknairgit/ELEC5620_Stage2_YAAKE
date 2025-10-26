// File: backend/services/atsService.js
// ATS Scoring Service using Google Gemini API

const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

class ATSService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('❌ GEMINI_API_KEY not found in .env');
    }
    console.log('✅ ATSService initialized with Gemini API');
  }

  /**
   * Calculate letter grade from numeric score
   * @param {number} score - Numeric score (0-100)
   * @returns {string} Letter grade (A-F)
   */
  calculateGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Score a resume against a job description using AI
   * @param {string} resumeText - Extracted resume text
   * @param {string} jobDescription - Job posting text
   * @returns {Object} ATS scoring results
   */
  async scoreResume(resumeText, jobDescription) {
    try {
      console.log('\n🎯 Starting ATS Scoring Analysis...');
      console.log(`📄 Resume length: ${resumeText.length} characters`);
      console.log(`📋 Job description length: ${jobDescription.length} characters`);

      const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer. Analyze this resume against the job description and provide a comprehensive scoring report.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Evaluate the resume across these 4 categories (each worth 25% of total score):

1. KEYWORD MATCHING (25%): How well does the resume contain keywords from the job description?
2. FORMAT & STRUCTURE (25%): Is the resume ATS-friendly with clear sections, proper formatting?
3. EXPERIENCE RELEVANCE (25%): Does the work experience align with job requirements?
4. SKILLS GAP ANALYSIS (25%): Are required skills present? What's missing?

Return ONLY a JSON object with this EXACT structure (no markdown, no code blocks):
{
  "keyword_matching": {
    "score": 85,
    "feedback": "Strong keyword alignment with 80% of required terms present. Missing: cloud computing, agile methodology.",
    "matched_keywords": ["Python", "JavaScript", "React"],
    "missing_keywords": ["cloud computing", "agile"]
  },
  "format_structure": {
    "score": 90,
    "feedback": "Excellent ATS-friendly format with clear sections and consistent formatting.",
    "strengths": ["Clear section headers", "Consistent formatting"],
    "issues": []
  },
  "experience_relevance": {
    "score": 78,
    "feedback": "Good experience alignment but lacks senior-level responsibilities mentioned in JD.",
    "relevant_experiences": ["Led team of 5 developers", "Managed cloud infrastructure"],
    "gaps": ["No mention of budget management"]
  },
  "skills_gap": {
    "score": 82,
    "feedback": "Most technical skills present. Soft skills could be more prominent.",
    "present_skills": ["React", "Node.js", "MongoDB"],
    "missing_skills": ["Docker", "Kubernetes"],
    "recommended_additions": ["Add Docker experience", "Highlight leadership skills"]
  },
  "overall_feedback": "Strong candidate with good technical background. Resume shows 81% match with job requirements. To improve: add missing keywords, emphasize leadership experience.",
  "top_recommendations": [
    "Add 'cloud computing' and 'agile methodology' keywords",
    "Quantify achievements with metrics",
    "Emphasize leadership and team management experience",
    "Include Docker and Kubernetes if applicable"
  ],
  "ats_compatibility_notes": "Resume format is ATS-friendly. No major parsing issues expected."
}

IMPORTANT:
- Scores must be 0-100 integers
- Be specific and actionable in feedback
- Base analysis on actual content comparison
- Return ONLY the JSON object
`;

      const result = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt
      });
      let text = result.text.trim();

      // Clean up response (remove markdown code blocks if present)
      if (text.startsWith('```')) {
        text = text.split('```')[1];
        if (text.startsWith('json')) {
          text = text.substring(4);
        }
      }
      text = text.trim();

      console.log('🤖 Gemini analysis received');

      // Parse the JSON response
      const analysis = JSON.parse(text);

      // Calculate overall score (weighted average of 4 categories)
      const overallScore = Math.round(
        (analysis.keyword_matching.score +
          analysis.format_structure.score +
          analysis.experience_relevance.score +
          analysis.skills_gap.score) / 4
      );

      const grade = this.calculateGrade(overallScore);

      console.log(`✅ ATS Score: ${overallScore}% (Grade: ${grade})`);

      // Build comprehensive response
      const scoringResult = {
        success: true,
        overall_score: overallScore,
        grade: grade,
        category_scores: {
          keyword_matching: {
            score: analysis.keyword_matching.score,
            weight: 25,
            feedback: analysis.keyword_matching.feedback,
            matched_keywords: analysis.keyword_matching.matched_keywords || [],
            missing_keywords: analysis.keyword_matching.missing_keywords || []
          },
          format_structure: {
            score: analysis.format_structure.score,
            weight: 25,
            feedback: analysis.format_structure.feedback,
            strengths: analysis.format_structure.strengths || [],
            issues: analysis.format_structure.issues || []
          },
          experience_relevance: {
            score: analysis.experience_relevance.score,
            weight: 25,
            feedback: analysis.experience_relevance.feedback,
            relevant_experiences: analysis.experience_relevance.relevant_experiences || [],
            gaps: analysis.experience_relevance.gaps || []
          },
          skills_gap: {
            score: analysis.skills_gap.score,
            weight: 25,
            feedback: analysis.skills_gap.feedback,
            present_skills: analysis.skills_gap.present_skills || [],
            missing_skills: analysis.skills_gap.missing_skills || [],
            recommended_additions: analysis.skills_gap.recommended_additions || []
          }
        },
        detailed_feedback: analysis.overall_feedback,
        recommendations: analysis.top_recommendations || [],
        ats_compatibility_notes: analysis.ats_compatibility_notes || 'No compatibility issues detected.',
        analysis_metadata: {
          timestamp: new Date().toISOString(),
          api_used: 'Google Gemini',
          resume_length: resumeText.length,
          job_description_length: jobDescription.length
        }
      };

      console.log('📊 Scoring complete!\n');
      return scoringResult;

    } catch (error) {
      console.error('❌ ATS Scoring error:', error.message);
      throw new Error(`ATS scoring failed: ${error.message}`);
    }
  }

  /**
   * Validate inputs before scoring
   * @param {string} resumeText - Resume text
   * @param {string} jobDescription - Job description text
   * @returns {Object} Validation result
   */
  validateInputs(resumeText, jobDescription) {
    const errors = [];

    if (!resumeText || resumeText.trim().length === 0) {
      errors.push('Resume text is empty or invalid');
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      errors.push('Job description is required for ATS scoring');
    }

    if (resumeText && resumeText.length < 100) {
      errors.push('Resume text is too short (minimum 100 characters)');
    }

    if (jobDescription && jobDescription.length < 50) {
      errors.push('Job description is too short (minimum 50 characters)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = ATSService;
