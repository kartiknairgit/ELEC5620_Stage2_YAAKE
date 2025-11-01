const Course = require('../models/courseModel');
const { generateJson } = require('./llm.service');

/**
 * Utility: normalize strings for keyword matching
 */
function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+.#\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract skills using LLM with a JSON schema. Fallback to simple keyword extraction on error.
 */
async function extractSkills({ resumeText, jobDescription, targetRole }) {
  const promptParts = [];
  if (resumeText) promptParts.push(`RESUME:\n${resumeText}`);
  if (jobDescription) promptParts.push(`JOB DESCRIPTION:\n${jobDescription}`);
  if (targetRole) promptParts.push(`TARGET ROLE: ${targetRole}`);

  const userPrompt = `${promptParts.join('\n\n')}
\nYou are a career coach. Identify concrete professional skills (technical and soft) and return ONLY JSON:
{
  "present_skills": ["skill", ...],
  "missing_skills": ["skill", ...],
  "summary": "one-paragraph summary of the gap"
}
Rules:
- Skills should be concise canonical names (e.g., "React", "Docker", "Communication").
- Use job description/target role to determine missing_skills.
- If job description not provided, infer from target role. If both missing, missing_skills may be empty.`;

  try {
    const json = await generateJson({
      systemInstruction: 'You return strict JSON with skill arrays for career guidance.',
      userPrompt,
      responseSchema: (obj) => Array.isArray(obj.present_skills) && Array.isArray(obj.missing_skills) && typeof obj.summary === 'string',
      temperature: 0.3,
      maxOutputTokens: 700
    });

    const present = (json.present_skills || []).map((s) => String(s).trim()).filter(Boolean);
    const missing = (json.missing_skills || []).map((s) => String(s).trim()).filter(Boolean);
    return { presentSkills: present, missingSkills: missing, summary: json.summary || '' };
  } catch (err) {
    // Fallback: very naive keyword extraction from resume and JD
    const resume = normalize(resumeText);
    const jd = normalize(jobDescription);
    const dictionary = [
      'react','node.js','node','express','mongodb','sql','python','java','javascript','typescript','docker','kubernetes','aws','gcp','azure','git','ci/cd','linux','html','css','tailwind','redux','testing','jest','cypress','next.js','spring','django','flask','rest','graphql','communication','leadership','agile','scrum','design patterns','oop','data structures','algorithms','cloud','terraform','ansible'
    ];

    const present = [];
    const missing = [];
    for (const term of dictionary) {
      const tokens = term.split('/');
      const has = tokens.some((t) => resume.includes(t));
      const required = tokens.some((t) => jd.includes(t));
      if (has) present.push(term);
      if (!has && required) missing.push(term);
    }
    return { presentSkills: present, missingSkills: missing, summary: '' };
  }
}

/**
 * Score available courses against missing skills.
 */
function scoreCoursesAgainstSkills(courses, missingSkills) {
  const normalizedMissing = missingSkills.map((s) => normalize(s));

  return courses.map((course) => {
    const haystack = normalize(`${course.title} ${course.description} ${course.provider}`);
    const matchedSkills = normalizedMissing.filter((skill) => skill && haystack.includes(skill));
    const score = matchedSkills.length;
    return {
      courseId: String(course._id || course.id || ''),
      title: course.title,
      provider: course.provider,
      description: course.description || '',
      signupLink: course.signupLink || '',
      matchedSkills,
      matchScore: score
    };
  }).filter((c) => c.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Build a phased learning path from ranked courses and missing skills.
 */
function buildLearningPath(rankedCourses, missingSkills, options = {}) {
  const maxPhases = options.maxPhases || 4;
  const skillsPerPhase = options.skillsPerPhase || 2;

  const skillsQueue = [...missingSkills];
  const usedCourseIds = new Set();
  const phases = [];

  for (let phaseIndex = 0; phaseIndex < maxPhases && skillsQueue.length > 0; phaseIndex++) {
    const focusSkills = skillsQueue.splice(0, skillsPerPhase);
    // pick up to 2 courses that best match focusSkills and not yet used
    const candidates = rankedCourses
      .filter((c) => !usedCourseIds.has(c.courseId))
      .map((c) => ({
        course: c,
        localScore: c.matchedSkills.filter((s) => focusSkills.map((x) => normalize(x)).includes(normalize(s))).length
      }))
      .filter((x) => x.localScore > 0)
      .sort((a, b) => b.localScore - a.localScore)
      .slice(0, 2);

    const chosen = candidates.map((x) => x.course);
    for (const ch of chosen) usedCourseIds.add(ch.courseId);

    phases.push({
      phase: `Week ${phaseIndex * 2 + 1}-${phaseIndex * 2 + 2}`,
      focus: focusSkills,
      courses: chosen,
      goals: [
        `Demonstrate applied knowledge of: ${focusSkills.join(', ')}`
      ]
    });
  }

  return phases;
}

/**
 * Main entry: Recommend learning path
 */
async function recommendLearningPath({ resumeText, jobDescription, targetRole, requesterUserId = null }) {
  if (!resumeText || !(jobDescription || targetRole)) {
    const err = new Error('resumeText and (jobDescription or targetRole) are required');
    err.status = 400;
    throw err;
  }

  // 1) Analyze skills
  const { presentSkills, missingSkills, summary } = await extractSkills({ resumeText, jobDescription, targetRole });

  // 2) Fetch available courses (all trainers). If needed, scope by requester later.
  const courses = await Course.find({}).limit(300).lean().exec();

  // 3) Score courses
  const ranked = scoreCoursesAgainstSkills(courses, missingSkills);

  // 4) Build path
  const learningPath = buildLearningPath(ranked, missingSkills);

  return {
    presentSkills,
    missingSkills,
    summary,
    recommendedCourses: ranked.slice(0, 10),
    learningPath
  };
}

module.exports = {
  recommendLearningPath
};


