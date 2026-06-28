export function notFound(req, res) {
  res.status(404).json({ error: 'Not found.' });
}

// Central error handler. Never leak internals to the client on a 500.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Duplicate key (e.g. racing signups on the same email)
  if (err && err.code === 11000) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }
  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err);
  return res.status(status).json({ error: status === 500 ? 'Something went wrong.' : err.message });
}
