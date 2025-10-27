const Outreach = require('../models/outreachModel');
const { generateOutreachEmail, regenerateEmail } = require('../services/emailGenerator.service');
const { sendEmail } = require('../services/emailSender.service');
const { generateEmailPDF, generateEmailText } = require('../services/pdfExport.service');

/**
 * Generate a new outreach email using AI
 * POST /api/outreach/generate
 */
const generateEmail = async (req, res) => {
  try {
    const { applicantName, applicantSkills, applicantExperience, applicantEmail, recruiterName, recruiterEmail, recruiterCompany } = req.body;

    // Validation
    if (!applicantName || !recruiterName || !recruiterEmail || !recruiterCompany) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: applicantName, recruiterName, recruiterEmail, recruiterCompany'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recruiterEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recruiter email address'
      });
    }

    // Generate email using AI
    const { subject, body } = await generateOutreachEmail(
      { name: applicantName, skills: applicantSkills, experience: applicantExperience, email: applicantEmail },
      { name: recruiterName, email: recruiterEmail, company: recruiterCompany }
    );

    // Save to database as draft
    const outreach = new Outreach({
      applicantName,
      applicantSkills: Array.isArray(applicantSkills) ? applicantSkills : (applicantSkills ? applicantSkills.split(',').map(s => s.trim()) : []),
      applicantExperience,
      applicantEmail,
      recruiterName,
      recruiterEmail,
      recruiterCompany,
      subject,
      emailBody: body,
      status: 'draft',
      createdBy: req.user._id
    });

    await outreach.save();

    res.status(201).json({
      success: true,
      message: 'Email generated successfully',
      data: outreach
    });
  } catch (error) {
    console.error('Generate email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate email',
      error: error.message
    });
  }
};

/**
 * Regenerate email with different instructions
 * POST /api/outreach/:id/regenerate
 */
const regenerateEmailContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { instructions } = req.body;

    const outreach = await Outreach.findById(id);
    if (!outreach) {
      return res.status(404).json({ success: false, message: 'Outreach email not found' });
    }

    // Check ownership
    if (outreach.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this email' });
    }

    // Regenerate with AI
    const { subject, body } = await regenerateEmail(
      { name: outreach.applicantName, skills: outreach.applicantSkills, experience: outreach.applicantExperience },
      { name: outreach.recruiterName, company: outreach.recruiterCompany },
      instructions
    );

    outreach.subject = subject;
    outreach.emailBody = body;
    await outreach.save();

    res.json({
      success: true,
      message: 'Email regenerated successfully',
      data: outreach
    });
  } catch (error) {
    console.error('Regenerate email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate email',
      error: error.message
    });
  }
};

/**
 * Get all outreach emails for current user
 * GET /api/outreach
 */
const listOutreach = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { createdBy: req.user._id };

    if (status && ['draft', 'sent', 'failed'].includes(status)) {
      filter.status = status;
    }

    const outreaches = await Outreach.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: outreaches
    });
  } catch (error) {
    console.error('List outreach error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch outreach emails',
      error: error.message
    });
  }
};

/**
 * Get single outreach email
 * GET /api/outreach/:id
 */
const getOutreach = async (req, res) => {
  try {
    const outreach = await Outreach.findById(req.params.id);

    if (!outreach) {
      return res.status(404).json({ success: false, message: 'Outreach email not found' });
    }

    // Check ownership
    if (outreach.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this email' });
    }

    res.json({
      success: true,
      data: outreach
    });
  } catch (error) {
    console.error('Get outreach error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch outreach email',
      error: error.message
    });
  }
};

/**
 * Update outreach email manually
 * PATCH /api/outreach/:id
 */
const updateOutreach = async (req, res) => {
  try {
    const { subject, emailBody } = req.body;
    const outreach = await Outreach.findById(req.params.id);

    if (!outreach) {
      return res.status(404).json({ success: false, message: 'Outreach email not found' });
    }

    // Check ownership
    if (outreach.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this email' });
    }

    if (subject) outreach.subject = subject;
    if (emailBody) outreach.emailBody = emailBody;

    await outreach.save();

    res.json({
      success: true,
      message: 'Outreach email updated successfully',
      data: outreach
    });
  } catch (error) {
    console.error('Update outreach error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update outreach email',
      error: error.message
    });
  }
};

/**
 * Send outreach email
 * POST /api/outreach/:id/send
 */
const sendOutreach = async (req, res) => {
  try {
    const outreach = await Outreach.findById(req.params.id);

    if (!outreach) {
      return res.status(404).json({ success: false, message: 'Outreach email not found' });
    }

    // Check ownership
    if (outreach.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to send this email' });
    }

    // Prevent re-sending already sent emails
    if (outreach.status === 'sent') {
      return res.status(400).json({ success: false, message: 'Email already sent' });
    }

    // Send email
    const result = await sendEmail({
      to: outreach.recruiterEmail,
      subject: outreach.subject,
      body: outreach.emailBody,
      replyTo: outreach.applicantEmail
    });

    if (result.success) {
      outreach.status = 'sent';
      outreach.sentAt = new Date();
      outreach.errorMessage = null;
      await outreach.save();

      res.json({
        success: true,
        message: 'Email sent successfully',
        data: outreach
      });
    } else {
      outreach.status = 'failed';
      outreach.errorMessage = result.error;
      await outreach.save();

      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.error,
        data: outreach
      });
    }
  } catch (error) {
    console.error('Send outreach error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

/**
 * Delete outreach email
 * DELETE /api/outreach/:id
 */
const deleteOutreach = async (req, res) => {
  try {
    const outreach = await Outreach.findById(req.params.id);

    if (!outreach) {
      return res.status(404).json({ success: false, message: 'Outreach email not found' });
    }

    // Check ownership
    if (outreach.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this email' });
    }

    await Outreach.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Outreach email deleted successfully'
    });
  } catch (error) {
    console.error('Delete outreach error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete outreach email',
      error: error.message
    });
  }
};

/**
 * Export email as PDF
 * GET /api/outreach/:id/export/pdf
 */
const exportPDF = async (req, res) => {
  try {
    const outreach = await Outreach.findById(req.params.id);

    if (!outreach) {
      return res.status(404).json({ success: false, message: 'Outreach email not found' });
    }

    // Check ownership
    if (outreach.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to export this email' });
    }

    const pdfDoc = generateEmailPDF({
      subject: outreach.subject,
      body: outreach.emailBody,
      applicantName: outreach.applicantName,
      recruiterName: outreach.recruiterName,
      recruiterCompany: outreach.recruiterCompany,
      createdAt: outreach.createdAt
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="outreach-${outreach._id}.pdf"`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export PDF',
      error: error.message
    });
  }
};

/**
 * Export email as text
 * GET /api/outreach/:id/export/text
 */
const exportText = async (req, res) => {
  try {
    const outreach = await Outreach.findById(req.params.id);

    if (!outreach) {
      return res.status(404).json({ success: false, message: 'Outreach email not found' });
    }

    // Check ownership
    if (outreach.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to export this email' });
    }

    const textContent = generateEmailText({
      subject: outreach.subject,
      body: outreach.emailBody,
      applicantName: outreach.applicantName,
      recruiterName: outreach.recruiterName,
      recruiterCompany: outreach.recruiterCompany,
      createdAt: outreach.createdAt
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="outreach-${outreach._id}.txt"`);
    res.send(textContent);
  } catch (error) {
    console.error('Export text error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export text',
      error: error.message
    });
  }
};

module.exports = {
  generateEmail,
  regenerateEmailContent,
  listOutreach,
  getOutreach,
  updateOutreach,
  sendOutreach,
  deleteOutreach,
  exportPDF,
  exportText
};
