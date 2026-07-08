// server/controllers/authController.js

const authService = require('../services/authService');
const {
  validateRegisterInput,
  validateLoginInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
} = require('../validators/authValidator');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const register = async (req, res) => {
  const { isValid, errors } = validateRegisterInput(req.body);
  if (!isValid) return sendError(res, 400, 'Validation failed.', errors);

  const { name, email, password } = req.body;
  const { user, token } = await authService.registerUser({ name, email, password });
  return sendSuccess(res, 201, 'Account created successfully.', { user, token });
};

const login = async (req, res) => {
  const { isValid, errors } = validateLoginInput(req.body);
  if (!isValid) return sendError(res, 400, 'Validation failed.', errors);

  const { email, password } = req.body;
  const { user, token } = await authService.loginUser({ email, password });
  return sendSuccess(res, 200, 'Login successful.', { user, token });
};

const getMe = async (req, res) => {
  return sendSuccess(res, 200, 'Current user fetched successfully.', { user: req.user });
};

const forgotPassword = async (req, res) => {
  const { isValid, errors } = validateForgotPasswordInput(req.body);
  if (!isValid) return sendError(res, 400, 'Validation failed.', errors);

  // requestPasswordReset never throws for a missing email (enumeration guard),
  // so we always return 200 with the same message regardless of outcome.
  await authService.requestPasswordReset({ email: req.body.email });

  return sendSuccess(
    res,
    200,
    'If an account with that email exists, a reset link has been sent.'
  );
};

const resetPassword = async (req, res) => {
  const { isValid, errors } = validateResetPasswordInput(req.body);
  if (!isValid) return sendError(res, 400, 'Validation failed.', errors);

  const { token } = req.params;
  const { password } = req.body;

  const { user, authToken } = await authService.resetPassword({
    rawToken:    token,
    newPassword: password,
  });

  return sendSuccess(res, 200, 'Password reset successfully.', {
    user,
    token: authToken,
  });
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};