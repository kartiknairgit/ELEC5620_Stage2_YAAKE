const { generateJson } = require('./llm.service');

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

function clampWords(text, maxWords) {
  if (!maxWords) return text;
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
}

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

async function generateCoverLetters({ resumeText, jobDescriptionText = '', style = 'formal', length = 'standard', userNotes = '' }) {
  const maxWords = length === 'short' ? 220 : 380;
  const tones = [style, 'conversational', 'persuasive'].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
  const requiredCount = tones.length;

  const userPrompt = [
    'RESUME:\n' + resumeText,
    jobDescriptionText ? ('JD:\n' + jobDescriptionText) : 'JD: (not provided) generate a strong general-purpose cover letter using resume facts only',
    'TONE OPTIONS: ' + tones.join(', '),
    'REQUIRED_DRAFT_COUNT: ' + requiredCount,
    'INSTRUCTIONS: For EACH tone in TONE OPTIONS, generate EXACTLY ONE draft. The drafts array MUST contain exactly REQUIRED_DRAFT_COUNT entries, one per tone, and each draft.tone MUST equal its respective tone. Keep within MAX WORDS and do not invent facts beyond the resume. When JD is provided, reflect its requirements and keywords truthfully.',
    'MAX WORDS: ' + maxWords,
    userNotes ? ('NOTES: ' + userNotes) : ''
  ].join('\n\n');

  const response = await generateJson({ systemInstruction, userPrompt });

  // Post-process metrics to ensure consistency
  const jdKeywords = uniq(response.extractedJDKeywords || []);
  const drafts = (response.drafts || []).map((d, idx) => {
    const bodyClamped = clampWords(d.body || '', maxWords);
    const wordCount = computeWordCount(bodyClamped);
    const alignmentScore = simpleAlignmentScore({ draft: bodyClamped, jdKeywords });
    const keywordCoverage = uniq(d.keywordCoverage || jdKeywords.filter(k => (bodyClamped.toLowerCase().includes(k.toLowerCase()))));
    return {
      id: d.id || `draft_${idx + 1}`,
      tone: d.tone || style,
      title: d.title || `Cover Letter (${d.tone || style})`,
      body: bodyClamped,
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

async function refineCoverLetter({ draftText, editInstructions = '', newTone = '', length = 'standard' }) {
  const maxWords = length === 'short' ? 220 : 380;
  const toneLine = newTone ? `TARGET TONE: ${newTone}` : 'TARGET TONE: keep current';
  const userPrompt = [
    'REFINE DRAFT based on instructions while preserving truthfulness and resume alignment.',
    toneLine,
    'MAX WORDS: ' + maxWords,
    'DRAFT:\n' + draftText,
    'INSTRUCTIONS:\n' + (editInstructions || 'Tighten language, improve clarity and impact.')
  ].join('\n\n');

  const response = await generateJson({ systemInstruction, userPrompt });
  const d = (response.drafts && response.drafts[0]) || { body: draftText, tone: newTone || 'formal' };
  const jdKeywords = uniq(response.extractedJDKeywords || []);
  const bodyClamped = clampWords(d.body || '', maxWords);
  return {
    refinedDraft: {
      id: d.id || 'refined_1',
      tone: d.tone || newTone || 'formal',
      title: d.title || 'Refined Cover Letter',
      body: bodyClamped,
      wordCount: computeWordCount(bodyClamped),
      alignmentScore: simpleAlignmentScore({ draft: bodyClamped, jdKeywords }),
      keywordCoverage: uniq(d.keywordCoverage || jdKeywords.filter(k => bodyClamped.toLowerCase().includes(k.toLowerCase()))),
      justification: d.justification || 'Refined per instructions and tone target.'
    },
    warnings: response.warnings || []
  };
}

module.exports = {
  generateCoverLetters,
  refineCoverLetter
};


