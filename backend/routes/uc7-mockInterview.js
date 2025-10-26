const express = require('express');
const { body, validationResult } = require('express-validator');
const Interview = require('../models/interviewModel');
const interviewAgent = require('../services/uc7-interviewAgent');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/uc7/start
 * @desc    Start a new mock interview session
 * @access  Protected
 */
router.post(
  '/start',
  protect,
  [
    body('position').trim().notEmpty().withMessage('Position is required'),
    body('company').trim().notEmpty().withMessage('Company is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('age').isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
    body('experience').isInt({ min: 0, max: 50 }).withMessage('Experience must be between 0 and 50 years'),
    body('skills').isArray({ min: 1 }).withMessage('At least one skill is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { position, company, location, age, experience, skills } = req.body;
      const userId = req.user._id;

      // Create interview session in database
      const interview = new Interview({
        userId,
        position,
        company,
        location,
        age,
        experience,
        skills,
        status: 'in_progress'
      });

      await interview.save();

      // Start AI interview agent
      const candidateProfile = { position, company, location, age, experience, skills };
      const firstQuestion = await interviewAgent.startInterview(interview._id.toString(), candidateProfile);

      // Save first question to conversation history
      interview.addConversation('model', firstQuestion.question, {
        questionNumber: 1,
        totalQuestions: firstQuestion.totalQuestions
      });
      interview.currentQuestionNumber = 1;
      interview.totalQuestions = firstQuestion.totalQuestions;
      await interview.save();

      res.status(201).json({
        success: true,
        data: {
          interviewId: interview._id,
          question: firstQuestion.question,
          questionNumber: firstQuestion.questionNumber,
          totalQuestions: firstQuestion.totalQuestions
        }
      });
    } catch (error) {
      console.error('Error starting interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start interview',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/uc7/answer
 * @desc    Submit an answer and get next question
 * @access  Protected
 */
router.post(
  '/answer',
  protect,
  [
    body('interviewId').notEmpty().withMessage('Interview ID is required'),
    body('answer').trim().notEmpty().withMessage('Answer is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { interviewId, answer } = req.body;
      const userId = req.user._id;

      // Find interview session
      const interview = await Interview.findById(interviewId);

      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found'
        });
      }

      // Verify ownership
      if (interview.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to interview session'
        });
      }

      // Check if interview is still in progress
      if (interview.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          message: 'Interview session is not active'
        });
      }

      // Save user's answer to conversation history
      interview.addConversation('user', answer, {
        questionNumber: interview.currentQuestionNumber
      });

      // Get next question from AI agent
      const aiResponse = await interviewAgent.processAnswer(
        interviewId,
        answer,
        interview.currentQuestionNumber
      );

      if (aiResponse.isComplete) {
        // Interview is complete
        interview.currentQuestionNumber = aiResponse.questionNumber;
        await interview.save();

        return res.json({
          success: true,
          data: {
            isComplete: true,
            acknowledgment: aiResponse.acknowledgment,
            message: 'Interview completed. Please finish the interview to get your results.'
          }
        });
      }

      // Save AI's next question to conversation history
      interview.addConversation('model', aiResponse.response, {
        questionNumber: aiResponse.questionNumber,
        totalQuestions: aiResponse.totalQuestions
      });
      interview.currentQuestionNumber = aiResponse.questionNumber;
      await interview.save();

      res.json({
        success: true,
        data: {
          question: aiResponse.response,
          questionNumber: aiResponse.questionNumber,
          totalQuestions: aiResponse.totalQuestions,
          isComplete: false
        }
      });
    } catch (error) {
      console.error('Error processing answer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process answer',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/uc7/finish
 * @desc    Finish interview and get comprehensive feedback
 * @access  Protected
 */
router.post(
  '/finish',
  protect,
  [
    body('interviewId').notEmpty().withMessage('Interview ID is required'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { interviewId } = req.body;
      const userId = req.user._id;

      // Find interview session
      const interview = await Interview.findById(interviewId);

      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Interview session not found'
        });
      }

      // Verify ownership
      if (interview.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to interview session'
        });
      }

      // Generate comprehensive feedback
      const candidateProfile = {
        position: interview.position,
        company: interview.company,
        experience: interview.experience,
        skills: interview.skills
      };

      const feedback = await interviewAgent.generateFeedback(
        interviewId,
        interview.conversationHistory,
        candidateProfile
      );

      // Update interview with scores and feedback
      interview.updateScores(feedback.scores);

      // Add detailed feedback for each question
      if (feedback.detailedFeedback && feedback.detailedFeedback.length > 0) {
        feedback.detailedFeedback.forEach((item, index) => {
          // Find the corresponding question and answer from conversation history
          const questionTurn = interview.conversationHistory.find(
            turn => turn.role === 'model' && turn.metadata?.questionNumber === item.questionNumber
          );
          const answerTurn = interview.conversationHistory.find(
            turn => turn.role === 'user' && turn.metadata?.questionNumber === item.questionNumber
          );

          interview.addFeedback({
            questionNumber: item.questionNumber,
            question: questionTurn?.content || '',
            answer: answerTurn?.content || '',
            strengths: item.strengths || [],
            improvements: item.improvements || [],
            score: item.score || 0
          });
        });
      }

      // Mark interview as completed
      interview.complete();
      await interview.save();

      res.json({
        success: true,
        data: {
          interviewId: interview._id,
          scores: interview.scores,
          overallFeedback: feedback.overallFeedback,
          strengths: feedback.strengths,
          improvements: feedback.improvements,
          detailedFeedback: interview.feedback,
          completedAt: interview.completedAt
        }
      });
    } catch (error) {
      console.error('Error finishing interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to finish interview',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/uc7/history
 * @desc    Get user's interview history
 * @access  Protected
 */
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const interviews = await Interview.find({ userId })
      .select('-conversationHistory') // Exclude large conversation history
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: interviews
    });
  } catch (error) {
    console.error('Error fetching interview history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/uc7/results/:interviewId
 * @desc    Get detailed results for a specific interview
 * @access  Protected
 */
router.get('/results/:interviewId', protect, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user._id;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Verify ownership
    if (interview.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('Error fetching interview results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview results',
      error: error.message
    });
  }
});

module.exports = router;
