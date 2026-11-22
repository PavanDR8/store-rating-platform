const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool(env.db);

pool.on('error', (err) => console.error('Unexpected PostgreSQL error:', err.message));

// Always use parameterized queries: query('SELECT * FROM users WHERE id = $1', [id])
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
