import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiMail, FiPhone, FiCalendar, FiClock, FiShield, FiCheck, FiX } from 'react-icons/fi';
import {
  PencilIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getUserById } from '../services/userService';
import { ROLES } from '../constants';
import { getInitials } from '../utils/helpers';

const UserDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await getUserById(id);
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
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        <button
          onClick={() => navigate('/users')}
          className="mt-4 text-orange-600 hover:text-orange-700"
        >
          ← Back to Users
        </button>
      </div>
    );
  }

  const handleEdit = () => {
    navigate(`/users/edit/${user._id}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stunning Gradient Header */}
      <div 
        className="rounded-2xl shadow-lg overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 50%, #6366f1 100%)',
        }}
      >
        <div className="px-8 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/users')}
                className="h-12 w-12 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
              >
                <ArrowLeftIcon className="h-5 w-5 text-white" />
              </button>
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
                onClick={handleEdit}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all shadow-lg"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>
          
          {/* Role & Status Badges */}
          <div className="flex items-center space-x-2">
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
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
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
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
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
      <div className={`rounded-xl shadow-md border p-6 ${user.isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
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

export default UserDetailsPage;

