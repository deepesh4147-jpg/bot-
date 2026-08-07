const express = require('express');
const originalExpress = express;

// Intercept Express instantiation to inject custom middleware layer and route mappings
const wrappedExpress = () => {
    const app = originalExpress();
    
    // 1. Handshake Endpoint for UptimeRobot
    app.get('/', (req, res) => {
        res.status(200).send('Independent uptime server is active!');
    });

    // 2. Safe Webhook Payloads Normalization Interceptor
    // Resolves Meta OAuthException error code #100 by validating real user IDs
    app.use('/webhook', (req, res, next) => {
        if (req.method === 'POST' && req.body && req.body.entry) {
            try {
                req.body.entry.forEach(entry => {
                    // Check if the entry object contains nested messaging arrays
                    if (entry.messaging && Array.isArray(entry.messaging) && entry.messaging[0]) {
                        const messagingEvent = entry.messaging[0];
                        
                        // Overwrite entry.id with the real customer sender.id if your handlers read top-level fields
                        if (messagingEvent.sender && messagingEvent.sender.id) {
                            entry.id = messagingEvent.sender.id;
                        }
                    }
                });
            } catch (err) {
                console.error("Payload interceptor normalization error bypassed:", err);
            }
        }
        next(); // Hand control back over over to server.js safely
    });
    
    return app;
};

// Copy static operational attributes across dependencies 
Object.assign(wrappedExpress, originalExpress);
require.cache[require.resolve('express')].exports = wrappedExpress;

// Initialize your unchanged server stack cleanly
console.log("Launching core application server environment with payload patches...");
require('./server.js');
