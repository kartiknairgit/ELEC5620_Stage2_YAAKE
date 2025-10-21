const { validationResult } = require('express-validator');
let pdfParseMod;
try { pdfParseMod = require('pdf-parse'); } catch (e) { pdfParseMod = null; }
const mammoth = require('mammoth');

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

    const { originalname, mimetype, buffer, size } = req.file;
    if (size > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File too large (max 10MB)' });
    }

    let text = '';
    if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
      const pdfParse = resolvePdfParse();
      if (pdfParse) {
        try {
          const parsed = await pdfParse(buffer);
          text = (parsed.text || '').replace(/\s+\n/g, '\n').trim();
        } catch (e) {
          // Fall through to error below if empty
        }
      }
      if (!text) {
        return res.status(400).json({ success: false, message: 'Failed to parse PDF. Please upload DOCX or paste text.' });
      }
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalname.toLowerCase().endsWith('.docx')
    ) {
      const parsed = await mammoth.extractRawText({ buffer });
      text = (parsed.value || '').trim();
    } else if (mimetype.startsWith('text/') || originalname.toLowerCase().endsWith('.txt')) {
      text = buffer.toString('utf8');
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file type. Use PDF, DOCX, or TXT.' });
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


