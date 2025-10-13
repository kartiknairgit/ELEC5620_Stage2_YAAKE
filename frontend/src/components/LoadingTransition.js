import React, { useEffect, useState } from 'react';

const LoadingTransition = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 300);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="loading-transition">
      <div className="loading-content">
        <div className="logo-animation">
          <h1 className="logo-text">YAAKE</h1>
          <div className="logo-underline"></div>
        </div>

        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="loading-text">Setting up your workspace...</p>
        </div>

        <div className="loading-icons">
          <div className="icon-dot"></div>
          <div className="icon-dot"></div>
          <div className="icon-dot"></div>
        </div>
      </div>

      <style>{`
        .loading-transition {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .loading-content {
          text-align: center;
          max-width: 500px;
          width: 90%;
        }

        .logo-animation {
          margin-bottom: 60px;
          animation: scaleIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .logo-text {
          font-size: 64px;
          font-weight: 900;
          color: white;
          letter-spacing: 8px;
          margin: 0;
          text-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .logo-underline {
          width: 0;
          height: 4px;
          background: white;
          margin: 20px auto 0;
          border-radius: 2px;
          animation: expandWidth 1s ease forwards;
          animation-delay: 0.3s;
        }

        @keyframes expandWidth {
          to {
            width: 200px;
          }
        }

        .progress-container {
          margin-bottom: 40px;
          animation: slideUp 0.6s ease;
          animation-delay: 0.3s;
          animation-fill-mode: both;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffffff 0%, #f0f0f0 100%);
          border-radius: 10px;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .loading-text {
          color: white;
          font-size: 16px;
          font-weight: 500;
          margin: 0;
          opacity: 0.9;
          letter-spacing: 0.5px;
        }

        .loading-icons {
          display: flex;
          justify-content: center;
          gap: 12px;
          animation: slideUp 0.6s ease;
          animation-delay: 0.6s;
          animation-fill-mode: both;
        }

        .icon-dot {
          width: 12px;
          height: 12px;
          background-color: white;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .icon-dot:nth-child(1) {
          animation-delay: 0s;
        }

        .icon-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .icon-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.8) translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2) translateY(-15px);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .logo-text {
            font-size: 48px;
            letter-spacing: 6px;
          }

          .logo-underline {
            animation: expandWidth 1s ease forwards;
          }

          @keyframes expandWidth {
            to {
              width: 150px;
            }
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingTransition;
