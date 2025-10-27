const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const { getTextFromFile } = require('../services/textExtract.service');

function resolvePdfParse() {
  let fn = pdfParseMod;
  if (typeof fn === 'function') return fn;
  if (fn && typeof fn === 'object') {
    if (typeof fn.default === 'function') return fn.default;
    if (typeof fn.pdf === 'function') return fn.pdf;
    if (typeof fn.parse === 'function') return fn.parse;
  }
  try {
    // Fallback to direct path in some packaging environments
    const direct = require('pdf-parse/lib/pdf-parse');
    if (typeof direct === 'function') return direct;
  } catch {}
  return null;
}

async function uploadResume(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { originalname, mimetype, buffer, size, path: savedPath } = req.file;
    if (size > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File too large (max 10MB)' });
    }

    let text = '';
    const tempPath = savedPath || path.join(__dirname, `../uploads/${Date.now()}-${originalname}`);
    if (!savedPath) {
      fs.writeFileSync(tempPath, buffer);
    }
    try {
      text = await getTextFromFile(tempPath);
    } finally {
      if (!savedPath && fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }

    if (!text || text.length < 50) {
      return res.status(400).json({ success: false, message: 'Parsed text too short or unreadable' });
    }

    return res.status(200).json({ success: true, resumeText: text.slice(0, 20000), metadata: { name: originalname, size, mimetype } });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  uploadResume
};


