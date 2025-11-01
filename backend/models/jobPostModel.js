const mongoose = require('mongoose');

const sanitizeStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

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
    companyName: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    employmentType: {
      type: String,
      default: 'Full-time',
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    salaryRange: {
      type: String,
      trim: true
    },
    experienceLevel: {
      type: String,
      trim: true
    },
    yearsExperience: {
      type: Number,
      min: 0
    },
    description: {
      type: String
    },
    responsibilities: {
      type: [String],
      set: sanitizeStringArray,
      default: []
    },
    requiredSkills: {
      type: [String],
      set: sanitizeStringArray,
      default: []
    },
    tags: {
      type: [String],
      set: sanitizeStringArray,
      default: []
    },
    applicationLink: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true
    },
    analyticsSnapshot: {
      topSkills: {
        type: [
          new mongoose.Schema(
            {
              skill: String,
              count: Number
            },
            { _id: false }
          )
        ],
        default: []
      },
      summary: {
        type: String,
        default: ''
      }
    }
  },
  {
    timestamps: true
  }
);

jobPostSchema.index({ status: 1, createdAt: -1 });
jobPostSchema.index({ jobTitle: 'text', location: 'text', department: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('JobPost', jobPostSchema, 'job_posts');

