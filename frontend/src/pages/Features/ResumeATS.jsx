import React, { useState, useRef } from 'react';
import { atsAPI } from '../../services/api';

const ResumeATS = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileChange({ target: { files: files } });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF, DOCX, or TXT file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);

    if (!selectedFile) {
      setError('Please select a resume file');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await atsAPI.scoreResume(
        selectedFile,
        jobDescription,
        (progress) => setUploadProgress(progress)
      );

      if (result.success) {
        setResults(result);
      } else {
        setError(result.error || 'Failed to score resume');
      }
    } catch (err) {
      console.error('ATS scoring error:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to score resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'from-green-500 to-emerald-600',
      'B': 'from-blue-500 to-cyan-600',
      'C': 'from-yellow-500 to-amber-600',
      'D': 'from-orange-500 to-red-500',
      'F': 'from-red-600 to-rose-700'
    };
    return colors[grade] || 'from-gray-500 to-gray-600';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full mb-4">
            Use Case 2 (UC2)
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Resume ATS Checker
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Upload your resume and job description to get AI-powered analysis against Applicant Tracking System (ATS) standards.
            Get instant feedback with detailed scoring across multiple criteria.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Form Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload & Analyze</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Resume File (PDF, DOCX, TXT) *
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="space-y-3">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {selectedFile ? (
                      <div className="text-sm">
                        <p className="font-semibold text-indigo-600">{selectedFile.name}</p>
                        <p className="text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-600">Drag and drop your resume here, or</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-indigo-600 font-semibold hover:text-indigo-700"
                        >
                          browse files
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  disabled={uploading}
                />
                <p className="mt-2 text-sm text-gray-500">
                  {jobDescription.length} characters
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Analyzing resume...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || !selectedFile || !jobDescription.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {uploading ? 'Analyzing...' : 'Analyze Resume'}
              </button>
            </form>
          </div>

          {/* Info/Results Section */}
          <div>
            {!results ? (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Upload Resume</h4>
                      <p className="text-gray-600 text-sm">Upload your resume in PDF, DOCX, or TXT format</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Add Job Description</h4>
                      <p className="text-gray-600 text-sm">Paste the full job posting for accurate matching</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Get AI Analysis</h4>
                      <p className="text-gray-600 text-sm">Receive detailed scoring and actionable recommendations</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Scoring Criteria</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Keyword Matching</span>
                      <span className="font-semibold text-indigo-600">25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Format & Structure</span>
                      <span className="font-semibold text-indigo-600">25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience Relevance</span>
                      <span className="font-semibold text-indigo-600">25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Skills Gap Analysis</span>
                      <span className="font-semibold text-indigo-600">25%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall Score Card */}
                <div className={`bg-gradient-to-br ${getGradeColor(results.grade)} rounded-xl shadow-lg p-8 text-white`}>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-4">Overall ATS Score</h3>
                    <div className="flex items-center justify-center space-x-8">
                      <div>
                        <div className="text-6xl font-bold">{results.overall_score}%</div>
                        <p className="text-sm opacity-90 mt-2">Match Score</p>
                      </div>
                      <div className="h-20 w-px bg-white opacity-30"></div>
                      <div>
                        <div className="text-6xl font-bold">{results.grade}</div>
                        <p className="text-sm opacity-90 mt-2">Grade</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Scores */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Category Breakdown</h3>
                  <div className="space-y-6">
                    {Object.entries(results.category_scores).map(([key, category]) => (
                      <div key={key} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-gray-900 capitalize">
                            {key.replace(/_/g, ' ')}
                          </h4>
                          <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                            {category.score}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${category.score}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600">{category.feedback}</p>

                        {/* Additional Details */}
                        {category.matched_keywords && category.matched_keywords.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Matched Keywords:</p>
                            <div className="flex flex-wrap gap-2">
                              {category.matched_keywords.map((kw, i) => (
                                <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {category.missing_keywords && category.missing_keywords.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Missing Keywords:</p>
                            <div className="flex flex-wrap gap-2">
                              {category.missing_keywords.map((kw, i) => (
                                <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {category.missing_skills && category.missing_skills.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Missing Skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {category.missing_skills.map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Feedback */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Detailed Feedback</h3>
                  <p className="text-gray-700 leading-relaxed">{results.detailed_feedback}</p>
                </div>

                {/* Recommendations */}
                {results.recommendations && results.recommendations.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Recommendations</h3>
                    <ul className="space-y-3">
                      {results.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setResults(null);
                      setSelectedFile(null);
                      setJobDescription('');
                      setError('');
                    }}
                    className="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 font-bold py-3 px-6 rounded-lg hover:bg-indigo-50 transition-all duration-200"
                  >
                    Analyze Another Resume
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeATS;
