import React, { useMemo, useState } from 'react';
import { filesAPI, coverLettersAPI, exportAPI } from '../../services/api';

const CoverLetterGenerator = () => {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeMeta, setResumeMeta] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescriptionText, setJobDescriptionText] = useState('');

  const [style, setStyle] = useState('formal');
  const [length, setLength] = useState('standard');
  const [userNotes, setUserNotes] = useState('');

  const [drafts, setDrafts] = useState([]);
  const [selectedDraftIdx, setSelectedDraftIdx] = useState(0);
  const [editorText, setEditorText] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [extractedKeywords, setExtractedKeywords] = useState([]);
  const [extractedResumeFacts, setExtractedResumeFacts] = useState({ skills: [], achievements: [], tools: [] });

  const canNextFromStep1 = useMemo(() => resumeText && resumeText.trim().length > 50, [resumeText]);
  const canNextFromStep2 = true; // JD optional
  const canGenerate = useMemo(() => canNextFromStep1 && ['formal', 'conversational', 'persuasive'].includes(style), [canNextFromStep1, style]);

  async function handleUploadFile(file) {
    setUploading(true);
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
        alert('Generation failed.');
      }
    } catch (e) {
      alert('Generation failed. ' + (e?.response?.data?.message || e.message));
    } finally {
      setGenerating(false);
    }
  }

  async function handleRefine(instructions, toneOverride) {
    setRefining(true);
    try {
      const resp = await coverLettersAPI.refine({
        draftText: editorText,
        editInstructions: instructions || 'Tighten language and clarity.',
        newTone: toneOverride || style,
        length
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
        alert('Refine failed.');
      }
    } catch (e) {
      alert('Refine failed. ' + (e?.response?.data?.message || e.message));
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
        <div className="mb-8">
          <div className="inline-block px-4 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full mb-4">
            Use Case 2 (UC2) / UC3 / UC4
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
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Upload Resume</h3>
            <p className="text-gray-600 mb-4">Accepts PDF, DOCX, or TXT. We extract text for analysis. You may also paste text below.</p>
            <div className="flex items-center space-x-4 mb-4">
              <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => e.target.files[0] && handleUploadFile(e.target.files[0])} />
              {uploading && <span className="text-sm text-gray-500">Parsing…</span>}
              {resumeMeta && <span className="text-sm text-gray-600">{resumeMeta.name} ({Math.round((resumeMeta.size||0)/1024)} KB)</span>}
            </div>
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
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
              <div className="flex items-center space-x-3">
                <label className="inline-flex items-center space-x-2"><input type="radio" name="len" checked={length==='standard'} onChange={() => setLength('standard')} /><span>Standard (≈350 words)</span></label>
                <label className="inline-flex items-center space-x-2"><input type="radio" name="len" checked={length==='short'} onChange={() => setLength('short')} /><span>Short (≈200 words)</span></label>
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
                    <select value={selectedDraftIdx} onChange={(e) => { const idx = Number(e.target.value); setSelectedDraftIdx(idx); setEditorText(drafts[idx]?.body || ''); }} className="border rounded-lg p-2">
                      {drafts.map((d, i) => (
                        <option key={d.id || i} value={i}>{d.title || `Draft ${i+1}`} ({d.tone})</option>
                      ))}
                    </select>
                    <button onClick={() => setStep(3)} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Change Style</button>
                  </div>
                </div>
                <textarea className="w-full h-80 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={editorText} onChange={(e) => setEditorText(e.target.value)} />
                <div className="mt-4 flex items-center space-x-3">
                  <button disabled={refining} onClick={() => handleRefine('Tighten language, improve clarity and impact.', undefined)} className={`px-4 py-2 rounded-lg font-semibold ${refining ? 'bg-gray-200 text-gray-500' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>{refining ? 'Refining…' : 'Refine'}</button>
                  <button disabled={refining} onClick={() => handleRefine('Shorten to ~200 words. Keep key metrics and outcomes.', 'formal')} className={`px-4 py-2 rounded-lg font-semibold ${refining ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>Make Short Version</button>
                  <button onClick={handleExportDocx} className="px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700">Export DOCX</button>
                </div>
              </div>
              <div className="w-full lg:w-80 mt-8 lg:mt-0">
                <div className="bg-gray-50 rounded-lg border p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Metrics</div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div><span className="font-medium">Word count:</span> {drafts[selectedDraftIdx]?.wordCount ?? editorText.split(/\s+/).filter(Boolean).length}</div>
                    <div><span className="font-medium">Alignment score:</span> {drafts[selectedDraftIdx]?.alignmentScore ?? '—'}</div>
                    <div className="mt-2"><span className="font-medium">Keyword coverage:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {(drafts[selectedDraftIdx]?.keywordCoverage || extractedKeywords || []).map((k, i) => (
                          <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{k}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3"><span className="font-medium">Warnings:</span>
                      <ul className="list-disc list-inside text-amber-700 mt-1">
                        {(warnings || []).length === 0 ? <li className="text-gray-500">None</li> : warnings.map((w, i) => (<li key={i}>{w}</li>))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg border p-4 mt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Resume Facts</div>
                  <div className="text-sm text-gray-700">
                    <div className="mb-2"><span className="font-medium">Skills:</span> {(extractedResumeFacts.skills || []).join(', ') || '—'}</div>
                    <div className="mb-2"><span className="font-medium">Tools:</span> {(extractedResumeFacts.tools || []).join(', ') || '—'}</div>
                    <div><span className="font-medium">Achievements:</span>
                      <ul className="list-disc list-inside mt-1">
                        {(extractedResumeFacts.achievements || []).slice(0, 5).map((a, i) => (<li key={i}>{a}</li>))}
                        {(extractedResumeFacts.achievements || []).length === 0 && <li className="text-gray-500">—</li>}
                      </ul>
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
