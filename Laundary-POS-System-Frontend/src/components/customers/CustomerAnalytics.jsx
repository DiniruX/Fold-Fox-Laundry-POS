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
      title: 'Average Loyalty Points',
      value: Math.round(stats.averageLoyaltyPoints || 0),
      icon: StarIcon,
      color: 'bg-yellow-500',
      change: stats.loyaltyGrowth || 0,
      changeType: stats.loyaltyGrowth >= 0 ? 'increase' : 'decrease',
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

  const loyaltyTiers = [
    {
      name: 'VIP',
      minPoints: 1000,
      customers: stats.vipCustomers || 0,
      color: 'bg-purple-100 text-purple-800',
    },
    {
      name: 'Gold',
      minPoints: 500,
      customers: stats.goldCustomers || 0,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      name: 'Silver',
      minPoints: 100,
      customers: stats.silverCustomers || 0,
      color: 'bg-green-100 text-green-800',
    },
    {
      name: 'Bronze',
      minPoints: 0,
      customers: stats.bronzeCustomers || 0,
      color: 'bg-gray-100 text-gray-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Analytics</h1>
          <p className="text-gray-600">
            Insights into your customer base and loyalty program
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

      {/* Loyalty Tiers Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Loyalty Tiers Distribution</h3>
          <ChartBarIcon className="h-6 w-6 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {loyaltyTiers.map((tier) => {
            const percentage = stats.totalCustomers > 0 
              ? Math.round((tier.customers / stats.totalCustomers) * 100) 
              : 0;
            
            return (
              <div key={tier.name} className="text-center">
                <div className="mb-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${tier.color}`}>
                    <StarIcon className="h-4 w-4 mr-1" />
                    {tier.name}
                  </span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">{tier.customers}</p>
                <p className="text-sm text-gray-500">{percentage}% of customers</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      tier.name === 'VIP' ? 'bg-purple-500' :
                      tier.name === 'Gold' ? 'bg-blue-500' :
                      tier.name === 'Silver' ? 'bg-green-500' :
                      'bg-gray-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers by Loyalty */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Loyalty Customers</h3>
          {stats.topLoyaltyCustomers && stats.topLoyaltyCustomers.length > 0 ? (
            <div className="space-y-3">
              {stats.topLoyaltyCustomers.slice(0, 5).map((customer, index) => (
                <div key={customer._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.fullName}</p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{customer.loyaltyPoints} pts</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No loyalty data available</p>
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
              <p>• Focus on increasing customer loyalty through targeted promotions</p>
              <p>• Student customers represent a significant portion of your base</p>
              <p>• Consider implementing tier-based rewards to encourage higher spending</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;
