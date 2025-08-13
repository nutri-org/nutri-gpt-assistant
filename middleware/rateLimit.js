// /middleware/rateLimit.js
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

function toPositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function makeLimiter({ windowMs, max }) {
  return rateLimit({
    windowMs,
    max,
    // Keep responses minimal; we explicitly set Retry-After ourselves.
    standardHeaders: false,
    legacyHeaders: false,

    // Key by user id when authenticated; otherwise use the IPv6-safe helper.
    keyGenerator: (req) => {
      if (req.user && req.user.id) return `u:${String(req.user.id)}`;
      // Fallback: derive a stable key from IP using the helper to avoid IPv6 bypass.
      return ipKeyGenerator(req.ip);
    },

    handler: (_req, res) => {
      // Express-rate-limit uses a fixed window; expose seconds remaining simply.
      res.set('Retry-After', Math.ceil(windowMs / 1000).toString());
      return res.status(429).json({ error: 'RATE_LIMIT' });
    },
  });
}

const chatWindowMs   = toPositiveInt(process.env.RATE_LIMIT_CHAT_WINDOW_MS,   60000);
const chatMax        = toPositiveInt(process.env.RATE_LIMIT_CHAT_MAX,         25);
const uploadWindowMs = toPositiveInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS, 60000);
const uploadMax      = toPositiveInt(process.env.RATE_LIMIT_UPLOAD_MAX,       10);

const chatLimiter   = makeLimiter({ windowMs: chatWindowMs,   max: chatMax });
const uploadLimiter = makeLimiter({ windowMs: uploadWindowMs, max: uploadMax });

module.exports = { chatLimiter, uploadLimiter };
