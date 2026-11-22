const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { escapeLike, listOptions, paginationMeta } = require('../utils/query');

const STORE_SORT = { name: 's.name', address: 's.address', avg_rating: 'avg_rating', my_rating: 'my_rating' };

// GET /api/user/stores?search=&sortBy=&order=&page=&limit=
// search matches store name OR address; each store includes overall average and the logged-in user's rating
exports.listStores = asyncHandler(async (req, res) => {
  const opts = listOptions(req.query, STORE_SORT, 'name');
  const params = [req.user.id];
  let whereSql = '';
  if (opts.search) {
    params.push(`%${escapeLike(opts.search)}%`);
    whereSql = 'WHERE (s.name ILIKE $2 OR s.address ILIKE $2)';
  }

  // the count query has no user-id parameter, so its search placeholder is $1 instead of $2
  const countSql = whereSql.replaceAll('$2', '$1');
  const total = (await query(`SELECT COUNT(*)::int AS n FROM stores s ${countSql}`, params.slice(1))).rows[0].n;
  const { rows } = await query(
    `SELECT s.id, s.name, s.address,
            ROUND(AVG(r.rating), 2)::float8 AS avg_rating,
            COUNT(r.id)::int AS rating_count,
            (SELECT mr.rating FROM ratings mr WHERE mr.store_id = s.id AND mr.user_id = $1) AS my_rating
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       ${whereSql}
      GROUP BY s.id
      ORDER BY ${opts.orderSql}, s.id ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, opts.limit, opts.offset]
  );
  ok(res, rows, { pagination: paginationMeta(total, opts) });
});

// POST /api/user/ratings  - submit a new rating or update the existing one (UPSERT, one row per user+store)
exports.submitRating = asyncHandler(async (req, res) => {
  const { storeId, rating } = req.validated;

  const store = await query('SELECT id FROM stores WHERE id = $1', [storeId]);
  if (!store.rows[0]) throw new ApiError(404, 'Store not found');

  const { rows } = await query(
    `INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, store_id)
     DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()
     RETURNING id, store_id, rating, created_at, updated_at, (xmax = 0) AS created`,
    [req.user.id, storeId, rating]
  );
  const { created, ...saved } = rows[0];
  ok(res, saved, { message: created ? 'Rating submitted' : 'Rating updated' }, created ? 201 : 200);
});
