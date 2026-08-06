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
  try {
    await handleWebhookEvent(req.body);
    res.status(200).send('EVENT_RECEIVED');
  } catch (err) {
    logger.error('Error handling webhook event', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});
