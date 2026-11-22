const ApiError = require('./ApiError');

const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');

const parseId = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 2147483647) throw new ApiError(400, 'Invalid id');
  return n;
};

/**
 * Reads page / limit / search / sortBy / order from the query string.
 * sortBy is checked against `sortMap` (allowed key -> SQL column), so untrusted
 * values are never inserted into SQL.
 */
function listOptions(query, sortMap, defaultSort, defaultOrder = 'asc') {
  const sortBy = query.sortBy === undefined || query.sortBy === '' ? defaultSort : query.sortBy;
  if (typeof sortBy !== 'string' || !Object.prototype.hasOwnProperty.call(sortMap, sortBy)) {
    throw new ApiError(400, `Invalid sortBy. Allowed values: ${Object.keys(sortMap).join(', ')}`);
  }
  const order = String(query.order || defaultOrder).toLowerCase();
  if (!['asc', 'desc'].includes(order)) throw new ApiError(400, 'Invalid order. Use asc or desc');

  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 100) : '';

  return {
    sortBy,
    order,
    page,
    limit,
    offset: (page - 1) * limit,
    search,
    orderSql: `${sortMap[sortBy]} ${order.toUpperCase()} NULLS LAST`,
  };
}

const paginationMeta = (total, { page, limit }) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

module.exports = { escapeLike, parseId, listOptions, paginationMeta };
