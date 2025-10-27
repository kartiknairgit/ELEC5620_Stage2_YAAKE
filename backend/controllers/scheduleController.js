const InterviewSchedule = require('../models/interviewScheduleModel');
const User = require('../models/userModel');

/**
 * Create new interview schedule (Recruiter only)
 * POST /api/schedule
 */
const createInterview = async (req, res) => {
  try {
    const { applicants, proposedSlots, title, description, location, meetingLink } = req.body;

    // Validate requester is a recruiter
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Only recruiters can create interview schedules'
      });
    }

    // Validation
    if (!applicants || applicants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one applicant is required'
      });
    }

    if (!proposedSlots || proposedSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one time slot is required'
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Interview title is required'
      });
    }

    // Verify all applicants exist and are applicants
    const applicantUsers = await User.find({
      _id: { $in: applicants },
      role: 'applicant'
    });

    if (applicantUsers.length !== applicants.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more applicants not found or invalid role'
      });
    }

    // Check for conflicts with existing confirmed interviews
    const conflicts = await checkScheduleConflicts(req.user._id, proposedSlots, applicants);
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Time slot conflicts detected',
        conflicts
      });
    }

    // Create interview schedule
    const interview = new InterviewSchedule({
      recruiter: req.user._id,
      applicants,
      proposedSlots,
      title,
      description,
      location,
      meetingLink,
      responses: applicants.map(applicantId => ({
        applicant: applicantId,
        status: 'pending'
      }))
    });

    await interview.save();
    await interview.populate('recruiter applicants', 'email role');

    res.status(201).json({
      success: true,
      message: 'Interview schedule created successfully',
      data: interview
    });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create interview schedule',
      error: error.message
    });
  }
};

/**
 * Get all interviews for current user
 * GET /api/schedule
 */
const getMyInterviews = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'recruiter') {
      query.recruiter = req.user._id;
    } else {
      query.applicants = req.user._id;
    }

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const interviews = await InterviewSchedule.find(query)
      .populate('recruiter', 'email role')
      .populate('applicants', 'email role')
      .populate('responses.applicant', 'email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: interviews
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews',
      error: error.message
    });
  }
};

/**
 * Get single interview details
 * GET /api/schedule/:id
 */
const getInterview = async (req, res) => {
  try {
    const interview = await InterviewSchedule.findById(req.params.id)
      .populate('recruiter', 'email role')
      .populate('applicants', 'email role')
      .populate('responses.applicant', 'email role');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user has access
    const isRecruiter = interview.recruiter._id.toString() === req.user._id.toString();
    const isApplicant = interview.applicants.some(
      app => app._id.toString() === req.user._id.toString()
    );

    if (!isRecruiter && !isApplicant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this interview'
      });
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview',
      error: error.message
    });
  }
};

/**
 * Respond to interview invitation (Applicant only)
 * POST /api/schedule/:id/respond
 */
const respondToInterview = async (req, res) => {
  try {
    const { status, selectedSlot, message } = req.body;

    // Validate status
    if (!['accepted', 'rejected', 'change_requested'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid response status'
      });
    }

    const interview = await InterviewSchedule.findById(req.params.id)
      .populate('recruiter', 'email role')
      .populate('applicants', 'email role');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user is an applicant in this interview
    const applicantIndex = interview.applicants.findIndex(
      app => app._id.toString() === req.user._id.toString()
    );

    if (applicantIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this interview'
      });
    }

    // Find response
    const responseIndex = interview.responses.findIndex(
      resp => resp.applicant.toString() === req.user._id.toString()
    );

    if (responseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }

    // Validate selected slot if accepting
    if (status === 'accepted') {
      if (!selectedSlot || !selectedSlot.start || !selectedSlot.end) {
        return res.status(400).json({
          success: false,
          message: 'Selected time slot is required when accepting'
        });
      }

      // Verify the selected slot is in proposed slots
      const slotExists = interview.proposedSlots.some(slot =>
        new Date(slot.start).getTime() === new Date(selectedSlot.start).getTime() &&
        new Date(slot.end).getTime() === new Date(selectedSlot.end).getTime()
      );

      if (!slotExists) {
        return res.status(400).json({
          success: false,
          message: 'Selected slot is not in proposed time slots'
        });
      }

      // Check for conflicts
      const conflicts = await checkScheduleConflicts(
        req.user._id,
        [selectedSlot],
        [],
        interview._id
      );

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Selected time slot conflicts with your existing schedules',
          conflicts
        });
      }

      // Update interview with confirmed slot
      interview.confirmedSlot = selectedSlot;
      interview.status = 'confirmed';
    } else if (status === 'rejected') {
      interview.status = 'rejected';
    }

    // Update response
    interview.responses[responseIndex] = {
      applicant: req.user._id,
      status,
      selectedSlot: status === 'accepted' ? selectedSlot : undefined,
      message,
      respondedAt: new Date()
    };

    await interview.save();
    await interview.populate('responses.applicant', 'email role');

    res.json({
      success: true,
      message: 'Response submitted successfully',
      data: interview
    });
  } catch (error) {
    console.error('Respond to interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit response',
      error: error.message
    });
  }
};

/**
 * Update interview (Recruiter only)
 * PATCH /api/schedule/:id
 */
const updateInterview = async (req, res) => {
  try {
    const interview = await InterviewSchedule.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user is the recruiter
    if (interview.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this interview'
      });
    }

    // Update allowed fields
    const { title, description, location, meetingLink, proposedSlots, status } = req.body;

    if (title) interview.title = title;
    if (description !== undefined) interview.description = description;
    if (location !== undefined) interview.location = location;
    if (meetingLink !== undefined) interview.meetingLink = meetingLink;
    if (proposedSlots) interview.proposedSlots = proposedSlots;
    if (status) interview.status = status;

    await interview.save();
    await interview.populate('recruiter applicants responses.applicant', 'email role');

    res.json({
      success: true,
      message: 'Interview updated successfully',
      data: interview
    });
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interview',
      error: error.message
    });
  }
};

/**
 * Cancel interview
 * DELETE /api/schedule/:id
 */
const cancelInterview = async (req, res) => {
  try {
    const interview = await InterviewSchedule.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user is the recruiter
    if (interview.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this interview'
      });
    }

    interview.status = 'cancelled';
    await interview.save();

    res.json({
      success: true,
      message: 'Interview cancelled successfully',
      data: interview
    });
  } catch (error) {
    console.error('Cancel interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel interview',
      error: error.message
    });
  }
};

/**
 * Get all applicants (for recruiter dropdown)
 * GET /api/schedule/applicants/list
 */
const getAllApplicants = async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Only recruiters can access this endpoint'
      });
    }

    const applicants = await User.find({ role: 'applicant', isVerified: true })
      .select('email createdAt')
      .sort({ email: 1 });

    res.json({
      success: true,
      data: applicants
    });
  } catch (error) {
    console.error('Get applicants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applicants',
      error: error.message
    });
  }
};

/**
 * Helper function to check schedule conflicts
 */
async function checkScheduleConflicts(userId, proposedSlots, additionalUserIds = [], excludeInterviewId = null) {
  const userIds = [userId, ...additionalUserIds];
  const conflicts = [];

  for (const slot of proposedSlots) {
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);

    // Find confirmed interviews that overlap with this slot
    const query = {
      status: 'confirmed',
      $or: [
        { recruiter: { $in: userIds } },
        { applicants: { $in: userIds } }
      ],
      'confirmedSlot.start': { $lt: slotEnd },
      'confirmedSlot.end': { $gt: slotStart }
    };

    if (excludeInterviewId) {
      query._id = { $ne: excludeInterviewId };
    }

    const conflictingInterviews = await InterviewSchedule.find(query)
      .populate('recruiter applicants', 'email');

    if (conflictingInterviews.length > 0) {
      conflicts.push({
        slot,
        conflicts: conflictingInterviews
      });
    }
  }

  return conflicts;
}

module.exports = {
  createInterview,
  getMyInterviews,
  getInterview,
  respondToInterview,
  updateInterview,
  cancelInterview,
  getAllApplicants
};
