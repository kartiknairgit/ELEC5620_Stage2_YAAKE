import React, { useEffect, useMemo, useState } from 'react';
import { jobPostAPI } from '../../services/api';

const defaultForm = {
  jobTitle: '',
  department: '',
  employmentType: 'Full-time',
  location: '',
  experienceLevel: '',
  responsibilities: '',
  requiredSkills: '',
  yearsExperience: '',
  salaryRange: '',
  tags: '',
  status: 'published'
};

const JobPostCreator = () => {
  const [form, setForm] = useState(() => ({ ...defaultForm }));
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [recentPost, setRecentPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('yaake_user');
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }, []);

  const isRecruiter = storedUser?.role?.toLowerCase?.() === 'recruiter';

  const parseListInput = (value) => {
    if (!value) return [];
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const resetMessages = () => {
    setError('');
    setSuccess('');
    setFormErrors({});
  };

  const validate = () => {
    const errors = {};
    if (!form.jobTitle.trim()) {
      errors.jobTitle = 'Job title is required';
    }
    if (!form.location.trim()) {
      errors.location = 'Location is required';
    }
    if (!form.department.trim()) {
      errors.department = 'Department is required';
    }
    return errors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    resetMessages();
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetMessages();
    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      jobTitle: form.jobTitle.trim(),
      department: form.department.trim(),
      employmentType: form.employmentType,
      location: form.location.trim(),
      experienceLevel: form.experienceLevel.trim(),
      responsibilities: parseListInput(form.responsibilities),
      requiredSkills: parseListInput(form.requiredSkills),
      yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
      salaryRange: form.salaryRange.trim(),
      status: form.status,
      tags: parseListInput(form.tags)
    };

    setSubmitting(true);
    try {
      const response = await jobPostAPI.create(payload);
      if (response) {
        setSuccess('Job post generated successfully.');
        setRecentPost(response);
        setForm({ ...defaultForm });
        setPosts((prev) => [response, ...prev]);
      }
    } catch (err) {
      console.error('Job post creation failed:', err);
      setError(err.response?.data?.message || 'Failed to create job post.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      if (!isRecruiter) {
        setLoadingPosts(false);
        return;
      }

      try {
        const data = await jobPostAPI.getMine();
        setPosts(data);
      } catch (err) {
        console.error('Failed to load job posts:', err);
        setError('Unable to load job posts.');
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [isRecruiter]);

  if (!isRecruiter) {
    return (
      <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Recruiter Access Needed</h1>
          <p className="text-gray-600">
            The job post creator is available to recruiter accounts. Please log in with a recruiter profile to
            create and manage job postings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="space-y-4">
          <span className="inline-block px-4 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
            Use Case 9 (UC9)
          </span>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Post Creator</h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Craft inclusive job descriptions with AI assistance, automatically validated and saved for review.
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Create a Job Post</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={form.jobTitle}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${formErrors.jobTitle ? 'border-red-500' : 'border-gray-200'} px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    placeholder="Senior Software Engineer"
                  />
                  {formErrors.jobTitle && <p className="mt-2 text-sm text-red-600">{formErrors.jobTitle}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${formErrors.department ? 'border-red-500' : 'border-gray-200'} px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    placeholder="Engineering"
                  />
                  {formErrors.department && <p className="mt-2 text-sm text-red-600">{formErrors.department}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select
                    name="employmentType"
                    value={form.employmentType}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                    <option>Temporary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${formErrors.location ? 'border-red-500' : 'border-gray-200'} px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    placeholder="Sydney, AU (Hybrid)"
                  />
                  {formErrors.location && <p className="mt-2 text-sm text-red-600">{formErrors.location}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <input
                    type="text"
                    name="experienceLevel"
                    value={form.experienceLevel}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Mid-level"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    name="yearsExperience"
                    value={form.yearsExperience}
                    onChange={handleChange}
                    min="0"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                  <input
                    type="text"
                    name="salaryRange"
                    value={form.salaryRange}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="$100k - $130k + super"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsibilities <span className="text-gray-400">(one per line)</span>
                </label>
                <textarea
                  name="responsibilities"
                  value={form.responsibilities}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder={'Lead sprint ceremonies\nCollaborate with cross-functional teams'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skills <span className="text-gray-400">(one per line)</span>
                </label>
                <textarea
                  name="requiredSkills"
                  value={form.requiredSkills}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder={'React and TypeScript\nCloud infrastructure (AWS/Azure)'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags <span className="text-gray-400">(comma or line separated)</span>
                </label>
                <textarea
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  rows="2"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="frontend, leadership, hybrid"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-orange-600 text-white font-semibold shadow hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? 'Generating…' : 'Generate Job Post'}
                </button>
              </div>
            </form>
          </div>

          <aside className="bg-white rounded-2xl shadow-lg p-8 h-full">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Latest AI Draft</h2>
            {!recentPost && (
              <p className="text-gray-500">
                Submit a job post to preview the AI-generated content, validation, and bias analysis here.
              </p>
            )}

            {recentPost && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{recentPost.aiGenerated?.job_title}</h3>
                  <p className="text-sm text-gray-500">{recentPost.location}</p>
                </div>
                <div className="rounded-lg bg-orange-50 border border-orange-100 p-4">
                  <p className="text-sm text-gray-700">{recentPost.aiGenerated?.role_summary}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Key Responsibilities</h4>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    {recentPost.aiGenerated?.key_responsibilities?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500" />
                        <span>{item}</span>
                      </li>
                    )) || <li>Not provided</li>}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Validation</h4>
                  <p className="text-sm text-gray-600">
                    {recentPost.validation?.is_valid ? 'Structure looks good.' : 'Review warnings before publishing.'}
                  </p>
                  {recentPost.validation?.warnings?.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                      {recentPost.validation.warnings.map((warning, idx) => (
                        <li key={idx}>⚠️ {warning}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Bias Check</h4>
                  <p className="text-sm text-gray-600">
                    Score: {recentPost.bias_check?.bias_score ?? 0} / 100 —{' '}
                    {recentPost.bias_check?.bias_detected ? 'Issues flagged' : 'No issues detected'}
                  </p>
                  {recentPost.bias_check?.issues?.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
                      {recentPost.bias_check.issues.map((issue, idx) => (
                        <li key={idx}>
                          <strong>{issue.type}:</strong> {issue.text} → {issue.suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </aside>
        </section>

        <section className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Your Job Posts</h2>
              <p className="text-gray-500 text-sm">
                Review AI-generated content, validation warnings, and bias recommendations for each post.
              </p>
            </div>
          </div>

          {loadingPosts ? (
            <div className="py-8 text-center text-gray-500">Loading your job posts…</div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No job posts yet. Create your first post using the form above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <article key={post._id} className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md p-6 transition-all bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{post.jobTitle}</h3>
                      <p className="text-sm text-gray-500">{post.location}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-gray-600 max-h-24 overflow-hidden">
                    {post.aiGenerated?.role_summary || 'AI summary unavailable.'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {post.tags?.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-600">
                    <p>
                      <strong>Bias score:</strong> {post.bias_check?.bias_score ?? 0} —
                      {post.bias_check?.bias_detected ? ' Issues found' : ' Clear'}
                    </p>
                    <p>
                      <strong>Validation:</strong>{' '}
                      {post.validation?.is_valid ? 'Passing checks' : 'Review required'}
                    </p>
                    <p>
                      <strong>Created:</strong>{' '}
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default JobPostCreator;
