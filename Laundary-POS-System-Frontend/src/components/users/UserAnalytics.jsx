import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiUsers, FiUserCheck, FiUserX, FiShield } from 'react-icons/fi';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getUserStats } from '../../services/userService';

const UserAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const result = await getUserStats();
      if (result.success) {
        setStats(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No statistics available</p>
      </div>
    );
  }

  // Calculate percentages
  const activePercentage = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
  const inactivePercentage = 100 - activePercentage;

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Users</p>
              <p className="text-4xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-50 rounded-full p-3">
              <FiUsers size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Users</p>
              <p className="text-4xl font-bold mt-2">{stats.active}</p>
              <p className="text-green-100 text-sm mt-1">{activePercentage}% of total</p>
            </div>
            <div className="bg-green-400 bg-opacity-50 rounded-full p-3">
              <FiUserCheck size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Inactive Users</p>
              <p className="text-4xl font-bold mt-2">{stats.inactive}</p>
              <p className="text-red-100 text-sm mt-1">{inactivePercentage}% of total</p>
            </div>
            <div className="bg-red-400 bg-opacity-50 rounded-full p-3">
              <FiUserX size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution Chart */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status Distribution</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Active Accounts</span>
              <span className="text-sm font-semibold text-green-600">{stats.active} ({activePercentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${activePercentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Inactive Accounts</span>
              <span className="text-sm font-semibold text-red-600">{stats.inactive} ({inactivePercentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-red-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${inactivePercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Role-based Statistics */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiShield className="mr-2" />
          Users by Role
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.byRole && Object.keys(stats.byRole).map((role) => {
            const roleData = stats.byRole[role];
            const roleActivePercentage = roleData.total > 0 
              ? Math.round((roleData.active / roleData.total) * 100) 
              : 0;
            
            return (
              <div key={role} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-gray-900 capitalize">{role}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {roleData.total} Total
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Active</span>
                    <span className="font-semibold text-green-600">
                      {roleData.active} ({roleActivePercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${roleActivePercentage}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Inactive</span>
                    <span className="font-semibold text-red-600">
                      {roleData.inactive} ({100 - roleActivePercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${100 - roleActivePercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.byRole && Object.keys(stats.byRole).map((role) => {
          const roleData = stats.byRole[role];
          return (
            <div key={role} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 capitalize mb-1">{role}s</div>
              <div className="text-2xl font-bold text-gray-900">{roleData.total}</div>
              <div className="text-xs text-gray-500 mt-1">
                {roleData.active} active, {roleData.inactive} inactive
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserAnalytics;

