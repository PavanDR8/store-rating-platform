// Same rules as the backend (backend/src/validators/schemas.js). Each rule returns an error message or ''.
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const rules = {
  name: (v = '') =>
    v.trim().length < 20 ? 'Name must be at least 20 characters' : v.trim().length > 60 ? 'Name must be at most 60 characters' : '',
  storeName: (v = '') =>
    v.trim().length < 3 ? 'Store name must be at least 3 characters' : v.trim().length > 60 ? 'Store name must be at most 60 characters' : '',
  email: (v = '') => (!v.trim() ? 'Email is required' : !EMAIL_REGEX.test(v.trim()) || v.length > 255 ? 'Enter a valid email address' : ''),
  address: (v = '') => (!v.trim() ? 'Address is required' : v.trim().length > 400 ? 'Address must be at most 400 characters' : ''),
  password: (v = '') =>
    PASSWORD_REGEX.test(v) ? '' : 'Password must be 8-16 characters with at least one uppercase letter and one special character',
  required: (label) => (v = '') => (!String(v).trim() ? `${label} is required` : ''),
  role: (v = '') => (['ADMIN', 'USER', 'STORE_OWNER'].includes(v) ? '' : 'Select a role'),
};

// validate(values, { field: rule }) -> { field: 'message' } (empty object when valid)
export function validate(values, schema) {
  const errors = {};
  Object.entries(schema).forEach(([key, rule]) => {
    const message = rule(values[key]);
    if (message) errors[key] = message;
  });
  return errors;
}

export const homePathFor = (role) =>
  ({ ADMIN: '/admin/dashboard', USER: '/user/stores', STORE_OWNER: '/owner/dashboard' }[role] || '/login');

export const roleLabel = (role) => ({ ADMIN: 'Administrator', USER: 'Normal user', STORE_OWNER: 'Store owner' }[role] || role);

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export const formatRating = (v) => (v === null || v === undefined ? '-' : Number(v).toFixed(1));
