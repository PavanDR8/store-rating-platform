const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { listOptions, paginationMeta } = require('../utils/query');

const RATING_SORT = { name: 'u.name', email: 'u.email', rating: 'r.rating', date: 'r.updated_at' };

// GET /api/owner/dashboard?sortBy=&order=&page=&limit=
// The store is looked up from the logged-in owner's id, so an owner can never read another store.
exports.dashboard = asyncHandler(async (req, res) => {
  const opts = listOptions(req.query, RATING_SORT, 'date', 'desc');

  const storeResult = await query(
    `SELECT s.id, s.name, s.email, s.address,
            ROUND(AVG(r.rating), 2)::float8 AS avg_rating, COUNT(r.id)::int AS rating_count
       FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
      WHERE s.owner_id = $1 GROUP BY s.id`,
    [req.user.id]
  );
  const store = storeResult.rows[0];
  if (!store) throw new ApiError(404, 'No store is linked to your account yet. Please contact an administrator');

  const { rows } = await query(
    `SELECT r.id, u.name AS user_name, u.email AS user_email, r.rating, r.created_at, r.updated_at
       FROM ratings r JOIN users u ON u.id = r.user_id
      WHERE r.store_id = $1
      ORDER BY ${opts.orderSql}, r.id ASC
      LIMIT $2 OFFSET $3`,
    [store.id, opts.limit, opts.offset]
  );
  ok(res, { store, ratings: rows }, { pagination: paginationMeta(store.rating_count, opts) });
});
