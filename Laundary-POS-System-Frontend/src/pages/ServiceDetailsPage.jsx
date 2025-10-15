import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TagIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import {
  useService,
  useServiceAnalytics,
  useDeleteService,
  formatPrice,
  getPriceTypeLabel,
  getStatusBadgeColor,
} from '../services/serviceService';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ServiceDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch service data
  const { data: service, isLoading } = useService(id);

  const { data: analytics, isLoading: analyticsLoading } = useServiceAnalytics(id, {
    period: selectedPeriod,
  });

  const deleteServiceMutation = useDeleteService();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Service not found</h2>
        <button
          onClick={() => navigate('/services')}
          className="mt-4 text-orange-600 hover:text-orange-700"
        >
          ← Back to Services
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteServiceMutation.mutateAsync(service._id);
      setShowDeleteModal(false);
      navigate('/services');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDuplicate = () => {
    // Navigate to create page with service data in state
    navigate('/services/new', { state: { duplicateFrom: service } });
  };

  const handleEdit = () => {
    navigate(`/services/edit/${service._id}`);
  };

  const {
    overview = {},
    monthlyTrend = [],
  } = analytics || {};

  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Enhanced Service Header with Gradient */}
        <div 
          className="rounded-2xl shadow-lg overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #233d4d 0%, #2a4a5c 100%)',
          }}
        >
          <div className="px-8 py-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/services')}
                  className="h-12 w-12 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-white" />
                </button>
                <div 
                  className="h-16 w-16 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: service.color || '#fe7f2d' }}
                >
                  {service.icon ? (
                    <span className="text-white text-3xl">{service.icon}</span>
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {service.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">{service.name}</h2>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${getStatusBadgeColor(service.isActive)}`}>
                      {service.isActive ? '✓ Active' : 'Inactive'}
                    </span>
                    <span className="text-white/70 text-sm">
                      ⏱️ {service.estimatedTime} min processing
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-white/10 text-white hover:bg-white/20 border-2 border-white/20 transition-all duration-200"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit Service
              </button>
              <button
                onClick={handleDuplicate}
                className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-white/10 text-white hover:bg-white/20 border-2 border-white/20 transition-all duration-200"
              >
                <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                Duplicate
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-lg transition-all duration-200"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Service Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center mr-2">
                <InformationCircleIcon className="h-5 w-5 text-white" />
              </div>
              Basic Information
            </h3>
            <div className="space-y-3 bg-white rounded-lg p-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                <p className="text-sm text-gray-900 mt-1">
                  {service.description || 'No description provided'}
                </p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Price Type</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {getPriceTypeLabel(service.priceType)}
                  </p>
                </div>
              </div>
              {service.clothingPrices && Object.keys(service.clothingPrices).length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                    Clothing Category Prices {service.priceType === 'per_kg' ? '(per kg)' : '(per piece)'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(service.clothingPrices).map(([category, price]) => (
                      <div key={category} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 capitalize">{category.replace('_', ' ')}:</span>
                        <span className="font-bold" style={{ color: '#fe7f2d' }}>LKR {price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Service Configuration */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center mr-2">
                <TagIcon className="h-5 w-5 text-white" />
              </div>
              Configuration
            </h3>
            <div className="space-y-3 bg-white rounded-lg p-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                <p className="text-sm text-gray-900 mt-1">
                  <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-lg shadow-sm ${getStatusBadgeColor(service.isActive)}`}>
                    {service.isActive ? '✓ Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase">Estimated Time</label>
                <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1.5 text-purple-600" />
                  {service.estimatedTime} minutes
                </p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase">Created</label>
                <p className="text-sm text-gray-900 mt-1">
                  📅 {new Date(service.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Performance Analytics
            </h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          {analyticsLoading ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full mx-auto mb-2">
                  <span className="text-sm font-medium">📦</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">{overview.totalOrders || 0}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full mx-auto mb-2">
                  <span className="text-sm font-medium">🔢</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">{overview.totalQuantity || 0}</p>
                <p className="text-sm text-gray-600">Total Quantity</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full mx-auto mb-2">
                  <CurrencyDollarIcon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-semibold text-gray-900">LKR {overview.totalRevenue || 0}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full mx-auto mb-2">
                  <span className="text-sm font-medium">💰</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">LKR {overview.averageOrderValue || 0}</p>
                <p className="text-sm text-gray-600">Avg. Order Value</p>
              </div>
            </div>
          )}

          {/* Monthly Trend */}
          {monthlyTrend && monthlyTrend.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Monthly Trend</h4>
              <div className="space-y-2">
                {monthlyTrend.slice(-6).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-900">
                      {new Date(trend._id.year, trend._id.month - 1).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{trend.orders} orders</span>
                      <span className="text-sm text-gray-600">{trend.quantity} items</span>
                      <span className="text-sm font-medium text-green-600">LKR {trend.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Information Note */}
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-blue-600" />
            Pricing Information
          </h3>
          <p className="text-sm text-gray-700">
            This service uses <span className="font-semibold">{getPriceTypeLabel(service.priceType)}</span> pricing with different rates for each clothing category.
            The final price will be calculated based on the selected clothing category and the {service.priceType === 'per_kg' ? 'weight' : 'quantity'}.
          </p>
          {service.clothingPrices && Object.keys(service.clothingPrices).length > 0 && (
            <div className="mt-3 p-3 bg-white rounded-lg">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Price Range:</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  From <span className="font-bold text-green-600">LKR {Math.min(...Object.values(service.clothingPrices))}</span>
                </span>
                <span className="text-sm text-gray-700">
                  To <span className="font-bold text-orange-600">LKR {Math.max(...Object.values(service.clothingPrices))}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Service"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{service.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Service
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ServiceDetailsPage;

