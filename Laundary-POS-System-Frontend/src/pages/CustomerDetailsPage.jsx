import React, { useState } from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PencilIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import LoyaltyManager from '../components/customers/LoyaltyManager';
import { customerService } from '../services/customerService';
import { formatCurrency, formatDate, getInitials, capitalize } from '../utils/helpers';

const CustomerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);

  // Fetch detailed customer data
  const {
    data: customerData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getCustomerById(id),
    enabled: !!id,
  });

  // Fetch customer analytics
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
  } = useQuery({
    queryKey: ['customer-analytics', id],
    queryFn: () => customerService.getCustomerAnalytics(id),
    enabled: !!id,
  });

  // Fetch order history
  const {
    data: orderHistoryData,
    isLoading: ordersLoading,
  } = useQuery({
    queryKey: ['customer-orders', id],
    queryFn: () => customerService.getCustomerOrderHistory(id),
    enabled: !!id,
  });

  const customer = customerData?.customer;
  const analytics = analyticsData?.data || {};
  const orderHistory = orderHistoryData?.data?.orders || [];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserIcon },
    { id: 'orders', name: 'Orders', icon: DocumentTextIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  ];

  const getLoyaltyTierColor = (points) => {
    if (points >= 1000) return 'bg-purple-100 text-purple-800';
    if (points >= 500) return 'bg-blue-100 text-blue-800';
    if (points >= 100) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getLoyaltyTierName = (points) => {
    if (points >= 1000) return 'VIP';
    if (points >= 500) return 'Gold';
    if (points >= 100) return 'Silver';
    return 'Bronze';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading customer details..." />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900">Error loading customer</h3>
          <p className="mt-2 text-sm text-red-700">
            {error?.message || 'Customer not found'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/customers')}
          >
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Customers
        </button>

        {/* Enhanced Header with Profile */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="h-20 w-20 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                <span className="text-white font-bold text-3xl">
                  {getInitials(customer.fullName)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {customer.fullName}
                </h1>
                <div className="flex items-center space-x-3 mt-2">
                  <span className="flex items-center text-sm text-blue-100">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Member since {formatDate(customer.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/customers/edit/${customer._id}`)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {/* Customer Type, Loyalty and Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              {customer.isStudent && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 shadow-sm">
                  <AcademicCapIcon className="h-4 w-4 mr-1" />
                  Student
                </span>
              )}
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm ${getLoyaltyTierColor(
                  customer.loyaltyPoints || 0
                )}`}
              >
                <StarIcon className="h-4 w-4 mr-1" />
                {getLoyaltyTierName(customer.loyaltyPoints || 0)} • {customer.loyaltyPoints || 0} points
              </span>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                onClick={() => navigate('/orders', { state: { preSelectedCustomer: customer } })}
              >
                <ShoppingBagIcon className="h-4 w-4 mr-2" />
                Create Order
              </button>
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowLoyaltyModal(true)}
              >
                <StarIcon className="h-4 w-4 mr-2" />
                Manage Loyalty
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex px-6 space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{customer.phoneNumber}</p>
                      </div>
                    </div>
                    {customer.campusId && (
                      <div className="flex items-center space-x-3">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Campus ID</p>
                          <p className="text-sm font-medium text-gray-900">{customer.campusId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                {customer.address && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {customer.address.street}
                        </p>
                        <p className="text-sm text-gray-900">
                          {customer.address.city}, {customer.address.state} {customer.address.zipCode}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Total Orders</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {customer.totalOrders || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Total Spent</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {formatCurrency(customer.totalSpent || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <StarIcon className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Loyalty Points</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {customer.loyaltyPoints || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Order History</h3>
                {ordersLoading ? (
                  <LoadingSpinner size="md" text="Loading order history..." />
                ) : orderHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This customer hasn't placed any orders yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderHistory.map((order) => (
                      <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Order #{order.orderNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(order.totalAmount)}
                            </p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {capitalize(order.status.replace('_', ' '))}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Customer Analytics</h3>
                {analyticsLoading ? (
                  <LoadingSpinner size="md" text="Loading analytics..." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Average Order Value</h4>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(analytics?.overview?.averageOrderValue || 0)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Total Orders</h4>
                      <p className="text-2xl font-semibold text-gray-900">
                        {analytics?.overview?.totalOrders || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Last Order</h4>
                      <p className="text-sm text-gray-900">
                        {analytics?.overview?.lastOrderDate ? formatDate(analytics.overview.lastOrderDate) : 'No orders'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Total Spent</h4>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(analytics?.overview?.totalSpent || 0)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loyalty Manager Modal */}
      {customer && (
        <LoyaltyManager
          isOpen={showLoyaltyModal}
          onClose={() => setShowLoyaltyModal(false)}
          customer={customer}
          onSuccess={() => {
            setShowLoyaltyModal(false);
            // Refetch customer data to update loyalty points
            queryClient.invalidateQueries(['customer', id]);
            queryClient.invalidateQueries(['customer-analytics', id]);
          }}
        />
      )}
    </div>
  );
};

export default CustomerDetailsPage;

