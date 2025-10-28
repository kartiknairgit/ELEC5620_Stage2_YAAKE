# Interview Scheduler Setup Guide

This guide will help you set up the Interview Scheduler feature on a fresh local environment.

## Prerequisites

Before starting, ensure you have:
- Node.js (v14 or higher) installed
- MongoDB running locally on `mongodb://localhost:27017/yaake`
- npm or yarn package manager

## Setup Steps

### 1. Pull the Latest Code

```bash
git pull origin fix/debugging_use_cases
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

Ensure your `backend/.env` file has the correct MongoDB connection string:

```env
MONGO_URI=mongodb://localhost:27017/yaake
PORT=5001
```

### 4. Seed Test Users for Scheduler

This is a **CRITICAL** step - the scheduler won't work without test users!

```bash
cd backend
npm run seed
```

This will create the following test accounts:

**Recruiters:**
- Email: `recruiter1@yaake.com` | Password: `Recruiter@123`
- Email: `recruiter2@yaake.com` | Password: `Recruiter@123`

**Applicants:**
- Email: `applicant1@yaake.com` | Password: `Applicant@123`
- Email: `applicant2@yaake.com` | Password: `Applicant@123`
- Email: `applicant3@yaake.com` | Password: `Applicant@123`

> **Note:** If these users already exist in your database, the script will skip them and not create duplicates.

### 5. Start the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Backend should start on `http://localhost:5001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Frontend should start on `http://localhost:3000`

## Testing the Scheduler Feature

### As a Recruiter:

1. Navigate to `http://localhost:3000`
2. Login with: `recruiter1@yaake.com` / `Recruiter@123`
3. Go to the **Interview Scheduler** page from the dashboard
4. Click **"Schedule Interview"** button
5. Fill in the interview details:
   - Interview title (required)
   - Description, location, meeting link
   - Select one or more applicants
   - Choose date and select multiple time slots
6. Click **"Create Interview"**

### As an Applicant:

1. Logout from recruiter account
2. Login with: `applicant1@yaake.com` / `Applicant@123`
3. Go to the **Interview Scheduler** page
4. You should see pending interview invitations
5. View the available time slots
6. Click on a time slot to **accept** the interview
7. Or click **"Reject Interview"** to decline

## Verification Checklist

- [ ] MongoDB is running
- [ ] Test users are seeded (`npm run seed` completed successfully)
- [ ] Backend is running on port 5001
- [ ] Frontend is running on port 3000
- [ ] Can login as recruiter
- [ ] Can see applicants list when creating interview
- [ ] Can create interview with multiple time slots
- [ ] Can login as applicant
- [ ] Applicant can see pending interviews
- [ ] Applicant can accept/reject interviews
- [ ] Interview status changes to "confirmed" after acceptance

## Troubleshooting

### "No applicants found" when creating interview
- Make sure you ran `npm run seed` in the backend directory
- Check that MongoDB is running
- Verify users were created by checking the database or re-running the seed script

### Cannot create interview
- Ensure you're logged in as a recruiter (not an applicant)
- Check that at least one applicant is selected
- Ensure at least one time slot is selected

### Applicant can't see interviews
- Make sure the applicant's email matches one of the applicants added to the interview
- Check that you're logged in as an applicant account

## API Endpoints

For debugging, you can test these endpoints directly:

- `POST /api/auth/login` - Login
- `GET /api/schedule/applicants/list` - Get all applicants (recruiter only)
- `POST /api/schedule` - Create interview (recruiter only)
- `GET /api/schedule` - Get my interviews (role-based filtering)
- `GET /api/schedule/:id` - Get specific interview
- `POST /api/schedule/:id/respond` - Respond to interview (applicant only)
- `PATCH /api/schedule/:id` - Update interview (recruiter only)
- `DELETE /api/schedule/:id` - Cancel interview (recruiter only)

## Database Schema

The scheduler uses the following MongoDB collections:
- `users` - Stores user accounts (recruiters and applicants)
- `interviewschedules` - Stores interview scheduling data

## Support

If you encounter any issues, check:
1. MongoDB connection is working
2. All dependencies are installed
3. Environment variables are set correctly
4. Test users are seeded properly
5. Both backend and frontend servers are running
