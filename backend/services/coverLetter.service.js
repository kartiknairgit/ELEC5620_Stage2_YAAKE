const { generateJson } = require('./llm.service');

// Init banner (similar to other services)
let __cl_init_logged = false;
(function initCoverLetterService() {
  if (__cl_init_logged) return;
  const hasGeminiKey = Boolean(process.env.GEMINI_API || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
  if (hasGeminiKey) {
    console.log('✅ IntelligentCoverLetterService initialized with Gemini API');
  } else {
    console.log('⚠️  IntelligentCoverLetterService: Gemini API key not set');
  }
  __cl_init_logged = true;
})();

const systemInstruction = `You are a senior recruiting assistant.
- Write truthful, ATS-friendly cover letters.
- Never invent facts beyond the provided resume.
- Adapt tone to one of: formal, conversational, persuasive.
- Keep paragraphs concise and scannable.
- Always return JSON strictly matching the schema.

Response JSON schema (describe, do not include comments in output):
{
  "drafts": [
    {
      "id": "string",
      "tone": "formal|conversational|persuasive",
      "title": "string",
      "body": "string",
      "wordCount": 0,
      "alignmentScore": 0,
      "keywordCoverage": ["string"],
      "justification": "string"
    }
  ],
  "extractedResumeFacts": {
    "skills": ["string"],
    "achievements": ["string"],
    "tools": ["string"]
  },
  "extractedJDKeywords": ["string"],
  "warnings": ["string"]
}`;

// Note: we no longer clamp the body to MAX_WORDS; we only compute metrics
// and let the UI display the full text so users can refine manually.

function computeWordCount(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function simpleAlignmentScore({ draft, jdKeywords = [] }) {
  if (!jdKeywords.length) return 75; // default when JD missing
  const lower = draft.toLowerCase();
  let hits = 0;
  jdKeywords.forEach(k => { if (lower.includes(k.toLowerCase())) hits += 1; });
  const coverage = (hits / jdKeywords.length) * 100;
  // weight toward coverage, clamp 50-95
  return Math.max(50, Math.min(95, Math.round(coverage)));
}

function uniq(arr = []) {
  return Array.from(new Set(arr.map(x => (x || '').trim()).filter(Boolean)));
}

async function generateCoverLetters({ resumeText, jobDescriptionText = '', style = 'formal', length = 'standard', userNotes = '', maxWords: inputMaxWords }) {
  const maxWords = inputMaxWords && Number.isFinite(inputMaxWords) ? Math.max(120, Math.min(800, Math.floor(inputMaxWords))) : (length === 'short' ? 220 : 380);
  const minWords = Math.max(120, Math.floor(maxWords * 0.85));
  const tones = [style];
  const requiredCount = 1;
  console.log('\n🔧 generateCoverLetters:', { maxWords, tones, requiredCount });

  const userPrompt = [
    'RESUME:\n' + resumeText,
    jobDescriptionText ? ('JD:\n' + jobDescriptionText) : 'JD: (not provided) generate a strong general-purpose cover letter using resume facts only',
    'TARGET TONE: ' + tones[0],
    'REQUIRED_DRAFT_COUNT: ' + requiredCount,
    'TARGET_WORDS: ' + maxWords,
    'MIN_WORDS: ' + minWords,
    'MAX_WORDS: ' + maxWords,
    'LENGTH_POLICY: Write between MIN_WORDS and MAX_WORDS words, aiming for TARGET_WORDS. If outside this range, revise internally before returning JSON. Do not exceed MAX_WORDS.',
    'INSTRUCTIONS: Generate EXACTLY ONE draft in the TARGET TONE. The output MUST be valid JSON and the drafts array MUST contain exactly one item where draft.tone equals the TARGET TONE. Do not invent facts beyond the resume. When JD is provided, reflect its requirements and keywords truthfully.',
    userNotes ? ('NOTES: ' + userNotes) : ''
  ].join('\n\n');

  const approxTokens = Math.min(8192, Math.max(1024, Math.floor(maxWords * 2.5) + 600));
  const response = await generateJson({ systemInstruction, userPrompt, maxOutputTokens: approxTokens });
  console.log('\n🤖 LLM responded with keys:', Object.keys(response || {}));

  // Post-process metrics to ensure consistency
  const jdKeywords = uniq(response.extractedJDKeywords || []);
  const drafts = (response.drafts || []).map((d, idx) => {
    const bodyRaw = d.body || '';
    const wordCount = computeWordCount(bodyRaw);
    const alignmentScore = simpleAlignmentScore({ draft: bodyRaw, jdKeywords });
    const keywordCoverage = uniq(d.keywordCoverage || jdKeywords.filter(k => (bodyRaw.toLowerCase().includes(k.toLowerCase()))));
    if (idx === 0) {
      console.log('\n📏 Post-processed Draft[0]:', { wordCount, alignmentScore, tone: d.tone || style });
    }
    return {
      id: d.id || `draft_${idx + 1}`,
      tone: d.tone || style,
      title: d.title || `Cover Letter (${d.tone || style})`,
      body: bodyRaw,
      wordCount,
      alignmentScore,
      keywordCoverage,
      justification: d.justification || 'Optimized to match role requirements and resume strengths.'
    };
  });

  return {
    drafts,
    extractedResumeFacts: response.extractedResumeFacts || { skills: [], achievements: [], tools: [] },
    extractedJDKeywords: jdKeywords,
    warnings: response.warnings || []
  };
}

async function refineCoverLetter({ draftText, editInstructions = '', newTone = '', length = 'standard', maxWords: inputMaxWords }) {
  const maxWords = inputMaxWords && Number.isFinite(inputMaxWords) ? Math.max(120, Math.min(800, Math.floor(inputMaxWords))) : (length === 'short' ? 220 : 380);
  const minWords = Math.max(120, Math.floor(maxWords * 0.85));
  const toneLine = newTone ? `TARGET TONE: ${newTone}` : 'TARGET TONE: keep current';
  const userPrompt = [
    'REFINE DRAFT based on instructions while preserving truthfulness and resume alignment.',
    toneLine,
    'TARGET_WORDS: ' + maxWords,
    'MIN_WORDS: ' + minWords,
    'MAX_WORDS: ' + maxWords,
    'LENGTH_POLICY: Write between MIN_WORDS and MAX_WORDS words, aiming for TARGET_WORDS. If outside this range, revise internally before returning JSON. Do not exceed MAX_WORDS.',
    'DRAFT:\n' + draftText,
    'INSTRUCTIONS:\n' + (editInstructions || 'Tighten language, improve clarity and impact.')
  ].join('\n\n');

  const approxTokens = Math.min(8192, Math.max(1024, Math.floor(maxWords * 2.5) + 600));
  const response = await generateJson({ systemInstruction, userPrompt, maxOutputTokens: approxTokens });
  const d = (response.drafts && response.drafts[0]) || { body: draftText, tone: newTone || 'formal' };
  const jdKeywords = uniq(response.extractedJDKeywords || []);
  const bodyRaw = d.body || '';
  return {
    refinedDraft: {
      id: d.id || 'refined_1',
      tone: d.tone || newTone || 'formal',
      title: d.title || 'Refined Cover Letter',
      body: bodyRaw,
      wordCount: computeWordCount(bodyRaw),
      alignmentScore: simpleAlignmentScore({ draft: bodyRaw, jdKeywords }),
      keywordCoverage: uniq(d.keywordCoverage || jdKeywords.filter(k => bodyRaw.toLowerCase().includes(k.toLowerCase()))),
      justification: d.justification || 'Refined per instructions and tone target.'
    },
    warnings: response.warnings || []
  };
}

module.exports = {
  generateCoverLetters,
  refineCoverLetter
};


