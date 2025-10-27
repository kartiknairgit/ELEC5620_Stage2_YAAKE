// File: backend/services/resumeService.js
// Resume parsing service using Google Gemini API

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

class ResumeService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('❌ GEMINI_API_KEY not found in .env');
    }
    console.log('✅ ResumeService initialized with Gemini API');
  }

  async extractTextFromPDF(filePath) {
    try {
      console.log('📄 Reading PDF file...');
      const dataBuffer = fs.readFileSync(filePath);
      const pdfParser = new PDFParse({ data: dataBuffer });
      const result = await pdfParser.getText();
      console.log(`✅ Extracted ${result.text.length} characters from PDF`);
      return result.text;
    } catch (error) {
      console.error('❌ Error reading PDF:', error.message);
      return '';
    }
  }

  async extractTextFromDOCX(filePath) {
    try {
      console.log('📄 Reading DOCX file...');
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      console.log(`✅ Extracted ${result.value.length} characters from DOCX`);
      return result.value;
    } catch (error) {
      console.error('❌ Error reading DOCX:', error.message);
      return '';
    }
  }

  async extractTextFromTXT(filePath) {
    try {
      console.log('📄 Reading TXT file...');
      const text = fs.readFileSync(filePath, 'utf-8');
      console.log(`✅ Extracted ${text.length} characters from TXT`);
      return text;
    } catch (error) {
      console.error('❌ Error reading TXT:', error.message);
      return '';
    }
  }

  async getTextFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    console.log(`📂 File type: ${ext}`);

    if (ext === '.pdf') {
      return await this.extractTextFromPDF(filePath);
    } else if (ext === '.docx') {
      return await this.extractTextFromDOCX(filePath);
    } else if (ext === '.txt') {
      return await this.extractTextFromTXT(filePath);
    } else {
      throw new Error(`❌ Unsupported file format: ${ext}`);
    }
  }

  async extractWithGemini(resumeText) {
    try {
      console.log('\n🤖 Sending to Google Gemini for extraction...');

      const prompt = `
        Please read this resume and extract the following information.
        Return ONLY a JSON object with this exact structure:
        
        {
            "name": "Person's full name",
            "email": "Email address",
            "phone": "Phone number",
            "location": "City/Country",
            "summary": "Professional summary",
            "skills": ["skill1", "skill2", "skill3"],
            "experience": [
                {
                    "job_title": "Job title",
                    "company": "Company name",
                    "duration": "Start - End date",
                    "description": "Key responsibilities"
                }
            ],
            "education": [
                {
                    "degree": "Degree type",
                    "field": "Field of study",
                    "school": "School name",
                    "year": "Graduation year"
                }
            ],
            "certifications": ["cert1", "cert2"]
        }
        
        RESUME TEXT:
        ${resumeText}
        
        Return ONLY the JSON object. No markdown, no code blocks.
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

      const extracted = JSON.parse(cleanText);
      console.log('✅ Gemini successfully extracted data');
      return extracted;
    } catch (error) {
      console.error('❌ Gemini extraction error:', error.message);
      throw new Error(`Gemini extraction failed: ${error.message}`);
    }
  }

  async categorizeSkills(skills) {
    if (!skills || skills.length === 0) {
      return {
        technical: [],
        soft_skills: [],
        tools_frameworks: [],
        languages: []
      };
    }

    try {
      console.log('\n🏷️  Categorizing skills...');

      const prompt = `
        Categorize these skills into 4 categories: Technical, Soft Skills, Tools/Frameworks, Languages
        
        Skills: ${skills.join(', ')}
        
        Return ONLY JSON:
        {
            "technical": [],
            "soft_skills": [],
            "tools_frameworks": [],
            "languages": []
        }
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

      const categorized = JSON.parse(text);
      console.log('✅ Skills categorized');
      return categorized;
    } catch (error) {
      console.error('⚠️  Skill categorization failed:', error.message);
      return {
        technical: [],
        soft_skills: [],
        tools_frameworks: [],
        languages: [],
        uncategorized: skills
      };
    }
  }

  validateExtractedData(data) {
    console.log('\n✔️  Validating extracted data...');

    const warnings = [];
    let isValid = true;

    if (data.error) {
      isValid = false;
      warnings.push(`Extraction error: ${data.error}`);
    }

    if (!data.name) warnings.push('❌ Name not found');
    if (!data.email) warnings.push('⚠️  Email not found');
    if (!data.skills || data.skills.length === 0) warnings.push('⚠️  No skills found');
    if (!data.experience || data.experience.length === 0) warnings.push('⚠️  No work experience found');
    if (!data.education || data.education.length === 0) warnings.push('⚠️  No education information found');

    console.log(`   Validation result: ${isValid ? '✅ Valid' : '⚠️  Has warnings'}`);
    warnings.forEach(w => console.log(`   ${w}`));

    return {
      is_valid: isValid,
      warnings
    };
  }

  async processResume(filePath, userId) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 PROCESSING RESUME: ${path.basename(filePath)}`);
    console.log(`${'='.repeat(60)}`);

    try {
      console.log('\n📖 Step 1: Reading file...');
      const text = await this.getTextFromFile(filePath);
      if (!text) {
        throw new Error('Could not read file');
      }
      console.log(`   ✅ Read ${text.length} characters`);

      console.log('\n📝 Step 2: Extracting data...');
      const extracted = await this.extractWithGemini(text);

      console.log('\n🔍 Step 3: Validating data...');
      const validation = this.validateExtractedData(extracted);

      console.log('\n🏷️  Step 4: Categorizing skills...');
      const skillsCategorized = await this.categorizeSkills(extracted.skills || []);
      extracted.skills_categorized = skillsCategorized;

      console.log(`\n✅ RESUME PROCESSING COMPLETE!`);
      console.log(`${'='.repeat(60)}\n`);

      return {
        success: true,
        data: extracted,
        validation,
        api_used: 'Google Gemini (FREE)'
      };
    } catch (error) {
      console.error(`\n❌ Error processing resume: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ResumeService;
