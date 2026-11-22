const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { pool } = require('./config/db');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

if (!env.jwtSecret) {
  console.error('JWT_SECRET is missing. Copy backend/.env.example to backend/.env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: env.clientUrl.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '100kb' }));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log(`Connected to PostgreSQL database "${env.db.database}"`);
  } catch (err) {
    console.error(`Could not connect to PostgreSQL: ${err.message}`);
    console.error('Check backend/.env and make sure PostgreSQL is running and `npm run db:setup` was done.');
    process.exit(1);
  }
  app.listen(env.port, () => console.log(`Rollex API running on http://localhost:${env.port}/api`));
}

start();
