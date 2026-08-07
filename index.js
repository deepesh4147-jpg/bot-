const express = require('express');
const originalExpress = express;

const wrappedExpress = () => {
    const app = originalExpress();
    
    // 1. Handshake Uptime Endpoint
    app.get('/', (req, res) => {
        res.status(200).send('Independent uptime server is active!');
    });

    // 2. Safe Webhook Normalization Interceptor (Filter Echo Events)
    app.use('/webhook', (req, res, next) => {
        if (req.method === 'POST' && req.body && req.body.entry) {
            try {
                req.body.entry.forEach(entry => {
                    if (entry.messaging && Array.isArray(entry.messaging)) {
                        // Filter out any events that are echoes from your own page
                        entry.messaging = entry.messaging.filter(messagingEvent => {
                            // If the event message object has is_echo: true, drop it
                            if (messagingEvent.message && messagingEvent.message.is_echo) {
                                return false;
                            }
                            // If the message has no actual text or media content from a user, drop it
                            if (!messagingEvent.message) {
                                return false;
                            }
                            return true;
                        });
                    }
                });
            } catch (err) {
                console.error("Payload interceptor filter error bypassed safely:", err);
            }
        }
        next(); // Send cleanly down to your core server.js listeners
    });
    
    return app;
};

Object.assign(wrappedExpress, originalExpress);
require.cache[require.resolve('express')].exports = wrappedExpress;

console.log("Launching core application server environment with rigid echo filters...");
require('./server.js');
