
const express = require('express');

const chatRoutes   = require('./routes/chat');
const healthRoutes = require('./routes/health');

const app = express();

// Middleware
app.use(express.json());

// Root route for health check
app.get('/', (_req, res) => res.send('Nutri-GPT assistant is running'));

// Routes
app.use('/api', healthRoutes);
app.use('/api/chat', chatRoutes);

module.exports = app;   // ◀── ONLY the app
