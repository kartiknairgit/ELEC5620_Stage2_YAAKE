# ELEC5620_Stage2_YAAKE

AI recruitment platform with multi-agent architecture. Real-time resume ATS scoring, mock interviews, cover letter generation, job matching. Serves applicants, recruiters & training teams. Built with Node.js, Python, React, GPT-4/Claude. Complete UML documentation. Enterprise-grade: GDPR compliant, scalable AWS deployment, architecture.

---

## Authentication System (Stage 2)

Complete login/signup system with React frontend and Express backend using MVC architecture.

### Branch: `feature/login-signup`

### Features Implemented

#### Functional Requirements
- **FR1**: Email/Password Registration
  - Strong password validation (8+ chars, uppercase, lowercase, number, special character)
  - Email format validation
  - Secure password hashing with bcrypt

- **FR2**: OAuth Integration Placeholders
  - Google OAuth endpoint placeholders
  - GitHub OAuth endpoint placeholders
  - Ready for future implementation

- **FR3**: Email Verification
  - User status tracking (pending/verified)
  - Verification token generation
  - SMTP placeholder (console logging in development)
  - Resend verification functionality

- **FR4**: Duplicate Email Handling
  - Prevents registration with existing emails
  - Clear error messaging

#### Non-Functional Requirements
- **Performance**: Response time <2s
- **Security**: JWT authentication, bcrypt hashing, Helmet, CORS
- **Scalability**: Rate limiting (100 req/15min per IP)
- **HTTPS Ready**: SSL/TLS support for production

### Project Structure

```
ELEC5620_Stage2_YAAKE/
├── frontend/                    # React frontend (port 3000)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.js        # Login component
│   │   │   │   ├── SignupForm.js       # Registration component
│   │   │   │   ├── AuthLayout.js       # Auth page layout
│   │   │   │   └── OAuthButtons.js     # OAuth placeholders
│   │   │   └── Dashboard.js            # Protected dashboard
│   │   ├── services/
│   │   │   └── api.js                  # API service with axios
│   │   ├── App.js                      # Main app with routing
│   │   └── index.js                    # Entry point
│   ├── package.json
│   └── README.md
│
├── backend/                     # Express backend (port 5001)
│   ├── controllers/
│   │   └── authController.js           # Auth logic (FR1-FR4)
│   ├── models/
│   │   └── userModel.js                # User model + super user
│   ├── routes/
│   │   └── authRoutes.js               # API routes + validation
│   ├── middleware/
│   │   └── authMiddleware.js           # JWT middleware
│   ├── utils/
│   │   └── emailService.js             # Email service (SMTP placeholder)
│   ├── .env                            # Environment config
│   ├── server.js                       # Express server
│   ├── package.json
│   └── README.md
│
└── README.md                    # This file
```

### Quick Start

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (optional, defaults provided):
```bash
cp .env.example .env
# Edit .env if needed
```

4. Start the backend server (HTTP mode):
```bash
npm run dev
```

Server runs on `http://localhost:5001`

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend:
```bash
npm start
```

Application runs on `http://localhost:3000`

### Default Super User

For testing, use the hardcoded admin account:

- **Email**: `admin@yaake.com`
- **Password**: `Admin@123`
- **Role**: `admin`
- **Verified**: `true`

### API Endpoints

#### Public
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email

#### OAuth Placeholders (FR2)
- `GET /api/auth/google` - Google OAuth (501)
- `GET /api/auth/google/callback` - Google callback (501)
- `GET /api/auth/github` - GitHub OAuth (501)
- `GET /api/auth/github/callback` - GitHub callback (501)

#### Protected (requires JWT)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Technology Stack

#### Frontend
- React 18
- React Router DOM
- Axios
- CSS-in-JS styling (TailwindCSS-inspired)

#### Backend
- Express.js
- bcrypt (password hashing)
- jsonwebtoken (JWT)
- express-validator (input validation)
- Helmet (security headers)
- CORS
- Rate limiting
- dotenv

### Data Storage

Currently using **in-memory storage** with hardcoded super user. MongoDB integration will be handled by teammate in future iterations.

### Security Features

- JWT-based authentication
- Password hashing with bcrypt (salt rounds: 10)
- Input validation and sanitization
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Security headers via Helmet
- HTTPS support (configurable)

### Email Verification Flow

1. User registers → Account created with `isVerified: false`
2. Verification token generated (32-byte hex string)
3. Email logged to console (SMTP placeholder)
4. User clicks link → Account verified → Welcome email sent

### Development Notes

- Backend uses MVC architecture (Model-View-Controller)
- Frontend uses component-based architecture
- All passwords must meet complexity requirements
- JWT tokens expire after 24 hours (configurable)
- HTTPS can be enabled with SSL certificates

### Future Enhancements

- MongoDB integration (teammate task)
- Real SMTP email service
- OAuth implementation (Google, GitHub)
- Password reset functionality
- Refresh token mechanism
- Multi-factor authentication

### Team Notes

- Branch: `feature/login-signup`
- MongoDB integration: Pending (teammate's task)
- SMTP integration: Placeholder implemented (ready for real service)
- OAuth: Endpoints ready (implementation pending)

### Support

For detailed setup and API documentation:
- Frontend: See `frontend/README.md`
- Backend: See `backend/README.md`
