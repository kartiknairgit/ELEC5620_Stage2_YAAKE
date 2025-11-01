const JobPostService = require('../services/jobPostService');
const JobPost = require('../models/jobPostModel');

exports.create = async (req, res) => {
  try {
    const recruiterId = req.user?._id;
    if (!recruiterId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const payload = req.body || {};

    if (!payload.jobTitle || !payload.jobTitle.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Job title is required.'
      });
    }

    const createdPost = await JobPostService.createJobPost(payload, recruiterId);

    return res.status(201).json({
      success: true,
      message: 'Job post created successfully.',
      data: createdPost
    });
  } catch (error) {
    console.error('Error creating job post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create job post.',
      error: error.message
    });
  }
};

exports.listPublic = async (req, res) => {
  try {
    const { q, location, employmentType, page, limit } = req.query;
    const result = await JobPostService.listPublicPosts({
      searchTerm: q,
      location,
      employmentType,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      data: result.posts,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching public job posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job posts.',
      error: error.message
    });
  }
};

exports.listMine = async (req, res) => {
  try {
    const recruiterId = req.user?._id;
    if (!recruiterId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const posts = await JobPostService.listRecruiterPosts(recruiterId);
    return res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching recruiter job posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recruiter job posts.',
      error: error.message
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await JobPostService.getJobPostById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Job post not found.'
      });
    }

    const requesterId = req.user?._id?.toString();

    if (post.status !== 'published') {
      if (!requesterId || post.recruiterId.toString() !== requesterId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this job post.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching job post by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job post.',
      error: error.message
    });
  }
};

exports.getCareerInsights = async (req, res) => {
  try {
    const { lookbackDays } = req.query;
    const insights = await JobPostService.getCareerInsights({ lookbackDays });

    return res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error generating career insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate insights.',
      error: error.message
    });
  }
};

exports.health = (_req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Job post service operational.',
    timestamp: new Date().toISOString()
  });
};

