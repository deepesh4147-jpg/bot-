const express = require('express');
const originalExpress = express;

const wrappedExpress = () => {
    const app = originalExpress();
    
    // 1. Handshake Uptime Endpoint
    app.get('/', (req, res) => {
        res.status(200).send('Independent uptime server is active!');
    });

    // 2. Safe Webhook Normalization Interceptor (Fixed Array Iterator)
    app.use('/webhook', (req, res, next) => {
        if (req.method === 'POST' && req.body && req.body.entry) {
            try {
                req.body.entry.forEach(entry => {
                    // Check if messaging exists and is a valid Array
                    if (entry.messaging && Array.isArray(entry.messaging) && entry.messaging.length > 0) {
                        // Look at the first message item inside the array block safely
                        const primaryMessage = entry.messaging[0];
                        
                        if (primaryMessage && primaryMessage.sender && primaryMessage.sender.id) {
                            // Enforce mapping the true sender ID down to the entry property level
                            entry.id = primaryMessage.sender.id;
                        }
                    }
                });
            } catch (err) {
                console.error("Payload interceptor array parsing error bypassed safely:", err);
            }
        }
        next(); // Send cleanly down to your core server.js listeners
    });
    
    return app;
};

Object.assign(wrappedExpress, originalExpress);
require.cache[require.resolve('express')].exports = wrappedExpress;

console.log("Launching core application server environment with rigid payload checks...");
require('./server.js');
