import React, { useState } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import {
  useServiceStats,
  getPriceTypeLabel,
} from '../../services/serviceService';
import LoadingSpinner from '../ui/LoadingSpinner';

const ServiceAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const { data: stats, isLoading, error } = useServiceStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load service analytics</p>
      </div>
    );
  }

  const {
    overview = {},
    priceTypeBreakdown = {},
    popularServices = [],
  } = stats || {};

  // Calculate percentages for price type breakdown
  const priceTypeData = Object.entries(priceTypeBreakdown).map(([priceType, count]) => ({
    priceType,
    count,
    percentage: overview.totalServices ? (count / overview.totalServices * 100).toFixed(1) : 0,
    label: getPriceTypeLabel(priceType),
  }));


  // Get price type colors
  const getPriceTypeColor = (priceType) => {
    const colors = {
      per_piece: 'bg-blue-500',
      per_kg: 'bg-green-500',
      mixed: 'bg-purple-500',
    };
    return colors[priceType] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Service Analytics</h2>
          <p className="text-gray-600">Comprehensive service performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Services</p>
              <p className="text-2xl font-semibold text-gray-900">
                {overview.totalServices || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingBagIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Services</p>
              <p className="text-2xl font-semibold text-gray-900">
                {overview.activeServices || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Price</p>
              <p className="text-2xl font-semibold text-gray-900">
                LKR {overview.averagePrice ? overview.averagePrice.toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {overview.averageTime || 0} min
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Price Type Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Services by Pricing Model</h3>
        <div className="space-y-3">
          {priceTypeData.map(({ priceType, count, percentage, label }) => (
            <div key={priceType} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getPriceTypeColor(priceType)}`} />
                <span className="text-sm font-medium text-gray-900">{label}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">{count} services</span>
                <span className="text-sm font-medium text-gray-900">{percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Services */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Most Popular Services</h3>
        {popularServices.length > 0 ? (
          <div className="space-y-4">
            {popularServices.slice(0, 10).map((service, index) => (
              <div key={service._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{service.serviceName}</p>
                    <p className="text-xs text-gray-500">Service</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{service.orderCount}</p>
                    <p className="text-xs text-gray-500">Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{service.totalQuantity}</p>
                    <p className="text-xs text-gray-500">Quantity</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-600">LKR {service.totalRevenue}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No service usage data available</p>
          </div>
        )}
      </div>

      {/* Service Performance Trends */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Service Performance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Top Performing</p>
            <p className="text-lg font-semibold text-gray-900">
              {popularServices[0]?.serviceName || 'N/A'}
            </p>
            <p className="text-xs text-gray-500">
              {popularServices[0]?.orderCount || 0} orders
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Highest Revenue</p>
            <p className="text-lg font-semibold text-gray-900">
              {popularServices[0]?.serviceName || 'N/A'}
            </p>
            <p className="text-xs text-gray-500">
              LKR {popularServices[0]?.totalRevenue || 0}
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <ShoppingBagIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Most Ordered</p>
            <p className="text-lg font-semibold text-gray-900">
              {popularServices[0]?.serviceName || 'N/A'}
            </p>
            <p className="text-xs text-gray-500">
              {popularServices[0]?.totalQuantity || 0} items
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
        <p className="text-sm text-gray-600 mb-4">
          Use these insights to optimize your service offerings and pricing strategies.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            Export Report
          </button>
          <button className="px-4 py-2 bg-white text-blue-600 text-sm rounded-md border border-blue-600 hover:bg-blue-50">
            View Detailed Analytics
          </button>
          <button className="px-4 py-2 bg-white text-blue-600 text-sm rounded-md border border-blue-600 hover:bg-blue-50">
            Optimize Pricing
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceAnalytics;
