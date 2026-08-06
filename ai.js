const Groq = require('groq-sdk');
const config = require('./config');
const { logger, retryWithBackoff, shouldExtractMemory } = require('./utils');
const { buildChatMessages, buildExtractionMessages } = require('./prompt');
const { getLongTermMemory, updateLongTermMemory, getShortTermMemory, addShortTermMessage } = require('./memory');

const groq = new Groq({ apiKey: config.groqApiKey });

function parseJsonSafely(content) {
  if (!content) return null;
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    return null;
  }
}

async function generateReply(userId, userMessage) {
  try {
    const longTerm = await getLongTermMemory(userId);
    const shortTerm = getShortTermMemory(userId);

    const messages = buildChatMessages(longTerm, shortTerm, userMessage);

    const chatCompletionFn = async () => {
      return await groq.chat.completions.create({
        model: 'llama3-70b-8192',
        messages: messages,
        temperature: 0.7,
        max_tokens: 50
      });
    };

    const completion = await retryWithBackoff(chatCompletionFn, 3, 1000);
    const replyText = completion.choices[0]?.message?.content?.trim();

    if (!replyText) {
      throw new Error('Empty response from Groq');
    }

    addShortTermMessage(userId, 'user', userMessage);
    addShortTermMessage(userId, 'assistant', replyText);

    if (shouldExtractMemory(userMessage)) {
      setImmediate(async () => {
        try {
          const extractionMessages = buildExtractionMessages(userMessage, replyText);
          const extractFn = async () => {
            return await groq.chat.completions.create({
              model: 'llama3-70b-8192',
              messages: extractionMessages,
              temperature: 0.1,
              max_tokens: 200,
              response_format: { type: 'json_object' }
            });
          };
          const extCompletion = await retryWithBackoff(extractFn, 2, 1000);
          const extContent = extCompletion.choices[0]?.message?.content;
          const parsedMemory = parseJsonSafely(extContent);

          if (parsedMemory && typeof parsedMemory === 'object') {
            await updateLongTermMemory(userId, parsedMemory);
          }
        } catch (err) {
          logger.error('Background memory extraction failed', err);
        }
      });
    }

    return replyText;
  } catch (err) {
    logger.error('AI generation error', err);
    return "rn busy tbf";
  }
}

module.exports = {
  generateReply
};
