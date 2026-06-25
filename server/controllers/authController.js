// server/controllers/authController.js

const authService = require('../services/authService');
const { validateRegisterInput, validateLoginInput } = require('../validators/authValidator');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const register = async (req, res) => {
  const { isValid, errors } = validateRegisterInput(req.body);

  if (!isValid) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  const { name, email, password } = req.body;
  const { user, token } = await authService.registerUser({ name, email, password });

  return sendSuccess(res, 201, 'Account created successfully.', { user, token });
};

const login = async (req, res) => {
  const { isValid, errors } = validateLoginInput(req.body);

  if (!isValid) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  const { email, password } = req.body;
  const { user, token } = await authService.loginUser({ email, password });

  return sendSuccess(res, 200, 'Login successful.', { user, token });
};

const getMe = async (req, res) => {
  return sendSuccess(res, 200, 'Current user fetched successfully.', { user: req.user });
};

module.exports = {
  register,
  login,
  getMe,
};