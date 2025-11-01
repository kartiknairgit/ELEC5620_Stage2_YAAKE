import React, { useEffect, useMemo, useState } from 'react';
import { jobPostAPI } from '../../services/api';

const options = [
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 60, label: 'Last 60 days' }
];

const JobMarketInsights = () => {
  const [lookback, setLookback] = useState(30);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('yaake_user');
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error('Unable to parse stored user', err);
      return null;
    }
  }, []);

  const isCareerTrainer = storedUser?.role?.toLowerCase() === 'career_trainer';

  const fetchInsights = async (days) => {
    setLoading(true);
    setError('');
    try {
      const data = await jobPostAPI.getCareerInsights({ lookbackDays: days });
      setInsights(data);
    } catch (err) {
      console.error('Failed to fetch insights', err);
      setError(err.response?.data?.message || 'Unable to load market insights right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(lookback);
  }, [lookback]);

  if (!isCareerTrainer) {
    return (
      <div className="min-h-full bg-gradient-to-br from-teal-50 to-emerald-50 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Career Trainer Access Required</h1>
          <p className="text-gray-600">
            Market insights are built for the career training team. Please log in with a career trainer profile to view demand analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-teal-50 to-emerald-50 p-8 space-y-8">
      <header className="max-w-5xl mx-auto space-y-3">
        <span className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
          Career Training Intelligence
        </span>
        <h1 className="text-4xl font-bold text-gray-900">Skill Demand Insights</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Review the skills and roles most frequently requested by recruiters. Use these signals to prioritise new course offerings and
          refresh existing programmes.
        </p>
      </header>

      <section className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analysis window</h2>
          <p className="text-sm text-gray-500">Adjust the lookback period to understand short-term or medium-term trends.</p>
        </div>
        <select
          value={lookback}
          onChange={(event) => setLookback(Number(event.target.value))}
          className="rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-auto"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <section className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {loading ? (
          <div className="text-center text-gray-500">Crunching the latest demand signals…</div>
        ) : error ? (
          <div className="text-center text-red-600 text-sm">{error}</div>
        ) : insights ? (
          <>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-emerald-900 leading-relaxed">
              {insights.summary}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Skills In Demand</h3>
                {insights.topSkills?.length ? (
                  <ul className="space-y-3">
                    {insights.topSkills.map((item) => (
                      <li key={item.value} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800">{item.value}</span>
                        <span className="text-gray-500">{item.count} mentions</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Not enough data yet. Encourage recruiters to publish more roles.</p>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Job Families</h3>
                {insights.topRoles?.length ? (
                  <ul className="space-y-3">
                    {insights.topRoles.map((item) => (
                      <li key={item.value} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800">{item.value}</span>
                        <span className="text-gray-500">{item.count} postings</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No dominant job families yet for this period.</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiring Hotspots</h3>
              {insights.hotLocations?.length ? (
                <div className="flex flex-wrap gap-3">
                  {insights.hotLocations.map((item) => (
                    <span key={item.value} className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                      {item.value} • {item.count}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No location trends detected in this window.</p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">No insights available for the selected period.</div>
        )}
      </section>
    </div>
  );
};

export default JobMarketInsights;

