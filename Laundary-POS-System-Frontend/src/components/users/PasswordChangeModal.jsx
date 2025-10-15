import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiLock, FiEye, FiEyeOff, FiSave, FiX } from 'react-icons/fi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PasswordStrength from '../ui/PasswordStrength';
import { updateUserPassword, validatePasswordData } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const PasswordChangeModal = ({ isOpen, onClose, userId, userName }) => {
  const { user: currentUser, isAdmin } = useAuth();
  const isChangingOwnPassword = currentUser._id === userId;

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Current password required for non-admin or when changing own password
    if (isChangingOwnPassword && !formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    // New password validation
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is same as current (optional)
    if (formData.currentPassword && formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
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
      const passwordData = {
        newPassword: formData.newPassword
      };

      // Include current password if changing own password
      if (isChangingOwnPassword) {
        passwordData.currentPassword = formData.currentPassword;
      }

      const result = await updateUserPassword(userId, passwordData);

      if (result.success) {
        toast.success(result.message);
        resetForm();
        onClose();
      } else {
        toast.error(result.error);
        if (result.error.includes('current password')) {
          setErrors(prev => ({ ...prev, currentPassword: result.error }));
        }
      }
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Password" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
          <p className="text-base text-blue-900 font-medium">
            {isChangingOwnPassword ? (
              <>
                You are changing your own password. Your current password is required.
              </>
            ) : (
              <>
                Changing password for: <span className="font-bold">{userName}</span>
              </>
            )}
          </p>
        </div>

        {/* Current Password (only if changing own password) */}
        {isChangingOwnPassword && (
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-3">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange}
                error={errors.currentPassword}
                placeholder="Enter current password"
                icon={<FiLock />}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showCurrentPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>
        )}

        {/* New Password */}
        <div>
          <label className="block text-base font-semibold text-gray-800 mb-3">
            New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              name="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              placeholder="Enter new password"
              icon={<FiLock />}
            />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showNewPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
          </div>
          {formData.newPassword && (
            <div className="mt-2">
              <PasswordStrength password={formData.newPassword} />
            </div>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Password must be at least 6 characters long
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-base font-semibold text-gray-800 mb-3">
            Confirm New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Confirm new password"
              icon={<FiLock />}
            />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
          </div>
        </div>

        {/* Password Match Indicator */}
        {formData.newPassword && formData.confirmPassword && (
          <div className={`p-4 rounded-xl border-2 ${
            formData.newPassword === formData.confirmPassword
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <p className={`text-base font-semibold flex items-center gap-2 ${
              formData.newPassword === formData.confirmPassword
                ? 'text-green-800'
                : 'text-red-800'
            }`}>
              {formData.newPassword === formData.confirmPassword
                ? '✓ Passwords match'
                : '✗ Passwords do not match'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            icon={<FiX />}
            className="px-6 py-3"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            icon={<FiSave />}
            className="px-6 py-3"
          >
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PasswordChangeModal;

