import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  ClipboardDocumentListIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TruckIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';
import OrderList from '../components/orders/OrderList';
import OrderAnalytics from '../components/orders/OrderAnalytics';
import PaymentModal from '../components/orders/PaymentModal';
import { useOrders, formatOrderAmount } from '../services/orderService';

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('list');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Handle pre-selected customer from navigation (from Customer page)
  useEffect(() => {
    if (location.state?.preSelectedCustomer) {
      navigate('/orders/new', { state: { preSelectedCustomer: location.state.preSelectedCustomer } });
    }
  }, [location.state, navigate]);

  const tabs = [
    { id: 'list', label: 'Orders', icon: DocumentTextIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
  ];

  const handleCreateOrder = () => {
    navigate('/orders/new');
  };

  const handleEditOrder = (order) => {
    navigate(`/orders/edit/${order._id}`);
  };

  const handleViewDetails = (order) => {
    navigate(`/orders/${order._id}`);
  };

  const handleProcessPayment = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleModalClose = () => {
    setShowPaymentModal(false);
    setSelectedOrder(null);
  };

  // Fetch order statistics using the hook directly
  const { data: statsData } = useOrders({
    page: 1,
    limit: 1,
  });

  const stats = statsData?.stats || {};
  const recentOrders = statsData?.orders?.slice(0, 5) || [];

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
                <ClipboardDocumentListIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Order Management</h1>
                <p className="text-white/70 mt-1">
                  Manage customer orders, track status, and process payments
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleCreateOrder}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                <PlusIcon className="h-5 w-5" />
                <span>Create Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status Overview - Priority Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Orders */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-orange-100">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Requires attention</p>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-100">
              <BoltIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processingOrders || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Currently processing</p>
            </div>
          </div>
        </div>

        {/* Ready for Delivery */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-purple-100">
              <TruckIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Ready</p>
              <p className="text-2xl font-bold text-gray-900">{stats.readyOrders || 0}</p>
              <p className="text-xs text-gray-500 mt-1">For pickup/delivery</p>
            </div>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-green-100">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatOrderAmount(stats.todayRevenue || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.todayOrders || 0} orders</p>
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
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content with Animation */}
        <div className="p-6 min-h-[400px]">
          <div className="animate-fadeIn">
            {activeTab === 'list' && (
              <OrderList
                onEditOrder={handleEditOrder}
                onViewDetails={handleViewDetails}
                onProcessPayment={handleProcessPayment}
              />
            )}
            {activeTab === 'analytics' && <OrderAnalytics />}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && selectedOrder && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handleModalClose}
          order={selectedOrder}
        />
      )}
    </div>
  );
};

export default Orders;
