import React, { useState, useEffect } from 'react';
import { questionAPI } from '../../services/api';
import { notifySuccess, notifyError, notifyInfo } from '../../services/notification.service';

const InterviewQuestionGenerator = () => {
  const [questionSets, setQuestionSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);
  const [filterVisibility, setFilterVisibility] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobDescription: '',
    requiredSkills: '',
    experienceLevel: 'mid-level',
    categories: ['technical', 'behavioral', 'problem-solving', 'culture-fit'],
    numberOfQuestions: 10,
    candidateResume: '',
    candidateName: ''
  });

  const [generating, setGenerating] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  useEffect(() => {
    fetchQuestionSets();
  }, [filterVisibility]);

  const fetchQuestionSets = async () => {
    setLoading(true);
    try {
      const visibility = filterVisibility === 'all' ? null : filterVisibility;
      const sets = await questionAPI.getMyQuestionSets(visibility);
      setQuestionSets(sets);
    } catch (error) {
      notifyError('Failed to fetch question sets');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
  };

  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    console.log('\n========== FRONTEND: GENERATE QUESTIONS ==========');
    console.log('FRONTEND DEBUG 1: Form submitted');
    console.log('FRONTEND DEBUG 2: Form data:', formData);

    // Validation
    if (!formData.jobTitle) {
      console.log('FRONTEND DEBUG 3: Validation failed - no job title');
      notifyError('Please provide a job title');
      return;
    }

    if (formData.categories.length === 0) {
      console.log('FRONTEND DEBUG 4: Validation failed - no categories selected');
      notifyError('Please select at least one question category');
      return;
    }

    console.log('FRONTEND DEBUG 5: Validation passed, preparing request data...');
    const requestData = {
      jobTitle: formData.jobTitle,
      jobDescription: formData.jobDescription,
      requiredSkills: formData.requiredSkills ? formData.requiredSkills.split(',').map(s => s.trim()) : [],
      experienceLevel: formData.experienceLevel,
      categories: formData.categories,
      numberOfQuestions: parseInt(formData.numberOfQuestions),
      candidateResume: formData.candidateResume,
      candidateName: formData.candidateName
    };
    console.log('FRONTEND DEBUG 6: Request data to be sent:', requestData);

    setGenerating(true);
    try {
      console.log('FRONTEND DEBUG 7: Calling questionAPI.generateQuestions...');
      const result = await questionAPI.generateQuestions(requestData);
      console.log('FRONTEND DEBUG 8: Received response:', result);

      if (result) {
        console.log('FRONTEND DEBUG 9: Success! Generated', result.questions?.length, 'questions');
        notifySuccess('Interview questions generated successfully!');
        setSelectedSet(result);
        setShowForm(false);
        fetchQuestionSets();
      }
    } catch (error) {
      console.error('\n========== FRONTEND ERROR ==========');
      console.error('FRONTEND ERROR 1: Error object:', error);
      console.error('FRONTEND ERROR 2: Error message:', error.message);
      console.error('FRONTEND ERROR 3: Response status:', error.response?.status);
      console.error('FRONTEND ERROR 4: Response data:', error.response?.data);
      console.error('FRONTEND ERROR 5: Response headers:', error.response?.headers);
      console.error('FRONTEND ERROR 6: Request config:', error.config);
      console.error('========== END FRONTEND ERROR ==========\n');
      notifyError(error.response?.data?.message || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateQuestionSet = async (id, updates) => {
    try {
      const result = await questionAPI.updateQuestionSet(id, updates);
      if (result) {
        notifySuccess('Question set updated successfully');
        fetchQuestionSets();
        if (selectedSet?._id === id) {
          setSelectedSet(result);
        }
      }
    } catch (error) {
      notifyError('Failed to update question set');
    }
  };

  const handleDeleteQuestionSet = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question set?')) {
      return;
    }

    try {
      await questionAPI.deleteQuestionSet(id);
      notifySuccess('Question set deleted successfully');
      fetchQuestionSets();
      if (selectedSet?._id === id) {
        setSelectedSet(null);
      }
    } catch (error) {
      notifyError('Failed to delete question set');
    }
  };

  const handleVisibilityChange = async (id, visibility) => {
    try {
      const result = await questionAPI.updateVisibility(id, visibility);
      if (result) {
        notifySuccess(`Visibility updated to ${visibility}`);
        fetchQuestionSets();
        if (selectedSet?._id === id) {
          setSelectedSet(result);
        }
      }
    } catch (error) {
      notifyError('Failed to update visibility');
    }
  };

  const handleExportPDF = async (id, jobTitle) => {
    try {
      const blob = await questionAPI.exportPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-questions-${jobTitle.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notifySuccess('PDF exported successfully!');
    } catch (error) {
      notifyError('Failed to export PDF');
    }
  };

  const handleQuestionEdit = (questionIndex, field, value) => {
    if (!selectedSet) return;

    const updatedQuestions = [...selectedSet.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      [field]: value,
      isCustom: true
    };

    setSelectedSet(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const handleRemoveQuestion = (questionIndex) => {
    if (!selectedSet) return;

    const updatedQuestions = selectedSet.questions.filter((_, idx) => idx !== questionIndex);
    setSelectedSet(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const handleAddCustomQuestion = () => {
    if (!selectedSet) return;

    const newQuestion = {
      questionText: 'New custom question',
      category: 'technical',
      evaluationCriteria: [],
      suggestedAnswer: '',
      isCustom: true
    };

    setSelectedSet(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const handleSaveChanges = async () => {
    if (!selectedSet) return;

    await handleUpdateQuestionSet(selectedSet._id, {
      questions: selectedSet.questions
    });
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      technical: 'bg-blue-100 text-blue-800',
      behavioral: 'bg-green-100 text-green-800',
      'problem-solving': 'bg-purple-100 text-purple-800',
      'culture-fit': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const resetForm = () => {
    setFormData({
      jobTitle: '',
      jobDescription: '',
      requiredSkills: '',
      experienceLevel: 'mid-level',
      categories: ['technical', 'behavioral', 'problem-solving', 'culture-fit'],
      numberOfQuestions: 10,
      candidateResume: '',
      candidateName: ''
    });
  };

  // Group questions by category
  const groupQuestionsByCategory = (questions) => {
    return questions.reduce((acc, q, index) => {
      if (!acc[q.category]) acc[q.category] = [];
      acc[q.category].push({ ...q, originalIndex: index });
      return acc;
    }, {});
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Interview Question Generator</h2>
            <p className="text-gray-600 mt-1">AI-powered interview questions tailored to your job requirements</p>
          </div>
          <button
            onClick={() => { setShowForm(true); resetForm(); }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
          >
            + Generate New Questions
          </button>
        </div>

        {/* Generation Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Generate Interview Questions</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleGenerateQuestions} className="space-y-4">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Senior Software Engineer"
                    required
                  />
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                  <textarea
                    name="jobDescription"
                    value={formData.jobDescription}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Describe the role, responsibilities, and requirements..."
                  />
                </div>

                {/* Required Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma-separated)</label>
                  <input
                    type="text"
                    name="requiredSkills"
                    value={formData.requiredSkills}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., React, Node.js, MongoDB, AWS"
                  />
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="junior">Junior</option>
                    <option value="mid-level">Mid-Level</option>
                    <option value="senior">Senior</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>

                {/* Question Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question Categories</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['technical', 'behavioral', 'problem-solving', 'culture-fit'].map(category => (
                      <label key={category} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm capitalize">{category.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Number of Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Questions: {formData.numberOfQuestions}
                  </label>
                  <input
                    type="range"
                    name="numberOfQuestions"
                    min="5"
                    max="20"
                    value={formData.numberOfQuestions}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>5</span>
                    <span>20</span>
                  </div>
                </div>

                {/* Candidate Resume (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Resume (Optional)</label>
                  <textarea
                    name="candidateResume"
                    value={formData.candidateResume}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Paste candidate resume or key background info to tailor questions..."
                  />
                </div>

                {/* Candidate Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name (Optional)</label>
                  <input
                    type="text"
                    name="candidateName"
                    value={formData.candidateName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., John Doe"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {generating ? 'Generating...' : 'Generate Questions'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Sets List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">My Question Sets</h3>
                <select
                  value={filterVisibility}
                  onChange={(e) => setFilterVisibility(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="private">Private</option>
                  <option value="company_template">Company Template</option>
                  <option value="public_sample">Public Sample</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : questionSets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No question sets yet</p>
                  <p className="text-sm mt-2">Click "Generate New Questions" to get started</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {questionSets.map(set => (
                    <div
                      key={set._id}
                      onClick={() => setSelectedSet(set)}
                      className={`p-3 rounded-lg cursor-pointer border-2 transition ${
                        selectedSet?._id === set._id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <h4 className="font-medium text-sm">{set.jobTitle}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {set.questions?.length || 0} questions • {set.experienceLevel}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(set.createdAt).toLocaleDateString()}
                      </p>
                      {set.visibility !== 'private' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded mt-1 inline-block">
                          {set.visibility === 'company_template' ? 'Template' : 'Public'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Question Details */}
          <div className="lg:col-span-2">
            {selectedSet ? (
              <div className="bg-white rounded-lg shadow p-6">
                {/* Header */}
                <div className="border-b pb-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-2xl font-bold">{selectedSet.jobTitle}</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {selectedSet.companyName} • {selectedSet.experienceLevel} level
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleExportPDF(selectedSet._id, selectedSet.jobTitle)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                        title="Export as PDF"
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => handleDeleteQuestionSet(selectedSet._id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {selectedSet.jobDescription && (
                    <p className="text-sm text-gray-600 mt-2">{selectedSet.jobDescription}</p>
                  )}

                  {selectedSet.requiredSkills && selectedSet.requiredSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedSet.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Visibility Control */}
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700 mr-2">Visibility:</label>
                    <select
                      value={selectedSet.visibility}
                      onChange={(e) => handleVisibilityChange(selectedSet._id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="private">Private</option>
                      <option value="company_template">Company Template</option>
                      <option value="public_sample">Public Sample</option>
                    </select>
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-6 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {Object.entries(groupQuestionsByCategory(selectedSet.questions)).map(([category, questions]) => (
                    <div key={category}>
                      <h4 className="font-semibold text-lg mb-3 uppercase text-gray-700">{category}</h4>
                      <div className="space-y-4">
                        {questions.map((q) => (
                          <div key={q.originalIndex} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                              <span className={`text-xs px-2 py-1 rounded ${getCategoryBadgeColor(q.category)}`}>
                                {q.category}
                              </span>
                              <button
                                onClick={() => handleRemoveQuestion(q.originalIndex)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>

                            {editingQuestionIndex === q.originalIndex ? (
                              <textarea
                                value={q.questionText}
                                onChange={(e) => handleQuestionEdit(q.originalIndex, 'questionText', e.target.value)}
                                onBlur={() => setEditingQuestionIndex(null)}
                                className="w-full p-2 border rounded mb-2"
                                rows="3"
                                autoFocus
                              />
                            ) : (
                              <p
                                onClick={() => setEditingQuestionIndex(q.originalIndex)}
                                className="font-medium text-gray-800 mb-2 cursor-pointer hover:bg-white p-2 rounded"
                              >
                                Q: {q.questionText}
                              </p>
                            )}

                            {q.biasWarning && (
                              <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                                <p className="text-xs text-red-700">⚠️ {q.biasWarning}</p>
                              </div>
                            )}

                            {q.evaluationCriteria && q.evaluationCriteria.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-600 mb-1">Evaluation Criteria:</p>
                                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                                  {q.evaluationCriteria.map((criteria, idx) => (
                                    <li key={idx} className="list-disc">{criteria}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {q.isCustom && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded mt-2 inline-block">
                                Custom
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <button
                    onClick={handleAddCustomQuestion}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    + Add Custom Question
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">Select a question set to view details</p>
                <p className="text-sm mt-2">or generate new questions to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewQuestionGenerator;
