import React, { useEffect, useMemo, useState } from 'react';
import { jobPostAPI } from '../../services/api';

const defaultFilters = {
  q: '',
  location: '',
  employmentType: ''
};

const JobPostBoard = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('yaake_user');
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error('Unable to parse stored user', err);
      return null;
    }
  }, []);

  const userRole = storedUser?.role?.toLowerCase();

  const isApplicantView = !userRole || userRole === 'applicant';

  const fetchPosts = async (override = {}) => {
    setLoading(true);
    setError('');

    try {
      const { posts: fetchedPosts, pagination: meta } = await jobPostAPI.listPublic({
        ...filters,
        ...override
      });
      setPosts(fetchedPosts);
      setPagination(meta);
      setSelectedPost(fetchedPosts.length ? fetchedPosts[0] : null);
    } catch (err) {
      console.error('Failed to load job posts', err);
      setError(err.response?.data?.message || 'Unable to load job listings right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleClear = () => {
    setFilters(defaultFilters);
    fetchPosts({ ...defaultFilters, page: 1 });
  };

  const handleSelectPost = async (post) => {
    setSelectedPost(post);
    setLoadingDetail(true);
    try {
      const data = await jobPostAPI.getById(post._id);
      setSelectedPost(data);
    } catch (err) {
      console.error('Failed to fetch job post details', err);
      setError(err.response?.data?.message || 'Unable to load job post details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePageChange = (shift) => {
    if (!pagination) return;
    const targetPage = pagination.page + shift;
    if (targetPage < 1 || targetPage > pagination.pages) return;
    fetchPosts({ page: targetPage });
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 space-y-8">
      <header className="max-w-6xl mx-auto space-y-3">
        <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
          {isApplicantView ? 'Applicant Hub' : 'Job Market Overview'}
        </span>
        <h1 className="text-4xl font-bold text-gray-900">
          {isApplicantView ? 'Explore Current Opportunities' : 'Published Job Posts'}
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Browse live roles published by recruiters. Use filters to narrow results and click a listing to review the full brief.
        </p>
      </header>

      <section className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleSearch}>
          <input
            type="text"
            name="q"
            value={filters.q}
            onChange={handleInputChange}
            className="rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search by title or keyword"
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
            {['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-indigo-600 text-white font-semibold px-4 py-3 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-gray-300 px-4 py-3 text-gray-600 hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden xl:col-span-1">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Listings</h2>
              <p className="text-xs text-gray-500">
                {pagination?.total ? `${pagination.total} roles` : 'Latest opportunities'}
              </p>
            </div>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading job posts…</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 text-sm">{error}</div>
          ) : posts.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No results. Adjust your filters and try again.</div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[32rem] overflow-y-auto">
              {posts.map((post) => (
                <li
                  key={post._id}
                  className={`px-6 py-5 cursor-pointer transition ${
                    selectedPost?._id === post._id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-indigo-50'
                  }`}
                  onClick={() => handleSelectPost(post)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{post.jobTitle}</h3>
                      {post.companyName && <p className="text-sm text-gray-500">{post.companyName}</p>}
                      <p className="text-sm text-gray-500">{post.location}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                      {post.employmentType}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                    {post.description || 'View details for the full brief.'}
                  </p>
                  {post.analyticsSnapshot?.topSkills?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {post.analyticsSnapshot.topSkills.slice(0, 3).map((item) => (
                        <span key={item.skill} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                          {item.skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {pagination && pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <button
                onClick={() => handlePageChange(-1)}
                className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                disabled={pagination.page === pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 xl:col-span-2">
          {loadingDetail ? (
            <div className="text-center text-gray-500">Loading job details…</div>
          ) : selectedPost ? (
            <article className="space-y-6">
              <header className="border-b border-gray-100 pb-6 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{selectedPost.jobTitle}</h2>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
                      {selectedPost.companyName && <span>{selectedPost.companyName}</span>}
                      {selectedPost.location && (
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c-.8 0-1.5-.7-1.5-1.5S11.2 8 12 8s1.5.7 1.5 1.5S12.8 11 12 11zm0 10s-7-7.4-7-11.5a7 7 0 1114 0C19 13.6 12 21 12 21z" />
                          </svg>
                          {selectedPost.location}
                        </span>
                      )}
                      {selectedPost.employmentType && <span>{selectedPost.employmentType}</span>}
                      {selectedPost.salaryRange && <span>{selectedPost.salaryRange}</span>}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Published {new Date(selectedPost.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {selectedPost.tags?.length ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedPost.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </header>

              {selectedPost.description && (
                <section className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">Role Overview</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{selectedPost.description}</p>
                </section>
              )}

              {selectedPost.responsibilities?.length ? (
                <section className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">Key Responsibilities</h3>
                  <ul className="space-y-2 text-gray-700">
                    {selectedPost.responsibilities.map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {selectedPost.requiredSkills?.length ? (
                <section className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">Required Skills</h3>
                  <ul className="space-y-2 text-gray-700">
                    {selectedPost.requiredSkills.map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {selectedPost.analyticsSnapshot?.summary && (
                <section className="space-y-3 bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-indigo-900">In-demand Skill Signal</h3>
                  <p className="text-indigo-800 text-sm leading-relaxed">{selectedPost.analyticsSnapshot.summary}</p>
                </section>
              )}

              <footer className="border-t border-gray-100 pt-6 flex flex-wrap gap-3 text-sm">
                {selectedPost.applicationLink ? (
                  <a
                    href={selectedPost.applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center gap-2"
                  >
                    Apply Now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <button
                    disabled
                    className="px-6 py-3 rounded-lg bg-gray-400 text-white font-semibold cursor-not-allowed opacity-60"
                    title="No application link provided by recruiter"
                  >
                    Apply Now (Link Not Available)
                  </button>
                )}
              </footer>
            </article>
          ) : (
            <div className="text-center text-gray-500">Select a job listing to view the details.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default JobPostBoard;

