import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiBarChart2 } from 'react-icons/fi';
import { 
  ShieldCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  KeyIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import UserList from '../components/users/UserList';
import UserAnalytics from '../components/users/UserAnalytics';
import PasswordChangeModal from '../components/users/PasswordChangeModal';

const Users = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('list');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
  });

  // Ensure password modal is closed on route change
  useEffect(() => {
    setShowPasswordModal(false);
    // Safety: restore body scroll in case a modal left it locked
    if (document?.body) {
      document.body.style.overflow = 'unset';
    }
    // Also clear any selectedId state to avoid stale fetches
    setSelectedUserId(null);
    setSelectedUserName('');
  }, [location.pathname]);

  // Handle create user
  const handleCreateUser = () => {
    navigate('/users/new');
  };

  // Handle edit user
  const handleEditUser = (userId) => {
    navigate(`/users/edit/${userId}`);
  };

  // Handle view user details
  const handleViewUser = (userId) => {
    navigate(`/users/${userId}`);
  };

  // Handle change password
  const handleChangePassword = (userId, userName = '') => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowPasswordModal(true);
  };

  // Handle success callbacks
  const handleSuccess = () => {
    setShowPasswordModal(false);
    setSelectedUserId(null);
    setSelectedUserName('');
    // Trigger refresh of user list
    setRefreshKey(prev => prev + 1);
  };

  // Handle cancel callbacks
  const handleCancel = () => {
    setShowPasswordModal(false);
    setSelectedUserId(null);
    setSelectedUserName('');
  };

  // Handle stats update from UserList
  const handleStatsUpdate = (stats) => {
    setUserStats(stats);
  };

  const tabs = [
    { id: 'list', name: 'User List', icon: UserGroupIcon },
    { id: 'analytics', name: 'Analytics', icon: FiBarChart2 },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header Card */}
      <div 
        className="rounded-2xl shadow-lg overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 100%)',
        }}
      >
        <div className="px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div 
                className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <p className="text-white/70 mt-1">
                  Manage system users, roles, and permissions
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleCreateUser}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-100">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-1">All system users</p>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.activeUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Can access system</p>
            </div>
          </div>
        </div>

        {/* Inactive Users */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-red-100">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.inactiveUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Disabled accounts</p>
            </div>
          </div>
        </div>

        {/* Admin Users */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-purple-100">
              <KeyIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.adminUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Full access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="border-b border-gray-100" style={{ backgroundColor: '#fafbfc' }}>
          <nav className="flex px-6 space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-5 border-b-3 font-semibold text-sm transition-all duration-200 relative ${
                    isActive
                      ? 'text-white border-b-3'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                  style={
                    isActive
                      ? { 
                          borderBottomWidth: '3px',
                          borderBottomColor: '#fe7f2d',
                          color: '#233d4d',
                          backgroundColor: 'white'
                        }
                      : { borderBottomWidth: '3px' }
                  }
                >
                  {typeof Icon === 'function' ? <Icon className={`h-5 w-5 ${isActive ? 'text-orange-500' : ''}`} /> : <Icon size={20} className={isActive ? 'text-orange-500' : ''} />}
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content with Animation */}
        <div className="p-6 min-h-[400px]">
          <div className="animate-fadeIn">
            {activeTab === 'list' && (
              <UserList
                key={refreshKey}
                onCreateUser={handleCreateUser}
                onEditUser={handleEditUser}
                onViewUser={handleViewUser}
                onChangePassword={(userId) => {
                  handleChangePassword(userId, '');
                }}
                onStatsUpdate={handleStatsUpdate}
              />
            )}
            {activeTab === 'analytics' && (
              <UserAnalytics />
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={handleCancel}
        userId={selectedUserId}
        userName={selectedUserName}
      />
    </div>
  );
};

export default Users;

