import React, { useRef, useState } from 'react';
import { learningAPI, filesAPI } from '../../services/api';

const SkillsGapAnalysis = () => {
  const [resumeText, setResumeText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [view, setView] = useState('input'); // 'input' | 'results'

  const canSubmit = resumeText.trim().length > 50 && (jobDescription.trim().length > 30 || targetRole.trim().length > 2);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError('');
      setResult(null);
      const data = await learningAPI.learningPath({ resumeText, jobDescription, targetRole });
      setResult(data);
      setView('results');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFileChange({ target: { files } });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, DOCX, or TXT file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    setError('');
    setSelectedFile(file);
    try {
      setUploading(true);
      const resp = await filesAPI.uploadResume(file);
      const text = resp?.resumeText || '';
      if (!text || text.length < 50) {
        setError('Could not extract enough text from resume. Please paste resume text instead.');
      } else {
        setResumeText(text);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to read resume. Please paste resume text.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full mb-4">
            Use Case 10 (UC10)
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Skills Gap Analysis
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Identify skill gaps between your current profile and target roles with personalized learning recommendations.
          </p>
        </div>

        {view === 'input' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Inputs */}
            <div className="space-y-8">
            {/* Resume Upload Card */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Add Your Resume</h3>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'
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
                      <p className="font-semibold text-emerald-600">{selectedFile.name}</p>
                      <p className="text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600">Drag and drop your resume here, or</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-emerald-600 font-semibold hover:text-emerald-700"
                      >
                        browse files
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Or paste resume text</label>
                <textarea
                  className="w-full h-40 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-4"
                  placeholder="Paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  disabled={uploading}
                />
                <p className="mt-2 text-sm text-gray-500">{resumeText.length} characters</p>
              </div>
            </div>

            {/* JD and target role */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Target Job</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description (optional)</label>
                  <textarea
                    className="w-full h-28 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-4"
                    placeholder="Paste the target job description..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target Role (optional)</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-4"
                    placeholder="e.g., Frontend Engineer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Error and action */}
              {error && (
                <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={!canSubmit || loading || uploading}
                  className={`w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold py-4 px-6 rounded-lg ${canSubmit && !loading && !uploading ? 'hover:from-emerald-700 hover:to-green-700' : 'opacity-50 cursor-not-allowed'} transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                >
                  {loading ? 'Analyzing...' : 'Analyze & Recommend'}
                </button>
              </div>
            </div>
            </div>

            {/* Right: Info */}
            <div className="space-y-8">
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Overview</h3>
                  <div className="space-y-4 text-gray-600">
                    <p className="leading-relaxed">
                      Take control of your career development with data-driven insights. Compare your current
                      skill set against your dream job requirements and get a clear roadmap for professional growth.
                    </p>
                    <p className="leading-relaxed">
                      Receive personalized recommendations for courses, certifications, and learning resources
                      that will help you bridge skill gaps and achieve your career objectives.
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h3>
                  <ul className="space-y-4">
                    {[
                      'Resume vs. job description comparison',
                      'Skill gap identification',
                      'Learning path recommendations',
                      'Course and certification suggestions',
                      'Timeline and progress tracking'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start group">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-2 w-2 rounded-full bg-emerald-600 group-hover:bg-emerald-700 transition-colors duration-200"></div>
                        </div>
                        <span className="ml-4 text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // RESULTS VIEW (full screen)
          result && (
            <div className="space-y-8">
              {/* Results Header with Match % */}
              {(() => {
                const present = (result.presentSkills || []).length;
                const missing = (result.missingSkills || []).length;
                const total = present + missing;
                const match = total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl shadow-lg p-8 text-white">
                    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
                      <div>
                        <div className="text-sm uppercase tracking-wider text-emerald-100">Skills Gap Analysis</div>
                        <h3 className="text-3xl font-bold mt-2">{targetRole ? `Results for ${targetRole}` : 'Your Results'}</h3>
                        <p className="text-emerald-100 mt-2 max-w-2xl">{result.summary || 'Below is your skills coverage, top learning recommendations, and a phased learning path.'}</p>
                      </div>
                      <div className="text-center">
                        <div className="text-6xl font-extrabold">{match}%</div>
                        <div className="text-emerald-100">Match Coverage</div>
                        <div className="mt-2 text-xs">{present} present • {missing} missing</div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => setView('input')}
                        className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 rounded-lg transition"
                      >
                        Back to Inputs
                      </button>
                      <button
                        onClick={() => { setResult(null); setView('input'); setJobDescription(''); setTargetRole(''); setSelectedFile(null); setError(''); }}
                        className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-4 py-2 rounded-lg transition"
                      >
                        Start Over
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Stats Cards */}
              {(() => {
                const present = (result.presentSkills || []).length;
                const missing = (result.missingSkills || []).length;
                const total = Math.max(present + missing, 1);
                const match = Math.round((present / total) * 100);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow p-6">
                      <div className="text-sm text-gray-500">Match Coverage</div>
                      <div className="text-3xl font-bold text-emerald-700 mt-2">{match}%</div>
                      <div className="text-xs text-gray-500 mt-1">{present} present / {missing} missing</div>
                    </div>
                    <div className="bg-white rounded-xl shadow p-6">
                      <div className="text-sm text-gray-500">Present Skills</div>
                      <div className="text-3xl font-bold text-gray-900 mt-2">{present}</div>
                      <div className="mt-2 flex flex-wrap gap-2 max-h-16 overflow-y-auto">
                        {(result.presentSkills || []).slice(0, 10).map((s, i) => (
                          <span key={i} className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow p-6">
                      <div className="text-sm text-gray-500">Missing Skills</div>
                      <div className="text-3xl font-bold text-gray-900 mt-2">{missing}</div>
                      <div className="mt-2 flex flex-wrap gap-2 max-h-16 overflow-y-auto">
                        {(result.missingSkills || []).slice(0, 10).map((s, i) => (
                          <span key={i} className="px-2 py-1 rounded-full bg-rose-50 text-rose-700 text-xs">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Courses */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">Top Course Recommendations</h3>
                </div>
                <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(result.recommendedCourses || []).map((c, i) => (
                    <li key={i} className="border rounded-lg p-4 hover:shadow-sm transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-900">{c.title}</div>
                          <div className="text-sm text-gray-600">{c.provider}</div>
                          <div className="mt-2 text-sm text-gray-700 line-clamp-3">{c.description}</div>
                          {c.matchedSkills?.length > 0 && (
                            <div className="mt-2 text-xs text-emerald-700">Matches: {c.matchedSkills.join(', ')}</div>
                          )}
                        </div>
                        {c.signupLink && (
                          <a href={c.signupLink} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-800 text-sm font-medium">Enroll →</a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Learning Path */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Phased Learning Path</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(result.learningPath || []).map((phase, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="text-sm text-gray-500">{phase.phase}</div>
                      <div className="font-semibold text-gray-900 mt-1">Focus: {phase.focus.join(', ')}</div>
                      <ul className="mt-2 space-y-2">
                        {phase.courses.map((c, i) => (
                          <li key={i} className="text-sm text-gray-700">• {c.title} <span className="text-gray-500">({c.provider})</span></li>
                        ))}
                      </ul>
                      {phase.goals?.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">Goal: {phase.goals[0]}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        
      </div>
    </div>
  );
};

export default SkillsGapAnalysis;
