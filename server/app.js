// /server/app.js
const express = require('express');

const chatRoutes = require('./routes/chat');
const healthRoutes = require('./routes/health');
const billingRoutes = require('./routes/billing');
const datasetsRoutes = require('./routes/datasets');
const settingsRoutes = require('./routes/settings');

// Use the root-level middleware (current project structure has middleware/ at repo root)
const auth = require('../middleware/auth');
const { errorHandler } = require('../middleware/error');

const app = express();

// Global middleware
// NOTE: We keep express.json() here for now to avoid behavioral changes in Task 1.
//       In Task 4 (Stripe webhook), we will carve out a raw body route for /api/billing/webhook.
app.use(express.json());

// Root route for basic ping
app.get('/', (_req, res) => res.send('Nutri-GPT assistant is running'));

// Routes
app.use('/api', healthRoutes); // exposes /api/healthz
app.use('/api/chat', chatRoutes);   // let the router handle its own auth/validation chain
app.use('/api/billing', billingRoutes);
app.use('/api/datasets', auth(), datasetsRoutes);
app.use('/api/assistant/settings', auth(), settingsRoutes);

// Centralized error handling
app.use(errorHandler);

// Export ONLY the app (tests import this)
module.exports = app;
