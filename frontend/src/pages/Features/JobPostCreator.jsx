import React from 'react';

const JobPostCreator = () => {
  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="inline-block px-4 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full mb-4">
            Use Case 9 (UC9)
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Job Post Creator
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Create compelling job postings that attract top talent with AI-powered description generation and inclusive language suggestions.
          </p>
        </div>

        {/* Status Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 p-6 rounded-lg shadow-sm mb-8 transition-all duration-300 hover:shadow-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-amber-900">Currently In Development</h3>
              <p className="text-amber-800 mt-1">This feature is being actively developed and will be available soon.</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overview Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Overview</h3>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                Craft job descriptions that resonate with qualified candidates. Our AI helps you write
                clear, engaging, and inclusive postings that highlight key responsibilities and attract
                the right talent to your organization.
              </p>
              <p className="leading-relaxed">
                Optimize your job posts for search engines and job boards while avoiding common pitfalls
                that could limit your candidate pool or create compliance issues.
              </p>
            </div>
          </div>

          {/* Features Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h3>
            <ul className="space-y-4">
              {[
                'Industry-standard templates',
                'Inclusive language suggestions',
                'Salary range recommendations',
                'SEO optimization for job boards',
                'Compliance checking'
              ].map((feature, index) => (
                <li key={index} className="flex items-start group">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 rounded-full bg-orange-600 group-hover:bg-orange-700 transition-colors duration-200"></div>
                  </div>
                  <span className="ml-4 text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg p-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Coming Soon</h3>
            <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
              Attract the best candidates with professionally crafted job descriptions.
              Our intelligent job post creator is launching soon.
            </p>
            <button className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5">
              Notify Me When Available
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPostCreator;
