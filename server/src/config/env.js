import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load server/.env regardless of the working directory the process started in.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, '../../.env') });

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/prospera',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  // Mistral AI (optional). When MISTRAL_API_KEY is unset, AI features are disabled
  // and the app falls back to the deterministic keyword heuristic.
  mistralApiKey: process.env.MISTRAL_API_KEY || '',
  mistralModel: process.env.MISTRAL_MODEL || 'mistral-small-latest',
  mistralOcrModel: process.env.MISTRAL_OCR_MODEL || 'mistral-ocr-latest',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  isProd: process.env.NODE_ENV === 'production',
};

// Fail fast on misconfiguration that would make auth insecure or broken.
export function assertConfig() {
  if (!config.jwtSecret || config.jwtSecret === 'replace-with-a-long-random-secret') {
    throw new Error('JWT_SECRET is missing or still the placeholder. Set a strong secret in server/.env.');
  }
  if (config.jwtSecret.length < 16) {
    throw new Error('JWT_SECRET is too short — use at least 32 random characters.');
  }
}
