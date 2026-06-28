import jwt from 'jsonwebtoken';

export function signToken(userId, secret, expiresIn) {
  return jwt.sign({ sub: String(userId) }, secret, { expiresIn });
}

export function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}
