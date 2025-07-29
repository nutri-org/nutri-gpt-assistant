
/**
 * Bearer‑token JWT auth middleware (CommonJS).
 * Exposes req.user if token is valid, else 401.
 */
const jwt = require('jsonwebtoken');

module.exports = function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token  = header.replace(/^Bearer\s+/i, '');
    if (!token) {
      if (required) return res.status(401).json({ error: 'UNAUTHENTICATED' });
      return next();
    }
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return res.status(401).json({ error: 'UNAUTHENTICATED' });
    }
  };
};
