// /server/app.js
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');

const chatRoutes   = require('./routes/chat');
const healthRoutes = require('./routes/health');

const app = express();

// ───────────────────────── Security headers
app.disable('x-powered-by');
app.use(helmet());

// ───────────────────────── CORS (env allow‑list)
// CORS_ORIGIN can be a comma‑separated list of origins.
// Behavior:
//  - If the request has no Origin header (non‑browser / tests / webhooks): allow (no CORS header needed).
//  - If the request has an Origin: allow only if it is in the allow‑list.
//  - Preflight (OPTIONS) succeeds only for allowed origins (handled by cors middleware when allowed).
function parseAllowedOrigins(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.CORS_ORIGIN);

const corsConfig = {
  origin(origin, cb) {
    // Allow requests without an Origin header (non‑browser)
    if (!origin) return cb(null, true);
    // Allow only listed origins when Origin is present
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    // Deny others by default (no headers, no error → avoids 500s on disallowed preflights)
    return cb(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsConfig));
// NOTE: Do NOT register app.options('*', ...) on Express 5 (path-to-regexp no longer accepts '*').
// Preflight for allowed origins is handled by the cors middleware above.

// ───────────────────────── Parsers
app.use(express.json());

// ───────────────────────── Routes
app.get('/', (_req, res) => res.send('Nutri-GPT assistant is running'));
app.use('/api', healthRoutes);      // /api/healthz
app.use('/api/chat', chatRoutes);   // chat router handles its own auth/validation

// Export only the app (index.js starts the listener)
module.exports = app;
