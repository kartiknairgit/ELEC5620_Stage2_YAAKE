import React, { useEffect, useMemo, useState } from 'react';
import { jobPostAPI } from '../../services/api';

const defaultFilters = {
  q: '',
  location: '',
  employmentType: ''
};

const JobBoard = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('yaake_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isRecruiter = storedUser?.role?.toLowerCase?.() === 'recruiter';

  const fetchPosts = async (overrideFilters) => {
    const params = {
      ...filters,
      ...overrideFilters
    };

    setLoading(true);
    setError('');
    try {
      const { posts: list, pagination: meta } = await jobPostAPI.listPublic(params);
      setPosts(list);
      setPagination(meta);
      if (list.length > 0) {
        setSelectedPost(list[0]);
      } else {
        setSelectedPost(null);
      }
    } catch (err) {
      console.error('Failed to fetch job posts:', err);
      setError('Unable to load job posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    fetchPosts({ page: 1 });
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    fetchPosts({ q: '', location: '', employmentType: '', page: 1 });
  };

  const handleSelectPost = async (post) => {
    setSelectedPost(post);
    setLoadingDetail(true);
    try {
      const data = await jobPostAPI.getById(post._id);
      setSelectedPost(data);
    } catch (err) {
      console.error('Failed to load job details:', err);
      setError('Unable to load job details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (!pagination || newPage === pagination.page || newPage < 1 || newPage > pagination.pages) {
      return;
    }
    fetchPosts({ page: newPage });
  };

  useEffect(() => {
    fetchPosts({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
              Applicant View (UC9)
            </span>
            <h1 className="mt-4 text-4xl font-bold text-gray-900">Find Your Next Opportunity</h1>
            <p className="mt-2 text-gray-600 max-w-2xl">
              Browse roles crafted by recruiters using inclusive language and AI-powered guidance.
            </p>
          </div>
          {isRecruiter && (
            <div className="bg-white rounded-xl shadow px-4 py-3 border border-indigo-100 text-sm text-indigo-600">
              You are signed in as a recruiter. Switch to the Job Post Creator to manage your postings.
            </div>
          )}
        </header>

        <section className="bg-white rounded-2xl shadow-lg p-6">
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleSearch}>
            <input
              type="text"
              name="q"
              value={filters.q}
              onChange={handleInputChange}
              className="rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by title or keywords"
            />
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleInputChange}
              className="rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Location"
            />
            <select
              name="employmentType"
              value={filters.employmentType}
              onChange={handleInputChange}
              className="rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All employment types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Temporary">Temporary</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center px-4 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 bg-white rounded-2xl shadow-lg">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Job Listings</h2>
              {pagination && (
                <span className="text-sm text-gray-500">
                  {pagination.total} roles
                </span>
              )}
            </div>
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading roles…</div>
            ) : error ? (
              <div className="p-6 text-center text-red-600">{error}</div>
            ) : posts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No roles match your filters.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <li
                    key={post._id}
                    className={`cursor-pointer px-6 py-5 transition hover:bg-indigo-50 ${
                      selectedPost?._id === post._id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                    }`}
                    onClick={() => handleSelectPost(post)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{post.jobTitle}</h3>
                        <p className="text-sm text-gray-500">{post.location}</p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                        {post.employmentType}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 max-h-16 overflow-hidden">
                      {post.aiGenerated?.role_summary || 'Tap to view details.'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <button
                  className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className="xl:col-span-2 bg-white rounded-2xl shadow-lg p-8">
            {loadingDetail && (
              <div className="text-center text-gray-500">Loading job details…</div>
            )}
            {!loadingDetail && selectedPost ? (
              <article className="space-y-6">
                <header className="border-b border-gray-100 pb-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">{selectedPost.jobTitle}</h2>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12l4.243-4.243a4 4 0 10-5.657-5.657L7.757 7.757a4 4 0 005.657 5.657L9.414 17.657a4 4 0 105.657 5.657l4.243-4.243a4 4 0 000-5.657z" />
                          </svg>
                          {selectedPost.location}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {selectedPost.employmentType}
                        </span>
                        {selectedPost.department && (
                          <span>{selectedPost.department}</span>
                        )}
                        {selectedPost.salaryRange && (
                          <span className="inline-flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4-1.343 4-3m6 0c0 3.866-5.373 7-12 7S0 14.866 0 11" />
                            </svg>
                            {selectedPost.salaryRange}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="px-4 py-2 text-sm rounded-full bg-green-100 text-green-700 font-medium">
                      {selectedPost.status === 'published' ? 'Open role' : 'Draft'}
                    </span>
                  </div>
                  {selectedPost.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedPost.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </header>

                <section className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Role Summary</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedPost.aiGenerated?.role_summary || 'No summary provided.'}
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Key Responsibilities</h3>
                  <ul className="space-y-2 text-gray-700">
                    {selectedPost.aiGenerated?.key_responsibilities?.map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                        <span>{item}</span>
                      </li>
                    )) || <li>No responsibilities listed.</li>}
                  </ul>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Required Qualifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Education</h4>
                      <ul className="mt-2 space-y-1 text-gray-700 text-sm">
                        {selectedPost.aiGenerated?.required_qualifications?.education?.length
                          ? selectedPost.aiGenerated.required_qualifications.education.map((item, idx) => (
                              <li key={idx}>• {item}</li>
                            ))
                          : <li>Not specified</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Experience</h4>
                      <ul className="mt-2 space-y-1 text-gray-700 text-sm">
                        {selectedPost.aiGenerated?.required_qualifications?.experience?.length
                          ? selectedPost.aiGenerated.required_qualifications.experience.map((item, idx) => (
                              <li key={idx}>• {item}</li>
                            ))
                          : <li>Not specified</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Skills</h4>
                      <ul className="mt-2 space-y-1 text-gray-700 text-sm">
                        {selectedPost.aiGenerated?.required_qualifications?.skills?.length
                          ? selectedPost.aiGenerated.required_qualifications.skills.map((item, idx) => (
                              <li key={idx}>• {item}</li>
                            ))
                          : <li>Not specified</li>}
                      </ul>
                    </div>
                  </div>
                </section>

                {selectedPost.aiGenerated?.benefits?.length > 0 && (
                  <section className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Benefits</h3>
                    <ul className="space-y-2 text-gray-700">
                      {selectedPost.aiGenerated.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Full Description</h3>
                  <div className="prose prose-indigo max-w-none text-gray-700 whitespace-pre-line">
                    {selectedPost.aiGenerated?.full_description || 'Full description unavailable.'}
                  </div>
                </section>

                <footer className="pt-6 border-t border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-500">
                    <span>Published on {new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                        Save for later
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                        Apply Now
                      </button>
                    </div>
                  </div>
                </footer>
              </article>
            ) : (
              <div className="text-center text-gray-500">Select a job to view details.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default JobBoard;

