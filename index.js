const express = require('express');
const originalExpress = express;

// Intercept Express app creation to automatically inject the missing root path
const wrappedExpress = () => {
    const app = originalExpress();
    
    // This answers UptimeRobot on the root URL path
    app.get('/', (req, res) => {
        res.status(200).send('Independent uptime server is active!');
    });
    
    return app;
};

// Copy required configuration properties from original Express instance
Object.assign(wrappedExpress, originalExpress);
require.cache[require.resolve('express')].exports = wrappedExpress;

// Launch your untouched server.js file safely on the correct single port
require('./server.js');
