// /server/server.js
const app = require('./app');

// Re-export as { app } so index.js continues to work without changes
module.exports = { app };
