// File: backend/controllers/jobPostController.js
// Job post controller - handles job post creation

const JobPostService = require('../services/jobPostService');
const JobPost = require('../models/jobPostModel');

const jobPostService = new JobPostService();

exports.createJobPost = async (req, res) => {
  try {
    console.log('\n📨 JOB POST CREATION REQUEST RECEIVED');

    const userId = req.headers['x-user-id'] || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '❌ X-User-ID header or user auth required' });
    }

    console.log(`👤 User ID: ${userId}`);

    const jobDetails = req.body;

    if (!jobDetails.jobTitle) {
      return res.status(400).json({ error: '❌ Job title is required' });
    }

    console.log(`📝 Job Title: ${jobDetails.jobTitle}`);

    const result = await jobPostService.processJobPost(jobDetails, userId);

    console.log('💾 Job post created and stored');

    return res.status(201).json(result);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);

    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

exports.getRecruiterJobPosts = async (req, res) => {
  try {
    const recruiterId = req.user?.id;
    if (!recruiterId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const posts = await JobPost.find({ recruiterId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('❌ Failed to fetch recruiter job posts:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recruiter job posts.',
      error: error.message
    });
  }
};

exports.getPublicJobPosts = async (req, res) => {
  try {
    const { q, location, employmentType, page = 1, limit = 10 } = req.query;
    const filter = { status: 'published' };

    if (q) {
      filter.$text = { $search: q };
    }

    if (location) {
      filter.location = new RegExp(location, 'i');
    }

    if (employmentType) {
      filter.employmentType = new RegExp(employmentType, 'i');
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [total, posts] = await Promise.all([
      JobPost.countDocuments(filter),
      JobPost.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit) || 1)
      }
    });
  } catch (error) {
    console.error('❌ Failed to fetch public job posts:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job postings.',
      error: error.message
    });
  }
};

exports.getJobPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const post = await JobPost.findById(id).lean();
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Job post not found.'
      });
    }

    const isOwner = userId && post.recruiterId?.toString() === userId;

    if (post.status !== 'published' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this job post.'
      });
    }

    return res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('❌ Failed to fetch job post by ID:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job post.',
      error: error.message
    });
  }
};

exports.generateQuick = async (req, res) => {
  try {
    console.log('\n⚡ QUICK GENERATION REQUEST');

    const userId = req.headers['x-user-id'] || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '❌ X-User-ID header or user auth required' });
    }

    const jobDetails = req.body;

    if (!jobDetails.jobTitle) {
      return res.status(400).json({ error: '❌ Job title is required' });
    }

    console.log(`📝 Quick generation for: ${jobDetails.jobTitle}`);

    const jobPost = await jobPostService.generateJobPost(jobDetails);

    return res.status(200).json({
      success: true,
      data: jobPost
    });
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);

    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

exports.checkBias = async (req, res) => {
  try {
    console.log('\n🔍 BIAS CHECK REQUEST');

    const userId = req.headers['x-user-id'] || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '❌ X-User-ID header or user auth required' });
    }

    const { jobPost } = req.body;

    if (!jobPost) {
      return res.status(400).json({ error: '❌ Job post data is required' });
    }

    console.log('🛡️  Checking for bias...');

    const biasCheck = await jobPostService.checkBiasAndInclusion(jobPost);

    return res.status(200).json({
      success: true,
      data: biasCheck
    });
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);

    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

exports.health = (req, res) => {
  res.status(200).json({
    status: '✅ Job post service is running',
    service: 'Job Post Creation & Analysis',
    ai: 'Google Gemini (FREE)',
    database: 'MongoDB (pending integration)'
  });
};

exports.test = (req, res) => {
  res.status(200).json({
    status: '✅ Job post controller working',
    instructions: 'Use POST /api/jobposts/create to create a job post'
  });
};
