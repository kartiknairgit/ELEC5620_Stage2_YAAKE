import React, { useState, useEffect, useRef } from 'react';

/**
 * InterviewSession Component
 * Displays questions and handles user answers during the interview
 */
const InterviewSession = ({ interviewData, onFinishInterview }) => {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');

  const conversationEndRef = useRef(null);
  const answerInputRef = useRef(null);

  // Initialize with the first question
  useEffect(() => {
    if (interviewData && interviewData.question) {
      setConversationHistory([
        {
          type: 'question',
          content: interviewData.question,
          questionNumber: interviewData.questionNumber,
          totalQuestions: interviewData.totalQuestions
        }
      ]);
    }
  }, [interviewData]);

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Focus on answer input after question appears
  useEffect(() => {
    if (!loading && !isComplete) {
      answerInputRef.current?.focus();
    }
  }, [loading, conversationHistory, isComplete]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      setError('Please provide an answer before submitting');
      return;
    }

    setLoading(true);
    setError('');

    // Add user's answer to conversation
    const newConversation = [
      ...conversationHistory,
      {
        type: 'answer',
        content: answer.trim()
      }
    ];
    setConversationHistory(newConversation);

    try {
      const response = await fetch('http://localhost:5001/api/uc7/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('yaake_token')}`
        },
        body: JSON.stringify({
          interviewId: interviewData.interviewId,
          answer: answer.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit answer');
      }

      setAnswer(''); // Clear input

      if (data.data.isComplete) {
        // Interview is complete
        setIsComplete(true);
        setCompletionMessage(data.data.acknowledgment || data.data.message);
        setConversationHistory([
          ...newConversation,
          {
            type: 'completion',
            content: data.data.acknowledgment || data.data.message
          }
        ]);
      } else {
        // Add next question to conversation
        setConversationHistory([
          ...newConversation,
          {
            type: 'question',
            content: data.data.question,
            questionNumber: data.data.questionNumber,
            totalQuestions: data.data.totalQuestions
          }
        ]);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError(err.message || 'Failed to submit answer. Please try again.');
      // Remove the user's answer from conversation since submission failed
      setConversationHistory(conversationHistory);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  const progress = conversationHistory.filter(item => item.type === 'question').length;
  const total = interviewData?.totalQuestions || 5;
  const progressPercentage = (progress / total) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header with Progress */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Mock Interview in Progress</h1>
            <span className="text-sm font-medium text-gray-600">
              Question {progress} of {total}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {conversationHistory.map((item, index) => (
            <div key={index}>
              {item.type === 'question' && (
                <div className="flex items-start space-x-4">
                  {/* AI Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  {/* Question Bubble */}
                  <div className="flex-1">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-4 shadow-sm">
                      <p className="text-gray-800 whitespace-pre-wrap">{item.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-2">
                      Question {item.questionNumber} of {item.totalQuestions}
                    </p>
                  </div>
                </div>
              )}

              {item.type === 'answer' && (
                <div className="flex items-start space-x-4 justify-end">
                  {/* Answer Bubble */}
                  <div className="flex-1 max-w-3xl">
                    <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none p-4 shadow-sm">
                      <p className="whitespace-pre-wrap">{item.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 mr-2 text-right">You</p>
                  </div>
                  {/* User Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {item.type === 'completion' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <svg
                      className="w-12 h-12 text-green-600"
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
                  <p className="text-green-800 font-medium mb-2">{item.content}</p>
                  <p className="text-green-700 text-sm">Interview completed! Click below to get your results.</p>
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-tl-none p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={conversationEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {!isComplete && (
        <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  ref={answerInputRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your answer here... (Ctrl+Enter to submit)"
                  rows="3"
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                onClick={handleSubmitAnswer}
                disabled={loading || !answer.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Submit</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">Ctrl+Enter</kbd> to submit
            </p>
          </div>
        </div>
      )}

      {/* Finish Interview Button */}
      {isComplete && (
        <div className="bg-white border-t border-gray-200 px-6 py-6 shadow-lg">
          <div className="max-w-4xl mx-auto text-center">
            <button
              onClick={onFinishInterview}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-lg transition-colors duration-200 text-lg inline-flex items-center space-x-2"
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Get Your Results</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
