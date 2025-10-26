const AgenticAI = require('./agenticAI');
require('dotenv').config();

// Initialize AI agent
const agent = new AgenticAI();

/**
 * Generate personalized cold outreach email using Gemini AI
 * @param {Object} applicantData - {name, skills, experience, email}
 * @param {Object} recruiterData - {name, email, company}
 * @returns {Promise<{subject: string, body: string}>}
 */
async function generateOutreachEmail(applicantData, recruiterData) {
  const { name: applicantName, skills, experience, email: applicantEmail } = applicantData;
  const { name: recruiterName, company } = recruiterData;

  const skillsList = Array.isArray(skills) ? skills.join(', ') : skills;

  const prompt = `You are an expert at crafting personalized, professional cold outreach emails for job seekers.

CONTEXT:
- Applicant Name: ${applicantName}
- Applicant Skills: ${skillsList}
- Applicant Experience: ${experience || 'Recent graduate or early career professional'}
${applicantEmail ? `- Applicant Email: ${applicantEmail}` : ''}

- Recruiter Name: ${recruiterName}
- Company: ${company}

TASK:
Generate a personalized cold outreach email from ${applicantName} to ${recruiterName} at ${company}.

REQUIREMENTS:
1. Professional and respectful tone
2. Concise (150-250 words max)
3. Highlight relevant skills naturally
4. Show genuine interest in the company
5. Include a clear call-to-action
6. Personalized to the company and recruiter
7. NOT generic or template-like
8. Avoid being overly formal or stiff

OUTPUT FORMAT (JSON):
{
  "subject": "A compelling, personalized subject line (8-12 words max)",
  "body": "The complete email body with proper formatting. Use \\n\\n for paragraph breaks. Do NOT include 'Subject:' or 'Dear/Hi' greeting - just the body text starting from the greeting."
}

Return ONLY the JSON object, no additional text.`;

  try {
    const response = await agent.generateContent(prompt, {
      maxOutputTokens: 800,
      temperature: 0.7
    });

    // Extract JSON from response
    const jsonMatch = String(response || '').match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.subject || !parsed.body) {
      throw new Error('AI response missing subject or body');
    }

    return {
      subject: parsed.subject.trim(),
      body: parsed.body.trim()
    };
  } catch (error) {
    console.error('Email generation error:', error.message);

    // Fallback template if AI fails
    return {
      subject: `Exploring Opportunities at ${company}`,
      body: `Dear ${recruiterName},\n\nI hope this message finds you well. My name is ${applicantName}, and I am writing to express my strong interest in opportunities at ${company}.\n\nWith skills in ${skillsList}, I believe I could contribute meaningfully to your team. ${experience ? `My experience in ${experience} has prepared me well for the challenges ahead.` : 'I am eager to bring my skills and enthusiasm to a dynamic organization like yours.'}\n\nI would welcome the opportunity to discuss how I might contribute to ${company}'s success. Would you be open to a brief conversation?\n\nThank you for your time and consideration.\n\nBest regards,\n${applicantName}${applicantEmail ? `\n${applicantEmail}` : ''}`
    };
  }
}

/**
 * Regenerate email with different tone or focus
 * @param {Object} applicantData
 * @param {Object} recruiterData
 * @param {string} instructions - Additional instructions (e.g., "more casual", "focus on leadership")
 */
async function regenerateEmail(applicantData, recruiterData, instructions = '') {
  const { name: applicantName, skills, experience } = applicantData;
  const { name: recruiterName, company } = recruiterData;

  const skillsList = Array.isArray(skills) ? skills.join(', ') : skills;
  const additionalContext = instructions ? `\n\nADDITIONAL INSTRUCTIONS: ${instructions}` : '';

  const prompt = `Generate a personalized cold outreach email from ${applicantName} to ${recruiterName} at ${company}.

Applicant Skills: ${skillsList}
Experience: ${experience || 'Recent graduate or early career professional'}${additionalContext}

Make it professional yet personable, 150-250 words. Focus on value proposition.

Return JSON: {"subject": "...", "body": "..."}`;

  try {
    const response = await agent.generateContent(prompt, {
      maxOutputTokens: 800,
      temperature: 0.8
    });

    const jsonMatch = String(response || '').match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to extract JSON');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      subject: parsed.subject?.trim() || `Opportunity Discussion at ${company}`,
      body: parsed.body?.trim() || `Dear ${recruiterName},\n\nI am reaching out regarding opportunities at ${company}...`
    };
  } catch (error) {
    console.error('Email regeneration error:', error.message);
    throw new Error('Failed to regenerate email');
  }
}

module.exports = {
  generateOutreachEmail,
  regenerateEmail
};
