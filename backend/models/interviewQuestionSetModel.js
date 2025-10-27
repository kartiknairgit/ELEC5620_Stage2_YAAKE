const mongoose = require("mongoose");

// Define schema for individual questions within a question set
const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ["technical", "behavioral", "problem-solving", "culture-fit"],
  },
  suggestedAnswer: { type: String }, // Optional sample answer
  evaluationCriteria: [{ type: String }], // Key points to look for in answers
  isCustom: { type: Boolean, default: false }, // Whether recruiter manually added this
  feedbackFromRecruiter: { type: String }, // Recruiter's notes on this question
  biasWarning: { type: String }, // If AI detected potential bias
});

// Main schema for interview question sets
const interviewQuestionSetSchema = new mongoose.Schema(
  {
    // Recruiter Information
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    companyName: { type: String, index: true }, // From recruiter's profile

    // Job Context
    jobTitle: { type: String, required: true },
    jobDescription: { type: String },
    requiredSkills: [{ type: String }],
    experienceLevel: {
      type: String,
      enum: ["junior", "mid-level", "senior", "executive"],
    },

    // Candidate Context (optional)
    candidateResume: { type: String }, // Text or reference to resume
    candidateName: { type: String },

    // Generated Questions
    questions: [questionSchema],

    // Visibility & Usage
    visibility: {
      type: String,
      enum: ["private", "company_template", "public_sample"],
      default: "private",
      index: true,
    },
    isTemplate: { type: Boolean, default: false }, // Deprecated in favor of visibility
    isPublicSample: { type: Boolean, default: false }, // Deprecated in favor of visibility

    // Metadata
    usageCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
    recruiterFeedback: { type: String }, // Overall feedback on the generated set
    aiGenerationMetadata: {
      model: { type: String },
      generatedAt: { type: Date },
      promptVersion: { type: String },
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
interviewQuestionSetSchema.index({ recruiterId: 1, createdAt: -1 });
interviewQuestionSetSchema.index({ companyName: 1, visibility: 1 });
interviewQuestionSetSchema.index({ visibility: 1, createdAt: -1 });

// Instance method to increment usage count
interviewQuestionSetSchema.methods.recordUsage = function () {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

const InterviewQuestionSet = mongoose.model(
  "InterviewQuestionSet",
  interviewQuestionSetSchema,
  "interview_question_sets"
);

module.exports = InterviewQuestionSet;
