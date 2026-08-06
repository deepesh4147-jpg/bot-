require('dotenv').config();

const requiredEnv = [
  'GROQ_API_KEY',
  'PAGE_ACCESS_TOKEN',
  'VERIFY_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`[Config] Error: Environment variable ${env} is missing.`);
    process.exit(1);
  }
}

module.exports = {
  port: process.env.PORT || 3000,
  groqApiKey: process.env.GROQ_API_KEY,
  pageAccessToken: process.env.PAGE_ACCESS_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  renderExternalUrl: process.env.RENDER_EXTERNAL_URL || null
};
