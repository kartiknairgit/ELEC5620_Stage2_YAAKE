// File: backend/services/resumeService.js
// Resume parsing service using Google Gemini API

const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const PDFDocument = require('pdfkit');
const mammoth = require("mammoth");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();
const AgenticAI = require("./agenticAI");

let agent = new AgenticAI();

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

class ResumeService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("❌ GEMINI_API_KEY not found in .env");
    }
    console.log("✅ ResumeService initialized with Gemini API");
  }

  /**
   * Extract text with basic structure detection
   */
  async extractTextFromPDF(filePath) {
    try {
      console.log("📄 Reading PDF file...");
      const dataBuffer = fs.readFileSync(filePath);
      const data = await PDFParser(dataBuffer);
      console.log(`✅ Extracted ${data.text.length} characters from PDF`);
      return data.text;
    } catch (error) {
      console.error("❌ Error reading PDF:", error.message);
      throw error;
    }
  }

  /**
   * Analyze structure and translate in sections for better context
   */
  async translateWithStructure(originalText, targetLanguage) {
    // Split into logical sections (paragraphs separated by multiple newlines)
    const sections = originalText
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`📋 Found ${sections.length} sections to translate`);

    const translatedSections = [];

    // Translate each section with context
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      // Skip very short sections (likely formatting artifacts)
      if (section.length < 3) {
        translatedSections.push(section);
        continue;
      }

      try {
        const prompt = `Translate this resume section to ${targetLanguage}. 
Preserve:
- Line breaks (\\n)
- Bullet points (•, -, *)
- Number lists (1., 2., etc.)
- Capitalization style (ALL CAPS for headers)
- Indentation structure
- translate all the content to ${targetLanguage}

Return ONLY the translated text with the same structure:

${section}`;

        const result = await agent.generateContent(prompt);
        let translated = result.trim();

        // Clean up code fences if present
        translated = translated
          .replace(/^```[\w]*\n?/gm, "")
          .replace(/```$/gm, "")
          .trim();

        translatedSections.push(translated);

        // Progress indicator
        if ((i + 1) % 5 === 0) {
          console.log(`   Translated ${i + 1}/${sections.length} sections...`);
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`⚠️  Error translating section ${i + 1}, using original:`, error.message);
        translatedSections.push(section);
      }
    }

    return translatedSections.join("\n\n");
  }

  /**
   * Create formatted PDF with better text rendering
   */
  async createFormattedPDF(translatedText) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
        bufferPages: true,
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const lines = translatedText.split("\n");
      let inList = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Empty line - add spacing
        if (!trimmed) {
          doc.moveDown(0.5);
          inList = false;
          continue;
        }

        // Detect line type and apply formatting
        const lineType = this.detectLineType(trimmed);

        switch (lineType) {
          case "header":
            // Main headers (ALL CAPS or ending with colon)
            doc.fontSize(13).font("Helvetica-Bold").fillColor("#2c3e50").text(trimmed, { align: "left" }).moveDown(0.4);
            inList = false;
            break;

          case "subheader":
            // Subheaders (Title Case, short lines)
            doc.fontSize(11).font("Helvetica-Bold").fillColor("#34495e").text(trimmed, { align: "left" }).moveDown(0.3);
            inList = false;
            break;

          case "bullet":
            // Bullet points
            const bulletText = trimmed.replace(/^[•\-\*]\s*/, "");
            doc.fontSize(10).font("Helvetica").fillColor("#000000").list([bulletText], {
              bulletRadius: 2,
              textIndent: 20,
              bulletIndent: 10,
            });
            inList = true;
            break;

          case "numbered":
            // Numbered lists
            const numberedText = trimmed.replace(/^\d+[\.\)]\s*/, "");
            doc.fontSize(10).font("Helvetica").fillColor("#000000").text(trimmed, { indent: 15 });
            inList = true;
            break;

          case "bold":
            // Lines that should be bold (dates, company names, etc.)
            doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000").text(trimmed, { align: "left" }).moveDown(0.2);
            inList = false;
            break;

          default:
            // Regular text
            doc
              .fontSize(10)
              .font("Helvetica")
              .fillColor("#000000")
              .text(trimmed, {
                align: "left",
                indent: inList ? 20 : 0,
              })
              .moveDown(0.15);
        }

        // Check if we need a new page
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          inList = false;
        }
      }

      doc.end();
    });
  }

  /**
   * Detect line type for formatting
   */
  detectLineType(line) {
    // Header: ALL CAPS or ends with colon
    if (line === line.toUpperCase() && line.length < 50 && line.length > 2) {
      return "header";
    }
    if (line.endsWith(":") && line.length < 40) {
      return "header";
    }

    // Bullet point
    if (line.match(/^[•\-\*]\s/)) {
      return "bullet";
    }

    // Numbered list
    if (line.match(/^\d+[\.\)]\s/)) {
      return "numbered";
    }

    // Potential subheader (Title Case, short line)
    if (line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/) && line.length < 40) {
      return "subheader";
    }

    // Bold text (dates, companies - contains numbers or is short and capitalized)
    if (line.match(/\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}/) || (line.length < 50 && line.match(/^[A-Z]/))) {
      return "bold";
    }

    return "normal";
  }

  /**
   * Main translation function
   */
  async translatePdfToPdf(filePath, targetLanguage = "Spanish") {
    try {
      console.log(`\n🔁 Translating PDF: ${filePath.split("/").pop()} -> ${targetLanguage}`);

      // Step 1: Extract text
      const originalText = await this.extractTextFromPDF(filePath);
      if (!originalText) throw new Error("Could not extract text from PDF");

      // Step 2: Translate with structure preservation
      console.log("🌐 Translating content...");
      const translatedText = await this.translateWithStructure(originalText, targetLanguage);
      if (!translatedText) throw new Error("Translation returned empty text");

      // Step 3: Create formatted PDF
      console.log("📝 Generating formatted PDF...");
      console.log(translatedText);
      const pdfBuffer = await this.createFormattedPDF(translatedText);

      console.log(`✅ Translation complete (${pdfBuffer.length} bytes)`);
      return pdfBuffer;
    } catch (error) {
      console.error("❌ translatePdfToPdf error:", error.message);
      throw error;
    }
  }

  async extractTextFromPDF(filePath) {
    try {
      console.log("📄 Reading PDF file...");
      const dataBuffer = fs.readFileSync(filePath);
      const pdfParser = new PDFParse({ data: dataBuffer });
      const result = await pdfParser.getText();
      console.log(`✅ Extracted ${result.text.length} characters from PDF`);
      return result.text;
    } catch (error) {
      console.error("❌ Error reading PDF:", error.message);
      return "";
    }
  }

  async extractTextFromDOCX(filePath) {
    try {
      console.log("📄 Reading DOCX file...");
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      console.log(`✅ Extracted ${result.value.length} characters from DOCX`);
      return result.value;
    } catch (error) {
      console.error("❌ Error reading DOCX:", error.message);
      return "";
    }
  }

  async extractTextFromTXT(filePath) {
    try {
      console.log("📄 Reading TXT file...");
      const text = fs.readFileSync(filePath, "utf-8");
      console.log(`✅ Extracted ${text.length} characters from TXT`);
      return text;
    } catch (error) {
      console.error("❌ Error reading TXT:", error.message);
      return "";
    }
  }

  async getTextFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    console.log(`📂 File type: ${ext}`);

    if (ext === ".pdf") {
      return await this.extractTextFromPDF(filePath);
    } else if (ext === ".docx") {
      return await this.extractTextFromDOCX(filePath);
    } else if (ext === ".txt") {
      return await this.extractTextFromTXT(filePath);
    } else {
      throw new Error(`❌ Unsupported file format: ${ext}`);
    }
  }

  async extractWithGemini(resumeText) {
    try {
      console.log("\n🤖 Sending to Google Gemini for extraction...");

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
        model: "gemini-2.0-flash-001",
        contents: prompt,
      });
      const text = result.text.trim();

      let cleanText = text;
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.split("```")[1];
        if (cleanText.startsWith("json")) {
          cleanText = cleanText.substring(4);
        }
      }
      cleanText = cleanText.trim();

      const extracted = JSON.parse(cleanText);
      console.log("✅ Gemini successfully extracted data");
      return extracted;
    } catch (error) {
      console.error("❌ Gemini extraction error:", error.message);
      throw new Error(`Gemini extraction failed: ${error.message}`);
    }
  }

  async categorizeSkills(skills) {
    if (!skills || skills.length === 0) {
      return {
        technical: [],
        soft_skills: [],
        tools_frameworks: [],
        languages: [],
      };
    }

    try {
      console.log("\n🏷️  Categorizing skills...");

      const prompt = `
        Categorize these skills into 4 categories: Technical, Soft Skills, Tools/Frameworks, Languages
        
        Skills: ${skills.join(", ")}
        
        Return ONLY JSON:
        {
            "technical": [],
            "soft_skills": [],
            "tools_frameworks": [],
            "languages": []
        }
      `;

      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: prompt,
      });
      let text = result.text.trim();

      if (text.startsWith("```")) {
        text = text.split("```")[1];
        if (text.startsWith("json")) {
          text = text.substring(4);
        }
      }
      text = text.trim();

      const categorized = JSON.parse(text);
      console.log("✅ Skills categorized");
      return categorized;
    } catch (error) {
      console.error("⚠️  Skill categorization failed:", error.message);
      return {
        technical: [],
        soft_skills: [],
        tools_frameworks: [],
        languages: [],
        uncategorized: skills,
      };
    }
  }

  validateExtractedData(data) {
    console.log("\n✔️  Validating extracted data...");

    const warnings = [];
    let isValid = true;

    if (data.error) {
      isValid = false;
      warnings.push(`Extraction error: ${data.error}`);
    }

    if (!data.name) warnings.push("❌ Name not found");
    if (!data.email) warnings.push("⚠️  Email not found");
    if (!data.skills || data.skills.length === 0) warnings.push("⚠️  No skills found");
    if (!data.experience || data.experience.length === 0) warnings.push("⚠️  No work experience found");
    if (!data.education || data.education.length === 0) warnings.push("⚠️  No education information found");

    console.log(`   Validation result: ${isValid ? "✅ Valid" : "⚠️  Has warnings"}`);
    warnings.forEach((w) => console.log(`   ${w}`));

    return {
      is_valid: isValid,
      warnings,
    };
  }

  async processResume(filePath, userId) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔄 PROCESSING RESUME: ${path.basename(filePath)}`);
    console.log(`${"=".repeat(60)}`);

    try {
      console.log("\n📖 Step 1: Reading file...");
      const text = await this.getTextFromFile(filePath);
      if (!text) {
        throw new Error("Could not read file");
      }
      console.log(`   ✅ Read ${text.length} characters`);

      console.log("\n📝 Step 2: Extracting data...");
      const extracted = await this.extractWithGemini(text);

      console.log("\n🔍 Step 3: Validating data...");
      const validation = this.validateExtractedData(extracted);

      console.log("\n🏷️  Step 4: Categorizing skills...");
      const skillsCategorized = await this.categorizeSkills(extracted.skills || []);
      extracted.skills_categorized = skillsCategorized;

      console.log(`\n✅ RESUME PROCESSING COMPLETE!`);
      console.log(`${"=".repeat(60)}\n`);

      return {
        success: true,
        data: extracted,
        validation,
        api_used: "Google Gemini (FREE)",
      };
    } catch (error) {
      console.error(`\n❌ Error processing resume: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ResumeService;
