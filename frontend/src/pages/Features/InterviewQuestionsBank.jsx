import React, { useState, useEffect } from 'react';
import { questionAPI } from '../../services/api';

const InterviewQuestionsBank = () => {
  const [loading, setLoading] = useState(true);
  const [publicSamples, setPublicSamples] = useState([]);
  const [companyTemplates, setCompanyTemplates] = useState({});
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    experienceLevel: '',
    category: '',
    searchTerm: '',
    viewMode: 'all' // 'all', 'samples', 'templates'
  });

  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters whenever questions or filters change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicSamples, companyTemplates, filters]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Fetch both public samples and company templates
      const [samples, templates] = await Promise.all([
        questionAPI.getPublicSamples(),
        questionAPI.getCompanyTemplates()
      ]);

      setPublicSamples(samples || []);
      setCompanyTemplates(templates || {});
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let allQuestions = [];

    // Combine samples and templates based on view mode
    if (filters.viewMode === 'all' || filters.viewMode === 'samples') {
      allQuestions = [...allQuestions, ...publicSamples];
    }

    if (filters.viewMode === 'all' || filters.viewMode === 'templates') {
      // Flatten company templates object into array
      Object.values(companyTemplates).forEach(templateArray => {
        allQuestions = [...allQuestions, ...templateArray];
      });
    }

    // Apply experience level filter
    if (filters.experienceLevel) {
      allQuestions = allQuestions.filter(
        q => q.experienceLevel === filters.experienceLevel
      );
    }

    // Apply search term filter (searches in job title and company name)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      allQuestions = allQuestions.filter(
        q =>
          q.jobTitle?.toLowerCase().includes(term) ||
          q.companyName?.toLowerCase().includes(term)
      );
    }

    // Apply category filter (filter questions within each set)
    if (filters.category) {
      allQuestions = allQuestions.map(set => ({
        ...set,
        questions: set.questions.filter(q => q.category === filters.category),
        _filteredQuestionCount: set.questions.filter(q => q.category === filters.category).length
      })).filter(set => set._filteredQuestionCount > 0);
    }

    setFilteredQuestions(allQuestions);
  };

  const handleViewDetails = (questionSet) => {
    setSelectedQuestionSet(questionSet);
    setShowDetailModal(true);
  };

  const handleExportPDF = async (questionSetId, jobTitle) => {
    setExportingPDF(true);
    try {
      const pdfBlob = await questionAPI.exportPDF(questionSetId);

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-questions-${jobTitle.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'technical': 'bg-blue-100 text-blue-800',
      'behavioral': 'bg-green-100 text-green-800',
      'problem-solving': 'bg-purple-100 text-purple-800',
      'culture-fit': 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getExperienceLevelBadge = (level) => {
    const badges = {
      'junior': 'bg-emerald-100 text-emerald-700',
      'mid-level': 'bg-amber-100 text-amber-700',
      'senior': 'bg-orange-100 text-orange-700',
      'executive': 'bg-red-100 text-red-700'
    };
    return badges[level] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="inline-block px-4 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full mb-4">
            Use Case 11 (UC11)
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Interview Questions Bank
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Practice with real interview questions shared by recruiters. Browse by company, role, and difficulty level.
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Job title or company..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Experience Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                value={filters.experienceLevel}
                onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                <option value="junior">Junior</option>
                <option value="mid-level">Mid-Level</option>
                <option value="senior">Senior</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="problem-solving">Problem Solving</option>
                <option value="culture-fit">Culture Fit</option>
              </select>
            </div>

            {/* View Mode Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <select
                value={filters.viewMode}
                onChange={(e) => setFilters({ ...filters, viewMode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">All Questions</option>
                <option value="samples">Public Samples</option>
                <option value="templates">Company Templates</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">
              Showing {filteredQuestions.length} question set{filteredQuestions.length !== 1 ? 's' : ''}
            </span>
            {(filters.experienceLevel || filters.category || filters.searchTerm) && (
              <button
                onClick={() => setFilters({ experienceLevel: '', category: '', searchTerm: '', viewMode: 'all' })}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Question Sets Grid */}
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-600">
              {publicSamples.length === 0 && Object.keys(companyTemplates).length === 0
                ? "No questions have been made public yet. Check back later!"
                : "Try adjusting your filters to see more results."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuestions.map((questionSet) => (
              <div
                key={questionSet._id}
                className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                onClick={() => handleViewDetails(questionSet)}
              >
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 flex-1 mr-2">
                      {questionSet.jobTitle}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getExperienceLevelBadge(questionSet.experienceLevel)}`}>
                      {questionSet.experienceLevel}
                    </span>
                  </div>

                  {questionSet.companyName && (
                    <p className="text-sm text-gray-600 font-medium">
                      {questionSet.companyName}
                    </p>
                  )}
                </div>

                {/* Question Count */}
                <div className="mb-4">
                  <div className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">
                      {filters.category ? questionSet._filteredQuestionCount : questionSet.questions?.length || 0} questions
                    </span>
                  </div>
                </div>

                {/* Categories */}
                {questionSet.questions && questionSet.questions.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(questionSet.questions.map(q => q.category))].map(category => (
                        <span
                          key={category}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {questionSet.requiredSkills && questionSet.requiredSkills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Required Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {questionSet.requiredSkills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {questionSet.requiredSkills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{questionSet.requiredSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Used {questionSet.usageCount || 0} times
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportPDF(questionSet._id, questionSet.jobTitle);
                    }}
                    disabled={exportingPDF}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedQuestionSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedQuestionSet.jobTitle}
                </h2>
                {selectedQuestionSet.companyName && (
                  <p className="text-gray-600">{selectedQuestionSet.companyName}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getExperienceLevelBadge(selectedQuestionSet.experienceLevel)}`}>
                    {selectedQuestionSet.experienceLevel}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {selectedQuestionSet.questions?.length || 0} questions
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 ml-4"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Job Description */}
              {selectedQuestionSet.jobDescription && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Description</h3>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedQuestionSet.jobDescription}
                  </p>
                </div>
              )}

              {/* Required Skills */}
              {selectedQuestionSet.requiredSkills && selectedQuestionSet.requiredSkills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedQuestionSet.requiredSkills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Questions</h3>
                <div className="space-y-4">
                  {selectedQuestionSet.questions?.map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-amber-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-gray-900">Q{index + 1}.</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(question.category)}`}>
                          {question.category}
                        </span>
                      </div>
                      <p className="text-gray-800 ml-8 mb-3">{question.questionText}</p>

                      {question.evaluationCriteria && question.evaluationCriteria.length > 0 && (
                        <div className="ml-8 bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                          <p className="text-sm font-medium text-blue-900 mb-1">Evaluation Criteria:</p>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {question.evaluationCriteria.map((criteria, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {question.suggestedAnswer && (
                        <div className="ml-8 mt-3 bg-green-50 border-l-4 border-green-400 p-3 rounded">
                          <p className="text-sm font-medium text-green-900 mb-1">Sample Answer:</p>
                          <p className="text-sm text-green-800">{question.suggestedAnswer}</p>
                        </div>
                      )}

                      {question.biasWarning && (
                        <div className="ml-8 mt-3 bg-red-50 border-l-4 border-red-400 p-3 rounded">
                          <p className="text-sm font-medium text-red-900 flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Bias Warning:
                          </p>
                          <p className="text-sm text-red-800 mt-1">{question.biasWarning}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => handleExportPDF(selectedQuestionSet._id, selectedQuestionSet.jobTitle)}
                  disabled={exportingPDF}
                  className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {exportingPDF ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download as PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewQuestionsBank;
