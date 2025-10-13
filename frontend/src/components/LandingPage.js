import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [loading, setLoading] = useState(true);

  const features = [
    {
      icon: '🚀',
      title: 'Lightning Fast',
      description: 'Experience blazing fast performance with optimized workflows'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security'
    },
    {
      icon: '🎨',
      title: 'Beautiful Design',
      description: 'Crafted with attention to detail and user experience'
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'Track your progress with powerful insights and metrics'
    }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('yaake_token');
        if (!token) {
          navigate('/login');
          return;
        }

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [features.length]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('yaake_token');
      localStorage.removeItem('yaake_user');
      navigate('/login');
    }
  };

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="landing-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="logo-section">
            <h1 className="nav-logo">YAAKE</h1>
            <span className="logo-tagline">Your Success, Simplified</span>
          </div>
          <div className="nav-actions">
            {user && (
              <div className="user-badge">
                <span className="user-avatar">{user.email.charAt(0).toUpperCase()}</span>
                <span className="user-email">{user.email}</span>
              </div>
            )}
            <button onClick={handleLogout} className="nav-button logout">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Welcome to the Future of
              <span className="gradient-text"> Productivity</span>
            </h1>
            <p className="hero-subtitle">
              Streamline your workflow, boost your productivity, and achieve more with YAAKE.
              The all-in-one platform designed for modern teams.
            </p>
            <div className="hero-buttons">
              <button onClick={handleGetStarted} className="btn-primary">
                Get Started
                <span className="btn-arrow">→</span>
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                View Dashboard
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card card-1">
              <div className="card-icon">📈</div>
              <div className="card-text">Analytics</div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">⚡</div>
              <div className="card-text">Fast</div>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">🎯</div>
              <div className="card-text">Goals</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose YAAKE?</h2>
          <p className="section-subtitle">Everything you need to succeed, all in one place</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-card ${index === currentFeature ? 'active' : ''}`}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Uptime</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Support</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">150+</div>
            <div className="stat-label">Countries</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-subtitle">Join thousands of users already using YAAKE</p>
          <button onClick={handleGetStarted} className="cta-button">
            Launch Dashboard
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3 className="footer-logo">YAAKE</h3>
            <p className="footer-tagline">Empowering productivity worldwide</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#updates">Updates</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#careers">Careers</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <a href="#docs">Documentation</a>
              <a href="#support">Support</a>
              <a href="#blog">Blog</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 YAAKE. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .landing-page {
          min-height: 100vh;
          background: linear-gradient(to bottom, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%);
          color: white;
          overflow-x: hidden;
        }

        .landing-loading {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Navigation */
        .landing-nav {
          position: sticky;
          top: 0;
          background: rgba(15, 15, 35, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 20px 0;
          z-index: 1000;
          animation: slideDown 0.6s ease;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .nav-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-logo {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 3px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo-tagline {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
          letter-spacing: 1px;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .user-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .user-email {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .nav-button {
          padding: 10px 24px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-button.logout {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .nav-button.logout:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        /* Hero Section */
        .hero-section {
          padding: 120px 40px;
          max-width: 1200px;
          margin: 0 auto;
          animation: fadeInUp 0.8s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .hero-title {
          font-size: 56px;
          font-weight: 900;
          line-height: 1.2;
          margin-bottom: 24px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 18px;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 40px;
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-primary, .btn-secondary, .cta-button {
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary, .cta-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:hover, .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-3px);
        }

        .btn-arrow {
          transition: transform 0.3s ease;
        }

        .btn-primary:hover .btn-arrow,
        .cta-button:hover .btn-arrow {
          transform: translateX(4px);
        }

        /* Hero Visual */
        .hero-visual {
          position: relative;
          height: 400px;
        }

        .floating-card {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .card-1 {
          top: 20%;
          left: 10%;
          animation: float 3s ease-in-out infinite;
        }

        .card-2 {
          top: 50%;
          right: 10%;
          animation: float 3s ease-in-out infinite;
          animation-delay: 1s;
        }

        .card-3 {
          bottom: 10%;
          left: 30%;
          animation: float 3s ease-in-out infinite;
          animation-delay: 2s;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .card-icon {
          font-size: 32px;
        }

        .card-text {
          font-size: 18px;
          font-weight: 700;
        }

        /* Features Section */
        .features-section {
          padding: 100px 40px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .section-title {
          font-size: 48px;
          font-weight: 900;
          margin-bottom: 16px;
        }

        .section-subtitle {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.6);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 40px;
          transition: all 0.4s ease;
          cursor: pointer;
        }

        .feature-card.active {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
          border-color: rgba(102, 126, 234, 0.5);
          transform: translateY(-10px) scale(1.05);
          box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
        }

        .feature-card:hover {
          transform: translateY(-10px);
          border-color: rgba(102, 126, 234, 0.5);
        }

        .feature-icon {
          font-size: 48px;
          margin-bottom: 24px;
        }

        .feature-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .feature-description {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        /* Stats Section */
        .stats-section {
          padding: 80px 40px;
          background: rgba(255, 255, 255, 0.03);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stats-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 40px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 48px;
          font-weight: 900;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        /* CTA Section */
        .cta-section {
          padding: 120px 40px;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .cta-title {
          font-size: 48px;
          font-weight: 900;
          margin-bottom: 16px;
        }

        .cta-subtitle {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 40px;
        }

        .cta-button {
          font-size: 18px;
          padding: 20px 40px;
        }

        /* Footer */
        .landing-footer {
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 60px 40px 30px;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 3fr;
          gap: 60px;
          margin-bottom: 40px;
        }

        .footer-logo {
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-tagline {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }

        .footer-column h4 {
          font-size: 16px;
          margin-bottom: 16px;
          color: white;
        }

        .footer-column a {
          display: block;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          margin-bottom: 12px;
          transition: color 0.3s ease;
        }

        .footer-column a:hover {
          color: #667eea;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 30px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-bottom p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .hero-content {
            grid-template-columns: 1fr;
            gap: 60px;
          }

          .hero-visual {
            height: 300px;
          }

          .hero-title {
            font-size: 42px;
          }
        }

        @media (max-width: 768px) {
          .nav-content {
            padding: 0 20px;
          }

          .user-email {
            display: none;
          }

          .hero-section {
            padding: 60px 20px;
          }

          .hero-title {
            font-size: 36px;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .hero-buttons {
            flex-direction: column;
          }

          .btn-primary, .btn-secondary {
            width: 100%;
            justify-content: center;
          }

          .section-title {
            font-size: 36px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .footer-links {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .cta-title {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
