import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

// Verifies the Bearer JWT and attaches the live user to req.user.
export function requireAuth(config) {
  return async function requireAuthMiddleware(req, res, next) {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
      if (!token) return res.status(401).json({ error: 'Not authenticated.' });

      const payload = verifyToken(token, config.jwtSecret);
      const user = await User.findById(payload.sub);
      if (!user) return res.status(401).json({ error: 'Account no longer exists.' });

      req.user = user;
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }
  };
}
