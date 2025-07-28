const express = require('express');
const chatRoutes = require('./routes/chat');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Root route for Preview tab
app.get('/', (_req, res) => res.send('Nutri-GPT assistant is running'));

// Routes
app.use('/api', healthRoutes);
app.use('/api', chatRoutes);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;