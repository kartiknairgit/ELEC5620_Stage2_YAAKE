const Course = require('../models/courseModel');
const promptService = require('../services/prompt.service');

// List courses, with optional search q query parameter
const listCourses = async (req, res) => {
  try {
    // Only return courses created by the authenticated user
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const q = req.query.q || '';
    const filter = { createdBy: req.user._id };
    if (q) {
      // simple text search on title, provider, description
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { provider: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 }).exec();
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('List courses error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching courses', error: error.message });
  }
};

const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).exec();
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching course', error: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, provider, description, signupLink } = req.body;
    if (!title || !provider) return res.status(400).json({ success: false, message: 'Title and provider are required' });
    const course = new Course({ title, provider, description, signupLink, createdBy: req.user ? req.user._id : null });
    await course.save();
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, message: 'Server error creating course', error: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const updates = {};
    ['title','provider','description','signupLink'].forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const updated = await Course.findByIdAndUpdate(req.params.id, updates, { new: true }).exec();
    if (!updated) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, message: 'Server error updating course', error: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const removed = await Course.findByIdAndDelete(req.params.id).exec();
    if (!removed) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting course', error: error.message });
  }
};

// Extract course fields from a URL via the prompt service
const extractFromUrl = async (req, res) => {
  try {
    const url = req.body?.url || req.query?.url;
    if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

    const result = await promptService.extractFromUrl(url);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Extract from URL error:', error);
    return res.status(500).json({ success: false, message: 'Failed to extract metadata', error: error.message });
  }
};

module.exports = {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
  , extractFromUrl
};
