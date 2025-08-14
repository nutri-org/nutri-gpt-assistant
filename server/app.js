// /server/app.js
// Canonical middleware order (Instruction Box):
// raw webhook parsers → helmet → cors → parsers (json/urlencoded) → auth → rateLimit → validate → quota → handler → error
// IMPORTANT for Stripe: the webhook (raw) must be mounted BEFORE any body parsers, helmet, or cors.

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');

// Routes
const billingRoutes = require('./routes/billing');
const chatRoutes    = require('./routes/chat');
const healthRoutes  = require('./routes/health');

const app = express();

// ───────────────────────── Stripe Webhook (RAW) — must come FIRST
// Mount BEFORE helmet(), cors(), and any body parsers so the raw body is preserved for signature verification.
app.use('/api/billing', billingRoutes);

// ───────────────────────── Security headers
app.disable('x-powered-by');
app.use(helmet());

// ───────────────────────── CORS (env allow‑list)
// Requests without an Origin header (tests, curl, webhooks) are allowed.
// Browsers with an Origin not in the allow-list are blocked.
const allowList = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsConfig = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // allow non-browser / server-to-server
    if (allowList.length === 0) {
      // No allow-list configured; safest default is to reject unknown browser origins.
      return cb(new Error('CORS: origin not allowed'), false);
    }
    if (allowList.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: origin not allowed'), false);
  }
  // NOTE: Do NOT register app.options('*', ...) on Express 5; cors() handles preflight for allowed origins.
};

app.use(cors(corsConfig));

// ───────────────────────── Parsers
app.use(express.json());

// ───────────────────────── Routes
app.get('/', (_req, res) => res.send('Nutri-GPT assistant is running'));
app.use('/api', healthRoutes);      // e.g., /api/healthz
app.use('/api/chat', chatRoutes);   // chat router handles its own auth/validation

// Export only the app (index.js starts the listener)
module.exports = app;
