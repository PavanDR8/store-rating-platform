const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../utils/validate');
const s = require('../validators/schemas');
const auth = require('../controllers/authController');
const admin = require('../controllers/adminController');
const user = require('../controllers/userController');
const owner = require('../controllers/ownerController');

router.get('/health', (req, res) => res.json({ success: true, message: 'Rollex API is running' }));

// ---- Auth ----
router.post('/auth/signup', validate(s.signupSchema), auth.signup);
router.post('/auth/login', validate(s.loginSchema), auth.login);
router.patch('/auth/update-password', authenticate, validate(s.updatePasswordSchema), auth.updatePassword);

// ---- Admin (JWT + ADMIN role) ----
const adminRouter = router;
adminRouter.use('/admin', authenticate, authorize('ADMIN'));
adminRouter.get('/admin/dashboard', admin.dashboard);
adminRouter.post('/admin/users', validate(s.adminCreateUserSchema), admin.createUser);
adminRouter.post('/admin/stores', validate(s.adminCreateStoreSchema), admin.createStore);
adminRouter.get('/admin/users', admin.listUsers);
adminRouter.get('/admin/users/:id', admin.getUser);
adminRouter.get('/admin/stores', admin.listStores);
adminRouter.get('/admin/owners', admin.availableOwners);

// ---- Normal user (JWT + USER role) ----
router.use('/user', authenticate, authorize('USER'));
router.get('/user/stores', user.listStores);
router.post('/user/ratings', validate(s.ratingSchema), user.submitRating);

// ---- Store owner (JWT + STORE_OWNER role) ----
router.use('/owner', authenticate, authorize('STORE_OWNER'));
router.get('/owner/dashboard', owner.dashboard);

module.exports = router;
