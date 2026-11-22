/*
 * End-to-end API test. Start the backend first (npm run dev), then run: npm run test:api
 * Uses Node's built-in test runner and fetch (Node 18+). It creates its own uniquely named data.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const env = require('../src/config/env');

const BASE = process.env.API_URL || `http://localhost:${env.port}/api`;
const run = Date.now();
const PASS = 'Passw0rd!x';
const mk = (label) => ({
  name: `Test ${label} Account Holder ${run}`.slice(0, 60),
  email: `${label}.${run}@test.com`,
  password: PASS,
  address: `Test street ${label}, Pune`,
});

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}
const login = async (email, password) => (await api('POST', '/auth/login', { body: { email, password } }));

const ctx = {};

test('health check', async () => {
  const r = await api('GET', '/health');
  assert.equal(r.status, 200);
});

test('signup validation rejects bad input', async () => {
  const r = await api('POST', '/auth/signup', { body: { name: 'short', email: 'bad', password: 'weak', address: '' } });
  assert.equal(r.status, 400);
  assert.ok(r.body.errors.name && r.body.errors.email && r.body.errors.password && r.body.errors.address);
});

test('normal user signup, duplicate email and login', async () => {
  ctx.user = mk('user');
  let r = await api('POST', '/auth/signup', { body: ctx.user });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.role, 'USER');
  assert.equal(r.body.data.password, undefined);
  r = await api('POST', '/auth/signup', { body: ctx.user });
  assert.equal(r.status, 409);
  r = await login(ctx.user.email, 'Wrong@Pass1');
  assert.equal(r.status, 401);
  r = await login(ctx.user.email, PASS);
  assert.equal(r.status, 200);
  assert.equal(r.body.data.user.password, undefined);
  ctx.userToken = r.body.data.token;
});

test('signup cannot self-assign ADMIN role', async () => {
  const u = { ...mk('sneaky'), role: 'ADMIN' };
  const r = await api('POST', '/auth/signup', { body: u });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.role, 'USER');
});

test('admin login and dashboard stats', async () => {
  const r = await login(env.admin.email, env.admin.password);
  assert.equal(r.status, 200, 'Default admin must exist: run npm run db:setup');
  assert.equal(r.body.data.user.role, 'ADMIN');
  ctx.adminToken = r.body.data.token;
  const d = await api('GET', '/admin/dashboard', { token: ctx.adminToken });
  assert.equal(d.status, 200);
  assert.ok(Number.isInteger(d.body.data.total_users) && d.body.data.total_users >= 2);
});

test('role restrictions and missing token', async () => {
  assert.equal((await api('GET', '/admin/dashboard')).status, 401);
  assert.equal((await api('GET', '/admin/dashboard', { token: ctx.userToken })).status, 403);
  assert.equal((await api('GET', '/owner/dashboard', { token: ctx.userToken })).status, 403);
  assert.equal((await api('GET', '/user/stores', { token: ctx.adminToken })).status, 403);
  assert.equal((await api('GET', '/admin/dashboard', { token: 'garbage' })).status, 401);
});

test('admin creates store together with a new owner (transaction)', async () => {
  ctx.owner = mk('owner');
  ctx.store = { name: `Rollex Store ${run}`, email: `store.${run}@test.com`, address: 'Shop 1, FC Road, Pune' };
  const r = await api('POST', '/admin/stores', { token: ctx.adminToken, body: { ...ctx.store, owner: ctx.owner } });
  assert.equal(r.status, 201);
  ctx.storeId = r.body.data.id;
  const l = await login(ctx.owner.email, PASS);
  assert.equal(l.body.data.user.role, 'STORE_OWNER');
  ctx.ownerToken = l.body.data.token;
});

test('failed store creation rolls back the new owner', async () => {
  const owner2 = mk('rollback');
  const r = await api('POST', '/admin/stores', {
    token: ctx.adminToken,
    body: { ...ctx.store, name: `Duplicate Email Store ${run}`, owner: owner2 }, // store email already used
  });
  assert.equal(r.status, 409);
  const users = await api('GET', `/admin/users?search=${encodeURIComponent(owner2.email)}`, { token: ctx.adminToken });
  assert.equal(users.body.data.length, 0, 'owner must not exist after rollback');
});

test('admin can link an existing owner and cannot link a normal user', async () => {
  const o = mk('owner2');
  const created = await api('POST', '/admin/users', { token: ctx.adminToken, body: { ...o, role: 'STORE_OWNER' } });
  assert.equal(created.status, 201);
  const bad = await api('POST', '/admin/stores', {
    token: ctx.adminToken,
    body: { name: `Second Store ${run}`, email: `store2.${run}@test.com`, address: 'Somewhere, Pune', ownerId: 1e9 },
  });
  assert.equal(bad.status, 404);
  const good = await api('POST', '/admin/stores', {
    token: ctx.adminToken,
    body: { name: `Second Store ${run}`, email: `store2.${run}@test.com`, address: 'Somewhere, Pune', ownerId: created.body.data.id },
  });
  assert.equal(good.status, 201);
});

test('admin lists users and stores with search, filter, sort and details', async () => {
  let r = await api('GET', `/admin/users?search=${run}&role=STORE_OWNER&sortBy=name&order=desc`, { token: ctx.adminToken });
  assert.equal(r.status, 200);
  assert.ok(r.body.data.length >= 1 && r.body.data.every((u) => u.role === 'STORE_OWNER'));
  assert.ok(r.body.pagination.total >= 1);
  r = await api('GET', '/admin/users?sortBy=password;DROP', { token: ctx.adminToken });
  assert.equal(r.status, 400);
  r = await api('GET', '/admin/users?order=sideways', { token: ctx.adminToken });
  assert.equal(r.status, 400);
  r = await api('GET', `/admin/stores?search=${run}&sortBy=avg_rating&order=desc`, { token: ctx.adminToken });
  assert.equal(r.status, 200);
  assert.ok(r.body.data.length >= 1);
  r = await api('GET', '/admin/users/abc', { token: ctx.adminToken });
  assert.equal(r.status, 400);
  r = await api('GET', '/admin/users/999999999', { token: ctx.adminToken });
  assert.equal(r.status, 404);
});

test('normal user lists/searches stores and rates (one rating per store, update allowed)', async () => {
  let r = await api('GET', `/user/stores?search=${run}`, { token: ctx.userToken });
  assert.equal(r.status, 200);
  const store = r.body.data.find((s) => s.id === ctx.storeId);
  assert.ok(store);
  assert.equal(store.my_rating, null);

  assert.equal((await api('POST', '/user/ratings', { token: ctx.userToken, body: { storeId: ctx.storeId, rating: 6 } })).status, 400);
  assert.equal((await api('POST', '/user/ratings', { token: ctx.userToken, body: { storeId: ctx.storeId, rating: 2.5 } })).status, 400);
  assert.equal((await api('POST', '/user/ratings', { token: ctx.userToken, body: { storeId: 999999999, rating: 3 } })).status, 404);

  r = await api('POST', '/user/ratings', { token: ctx.userToken, body: { storeId: ctx.storeId, rating: 3 } });
  assert.equal(r.status, 201);
  r = await api('POST', '/user/ratings', { token: ctx.userToken, body: { storeId: ctx.storeId, rating: 5 } });
  assert.equal(r.status, 200, 'second submit must update, not insert');

  r = await api('GET', `/user/stores?search=${run}`, { token: ctx.userToken });
  const updated = r.body.data.find((s) => s.id === ctx.storeId);
  assert.equal(updated.my_rating, 5);
  assert.equal(updated.rating_count, 1);
  assert.equal(updated.avg_rating, 5);
});

test('store owner sees only own store ratings, sortable', async () => {
  let r = await api('GET', '/owner/dashboard?sortBy=rating&order=asc', { token: ctx.ownerToken });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.store.id, ctx.storeId);
  assert.equal(r.body.data.store.avg_rating, 5);
  assert.equal(r.body.data.ratings.length, 1);
  assert.equal(r.body.data.ratings[0].user_email, ctx.user.email);
  r = await api('GET', '/owner/dashboard?sortBy=hacker', { token: ctx.ownerToken });
  assert.equal(r.status, 400);
});

test('admin sees owner rating in user details', async () => {
  const list = await api('GET', `/admin/users?search=${encodeURIComponent(ctx.owner.email)}`, { token: ctx.adminToken });
  const id = list.body.data[0].id;
  assert.equal(list.body.data[0].rating, 5);
  const d = await api('GET', `/admin/users/${id}`, { token: ctx.adminToken });
  assert.equal(d.body.data.store.avg_rating, 5);
});

test('update password works for every role and old password stops working', async () => {
  const bad = await api('PATCH', '/auth/update-password', { token: ctx.userToken, body: { currentPassword: PASS, newPassword: 'weak' } });
  assert.equal(bad.status, 400);
  const wrong = await api('PATCH', '/auth/update-password', { token: ctx.userToken, body: { currentPassword: 'Nope@1234', newPassword: 'NewPass@123' } });
  assert.equal(wrong.status, 400);
  const ok = await api('PATCH', '/auth/update-password', { token: ctx.userToken, body: { currentPassword: PASS, newPassword: 'NewPass@123' } });
  assert.equal(ok.status, 200);
  assert.equal((await login(ctx.user.email, PASS)).status, 401);
  assert.equal((await login(ctx.user.email, 'NewPass@123')).status, 200);
});
