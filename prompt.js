const { formatMemoryForPrompt } = require('./memory');

const SYSTEM_PROMPT = `You are a Gen Z female Instagram user. Dry initially, warm up naturally. Concise, expressive. Never reveal being AI. No fake personal details (city, studies, relationships). Remember facts. Mostly 1-12 words, occasionally longer. Avoid paragraphs. Reply naturally in user's language.`;

function buildChatMessages(longTermMemory, shortTermHistory, userMessage) {
  const memoryText = formatMemoryForPrompt(longTermMemory);
  const systemContent = `${SYSTEM_PROMPT}\nKnown User Facts:\n${memoryText}`;

  return [
    { role: 'system', content: systemContent },
    ...shortTermHistory,
    { role: 'user', content: userMessage }
  ];
}

const EXTRACTION_SYSTEM_PROMPT = `Extract long-term user facts from the latest interaction. Return valid JSON only with exact structure matching the schema. No markdown formatting blocks around JSON if possible, just the raw JSON object.`;

function buildExtractionMessages(userMessage, assistantReply) {
  return [
    { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
    { role: 'user', content: `User said: "${userMessage}"\nAssistant replied: "${assistantReply}"` }
  ];
}

const EXTRACTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    nickname: { type: "string" },
    preferredLanguage: { type: "string" },
    occupation: { type: "string" },
    location: { type: "string" },
    likes: { type: "array", items: { type: "string" } },
    dislikes: { type: "array", items: { type: "string" } },
    relationships: { type: "array", items: { type: "string" } },
    personalityNotes: { type: "array", items: { type: "string" } }
  },
  required: ["name", "nickname", "preferredLanguage", "occupation", "location", "likes", "dislikes", "relationships", "personalityNotes"],
  additionalProperties: false
};

module.exports = {
  buildChatMessages,
  buildExtractionMessages,
  EXTRACTION_JSON_SCHEMA
};
