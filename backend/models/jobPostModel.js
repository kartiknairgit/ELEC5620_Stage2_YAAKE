const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    employmentType: {
      type: String,
      default: 'Full-time'
    },
    location: {
      type: String,
      trim: true
    },
    experienceLevel: {
      type: String,
      trim: true
    },
    responsibilities: {
      type: [String],
      default: []
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    yearsExperience: {
      type: Number
    },
    salaryRange: {
      type: String,
      trim: true
    },
    aiGenerated: {
      job_title: String,
      role_summary: String,
      key_responsibilities: [String],
      required_qualifications: {
        education: { type: [String], default: [] },
        experience: { type: [String], default: [] },
        skills: { type: [String], default: [] }
      },
      benefits: { type: [String], default: [] },
      full_description: String
    },
    validation: {
      is_valid: Boolean,
      warnings: { type: [String], default: [] }
    },
    bias_check: {
      bias_score: Number,
      bias_detected: Boolean,
      issues: {
        type: [
          new mongoose.Schema(
            {
              type: { type: String },
              text: String,
              suggestion: String
            },
            { _id: false }
          )
        ],
        default: []
      },
      recommendations: { type: [String], default: [] },
      error: String
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

jobPostSchema.index({ status: 1, createdAt: -1 });
jobPostSchema.index({ recruiterId: 1, createdAt: -1 });
jobPostSchema.index({ jobTitle: 'text', location: 'text', department: 'text' });

module.exports = mongoose.model('JobPost', jobPostSchema, 'job_posts');
