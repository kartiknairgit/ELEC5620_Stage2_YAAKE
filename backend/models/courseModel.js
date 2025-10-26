const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  description: { type: String },
  provider: { type: String, required: true },
  signupLink: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema, 'courses');
