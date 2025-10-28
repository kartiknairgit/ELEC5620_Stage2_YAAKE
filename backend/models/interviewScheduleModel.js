const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  }
});

const interviewScheduleSchema = new mongoose.Schema({
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  proposedSlots: [timeSlotSchema],
  confirmedSlot: {
    start: Date,
    end: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
    default: 'pending',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  location: String,
  meetingLink: String,
  responses: [{
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'change_requested'],
      default: 'pending'
    },
    selectedSlot: {
      start: Date,
      end: Date
    },
    message: String,
    respondedAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
interviewScheduleSchema.index({ 'applicants': 1, status: 1 });
interviewScheduleSchema.index({ recruiter: 1, createdAt: -1 });

// Update the updatedAt timestamp before saving
interviewScheduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('InterviewSchedule', interviewScheduleSchema);
