import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Check if token exists
        const token = localStorage.getItem('yaake_token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch user data
        const response = await authAPI.getMe();
        if (response.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('yaake_token');
      localStorage.removeItem('yaake_user');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-logo">YAAKE</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome to YAAKE Dashboard!</h2>
          <p>You have successfully logged in.</p>

          {user && (
            <div className="user-info">
              <h3>Account Information</h3>
              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">{user.email}</span>
              </div>
              <div className="info-item">
                <span className="label">Role:</span>
                <span className={`value badge ${user.role}`}>{user.role}</span>
              </div>
              <div className="info-item">
                <span className="label">Verification Status:</span>
                <span className={`value badge ${user.isVerified ? 'verified' : 'unverified'}`}>
                  {user.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Member Since:</span>
                <span className="value">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {user && !user.isVerified && (
            <div className="verification-notice">
              <p>
                Your email is not verified yet. Please check your email for the verification link.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          background-color: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .dashboard-logo {
          font-size: 28px;
          font-weight: 800;
          color: white;
          letter-spacing: 2px;
          margin: 0;
        }

        .logout-button {
          padding: 10px 24px;
          background-color: white;
          color: #667eea;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .dashboard-content {
          padding: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .welcome-card {
          background-color: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          padding: 40px;
          max-width: 600px;
          width: 100%;
        }

        .welcome-card h2 {
          font-size: 28px;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .welcome-card > p {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 32px;
        }

        .user-info {
          background-color: #f9fafb;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .user-info h3 {
          font-size: 18px;
          color: #374151;
          margin-bottom: 20px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .label {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }

        .value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 600;
        }

        .badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge.admin {
          background-color: #fef3c7;
          color: #92400e;
        }

        .badge.user {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .badge.verified {
          background-color: #d1fae5;
          color: #065f46;
        }

        .badge.unverified {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .verification-notice {
          background-color: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 16px;
          margin-top: 20px;
        }

        .verification-notice p {
          font-size: 14px;
          color: #92400e;
          margin: 0;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-size: 24px;
          color: white;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 16px 20px;
          }

          .dashboard-logo {
            font-size: 24px;
          }

          .dashboard-content {
            padding: 20px;
          }

          .welcome-card {
            padding: 24px;
          }

          .welcome-card h2 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
