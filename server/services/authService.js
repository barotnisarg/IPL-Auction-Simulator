// server/services/authService.js

const crypto = require('crypto');

const User                    = require('../models/User');
const generateToken           = require('../utils/generateToken');
const { sendPasswordResetEmail } = require('../utils/sendEmail');

// ── Existing ──────────────────────────────────────────────────────────────────

const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const user  = await User.create({ name, email, password });
  const token = generateToken(user._id.toString());

  return { user, token };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id.toString());
  return { user, token };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

// ── Forgot / reset password ───────────────────────────────────────────────────

const requestPasswordReset = async ({ email }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Deliberately vague response — we never confirm whether an email exists
  // in our system to prevent account enumeration by attackers.
  if (!user) return;

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl  = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const resetUrl   = `${clientUrl}/reset-password/${rawToken}`;

  try {
    await sendPasswordResetEmail({
      toEmail:       user.email,
      recipientName: user.name,
      resetUrl,
    });
  } catch (emailError) {
    // If the email fails, roll back the token so the user isn't locked into
    // a "token exists but email never arrived" state.
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    const error = new Error(
      'The reset email could not be sent. Please try again later.'
    );
    error.statusCode = 500;
    throw error;
  }
};

const resetPassword = async ({ rawToken, newPassword }) => {
  // Hash the incoming raw token to compare against the stored hash.
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken:   hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!user) {
    const error = new Error(
      'This reset link is invalid or has expired. Please request a new one.'
    );
    error.statusCode = 400;
    throw error;
  }

  user.password             = newPassword;
  user.resetPasswordToken   = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  // Log the user in automatically after a successful reset.
  const token = generateToken(user._id.toString());
  return { user, token };
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  requestPasswordReset,
  resetPassword,
};