import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
  ClipboardDocumentIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentTextIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useOrders } from '../../services/orderService';
import {
  getOrderStatusLabel,
  getOrderStatusColor,
  formatOrderNumber,
  formatOrderDate,
  formatOrderAmount,
} from '../../services/orderService';
import {
  ORDER_STATUS,
  SERVICE_STATUSES,
} from '../../constants';
import { getStatusLabel } from '../../services/serviceService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

// Helper function to get order phase label and styling
const getOrderPhaseInfo = (phase) => {
  const phaseMap = {
    draft: { label: 'Draft', color: 'bg-gray-500', textColor: 'text-white', icon: '📝' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-500', textColor: 'text-white', icon: '✅' },
    processing: { label: 'Processing', color: 'bg-purple-500', textColor: 'text-white', icon: '⚙️' },
    completed: { label: 'Completed', color: 'bg-green-500', textColor: 'text-white', icon: '✨' },
    cancelled: { label: 'Cancelled', color: 'bg-red-500', textColor: 'text-white', icon: '❌' }
  };
  return phaseMap[phase] || { label: 'Unknown', color: 'bg-gray-400', textColor: 'text-white', icon: '❓' };
};

const MIN_SEARCH_LENGTH = 2;

const OrderList = ({ onEditOrder, onViewDetails, onProcessPayment, onDeleteOrder }) => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    serviceStatus: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Get current user for role check
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useOrders(filters);

  const orders = response?.orders || [];
  const pagination = response?.pagination || {};
  const stats = response?.stats || {};

  const [searchInput, setSearchInput] = useState('');
  const [searchHint, setSearchHint] = useState('');

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset to page 1 when changing other filters
    }));
  };

  const applySearch = () => {
    const trimmed = searchInput.trim();

    if (trimmed.length === 0) {
      setSearchHint('');
      handleFilterChange('search', '');
      return;
    }

    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setSearchHint(`Type at least ${MIN_SEARCH_LENGTH} characters to search`);
      return;
    }

    setSearchHint('');
    handleFilterChange('search', trimmed);
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applySearch();
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentStatus: '',
      serviceStatus: '',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setSearchInput('');
    setSearchHint('');
  };

  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.status || filters.paymentStatus || filters.serviceStatus;

  // Handle order selection
  const handleOrderSelect = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order._id));
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action) => {
    if (selectedOrders.length === 0) {
      alert('Please select orders first');
      return;
    }

    switch (action) {
      case 'print':
        console.log('Print selected orders:', selectedOrders);
        break;
      case 'export':
        console.log('Export selected orders:', selectedOrders);
        break;
      default:
        break;
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load orders. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards with Click-to-Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => clearFilters()}
          className="bg-white p-6 rounded-xl shadow-md border-2 border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
                <p className="text-xs text-blue-600 mt-1">View all →</p>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleFilterChange('paymentStatus', 'unpaid')}
          className="bg-white p-6 rounded-xl shadow-md border-2 border-gray-100 hover:border-orange-300 hover:shadow-lg transition-all duration-200 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders || 0}</p>
                <p className="text-xs text-orange-600 mt-1">Filter pending →</p>
              </div>
            </div>
          </div>
        </button>

        <div className="bg-white p-6 rounded-xl shadow-md border-2 border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatOrderAmount(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-2 border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatOrderAmount(stats.averageOrderValue)}</p>
                <p className="text-xs text-gray-500 mt-1">Per order</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 gap-4">
          <div className="flex-1 max-w-2xl">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Quick Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by order number, customer name, or phone..."
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyDown={handleSearchKeyDown}
                className="pl-10 pr-20"
              />
              <button
                type="button"
                onClick={applySearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm font-medium text-white rounded-lg"
                style={{ backgroundColor: '#fe7f2d' }}
                disabled={isLoading}
              >
                Search
              </button>
            </div>
            {searchHint && (
              <p className="mt-2 text-xs text-red-600">{searchHint}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#fe7f2d', color: 'white' }}>
                  {Object.values(filters).filter(v => v && typeof v === 'string' && v !== 'createdAt' && v !== 'desc').length}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {Object.values(ORDER_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {getOrderStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Payments</option>
                <option value="paid">Fully Paid</option>
                <option value="unpaid">Unpaid / Partial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select
                value={filters.serviceStatus}
                onChange={(e) => handleFilterChange('serviceStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Service Types</option>
                {Object.entries(SERVICE_STATUSES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {getStatusLabel(value)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="totalAmount-desc">Highest Amount</option>
                <option value="totalAmount-asc">Lowest Amount</option>
                <option value="pickupRequired-asc">Pickup Required</option>
                <option value="deliveryRequired-asc">Delivery Required</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('print')}
                className="flex items-center"
              >
                <PrinterIcon className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
                className="flex items-center"
              >
                <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more orders.'
                : 'Get started by creating your first order.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr 
                    key={order._id} 
                    className={`hover:bg-gray-50 transition-colors duration-150 group ${
                      selectedOrders.includes(order._id) ? 'bg-orange-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleOrderSelect(order._id)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {formatOrderNumber(order.orderNumber)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatOrderDate(order.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {order.customerInfo?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.customerInfo?.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {(() => {
                          const phaseInfo = getOrderPhaseInfo(order.orderPhase || 'draft');
                          return (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${phaseInfo.color} ${phaseInfo.textColor}`}>
                              {phaseInfo.icon} {phaseInfo.label}
                            </span>
                          );
                        })()}
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold shadow-sm ${getOrderStatusColor(order.status)}`}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatOrderAmount(order.totalAmount)}
                      </div>
                      <div className={`text-xs font-medium mt-1 ${order.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {order.balanceAmount > 0 ? `${formatOrderAmount(order.balanceAmount)} due` : '✓ Paid'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {order.pickupRequired && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            📦 Pickup
                          </span>
                        )}
                        {order.deliveryRequired && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                            🚚 Delivery{order.deliveryCharges === 0 && order.deliveryDistance > 0 && order.deliveryDistance <= 40 ? ' (FREE)' : ''}
                          </span>
                        )}
                        {!order.pickupRequired && !order.deliveryRequired && (
                          <span className="text-gray-400 text-xs">Self-service</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Priority Action - View Details (Always Visible) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(order);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                        
                        {/* Priority Action - Process Payment (Always Visible if needed) */}
                        {order.balanceAmount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onProcessPayment(order);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                            title="Process Payment"
                          >
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            Pay
                          </button>
                        )}
                        
                        {/* Secondary Actions - Show on Hover */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {order.isEditable !== false && (order.orderPhase === 'draft' || (order.orderPhase === 'confirmed' && order.paidAmount === 0)) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditOrder(order);
                              }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                              title="Edit Order"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="p-1.5 rounded-lg cursor-not-allowed text-gray-300"
                              title="Order cannot be edited (processing or completed)"
                              disabled
                            >
                              <LockClosedIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBulkAction('print', [order._id]);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Print Order"
                          >
                            <PrinterIcon className="h-4 w-4" />
                          </button>
                          {isAdmin && onDeleteOrder && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete order ${order.orderNumber}? This cannot be undone!`)) {
                                  onDeleteOrder(order);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                              title="Delete Order (Admin Only)"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {((pagination.currentPage - 1) * filters.limit) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * filters.limit, pagination.totalOrders)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalOrders}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="rounded-l-md"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="rounded-r-md"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
