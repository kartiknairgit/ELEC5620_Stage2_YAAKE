import React from 'react';

/**
 * InterviewResults Component
 * Displays comprehensive feedback, scores, and detailed analysis after interview completion
 */
const InterviewResults = ({ results, onStartNewInterview }) => {
  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const { scores, overallFeedback, strengths, improvements, detailedFeedback } = results;

  // Score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Score bar color
  const getScoreBarColor = (score) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Interview Complete!</h1>
          <p className="text-gray-600 text-lg">Here's your comprehensive performance analysis</p>
        </div>

        {/* Overall Score Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="text-center">
            <p className="text-indigo-100 text-lg mb-2">Overall Score</p>
            <div className="text-7xl font-bold mb-4">{scores.overall}</div>
            <div className="w-full bg-indigo-400 rounded-full h-3 mb-4">
              <div
                className="bg-white h-3 rounded-full transition-all duration-1000"
                style={{ width: `${scores.overall}%` }}
              ></div>
            </div>
            <p className="text-indigo-100 text-lg">{overallFeedback}</p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Score Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Technical Score */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(scores.technical)} mb-3`}>
                <span className={`text-3xl font-bold ${getScoreColor(scores.technical)}`}>
                  {scores.technical}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Technical Skills</h3>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getScoreBarColor(scores.technical)} h-2 rounded-full transition-all duration-1000`}
                  style={{ width: `${scores.technical}%` }}
                ></div>
              </div>
            </div>

            {/* Communication Score */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(scores.communication)} mb-3`}>
                <span className={`text-3xl font-bold ${getScoreColor(scores.communication)}`}>
                  {scores.communication}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Communication</h3>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getScoreBarColor(scores.communication)} h-2 rounded-full transition-all duration-1000`}
                  style={{ width: `${scores.communication}%` }}
                ></div>
              </div>
            </div>

            {/* Problem Solving Score */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(scores.problemSolving)} mb-3`}>
                <span className={`text-3xl font-bold ${getScoreColor(scores.problemSolving)}`}>
                  {scores.problemSolving}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Problem Solving</h3>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getScoreBarColor(scores.problemSolving)} h-2 rounded-full transition-all duration-1000`}
                  style={{ width: `${scores.problemSolving}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths and Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Strengths</h2>
            </div>
            <ul className="space-y-3">
              {strengths && strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Areas for Improvement</h2>
            </div>
            <ul className="space-y-3">
              {improvements && improvements.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detailed Feedback per Question */}
        {detailedFeedback && detailedFeedback.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Question Analysis</h2>
            <div className="space-y-6">
              {detailedFeedback.map((feedback, index) => (
                <div key={index} className="border-l-4 border-indigo-600 pl-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg text-gray-900">
                      Question {feedback.questionNumber}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreBgColor(feedback.score)} ${getScoreColor(feedback.score)}`}>
                      Score: {feedback.score}
                    </span>
                  </div>

                  {/* Question */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-500 mb-1">Question:</p>
                    <p className="text-gray-700 italic">{feedback.question}</p>
                  </div>

                  {/* Answer */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-500 mb-1">Your Answer:</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{feedback.answer}</p>
                  </div>

                  {/* Strengths */}
                  {feedback.strengths && feedback.strengths.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-green-700 mb-1">What went well:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {feedback.strengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {feedback.improvements && feedback.improvements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-indigo-700 mb-1">How to improve:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {feedback.improvements.map((improvement, idx) => (
                          <li key={idx}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onStartNewInterview}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 text-lg inline-flex items-center justify-center space-x-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Start New Interview</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 text-lg inline-flex items-center justify-center space-x-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span>Print Results</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewResults;
