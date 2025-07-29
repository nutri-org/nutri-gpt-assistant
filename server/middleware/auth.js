
import jwt from 'jsonwebtoken';

export default function auth(required = true) {
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
}
