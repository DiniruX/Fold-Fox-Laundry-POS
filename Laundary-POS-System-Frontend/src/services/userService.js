import { usersAPI } from './api';

/**
 * User Service - Frontend service for user management operations
 * Provides methods for CRUD operations, password management, and statistics
 */

// Get all users with pagination and filtering
export const getAllUsers = async (params = {}) => {
  try {
    const response = await usersAPI.getAll(params);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch users'
    };
  }
};

// Get user by ID
export const getUserById = async (id) => {
  try {
    const response = await usersAPI.getById(id);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch user'
    };
  }
};

// Create new user
export const createUser = async (userData) => {
  try {
    const response = await usersAPI.create(userData);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || 'User created successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create user',
      field: error.response?.data?.field
    };
  }
};

// Update user
export const updateUser = async (id, userData) => {
  try {
    const response = await usersAPI.update(id, userData);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || 'User updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update user'
    };
  }
};

// Delete user
export const deleteUser = async (id) => {
  try {
    const response = await usersAPI.delete(id);
    return {
      success: true,
      message: response.data.message || 'User deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete user'
    };
  }
};

// Update user password
export const updateUserPassword = async (id, passwordData) => {
  try {
    const response = await usersAPI.updatePassword(id, passwordData);
    return {
      success: true,
      message: response.data.message || 'Password updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update password'
    };
  }
};

// Toggle user active status
export const toggleUserStatus = async (id) => {
  try {
    const response = await usersAPI.toggleStatus(id);
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || 'User status updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update user status'
    };
  }
};

// Get user statistics
export const getUserStats = async () => {
  try {
    const response = await usersAPI.getStats();
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch user statistics'
    };
  }
};

// Validate user data
export const validateUserData = (userData, isEdit = false) => {
  const errors = {};

  // Name validation
  if (!userData.name || userData.name.trim() === '') {
    errors.name = 'Name is required';
  } else if (userData.name.length > 50) {
    errors.name = 'Name cannot exceed 50 characters';
  }

  // Email validation
  if (!userData.email || userData.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.email = 'Invalid email format';
  }

  // Password validation (only for new users)
  if (!isEdit) {
    if (!userData.password || userData.password.trim() === '') {
      errors.password = 'Password is required';
    } else if (userData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
  }

  // Role validation
  if (!userData.role || userData.role.trim() === '') {
    errors.role = 'Role is required';
  } else if (!['admin', 'cashier'].includes(userData.role)) {
    errors.role = 'Invalid role';
  }

  // Phone number validation (optional)
  if (userData.phoneNumber && !/^[0-9]{10,15}$/.test(userData.phoneNumber)) {
    errors.phoneNumber = 'Invalid phone number format (10-15 digits)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate password change data
export const validatePasswordData = (passwordData, requireCurrentPassword = false) => {
  const errors = {};

  // Current password validation
  if (requireCurrentPassword && !passwordData.currentPassword) {
    errors.currentPassword = 'Current password is required';
  }

  // New password validation
  if (!passwordData.newPassword || passwordData.newPassword.trim() === '') {
    errors.newPassword = 'New password is required';
  } else if (passwordData.newPassword.length < 6) {
    errors.newPassword = 'Password must be at least 6 characters';
  }

  // Confirm password validation
  if (passwordData.confirmPassword !== passwordData.newPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserPassword,
  toggleUserStatus,
  getUserStats,
  validateUserData,
  validatePasswordData
};

