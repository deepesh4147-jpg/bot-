const express = require('express');
const config = require('./config');
const { logger } = require('./utils');
const { handleWebhookEvent } = require('./instagram');

const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === config.verifyToken) {
      logger.info('Webhook verified successfully.');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

app.post('/webhook', async (req, res) => {
  // Respond to Meta instantly (200 OK) so their API doesn't time out waiting
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;

    // Extract the customer ID safely from the incoming payload
    let customerId = null;
    if (body.entry && body.entry[0] && body.entry[0].messaging && body.entry[0].messaging[0]) {
      customerId = body.entry[0].messaging[0].sender.id;
    }

    // Wait exactly 30 seconds before passing the message to the AI chatbot pipeline
    console.log(`[DELAY] Holding bot response for 30 seconds for user ${customerId || 'unknown'}...`);
    
    setTimeout(async () => {
      // After 30 seconds, double-check if you replied manually in the meantime
      if (customerId && global.agentPauses && global.agentPauses.has(customerId)) {
        const lastReplyTime = global.agentPauses.get(customerId);
        const timePassed = Date.now() - lastReplyTime;
        const twoMinutes = 2 * 60 * 1000;

        if (timePassed < twoMinutes) {
          console.log(`[CANCELLED] Manual reply detected during the 30s delay window. Bot cancelled for user ${customerId}.`);
          return; // Stop execution! The bot will not reply.
        }
      }

      // If you didn't reply within 30 seconds, run the bot normally!
      await handleWebhookEvent(body);
    }, 30000); // 30,000 milliseconds = 30 seconds

  } catch (err) {
    logger.error('Error scheduling delayed webhook event', err);
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});
