/*
 * Database helper. Usage (from backend/ folder or via root npm scripts):
 *   node database/setup.js all      -> create database if missing + run migrations + seed admin
 *   node database/setup.js migrate  -> run pending migrations only
 *   node database/setup.js seed     -> seed default admin only
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const env = require('../src/config/env');
const { seedAdmin } = require('./seeds/seed');

async function ensureDatabase() {
  const admin = new Client({ ...env.db, database: 'postgres' });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [env.db.database]);
  if (!rowCount) {
    await admin.query(`CREATE DATABASE "${env.db.database.replace(/"/g, '""')}"`);
    console.log(`Database created: ${env.db.database}`);
  } else {
    console.log(`Database exists: ${env.db.database}`);
  }
  await admin.end();
}

async function migrate(client) {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const done = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
    if (done.rowCount) {
      console.log(`Migration already applied: ${file}`);
      continue;
    }
    await client.query('BEGIN');
    try {
      await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`Migration applied: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }
}

async function main() {
  const mode = process.argv[2] || 'all';
  if (!['all', 'migrate', 'seed'].includes(mode)) throw new Error('Use: all | migrate | seed');
  if (mode === 'all') await ensureDatabase();

  const client = new Client(env.db);
  await client.connect();
  try {
    if (mode === 'all' || mode === 'migrate') await migrate(client);
    if (mode === 'all' || mode === 'seed') await seedAdmin(client);
  } finally {
    await client.end();
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error('\nDatabase setup failed:', err.message);
  if (err.code === 'ECONNREFUSED') console.error('-> PostgreSQL is not running or DB_HOST/DB_PORT is wrong.');
  if (err.code === '28P01') console.error('-> Wrong DB_USER / DB_PASSWORD in backend/.env.');
  process.exit(1);
});
