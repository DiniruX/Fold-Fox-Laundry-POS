import React, { useState } from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PencilIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

const USAGE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#14B8A6'];
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { customerService } from '../services/customerService';
import { formatCurrency, formatDate, getInitials } from '../utils/helpers';
import { getOrderStatusLabel, getOrderStatusColor } from '../services/orderService';
import { ORDER_STATUS } from '../constants';

const CustomerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

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

  // Fetch order history (filterable, paginated)
  const [historyFilter, setHistoryFilter] = useState({ status: '', page: 1 });
  const {
    data: orderHistoryData,
    isLoading: ordersLoading,
    isFetching: ordersFetching,
  } = useQuery({
    queryKey: ['customer-orders', id, historyFilter],
    queryFn: () => customerService.getCustomerOrderHistory(id, {
      page: historyFilter.page,
      limit: 10,
      ...(historyFilter.status ? { status: historyFilter.status } : {}),
    }),
    enabled: !!id,
    placeholderData: (previous) => previous,
  });

  const customer = customerData?.customer;
  const analytics = analyticsData?.data || {};
  const lifetime = analytics.lifetime || {};
  const serviceUsage = analytics.serviceUsage || [];
  const [usageMetric, setUsageMetric] = useState('totalSpent');
  const orderHistory = orderHistoryData?.data?.orders || [];
  const historyPagination = orderHistoryData?.data?.pagination || {};
  const historyAnalytics = orderHistoryData?.data?.analytics || null;

  // Start a new order with the same items as a previous one
  const handleReorder = (order) => {
    navigate('/orders/new', { state: { preSelectedCustomer: customer, reorderFrom: order } });
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserIcon },
    { id: 'orders', name: 'Orders', icon: DocumentTextIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  ];

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

        {/* Customer Type, Order Count and Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              {customer.isStudent && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 shadow-sm">
                  <AcademicCapIcon className="h-4 w-4 mr-1" />
                  Student
                </span>
              )}
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm bg-gray-100 text-gray-700">
                <ShoppingBagIcon className="h-4 w-4 mr-1" />
                {customer.totalOrders || 0} order{customer.totalOrders === 1 ? '' : 's'}
              </span>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                onClick={() => navigate('/orders/new', { state: { preSelectedCustomer: customer } })}
              >
                <ShoppingBagIcon className="h-4 w-4 mr-2" />
                Create Order
              </button>
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setActiveTab('orders')}
              >
                <ClockIcon className="h-4 w-4 mr-2" />
                Order History
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
                          {[customer.address.street, customer.address.city].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <ScaleIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Total Weight</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {Number(lifetime.totalWeight || 0).toLocaleString('en-LK', { maximumFractionDigits: 1 })} <span className="text-base text-gray-500">kg</span>
                        </p>
                        {lifetime.totalPieces > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">+ {lifetime.totalPieces} piece{lifetime.totalPieces === 1 ? '' : 's'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <ClockIcon className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Last Order</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {historyAnalytics?.lastOrderDate ? formatDate(historyAnalytics.lastOrderDate) : 'None yet'}
                        </p>
                        {historyAnalytics?.outstandingBalance > 0 && (
                          <p className="text-xs text-red-600 mt-0.5">{formatCurrency(historyAnalytics.outstandingBalance)} outstanding</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services this customer uses */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Services Used</h3>
                      <p className="text-xs text-gray-500">What this customer brings in, across all orders</p>
                    </div>
                    {serviceUsage.length > 0 && (
                      <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        {[{ v: 'totalSpent', l: 'Spend' }, { v: 'orderCount', l: 'Orders' }, { v: 'totalWeight', l: 'Weight' }].map((m) => (
                          <button
                            key={m.v}
                            type="button"
                            onClick={() => setUsageMetric(m.v)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md ${usageMetric === m.v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            {m.l}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {analyticsLoading ? (
                    <LoadingSpinner size="md" />
                  ) : serviceUsage.length === 0 ? (
                    <p className="text-sm text-gray-500 py-6 text-center">No services used yet</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                      <div className="lg:col-span-3">
                        <ResponsiveContainer width="100%" height={Math.max(220, serviceUsage.length * 44)}>
                          <BarChart data={serviceUsage} layout="vertical" margin={{ left: 8, right: 24 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => usageMetric === 'totalSpent' ? `LKR ${Number(v).toLocaleString()}` : usageMetric === 'totalWeight' ? `${v} kg` : v} />
                            <YAxis type="category" dataKey="serviceName" width={130} tick={{ fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                              formatter={(value) => [
                                usageMetric === 'totalSpent' ? formatCurrency(value) : usageMetric === 'totalWeight' ? `${value} kg` : `${value} order${value === 1 ? '' : 's'}`,
                                usageMetric === 'totalSpent' ? 'Spent' : usageMetric === 'totalWeight' ? 'Weight' : 'Orders',
                              ]}
                            />
                            <Bar dataKey={usageMetric} radius={[0, 6, 6, 0]}>
                              {serviceUsage.map((entry, index) => (
                                <Cell key={entry._id || index} fill={entry.color || USAGE_COLORS[index % USAGE_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="lg:col-span-2 space-y-2">
                        {serviceUsage.map((u, index) => {
                          const share = lifetime.totalSpent > 0 ? Math.round((u.totalSpent / lifetime.totalSpent) * 100) : 0;
                          return (
                            <div key={u._id || index} className="p-3 rounded-lg border border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: u.color || USAGE_COLORS[index % USAGE_COLORS.length] }} />
                                  <p className="text-sm font-semibold text-gray-900 truncate">{u.serviceName}</p>
                                </div>
                                <span className="text-xs font-bold text-gray-700">{share}%</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {u.orderCount} order{u.orderCount === 1 ? '' : 's'} · {formatCurrency(u.totalSpent)}
                                {u.totalWeight > 0 ? ` · ${u.totalWeight} kg` : ''}{u.totalQuantity > 0 ? ` · ${u.totalQuantity} pcs` : ''}
                              </p>
                              <p className="text-[11px] text-gray-400">Last used {formatDate(u.lastUsed)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Order History</h3>
                    {historyAnalytics && (
                      <p className="text-sm text-gray-500">
                        {historyAnalytics.totalOrders} order{historyAnalytics.totalOrders === 1 ? '' : 's'} · {formatCurrency(historyAnalytics.totalSpent || 0)} total · avg {formatCurrency(historyAnalytics.averageOrderValue || 0)}
                        {historyAnalytics.outstandingBalance > 0 && (
                          <span className="text-red-600 font-medium"> · {formatCurrency(historyAnalytics.outstandingBalance)} unpaid</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={historyFilter.status}
                      onChange={(e) => setHistoryFilter({ status: e.target.value, page: 1 })}
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-[#fe7f2d]"
                    >
                      <option value="">All statuses</option>
                      {Object.values(ORDER_STATUS).map((status) => (
                        <option key={status} value={status}>{getOrderStatusLabel(status)}</option>
                      ))}
                    </select>
                    {ordersFetching && !ordersLoading && <LoadingSpinner size="sm" />}
                  </div>
                </div>

                {ordersLoading ? (
                  <LoadingSpinner size="md" text="Loading order history..." />
                ) : orderHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {historyFilter.status ? 'No orders with this status.' : "This customer hasn't placed any orders yet."}
                    </p>
                    {!historyFilter.status && (
                      <Button className="mt-4" onClick={() => navigate('/orders/new', { state: { preSelectedCustomer: customer } })}>
                        <ShoppingBagIcon className="h-4 w-4" />
                        Create first order
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {orderHistory.map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${order._id}`)}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <p className="text-sm font-semibold text-gray-900 font-mono">{order.orderNumber}</p>
                                <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-gray-800 truncate max-w-[260px]">
                                  {(order.items || []).map((i) => `${i.serviceName}${i.weight > 0 ? ` ${i.weight}kg` : ` ×${i.quantity}`}`).join(', ') || '—'}
                                </p>
                                {order.extraCharges?.items?.length > 0 && (
                                  <p className="text-xs text-purple-600">+ {order.extraCharges.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}</p>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs">
                                <div className="flex flex-wrap gap-1">
                                  {order.pickupRequired && <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-medium">📦 Pickup</span>}
                                  {order.deliveryRequired && (
                                    <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-800 font-medium">
                                      🚚 {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'Delivery'}
                                    </span>
                                  )}
                                  {!order.pickupRequired && !order.deliveryRequired && <span className="text-gray-400">Walk-in</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                  {getOrderStatusLabel(order.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                                <p className={`text-xs font-medium ${order.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {order.balanceAmount > 0 ? `${formatCurrency(order.balanceAmount)} due` : '✓ Paid'}
                                </p>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => navigate(`/orders/${order._id}`)}
                                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleReorder(order)}
                                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
                                    title="Start a new order with the same items"
                                  >
                                    Reorder
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {historyPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Page {historyPagination.currentPage} of {historyPagination.totalPages} · {historyPagination.totalOrders} orders</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" disabled={!historyPagination.hasPrev} onClick={() => setHistoryFilter((f) => ({ ...f, page: f.page - 1 }))}>Prev</Button>
                          <Button variant="outline" size="sm" disabled={!historyPagination.hasNext} onClick={() => setHistoryFilter((f) => ({ ...f, page: f.page + 1 }))}>Next</Button>
                        </div>
                      </div>
                    )}
                  </>
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

    </div>
  );
};

export default CustomerDetailsPage;

