import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { validateSignup, validateLogin } from '../utils/validators.js';

// Pre-computed once at startup. Login always runs a bcrypt compare — against the
// real hash or this dummy — so response timing doesn't reveal whether an email
// exists or is password-less (Google-only).
const DUMMY_HASH = bcrypt.hashSync('prospera-timing-equalizer', 12);

function issueSession(res, user, config, status = 200) {
  const token = signToken(user._id.toString(), config.jwtSecret, config.jwtExpiresIn);
  res.status(status).json({ token, user: user.toSafeJSON() });
}

export function makeAuthController(config) {
  const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

  return {
    async signup(req, res, next) {
      try {
        const { name, email, password } = req.body || {};
        const errors = validateSignup({ name, email, password });
        if (Object.keys(errors).length) {
          return res.status(422).json({ error: 'Please fix the highlighted fields.', fields: errors });
        }
        const normEmail = String(email).toLowerCase().trim();
        const existing = await User.findOne({ email: normEmail });
        if (existing) {
          return res.status(409).json({ error: 'An account with this email already exists.', fields: { email: 'Email already in use.' } });
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ name: String(name).trim(), email: normEmail, passwordHash, provider: 'local' });
        return issueSession(res, user, config, 201);
      } catch (err) {
        return next(err);
      }
    },

    async login(req, res, next) {
      try {
        const { email, password } = req.body || {};
        const errors = validateLogin({ email, password });
        if (Object.keys(errors).length) {
          return res.status(422).json({ error: 'Please fix the highlighted fields.', fields: errors });
        }
        const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');
        // Always compare (real hash or dummy) → constant-ish time, no enumeration.
        const hash = user && user.passwordHash ? user.passwordHash : DUMMY_HASH;
        const ok = await bcrypt.compare(password, hash);
        // Same generic message whether the email is unknown, the account is
        // Google-only, or the password is wrong.
        if (!user || !user.passwordHash || !ok) {
          return res.status(401).json({ error: 'Incorrect email or password.' });
        }
        return issueSession(res, user, config);
      } catch (err) {
        return next(err);
      }
    },

    async google(req, res, next) {
      try {
        if (!googleClient) {
          return res.status(503).json({ error: 'Google sign-in is not configured on the server.' });
        }
        const { credential } = req.body || {};
        if (!credential) return res.status(400).json({ error: 'Missing Google credential.' });

        let payload;
        try {
          const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: config.googleClientId });
          payload = ticket.getPayload();
        } catch {
          return res.status(401).json({ error: 'Could not verify Google sign-in.' });
        }
        if (!payload || !payload.email || !payload.email_verified) {
          return res.status(401).json({ error: 'Your Google account email is not verified.' });
        }

        const email = payload.email.toLowerCase();
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name: payload.name || email.split('@')[0],
            email,
            googleId: payload.sub,
            avatar: payload.picture || '',
            provider: 'google',
          });
        } else if (!user.googleId) {
          // Link Google to an existing local account with the same (verified) email.
          user.googleId = payload.sub;
          if (!user.avatar && payload.picture) user.avatar = payload.picture;
          await user.save();
        }
        return issueSession(res, user, config);
      } catch (err) {
        return next(err);
      }
    },

    async me(req, res) {
      return res.json({ user: req.user.toSafeJSON() });
    },

    // JWTs are stateless; logout is handled client-side by discarding the token.
    // This endpoint exists so the client has a single place to call.
    async logout(req, res) {
      return res.json({ ok: true });
    },
  };
}
