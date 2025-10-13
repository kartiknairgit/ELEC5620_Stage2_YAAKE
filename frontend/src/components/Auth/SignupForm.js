import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import AuthLayout from './AuthLayout';
import OAuthButtons from './OAuthButtons';

const SignupForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

    // Password validation (FR1: Password requirements)
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character (@$!%*?&)';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register(
        formData.email,
        formData.password,
        formData.confirmPassword
      );

      if (response.success) {
        // Store token and user data
        localStorage.setItem('yaake_token', response.data.token);
        localStorage.setItem('yaake_user', JSON.stringify(response.data.user));

        // Show success message
        setSuccessMessage(
          'Account created successfully! Please check your email to verify your account.'
        );

        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch (error) {
      console.error('Registration error:', error);

      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.path || err.param] = err.msg;
        });
        setErrors(backendErrors);
      }

      setApiError(
        error.response?.data?.message ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up for a new YAAKE account"
    >
      <form onSubmit={handleSubmit} className="signup-form">
        {apiError && (
          <div className="error-banner">
            {apiError}
          </div>
        )}

        {successMessage && (
          <div className="success-banner">
            {successMessage}
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
          <span className="helper-text">
            Must be 8+ characters with uppercase, lowercase, number, and special character
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="••••••••"
            disabled={loading}
          />
          {errors.confirmPassword && (
            <span className="error-text">{errors.confirmPassword}</span>
          )}
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="form-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="link">
              Sign in
            </Link>
          </p>
        </div>

        <OAuthButtons />
      </form>

      <style>{`
        .signup-form {
          width: 100%;
        }

        .error-banner {
          padding: 14px 18px;
          background-color: #FEE2E2;
          border-left: 4px solid #DC2626;
          border-radius: 10px;
          color: #991B1B;
          font-size: 14px;
          margin-bottom: 24px;
          animation: slideIn 0.3s ease;
        }

        .success-banner {
          padding: 14px 18px;
          background-color: #D1FAE5;
          border-left: 4px solid #10B981;
          border-radius: 10px;
          color: #065F46;
          font-size: 14px;
          margin-bottom: 24px;
          animation: slideIn 0.3s ease;
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

        .helper-text {
          display: block;
          margin-top: 8px;
          font-size: 12px;
          color: #8B7E74;
          font-style: italic;
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

export default SignupForm;
