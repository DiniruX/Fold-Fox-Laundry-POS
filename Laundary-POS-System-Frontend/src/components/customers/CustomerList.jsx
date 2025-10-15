import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  Squares2X2Icon,
  TableCellsIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import Modal from '../ui/Modal';
import { customerService } from '../../services/customerService';
import { formatCurrency, formatDate, getInitials, capitalize } from '../../utils/helpers';

const CustomerList = ({ onCustomerSelect, onLoyaltyManage, onCreateOrder, preSelectedCustomer }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [filters, setFilters] = useState({
    isStudent: '',
    loyaltyTier: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [selectedCustomer, setSelectedCustomer] = useState(preSelectedCustomer || null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Update selected customer when prop changes
  useEffect(() => {
    if (preSelectedCustomer) {
      setSelectedCustomer(preSelectedCustomer);
    }
  }, [preSelectedCustomer]);

  const queryClient = useQueryClient();

  // Fetch customers query
  const {
    data: customersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customers', pagination, filters, searchTerm],
    queryFn: () => {
      // Use search endpoint if search term is provided
      if (searchTerm && searchTerm.length >= 2) {
        return customerService.searchCustomers({
          q: searchTerm,
          limit: pagination.limit
        });
      }
      // Otherwise use regular get customers with filters
      return customerService.getCustomers({
        ...pagination,
        ...filters,
        search: searchTerm,
      });
    },
    keepPreviousData: true,
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => customerService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setShowDeleteModal(false);
      setSelectedCustomer(null);
    },
  });

  const customers = customersData?.customers || [];
  const totalPages = customersData?.totalPages || 1;
  const totalCustomers = customersData?.totalCustomers || 0;

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePhoneLookup = async (phoneNumber) => {
    if (phoneNumber && phoneNumber.length >= 10) {
      try {
        const result = await customerService.getCustomerByPhone(phoneNumber);
        if (result.success && result.data) {
          // Customer found, you could show a modal or navigate to customer details
          console.log('Customer found:', result.data);
          // TODO: Implement customer found notification or modal
        }
      } catch (error) {
        console.error('Phone lookup failed:', error);
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    if (onCustomerSelect) {
      onCustomerSelect(customer);
    }
  };

  const handleViewCustomer = (customer) => {
    navigate(`/customers/${customer._id}`);
  };

  const handleEditCustomer = (customer) => {
    navigate(`/customers/edit/${customer._id}`);
  };

  const handleDeleteCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedCustomer) {
      deleteMutation.mutate(selectedCustomer._id);
    }
  };


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

  if (isLoading && !customersData) {
    return <LoadingSpinner size="lg" text="Loading customers..." className="py-12" />;
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">Customer Database</h2>
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
              {totalCustomers} Total
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Search, filter, and manage all your customers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'table'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Table View"
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid View"
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
          </div>
          <Button
            onClick={() => navigate('/customers/new')}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Priority Search - Larger */}
          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Quick Search
            </label>
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>

          {/* Student Filter */}
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Customer Type
            </label>
            <select
              value={filters.isStudent}
              onChange={(e) => handleFilterChange('isStudent', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="">All Types</option>
              <option value="true">Students Only</option>
              <option value="false">Regular Customers</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters({ ...filters, sortBy, sortOrder });
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="createdAt-desc">⬇️ Newest First</option>
              <option value="createdAt-asc">⬆️ Oldest First</option>
              <option value="fullName-asc">🔤 Name A-Z</option>
              <option value="fullName-desc">🔤 Name Z-A</option>
              <option value="totalSpent-desc">💰 Highest Spent</option>
              <option value="loyaltyPoints-desc">⭐ Most Loyalty Points</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Customer List - Grid or Table View */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
            {searchTerm || Object.values(filters).some(filter => filter)
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first customer'
            }
            </p>
            {!searchTerm && !Object.values(filters).some(filter => filter) && (
              <div className="mt-6">
                <Button onClick={() => navigate('/customers/new')}>
                  Add Customer
                </Button>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customers.map((customer) => (
                <div
                  key={customer._id}
                  className={`relative bg-white border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg cursor-pointer ${
                    selectedCustomer?._id === customer._id
                      ? 'border-orange-500 shadow-lg ring-2 ring-orange-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  {/* Customer Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ backgroundColor: '#fe7f2d20' }}>
                      <span className="text-xl font-bold" style={{ color: '#fe7f2d' }}>
                        {getInitials(customer.fullName)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {customer.fullName}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {customer.isStudent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <AcademicCapIcon className="h-3 w-3 mr-1" />
                            Student
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getLoyaltyTierColor(customer.loyaltyPoints || 0)}`}>
                          <StarIcon className="h-3 w-3 mr-1" />
                          {getLoyaltyTierName(customer.loyaltyPoints || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Orders</p>
                      <p className="text-lg font-semibold text-gray-900">{customer.totalOrders || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Spent</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(customer.totalSpent || 0)}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{customer.phoneNumber}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  </div>

                  {/* Priority Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateOrder && onCreateOrder(customer);
                      }}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <ShoppingBagIcon className="h-4 w-4 mr-1" />
                      Order
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCustomer(customer);
                      }}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </div>

                  {/* Quick Edit/Delete (top right) */}
                  <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCustomer(customer);
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(customer);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Enhanced Table View */
          <>
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="col-span-3">Customer</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-2">Orders & Spent</div>
                <div className="col-span-2">Loyalty</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <div 
                  key={customer._id} 
                  className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-150 group ${
                    selectedCustomer?._id === customer._id 
                      ? 'bg-orange-50 border-l-4 border-orange-500' 
                      : ''
                  }`}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Customer Info */}
                    <div className="col-span-3 flex items-center space-x-3">
                      <div 
                        className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#fe7f2d20' }}
                      >
                        <span className="text-base font-bold" style={{ color: '#fe7f2d' }}>
                          {getInitials(customer.fullName)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {customer.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined {formatDate(customer.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="col-span-2">
                      <div className="flex items-center text-sm text-gray-900 mb-1">
                        <PhoneIcon className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        {customer.phoneNumber}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 truncate">
                        <EnvelopeIcon className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    </div>

                    {/* Type */}
                    <div className="col-span-1">
                      {customer.isStudent ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <AcademicCapIcon className="h-3 w-3 mr-1" />
                          Student
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Regular
                        </span>
                      )}
                    </div>

                    {/* Orders & Spent */}
                    <div className="col-span-2">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-lg font-semibold text-gray-900">{customer.totalOrders || 0}</span>
                        <span className="text-xs text-gray-500">orders</span>
                      </div>
                      <p className="text-sm font-medium text-green-600 mt-0.5">
                        {formatCurrency(customer.totalSpent || 0)}
                      </p>
                    </div>

                    {/* Loyalty */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getLoyaltyTierColor(
                            customer.loyaltyPoints || 0
                          )}`}
                        >
                          <StarIcon className="h-3 w-3 mr-1" />
                          {getLoyaltyTierName(customer.loyaltyPoints || 0)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {customer.loyaltyPoints || 0} points
                      </p>
                    </div>

                    {/* Priority Actions */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        {/* Primary Action - Create Order */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateOrder && onCreateOrder(customer);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                          title="Create Order"
                        >
                          <ShoppingBagIcon className="h-4 w-4 mr-1" />
                          Order
                        </button>
                        
                        {/* Secondary Actions */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCustomer(customer);
                            }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-700 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCustomer(customer);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Edit Customer"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoyaltyManage && onLoyaltyManage(customer);
                            }}
                            className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-500 hover:text-yellow-700 transition-colors"
                            title="Manage Loyalty"
                          >
                            <StarIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomer(customer);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-700 transition-colors"
                            title="Delete Customer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, totalCustomers)} of{' '}
                    {totalCustomers} customers
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Page {pagination.page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <TrashIcon className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Delete Customer</h3>
              <p className="text-base text-gray-600 mt-1">
                Are you sure you want to delete <span className="font-semibold">{selectedCustomer?.fullName}</span>?
              </p>
            </div>
          </div>
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
            <p className="text-base text-red-900 font-medium">
              ⚠️ This action cannot be undone. All customer data and order history will be permanently deleted.
            </p>
          </div>
          <div className="flex justify-end space-x-4 pt-4 border-t-2 border-gray-200">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteMutation.isLoading}
              className="px-6 py-3"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="px-6 py-3"
              onClick={confirmDelete}
              loading={deleteMutation.isLoading}
            >
              Delete Customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerList;
