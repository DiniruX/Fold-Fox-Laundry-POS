import React, { useState } from 'react';
import {
  UsersIcon,
  ChartBarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import CustomerList from '../components/customers/CustomerList';
import CustomerAnalytics from '../components/customers/CustomerAnalytics';
import LoyaltyManager from '../components/customers/LoyaltyManager';
import Button from '../components/ui/Button';
import { customerService } from '../services/customerService';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const Customers = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  
  const navigate = useNavigate();

  // Fetch recent customers for quick access
  const { data: recentCustomersData } = useQuery({
    queryKey: ['recent-customers'],
    queryFn: () => customerService.getCustomers({ 
      page: 1, 
      limit: 5, 
      sortBy: 'createdAt', 
      sortOrder: 'desc' 
    }),
  });

  const recentCustomers = recentCustomersData?.customers || [];

  const tabs = [
    { id: 'list', name: 'All Customers', icon: UsersIcon, badge: null },
    { id: 'analytics', name: 'Analytics & Insights', icon: ChartBarIcon, badge: null },
  ];

  const handleLoyaltyManage = (customer) => {
    setSelectedCustomer(customer);
    setShowLoyaltyModal(true);
  };

  const handleCreateOrder = (customer) => {
    // Navigate to orders page with customer pre-selected
    navigate('/orders', { state: { preSelectedCustomer: customer } });
  };

  const handleQuickCustomerAccess = (customer) => {
    setSelectedCustomer(customer);
    setActiveTab('list');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return (
          <CustomerList
            onLoyaltyManage={handleLoyaltyManage}
            onCustomerSelect={setSelectedCustomer}
            onCreateOrder={handleCreateOrder}
            preSelectedCustomer={selectedCustomer}
          />
        );
      case 'analytics':
        return <CustomerAnalytics />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card with Quick Actions */}
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
                <UsersIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Customer Management</h1>
                <p className="text-white/70 mt-1">
                  Manage your customer database, loyalty programs, and analytics
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/customers/new')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel - Priority Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Search Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fe7f2d20' }}>
              <MagnifyingGlassIcon className="h-5 w-5" style={{ color: '#fe7f2d' }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quick Search</h3>
              <p className="text-xs text-gray-500">Find customer instantly</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Phone or email..."
              value={quickSearchTerm}
              onChange={(e) => setQuickSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
            {quickSearchTerm && (
              <button
                onClick={() => {
                  setActiveTab('list');
                  // The search will be handled by CustomerList component
                }}
                className="absolute right-2 top-2 px-3 py-1 text-xs font-medium text-white rounded-md"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                Search
              </button>
            )}
          </div>
        </div>

        {/* Selected Customer Actions */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#233d4d20' }}>
              <SparklesIcon className="h-5 w-5" style={{ color: '#233d4d' }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-xs text-gray-500">
                {selectedCustomer ? selectedCustomer.fullName : 'Select a customer'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => selectedCustomer && handleCreateOrder(selectedCustomer)}
              disabled={!selectedCustomer}
              className={`w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                selectedCustomer
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBagIcon className="h-4 w-4" />
              <span>Create Order</span>
            </button>
            <button
              onClick={() => selectedCustomer && setShowLoyaltyModal(true)}
              disabled={!selectedCustomer}
              className={`w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                selectedCustomer
                  ? 'hover:bg-gray-50 text-gray-700 border-2 border-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-100'
              }`}
            >
              <StarIcon className="h-4 w-4" />
              <span>Manage Loyalty</span>
            </button>
          </div>
        </div>

        {/* Recent Customers */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-50">
              <ClockIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Recent Customers</h3>
              <p className="text-xs text-gray-500">Last 5 added</p>
            </div>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentCustomers.length > 0 ? (
              recentCustomers.map((customer) => (
                <button
                  key={customer._id}
                  onClick={() => handleQuickCustomerAccess(customer)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {customer.fullName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{customer.phoneNumber}</p>
                  </div>
                  <StarIcon className={`h-4 w-4 flex-shrink-0 ml-2 ${
                    customer.loyaltyPoints >= 500 ? 'text-yellow-500' : 'text-gray-300'
                  }`} />
                </button>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No recent customers</p>
            )}
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
                  {tab.badge && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content with Animation */}
        <div className="p-6 min-h-[400px]">
          <div className="animate-fadeIn">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Loyalty Modal */}
      {selectedCustomer && (
        <LoyaltyManager
          isOpen={showLoyaltyModal}
          onClose={() => {
            setShowLoyaltyModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onSuccess={() => {
            setShowLoyaltyModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export default Customers;
