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
        const resp = await resumesAPI.translateResumePdf(selectedFile, targetLanguage, (p) => setUploadProgress(p));
        const blob = new Blob([resp.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setPdfLoading(true);
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

  const handleChangeFile = () => { try { fileInputRef.current.value = ''; } catch(e){}; fileInputRef.current?.click(); };

  // additional state for generic translated file
  const [translatedUrl, setTranslatedUrl] = useState(null);
  const [translatedFilename, setTranslatedFilename] = useState('');
  const [translatedMime, setTranslatedMime] = useState('');

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="inline-block px-4 py-1 bg-cyan-100 text-cyan-700 text-sm font-semibold rounded-full mb-4">Use Case 8 (UC8)</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Resume Translator</h1>
          <p className="text-gray-600 max-w-3xl">Upload a resume (PDF or DOCX) and translate it to another language while preserving layout when possible.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Upload & Translate</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Resume File (PDF or DOCX) *</label>
                <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-6 text-center ${dragActive ? 'border-cyan-500 bg-cyan-50' : ''}`}>
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
                  <div className="space-y-2">
                    {selectedFile ? (
                      <div className="text-sm flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-indigo-600">{selectedFile.name}</p>
                          <p className="text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={handleChangeFile} className="text-indigo-600 font-semibold">Change file</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-600">Drag and drop your file here, or</p>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-indigo-600 font-semibold">browse files</button>
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
                <div>
                  <div className="flex justify-between text-sm text-gray-600"><span>Translating...</span><span>{uploadProgress}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className="bg-cyan-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                </div>
              )}

              <button type="submit" disabled={uploading || !selectedFile} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50">{uploading ? 'Translating...' : 'Translate Resume'}</button>
            </form>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-lg p-8 min-h-[300px]">
              <h3 className="text-2xl font-bold mb-4">Translated Resume</h3>
              {!translatedUrl ? (
                <div className="text-gray-600">Translated file will appear here after translation. You can download it once ready.</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button onClick={downloadTranslated} disabled={busyDownload || !translatedUrl} className="bg-cyan-600 text-white px-4 py-2 rounded">{busyDownload ? 'Downloading...' : (translatedMime?.includes('pdf') ? 'Download PDF' : 'Download DOCX')}</button>
                    <button onClick={() => { if (translatedUrl) { URL.revokeObjectURL(translatedUrl); setTranslatedUrl(null); setTranslatedFilename(''); } setSelectedFile(null); setError(''); setPdfUrl(null); }} className="ml-auto bg-white border px-4 py-2 rounded">Reset</button>
                  </div>

                  {translatedMime?.includes('pdf') ? (
                    <div className="relative border border-gray-200 rounded overflow-hidden" style={{ height: '60vh' }}>
                      {pdfLoading && (<div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10"><svg className="w-12 h-12 text-cyan-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg></div>)}
                      <iframe title="Translated PDF" src={translatedUrl} className="w-full h-full" onLoad={() => setPdfLoading(false)} />
                    </div>
                  ) : (
                    <div className="text-gray-700">The translated DOCX is ready — use the Download button above to save it to your computer.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeTranslator;
