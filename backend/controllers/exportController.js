const { validationResult } = require('express-validator');
const { exportDocx } = require('../utils/export.service');

async function exportCoverLetter(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { draftText, title = 'Cover Letter', format = 'docx', download = true } = req.body;

    if (format !== 'docx' && format !== 'txt') {
      return res.status(400).json({ success: false, message: 'Unsupported format. Use docx or txt.' });
    }

    if (format === 'txt') {
      const buffer = Buffer.from(draftText, 'utf8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFileName(title)}.txt"`);
      return res.status(200).send(buffer);
    }

    const buffer = await exportDocx({ body: draftText, title });
    if (download) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFileName(title)}.docx"`);
      return res.status(200).send(buffer);
    }

    // Email flow can be added here using nodemailer/Resend (out of scope for now)
    return res.status(200).json({ success: true, size: buffer.length });
  } catch (err) {
    return next(err);
  }
}

function sanitizeFileName(name) {
  return String(name).replace(/[^a-z0-9\-_. ]/gi, '_');
}

module.exports = {
  exportCoverLetter
};


