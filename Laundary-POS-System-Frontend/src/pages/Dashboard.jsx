import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { ROUTES } from '../constants';
import { reportsAPI, ordersAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, isAdmin, isCashier } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalCustomers: 0,
    activeOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats and recent orders in parallel
        const [statsResponse, ordersResponse] = await Promise.all([
          reportsAPI.getDashboardStats(),
          ordersAPI.getAll({ limit: 3, sort: '-createdAt' })
        ]);

        // Process stats data
        const statsData = statsResponse.data.stats;
        setStats({
          totalOrders: statsData.monthOrders || 0,
          todayOrders: statsData.todayOrders || 0,
          totalRevenue: statsData.monthRevenue || 0,
          todayRevenue: statsData.todayRevenue || 0,
          totalCustomers: statsData.totalCustomers || 0,
          activeOrders: statsData.pendingOrders || 0,
          pendingOrders: statsData.pendingOrders || 0,
          completedOrders: 0, // Can be calculated if needed
        });

        // Process recent orders data
        const ordersData = ordersResponse.data.orders || [];
        setRecentOrders(ordersData.map(order => ({
          id: order.orderNumber,
          customer: order.customer?.fullName || 'Unknown Customer',
          amount: order.totalAmount,
          status: order.orderStatus,
          createdAt: order.createdAt,
        })));

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
        
        // Set empty data on error
        setStats({
          totalOrders: 0,
          todayOrders: 0,
          totalRevenue: 0,
          todayRevenue: 0,
          totalCustomers: 0,
          activeOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
        });
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      received: 'bg-blue-100 text-blue-800',
      washing: 'bg-yellow-100 text-yellow-800',
      drying: 'bg-orange-100 text-orange-800',
      ready_for_pickup: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      received: 'Received',
      washing: 'Washing',
      drying: 'Drying',
      ready_for_pickup: 'Ready for Pickup',
      delivered: 'Delivered',
    };
    return labels[status] || status;
  };

  const statCards = [
    {
      name: 'This Month Orders',
      value: stats.totalOrders,
      icon: ClipboardDocumentListIcon,
      color: '#fe7f2d',
      bgColor: 'rgba(254, 127, 45, 0.1)',
      subtitle: `${stats.todayOrders} today`,
      trend: '+12%',
    },
    {
      name: 'Today\'s Revenue',
      value: formatCurrency(stats.todayRevenue),
      icon: CurrencyDollarIcon,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      subtitle: `${formatCurrency(stats.totalRevenue)} this month`,
      trend: '+8%',
    },
    {
      name: 'Total Customers',
      value: stats.totalCustomers,
      icon: UsersIcon,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      subtitle: 'Active customers',
      trend: '+5%',
    },
    {
      name: 'Pending Orders',
      value: stats.activeOrders,
      icon: ClockIcon,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      subtitle: 'In progress',
      trend: '-3%',
    },
  ];

  const quickActions = [
    {
      name: 'Create Order',
      description: 'Start a new laundry order',
      href: ROUTES.ORDERS,
      icon: SparklesIcon,
      color: '#fe7f2d',
      bgColor: 'rgba(254, 127, 45, 0.1)',
    },
    {
      name: 'Add Customer',
      description: 'Register a new customer',
      href: ROUTES.CUSTOMERS,
      icon: UsersIcon,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    ...(isAdmin() ? [
      {
        name: 'Manage Services',
        description: 'Update service catalog',
        href: ROUTES.SERVICES,
        icon: WrenchScrewdriverIcon,
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
      },
      {
        name: 'Staff Management',
        description: 'Manage staff members',
        href: ROUTES.STAFF,
        icon: UserGroupIcon,
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
      },
    ] : []),
    {
      name: 'View Reports',
      description: 'Business analytics',
      href: ROUTES.REPORTS,
      icon: ChartBarIcon,
      color: '#6366f1',
      bgColor: 'rgba(99, 102, 241, 0.1)',
    },
  ];

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header Card */}
      <div 
        className="rounded-2xl shadow-lg overflow-hidden relative"
        style={{ 
          background: 'linear-gradient(135deg, rgba(35, 61, 77, 0.95) 0%, rgba(42, 74, 92, 0.95) 100%)',
        }}
      >
        {/* Background Image (Add your image path here) */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("/images/laundry-background.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div 
                className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-xl"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                <SparklesIcon className="h-9 w-9 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-white/80 mt-1.5 text-lg">
                  {isAdmin() 
                    ? "Here's your business overview for today." 
                    : "Ready to process orders and serve customers."}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-white/60 text-sm font-medium">Current Date</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div 
                className="h-12 w-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(254, 127, 45, 0.2)' }}
              >
                <ArrowTrendingUpIcon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          {/* Role Badge */}
          <div className="mt-6 inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ 
              backgroundColor: 'rgba(254, 127, 45, 0.15)',
              color: '#fe7f2d'
            }}
          >
            {isAdmin() ? (
              <>
                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                Administrator Dashboard
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Cashier Terminal
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div 
            key={card.name} 
            className="bg-white overflow-hidden shadow-md rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: card.bgColor }}
                >
                  <card.icon 
                    className="h-7 w-7" 
                    style={{ color: card.color }}
                  />
                </div>
                <span 
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    card.trend.startsWith('+') 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {card.trend}
                </span>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {card.name}
                </p>
                <p className="text-3xl font-bold mb-2" style={{ color: '#233d4d' }}>
                  {card.value}
                </p>
                <p className="text-xs text-gray-500">
                  {card.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#233d4d' }}>
              Quick Actions
            </h2>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(254, 127, 45, 0.1)' }}
            >
              <SparklesIcon className="h-5 w-5" style={{ color: '#fe7f2d' }} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="group relative rounded-xl border-2 border-gray-100 bg-white px-5 py-4 flex items-center space-x-4 hover:border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div 
                  className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-200"
                  style={{ backgroundColor: action.bgColor }}
                >
                  <action.icon 
                    className="h-6 w-6" 
                    style={{ color: action.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                    {action.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {action.description}
                  </p>
                </div>
                <svg 
                  className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform duration-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#233d4d' }}>
              Recent Orders
            </h2>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(254, 127, 45, 0.1)' }}
            >
              <ClipboardDocumentListIcon className="h-5 w-5" style={{ color: '#fe7f2d' }} />
            </div>
          </div>
          <div className="flow-root">
            {recentOrders.length > 0 ? (
              <ul className="space-y-3">
                {recentOrders.map((order) => (
                  <li 
                    key={order.id} 
                    className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div 
                          className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'rgba(254, 127, 45, 0.1)' }}
                        >
                          <ClipboardDocumentListIcon 
                            className="h-5 w-5" 
                            style={{ color: '#fe7f2d' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {order.id}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {order.customer}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                        <span className="text-sm font-bold" style={{ color: '#233d4d' }}>
                          {formatCurrency(order.amount)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                {/* Empty State Illustration (Add your image path here) */}
                <img 
                  src="/images/empty-orders.svg" 
                  alt="No orders illustration" 
                  className="mx-auto h-40 w-40 mb-4 opacity-80"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                {/* Fallback icon (hidden by default, shown if image fails) */}
                <div 
                  className="mx-auto h-20 w-20 rounded-2xl items-center justify-center mb-4 hidden"
                  style={{ backgroundColor: 'rgba(254, 127, 45, 0.1)' }}
                >
                  <ClipboardDocumentListIcon 
                    className="h-10 w-10" 
                    style={{ color: '#fe7f2d' }}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">No orders yet</p>
                <p className="text-xs text-gray-500">Create your first order to get started</p>
              </div>
            )}
          </div>
          <div className="mt-6">
            <Link
              to={ROUTES.ORDERS}
              className="w-full flex justify-center items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: '#fe7f2d',
                color: 'white'
              }}
            >
              View all orders
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Role-based additional content */}
      {isAdmin() && (
        <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#233d4d' }}>
                Admin Quick Access
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage core system components
              </p>
            </div>
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(254, 127, 45, 0.1)' }}
            >
              <ShieldCheckIcon className="h-6 w-6" style={{ color: '#fe7f2d' }} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to={ROUTES.USERS}
              className="group text-center p-6 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div 
                className="h-14 w-14 mx-auto mb-3 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
              >
                <ShieldCheckIcon className="h-7 w-7" style={{ color: '#6366f1' }} />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">User Management</p>
              <p className="text-xs text-gray-500">Manage system users</p>
            </Link>
            
            <Link
              to={ROUTES.STAFF}
              className="group text-center p-6 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div 
                className="h-14 w-14 mx-auto mb-3 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
              >
                <UserGroupIcon className="h-7 w-7" style={{ color: '#f59e0b' }} />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Staff Management</p>
              <p className="text-xs text-gray-500">Manage staff members</p>
            </Link>
            
            <Link
              to={ROUTES.SERVICES}
              className="group text-center p-6 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div 
                className="h-14 w-14 mx-auto mb-3 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
              >
                <WrenchScrewdriverIcon className="h-7 w-7" style={{ color: '#8b5cf6' }} />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Service Catalog</p>
              <p className="text-xs text-gray-500">Manage services</p>
            </Link>
          </div>
        </div>
      )}

      {/* Performance Tip for Cashiers */}
      {isCashier() && (
        <div 
          className="rounded-xl p-6 relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, rgba(254, 127, 45, 0.1) 0%, rgba(254, 127, 45, 0.05) 100%)',
            border: '2px dashed rgba(254, 127, 45, 0.3)'
          }}
        >
          <div className="flex items-start space-x-4">
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#fe7f2d' }}
            >
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#233d4d' }}>
                💡 Pro Tip
              </h3>
              <p className="text-sm text-gray-600">
                Use the "Create Order" quick action to start processing customer orders quickly. 
                You can also use keyboard shortcuts for faster navigation!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
