// Consistent success response: { success: true, data, ...extra }
const ok = (res, data, extra = {}, status = 200) =>
  res.status(status).json({ success: true, data, ...extra });

module.exports = { ok };
