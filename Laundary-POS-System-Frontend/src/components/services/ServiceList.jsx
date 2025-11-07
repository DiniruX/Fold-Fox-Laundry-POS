import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ChevronUpDownIcon,
  CheckIcon,
  Squares2X2Icon,
  TableCellsIcon,
  CurrencyDollarIcon,
  ClockIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import {
  useServices,
  useDeleteService,
  useToggleServiceStatus,
  useBulkUpdateServices,
  useDuplicateService,
  getPriceTypeLabel,
  getStatusLabel,
  getStatusBadgeColor,
  getStatusColor,
  getServiceMinPrice,
  getServiceMaxPrice,
  getServicePricingLabel,
} from '../../services/serviceService';
import { SERVICE_PRICE_TYPES, SERVICE_STATUSES } from '../../constants';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import Modal from '../ui/Modal';

const ServiceList = ({ onEdit, onView, onBulkSelect }) => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priceType: 'all',
    isActive: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [selectedServices, setSelectedServices] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  // API calls
  const { data: servicesData, isLoading, error } = useServices({
    ...filters,
    page: 1,
    limit: 50,
  });

  const deleteServiceMutation = useDeleteService();
  const toggleStatusMutation = useToggleServiceStatus();
  const bulkUpdateMutation = useBulkUpdateServices();
  const duplicateServiceMutation = useDuplicateService();

  const services = servicesData?.services || [];
  const pagination = servicesData?.pagination || {};
  const stats = servicesData?.stats || {};

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle service selection
  const handleServiceSelect = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedServices.length === services.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(services.map(service => service._id));
    }
  };

  // Handle service actions
  const handleEdit = (service) => {
    onEdit(service);
  };

  const handleView = (service) => {
    onView(service);
  };

  const handleDelete = async (service) => {
    if (window.confirm(`Are you sure you want to permanently delete "${service.name}"? This action cannot be undone.`)) {
      try {
        await deleteServiceMutation.mutateAsync(service._id);
        setSelectedServices(prev => prev.filter(id => id !== service._id));
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const handleToggleStatus = async (serviceId, currentStatus) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: serviceId,
        isActive: !currentStatus,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDuplicate = async (service) => {
    try {
      await duplicateServiceMutation.mutateAsync({
        id: service._id,
        data: { name: `${service.name} (Copy)` },
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle bulk operations
  const handleBulkAction = async () => {
    if (!bulkAction || selectedServices.length === 0) return;

    try {
      await bulkUpdateMutation.mutateAsync({
        serviceIds: selectedServices,
        action: bulkAction,
      });
      setShowBulkModal(false);
      setSelectedServices([]);
      setBulkAction('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priceType: 'all',
      isActive: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  // Check if filters are applied
  const hasActiveFilters = useMemo(() => {
    return filters.search || 
           filters.status !== 'all' || 
           filters.priceType !== 'all' || 
           filters.isActive !== 'all' ||
           filters.minPrice || 
           filters.maxPrice;
  }, [filters]);

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
        <p className="text-red-600">Failed to load services</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats and Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">Service Catalog</h2>
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
              {stats.totalServices || 0} Total
            </span>
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
              {stats.activeServices || 0} Active
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Manage your laundry services, pricing, and availability
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
          
          {selectedServices.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(true)}
              className="flex items-center space-x-2"
            >
              <span>Bulk Actions ({selectedServices.length})</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#fe7f2d', color: 'white' }}>
                {Object.values(filters).filter(v => v && v !== 'all' && v !== 'name' && v !== 'asc').length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Search services..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              icon={MagnifyingGlassIcon}
            />
            
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              {Object.entries(SERVICE_STATUSES).map(([key, value]) => (
                <option key={key} value={value}>
                  {getStatusLabel(value)}
                </option>
              ))}
            </select>

            <select
              value={filters.priceType}
              onChange={(e) => handleFilterChange('priceType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Price Types</option>
              {Object.entries(SERVICE_PRICE_TYPES).map(([key, value]) => (
                <option key={key} value={value}>
                  {getPriceTypeLabel(value)}
                </option>
              ))}
            </select>

            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="basePrice-asc">Price Low-High</option>
                <option value="basePrice-desc">Price High-Low</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
              </select>
            </div>
            
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Services - Grid or Table View */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        {services.length === 0 ? (
          <div className="text-center py-12">
            <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Get started by adding your first service'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service._id}
                  className={`relative bg-white border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg cursor-pointer ${
                    selectedServices.includes(service._id)
                      ? 'border-orange-500 shadow-lg ring-2 ring-orange-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleServiceSelect(service._id)}
                >
                  {/* Service Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div 
                      className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                      style={{ backgroundColor: service.color || '#3B82F6' }}
                    >
                      <span className="text-2xl">
                        {service.icon || service.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {service.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold shadow-sm ${getStatusBadgeColor(service.isActive)}`}>
                        {service.isActive ? '✓ Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Price Range</p>
                      {(() => {
                        let pricesObj = service.clothingPrices;
                        if (service.clothingPrices instanceof Map) {
                          pricesObj = Object.fromEntries(service.clothingPrices);
                        }
                        pricesObj = pricesObj || {};
                        const hasPricing = Object.keys(pricesObj).length > 0;
                        if (!hasPricing) {
                          return <p className="text-xs text-gray-500">No prices set</p>;
                        }
                        return (
                          <div>
                            <p className="text-sm font-bold" style={{ color: '#fe7f2d' }}>
                              LKR {getServiceMinPrice(service)} - {getServiceMaxPrice(service)}
                            </p>
                            <p className="text-xs text-gray-500">{getServicePricingLabel(service)}</p>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Est. Time</p>
                      <p className="text-lg font-semibold text-gray-900">{service.estimatedTime || 0}<span className="text-sm">min</span></p>
                    </div>
                  </div>

                  {/* Service Statuses */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Process Steps:</p>
                    <div className="flex flex-wrap gap-1">
                      {service.statuses && service.statuses.length > 0 ? (
                        service.statuses.slice(0, 3).map((status) => (
                          <span
                            key={status}
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${getStatusColor(status)}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No steps defined</span>
                      )}
                      {service.statuses && service.statuses.length > 3 && (
                        <span className="text-xs text-gray-500">+{service.statuses.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  {/* Priority Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(service);
                      }}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(service);
                      }}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>

                  {/* Quick Actions (top right) */}
                  <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(service);
                      }}
                      className="p-1.5 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-700"
                      title="Duplicate"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(service);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-700"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Checkbox */}
                  <div className="absolute top-4 left-4">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service._id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleServiceSelect(service._id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Enhanced Table View */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedServices.length === services.length && services.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Process Steps
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service) => (
                <tr 
                  key={service._id} 
                  className={`hover:bg-gray-50 transition-colors duration-150 group ${
                    selectedServices.includes(service._id) ? 'bg-orange-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service._id)}
                      onChange={() => handleServiceSelect(service._id)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: service.color || '#3B82F6' }}
                      >
                        <span className="text-white text-lg font-medium">
                          {service.icon || service.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {service.name}
                        </div>
                        {service.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {service.statuses && service.statuses.length > 0 ? (
                        service.statuses.slice(0, 3).map((status) => (
                          <span
                            key={status}
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${getStatusColor(status)}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No steps</span>
                      )}
                      {service.statuses && service.statuses.length > 3 && (
                        <span className="text-xs text-gray-500">+{service.statuses.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      let pricesObj = service.clothingPrices;
                      if (service.clothingPrices instanceof Map) {
                        pricesObj = Object.fromEntries(service.clothingPrices);
                      }
                      pricesObj = pricesObj || {};
                      const hasPricing = Object.keys(pricesObj).length > 0;
                      if (!hasPricing) {
                        return <div className="text-xs text-gray-500">No prices set</div>;
                      }
                      return (
                        <div>
                          <div className="text-sm font-bold" style={{ color: '#fe7f2d' }}>
                            LKR {getServiceMinPrice(service)} - {getServiceMaxPrice(service)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getServicePricingLabel(service)}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg shadow-sm ${getStatusBadgeColor(service.isActive)}`}>
                      {service.isActive ? '✓ Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {service.estimatedTime} min
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {/* Primary Action - View */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(service);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      
                      {/* Secondary Actions - Show on Hover */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(service);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Edit Service"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(service);
                          }}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-700 transition-colors"
                          title="Duplicate Service"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(service._id, service.isActive);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            service.isActive 
                              ? 'hover:bg-red-50 text-gray-500 hover:text-red-700' 
                              : 'hover:bg-green-50 text-gray-500 hover:text-green-700'
                          }`}
                          title={service.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(service);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-700 transition-colors"
                          title="Delete Service"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Actions Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Actions"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Select an action to perform on {selectedServices.length} selected services:
          </p>
          
          {bulkAction === 'delete' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="text-red-600 font-medium">⚠️ Warning</div>
              </div>
              <p className="text-red-700 text-sm mt-1">
                Delete will permanently remove {selectedServices.length} service(s) from the database. This action cannot be undone!
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="activate"
                checked={bulkAction === 'activate'}
                onChange={(e) => setBulkAction(e.target.value)}
                className="mr-2"
              />
              Activate Services
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="deactivate"
                checked={bulkAction === 'deactivate'}
                onChange={(e) => setBulkAction(e.target.value)}
                className="mr-2"
              />
              Deactivate Services
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="delete"
                checked={bulkAction === 'delete'}
                onChange={(e) => setBulkAction(e.target.value)}
                className="mr-2"
              />
              Delete Services (Permanent)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={!bulkAction || bulkUpdateMutation.isPending}
              className={`${
                bulkAction === 'delete' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {bulkUpdateMutation.isPending ? 'Processing...' : 
                bulkAction === 'delete' ? 'Delete Permanently' :
                'Apply Action'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ServiceList;
