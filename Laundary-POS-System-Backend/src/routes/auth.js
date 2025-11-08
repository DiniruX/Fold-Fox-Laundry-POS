const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  checkEmail
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/auth');
const { validateLogin, validateUser } = require('../middleware/validation');

// Import rate limiters for security
const { loginLimiter, strictLimiter } = require('../middleware/rateLimitConfig');

const isProduction = process.env.NODE_ENV === 'production';

// Public routes
router.post('/register', validateUser, register);

if (isProduction) {
  router.post('/login', loginLimiter, validateLogin, login);
} else {
  router.post('/login', validateLogin, login);
}
router.post('/refresh-token', refreshToken);
router.post('/check-email', checkEmail);

// Protected routes
router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', strictLimiter, changePassword); // Strict rate limit for security
router.post('/logout', logout);

module.exports = router;
