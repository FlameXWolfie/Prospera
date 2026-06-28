// Thin Mistral AI client. The API key lives ONLY on the server (config from
// MISTRAL_API_KEY) so it is never exposed to the browser. Uses Node's global
// fetch (Node 18+). Callers should treat AI as optional — `mistralEnabled()`
// gates it, and features fall back to the deterministic heuristic when it is off.
import { config } from '../config/env.js';

const API_URL = 'https://api.mistral.ai/v1/chat/completions';
const OCR_URL = 'https://api.mistral.ai/v1/ocr';

export function mistralEnabled() {
  return Boolean(config.mistralApiKey);
}

// Extract text (markdown) from a document via Mistral OCR — handles real PDFs,
// including scanned/image-only ones. `dataUri` is a base64 data URL.
export async function mistralOcr(dataUri, { image = false } = {}) {
  if (!mistralEnabled()) {
    const err = new Error('Mistral API key not configured.');
    err.code = 'ai_disabled';
    err.status = 503;
    throw err;
  }
  const document = image
    ? { type: 'image_url', image_url: dataUri }
    : { type: 'document_url', document_url: dataUri };
  let res;
  try {
    res = await fetch(OCR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.mistralApiKey}` },
      body: JSON.stringify({ model: config.mistralOcrModel, document, include_image_base64: false }),
    });
  } catch {
    const err = new Error('Could not reach the Mistral OCR API.');
    err.status = 502;
    throw err;
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(`Mistral OCR error (${res.status}).`);
    err.status = res.status === 401 ? 500 : 502;
    err.detail = detail.slice(0, 400);
    throw err;
  }
  let data;
  try {
    data = await res.json();
  } catch {
    const err = new Error('Mistral OCR returned invalid JSON.');
    err.status = 502;
    throw err;
  }
  const pages = Array.isArray(data.pages) ? data.pages : [];
  return pages.map((p) => (p && typeof p.markdown === 'string' ? p.markdown : '')).join('\n\n').trim();
}

export async function mistralChat(messages, { json = false, temperature = 0.3, maxTokens = 1400 } = {}) {
  if (!mistralEnabled()) {
    const err = new Error('Mistral API key not configured.');
    err.code = 'ai_disabled';
    err.status = 503;
    throw err;
  }
  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.mistralApiKey}`,
      },
      body: JSON.stringify({
        model: config.mistralModel,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
  } catch (cause) {
    const err = new Error('Could not reach the Mistral API.');
    err.status = 502;
    throw err;
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(`Mistral API error (${res.status}).`);
    // Don't leak the upstream key/errors to the client; log-only detail.
    err.status = res.status === 401 ? 500 : 502;
    err.detail = detail.slice(0, 400);
    throw err;
  }
  let data;
  try {
    data = await res.json();
  } catch {
    const err = new Error('Mistral API returned invalid JSON.');
    err.status = 502;
    throw err;
  }
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

// Chat that must return a JSON object. Robust to the model wrapping JSON in prose.
export async function mistralJSON(messages, opts) {
  const content = await mistralChat(messages, { ...opts, json: true });
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    const err = new Error('AI returned an unexpected response.');
    err.status = 502;
    throw err;
  }
}
