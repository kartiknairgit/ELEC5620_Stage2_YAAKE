import React, { useState, useEffect } from 'react';
import { questionAPI } from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notification.service';

const SampleQuestions = () => {
  const [publicSamples, setPublicSamples] = useState([]);
  const [companyTemplates, setCompanyTemplates] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('samples'); // 'samples' or 'templates'
  const [selectedSet, setSelectedSet] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    experienceLevel: '',
    companyName: ''
  });

  useEffect(() => {
    if (activeTab === 'samples') {
      fetchPublicSamples();
    } else {
      fetchCompanyTemplates();
    }
  }, [activeTab, filters]);

  const fetchPublicSamples = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.experienceLevel) params.experienceLevel = filters.experienceLevel;

      const samples = await questionAPI.getPublicSamples(params);
      setPublicSamples(samples);
    } catch (error) {
      notifyError('Failed to fetch sample questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyTemplates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.companyName) params.companyName = filters.companyName;
      if (filters.experienceLevel) params.experienceLevel = filters.experienceLevel;

      const templates = await questionAPI.getCompanyTemplates(params);
      setCompanyTemplates(templates);
    } catch (error) {
      notifyError('Failed to fetch company templates');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (id, jobTitle) => {
    try {
      const blob = await questionAPI.exportPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sample-questions-${jobTitle.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notifySuccess('PDF exported successfully!');
    } catch (error) {
      notifyError('Failed to export PDF');
    }
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

  const groupQuestionsByCategory = (questions) => {
    if (!questions) return {};
    return questions.reduce((acc, q) => {
      if (!acc[q.category]) acc[q.category] = [];
      acc[q.category].push(q);
      return acc;
    }, {});
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      experienceLevel: '',
      companyName: ''
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Sample Interview Questions</h2>
          <p className="text-gray-600 mt-1">Browse real interview questions used by companies to prepare for your interviews</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('samples')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
              activeTab === 'samples'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Public Samples
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Company Templates
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {activeTab === 'samples' && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Categories</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="problem-solving">Problem-Solving</option>
                  <option value="culture-fit">Culture Fit</option>
                </select>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={filters.companyName}
                  onChange={(e) => handleFilterChange('companyName', e.target.value)}
                  placeholder="Search by company..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
              <select
                value={filters.experienceLevel}
                onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Levels</option>
                <option value="junior">Junior</option>
                <option value="mid-level">Mid-Level</option>
                <option value="senior">Senior</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Sets List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-lg mb-4">
                {activeTab === 'samples' ? 'Sample Question Sets' : 'Company Templates'}
              </h3>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : activeTab === 'samples' ? (
                publicSamples.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No samples found</p>
                    <p className="text-sm mt-2">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                    {publicSamples.map(set => (
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
                        <p className="text-xs text-gray-600 mt-1">{set.companyName}</p>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                Object.keys(companyTemplates).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No templates found</p>
                    <p className="text-sm mt-2">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                    {Object.entries(companyTemplates).map(([company, templates]) => (
                      <div key={company}>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">{company}</h4>
                        <div className="space-y-2 ml-2">
                          {templates.map(set => (
                            <div
                              key={set._id}
                              onClick={() => setSelectedSet(set)}
                              className={`p-3 rounded-lg cursor-pointer border-2 transition ${
                                selectedSet?._id === set._id
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-indigo-300'
                              }`}
                            >
                              <h5 className="font-medium text-sm">{set.jobTitle}</h5>
                              <p className="text-xs text-gray-500 mt-1">
                                {set.questions?.length || 0} questions • {set.experienceLevel}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Question Details (Read-only) */}
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
                    <button
                      onClick={() => handleExportPDF(selectedSet._id, selectedSet.jobTitle)}
                      className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg"
                      title="Export as PDF"
                    >
                      📄 Export PDF
                    </button>
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

                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Tip:</strong> These are example questions used by real recruiters.
                      Use them to practice and prepare for your interviews!
                    </p>
                  </div>
                </div>

                {/* Questions (Read-only view) */}
                <div className="space-y-6 max-h-[calc(100vh-450px)] overflow-y-auto">
                  {Object.entries(groupQuestionsByCategory(selectedSet.questions)).map(([category, questions]) => (
                    <div key={category}>
                      <h4 className="font-semibold text-lg mb-3 uppercase text-gray-700 flex items-center">
                        <span className={`px-3 py-1 rounded text-sm mr-2 ${getCategoryBadgeColor(category)}`}>
                          {category}
                        </span>
                        <span className="text-sm text-gray-500">({questions.length} questions)</span>
                      </h4>
                      <div className="space-y-4">
                        {questions.map((q, idx) => (
                          <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                            <p className="font-medium text-gray-800 mb-2">
                              Q{idx + 1}: {q.questionText}
                            </p>

                            {q.evaluationCriteria && q.evaluationCriteria.length > 0 && (
                              <div className="mt-3 bg-white rounded p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2">
                                  🎯 What Recruiters Look For:
                                </p>
                                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                                  {q.evaluationCriteria.map((criteria, idx) => (
                                    <li key={idx} className="list-disc">{criteria}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {q.suggestedAnswer && (
                              <div className="mt-3 bg-green-50 rounded p-3">
                                <p className="text-xs font-semibold text-green-800 mb-1">
                                  ✓ Answer Guidance:
                                </p>
                                <p className="text-xs text-green-700">{q.suggestedAnswer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Info */}
                <div className="mt-6 pt-4 border-t text-center">
                  <p className="text-xs text-gray-500">
                    This question set has been used {selectedSet.usageCount || 0} times by recruiters
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">Select a question set to view details</p>
                <p className="text-sm mt-2 text-gray-400">
                  Browse {activeTab === 'samples' ? 'sample questions' : 'company templates'} to prepare for your interviews
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleQuestions;
