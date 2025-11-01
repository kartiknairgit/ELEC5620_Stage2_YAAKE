import React, { useEffect, useMemo, useState } from 'react';
import { jobPostAPI } from '../../services/api';

const defaultForm = {
  jobTitle: '',
  companyName: '',
  department: '',
  employmentType: 'Full-time',
  location: '',
  salaryRange: '',
  experienceLevel: '',
  yearsExperience: '',
  description: '',
  responsibilities: '',
  requiredSkills: '',
  tags: '',
  applicationLink: '',
  status: 'published'
};

const JobPostCreator = () => {
  const [form, setForm] = useState({ ...defaultForm });
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('yaake_user');
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Failed to parse stored user', error);
      return null;
    }
  }, []);

  const isRecruiter = storedUser?.role?.toLowerCase() === 'recruiter';

  useEffect(() => {
    const loadPosts = async () => {
      if (!isRecruiter) {
        setLoadingPosts(false);
        return;
      }

      try {
        const data = await jobPostAPI.getMine();
        setPosts(data);
      } catch (error) {
        console.error('Failed to fetch job posts', error);
        setAlert({
          type: 'error',
          message: error.response?.data?.message || 'Unable to load existing job posts.'
        });
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, [isRecruiter]);

  const sanitizeListForPayload = (value) => {
    if (!value) return [];
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const validateForm = () => {
    const errors = {};

    if (!form.jobTitle.trim()) {
      errors.jobTitle = 'Job title is required';
    }
    if (!form.location.trim()) {
      errors.location = 'Location is required';
    }
    if (!form.requiredSkills.trim()) {
      errors.requiredSkills = 'List at least one required skill';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAlert({ type: '', message: '' });
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (creating) return;

    if (!validateForm()) {
      return;
    }

    const payload = {
      ...form,
      responsibilities: sanitizeListForPayload(form.responsibilities),
      requiredSkills: sanitizeListForPayload(form.requiredSkills),
      tags: sanitizeListForPayload(form.tags),
      yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined
    };

    setCreating(true);
    setAlert({ type: '', message: '' });
    try {
      const created = await jobPostAPI.create(payload);
      setAlert({
        type: 'success',
        message: 'Job post published successfully.'
      });
      setPosts((prev) => [created, ...prev]);
      setForm({ ...defaultForm });
    } catch (error) {
      console.error('Job post creation failed', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to publish job post.'
      });
    } finally {
      setCreating(false);
    }
  };

  if (!isRecruiter) {
    return (
      <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Recruiter Access Required</h1>
          <p className="text-gray-600">
            The job post creator is available to recruiter accounts. Please log in as a recruiter to manage job postings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8 space-y-8">
      <header className="max-w-6xl mx-auto space-y-3">
        <span className="inline-block px-4 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">Recruiter Toolkit</span>
        <h1 className="text-4xl font-bold text-gray-900">Job Post Creator</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Publish new opportunities in minutes. Share clear expectations, highlight key skills, and keep applicants aligned with your hiring needs.
        </p>
      </header>

      <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-700">Job Title *</label>
              <input
                type="text"
                name="jobTitle"
                value={form.jobTitle}
                onChange={handleChange}
                className={`mt-2 w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 ${formErrors.jobTitle ? 'border-red-400' : 'border-gray-200'}`}
                placeholder="Senior Frontend Engineer"
              />
              {formErrors.jobTitle && <p className="mt-1 text-sm text-red-600">{formErrors.jobTitle}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Company</label>
              <input
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Acme Labs"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Department</label>
              <input
                type="text"
                name="department"
                value={form.department}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Product Engineering"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Employment Type</label>
              <select
                name="employmentType"
                value={form.employmentType}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Location *</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className={`mt-2 w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 ${formErrors.location ? 'border-red-400' : 'border-gray-200'}`}
                placeholder="Sydney, NSW (Hybrid)"
              />
              {formErrors.location && <p className="mt-1 text-sm text-red-600">{formErrors.location}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Salary Range</label>
              <input
                type="text"
                name="salaryRange"
                value={form.salaryRange}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="$110k – $135k + super"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Experience Level</label>
              <input
                type="text"
                name="experienceLevel"
                value={form.experienceLevel}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Mid-level"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Years of Experience</label>
              <input
                type="number"
                name="yearsExperience"
                value={form.yearsExperience}
                onChange={handleChange}
                min="0"
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="3"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">Role Overview</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Share what success looks like in this role..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Responsibilities</label>
              <span className="text-xs text-gray-400">One per line or separate with commas</span>
            </div>
            <textarea
              name="responsibilities"
              value={form.responsibilities}
              onChange={handleChange}
              rows="4"
              className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={'Lead sprint planning\nCollaborate with product and design\nMentor junior engineers'}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Required Skills *</label>
              <span className="text-xs text-gray-400">One per line or separate with commas</span>
            </div>
            <textarea
              name="requiredSkills"
              value={form.requiredSkills}
              onChange={handleChange}
              rows="4"
              className={`mt-2 w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 ${formErrors.requiredSkills ? 'border-red-400' : 'border-gray-200'}`}
              placeholder={'React & TypeScript\nCloud infrastructure (AWS/Azure)\nAccessibility best practices'}
            />
            {formErrors.requiredSkills && <p className="mt-1 text-sm text-red-600">{formErrors.requiredSkills}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">Tags</label>
            <textarea
              name="tags"
              value={form.tags}
              onChange={handleChange}
              rows="2"
              className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="frontend, leadership, hybrid"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">Application Link (Course/External Form URL)</label>
            <input
              type="url"
              name="applicationLink"
              value={form.applicationLink}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://example.com/apply or course link"
            />
            <p className="mt-1 text-xs text-gray-500">Where should applicants go when they click "Apply Now"?</p>
          </div>

          {alert.message && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                alert.type === 'success'
                  ? 'border border-green-200 bg-green-50 text-green-700'
                  : 'border border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {alert.message}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-orange-600 text-white font-semibold shadow hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-70"
              disabled={creating}
            >
              {creating ? 'Publishing...' : 'Publish Job Post'}
            </button>
          </div>
        </form>

        <aside className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Recent Posts</h2>
            <p className="text-sm text-gray-500 mt-1">Published items appear instantly on the applicant job board.</p>
          </div>

          {loadingPosts ? (
            <div className="text-gray-500 text-sm">Loading your postings…</div>
          ) : posts.length === 0 ? (
            <div className="text-gray-500 text-sm">
              You have not published any roles yet. Use the form to create your first posting.
            </div>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li key={post._id} className="border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{post.jobTitle}</h3>
                      <p className="text-sm text-gray-500">{post.location}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                    {post.description || 'No overview provided.'}
                  </p>
                  {post.analyticsSnapshot?.topSkills?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {post.analyticsSnapshot.topSkills.map((item) => (
                        <span key={item.skill} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                          {item.skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-3 text-xs text-gray-400">
                    Posted {new Date(post.createdAt).toLocaleDateString()} • Updated {new Date(post.updatedAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>
    </div>
  );
};

export default JobPostCreator;
