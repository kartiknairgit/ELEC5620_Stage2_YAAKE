// File: backend/controllers/resumeController.js
// Resume controller - handles resume upload and parsing

const path = require("path");
const fs = require("fs");
const ResumeService = require("../services/resumeService");

const resumeService = new ResumeService();
const UPLOAD_FOLDER = path.join(__dirname, "../uploads");

if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
}

exports.uploadResume = async (req, res) => {
  try {
    console.log("\n📨 RESUME UPLOAD REQUEST RECEIVED");

    const userId = req.headers["x-user-id"] || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "❌ X-User-ID header or user auth required" });
    }

    console.log(`👤 User ID: ${userId}`);

    if (!req.file) {
      return res.status(400).json({ error: "❌ No file provided" });
    }

    const filePath = req.file.path;
    console.log(`📁 File saved: ${filePath}`);

    const result = await resumeService.processResume(filePath, userId);

    console.log("💾 Resume processed (DB integration pending)");

    fs.unlinkSync(filePath);

    return res.status(200).json(result);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
};

exports.health = (req, res) => {
  res.status(200).json({
    status: "✅ Resume service is running",
    service: "Resume Parsing & Storage",
    ai: "Google Gemini (FREE)",
    database: "MongoDB (pending integration)",
  });
};

exports.test = (req, res) => {
  res.status(200).json({
    status: "✅ Resume controller working",
    instructions: "Use POST /api/resumes/parse to upload a resume",
  });
};

exports.translateResumePdf = async (req, res) => {
  try {
    console.log("\n📨 RESUME PDF TRANSLATION REQUEST RECEIVED");

    const userId = req.headers["x-user-id"] || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "❌ X-User-ID header or user auth required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "❌ No file provided" });
    }

    const filePath = req.file.path;
    console.log(`📁 File saved: ${filePath}`);

    const targetLanguage = req.body.targetLanguage;

    const pdfBuffer = await resumeService.translatePdfToPdf(filePath, targetLanguage);

    // remove temp file
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      /* ignore */
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="translated_resume.pdf"');
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("❌ translateResumePdf error:", error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};