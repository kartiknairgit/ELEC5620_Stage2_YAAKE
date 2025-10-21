const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyAoUNvZJPiBFyzkM7IDZXV558ElBHJzg3Q");

/**
 * Interview Agent Service using Gemini AI
 * Uses chat.startChat() for conversational memory to adaptively decide next questions
 * based on answer quality and context
 */
class InterviewAgent {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    this.chatSessions = new Map(); // Store active chat sessions by interview ID
  }

  /**
   * Initialize a new interview session with context
   */
  async startInterview(interviewId, candidateProfile) {
    const { position, company, location, age, experience, skills } = candidateProfile;

    // Create system prompt with interview context
    const systemPrompt = `You are an expert interviewer conducting a mock interview. Here is the candidate profile:
- Position: ${position}
- Company: ${company}
- Location: ${location}
- Age: ${age}
- Years of Experience: ${experience}
- Skills: ${skills.join(", ")}

Your role:
1. Ask relevant, challenging questions based on the candidate's profile and previous answers
2. Adapt the difficulty and focus of questions based on answer quality
3. Ask 5 questions total, covering technical skills, problem-solving, and behavioral aspects
4. After receiving each answer, provide brief acknowledgment before asking the next question
5. Make questions progressively deeper based on the candidate's responses
6. For technical roles, include coding problems or technical scenarios
7. For experienced candidates, ask about leadership and strategic thinking

Start by asking your first question. Be professional, encouraging, and specific to the role.`;

    // Initialize chat session with history
    const chat = this.model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "I understand. I will conduct a professional mock interview tailored to this candidate's profile. I'll ask relevant questions and adapt based on their responses. Let me begin with the first question." }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Store chat session
    this.chatSessions.set(interviewId, chat);

    // Get first question
    const result = await chat.sendMessage("Please ask the first interview question now.");
    const firstQuestion = result.response.text();

    return {
      question: firstQuestion,
      questionNumber: 1,
      totalQuestions: 5
    };
  }

  /**
   * Process candidate answer and generate next question
   */
  async processAnswer(interviewId, answer, currentQuestionNumber) {
    const chat = this.chatSessions.get(interviewId);

    if (!chat) {
      throw new Error("Interview session not found. Please start a new interview.");
    }

    const totalQuestions = 5;
    const isLastQuestion = currentQuestionNumber >= totalQuestions;

    if (isLastQuestion) {
      // If this was the last question, just acknowledge the answer
      const result = await chat.sendMessage(answer);
      return {
        acknowledgment: result.response.text(),
        isComplete: true,
        questionNumber: currentQuestionNumber
      };
    }

    // Send answer and request next question
    const nextQuestionNumber = currentQuestionNumber + 1;
    const prompt = `${answer}

[Based on this answer, briefly acknowledge it and then ask question ${nextQuestionNumber} of ${totalQuestions}. Adapt the difficulty and focus based on the quality of this answer. If the answer was strong, dig deeper. If it showed gaps, probe those areas.]`;

    const result = await chat.sendMessage(prompt);
    const response = result.response.text();

    return {
      response: response,
      questionNumber: nextQuestionNumber,
      totalQuestions: totalQuestions,
      isComplete: false
    };
  }

  /**
   * Generate comprehensive feedback and scores for the entire interview
   */
  async generateFeedback(interviewId, conversationHistory, candidateProfile) {
    const { position, experience } = candidateProfile;

    // Create feedback prompt with full conversation context
    const conversationText = conversationHistory
      .filter(turn => turn.role === 'user' || turn.role === 'model')
      .map((turn, index) => {
        if (turn.role === 'model') {
          return `Question ${Math.floor(index / 2) + 1}: ${turn.content}`;
        } else {
          return `Answer: ${turn.content}`;
        }
      })
      .join('\n\n');

    const feedbackPrompt = `You are an expert interview evaluator. Review this mock interview for a ${position} role with ${experience} years of experience.

${conversationText}

Provide a comprehensive evaluation in the following JSON format (respond ONLY with valid JSON, no additional text):
{
  "scores": {
    "technical": <0-100>,
    "communication": <0-100>,
    "problemSolving": <0-100>,
    "overall": <0-100>
  },
  "overallFeedback": "<2-3 sentences summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "detailedFeedback": [
    {
      "questionNumber": 1,
      "strengths": ["<specific strength>"],
      "improvements": ["<specific improvement>"],
      "score": <0-100>
    }
  ]
}

Be specific, constructive, and professional. Scores should reflect: technical knowledge, communication clarity, problem-solving approach, and overall interview performance.`;

    const result = await this.model.generateContent(feedbackPrompt);
    const feedbackText = result.response.text();

    // Parse JSON response
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      const feedback = JSON.parse(jsonMatch[0]);

      // Clean up chat session
      this.chatSessions.delete(interviewId);

      return feedback;
    } catch (error) {
      console.error("Error parsing feedback JSON:", error);
      console.error("Raw response:", feedbackText);

      // Return fallback feedback
      return {
        scores: {
          technical: 70,
          communication: 75,
          problemSolving: 70,
          overall: 72
        },
        overallFeedback: "Good overall performance with room for improvement.",
        strengths: ["Engaged with questions", "Provided detailed responses", "Showed enthusiasm"],
        improvements: ["Could provide more specific examples", "Consider structuring answers better", "Expand on technical details"],
        detailedFeedback: []
      };
    }
  }

  /**
   * Clean up chat session
   */
  endSession(interviewId) {
    this.chatSessions.delete(interviewId);
  }
}

// Export singleton instance
module.exports = new InterviewAgent();
