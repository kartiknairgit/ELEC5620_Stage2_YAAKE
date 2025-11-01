import React, { useState, useRef } from 'react';
import { resumesAPI } from '../../services/api';

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Spanish (Español)' },
  { code: 'French', label: 'French (Français)' },
  { code: 'German', label: 'German (Deutsch)' },
  { code: 'Chinese (Simplified)', label: 'Chinese (Simplified) - 中文 (简体)' },
  { code: 'Japanese', label: 'Japanese (日本語)' },
  { code: 'Portuguese', label: 'Portuguese (Português)' },
  { code: 'Arabic', label: 'Arabic (العربية)' },
  { code: 'Russian', label: 'Russian (Русский)' },
  { code: 'Italian', label: 'Italian (Italiano)' }
];

const ResumeTranslator = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [busyDownload, setBusyDownload] = useState(false);
  const fileInputRef = useRef(null);


  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const ext = file.name?.toLowerCase().split('.').pop();
      const isDocx = ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isPdf = ext === 'pdf' || file.type === 'application/pdf';
      if (!isPdf && !isDocx) {
        setError('Please upload a PDF or DOCX file');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError('File size must be less than 20MB');
        return;
      }
      setSelectedFile(file);
      setError('');
      try { fileInputRef.current.value = ''; } catch (e) {}
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileChange({ target: { files } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // cleanup previous pdf
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }
    if (translatedUrl) { URL.revokeObjectURL(translatedUrl); setTranslatedUrl(null); setTranslatedFilename(''); }

    if (!selectedFile) { setError('Please select a PDF or DOCX file'); return; }

    setUploading(true);
    setUploadProgress(0);

    try {
      const ext = selectedFile.name?.toLowerCase().split('.').pop();
      if (ext === 'pdf' || selectedFile.type === 'application/pdf') {
        // show loading placeholder in the preview area while we wait for the server
        setPdfLoading(true);
        const resp = await resumesAPI.translateResumePdf(selectedFile, targetLanguage, (p) => setUploadProgress(p));
        const blob = new Blob([resp.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setTranslatedUrl(url);
        setTranslatedFilename(`translated_resume_${targetLanguage.replace(/\s+/g,'_')}.pdf`);
        setTranslatedMime('application/pdf');
      } else {
        // assume docx
        const resp = await resumesAPI.translateResumeDocx(selectedFile, targetLanguage, (p) => setUploadProgress(p));
        const blob = new Blob([resp.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);
        setTranslatedUrl(url);
        setTranslatedFilename(`translated_resume_${targetLanguage.replace(/\s+/g,'_')}.docx`);
        setTranslatedMime('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        // no preview for docx
      }
    } catch (err) {
      console.error('Translate error:', err);
      setError(err.response?.data?.message || err.message || 'Translation failed');
      // ensure loading overlay is removed on failure
      setPdfLoading(false);
    } finally {
      setUploading(false);
    }
  };

  const downloadTranslated = async () => {
    if (!translatedUrl || !translatedFilename) { setError('No translated file available to download'); return; }
    setBusyDownload(true);
    try {
      const a = document.createElement('a');
      a.href = translatedUrl;
      a.download = translatedFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setBusyDownload(false);
    }
  };

  // helper to open file picker (use inline where needed)

  // additional state for generic translated file
  const [translatedUrl, setTranslatedUrl] = useState(null);
  const [translatedFilename, setTranslatedFilename] = useState('');
  const [translatedMime, setTranslatedMime] = useState('');

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Global overlay while uploading/translating */}
      {(uploading || pdfLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[420px] max-w-[90%] text-center">
            <svg className="mx-auto mb-4 w-12 h-12 text-indigo-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Translating resume</h3>
            <p className="text-sm text-gray-600 mb-4">Please wait while we translate and prepare your file.</p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-indigo-600 h-3 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <div className="mt-2 text-xs text-gray-500">{uploadProgress}%</div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full mb-4">Use Case 8 (UC8)</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Resume Translator</h1>
          <p className="text-lg text-gray-600 max-w-3xl">Upload a resume (PDF or DOCX) and translate it to another language. For PDFs we provide a plain translated PDF; DOCX downloads are supported.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload & Translate</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Resume File (PDF or DOCX) *</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
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
                        <p className="text-gray-600">Drag and drop your file here, or</p>
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Language *</label>
                <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  {LANGUAGES.map((lang) => (<option key={lang.code} value={lang.code}>{lang.label}</option>))}
                </select>
              </div>

              {error && (<div className="bg-red-50 border-l-4 border-red-500 p-4 rounded"><p className="text-red-800 text-sm font-medium">{error}</p></div>)}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Translating...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <button type="submit" disabled={uploading || !selectedFile} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg">
                {uploading ? 'Translating...' : 'Translate Resume'}
              </button>
            </form>
          </div>

          <div>
            {!translatedUrl ? (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Upload Resume</h4>
                      <p className="text-gray-600 text-sm">Upload your resume in PDF or DOCX format.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Choose Language</h4>
                      <p className="text-gray-600 text-sm">Select the target language for translation.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Receive Translated File</h4>
                      <p className="text-gray-600 text-sm">We return a translated PDF (plain layout) or a DOCX download.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">PDF Translation</span>
                      <span className="font-semibold text-indigo-600">Plain PDF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">DOCX Translation</span>
                      <span className="font-semibold text-indigo-600">Download</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">File Size Limit</span>
                      <span className="font-semibold text-indigo-600">20 MB</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-3">
                  <button onClick={downloadTranslated} disabled={busyDownload || !translatedUrl} className="bg-indigo-600 text-white px-4 py-2 rounded">{busyDownload ? 'Downloading...' : (translatedMime?.includes('pdf') ? 'Download PDF' : 'Download DOCX')}</button>
                  <button onClick={() => { if (translatedUrl) { URL.revokeObjectURL(translatedUrl); setTranslatedUrl(null); setTranslatedFilename(''); } setSelectedFile(null); setError(''); setPdfUrl(null); }} className="ml-auto bg-white border px-4 py-2 rounded">Reset</button>
                </div>

                {translatedMime?.includes('pdf') ? (
                  <div className="relative border border-gray-200 rounded overflow-hidden bg-white" style={{ height: '60vh' }}>
                    {pdfLoading && (<div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10"><svg className="w-12 h-12 text-indigo-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg></div>)}
                    <iframe title="Translated PDF" src={translatedUrl} className="w-full h-full" onLoad={() => setPdfLoading(false)} />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <p className="text-gray-700">The translated DOCX is ready — use the Download button above to save it to your computer.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeTranslator;
