const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const { logger, cleanAndUniqueArray } = require('./utils');

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

const shortTermCache = new Map();
const MAX_SHORT_TERM = 8;

const DEFAULT_MEMORY = {
  name: "",
  nickname: "",
  preferredLanguage: "auto",
  occupation: "",
  location: "",
  likes: [],
  dislikes: [],
  relationships: [],
  personalityNotes: []
};

async function getLongTermMemory(userId) {
  try {
    const { data, error } = await supabase
      .from('user_memory')
      .select('memory')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return { ...DEFAULT_MEMORY };
    }
    return { ...DEFAULT_MEMORY, ...data.memory };
  } catch (err) {
    logger.error('Supabase fetch error', err);
    return { ...DEFAULT_MEMORY };
  }
}

async function updateLongTermMemory(userId, newMemoryData) {
  try {
    const current = await getLongTermMemory(userId);
    
    const updated = {
      name: (newMemoryData.name && newMemoryData.name.trim()) ? newMemoryData.name.trim() : current.name,
      nickname: (newMemoryData.nickname && newMemoryData.nickname.trim()) ? newMemoryData.nickname.trim() : current.nickname,
      preferredLanguage: (newMemoryData.preferredLanguage && newMemoryData.preferredLanguage.trim()) ? newMemoryData.preferredLanguage.trim() : current.preferredLanguage,
      occupation: (newMemoryData.occupation && newMemoryData.occupation.trim()) ? newMemoryData.occupation.trim() : current.occupation,
      location: (newMemoryData.location && newMemoryData.location.trim()) ? newMemoryData.location.trim() : current.location,
      likes: cleanAndUniqueArray([...current.likes, ...(newMemoryData.likes || [])]),
      dislikes: cleanAndUniqueArray([...current.dislikes, ...(newMemoryData.dislikes || [])]),
      relationships: cleanAndUniqueArray([...current.relationships, ...(newMemoryData.relationships || [])]),
      personalityNotes: cleanAndUniqueArray([...current.personalityNotes, ...(newMemoryData.personalityNotes || [])])
    };

    const { error } = await supabase
      .from('user_memory')
      .upsert({
        user_id: userId,
        memory: updated,
        updated_at: new Date().toISOString()
      });

    if (error) {
      logger.error('Supabase update error', error);
    }
  } catch (err) {
    logger.error('Supabase update exception', err);
  }
}

function formatMemoryForPrompt(memory) {
  const lines = [];
  if (memory.name) lines.push(`Name: ${memory.name}`);
  if (memory.nickname) lines.push(`Nickname: ${memory.nickname}`);
  if (memory.preferredLanguage && memory.preferredLanguage !== 'auto') lines.push(`Language: ${memory.preferredLanguage}`);
  if (memory.occupation) lines.push(`Occupation: ${memory.occupation}`);
  if (memory.location) lines.push(`Location: ${memory.location}`);
  if (memory.likes && memory.likes.length > 0) lines.push(`Likes: ${memory.likes.join(', ')}`);
  if (memory.dislikes && memory.dislikes.length > 0) lines.push(`Dislikes: ${memory.dislikes.join(', ')}`);
  if (memory.relationships && memory.relationships.length > 0) lines.push(`Relationships: ${memory.relationships.join(', ')}`);
  if (memory.personalityNotes && memory.personalityNotes.length > 0) lines.push(`Notes: ${memory.personalityNotes.join(', ')}`);
  
  return lines.length > 0 ? lines.join('\n') : 'None';
}

function getShortTermMemory(userId) {
  if (!shortTermCache.has(userId)) {
    shortTermCache.set(userId, []);
  }
  return shortTermCache.get(userId);
}

function addShortTermMessage(userId, role, content) {
  const history = getShortTermMemory(userId);
  history.push({ role, content });
  if (history.length > MAX_SHORT_TERM) {
    history.shift();
  }
}

module.exports = {
  getLongTermMemory,
  updateLongTermMemory,
  formatMemoryForPrompt,
  getShortTermMemory,
  addShortTermMessage
};
