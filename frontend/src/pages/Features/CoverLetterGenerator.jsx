import React, { useMemo, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { filesAPI, coverLettersAPI, exportAPI } from '../../services/api';

const CoverLetterGenerator = () => {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeMeta, setResumeMeta] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const customInputRef = useRef(null);

  const [style, setStyle] = useState('formal');
  const [length, setLength] = useState('standard');
  const [customMaxWords, setCustomMaxWords] = useState('');
  const [userNotes, setUserNotes] = useState('');

  const [drafts, setDrafts] = useState([]);
  const [selectedDraftIdx, setSelectedDraftIdx] = useState(0);
  const [editorText, setEditorText] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [extractedKeywords, setExtractedKeywords] = useState([]);
  const [extractedResumeFacts, setExtractedResumeFacts] = useState({ skills: [], achievements: [], tools: [] });
  const [showMoreSkills, setShowMoreSkills] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [showMoreAchievements, setShowMoreAchievements] = useState(false);
  const [customFocus, setCustomFocus] = useState(false);
  const [customActive, setCustomActive] = useState(false);

  const canNextFromStep1 = useMemo(() => resumeText && resumeText.trim().length > 50, [resumeText]);
  const canNextFromStep2 = true; // JD optional
  const canGenerate = useMemo(() => canNextFromStep1 && ['formal', 'conversational', 'persuasive'].includes(style), [canNextFromStep1, style]);
  const maxWords = useMemo(() => {
    const v = parseInt(customMaxWords, 10);
    if (!isNaN(v) && v >= 120 && v <= 800) return v;
    return length === 'short' ? 220 : 380;
  }, [length, customMaxWords]);
  const currentDraft = drafts[selectedDraftIdx] || null;
  const currentWordCount = useMemo(() => (currentDraft?.wordCount ?? editorText.split(/\s+/).filter(Boolean).length), [currentDraft, editorText]);
  const alignmentScore = currentDraft?.alignmentScore ?? null;
  const matchedKeywords = currentDraft?.keywordCoverage || [];
  const totalKeywords = (extractedKeywords || []).length;
  const keywordCoveragePct = totalKeywords ? Math.round((matchedKeywords.length / totalKeywords) * 100) : null;
  const skills = extractedResumeFacts.skills || [];
  const tools = extractedResumeFacts.tools || [];
  const achievements = extractedResumeFacts.achievements || [];
  const skillsCap = 12;
  const toolsCap = 12;
  const achievementsCap = 5;
  const visibleSkills = showMoreSkills ? skills : skills.slice(0, skillsCap);
  const visibleTools = showMoreTools ? tools : tools.slice(0, toolsCap);
  const visibleAchievements = showMoreAchievements ? achievements : achievements.slice(0, achievementsCap);
  const customValid = useMemo(() => {
    const v = parseInt(customMaxWords, 10);
    return !isNaN(v) && v >= 120 && v <= 800;
  }, [customMaxWords]);

  function scoreGradient(score) {
    if (score == null) return 'from-gray-300 to-gray-400';
    if (score >= 85) return 'from-green-500 to-emerald-600';
    if (score >= 75) return 'from-blue-500 to-cyan-600';
    if (score >= 65) return 'from-yellow-500 to-amber-600';
    if (score >= 50) return 'from-orange-500 to-rose-500';
    return 'from-rose-600 to-red-700';
  }

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFileChange({ target: { files } });
  };

  const handleFileChange = (e) => {
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
    // Auto-upload and extract immediately
    handleUploadFile(file);
  };

  const [selectedFile, setSelectedFile] = useState(null);

  async function handleUploadFile(file) {
    setUploading(true);
    setUploadProgress(0);
    setResumeFile(file);
    try {
      const resp = await filesAPI.uploadResume(file);
      if (resp?.success) {
        setResumeText(resp.resumeText || '');
        setResumeMeta(resp.metadata || null);
      } else {
        alert(resp?.message || 'Failed to parse resume. Try a different file or paste text.');
      }
    } catch (e) {
      alert('Upload failed. ' + (e?.response?.data?.message || e.message));
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const resp = await coverLettersAPI.generate({
        resumeText,
        jobDescriptionText,
        style,
        length,
        maxWords: maxWords,
        userNotes
      });
      if (resp?.success) {
        setDrafts(resp.drafts || []);
        setSelectedDraftIdx(0);
        const initialText = (resp.drafts?.[0]?.body) || '';
        setEditorText(initialText);
        setWarnings(resp.warnings || []);
        setExtractedKeywords(resp.extractedJDKeywords || []);
        setExtractedResumeFacts(resp.extractedResumeFacts || { skills: [], achievements: [], tools: [] });
        setStep(4);
      } else {
        const msg = (resp?.message || 'Generation failed.');
        toast.error(msg);
      }
    } catch (e) {
      const errMsg = e?.response?.data?.message || e?.response?.data?.error || e.message || 'Generation failed.';
      toast.error(errMsg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRefine(instructions, toneOverride, maxWordsOverride) {
    setRefining(true);
    try {
      const resp = await coverLettersAPI.refine({
        draftText: editorText,
        editInstructions: instructions || 'Tighten language and clarity.',
        newTone: toneOverride || style,
        length,
        maxWords: typeof maxWordsOverride === 'number' ? maxWordsOverride : maxWords
      });
      if (resp?.success) {
        const rd = resp.refinedDraft;
        setEditorText(rd?.body || editorText);
        setWarnings(resp.warnings || []);
        // Update the selected draft snapshot metrics
        const nextDrafts = [...drafts];
        nextDrafts[selectedDraftIdx] = rd ? {
          id: rd.id,
          tone: rd.tone,
          title: rd.title,
          body: rd.body,
          wordCount: rd.wordCount,
          alignmentScore: rd.alignmentScore,
          keywordCoverage: rd.keywordCoverage,
          justification: rd.justification
        } : nextDrafts[selectedDraftIdx];
        setDrafts(nextDrafts);
      } else {
        const msg = (resp?.message || 'Refine failed.');
        toast.error(msg);
      }
    } catch (e) {
      const errMsg = e?.response?.data?.message || e?.response?.data?.error || e.message || 'Refine failed.';
      toast.error(errMsg);
    } finally {
      setRefining(false);
    }
  }

  async function handleExportDocx() {
    try {
      const title = drafts?.[selectedDraftIdx]?.title || 'Cover Letter';
      const res = await exportAPI.coverLetter({ draftText: editorText, title, format: 'docx', download: true });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = sanitizeFileName(`${title}.docx`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed. ' + (e?.response?.data?.message || e.message));
    }
  }

  function sanitizeFileName(name) {
    return String(name || 'cover-letter').replace(/[^a-z0-9\-_. ]/gi, '_');
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <Toaster position="top-right" />
        <div className="mb-8">
          <div className="inline-block px-4 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full mb-4">
            Use Case 2 (UC3)
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cover Letter Generator</h1>
          <p className="text-lg text-gray-600 max-w-3xl">Upload your resume, optionally paste the job description, choose a style, and generate/refine an ATS-friendly cover letter.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {['Upload Resume', 'Paste JD (optional)', 'Select Style', 'Generate & Refine'].map((label, idx) => (
            <div key={idx} className="flex-1 flex items-center">
              <div className={`flex items-center justify-center h-9 w-9 rounded-full text-sm font-bold ${step >= (idx+1) ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{idx+1}</div>
              <div className="ml-3 text-sm font-medium text-gray-700">{label}</div>
              {idx < 3 && <div className="flex-1 h-px bg-gray-200 mx-3"></div>}
            </div>
          ))}
        </div>

        {/* Step 1: Upload Resume */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Upload & Analyze</h3>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Resume File (PDF, DOCX, TXT) *</label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}
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
                      <p className="font-semibold text-purple-600">{selectedFile.name}</p>
                      <p className="text-gray-500">{(selectedFile.size/1024/1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600">Drag and drop your resume here, or</p>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-purple-600 font-semibold hover:text-purple-700">browse files</button>
                    </>
                  )}
                </div>
              </div>
              {error && (
                <div className="mt-3 bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}
              <div className="mt-4 flex items-center space-x-3">
                {uploading && <span className="text-sm text-gray-500">Parsing…</span>}
                {resumeMeta && <span className="text-sm text-gray-600">{resumeMeta.name} ({Math.round((resumeMeta.size||0)/1024)} KB)</span>}
              </div>
            </div>
            <p className="text-gray-600 mb-2">Or paste resume text below:</p>
            <textarea className="w-full h-56 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Or paste resume text here…" value={resumeText} onChange={(e) => setResumeText(e.target.value)} />
            <div className="mt-4 flex justify-end">
              <button disabled={!canNextFromStep1} onClick={() => setStep(2)} className={`px-6 py-2 rounded-lg font-semibold ${canNextFromStep1 ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Next</button>
            </div>
          </div>
        )}

        {/* Step 2: JD optional */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Paste Job Description (Optional)</h3>
            <textarea className="w-full h-56 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Paste the target job description (optional)…" value={jobDescriptionText} onChange={(e) => setJobDescriptionText(e.target.value)} />
            <div className="mt-4 flex justify-between">
              <button onClick={() => setStep(1)} className="px-6 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">Back</button>
              <button disabled={!canNextFromStep2} onClick={() => setStep(3)} className={`px-6 py-2 rounded-lg font-semibold ${canNextFromStep2 ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Next</button>
          </div>
        </div>
        )}

        {/* Step 3: Style selection */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Select Style & Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['formal','conversational','persuasive'].map((tone) => (
                <button key={tone} onClick={() => setStyle(tone)} className={`p-4 rounded-lg border text-left hover:shadow ${style === tone ? 'border-purple-600 ring-2 ring-purple-200' : 'border-gray-200'}`}>
                  <div className="font-semibold capitalize">{tone}</div>
                  <div className="text-sm text-gray-600 mt-1">{tone === 'formal' ? 'Professional & concise' : tone === 'conversational' ? 'Approachable & friendly' : 'Confident & persuasive'}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <button type="button" onClick={() => { setLength('short'); setCustomMaxWords(''); setCustomActive(false); }} className={`p-3 rounded-lg border text-left hover:shadow-sm ${(!customActive && length === 'short') ? 'border-purple-600 ring-2 ring-purple-200' : 'border-gray-200'}`}>
                <div className="font-semibold text-sm">Short</div>
                <div className="text-xs text-gray-600">≈200 words</div>
              </button>
              <button type="button" onClick={() => { setLength('standard'); setCustomMaxWords(''); setCustomActive(false); }} className={`p-3 rounded-lg border text-left hover:shadow-sm ${(!customActive && length === 'standard') ? 'border-purple-600 ring-2 ring-purple-200' : 'border-gray-200'}`}>
                <div className="font-semibold text-sm">Standard</div>
                <div className="text-xs text-gray-600">≈380 words</div>
              </button>
              <div
                role="button"
                tabIndex={0}
                onClick={() => { setCustomActive(true); customInputRef.current?.focus(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCustomActive(true); customInputRef.current?.focus(); } }}
                className={`p-3 rounded-lg border hover:shadow-sm cursor-pointer ${(customActive || customValid || customFocus) ? 'border-purple-600 ring-2 ring-purple-200' : 'border-gray-200'}`}
              >
                <div className="font-semibold text-sm mb-2">Custom</div>
                <div className="flex items-center space-x-2">
                  <input
                    ref={customInputRef}
                    type="number"
                    min={120}
                    max={800}
                    value={customMaxWords}
                    onChange={(e)=>{ setCustomMaxWords(e.target.value); if (!customActive) setCustomActive(true); }}
                    onFocus={() => { setCustomFocus(true); setCustomActive(true); }}
                    onBlur={() => setCustomFocus(false)}
                    placeholder="120–800"
                    className="w-20 p-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs text-gray-600">words</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Overrides presets when set</p>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes to the AI (optional)</label>
              <input className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="E.g., Emphasize cloud migration project; keep concise" value={userNotes} onChange={(e) => setUserNotes(e.target.value)} />
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(2)} className="px-6 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">Back</button>
              <button disabled={!canGenerate || generating} onClick={handleGenerate} className={`px-6 py-2 rounded-lg font-semibold ${canGenerate && !generating ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>{generating ? 'Generating…' : 'Generate Cover Letter'}</button>
            </div>
          </div>
        )}

        {/* Step 4: Generate & Refine */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex flex-col lg:flex-row lg:space-x-8">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Your Draft</h3>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setStep(3)} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Change Style</button>
                </div>
                </div>
                <textarea className="w-full h-80 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={editorText} onChange={(e) => setEditorText(e.target.value)} />
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button disabled={refining} onClick={() => handleRefine('Tighten language, improve clarity and impact.', undefined)} className={`px-4 py-2 rounded-lg font-semibold ${refining ? 'bg-gray-200 text-gray-500' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>{refining ? 'Refining…' : 'Refine'}</button>
                  <button disabled={refining} onClick={() => { const target = Math.max(120, Math.min(800, Math.floor(maxWords*0.6))); setCustomMaxWords(String(target)); handleRefine(`Shorten to ~${target} words. Keep key metrics and outcomes.`, 'formal', target); }} className={`px-4 py-2 rounded-lg font-semibold ${refining ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>Shorter</button>
                  <button disabled={refining} onClick={() => { const target = Math.max(120, Math.min(800, Math.floor(maxWords*1.2))); setCustomMaxWords(String(target)); handleRefine(`Expand to ~${target} words. Add concise details without fluff.`, undefined, target); }} className={`px-4 py-2 rounded-lg font-semibold ${refining ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>Longer</button>
                  <div className="flex items-center space-x-2">
                    <input type="number" min={120} max={800} value={customMaxWords} onChange={(e)=>setCustomMaxWords(e.target.value)} placeholder="Custom words" className="w-28 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <button disabled={refining || !customMaxWords} onClick={() => handleRefine(`Adjust to ~${maxWords} words while preserving tone and key outcomes.`, undefined, maxWords)} className={`px-3 py-2 rounded-lg font-semibold ${(!refining && customMaxWords) ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Apply</button>
                  </div>
                  <button onClick={handleExportDocx} className="px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700">Export DOCX</button>
                </div>
              </div>
              <div className="w-full lg:w-96 mt-8 lg:mt-0 space-y-4">
                {/* Word Count Card (color by limit adherence) */}
                <div className={`rounded-xl shadow-lg p-6 text-white ${currentWordCount > maxWords ? 'to-red-800 bg-opacity-50' : 'bg-gradient-to-br from-green-800 to-emerald-900'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm uppercase tracking-wider opacity-90 font-semibold">Word Count</div>
                      <div className="text-4xl font-extrabold mt-2">{currentWordCount}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-90">Limit</div>
                      <div className="text-2xl font-semibold">{maxWords}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-xs opacity-90 mb-1">Usage</div>
                    <div className="w-full bg-white/30 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((currentWordCount / maxWords) * 100))}%` }} />
                    </div>
            </div>
          </div>

                {/* Keyword Coverage Card */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-gray-900">Keyword Coverage</h4>
                    <span className="text-sm font-semibold text-purple-600">{keywordCoveragePct != null ? `${keywordCoveragePct}%` : '—'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(matchedKeywords.length > 0 ? matchedKeywords : extractedKeywords).map((k, i) => (
                      <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">{k}</span>
                    ))}
                    {matchedKeywords.length === 0 && extractedKeywords.length === 0 && (
                      <span className="text-sm text-gray-500">No keywords detected</span>
                    )}
                  </div>
                </div>

                {/* Warnings */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Warnings</div>
                  {(warnings || []).length === 0 ? (
                    <div className="text-sm text-gray-500">None</div>
                  ) : (
                    <ul className="list-disc list-inside text-amber-700 text-sm space-y-1">
                      {warnings.map((w, i) => (<li key={i}>{w}</li>))}
                    </ul>
                  )}
                </div>

                {/* Resume Facts */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="text-lg font-bold text-gray-900 mb-4">Resume Facts</div>
                  <div className="space-y-4">
                    {/* Skills */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Skills</span>
                        <span className="text-xs text-gray-500">{skills.length} total</span>
                      </div>
                      {skills.length === 0 ? (
                        <div className="text-sm text-gray-500">—</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {visibleSkills.map((s, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {s}
                            </span>
                          ))}
                          {skills.length > skillsCap && (
                            <button type="button" onClick={() => setShowMoreSkills(!showMoreSkills)} className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-100">
                              {showMoreSkills ? 'Show less' : `+${skills.length - skillsCap} more`}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tools */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Tools</span>
                        <span className="text-xs text-gray-500">{tools.length} total</span>
                      </div>
                      {tools.length === 0 ? (
                        <div className="text-sm text-gray-500">—</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {visibleTools.map((t, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                              {t}
                  </span>
                          ))}
                          {tools.length > toolsCap && (
                            <button type="button" onClick={() => setShowMoreTools(!showMoreTools)} className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100">
                              {showMoreTools ? 'Show less' : `+${tools.length - toolsCap} more`}
                            </button>
                          )}
          </div>
                      )}
        </div>

                    {/* Achievements */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Achievements</span>
                        <span className="text-xs text-gray-500">{achievements.length} total</span>
                      </div>
                      {achievements.length === 0 ? (
                        <div className="text-sm text-gray-500">—</div>
                      ) : (
                        <div className="space-y-2">
                          {visibleAchievements.map((a, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                              <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm text-gray-800">{a}</p>
                            </div>
                          ))}
                          {achievements.length > achievementsCap && (
                            <div>
                              <button type="button" onClick={() => setShowMoreAchievements(!showMoreAchievements)} className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full hover:bg-purple-100">
                                {showMoreAchievements ? 'Show less' : `Show ${achievements.length - achievementsCap} more`}
            </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetterGenerator;
