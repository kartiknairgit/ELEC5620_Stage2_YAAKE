const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    summary: { type: String },
    // Structured or raw content. Can hold rich JSON or plain text
    content: { type: mongoose.Schema.Types.Mixed },
    // Optional structured sections (e.g., education, experience, skills)
    sections: [{ type: mongoose.Schema.Types.Mixed }],
    tags: [{ type: String, trim: true }],
    visibility: { type: String, enum: ['private', 'public'], default: 'private' },
    source: { type: String, enum: ['manual', 'upload', 'import'], default: 'manual' },
    file: {
      originalName: String,
      mimeType: String,
      size: Number,
    },
  },
  { timestamps: true }
);

// Common query pattern: list by owner, newest first
ResumeSchema.index({ owner: 1, updatedAt: -1 });

module.exports = mongoose.model('Resume', ResumeSchema, 'resumes');

