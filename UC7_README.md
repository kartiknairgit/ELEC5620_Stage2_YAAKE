# UC7: Mock Interview with Gemini Agentic AI

## Overview
UC7 implements an AI-powered mock interview system using Google's Gemini API. The system conducts adaptive interviews, evaluates responses, and provides comprehensive feedback.

## Features
- **Adaptive Questioning**: AI dynamically adjusts questions based on answer quality
- **Conversational Memory**: Uses Gemini's chat.startChat() for contextual conversations
- **Comprehensive Scoring**: Evaluates technical skills, communication, and problem-solving
- **Detailed Feedback**: Question-by-question analysis with strengths and improvements
- **Professional UI**: Purple #6366F1 theme with Tailwind CSS

## Architecture

### Backend Components

#### 1. MongoDB Schema (`backend/models/interviewModel.js`)
- Stores interview sessions with full conversation history
- Tracks scores (technical, communication, problem-solving, overall)
- Maintains detailed feedback for each question
- Status tracking: in_progress, completed, abandoned

#### 2. Interview Agent Service (`backend/services/uc7-interviewAgent.js`)
**Key Features:**
- Uses `@google/generative-ai` package
- Implements `chat.startChat()` for conversational memory
- Adaptive question generation based on previous answers
- Comprehensive feedback generation with JSON parsing

**Methods:**
- `startInterview(interviewId, candidateProfile)`: Initialize interview with context
- `processAnswer(interviewId, answer, currentQuestionNumber)`: Get next question
- `generateFeedback(interviewId, conversationHistory, candidateProfile)`: Generate final scores

#### 3. API Routes (`backend/routes/uc7-mockInterview.js`)

**Endpoints:**
- `POST /api/uc7/start`: Start new interview session
  - Input: position, company, location, age, experience, skills
  - Output: interviewId, first question

- `POST /api/uc7/answer`: Submit answer and get next question
  - Input: interviewId, answer
  - Output: next question or completion status

- `POST /api/uc7/finish`: Complete interview and get results
  - Input: interviewId
  - Output: scores, feedback, detailed analysis

- `GET /api/uc7/history`: Get user's interview history
- `GET /api/uc7/results/:interviewId`: Get specific interview results

### Frontend Components

#### 1. InterviewSetup.jsx
**Purpose:** Collect candidate information before interview

**Form Fields:**
- Position/Role (text)
- Company (text)
- Location (text)
- Age (number, 18-100)
- Years of Experience (number, 0-50)
- Skills (comma-separated list)

**Validation:**
- Client-side validation with error messages
- Skills parsing and array conversion
- Loading states during submission

#### 2. InterviewSession.jsx
**Purpose:** Conduct the interview with real-time Q&A

**Features:**
- Chat-like interface with question/answer bubbles
- Auto-scroll to latest message
- Progress bar showing question X of 5
- Loading indicators with animated dots
- Keyboard shortcuts (Ctrl+Enter to submit)
- Completion detection and finish button

**UI Elements:**
- AI avatar (purple) for questions
- User avatar (gray) for answers
- Conversation history display
- Text area for answers
- Submit button with disabled states

#### 3. InterviewResults.jsx
**Purpose:** Display comprehensive feedback and scores

**Sections:**
1. **Overall Score Card**: Large score display with gradient background
2. **Score Breakdown**: Technical, Communication, Problem-Solving
3. **Strengths**: Green-themed list of positive points
4. **Areas for Improvement**: Purple-themed suggestions
5. **Detailed Question Analysis**: Per-question feedback with scores
6. **Action Buttons**: Start new interview, Print results

**Scoring Colors:**
- 80-100: Green (excellent)
- 60-79: Yellow (good)
- 0-59: Red (needs improvement)

#### 4. MockInterview.jsx
**Purpose:** Main controller orchestrating the flow

**State Management:**
- currentStep: 'setup' | 'session' | 'results'
- interviewData: Contains interviewId, current question
- results: Contains scores, feedback, analysis

**Flow:**
1. Setup → Start Interview → Session
2. Session → Finish Interview → Results
3. Results → Start New Interview → Setup

## API Integration

### Authentication
All API calls require JWT token in Authorization header:
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

### Error Handling
- Network errors caught and displayed to user
- Validation errors shown per field
- Backend errors displayed in error messages

## Gemini AI Configuration

### API Key
Set in environment variable: `GEMINI_API_KEY`
Fallback hardcoded: `AIzaSyAoUNvZJPiBFyzkM7IDZXV558ElBHJzg3Q`

### Model Configuration
- Model: `gemini-pro`
- Temperature: 0.7 (balanced creativity)
- Top K: 40
- Top P: 0.95
- Max Output Tokens: 1024

### Prompt Engineering

**System Prompt:**
- Establishes interviewer role
- Provides candidate context (position, experience, skills)
- Sets interview guidelines (5 questions, adaptive difficulty)
- Instructs professional, encouraging tone

**Adaptive Prompting:**
- Each answer submission includes instruction to adapt next question
- "If answer was strong, dig deeper. If gaps, probe those areas."

**Feedback Prompt:**
- Requests JSON-formatted response
- Specific scoring criteria
- Constructive, professional feedback

## Database Schema

```javascript
{
  userId: ObjectId,
  position: String,
  company: String,
  location: String,
  age: Number,
  experience: Number,
  skills: [String],
  conversationHistory: [{
    role: 'user' | 'model',
    content: String,
    timestamp: Date,
    metadata: Object
  }],
  currentQuestionNumber: Number,
  totalQuestions: Number,
  scores: {
    technical: Number (0-100),
    communication: Number (0-100),
    problemSolving: Number (0-100),
    overall: Number (0-100)
  },
  feedback: [{
    questionNumber: Number,
    question: String,
    answer: String,
    strengths: [String],
    improvements: [String],
    score: Number
  }],
  status: 'in_progress' | 'completed' | 'abandoned',
  completedAt: Date,
  timestamps: true
}
```

## Usage Example

### Frontend Integration
```javascript
import { MockInterview } from './components/UC7';

// In your App.js or routing
<Route path="/mock-interview" element={<MockInterview />} />
```

### Backend Server Integration
Already integrated in `backend/server.js`:
```javascript
const uc7Routes = require('./routes/uc7-mockInterview');
app.use('/api/uc7', uc7Routes);
```

## Testing

### Manual Testing Steps
1. Start backend: `cd backend && npm run dev`
2. Ensure MongoDB is running
3. Login as a user to get JWT token
4. Access mock interview page
5. Fill interview setup form
6. Answer 5 questions
7. Review comprehensive results

### API Testing with curl
```bash
# Start interview
curl -X POST http://localhost:5000/api/uc7/start \
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

# Submit answer
curl -X POST http://localhost:5000/api/uc7/answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "INTERVIEW_ID",
    "answer": "Your detailed answer here"
  }'

# Finish interview
curl -X POST http://localhost:5000/api/uc7/finish \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "INTERVIEW_ID"
  }'
```

## Environment Variables

Add to `backend/.env`:
```
GEMINI_API_KEY=AIzaSyAoUNvZJPiBFyzkM7IDZXV558ElBHJzg3Q
MONGO_URI=your_mongodb_connection_string
```

## Dependencies

### Backend
- `@google/generative-ai`: ^0.24.1
- `mongoose`: ^7.5.0
- `express`: ^4.18.2
- `express-validator`: ^7.0.1

### Frontend
- React 18+
- Tailwind CSS (purple #6366F1 theme)

## Design Decisions

### Why Gemini chat.startChat()?
- Maintains conversation context automatically
- No need to manually pass full history each time
- More natural, adaptive questioning
- Better memory of candidate profile

### Why MongoDB?
- Flexible schema for conversation history
- Easy to store nested feedback arrays
- Good for chat-like data structures
- Timestamps built-in

### Why 5 Questions?
- Balances thoroughness with time commitment
- Enough for meaningful evaluation
- Not overwhelming for candidates
- Industry standard for quick interviews

### Purple Theme (#6366F1)
- Professional and modern
- High contrast for readability
- Matches Tailwind's indigo-600
- Consistent with YAAKE brand

## Future Enhancements

1. **Voice Input**: Speech-to-text for answers
2. **Video Recording**: Record candidate responses
3. **Multiple Difficulty Levels**: Junior/Mid/Senior tracks
4. **Custom Question Sets**: Industry-specific templates
5. **Real-time Hints**: AI suggestions during answers
6. **Interview History**: Analytics and improvement tracking
7. **Collaborative Feedback**: Share results with mentors
8. **Multi-language Support**: Internationalization

## Troubleshooting

### Common Issues

**Issue**: "Interview session not found"
- **Solution**: Chat session expired. Start new interview.

**Issue**: Gemini API rate limit
- **Solution**: Implement exponential backoff or use higher quota key

**Issue**: JSON parsing error in feedback
- **Solution**: Fallback feedback is returned automatically

**Issue**: MongoDB connection failed
- **Solution**: Check MONGO_URI in .env file

## File Structure
```
backend/
├── models/
│   └── interviewModel.js
├── routes/
│   └── uc7-mockInterview.js
├── services/
│   └── uc7-interviewAgent.js
└── server.js (routes integrated)

frontend/
└── src/
    └── components/
        └── UC7/
            ├── MockInterview.jsx (main controller)
            ├── InterviewSetup.jsx
            ├── InterviewSession.jsx
            ├── InterviewResults.jsx
            └── index.js (exports)
```

## License
Part of YAAKE (ELEC5620 Stage 2) project

## Contributors
Built with Claude Code using Gemini AI integration
