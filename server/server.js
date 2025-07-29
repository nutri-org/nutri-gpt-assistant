
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

// Export the app for tests; start the listener only
// when this file is executed directly from `node`.
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
