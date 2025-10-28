const InterviewQuestionSet = require('../models/interviewQuestionSetModel');
const User = require('../models/userModel');
const { generateInterviewQuestions, regenerateQuestions } = require('../services/questionGenerator.service');
const PDFDocument = require('pdfkit');

/**
 * Generate interview questions using AI
 * POST /api/questions/generate
 * RECRUITER ONLY
 */
const generateQuestions = async (req, res) => {
  console.log('\n========== GENERATE QUESTIONS REQUEST ==========');
  console.log('DEBUG 1: Request received at /api/questions/generate');
  console.log('DEBUG 2: Request body:', JSON.stringify(req.body, null, 2));
  console.log('DEBUG 3: User info:', { userId: req.user?._id, email: req.user?.email, role: req.user?.role });

  try {
    const {
      jobTitle,
      jobDescription,
      requiredSkills,
      experienceLevel,
      categories,
      numberOfQuestions,
      candidateResume,
      candidateName
    } = req.body;

    console.log('DEBUG 4: Extracted data:', {
      jobTitle,
      hasDescription: !!jobDescription,
      skillsCount: Array.isArray(requiredSkills) ? requiredSkills.length : 0,
      experienceLevel,
      categoriesCount: Array.isArray(categories) ? categories.length : 0,
      numberOfQuestions
    });

    // Validation
    if (!jobTitle) {
      console.log('DEBUG 5: Validation failed - Job title missing');
      return res.status(400).json({
        success: false,
        message: 'Job title is required'
      });
    }

    console.log('DEBUG 6: Fetching recruiter info from database...');
    // Get recruiter's company name from their profile
    const recruiter = await User.findById(req.user._id);
    const companyName = recruiter.companyName || 'Unknown Company';
    console.log('DEBUG 7: Recruiter company name:', companyName);

    console.log('DEBUG 8: Calling AI service to generate questions...');
    // Generate questions using AI service
    const questions = await generateInterviewQuestions({
      jobTitle,
      jobDescription,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      experienceLevel: experienceLevel || 'mid-level',
      categories: Array.isArray(categories) ? categories : ['technical', 'behavioral', 'problem-solving', 'culture-fit'],
      numberOfQuestions: numberOfQuestions || 10,
      candidateResume: candidateResume || ''
    });

    console.log('DEBUG 9: AI generated', questions.length, 'questions');

    // Save to database
    const questionSet = new InterviewQuestionSet({
      recruiterId: req.user._id,
      companyName,
      jobTitle,
      jobDescription,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      experienceLevel: experienceLevel || 'mid-level',
      candidateResume,
      candidateName,
      questions,
      visibility: 'private',
      aiGenerationMetadata: {
        model: 'gemini-2.0-flash',
        generatedAt: new Date(),
        promptVersion: '1.0'
      }
    });

    console.log('DEBUG 10: Saving question set to database...');
    await questionSet.save();
    console.log('DEBUG 11: Question set saved with ID:', questionSet._id);

    console.log('DEBUG 12: Sending success response');
    res.status(201).json({
      success: true,
      message: 'Interview questions generated successfully',
      data: questionSet
    });
    console.log('========== REQUEST COMPLETED SUCCESSFULLY ==========\n');
  } catch (error) {
    console.error('\n========== ERROR IN GENERATE QUESTIONS ==========');
    console.error('DEBUG ERROR 1: Error type:', error.name);
    console.error('DEBUG ERROR 2: Error message:', error.message);
    console.error('DEBUG ERROR 3: Error stack:', error.stack);
    console.error('========== END ERROR ==========\n');

    res.status(500).json({
      success: false,
      message: 'Failed to generate interview questions',
      error: error.message
    });
  }
};

/**
 * Get all question sets for current recruiter
 * GET /api/questions/my-sets
 * RECRUITER ONLY
 */
const getMyQuestionSets = async (req, res) => {
  try {
    const { visibility, jobTitle, experienceLevel } = req.query;
    const filter = { recruiterId: req.user._id };

    if (visibility && ['private', 'company_template', 'public_sample'].includes(visibility)) {
      filter.visibility = visibility;
    }

    if (jobTitle) {
      filter.jobTitle = new RegExp(jobTitle, 'i');
    }

    if (experienceLevel) {
      filter.experienceLevel = experienceLevel;
    }

    const questionSets = await InterviewQuestionSet.find(filter)
      .sort({ createdAt: -1 })
      .select('-questions.feedbackFromRecruiter'); // Exclude detailed feedback for list view

    res.json({
      success: true,
      count: questionSets.length,
      data: questionSets
    });
  } catch (error) {
    console.error('List question sets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question sets',
      error: error.message
    });
  }
};

/**
 * Get public sample questions (for applicants)
 * GET /api/questions/samples
 * PUBLIC/PROTECTED - ALL USERS
 */
const getPublicSamples = async (req, res) => {
  try {
    const { category, experienceLevel, limit } = req.query;
    const filter = { visibility: 'public_sample' };

    if (experienceLevel) {
      filter.experienceLevel = experienceLevel;
    }

    const questionSets = await InterviewQuestionSet.find(filter)
      .sort({ usageCount: -1, createdAt: -1 })
      .limit(parseInt(limit) || 20)
      .select('jobTitle experienceLevel companyName questions createdAt usageCount');

    // If category filter, filter questions within each set
    const filteredSets = category
      ? questionSets.map(set => ({
          ...set.toObject(),
          questions: set.questions.filter(q => q.category === category)
        }))
      : questionSets;

    res.json({
      success: true,
      count: filteredSets.length,
      data: filteredSets
    });
  } catch (error) {
    console.error('Get public samples error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sample questions',
      error: error.message
    });
  }
};

/**
 * Get company templates (for applicants to browse)
 * GET /api/questions/templates
 * PUBLIC/PROTECTED - ALL USERS
 */
const getCompanyTemplates = async (req, res) => {
  try {
    const { companyName, experienceLevel, limit } = req.query;
    const filter = { visibility: 'company_template' };

    if (companyName) {
      filter.companyName = new RegExp(companyName, 'i');
    }

    if (experienceLevel) {
      filter.experienceLevel = experienceLevel;
    }

    const templates = await InterviewQuestionSet.find(filter)
      .sort({ companyName: 1, createdAt: -1 })
      .limit(parseInt(limit) || 50)
      .select('jobTitle experienceLevel companyName questions createdAt usageCount');

    // Group by company for better organization
    const groupedByCompany = templates.reduce((acc, template) => {
      const company = template.companyName || 'Unknown';
      if (!acc[company]) {
        acc[company] = [];
      }
      acc[company].push(template);
      return acc;
    }, {});

    res.json({
      success: true,
      count: templates.length,
      companies: Object.keys(groupedByCompany).length,
      data: groupedByCompany
    });
  } catch (error) {
    console.error('Get company templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company templates',
      error: error.message
    });
  }
};

/**
 * Get single question set by ID
 * GET /api/questions/:id
 * PROTECTED - Role-based access (recruiters: own sets, applicants: public/templates only)
 */
const getQuestionSetById = async (req, res) => {
  try {
    const questionSet = await InterviewQuestionSet.findById(req.params.id);

    if (!questionSet) {
      return res.status(404).json({
        success: false,
        message: 'Question set not found'
      });
    }

    // Access control
    const isOwner = questionSet.recruiterId.toString() === req.user._id.toString();
    const isRecruiter = req.user.role === 'recruiter';
    const isPublic = ['public_sample', 'company_template'].includes(questionSet.visibility);

    // Recruiters can see their own sets, applicants can only see public/template sets
    if (!isOwner && !isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this question set'
      });
    }

    // Record usage
    await questionSet.recordUsage();

    res.json({
      success: true,
      data: questionSet
    });
  } catch (error) {
    console.error('Get question set error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question set',
      error: error.message
    });
  }
};

/**
 * Update question set (edit questions, change visibility)
 * PATCH /api/questions/:id
 * RECRUITER ONLY - Owner check
 */
const updateQuestionSet = async (req, res) => {
  try {
    const questionSet = await InterviewQuestionSet.findById(req.params.id);

    if (!questionSet) {
      return res.status(404).json({
        success: false,
        message: 'Question set not found'
      });
    }

    // Check ownership
    if (questionSet.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this question set'
      });
    }

    // Allowed updates
    const allowedUpdates = [
      'jobTitle',
      'jobDescription',
      'requiredSkills',
      'experienceLevel',
      'questions',
      'visibility',
      'candidateName',
      'candidateResume'
    ];

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        questionSet[key] = req.body[key];
      }
    });

    await questionSet.save();

    res.json({
      success: true,
      message: 'Question set updated successfully',
      data: questionSet
    });
  } catch (error) {
    console.error('Update question set error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question set',
      error: error.message
    });
  }
};

/**
 * Delete question set
 * DELETE /api/questions/:id
 * RECRUITER ONLY - Owner check
 */
const deleteQuestionSet = async (req, res) => {
  try {
    const questionSet = await InterviewQuestionSet.findById(req.params.id);

    if (!questionSet) {
      return res.status(404).json({
        success: false,
        message: 'Question set not found'
      });
    }

    // Check ownership
    if (questionSet.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question set'
      });
    }

    await InterviewQuestionSet.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Question set deleted successfully'
    });
  } catch (error) {
    console.error('Delete question set error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question set',
      error: error.message
    });
  }
};

/**
 * Toggle question set visibility (make it a template or public sample)
 * POST /api/questions/:id/visibility
 * RECRUITER ONLY - Owner check
 */
const updateVisibility = async (req, res) => {
  try {
    const { visibility } = req.body;

    if (!['private', 'company_template', 'public_sample'].includes(visibility)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visibility value. Must be: private, company_template, or public_sample'
      });
    }

    const questionSet = await InterviewQuestionSet.findById(req.params.id);

    if (!questionSet) {
      return res.status(404).json({
        success: false,
        message: 'Question set not found'
      });
    }

    // Check ownership
    if (questionSet.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this question set'
      });
    }

    questionSet.visibility = visibility;
    await questionSet.save();

    res.json({
      success: true,
      message: `Question set visibility updated to ${visibility}`,
      data: questionSet
    });
  } catch (error) {
    console.error('Update visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update visibility',
      error: error.message
    });
  }
};

/**
 * Provide feedback on question set
 * POST /api/questions/:id/feedback
 * RECRUITER ONLY - Owner check
 */
const provideFeedback = async (req, res) => {
  try {
    const { feedback } = req.body;

    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback text is required'
      });
    }

    const questionSet = await InterviewQuestionSet.findById(req.params.id);

    if (!questionSet) {
      return res.status(404).json({
        success: false,
        message: 'Question set not found'
      });
    }

    // Check ownership
    if (questionSet.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to provide feedback on this question set'
      });
    }

    questionSet.recruiterFeedback = feedback;
    await questionSet.save();

    res.json({
      success: true,
      message: 'Feedback saved successfully',
      data: questionSet
    });
  } catch (error) {
    console.error('Provide feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save feedback',
      error: error.message
    });
  }
};

/**
 * Export question set as PDF
 * GET /api/questions/:id/export/pdf
 * PROTECTED - Role-based access
 */
const exportQuestionSetPDF = async (req, res) => {
  try {
    const questionSet = await InterviewQuestionSet.findById(req.params.id);

    if (!questionSet) {
      return res.status(404).json({
        success: false,
        message: 'Question set not found'
      });
    }

    // Access control (same as getQuestionSetById)
    const isOwner = questionSet.recruiterId.toString() === req.user._id.toString();
    const isPublic = ['public_sample', 'company_template'].includes(questionSet.visibility);

    if (!isOwner && !isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export this question set'
      });
    }

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="interview-questions-${questionSet.jobTitle.replace(/\s+/g, '-')}.pdf"`);

    doc.pipe(res);

    // PDF Content
    doc.fontSize(20).text('Interview Questions', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Job Title: ${questionSet.jobTitle}`);
    doc.text(`Company: ${questionSet.companyName || 'N/A'}`);
    doc.text(`Experience Level: ${questionSet.experienceLevel || 'N/A'}`);
    if (questionSet.requiredSkills && questionSet.requiredSkills.length > 0) {
      doc.text(`Required Skills: ${questionSet.requiredSkills.join(', ')}`);
    }
    doc.moveDown();

    if (questionSet.jobDescription) {
      doc.fontSize(10).text(`Job Description: ${questionSet.jobDescription}`, {
        width: 500
      });
      doc.moveDown();
    }

    doc.fontSize(14).text('Questions:', { underline: true });
    doc.moveDown();

    // Group questions by category
    const questionsByCategory = questionSet.questions.reduce((acc, q) => {
      if (!acc[q.category]) acc[q.category] = [];
      acc[q.category].push(q);
      return acc;
    }, {});

    Object.entries(questionsByCategory).forEach(([category, questions]) => {
      doc.fontSize(12).text(`${category.toUpperCase()} QUESTIONS:`, { underline: true });
      doc.moveDown(0.5);

      questions.forEach((q, index) => {
        doc.fontSize(10).text(`${index + 1}. ${q.questionText}`, {
          width: 500
        });

        if (q.evaluationCriteria && q.evaluationCriteria.length > 0) {
          doc.fontSize(8).fillColor('gray').text('   Evaluation Criteria:', { continued: false });
          q.evaluationCriteria.forEach(criteria => {
            doc.text(`   • ${criteria}`);
          });
          doc.fillColor('black');
        }

        if (q.biasWarning) {
          doc.fontSize(8).fillColor('red').text(`   ⚠ ${q.biasWarning}`, { continued: false });
          doc.fillColor('black');
        }

        doc.moveDown(0.5);
      });

      doc.moveDown();
    });

    doc.fontSize(8).fillColor('gray').text(`Generated on: ${new Date().toLocaleDateString()}`, {
      align: 'center'
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export question set',
      error: error.message
    });
  }
};

module.exports = {
  generateQuestions,
  getMyQuestionSets,
  getPublicSamples,
  getCompanyTemplates,
  getQuestionSetById,
  updateQuestionSet,
  deleteQuestionSet,
  updateVisibility,
  provideFeedback,
  exportQuestionSetPDF
};
