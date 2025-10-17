const mongoose = require("mongoose");
require("dotenv").config();

// Define Mongoose schema for Interview Session
const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true
    },
    position: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    age: { type: Number, required: true },
    experience: { type: Number, required: true }, // years of experience
    skills: { type: [String], default: [] },

    // Conversation history stores the full chat between user and AI
    conversationHistory: [{
      role: {
        type: String,
        enum: ['user', 'model'],
        required: true
      },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      metadata: { type: mongoose.Schema.Types.Mixed } // For question number, scores, etc.
    }],

    currentQuestionNumber: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 5 }, // Default to 5 questions

    // Scoring metrics
    scores: {
      technical: { type: Number, default: 0, min: 0, max: 100 },
      communication: { type: Number, default: 0, min: 0, max: 100 },
      problemSolving: { type: Number, default: 0, min: 0, max: 100 },
      overall: { type: Number, default: 0, min: 0, max: 100 }
    },

    // AI-generated feedback for each answer
    feedback: [{
      questionNumber: { type: Number },
      question: { type: String },
      answer: { type: String },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      score: { type: Number, min: 0, max: 100 }
    }],

    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress'
    },

    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Index for querying user's interviews
interviewSchema.index({ userId: 1, createdAt: -1 });

// Instance method to add conversation turn
interviewSchema.methods.addConversation = function(role, content, metadata = null) {
  this.conversationHistory.push({
    role,
    content,
    timestamp: new Date(),
    metadata
  });
};

// Instance method to update scores
interviewSchema.methods.updateScores = function(scores) {
  this.scores = { ...this.scores.toObject(), ...scores };
};

// Instance method to add feedback
interviewSchema.methods.addFeedback = function(feedbackItem) {
  this.feedback.push(feedbackItem);
};

// Instance method to complete interview
interviewSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
};

const Interview = mongoose.model("Interviews", interviewSchema, "interviews");
module.exports = Interview;
