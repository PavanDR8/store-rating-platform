const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, address: u.address, role: u.role });

// POST /api/auth/signup  - public sign-up always creates a normal USER (role is never taken from the request)
exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password, address } = req.validated;
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (name, email, password, address, role)
     VALUES ($1, $2, $3, $4, 'USER') RETURNING id, name, email, address, role`,
    [name, email, hash, address]
  );
  ok(res, publicUser(rows[0]), { message: 'Account created successfully' }, 201);
});

// POST /api/auth/login  - same endpoint for ADMIN, USER and STORE_OWNER
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated;
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) throw new ApiError(401, 'Invalid email or password');

  const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  ok(res, { token, user: publicUser(user) }, { message: 'Logged in successfully' });
});

// PATCH /api/auth/update-password
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validated;
  const { rows } = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);

  if (!(await bcrypt.compare(currentPassword, rows[0].password))) {
    throw new ApiError(400, 'Current password is incorrect', { currentPassword: 'Current password is incorrect' });
  }
  if (currentPassword === newPassword) {
    throw new ApiError(400, 'New password must be different', { newPassword: 'New password must be different from the current one' });
  }
  await query('UPDATE users SET password = $1 WHERE id = $2', [await bcrypt.hash(newPassword, 10), req.user.id]);
  ok(res, null, { message: 'Password updated successfully' });
});
