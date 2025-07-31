const express = require('express');

const chatRoutes = require('./routes/chat');
const healthRoutes = require('./routes/health');
const billingRoutes = require('./routes/billing');
const datasetsRoutes = require('./routes/datasets');
const settingsRoutes = require('./routes/settings');

const auth = require('../middleware/auth');
const quota = require('../middleware/quota');

const app = express();

// Middleware
app.use(express.json());

// Root route for health check
app.get('/', (_req, res) => res.send('Nutri-GPT assistant is running'));

// Routes
app.use('/api', healthRoutes);
app.use('/api/chat', auth(), quota(), chatRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/datasets', auth(), datasetsRoutes);
app.use('/api/assistant/settings', auth(), settingsRoutes);

// Centralized error handling middleware
const { errorHandler } = require('../middleware/error');
app.use(errorHandler);

module.exports = { app };