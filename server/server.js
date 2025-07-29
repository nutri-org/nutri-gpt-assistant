const express = require('express');
const chatRoutes = require('./routes/chat');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Root route for health check
app.get('/', (_req, res) => res.send('Nutri-GPT assistant is running'));

// Routes
app.use('/api', healthRoutes);
app.use('/api', chatRoutes);

// In tests we only import `app`.  In production we also start the listener.
let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

module.exports = { app, server };