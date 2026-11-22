const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// 1) Verify the JWT, 2) reload the user from the database so the role is never trusted from the client.
const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired token. Please log in again');
  }

  const { rows } = await query('SELECT id, name, email, address, role FROM users WHERE id = $1', [payload.id]);
  if (!rows[0]) throw new ApiError(401, 'Account no longer exists');
  req.user = rows[0];
  next();
});

// Role-based access: authorize('ADMIN') or authorize('ADMIN', 'USER')
const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : next(new ApiError(403, 'You do not have permission to access this resource'));

module.exports = { authenticate, authorize };
