const { z } = require('zod');

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
const ROLES = ['ADMIN', 'USER', 'STORE_OWNER'];

const name = z
  .string({ required_error: 'Name is required' })
  .trim()
  .min(20, 'Name must be at least 20 characters')
  .max(60, 'Name must be at most 60 characters');

const storeName = z
  .string({ required_error: 'Store name is required' })
  .trim()
  .min(3, 'Store name must be at least 3 characters')
  .max(60, 'Store name must be at most 60 characters');

const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(255, 'Email must be at most 255 characters')
  .email('Enter a valid email address');

const address = z
  .string({ required_error: 'Address is required' })
  .trim()
  .min(1, 'Address is required')
  .max(400, 'Address must be at most 400 characters');

const password = z
  .string({ required_error: 'Password is required' })
  .regex(
    PASSWORD_REGEX,
    'Password must be 8-16 characters with at least one uppercase letter and one special character'
  );

const signupSchema = z.object({ name, email, password, address });

const loginSchema = z.object({
  email,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }).min(1, 'Current password is required'),
  newPassword: password,
});

const adminCreateUserSchema = z.object({
  name,
  email,
  password,
  address,
  role: z.enum(ROLES, { errorMap: () => ({ message: 'Role must be ADMIN, USER or STORE_OWNER' }) }),
});

// Either link an existing owner (ownerId) OR create a new owner (owner: {...})
const adminCreateStoreSchema = z
  .object({
    name: storeName,
    email,
    address,
    ownerId: z.coerce.number().int().positive().optional(),
    owner: z.object({ name, email, password, address }).optional(),
  })
  .refine((d) => Boolean(d.ownerId) !== Boolean(d.owner), {
    message: 'Choose an existing store owner or enter new owner details',
    path: ['ownerId'],
  });

const ratingSchema = z.object({
  storeId: z.coerce.number({ invalid_type_error: 'Store is required' }).int().positive('Store is required'),
  rating: z.coerce
    .number({ invalid_type_error: 'Rating must be a number' })
    .int('Rating must be a whole number')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
});

module.exports = {
  PASSWORD_REGEX,
  ROLES,
  signupSchema,
  loginSchema,
  updatePasswordSchema,
  adminCreateUserSchema,
  adminCreateStoreSchema,
  ratingSchema,
};
