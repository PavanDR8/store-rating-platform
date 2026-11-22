const bcrypt = require('bcryptjs');
const env = require('../../src/config/env');

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;

// Creates the default administrator from ADMIN_* values in backend/.env (skips if the email already exists).
async function seedAdmin(client) {
  const { name, email, password, address } = env.admin;
  if (!name || !email || !password || !address) {
    throw new Error('ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_ADDRESS must be set in backend/.env');
  }
  if (name.length < 20 || name.length > 60) throw new Error('ADMIN_NAME must be 20-60 characters');
  if (!PASSWORD_REGEX.test(password)) {
    throw new Error('ADMIN_PASSWORD must be 8-16 chars with at least one uppercase letter and one special character');
  }

  const hash = await bcrypt.hash(password, 10);
  const { rowCount } = await client.query(
    `INSERT INTO users (name, email, password, address, role)
     VALUES ($1, $2, $3, $4, 'ADMIN')
     ON CONFLICT (email) DO NOTHING`,
    [name, email, hash, address]
  );
  console.log(rowCount ? `Admin created: ${email}` : `Admin already exists, skipped: ${email}`);
}

module.exports = { seedAdmin };
