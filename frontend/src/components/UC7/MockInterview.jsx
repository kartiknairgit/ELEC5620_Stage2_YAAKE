import React, { useState } from 'react';
import InterviewSetup from './InterviewSetup';
import InterviewSession from './InterviewSession';
import InterviewResults from './InterviewResults';

/**
 * MockInterview - Main Controller Component
 * Orchestrates the flow between setup, session, and results
 */
const MockInterview = () => {
  const [currentStep, setCurrentStep] = useState('setup'); // 'setup', 'session', 'results'
  const [interviewData, setInterviewData] = useState(null);
  const [results, setResults] = useState(null);

  /**
   * Handle starting the interview
   * Calls backend API to create interview session and get first question
   */
  const handleStartInterview = async (formData) => {
    try {
      const token = localStorage.getItem('yaake_token');

      if (!token) {
        throw new Error('Please login to start the interview');
      }

      const response = await fetch('http://localhost:5002/api/uc7/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start interview');
      }

      // Save interview data and move to session
      setInterviewData(data.data);
      setCurrentStep('session');
    } catch (error) {
      console.error('Error starting interview:', error);
      throw error;
    }
  };

  /**
   * Handle finishing the interview
   * Calls backend API to generate feedback and scores
   */
  const handleFinishInterview = async () => {
    try {
      const token = localStorage.getItem('yaake_token');

      const response = await fetch('http://localhost:5002/api/uc7/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          interviewId: interviewData.interviewId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to finish interview');
      }

      // Save results and move to results page
      setResults(data.data);
      setCurrentStep('results');
    } catch (error) {
      console.error('Error finishing interview:', error);
      alert('Failed to get results: ' + error.message);
    }
  };

  /**
   * Handle starting a new interview
   * Resets state and goes back to setup
   */
  const handleStartNewInterview = () => {
    setCurrentStep('setup');
    setInterviewData(null);
    setResults(null);
  };

  // Render appropriate component based on current step
  return (
    <div>
      {currentStep === 'setup' && (
        <InterviewSetup onStartInterview={handleStartInterview} />
      )}

      {currentStep === 'session' && (
        <InterviewSession
          interviewData={interviewData}
          onFinishInterview={handleFinishInterview}
        />
      )}

      {currentStep === 'results' && (
        <InterviewResults
          results={results}
          onStartNewInterview={handleStartNewInterview}
        />
      )}
    </div>
  );
};

export default MockInterview;
