
/**
 * Simple Bearer‑token auth middleware.
 * Exposes req.user = { id: 'demo' } if the token matches process.env.AUTH_TOKEN.
 * Otherwise responds 401 JSON { error: 'UNAUTHENTICATED' }.
 */
module.exports = function auth (req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const [, token] = hdr.split(' ');
    if (token && token === process.env.AUTH_TOKEN) {
      req.user = { id: 'demo' };
      return next();
    }
    return res.status(401).json({ error: 'UNAUTHENTICATED' });
  } catch (err) {
    return res.status(401).json({ error: 'UNAUTHENTICATED' });
  }
};
