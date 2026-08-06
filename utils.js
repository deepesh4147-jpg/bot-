const logger = {
  info: (msg, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, Object.keys(meta).length ? meta : '');
  },
  error: (msg, err = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err.message || err);
  },
  warn: (msg, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, Object.keys(meta).length ? meta : '');
  }
};

function sanitizeText(text) {
  if (!text) return '';
  return text.trim().substring(0, 1000);
}

function cleanAndUniqueArray(arr) {
  if (!Array.isArray(arr)) return [];
  const cleaned = arr
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(item => item.length > 0);
  
  const seen = new Map();
  for (const item of cleaned) {
    const lower = item.toLowerCase();
    if (!seen.has(lower) || item === item.toUpperCase()) {
      seen.set(lower, item);
    }
  }
  return Array.from(seen.values());
}

async function retryWithBackoff(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    logger.warn(`Operation failed, retrying in ${delay}ms... Error: ${err.message}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

function shouldExtractMemory(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const triggers = [
    'my name is', 'i am ', "i'm ", 'i like', 'i love', 'i hate', 'i work',
    'i live', 'i study', 'my favorite', 'i play', 'i enjoy', 'i do not like',
    'call me', 'sup my name', 'myself'
  ];
  return triggers.some(t => lower.includes(t));
}

module.exports = {
  logger,
  sanitizeText,
  cleanAndUniqueArray,
  retryWithBackoff,
  shouldExtractMemory
};
