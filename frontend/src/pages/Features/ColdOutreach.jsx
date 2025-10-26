import React, { useState, useEffect } from 'react';
import { outreachAPI } from '../../services/api';
import { notifySuccess, notifyError, notifyInfo } from '../../services/notification.service';

const ColdOutreach = () => {
  const [outreachEmails, setOutreachEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantSkills: '',
    applicantExperience: '',
    applicantEmail: '',
    recruiterName: '',
    recruiterEmail: '',
    recruiterCompany: ''
  });

  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchOutreachEmails();
  }, [filterStatus]);

  const fetchOutreachEmails = async () => {
    setLoading(true);
    try {
      const status = filterStatus === 'all' ? null : filterStatus;
      const emails = await outreachAPI.getOutreachEmails(status);
      setOutreachEmails(emails);
    } catch (error) {
      notifyError('Failed to fetch outreach emails');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateEmail = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.applicantName || !formData.recruiterName || !formData.recruiterEmail || !formData.recruiterCompany) {
      notifyError('Please fill in all required fields');
      return;
    }

    setGenerating(true);
    try {
      const result = await outreachAPI.generateEmail({
        applicantName: formData.applicantName,
        applicantSkills: formData.applicantSkills,
        applicantExperience: formData.applicantExperience,
        applicantEmail: formData.applicantEmail,
        recruiterName: formData.recruiterName,
        recruiterEmail: formData.recruiterEmail,
        recruiterCompany: formData.recruiterCompany
      });

      if (result) {
        notifySuccess('Email generated successfully!');
        setSelectedEmail(result);
        setShowForm(false);
        fetchOutreachEmails();
      }
    } catch (error) {
      notifyError(error.response?.data?.message || 'Failed to generate email');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async (id) => {
    if (!window.confirm('Are you sure you want to send this email? This action cannot be undone.')) {
      return;
    }

    setSending(true);
    try {
      const result = await outreachAPI.sendEmail(id);
      if (result.success) {
        notifySuccess('Email sent successfully!');
        fetchOutreachEmails();
        if (selectedEmail?._id === id) {
          setSelectedEmail({ ...selectedEmail, status: 'sent' });
        }
      }
    } catch (error) {
      notifyError(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = async (id) => {
    const instructions = prompt('Enter additional instructions for regeneration (optional):');

    setGenerating(true);
    try {
      const result = await outreachAPI.regenerateEmail(id, instructions || '');
      if (result) {
        notifySuccess('Email regenerated successfully!');
        setSelectedEmail(result);
        fetchOutreachEmails();
      }
    } catch (error) {
      notifyError('Failed to regenerate email');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async (id) => {
    try {
      const blob = await outreachAPI.exportPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outreach-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notifySuccess('PDF exported successfully!');
    } catch (error) {
      notifyError('Failed to export PDF');
    }
  };

  const handleExportText = async (id) => {
    try {
      const blob = await outreachAPI.exportText(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outreach-${id}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notifySuccess('Text file exported successfully!');
    } catch (error) {
      notifyError('Failed to export text');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this email?')) {
      return;
    }

    try {
      await outreachAPI.deleteOutreach(id);
      notifySuccess('Email deleted successfully');
      fetchOutreachEmails();
      if (selectedEmail?._id === id) {
        setSelectedEmail(null);
      }
    } catch (error) {
      notifyError('Failed to delete email');
    }
  };

  const resetForm = () => {
    setFormData({
      applicantName: '',
      applicantSkills: '',
      applicantExperience: '',
      applicantEmail: '',
      recruiterName: '',
      recruiterEmail: '',
      recruiterCompany: ''
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Cold Outreach Emails</h2>
            <p className="text-gray-600 mt-1">AI-powered personalized recruiter outreach</p>
          </div>
          <button
            onClick={() => { setShowForm(true); resetForm(); }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            + Generate New Email
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {['all', 'draft', 'sent', 'failed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 max-h-[600px] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Your Emails ({outreachEmails.length})</h3>

            {loading && <p className="text-gray-500">Loading...</p>}

            {!loading && outreachEmails.length === 0 && (
              <p className="text-gray-500 text-center py-8">No emails yet. Generate your first one!</p>
            )}

            {outreachEmails.map(email => (
              <div
                key={email._id}
                onClick={() => setSelectedEmail(email)}
                className={`p-3 mb-2 rounded-lg cursor-pointer border-2 ${
                  selectedEmail?._id === email._id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm truncate">{email.recruiterCompany}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    email.status === 'sent' ? 'bg-green-100 text-green-800' :
                    email.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {email.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{email.recruiterName}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">{email.subject}</p>
              </div>
            ))}
          </div>

          {/* Email Preview/Detail */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            {!selectedEmail && (
              <div className="text-center py-20 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p>Select an email to view details</p>
              </div>
            )}

            {selectedEmail && (
              <div>
                {/* Email Header */}
                <div className="border-b pb-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold">{selectedEmail.recruiterCompany}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportPDF(selectedEmail._id)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => handleExportText(selectedEmail._id)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        TXT
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold">From:</span> {selectedEmail.applicantName}
                    </div>
                    <div>
                      <span className="font-semibold">To:</span> {selectedEmail.recruiterName}
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold">Email:</span> {selectedEmail.recruiterEmail}
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold">Skills:</span> {selectedEmail.applicantSkills?.join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">Subject:</label>
                  <div className="p-3 bg-gray-50 rounded border">{selectedEmail.subject}</div>
                </div>

                {/* Body */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-1">Email Body:</label>
                  <div className="p-4 bg-gray-50 rounded border whitespace-pre-wrap">
                    {selectedEmail.emailBody}
                  </div>
                </div>

                {/* Error Message */}
                {selectedEmail.status === 'failed' && selectedEmail.errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <strong>Error:</strong> {selectedEmail.errorMessage}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                  {selectedEmail.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleSendEmail(selectedEmail._id)}
                        disabled={sending}
                        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {sending ? 'Sending...' : 'Send Email'}
                      </button>
                      <button
                        onClick={() => handleRegenerate(selectedEmail._id)}
                        disabled={generating}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {generating ? 'Regenerating...' : 'Regenerate'}
                      </button>
                    </>
                  )}

                  {selectedEmail.status === 'sent' && (
                    <div className="px-4 py-2 bg-green-100 text-green-800 rounded font-medium">
                      Sent on {new Date(selectedEmail.sentAt).toLocaleString()}
                    </div>
                  )}

                  {selectedEmail.status === 'failed' && (
                    <button
                      onClick={() => handleSendEmail(selectedEmail._id)}
                      disabled={sending}
                      className="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400"
                    >
                      {sending ? 'Retrying...' : 'Retry Send'}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(selectedEmail._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generation Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 m-4">
              <h3 className="text-2xl font-bold mb-4">Generate New Outreach Email</h3>

              <form onSubmit={handleGenerateEmail}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <h4 className="font-semibold text-lg mb-2">Applicant Information</h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      name="applicantName"
                      value={formData.applicantName}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      name="applicantEmail"
                      value={formData.applicantEmail}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      placeholder="For reply-to"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Skills</label>
                    <input
                      type="text"
                      name="applicantSkills"
                      value={formData.applicantSkills}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., React, Node.js, Python"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Experience</label>
                    <textarea
                      name="applicantExperience"
                      value={formData.applicantExperience}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      rows={3}
                      placeholder="Brief description of experience"
                    />
                  </div>

                  <div className="col-span-2">
                    <h4 className="font-semibold text-lg mb-2 mt-4">Recruiter Information</h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Recruiter Name *</label>
                    <input
                      type="text"
                      name="recruiterName"
                      value={formData.recruiterName}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Company *</label>
                    <input
                      type="text"
                      name="recruiterCompany"
                      value={formData.recruiterCompany}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Recruiter Email *</label>
                    <input
                      type="email"
                      name="recruiterEmail"
                      value={formData.recruiterEmail}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {generating ? 'Generating with AI...' : 'Generate Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColdOutreach;
