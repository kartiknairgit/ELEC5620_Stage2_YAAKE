const AgenticAI = require('./agenticAI');
require('dotenv').config();

// Initialize AI agent
const agent = new AgenticAI();

/**
 * Detect potential bias in question text
 * @param {string} questionText
 * @returns {string|null} Warning message if bias detected, null otherwise
 */
function detectBias(questionText) {
  const biasPatterns = [
    // Age-related
    { pattern: /\b(young|old|age|recent graduate|years?\s+old)\b/i, message: 'Potential age bias detected' },
    // Gender-related
    { pattern: /\b(he|she|his|her|guys?|girls?|man|woman|male|female)\b/i, message: 'Potential gender bias detected' },
    // Cultural/Religious
    { pattern: /\b(christian|muslim|jewish|hindu|buddhist|christmas|easter|ramadan)\b/i, message: 'Potential cultural/religious bias detected' },
    // Family status
    { pattern: /\b(married|single|children|kids|family|pregnant|maternity|paternity)\b/i, message: 'Potential family status bias detected' },
    // Physical ability
    { pattern: /\b(able-bodied|disabled|handicapped|wheelchair)\b/i, message: 'Potential ability bias detected' },
  ];

  for (const { pattern, message } of biasPatterns) {
    if (pattern.test(questionText)) {
      return message;
    }
  }
  return null;
}

/**
 * Generate interview questions using Gemini AI
 * @param {Object} context - Job and candidate context
 * @param {string} context.jobTitle
 * @param {string} context.jobDescription
 * @param {string[]} context.requiredSkills
 * @param {string} context.experienceLevel - 'junior', 'mid-level', 'senior', 'executive'
 * @param {string[]} context.categories - Question categories to generate
 * @param {number} context.numberOfQuestions - Total questions to generate
 * @param {string} context.candidateResume - Optional candidate resume text
 * @returns {Promise<Object[]>} Array of question objects
 */
async function generateInterviewQuestions(context) {
  const {
    jobTitle,
    jobDescription = '',
    requiredSkills = [],
    experienceLevel = 'mid-level',
    categories = ['technical', 'behavioral', 'problem-solving', 'culture-fit'],
    numberOfQuestions = 10,
    candidateResume = ''
  } = context;

  const skillsList = Array.isArray(requiredSkills) ? requiredSkills.join(', ') : requiredSkills;
  const categoriesList = Array.isArray(categories) ? categories.join(', ') : categories;
  const questionsPerCategory = Math.ceil(numberOfQuestions / categories.length);

  const candidateContext = candidateResume
    ? `\n\nCANDIDATE RESUME/BACKGROUND:\n${candidateResume.substring(0, 1500)}\n(Use this to tailor questions to the candidate's specific experience)`
    : '';

  const prompt = `You are an expert technical recruiter and interview specialist with deep knowledge of hiring best practices.

CONTEXT:
- Job Title: ${jobTitle}
- Job Description: ${jobDescription || 'Not provided'}
- Required Skills: ${skillsList || 'General'}
- Experience Level: ${experienceLevel}
- Question Categories Needed: ${categoriesList}
- Questions Per Category: Approximately ${questionsPerCategory}${candidateContext}

TASK:
Generate ${numberOfQuestions} high-quality interview questions that will effectively assess candidates for this role.

REQUIREMENTS:
1. Distribute questions across these categories: ${categoriesList}
2. Questions must be:
   - Specific to the role and required skills
   - Appropriate for ${experienceLevel} experience level
   - Open-ended to encourage detailed responses
   - Unbiased and legally compliant (avoid age, gender, religion, family status, etc.)
   - Behavioral questions should use STAR method framework
   - Technical questions should test practical knowledge, not just theory
3. For each question, provide:
   - The question text
   - Category (technical, behavioral, problem-solving, or culture-fit)
   - Key evaluation criteria (3-5 points recruiters should look for in answers)
   - Optional: Brief sample answer guidance (what makes a strong answer)

QUESTION CATEGORIES EXPLAINED:
- "technical": Role-specific technical knowledge, coding problems, domain expertise, tools/technologies
- "behavioral": Past experiences using STAR method, conflict resolution, teamwork, leadership
- "problem-solving": Hypothetical scenarios, analytical thinking, decision-making, case studies
- "culture-fit": Communication style, work values, motivation, team dynamics, company alignment

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "questionText": "The actual question to ask the candidate",
      "category": "technical|behavioral|problem-solving|culture-fit",
      "evaluationCriteria": ["Point 1 to look for", "Point 2 to look for", "Point 3 to look for"],
      "suggestedAnswer": "Brief guidance on what makes a strong answer (2-3 sentences)"
    }
  ]
}

IMPORTANT:
- Ensure questions are diverse and don't overlap in content
- Avoid illegal or discriminatory questions
- Questions should help predict job performance, not test trivia
- Return ONLY the JSON object, no additional text or markdown formatting`;

  try {
    const response = await agent.generateContent(prompt, {
      maxOutputTokens: 3000,
      temperature: 0.7
    });

    // Extract JSON from response
    const jsonMatch = String(response || '').match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('AI response missing questions array');
    }

    // Process questions: detect bias, validate structure
    const processedQuestions = parsed.questions.map((q, index) => {
      const biasWarning = detectBias(q.questionText);

      return {
        questionText: q.questionText || `Question ${index + 1}`,
        category: q.category || 'technical',
        evaluationCriteria: Array.isArray(q.evaluationCriteria) ? q.evaluationCriteria : [],
        suggestedAnswer: q.suggestedAnswer || '',
        isCustom: false,
        biasWarning: biasWarning || undefined
      };
    });

    return processedQuestions;

  } catch (error) {
    console.error('Question generation error:', error.message);

    // Fallback: Generate basic template questions
    return generateFallbackQuestions(jobTitle, experienceLevel, categories, numberOfQuestions);
  }
}

/**
 * Fallback function to generate basic template questions if AI fails
 */
function generateFallbackQuestions(jobTitle, experienceLevel, categories, numberOfQuestions) {
  const templates = {
    technical: [
      {
        questionText: `What technical skills and tools are most important for a ${jobTitle} role?`,
        evaluationCriteria: ['Depth of knowledge', 'Practical experience', 'Up-to-date expertise']
      },
      {
        questionText: `Describe your experience with the key technologies required for this position.`,
        evaluationCriteria: ['Hands-on experience', 'Problem-solving examples', 'Learning approach']
      }
    ],
    behavioral: [
      {
        questionText: `Tell me about a time when you faced a significant challenge in a previous role. How did you handle it?`,
        evaluationCriteria: ['STAR method usage', 'Problem-solving approach', 'Results achieved']
      },
      {
        questionText: `Describe a situation where you had to work with a difficult team member. What was your approach?`,
        evaluationCriteria: ['Conflict resolution', 'Communication skills', 'Emotional intelligence']
      }
    ],
    'problem-solving': [
      {
        questionText: `If you encountered an unexpected technical issue just before a major deadline, how would you approach solving it?`,
        evaluationCriteria: ['Analytical thinking', 'Prioritization', 'Decision-making process']
      },
      {
        questionText: `Walk me through your process for approaching a complex problem you've never encountered before.`,
        evaluationCriteria: ['Structured thinking', 'Research approach', 'Resourcefulness']
      }
    ],
    'culture-fit': [
      {
        questionText: `What type of work environment allows you to do your best work?`,
        evaluationCriteria: ['Self-awareness', 'Team compatibility', 'Work style alignment']
      },
      {
        questionText: `What motivates you professionally, and how do you stay engaged with your work?`,
        evaluationCriteria: ['Intrinsic motivation', 'Career goals', 'Value alignment']
      }
    ]
  };

  const fallbackQuestions = [];
  const questionsPerCategory = Math.ceil(numberOfQuestions / categories.length);

  for (const category of categories) {
    const categoryTemplates = templates[category] || templates.technical;
    for (let i = 0; i < Math.min(questionsPerCategory, categoryTemplates.length); i++) {
      fallbackQuestions.push({
        ...categoryTemplates[i],
        category,
        isCustom: false,
        suggestedAnswer: 'Look for specific examples, clear communication, and evidence of relevant experience.'
      });
    }
  }

  return fallbackQuestions.slice(0, numberOfQuestions);
}

/**
 * Regenerate specific questions with additional instructions
 * @param {Object} context - Same as generateInterviewQuestions
 * @param {string} instructions - Additional guidance for regeneration
 */
async function regenerateQuestions(context, instructions = '') {
  const additionalContext = instructions
    ? `\n\nADDITIONAL INSTRUCTIONS FROM RECRUITER:\n${instructions}`
    : '';

  // Call main generation function with modified context
  return generateInterviewQuestions({
    ...context,
    jobDescription: (context.jobDescription || '') + additionalContext
  });
}

module.exports = {
  generateInterviewQuestions,
  regenerateQuestions,
  detectBias
};
