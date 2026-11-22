const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { escapeLike, parseId, listOptions, paginationMeta } = require('../utils/query');
const { ROLES } = require('../validators/schemas');

// allowed sortBy value -> SQL column (nothing else can reach the ORDER BY clause)
const USER_SORT = { name: 'u.name', email: 'u.email', address: 'u.address', role: 'u.role', rating: 'rating', created_at: 'u.created_at' };
const STORE_SORT = {
  name: 's.name', email: 's.email', address: 's.address',
  avg_rating: 'avg_rating', rating_count: 'rating_count', created_at: 's.created_at',
};

// GET /api/admin/dashboard
exports.dashboard = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT (SELECT COUNT(*) FROM users)::int   AS total_users,
            (SELECT COUNT(*) FROM stores)::int  AS total_stores,
            (SELECT COUNT(*) FROM ratings)::int AS total_ratings`
  );
  ok(res, rows[0]);
});

// POST /api/admin/users  - create USER, ADMIN or STORE_OWNER
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, address, role } = req.validated;
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (name, email, password, address, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role, created_at`,
    [name, email, hash, address, role]
  );
  ok(res, rows[0], { message: 'User created successfully' }, 201);
});

// POST /api/admin/stores  - create a store and link (or create) its owner inside ONE transaction
exports.createStore = asyncHandler(async (req, res) => {
  const { name, email, address, ownerId, owner } = req.validated;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let finalOwnerId = ownerId;
    if (ownerId) {
      const found = await client.query('SELECT id, role FROM users WHERE id = $1 FOR UPDATE', [ownerId]);
      if (!found.rows[0]) throw new ApiError(404, 'Selected owner does not exist', { ownerId: 'Owner not found' });
      if (found.rows[0].role !== 'STORE_OWNER') {
        throw new ApiError(400, 'Selected user is not a store owner', { ownerId: 'Selected user is not a store owner' });
      }
      const has = await client.query('SELECT 1 FROM stores WHERE owner_id = $1', [ownerId]);
      if (has.rowCount) throw new ApiError(409, 'This owner already has a store', { ownerId: 'This owner already has a store' });
    } else {
      const hash = await bcrypt.hash(owner.password, 10);
      const created = await client.query(
        `INSERT INTO users (name, email, password, address, role)
         VALUES ($1, $2, $3, $4, 'STORE_OWNER') RETURNING id`,
        [owner.name, owner.email, hash, owner.address]
      );
      finalOwnerId = created.rows[0].id;
    }

    const store = await client.query(
      `INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, address, owner_id, created_at`,
      [name, email, address, finalOwnerId]
    );
    await client.query('COMMIT');
    ok(res, store.rows[0], { message: 'Store created successfully' }, 201);
  } catch (err) {
    await client.query('ROLLBACK'); // owner + store: both saved or both undone
    if (err.code === '23505' && String(err.constraint).startsWith('stores_email')) {
      throw new ApiError(409, 'A store with this email already exists', { email: 'A store with this email already exists' });
    }
    if (err.code === '23505' && String(err.constraint).startsWith('users_email') && owner) {
      throw new ApiError(409, 'The owner email is already registered', { 'owner.email': 'This email is already registered' });
    }
    throw err;
  } finally {
    client.release();
  }
});

// GET /api/admin/users?search=&role=&sortBy=&order=&page=&limit=
exports.listUsers = asyncHandler(async (req, res) => {
  const opts = listOptions(req.query, USER_SORT, 'name');
  const where = [];
  const params = [];

  if (opts.search) {
    params.push(`%${escapeLike(opts.search)}%`);
    where.push(`(u.name ILIKE $1 OR u.email ILIKE $1 OR u.address ILIKE $1)`);
  }
  if (req.query.role) {
    if (!ROLES.includes(req.query.role)) throw new ApiError(400, 'Invalid role filter');
    params.push(req.query.role);
    where.push(`u.role = $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (await query(`SELECT COUNT(*)::int AS n FROM users u ${whereSql}`, params)).rows[0].n;
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
            (SELECT ROUND(AVG(r.rating), 2)::float8 FROM stores s JOIN ratings r ON r.store_id = s.id
              WHERE s.owner_id = u.id) AS rating
       FROM users u ${whereSql}
      ORDER BY ${opts.orderSql}, u.id ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, opts.limit, opts.offset]
  );
  ok(res, rows, { pagination: paginationMeta(total, opts) });
});

// GET /api/admin/users/:id  - details; store owners also get their store and its average rating
exports.getUser = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await query(
    'SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  if (!rows[0]) throw new ApiError(404, 'User not found');

  const user = rows[0];
  if (user.role === 'STORE_OWNER') {
    const store = await query(
      `SELECT s.id, s.name, s.email, s.address,
              ROUND(AVG(r.rating), 2)::float8 AS avg_rating, COUNT(r.id)::int AS rating_count
         FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
        WHERE s.owner_id = $1 GROUP BY s.id`,
      [id]
    );
    user.store = store.rows[0] || null;
  }
  ok(res, user);
});

// GET /api/admin/stores?search=&sortBy=&order=&page=&limit=
exports.listStores = asyncHandler(async (req, res) => {
  const opts = listOptions(req.query, STORE_SORT, 'name');
  const params = [];
  let whereSql = '';
  if (opts.search) {
    params.push(`%${escapeLike(opts.search)}%`);
    whereSql = 'WHERE (s.name ILIKE $1 OR s.email ILIKE $1 OR s.address ILIKE $1)';
  }

  const total = (await query(`SELECT COUNT(*)::int AS n FROM stores s ${whereSql}`, params)).rows[0].n;
  const { rows } = await query(
    `SELECT s.id, s.name, s.email, s.address, s.created_at, s.owner_id, o.name AS owner_name,
            ROUND(AVG(r.rating), 2)::float8 AS avg_rating, COUNT(r.id)::int AS rating_count
       FROM stores s
       JOIN users o ON o.id = s.owner_id
       LEFT JOIN ratings r ON r.store_id = s.id
       ${whereSql}
      GROUP BY s.id, o.name
      ORDER BY ${opts.orderSql}, s.id ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, opts.limit, opts.offset]
  );
  ok(res, rows, { pagination: paginationMeta(total, opts) });
});

// GET /api/admin/owners  - store owners who do not have a store yet (used by the "Add store" form)
exports.availableOwners = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email FROM users u
      WHERE u.role = 'STORE_OWNER' AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.owner_id = u.id)
      ORDER BY u.name`
  );
  ok(res, rows);
});
