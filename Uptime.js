const express = require('express');
const app = express();
// Uses a different default port if 3000 is taken by your main server
const PORT = process.env.PORT || 3001; 

app.get('/', (req, res) => {
    res.status(200).send('Independent uptime server is active!');
});

app.listen(PORT, () => {
    console.log(`Uptime pinger running on port ${PORT}`);
});
