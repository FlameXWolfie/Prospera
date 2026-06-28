const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Requiring `typeof === 'string'` also neutralises object payloads like
// {"$gt":""} that could otherwise reach a query (NoSQL-injection defence).
export function validateSignup({ name, email, password } = {}) {
  const errors = {};
  if (typeof name !== 'string' || !name.trim()) errors.name = 'Name is required.';
  else if (name.trim().length > 80) errors.name = 'Name must be 80 characters or fewer.';
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (typeof password !== 'string' || password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (password.length > 200) errors.password = 'Password is too long.';
  return errors;
}

export function validateLogin({ email, password } = {}) {
  const errors = {};
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (typeof password !== 'string' || !password) errors.password = 'Password is required.';
  return errors;
}
