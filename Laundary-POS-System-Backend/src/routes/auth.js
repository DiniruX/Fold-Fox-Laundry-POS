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

// Public routes
router.post('/register', validateUser, register);
router.post('/login', validateLogin, login);
router.post('/refresh-token', refreshToken);
router.post('/check-email', checkEmail);

// Protected routes
router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);

module.exports = router;
