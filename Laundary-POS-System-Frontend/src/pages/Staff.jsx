import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserGroupIcon, 
  PlusIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  UserPlusIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useStaff } from '../hooks/useStaffService';
import StaffList from '../components/staff/StaffList';
import StaffAnalytics from '../components/staff/StaffAnalytics';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Staff = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {
    staff,
    isLoading,
    error,
    refetch
  } = useStaff(refreshTrigger);

  // Redirect if not admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access staff management.</p>
        </div>
      </div>
    );
  }

  const handleStaffSelect = (staff) => {
    navigate(`/staff/${staff._id}`);
  };

  const handleEditStaff = (staff) => {
    navigate(`/staff/edit/${staff._id}`);
  };

  const handleCreateStaff = () => {
    navigate('/staff/new');
  };

  const tabs = [
    { id: 'list', name: 'Staff List', icon: UserGroupIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  ];

  // Calculate stats from staff data
  const staffArray = Array.isArray(staff?.data?.staff) ? staff.data.staff : [];
  const stats = {
    totalStaff: staffArray.length,
    activeStaff: staffArray.filter(s => s.employmentInfo?.status === 'active').length,
    recentHires: staffArray.filter(s => {
      const hireDate = new Date(s.employmentInfo?.hireDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return hireDate >= thirtyDaysAgo;
    }).length,
    onLeave: staffArray.filter(s => s.employmentInfo?.status === 'on_leave').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Staff</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

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
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Staff Management</h1>
                <p className="text-white/70 mt-1">
                  Manage team members, schedules, and performance analytics
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleCreateStaff}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Staff</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Staff */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-100">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
              <p className="text-xs text-gray-500 mt-1">All employees</p>
            </div>
          </div>
        </div>

        {/* Active Staff */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeStaff}</p>
              <p className="text-xs text-gray-500 mt-1">Currently working</p>
            </div>
          </div>
        </div>

        {/* Recent Hires */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-purple-100">
              <UserPlusIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Recent Hires</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentHires}</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
          </div>
        </div>

        {/* On Leave */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-yellow-100">
              <CalendarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">On Leave</p>
              <p className="text-2xl font-bold text-gray-900">{stats.onLeave}</p>
              <p className="text-xs text-gray-500 mt-1">Currently away</p>
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
                  <Icon className={`h-5 w-5 ${isActive ? 'text-orange-500' : ''}`} />
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
              <StaffList
                staff={staff}
                onStaffSelect={handleStaffSelect}
                onEditStaff={handleEditStaff}
                onRefresh={refetch}
              />
            )}
            {activeTab === 'analytics' && (
              <StaffAnalytics stats={staff?.data} />
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Staff;
