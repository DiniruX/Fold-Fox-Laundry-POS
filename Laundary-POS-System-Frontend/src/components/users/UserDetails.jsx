import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiMail, FiPhone, FiCalendar, FiClock, FiShield, FiCheck, FiX, FiEdit2 } from 'react-icons/fi';
import {
  PencilIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import { getUserById } from '../../services/userService';
import { ROLES } from '../../constants';
import { getInitials } from '../../utils/helpers';

const UserDetails = ({ userId, onEdit, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return; // avoid calling API with undefined id
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const result = await getUserById(userId);
      if (result.success) {
        setUser(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case ROLES.CASHIER:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get role permissions
  const getRolePermissions = (role) => {
    if (role === ROLES.ADMIN) {
      return [
        'Full system access',
        'User management',
        'Service management',
        'Staff management',
        'Customer management',
        'Order management',
        'Reports and analytics'
      ];
    } else if (role === ROLES.CASHIER) {
      return [
        'Customer management',
        'Order management',
        'View services',
        'Basic reports',
        'Profile management'
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stunning Gradient Header */}
      <div 
        className="rounded-xl p-6 shadow-lg -mt-2 -mx-2"
        style={{ 
          background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 50%, #6366f1 100%)',
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white shadow-lg">
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                {getInitials(user.name)}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-white">
                  {user.name}
                </h2>
              </div>
              <div className="mt-1 space-y-1">
                <p className="text-white/90 text-sm flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-1" />
                  {user.email}
                </p>
                {user.phoneNumber && (
                  <p className="text-white/70 text-xs flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    {user.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Priority Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(userId)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all shadow-lg"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>
        
        {/* Role & Status Badges */}
        <div className="mt-4 flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
            {user.role === ROLES.ADMIN && <ShieldCheckIcon className="h-4 w-4 mr-1" />}
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm ${
            user.isActive
              ? 'bg-green-500/20 text-green-100'
              : 'bg-red-500/20 text-red-100'
          }`}>
            {user.isActive ? (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Active
              </>
            ) : (
              <>
                <XCircleIcon className="h-4 w-4 mr-1" />
                Inactive
              </>
            )}
          </span>
        </div>
      </div>

      {/* Original content continues below */}
      <div className="flex items-center justify-between" style={{ display: 'none' }}>
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              {user.isActive ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  <FiCheck className="mr-1" size={12} />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                  <FiX className="mr-1" size={12} />
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => onEdit(userId)}
          icon={<FiEdit2 />}
        >
          Edit User
        </Button>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <FiMail className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base text-gray-900">{user.email}</p>
              </div>
            </div>

            {user.phoneNumber && (
              <div className="flex items-start space-x-3">
                <FiPhone className="text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="text-base text-gray-900">{user.phoneNumber}</p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <FiShield className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-500">Role</p>
                <p className="text-base text-gray-900 capitalize">{user.role}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FiCalendar className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-500">Account Created</p>
                <p className="text-base text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FiClock className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-500">Last Login</p>
                <p className="text-base text-gray-900">{formatDate(user.lastLogin)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FiCalendar className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-base text-gray-900">{formatDate(user.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions & Access */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Permissions & Access</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getRolePermissions(user.role).map((permission, index) => (
              <div key={index} className="flex items-center space-x-2">
                <FiCheck className="text-green-500" size={18} />
                <span className="text-gray-700">{permission}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className={`rounded-lg border p-6 ${user.isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-start space-x-3">
          {user.isActive ? (
            <>
              <FiCheck className="text-green-600 mt-1" size={24} />
              <div>
                <h4 className="text-lg font-semibold text-green-900">Account Active</h4>
                <p className="text-green-700 mt-1">
                  This user can log in and access the system according to their role permissions.
                </p>
              </div>
            </>
          ) : (
            <>
              <FiX className="text-red-600 mt-1" size={24} />
              <div>
                <h4 className="text-lg font-semibold text-red-900">Account Inactive</h4>
                <p className="text-red-700 mt-1">
                  This user cannot log in or access the system. Activate the account to restore access.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetails;

