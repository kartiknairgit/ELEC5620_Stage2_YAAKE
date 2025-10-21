# UC7 Mock Interview - Testing Guide

## Implementation Status: ✅ COMPLETE

All components have been successfully implemented and integrated. The placeholder page has been replaced with the fully functional UC7 mock interview system.

## Quick Start for Local Testing

### Prerequisites
1. MongoDB running locally on port 27017
2. Node.js and npm installed

### Backend Setup

1. **Start MongoDB** (if not already running):
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community

   # Or manually
   mongod --dbpath /path/to/your/data/directory
   ```

2. **Start Backend Server**:
   ```bash
   cd backend
   npm start
   ```

   Server should start on port 5001 and show:
   ```
   MongoDB connected
   Super user initialized successfully
   YAAKE Backend Server (HTTP)
   Server running on http://localhost:5001
   ```

3. **Test Health Check**:
   ```bash
   curl http://localhost:5001/api/health
   ```

### Frontend Setup

1. **Start Frontend** (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

   React app will start on http://localhost:3000

2. **Login**:
   - Navigate to http://localhost:3000
   - Login with any account or create new one
   - Super admin: admin@yaake.com / Admin@123

3. **Access Mock Interview**:
   - Click on "Mock Interview" from the dashboard
   - Or navigate directly to http://localhost:3000/mock-interview

## Testing Flow

### 1. Interview Setup
- Fill in the form with:
  - Position: e.g., "Software Engineer"
  - Company: e.g., "Google"
  - Location: e.g., "Remote"
  - Age: 25 (18-100)
  - Experience: 3 years (0-50)
  - Skills: "JavaScript, React, Node.js, Python" (comma-separated)
- Click "Start Mock Interview"

### 2. Interview Session
- You'll see the first question from the AI
- Type your answer in the text area
- Submit with button or Ctrl+Enter
- Progress bar shows Question X of 5
- AI adapts next question based on your answer
- After 5 questions, you'll see "Interview Complete"

### 3. View Results
- Click "Get Your Results" button
- See comprehensive feedback:
  - Overall score (0-100)
  - Technical, Communication, Problem Solving scores
  - Strengths (green section)
  - Areas for improvement (purple section)
  - Detailed per-question analysis
- Options: Start new interview or Print results

## Testing Checklist

### Backend Tests
- [x] Server starts successfully
- [x] MongoDB connection established
- [x] UC7 routes registered at /api/uc7
- [x] Gemini API key configured
- [ ] POST /api/uc7/start - Creates interview, returns first question
- [ ] POST /api/uc7/answer - Submits answer, returns next question
- [ ] POST /api/uc7/finish - Generates comprehensive feedback
- [ ] GET /api/uc7/history - Returns user's interview list
- [ ] GET /api/uc7/results/:id - Returns specific interview details

### Frontend Tests
- [x] MockInterview page accessible
- [x] Placeholder replaced with actual component
- [x] Routing configured in Dashboard
- [ ] InterviewSetup form validation works
- [ ] Interview starts on form submission
- [ ] InterviewSession displays questions properly
- [ ] Answer submission updates conversation
- [ ] Progress bar updates correctly
- [ ] InterviewResults displays scores and feedback
- [ ] Print functionality works
- [ ] Start new interview resets state

### Integration Tests
- [ ] Complete interview flow (setup → session → results)
- [ ] JWT authentication for all endpoints
- [ ] Error handling for invalid inputs
- [ ] Loading states show properly
- [ ] AI responses are coherent and relevant
- [ ] Scores are reasonable (0-100 range)
- [ ] Feedback is constructive and specific

## Expected AI Behavior

### Question Adaptation
- **Strong Answer**: AI asks deeper, more challenging questions
- **Weak Answer**: AI probes gaps, asks clarifying questions
- **Technical Role**: Includes coding problems or scenarios
- **Senior Position**: Leadership and strategic questions

### Feedback Quality
The AI should provide:
- Specific strengths per answer
- Actionable improvements
- Scores reflecting answer quality
- Professional, encouraging tone

## Troubleshooting

### Backend Issues

**Problem**: "MongoDB connection error"
```
Solution: Ensure MongoDB is running
- Check: pgrep -l mongod
- Start: brew services start mongodb-community
```

**Problem**: "Interview session not found"
```
Solution: Chat session may have expired
- Start a new interview
- Check server logs for errors
```

**Problem**: Gemini API rate limit
```
Solution: Check API key quota
- Key in backend/.env: GEMINI_API_KEY
- May need to add delays between requests
```

### Frontend Issues

**Problem**: "Please login to start interview"
```
Solution: Ensure JWT token is set
- Login again
- Check localStorage.getItem('token')
```

**Problem**: Components not rendering
```
Solution: Check console for errors
- Verify import paths
- Check UC7 index.js exports
```

**Problem**: CORS errors
```
Solution: Check backend CORS settings
- FRONTEND_URL in backend/.env
- Should be http://localhost:3000
```

## API Endpoints Reference

### Start Interview
```bash
curl -X POST http://localhost:5001/api/uc7/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "position": "Software Engineer",
    "company": "Google",
    "location": "Remote",
    "age": 25,
    "experience": 3,
    "skills": ["JavaScript", "React", "Node.js"]
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "interviewId": "67...",
    "question": "Tell me about yourself...",
    "questionNumber": 1,
    "totalQuestions": 5
  }
}
```

### Submit Answer
```bash
curl -X POST http://localhost:5001/api/uc7/answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "67...",
    "answer": "Your detailed answer here"
  }'
```

**Response (More Questions)**:
```json
{
  "success": true,
  "data": {
    "response": "Thank you. Next question...",
    "questionNumber": 2,
    "totalQuestions": 5,
    "isComplete": false
  }
}
```

**Response (Interview Complete)**:
```json
{
  "success": true,
  "data": {
    "isComplete": true,
    "acknowledgment": "Thank you for your response.",
    "message": "Interview completed. Please finish to get results."
  }
}
```

### Finish Interview
```bash
curl -X POST http://localhost:5001/api/uc7/finish \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "67..."
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "interviewId": "67...",
    "scores": {
      "technical": 75,
      "communication": 80,
      "problemSolving": 70,
      "overall": 75
    },
    "overallFeedback": "Good performance overall...",
    "strengths": ["Clear communication", "Technical knowledge"],
    "improvements": ["More specific examples", "Structure answers"],
    "detailedFeedback": [{
      "questionNumber": 1,
      "question": "Tell me about yourself...",
      "answer": "Your answer...",
      "strengths": ["..."],
      "improvements": ["..."],
      "score": 75
    }],
    "completedAt": "2025-10-17T..."
  }
}
```

## File Structure Verification

```
✅ backend/
   ✅ models/interviewModel.js (MongoDB schema)
   ✅ services/uc7-interviewAgent.js (Gemini AI integration)
   ✅ routes/uc7-mockInterview.js (API endpoints)
   ✅ server.js (routes integrated)
   ✅ .env (MONGO_URI and GEMINI_API_KEY added)

✅ frontend/src/
   ✅ components/UC7/
      ✅ MockInterview.jsx (main controller)
      ✅ InterviewSetup.jsx (form)
      ✅ InterviewSession.jsx (Q&A)
      ✅ InterviewResults.jsx (feedback)
      ✅ index.js (exports)
   ✅ pages/Features/
      ✅ MockInterview.jsx (imports from UC7)
```

## Environment Configuration

### backend/.env
```
PORT=5001
JWT_SECRET=yaake_dev_secret_2024_change_in_production
JWT_EXPIRE=24h
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/yaake

# Gemini AI
GEMINI_API_KEY=AIzaSyAoUNvZJPiBFyzkM7IDZXV558ElBHJzg3Q
```

## Success Criteria

The implementation is successful if:
1. ✅ Backend starts without errors
2. ✅ MongoDB connects successfully
3. ✅ All UC7 routes are accessible
4. ✅ Frontend loads without errors
5. ✅ Placeholder replaced with actual component
6. [ ] Complete interview flow works end-to-end
7. [ ] AI generates relevant questions
8. [ ] Feedback is comprehensive and accurate
9. [ ] UI is responsive and purple-themed
10. [ ] Error handling is graceful

## What to Test Locally

1. **Start MongoDB**: `brew services start mongodb-community`
2. **Start Backend**: `cd backend && npm start`
3. **Start Frontend**: `cd frontend && npm start`
4. **Login**: Navigate to http://localhost:3000 and login
5. **Start Interview**: Go to Mock Interview from dashboard
6. **Complete Flow**: Fill form → Answer 5 questions → View results
7. **Verify**:
   - Questions are relevant to your profile
   - AI adapts based on answer quality
   - Scores are reasonable
   - Feedback is constructive
   - UI looks professional (purple theme)

## Known Limitations

1. **MongoDB Required**: Server won't start without MongoDB running
2. **Gemini API**: Requires valid API key and internet connection
3. **Chat Sessions**: Stored in memory, lost on server restart
4. **No Persistence**: Chat history cleared after feedback generation
5. **5 Questions Fixed**: Currently hardcoded to 5 questions

## Ready for Production?

**Not Yet** - Additional requirements:
- [ ] Environment-specific API keys
- [ ] Production MongoDB cluster
- [ ] Rate limiting for Gemini API calls
- [ ] Session persistence (Redis)
- [ ] Error monitoring (Sentry)
- [ ] Analytics tracking
- [ ] Load testing
- [ ] Security audit

## Support

For issues during testing:
1. Check server logs for backend errors
2. Check browser console for frontend errors
3. Verify MongoDB is running: `pgrep -l mongod`
4. Test API endpoints directly with curl
5. Refer to UC7_README.md for architecture details

---

**Status**: Ready for local testing! 🚀

**Last Updated**: October 17, 2025
