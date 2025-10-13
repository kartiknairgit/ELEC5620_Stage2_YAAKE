import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import AuthLayout from './AuthLayout';
import OAuthButtons from './OAuthButtons';
import LoadingTransition from '../LoadingTransition';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showLoadingTransition, setShowLoadingTransition] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);

      if (response.success) {
        // Store token and user data
        localStorage.setItem('yaake_token', response.data.token);
        localStorage.setItem('yaake_user', JSON.stringify(response.data.user));

        // Show loading transition before navigating
        setShowLoadingTransition(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      setApiError(
        error.response?.data?.message ||
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTransitionComplete = () => {
    navigate('/landing');
  };

  if (showLoadingTransition) {
    return <LoadingTransition onComplete={handleTransitionComplete} />;
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your YAAKE account"
    >
      <form onSubmit={handleSubmit} className="login-form">
        {apiError && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <div className="error-content">
              <strong>Authentication Failed</strong>
              <p>{apiError}</p>
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="you@example.com"
            disabled={loading}
          />
          {errors.email && (
            <span className="error-text">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="••••••••"
            disabled={loading}
          />
          {errors.password && (
            <span className="error-text">{errors.password}</span>
          )}
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="form-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="link">
              Sign up
            </Link>
          </p>
        </div>

        <OAuthButtons />
      </form>

      <style>{`
        .login-form {
          width: 100%;
        }

        .error-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 18px;
          background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
          border: 2px solid #DC2626;
          border-radius: 12px;
          color: #991B1B;
          margin-bottom: 24px;
          animation: shake 0.5s ease, slideIn 0.3s ease;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .error-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .error-content {
          flex: 1;
        }

        .error-content strong {
          display: block;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #7F1D1D;
        }

        .error-content p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #3E362E;
          margin-bottom: 10px;
          letter-spacing: 0.3px;
        }

        .form-input {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid #E5DDD1;
          border-radius: 12px;
          font-size: 15px;
          color: #3E362E;
          background-color: #FAFAF8;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #B39C7D;
          background-color: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(179, 156, 125, 0.1);
          transform: translateY(-1px);
        }

        .form-input::placeholder {
          color: #ADA399;
        }

        .form-input.error {
          border-color: #DC2626;
          background-color: #FEF2F2;
        }

        .form-input:disabled {
          background-color: #F5F0E8;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .error-text {
          display: block;
          margin-top: 8px;
          font-size: 13px;
          color: #DC2626;
          font-weight: 500;
        }

        .submit-button {
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, #B39C7D 0%, #9B8A6F 100%);
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 12px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 4px 12px rgba(179, 156, 125, 0.3);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(179, 156, 125, 0.4);
          background: linear-gradient(135deg, #9B8A6F 0%, #8A7A5F 100%);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .form-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #E5DDD1;
        }

        .form-footer p {
          font-size: 14px;
          color: #6B6358;
          margin: 0;
        }

        .link {
          color: #B39C7D;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .link:hover {
          color: #9B8A6F;
          text-decoration: underline;
        }
      `}</style>
    </AuthLayout>
  );
};

export default LoginForm;
