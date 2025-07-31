
const jwt = require('jsonwebtoken');

module.exports = function auth(required = true) {
  return (req, res, next) => {
    const hdr = req.get('authorization') || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return required ? res.sendStatus(401) : next();

    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return res.sendStatus(401);
    }
  };
};
