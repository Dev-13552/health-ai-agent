const { GoogleGenerativeAI } = require('@google/generative-ai');
const { SYSTEM_PROMPT, REPORT_PROMPT } = require('../utils/prompts');

// We initialize GoogleGenerativeAI. If the key is missing during initialization,
// we grab it on invocation to avoid crashing if .env isn't loaded yet.
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }
  return new GoogleGenerativeAI(apiKey);
}

function getModel() {
  const genAI = getGenAI();
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });
}

/**
 * Starts a stateful chat session with the given history.
 * @param {Array} history
 * @returns {ChatSession}
 */
function startConversation(history = []) {
  const model = getModel();
  return model.startChat({
    history: history
  });
}

/**
 * Generates a structured health report from the conversation history.
 * @param {Array} history
 * @returns {Promise<Object>}
 */
async function generateReport(history = []) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  // Format the history into a transcript text block
  const transcript = history.map(msg => {
    const roleName = msg.role === 'user' ? 'Patient' : 'Screening AI';
    const textContent = msg.parts.map(p => p.text).join(' ');
    return `${roleName}: ${textContent}`;
  }).join('\n');

  const prompt = `${REPORT_PROMPT}\n\nTranscript:\n${transcript}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  
  try {
    // Attempt to extract JSON block in case it outputs markdown blocks despite instructions
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse report JSON:', text, err);
    return {
      mainConcern: 'Incomplete conversation',
      keySymptoms: [],
      duration: 'Not provided',
      severity: 'Not provided',
      followUp: ['Could not generate report details. Please consult a clinician.']
    };
  }
}

module.exports = {
  startConversation,
  generateReport
};
