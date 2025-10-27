const fs = require('fs');
const path = require('path');
let pdfParseModule = null;
try { pdfParseModule = require('pdf-parse'); } catch (e) { pdfParseModule = null; }
const mammoth = require('mammoth');

function getPdfParseCallable() {
  const mod = pdfParseModule;
  if (!mod) return null;
  // Common CJS export: function(buffer) -> { text }
  if (typeof mod === 'function') return mod;
  // ESM default export
  if (mod && typeof mod.default === 'function') return mod.default;
  // Some builds may expose a class PDFParse with getText()
  if (mod && typeof mod.PDFParse === 'function') {
    return async (buffer) => {
      const instance = new mod.PDFParse({ data: buffer });
      const result = await instance.getText();
      return { text: String(result?.text || '') };
    };
  }
  // Direct path fallback (rare)
  try {
    const direct = require('pdf-parse/lib/pdf-parse');
    if (typeof direct === 'function') return direct;
  } catch {}
  return null;
}

async function extractTextFromPDF(filePath) {
  const pdfParse = getPdfParseCallable();
  if (!pdfParse) throw new Error('pdf-parse not available');
  const dataBuffer = fs.readFileSync(filePath);
  const result = await pdfParse(dataBuffer);
  const text = String(result?.text || '').replace(/\s+\n/g, '\n').trim();
  return text;
}

async function extractTextFromDOCX(filePath) {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return String(result?.value || '').trim();
}

async function extractTextFromTXT(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

async function getTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return extractTextFromPDF(filePath);
  if (ext === '.docx') return extractTextFromDOCX(filePath);
  if (ext === '.txt') return extractTextFromTXT(filePath);
  throw new Error(`Unsupported file format: ${ext}`);
}

module.exports = {
  getTextFromFile
};


