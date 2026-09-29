const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const upload = require('../middleware/upload');
const { authLimiter } = require('../middleware/rateLimiter');

// Public auth routes (with rate limits on sensitive endpoints)
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, authController.resetPassword);

// Protected routes (any logged-in user)
router.get('/me', protect, authController.me);
router.patch('/change-password', protect, authController.changePassword);
router.patch('/update-profile', protect, upload.single('avatar'), authController.updateProfile);

// Admin-only registration
router.post('/register', protect, authorizeRoles('superAdmin'), authController.register);

module.exports = router;
