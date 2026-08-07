const express = require('express');
const originalExpress = express;

// In-memory store to track user pause timestamps
global.agentPauses = new Map();
// Your permanent Instagram Business Page ID (Will never change)
global.MY_PAGE_ID = "17841418138822870"; 

const wrappedExpress = () => {
    const app = originalExpress();
    
    // 1. Handshake Endpoint for UptimeRobot
    app.get('/', (req, res) => {
        res.status(200).send('Independent uptime server is active with precise loop filters!');
    });

    // 2. Webhook Interceptor (Page ID Filter & 2-Minute Bot Pause Tracker)
    app.use('/webhook', (req, res, next) => {
        if (req.method === 'POST' && req.body && req.body.entry) {
            try {
                req.body.entry.forEach(entry => {
                    if (entry.messaging && Array.isArray(entry.messaging)) {
                        
                        // Check if a manual reply was sent by you to activate/reset the 2-minute pause
                        entry.messaging.forEach(msg => {
                            if ((msg.sender && msg.sender.id === global.MY_PAGE_ID) || (msg.message && msg.message.is_echo)) {
                                const customerId = msg.recipient ? msg.recipient.id : null;
                                if (customerId && customerId !== global.MY_PAGE_ID) {
                                    global.agentPauses.set(customerId, Date.now());
                                    console.log(`[PAUSE] Manual reply detected. Bot paused for user ${customerId} for 2 mins.`);
                                }
                            }
                        });

                        // Filter out loop-causing echo events before they hit server.js
                        entry.messaging = entry.messaging.filter(msg => {
                            if (msg.sender && msg.sender.id === global.MY_PAGE_ID) return false;
                            if (msg.message && msg.message.is_echo) return false;

                            // Check if this customer is currently in the 2-minute manual chat pause window
                            const customerId = msg.sender ? msg.sender.id : null;
                            if (customerId && global.agentPauses.has(customerId)) {
                                const lastReplyTime = global.agentPauses.get(customerId);
                                const timePassed = Date.now() - lastReplyTime;
                                const twoMinutes = 2 * 60 * 1000;

                                if (timePassed < twoMinutes) {
                                    const secondsLeft = Math.round((twoMinutes - timePassed) / 1000);
                                    console.log(`[BLOCKED] Bot is paused for user ${customerId}. (${secondsLeft}s left).`);
                                    return false; 
                                } else {
                                    global.agentPauses.delete(customerId); 
                                }
                            }
                            return true; 
                        });
                    }
                });
            } catch (err) {
                console.error("Payload interceptor error:", err);
            }
        }
        next(); 
    });
    
    return app;
};

Object.assign(wrappedExpress, originalExpress);
require.cache[require.resolve('express')].exports = wrappedExpress;

console.log("Launching application server with queue delay filters...");
require('./server.js');
                                    
