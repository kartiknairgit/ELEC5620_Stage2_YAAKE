# YAAKE Frontend

React-based frontend for the YAAKE authentication system.

## Features

- User registration with email/password (FR1)
- Email validation and strong password requirements
- User login with JWT authentication
- OAuth placeholder buttons (Google, GitHub) - FR2
- Email verification flow (FR3)
- Duplicate email handling (FR4)
- Responsive design with TailwindCSS-inspired styling
- Dashboard with user profile information

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup Instructions

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the frontend directory (optional, defaults provided):
```
REACT_APP_API_URL=http://localhost:5001/api
```

## Running the Application

### Development Mode

Start the development server on port 3000:

```bash
npm start
```

The application will automatically open in your browser at `http://localhost:3000`

### Production Build

Create an optimized production build:

```bash
npm run build
```

The build files will be generated in the `build/` directory.

## Project Structure

```
frontend/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── AuthLayout.js      # Layout wrapper for auth pages
│   │   │   ├── LoginForm.js       # Login form component
│   │   │   ├── SignupForm.js      # Signup form component
│   │   │   └── OAuthButtons.js    # OAuth placeholder buttons
│   │   └── Dashboard.js           # Protected dashboard component
│   ├── services/
│   │   └── api.js                 # API service with axios
│   ├── App.js                     # Main app component with routing
│   ├── App.css                    # Global styles
│   └── index.js                   # App entry point
├── package.json
└── README.md
```

## Available Routes

- `/` - Redirects to login
- `/login` - User login page
- `/signup` - User registration page
- `/dashboard` - Protected dashboard (requires authentication)

## Authentication Flow

1. **Registration**: User signs up with email and password
   - Password must be 8+ characters with uppercase, lowercase, number, and special character
   - Email verification link is sent (console output in development)

2. **Login**: User logs in with credentials
   - JWT token is stored in localStorage
   - User is redirected to dashboard

3. **Protected Routes**: Dashboard requires valid JWT token
   - Token is automatically sent with API requests
   - Invalid/expired tokens redirect to login

## API Integration

The frontend communicates with the backend API running on `http://localhost:5001/api`

API endpoints used:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify-email/:token` - Email verification

## Testing

Default super user credentials for testing:
- Email: `admin@yaake.com`
- Password: `Admin@123`

## Performance

- Response time: <2s (NFR requirement)
- Client-side form validation for better UX
- Optimized React components with proper state management

## Future Enhancements

- OAuth integration (Google, GitHub) - Currently placeholders
- HTTPS configuration for production
- Password reset functionality
- Remember me functionality
- Multi-factor authentication

## Support

For issues or questions, please contact the development team.
