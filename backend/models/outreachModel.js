const mongoose = require('mongoose');

const outreachSchema = new mongoose.Schema({
  // Applicant Information
  applicantName: { type: String, required: true },
  applicantSkills: [{ type: String }],
  applicantExperience: { type: String },
  applicantEmail: { type: String },

  // Recruiter Information
  recruiterName: { type: String, required: true },
  recruiterEmail: { type: String, required: true },
  recruiterCompany: { type: String, required: true },

  // Generated Email
  subject: { type: String, required: true },
  emailBody: { type: String, required: true },

  // Metadata
  status: {
    type: String,
    enum: ['draft', 'sent', 'failed'],
    default: 'draft'
  },
  sentAt: { type: Date },
  errorMessage: { type: String },

  // User who created this outreach
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Index for efficient queries
outreachSchema.index({ createdBy: 1, status: 1 });
outreachSchema.index({ recruiterEmail: 1 });

module.exports = mongoose.model('Outreach', outreachSchema, 'outreach_emails');
