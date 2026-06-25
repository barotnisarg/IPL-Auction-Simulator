// server/validators/authValidator.js

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const validateRegisterInput = ({ name, email, password }) => {
  const errors = [];

  if (!name || !name.trim()) {
    errors.push('Name is required.');
  } else if (name.trim().length < 2 || name.trim().length > 50) {
    errors.push('Name must be between 2 and 50 characters.');
  }

  if (!email || !email.trim()) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password) {
    errors.push('Password is required.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateLoginInput = ({ email, password }) => {
  const errors = [];

  if (!email || !email.trim()) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
};