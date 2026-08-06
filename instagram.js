const config = require('./config');
const { logger } = require('./utils');
const { generateReply } = require('./ai');

async function sendInstagramMessage(recipientId, messageText) {
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${config.pageAccessToken}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: messageText }
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errData = await response.text();
      logger.error('Instagram API send error', errData);
    }
  } catch (err) {
    logger.error('Network failure sending IG message', err);
  }
}

async function handleWebhookEvent(body) {
  if (body.object === 'instagram') {
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging?.[0];
      if (webhookEvent && webhookEvent.sender && webhookEvent.message) {
        const senderId = webhookEvent.sender.id;
        const messageText = webhookEvent.message.text;

        if (messageText) {
          logger.info(`Received IG message from ${senderId}: ${messageText}`);
          const replyText = await generateReply(senderId, messageText);
          await sendInstagramMessage(senderId, replyText);
        }
      }
    }
  }
}

module.exports = {
  handleWebhookEvent
};
