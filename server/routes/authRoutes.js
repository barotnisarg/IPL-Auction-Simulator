// server/routes/authRoutes.js

const express = require('express');

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const asyncHandler   = require('../middlewares/asyncHandler');

const router = express.Router();

router.post('/register',                   asyncHandler(authController.register));
router.post('/login',                      asyncHandler(authController.login));
router.get( '/me',     authMiddleware,     asyncHandler(authController.getMe));

// Forgot / reset password — no auth required, anyone can hit these.
router.post('/forgot-password',            asyncHandler(authController.forgotPassword));
router.post('/reset-password/:token',      asyncHandler(authController.resetPassword));

module.exports = router;