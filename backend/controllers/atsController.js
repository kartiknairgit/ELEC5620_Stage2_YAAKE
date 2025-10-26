// File: backend/controllers/atsController.js
// ATS Controller - handles ATS scoring requests

const path = require('path');
const fs = require('fs');
const ResumeService = require('../services/resumeService');
const ATSService = require('../services/atsService');

const resumeService = new ResumeService();
const atsService = new ATSService();

const UPLOAD_FOLDER = path.join(__dirname, '../uploads');

// Ensure upload folder exists
if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
}

/**
 * Score a resume against a job description
 * POST /api/ats/score
 */
exports.scoreResume = async (req, res) => {
  let filePath = null;

  try {
    console.log('\n📨 ATS SCORING REQUEST RECEIVED');

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No resume file provided. Please upload a PDF, DOCX, or TXT file.'
      });
    }

    // Check if job description was provided
    if (!req.body.jobDescription) {
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        error: 'Job description is required for ATS scoring.'
      });
    }

    filePath = req.file.path;
    const jobDescription = req.body.jobDescription;

    console.log(`📁 File uploaded: ${path.basename(filePath)}`);
    console.log(`📋 Job description length: ${jobDescription.length} characters`);

    // Extract text from resume
    console.log('\n📖 Step 1: Extracting resume text...');
    const resumeText = await resumeService.getTextFromFile(filePath);

    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error('Could not extract text from resume file');
    }

    console.log(`✅ Extracted ${resumeText.length} characters from resume`);

    // Validate inputs
    console.log('\n✔️  Step 2: Validating inputs...');
    const validation = atsService.validateInputs(resumeText, jobDescription);

    if (!validation.valid) {
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    console.log('✅ Validation passed');

    // Perform ATS scoring
    console.log('\n🎯 Step 3: Performing ATS analysis...');
    const scoringResult = await atsService.scoreResume(resumeText, jobDescription);

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️  Temporary file cleaned up');
    }

    console.log('✅ ATS SCORING COMPLETE!\n');

    // Return results
    return res.status(200).json(scoringResult);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);

    // Clean up uploaded file on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('🗑️  Temporary file cleaned up after error');
      } catch (cleanupError) {
        console.error('⚠️  Failed to clean up file:', cleanupError.message);
      }
    }

    return res.status(500).json({
      success: false,
      error: 'ATS scoring failed',
      message: error.message
    });
  }
};

/**
 * Health check endpoint
 * GET /api/ats/health
 */
exports.health = (req, res) => {
  res.status(200).json({
    success: true,
    status: '✅ ATS service is running',
    service: 'ATS Resume Scoring',
    ai: 'Google Gemini (FREE)',
    features: [
      'Keyword Matching Analysis',
      'Format & Structure Evaluation',
      'Experience Relevance Scoring',
      'Skills Gap Analysis'
    ]
  });
};

/**
 * Get scoring criteria information
 * GET /api/ats/criteria
 */
exports.getCriteria = (req, res) => {
  res.status(200).json({
    success: true,
    criteria: {
      keyword_matching: {
        weight: 25,
        description: 'Analyzes how well the resume contains keywords from the job description',
        evaluated: ['Required keywords presence', 'Technical terms alignment', 'Industry-specific terminology']
      },
      format_structure: {
        weight: 25,
        description: 'Evaluates ATS-friendliness of resume formatting',
        evaluated: ['Section organization', 'Consistent formatting', 'Parse-ability', 'Professional layout']
      },
      experience_relevance: {
        weight: 25,
        description: 'Assesses alignment between work experience and job requirements',
        evaluated: ['Job title relevance', 'Responsibility alignment', 'Years of experience', 'Industry match']
      },
      skills_gap: {
        weight: 25,
        description: 'Identifies present and missing skills compared to job requirements',
        evaluated: ['Required skills coverage', 'Optional skills', 'Skill proficiency indicators', 'Certifications']
      }
    },
    grading_scale: {
      A: '90-100% - Excellent match',
      B: '80-89% - Good match',
      C: '70-79% - Average match',
      D: '60-69% - Below average',
      F: '0-59% - Poor match'
    }
  });
};
