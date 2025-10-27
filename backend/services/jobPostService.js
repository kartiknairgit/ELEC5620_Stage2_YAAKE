// File: backend/services/jobPostService.js
// Job post generation service using Google Gemini API

const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

class JobPostService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('❌ GEMINI_API_KEY not found in .env');
    }
    console.log('✅ JobPostService initialized with Gemini API');
  }

  async generateJobPost(jobDetails) {
    try {
      console.log('\n🤖 Sending to Google Gemini for job post generation...');

      const prompt = `
        Create a professional, inclusive job posting based on the information below.
        Use gender-neutral language and avoid bias.
        
        INPUT:
        - Job Title: ${jobDetails.jobTitle || 'Not specified'}
        - Department: ${jobDetails.department || 'Not specified'}
        - Employment Type: ${jobDetails.employmentType || 'Full-time'}
        - Location: ${jobDetails.location || 'Not specified'}
        - Experience Level: ${jobDetails.experienceLevel || 'Not specified'}
        - Responsibilities: ${jobDetails.responsibilities || 'Not specified'}
        - Required Skills: ${jobDetails.requiredSkills || 'Not specified'}
        - Years of Experience: ${jobDetails.yearsExperience || 'Not specified'}
        - Salary Range: ${jobDetails.salaryRange || 'Competitive'}
        
        Return ONLY a JSON object:
        {
          "job_title": "Title",
          "role_summary": "Brief description",
          "key_responsibilities": ["item1", "item2", "item3"],
          "required_qualifications": {
            "education": ["req1"],
            "experience": ["req2"],
            "skills": ["skill1", "skill2"]
          },
          "benefits": ["benefit1", "benefit2"],
          "full_description": "Complete formatted job post text"
        }
        
        Return ONLY the JSON. No markdown, no code blocks.
      `;

      const result = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt
      });
      const text = result.text.trim();

      let cleanText = text;
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.split('```')[1];
        if (cleanText.startsWith('json')) {
          cleanText = cleanText.substring(4);
        }
      }
      cleanText = cleanText.trim();

      const generatedPost = JSON.parse(cleanText);
      console.log('✅ Gemini successfully generated job post');
      return generatedPost;
    } catch (error) {
      console.error('❌ Gemini job post generation error:', error.message);
      throw new Error(`Job post generation failed: ${error.message}`);
    }
  }

  async checkBiasAndInclusion(jobPost) {
    try {
      console.log('\n🔍 Checking for bias and inclusivity...');

      const postText = JSON.stringify(jobPost);

      const prompt = `
        Analyze this job posting for bias and discriminatory language.
        
        Check for: gender bias, age bias, ability bias, cultural bias.
        
        JOB POST:
        ${postText}
        
        Return ONLY JSON:
        {
          "bias_score": 85,
          "bias_detected": false,
          "issues": [
            {
              "type": "gender_bias",
              "text": "Problematic phrase",
              "suggestion": "Better alternative"
            }
          ],
          "recommendations": ["suggestion1", "suggestion2"]
        }
        
        Return ONLY JSON. No markdown, no code blocks.
      `;

      const result = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt
      });
      let text = result.text.trim();

      if (text.startsWith('```')) {
        text = text.split('```')[1];
        if (text.startsWith('json')) {
          text = text.substring(4);
        }
      }
      text = text.trim();

      const biasAnalysis = JSON.parse(text);
      console.log(`✅ Bias check complete - Score: ${biasAnalysis.bias_score}/100`);
      return biasAnalysis;
    } catch (error) {
      console.error('⚠️  Bias check failed:', error.message);
      return {
        bias_score: 0,
        bias_detected: false,
        issues: [],
        recommendations: [],
        error: error.message
      };
    }
  }

  validateJobPost(jobPost) {
    console.log('\n✔️  Validating job post...');

    const warnings = [];
    let isValid = true;

    if (!jobPost.job_title) {
      warnings.push('❌ Job title is missing');
      isValid = false;
    }
    if (!jobPost.key_responsibilities || jobPost.key_responsibilities.length === 0) {
      warnings.push('❌ No responsibilities listed');
      isValid = false;
    }
    if (!jobPost.required_qualifications) {
      warnings.push('❌ Required qualifications missing');
      isValid = false;
    }
    if (!jobPost.full_description) {
      warnings.push('❌ Full description not generated');
      isValid = false;
    }

    console.log(`   Validation: ${isValid ? '✅ Valid' : '⚠️  Has warnings'}`);
    warnings.forEach(w => console.log(`   ${w}`));

    return {
      is_valid: isValid,
      warnings
    };
  }

  async processJobPost(jobDetails, userId) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 PROCESSING JOB POST: ${jobDetails.jobTitle || 'Untitled'}`);
    console.log(`${'='.repeat(60)}`);

    try {
      console.log('\n📝 Step 1: Generating job post...');
      const jobPost = await this.generateJobPost(jobDetails);
      console.log(`   ✅ Generated job post`);

      console.log('\n🔍 Step 2: Validating structure...');
      const validation = this.validateJobPost(jobPost);

      console.log('\n🛡️  Step 3: Checking for bias...');
      const biasCheck = await this.checkBiasAndInclusion(jobPost);

      console.log(`\n✅ JOB POST PROCESSING COMPLETE!`);
      console.log(`${'='.repeat(60)}\n`);

      return {
        success: true,
        data: jobPost,
        validation,
        bias_check: biasCheck,
        metadata: {
          created_by: userId,
          created_at: new Date().toISOString(),
          api_used: 'Google Gemini (FREE)'
        }
      };
    } catch (error) {
      console.error(`\n❌ Error processing job post: ${error.message}`);
      throw error;
    }
  }
}

module.exports = JobPostService;