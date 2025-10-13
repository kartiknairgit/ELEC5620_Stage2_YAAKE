import React from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-layout">
      {/* Animated Wave Background */}
      <div className="wave-container">
        <svg className="wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path className="wave-path-1" fill="#E8DCC4" fillOpacity="0.3" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <svg className="wave wave-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path className="wave-path-2" fill="#C9B29A" fillOpacity="0.2" d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,112C672,107,768,149,864,154.7C960,160,1056,128,1152,133.3C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <svg className="wave wave-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path className="wave-path-3" fill="#B39C7D" fillOpacity="0.15" d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,250.7C960,235,1056,181,1152,181.3C1248,181,1344,235,1392,261.3L1440,288L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-left">
          <div className="brand-content">
            <div className="logo-section">
              <h1 className="brand-logo">YAAKE</h1>
              <div className="logo-underline"></div>
            </div>
            <p className="brand-tagline">
              Your AI-Powered Recruitment Assistant
            </p>
            <p className="brand-description">
              Transform your hiring process with intelligent automation,
              real-time insights, and seamless candidate management.
            </p>
            <div className="feature-pills">
              <span className="pill">AI-Powered</span>
              <span className="pill">Fast & Secure</span>
              <span className="pill">Enterprise Ready</span>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="floating-element element-1"></div>
          <div className="floating-element element-2"></div>
          <div className="floating-element element-3"></div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-right">
          <div className="form-container">
            <h2 className="form-title">{title}</h2>
            {subtitle && <p className="form-subtitle">{subtitle}</p>}

            <div className="auth-content">
              {children}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .auth-layout {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #F5F0E8 0%, #E8DCC4 50%, #D4C5A9 100%);
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        /* Animated Wave Background */
        .wave-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
        }

        .wave {
          position: absolute;
          bottom: -10%;
          left: 0;
          width: 200%;
          height: 100%;
          animation: wave-animation 20s ease-in-out infinite;
        }

        .wave-2 {
          animation: wave-animation 25s ease-in-out infinite reverse;
        }

        .wave-3 {
          animation: wave-animation 30s ease-in-out infinite;
        }

        @keyframes wave-animation {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(-25%) translateY(-10px);
          }
        }

        .wave-path-1, .wave-path-2, .wave-path-3 {
          animation: wave-morph 15s ease-in-out infinite;
        }

        @keyframes wave-morph {
          0%, 100% {
            d: path("M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z");
          }
          50% {
            d: path("M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,154.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z");
          }
        }

        .auth-container {
          width: 100%;
          max-width: 1200px;
          height: 700px;
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          display: flex;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        /* Left Side - Branding */
        .auth-left {
          flex: 1;
          background: linear-gradient(135deg, #B39C7D 0%, #9B8A6F 100%);
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .brand-content {
          position: relative;
          z-index: 2;
        }

        .logo-section {
          margin-bottom: 24px;
        }

        .brand-logo {
          font-size: 56px;
          font-weight: 900;
          color: #FFFFFF;
          margin: 0;
          letter-spacing: 4px;
          text-shadow: 2px 4px 8px rgba(0, 0, 0, 0.1);
        }

        .logo-underline {
          width: 80px;
          height: 4px;
          background: linear-gradient(90deg, #F5F0E8, transparent);
          margin-top: 12px;
          border-radius: 2px;
        }

        .brand-tagline {
          font-size: 22px;
          font-weight: 600;
          color: #F5F0E8;
          margin: 0 0 16px 0;
          line-height: 1.4;
        }

        .brand-description {
          font-size: 16px;
          color: rgba(245, 240, 232, 0.85);
          line-height: 1.7;
          margin: 0 0 32px 0;
          max-width: 400px;
        }

        .feature-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pill {
          padding: 8px 20px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .pill:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        /* Floating Elements */
        .floating-element {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
        }

        .element-1 {
          width: 300px;
          height: 300px;
          top: -100px;
          right: -100px;
          animation: float 20s ease-in-out infinite;
        }

        .element-2 {
          width: 200px;
          height: 200px;
          bottom: -50px;
          left: -50px;
          animation: float 25s ease-in-out infinite reverse;
        }

        .element-3 {
          width: 150px;
          height: 150px;
          top: 50%;
          right: 10%;
          animation: float 30s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(240deg);
          }
        }

        /* Right Side - Form */
        .auth-right {
          flex: 1;
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #FFFFFF;
          overflow-y: auto;
        }

        .form-container {
          max-width: 420px;
          margin: 0 auto;
          width: 100%;
        }

        .form-title {
          font-size: 32px;
          font-weight: 700;
          color: #3E362E;
          margin: 0 0 8px 0;
        }

        .form-subtitle {
          font-size: 15px;
          color: #8B7E74;
          margin: 0 0 32px 0;
        }

        .auth-content {
          margin-top: 32px;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .auth-container {
            height: auto;
            min-height: 600px;
          }

          .auth-left {
            padding: 40px;
          }

          .auth-right {
            padding: 40px;
          }

          .brand-logo {
            font-size: 48px;
          }

          .brand-tagline {
            font-size: 20px;
          }
        }

        @media (max-width: 768px) {
          .auth-container {
            flex-direction: column;
            height: auto;
          }

          .auth-left {
            padding: 40px 24px;
            min-height: 300px;
          }

          .auth-right {
            padding: 40px 24px;
          }

          .brand-logo {
            font-size: 40px;
          }

          .brand-tagline {
            font-size: 18px;
          }

          .brand-description {
            font-size: 14px;
          }

          .form-title {
            font-size: 28px;
          }

          .element-1, .element-2, .element-3 {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .auth-layout {
            padding: 10px;
          }

          .auth-container {
            border-radius: 16px;
          }

          .brand-logo {
            font-size: 36px;
          }

          .form-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
