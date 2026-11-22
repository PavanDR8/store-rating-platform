const path = require('path');
// Always load backend/.env, no matter which folder the command is run from.
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD ?? ''),
    database: process.env.DB_NAME || 'store_rating_platform',
    ssl: ['localhost', '127.0.0.1'].includes(process.env.DB_HOST)
  ? false
  : { rejectUnauthorized: false },
  },
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  admin: {
    name: process.env.ADMIN_NAME,
    email: (process.env.ADMIN_EMAIL || '').toLowerCase(),
    password: process.env.ADMIN_PASSWORD,
    address: process.env.ADMIN_ADDRESS,
  },
};

module.exports = env;
