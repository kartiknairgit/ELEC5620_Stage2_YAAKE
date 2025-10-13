import React from 'react';

const OAuthButtons = () => {
  const handleGoogleOAuth = () => {
    alert('Google OAuth is not yet implemented. This is a placeholder for future development.');
    // Future implementation:
    // window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleGithubOAuth = () => {
    alert('GitHub OAuth is not yet implemented. This is a placeholder for future development.');
    // Future implementation:
    // window.location.href = 'http://localhost:5000/api/auth/github';
  };

  return (
    <div className="oauth-buttons">
      <div className="oauth-divider">
        <span>OR</span>
      </div>

      <button
        type="button"
        onClick={handleGoogleOAuth}
        className="oauth-button google-button"
        disabled
        title="Coming soon"
      >
        <svg className="oauth-icon" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google (Coming Soon)
      </button>

      <button
        type="button"
        onClick={handleGithubOAuth}
        className="oauth-button github-button"
        disabled
        title="Coming soon"
      >
        <svg className="oauth-icon" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
          />
        </svg>
        Continue with GitHub (Coming Soon)
      </button>

      <style>{`
        .oauth-buttons {
          margin-top: 32px;
        }

        .oauth-divider {
          position: relative;
          text-align: center;
          margin: 32px 0;
        }

        .oauth-divider::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
          background-color: #E5DDD1;
        }

        .oauth-divider span {
          position: relative;
          display: inline-block;
          padding: 0 20px;
          background-color: white;
          color: #8B7E74;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .oauth-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 13px 18px;
          margin-bottom: 14px;
          border: 2px solid #E5DDD1;
          border-radius: 12px;
          background-color: #FAFAF8;
          color: #3E362E;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .oauth-button:hover:not(:disabled) {
          background-color: #FFFFFF;
          border-color: #B39C7D;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(179, 156, 125, 0.15);
        }

        .oauth-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .oauth-icon {
          width: 20px;
          height: 20px;
        }

        .google-button {
          color: #3E362E;
        }

        .github-button {
          background: linear-gradient(135deg, #3E362E 0%, #2A2520 100%);
          color: white;
          border-color: #3E362E;
        }

        .github-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #2A2520 0%, #1A1714 100%);
          border-color: #2A2520;
        }
      `}</style>
    </div>
  );
};

export default OAuthButtons;
