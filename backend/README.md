# YAAKE Backend

Express.js backend for the YAAKE authentication system with MVC architecture.

## Features

- **FR1**: Email/Password registration with validation
  - Strong password requirements (8+ chars, uppercase, lowercase, number, special character)
  - Email format validation

- **FR2**: OAuth integration placeholders (Google, GitHub)
  - Endpoints ready for future OAuth implementation

- **FR3**: Email verification system
  - Pending/verified status tracking
  - SMTP placeholder (console logging for development)
  - Verification token generation

- **FR4**: Duplicate email handling
  - Prevents registration with existing emails

- **NFR**: Response time <2s with rate limiting
  - Request timeout: 2 minutes
  - Rate limit: 100 requests per 15 minutes per IP

- **Security**:
  - JWT authentication
  - bcrypt password hashing
  - Helmet for security headers
  - CORS configuration
  - HTTPS ready

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup Instructions

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Configure environment variables:
Copy `.env.example` to `.env` and update values:
```bash
cp .env.example .env
```

Key environment variables:
- `PORT=5001` - Server port
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `JWT_EXPIRE=24h` - Token expiration time
- `FRONTEND_URL=http://localhost:3000` - Frontend URL for CORS
- `HTTPS_ENABLED=false` - Enable HTTPS (set to true for production)

## Running the Application

### Development Mode

Start the server with auto-reload on port 5001:

```bash
npm run dev
```

Server will be available at `http://localhost:5001`

### Production Mode

Start the server without auto-reload:

```bash
npm start
```

### HTTPS Configuration

To enable HTTPS:

1. Generate self-signed certificates (development only):
```bash
mkdir -p config/ssl
openssl req -x509 -newkey rsa:4096 -keyout config/ssl/key.pem -out config/ssl/cert.pem -days 365 -nodes
```

2. Update `.env`:
```
HTTPS_ENABLED=true
```

3. Restart the server - it will run on `https://localhost:5001`

## Project Structure

```
backend/
├── controllers/
│   └── authController.js      # Authentication logic (FR1-FR4)
├── models/
│   └── userModel.js            # User model with hardcoded super user
├── routes/
│   └── authRoutes.js           # API routes with validation
├── middleware/
│   └── authMiddleware.js       # JWT authentication middleware
├── utils/
│   └── emailService.js         # Email service (SMTP placeholder)
├── config/
│   └── ssl/                    # SSL certificates (if HTTPS enabled)
├── .env                        # Environment variables
├── .env.example               # Environment template
├── server.js                  # Express server entry point
├── package.json
└── README.md
```

## API Endpoints

### Public Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/auth/register` - Register new user (FR1)
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email/:token` - Verify email (FR3)
- `POST /api/auth/resend-verification` - Resend verification email

### OAuth Placeholders (FR2)

- `GET /api/auth/google` - Google OAuth (placeholder)
- `GET /api/auth/google/callback` - Google OAuth callback (placeholder)
- `GET /api/auth/github` - GitHub OAuth (placeholder)
- `GET /api/auth/github/callback` - GitHub OAuth callback (placeholder)

### Protected Endpoints

Require `Authorization: Bearer <token>` header:

- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

## Hardcoded Super User

The system initializes with a hardcoded admin account:

- **Email**: `admin@yaake.com`
- **Password**: `Admin@123`
- **Role**: `admin`
- **Verified**: `true`

This user is created automatically on server start and can be used for testing.

## Data Storage

Currently using **in-memory storage** with hardcoded super user. MongoDB integration will be handled by your teammate in future iterations.

User data structure:
```javascript
{
  id: Number,
  email: String,
  password: String (hashed),
  isVerified: Boolean,
  role: String ('user' | 'admin'),
  createdAt: Date,
  updatedAt: Date,
  verificationToken: String
}
```

## Email Verification Flow (FR3)

1. User registers → Account created with `isVerified: false`
2. Verification token generated and logged to console
3. Email would be sent via SMTP (currently placeholder)
4. User clicks link with token → Account verified

Example console output:
```
-------------------------------------------
VERIFICATION EMAIL (SMTP Placeholder)
-------------------------------------------
To: user@example.com
Subject: Verify Your YAAKE Account
Verification Token: abc123...
Verification Link: http://localhost:3000/verify-email?token=abc123...
-------------------------------------------
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds of 10
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: express-validator for request validation
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers
- **CORS**: Configurable allowed origins
- **HTTPS Ready**: SSL/TLS support

## Validation Rules

### Registration (FR1)
- Email: Must be valid email format
- Password:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)
- Confirm Password: Must match password

### Login
- Email: Must be valid email format
- Password: Required

## Error Handling

The API returns consistent error responses:

```javascript
{
  success: false,
  message: "Error description",
  errors: [] // Validation errors if applicable
}
```

## Performance (NFR)

- Request timeout: 2 minutes (120,000ms)
- Response time target: <2 seconds
- Rate limiting: 100 requests / 15 minutes per IP
- CORS enabled for frontend communication

## Testing

Use tools like Postman, curl, or the frontend application.

Example curl commands:

```bash
# Register new user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123","confirmPassword":"Test@123"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yaake.com","password":"Admin@123"}'

# Get current user (requires token)
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Future Enhancements

- MongoDB integration (handled by teammate)
- Real SMTP email service integration
- OAuth implementation (Google, GitHub)
- Password reset functionality
- Refresh token mechanism
- Account lockout after failed attempts
- Email templates with HTML

## Support

For issues or questions, please contact the development team.
