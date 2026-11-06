import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UsersIcon,
  AcademicCapIcon,
  StarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../ui/LoadingSpinner';
import { customerService } from '../../services/customerService';
import { formatCurrency, formatDate } from '../../utils/helpers';

const CustomerAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30'); // days

  // Fetch customer statistics
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['customer-stats', timeRange],
    queryFn: () => customerService.getCustomerStats({ timeRange }),
  });

  const stats = statsData?.data || {};

  if (statsLoading) {
    return <LoadingSpinner size="lg" text="Loading customer analytics..." className="py-12" />;
  }

  if (statsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">Failed to load customer analytics</p>
        <p className="text-red-600 text-sm mt-2">Error: {statsError.message}</p>
      </div>
    );
  }

  const analyticsCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: stats.customersGrowth || 0,
      changeType: stats.customersGrowth >= 0 ? 'increase' : 'decrease',
    },
    {
      title: 'Student Customers',
      value: stats.studentCustomers || 0,
      icon: AcademicCapIcon,
      color: 'bg-green-500',
      change: stats.studentGrowth || 0,
      changeType: stats.studentGrowth >= 0 ? 'increase' : 'decrease',
      percentage: stats.totalCustomers > 0 ? Math.round((stats.studentCustomers / stats.totalCustomers) * 100) : 0,
    },
    {
      title: 'Returning Customers',
      value: stats.returningCustomers || 0,
      icon: StarIcon,
      color: 'bg-yellow-500',
      change: 0,
      changeType: 'increase',
      percentage: stats.totalCustomers > 0 ? Math.round(((stats.returningCustomers || 0) / stats.totalCustomers) * 100) : 0,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue || 0),
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      change: stats.revenueGrowth || 0,
      changeType: stats.revenueGrowth >= 0 ? 'increase' : 'decrease',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Analytics</h1>
          <p className="text-gray-600">
            Insights into your customer base and spending
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsCards.map((card) => {
          const Icon = card.icon;
          const ChangeIcon = card.changeType === 'increase' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
          
          return (
            <div key={card.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                  {card.percentage && (
                    <p className="text-xs text-gray-500 mt-1">
                      {card.percentage}% of total customers
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <ChangeIcon
                  className={`h-4 w-4 mr-1 ${
                    card.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {Math.abs(card.change)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs previous period</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers by Spend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers by Spend</h3>
          {stats.topCustomers && stats.topCustomers.length > 0 ? (
            <div className="space-y-3">
              {stats.topCustomers.slice(0, 5).map((customer, index) => (
                <div key={customer._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.fullName}</p>
                      <p className="text-xs text-gray-500">{customer.phoneNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(customer.totalSpent || 0)}</p>
                    <p className="text-xs text-gray-500">{customer.totalOrders || 0} orders</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No orders yet</p>
          )}
        </div>

        {/* Customer Growth Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Growth</h3>
          {stats.customerGrowthData && stats.customerGrowthData.length > 0 ? (
            <div className="space-y-3">
              {stats.customerGrowthData.slice(-7).map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{formatDate(data.date)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">+{data.newCustomers}</p>
                    <p className="text-xs text-gray-500">new customers</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No growth data available</p>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Key Insights</h3>
        <div className="space-y-3 text-sm text-blue-800">
          {stats.insights && stats.insights.length > 0 ? (
            stats.insights.map((insight, index) => (
              <p key={index}>• {insight}</p>
            ))
          ) : (
            <>
              <p>• Returning customers are your most valuable segment; follow up with those who haven't ordered recently</p>
              <p>• Student customers represent a significant portion of your base</p>
              <p>• Use Discounts to run targeted offers for new or returning customers</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;
