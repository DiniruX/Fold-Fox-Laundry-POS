import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiSave, FiX, FiUser, FiMail, FiLock, FiPhone, FiShield, FiCheck } from 'react-icons/fi';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import PasswordStrength from '../ui/PasswordStrength';
import { createUser, updateUser, getUserById, validateUserData } from '../../services/userService';
import { ROLES } from '../../constants';

const UserForm = ({ userId, onSuccess, onCancel }) => {
  const isEditMode = Boolean(userId);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ROLES.CASHIER,
    phoneNumber: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Fetch user data if editing
  useEffect(() => {
    if (isEditMode) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    setInitialLoading(true);
    try {
      const result = await getUserById(userId);
      if (result.success) {
        const user = result.data;
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
          confirmPassword: '',
          role: user.role || ROLES.CASHIER,
          phoneNumber: user.phoneNumber || '',
          isActive: user.isActive !== undefined ? user.isActive : true
        });
      } else {
        toast.error(result.error);
        onCancel();
      }
    } catch (error) {
      toast.error('Failed to load user data');
      onCancel();
    } finally {
      setInitialLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name cannot exceed 50 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation (only for new users or if password is being changed)
    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Phone validation (optional)
    if (formData.phoneNumber && !/^[0-9]{10,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number (10-15 digits)';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        role: formData.role,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        isActive: formData.isActive
      };

      // Add password only if provided (for create or update)
      if (!isEditMode && formData.password) {
        submitData.password = formData.password;
      }

      let result;
      if (isEditMode) {
        result = await updateUser(userId, submitData);
      } else {
        result = await createUser(submitData);
      }

      if (result.success) {
        toast.success(result.message);
        onSuccess(result.data);
      } else {
        toast.error(result.error);
        if (result.field) {
          setErrors(prev => ({ ...prev, [result.field]: result.error }));
        }
      }
    } catch (error) {
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enhanced Header */}
      <div 
        className="rounded-xl p-6 -mt-2 -mx-2"
        style={{ 
          background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 50%, #6366f1 100%)',
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-white shadow-lg">
            <FiShield className="text-2xl" style={{ color: '#6366f1' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEditMode ? 'Edit User' : 'Create New User'}
            </h2>
            <p className="text-white/70 text-sm mt-0.5">
              {isEditMode ? 'Update user information and permissions' : 'Add a new user to the system with specific role and access'}
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500">
        <div className="flex items-center space-x-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <FiUser className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        </div>
        
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <Input
              label="Full Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Enter full name"
              required
              icon={<FiUser />}
            />
          </div>

          {/* Email Field */}
          <div>
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="email@example.com"
              required
              icon={<FiMail />}
            />
          </div>

          {/* Phone Number Field */}
          <div>
            <Input
              label="Phone Number (Optional)"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              error={errors.phoneNumber}
              placeholder="1234567890"
              icon={<FiPhone />}
            />
            <p className="mt-1 text-xs text-gray-500">
              📞 Enter 10-15 digits without spaces or special characters
            </p>
          </div>
        </div>
      </div>

      {/* Password Section (only for new users) */}
      {!isEditMode && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500">
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
              <FiLock className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Security Credentials</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Enter password (min 6 characters)"
                required
                icon={<FiLock />}
              />
              {formData.password && (
                <div className="mt-2">
                  <PasswordStrength password={formData.password} />
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                🔒 Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Re-enter password"
                required
                icon={<FiLock />}
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-xs text-green-600 flex items-center">
                  <FiCheck className="mr-1" /> Passwords match
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role & Permissions Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-l-4 border-purple-500">
        <div className="flex items-center space-x-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
            <FiShield className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Role & Permissions</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Admin Role */}
            <div
              className={`border-2 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md ${
                formData.role === ROLES.ADMIN
                  ? 'border-purple-500 bg-white shadow-lg ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
              onClick={() => handleChange({ target: { name: 'role', value: ROLES.ADMIN } })}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="role"
                  value={ROLES.ADMIN}
                  checked={formData.role === ROLES.ADMIN}
                  onChange={handleChange}
                  className="mt-1 mr-3 h-4 w-4 text-purple-600"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-bold text-gray-900">🛡️ Admin</h4>
                    {formData.role === ROLES.ADMIN && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Full system access including user management, services, staff, reports, and all administrative features
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 text-xs rounded-md bg-purple-100 text-purple-700">All Features</span>
                    <span className="px-2 py-0.5 text-xs rounded-md bg-purple-100 text-purple-700">User Mgmt</span>
                    <span className="px-2 py-0.5 text-xs rounded-md bg-purple-100 text-purple-700">Reports</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cashier Role */}
            <div
              className={`border-2 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md ${
                formData.role === ROLES.CASHIER
                  ? 'border-blue-500 bg-white shadow-lg ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
              onClick={() => handleChange({ target: { name: 'role', value: ROLES.CASHIER } })}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="role"
                  value={ROLES.CASHIER}
                  checked={formData.role === ROLES.CASHIER}
                  onChange={handleChange}
                  className="mt-1 mr-3 h-4 w-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-bold text-gray-900">💼 Cashier</h4>
                    {formData.role === ROLES.CASHIER && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Limited access to customers, orders, and basic reports. Cannot manage users, services, or staff
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 text-xs rounded-md bg-blue-100 text-blue-700">Customers</span>
                    <span className="px-2 py-0.5 text-xs rounded-md bg-blue-100 text-blue-700">Orders</span>
                    <span className="px-2 py-0.5 text-xs rounded-md bg-blue-100 text-blue-700">Basic Reports</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {errors.role && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <FiX className="mr-1" /> {errors.role}
            </p>
          )}
        </div>
      </div>

      {/* Account Status Section */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-l-4 border-yellow-500">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-yellow-500 flex items-center justify-center">
                {formData.isActive ? (
                  <FiCheck className="h-5 w-5 text-white" />
                ) : (
                  <FiX className="h-5 w-5 text-white" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
            </div>
            <p className="text-sm text-gray-600 ml-10">
              {formData.isActive ? (
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  ✓ User can log in and access the system
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  ✗ User cannot log in - Account disabled
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange({ target: { name: 'isActive', type: 'checkbox', checked: !formData.isActive } })}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-inner ${
              formData.isActive ? 'bg-green-500' : 'bg-gray-400'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                formData.isActive ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Enhanced Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          style={{ backgroundColor: '#6366f1' }}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FiSave className="h-4 w-4" />
              <span>{isEditMode ? '✓ Update User' : '+ Create User'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default UserForm;

