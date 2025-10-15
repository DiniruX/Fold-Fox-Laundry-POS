import React, { useState } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import {
  useBulkUpdateServices,
  getPriceTypeLabel,
  formatPrice,
  getStatusBadgeColor,
} from '../../services/serviceService';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';

const BulkOperations = ({ 
  isOpen, 
  onClose, 
  selectedServices = [], 
  services = [], 
  onSelectionChange 
}) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [updateData, setUpdateData] = useState({
    priceType: '',
    basePrice: '',
    estimatedTime: '',
    isActive: null,
  });

  const bulkUpdateMutation = useBulkUpdateServices();

  // Filter services that are selected
  const selectedServiceObjects = services.filter(service => 
    selectedServices.includes(service._id)
  );

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    if (action !== 'update') {
      setShowConfirmation(true);
    }
  };

  const handleBulkUpdate = async () => {
    if (!selectedAction || selectedServices.length === 0) return;

    try {
      let requestData = {
        serviceIds: selectedServices,
        action: selectedAction,
      };

      // For update action, include update data
      if (selectedAction === 'update' && Object.values(updateData).some(value => value !== '' && value !== null)) {
        requestData.updateData = Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => value !== '' && value !== null)
        );
      }

      await bulkUpdateMutation.mutateAsync(requestData);
      setShowConfirmation(false);
      onClose();
      onSelectionChange([]); // Clear selection
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleInputChange = (field, value) => {
    setUpdateData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getActionDescription = (action) => {
    const descriptions = {
      activate: 'This will activate all selected services, making them available for orders.',
      deactivate: 'This will deactivate all selected services, hiding them from the service list.',
      delete: 'This will permanently delete all selected services. This action cannot be undone.',
      update: 'This will update the specified fields for all selected services.',
    };
    return descriptions[action] || '';
  };

  const getActionIcon = (action) => {
    const icons = {
      activate: EyeIcon,
      deactivate: EyeSlashIcon,
      delete: TrashIcon,
      update: ArrowPathIcon,
    };
    return icons[action];
  };

  const getActionColor = (action) => {
    const colors = {
      activate: 'text-green-600',
      deactivate: 'text-yellow-600',
      delete: 'text-red-600',
      update: 'text-blue-600',
    };
    return colors[action];
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen && !showConfirmation} onClose={onClose} title="Bulk Operations" size="xl">
        <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {/* Selected Services Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Selected Services ({selectedServices.length})
            </h3>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedServiceObjects.map((service) => (
                <div key={service._id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-900">{service.name}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(service.isActive)}`}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Action</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleActionSelect('activate')}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedAction === 'activate'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <EyeIcon className={`h-6 w-6 ${getActionColor('activate')}`} />
                  <div>
                    <div className="font-medium text-gray-900">Activate Services</div>
                    <div className="text-sm text-gray-600">Make services available for orders</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleActionSelect('deactivate')}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedAction === 'deactivate'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <EyeSlashIcon className={`h-6 w-6 ${getActionColor('deactivate')}`} />
                  <div>
                    <div className="font-medium text-gray-900">Deactivate Services</div>
                    <div className="text-sm text-gray-600">Hide services from service list</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleActionSelect('delete')}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedAction === 'delete'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <TrashIcon className={`h-6 w-6 ${getActionColor('delete')}`} />
                  <div>
                    <div className="font-medium text-gray-900">Delete Services</div>
                    <div className="text-sm text-gray-600">Permanently remove services</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleActionSelect('update')}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedAction === 'update'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <ArrowPathIcon className={`h-6 w-6 ${getActionColor('update')}`} />
                  <div>
                    <div className="font-medium text-gray-900">Update Services</div>
                    <div className="text-sm text-gray-600">Modify service properties</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Update Fields */}
          {selectedAction === 'update' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Type
                  </label>
                  <select
                    value={updateData.priceType}
                    onChange={(e) => handleInputChange('priceType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keep existing</option>
                    <option value="per_kg">Per Kilogram</option>
                    <option value="per_item">Per Item</option>
                    <option value="flat_rate">Flat Rate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={updateData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', e.target.value)}
                    placeholder="Enter new base price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={updateData.estimatedTime}
                    onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                    placeholder="Enter estimated time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={updateData.isActive === null ? '' : updateData.isActive.toString()}
                    onChange={(e) => handleInputChange('isActive', e.target.value === '' ? null : e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keep existing</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {selectedAction && (
              <Button
                onClick={() => {
                  if (selectedAction === 'update') {
                    setShowConfirmation(true);
                  } else {
                    handleBulkUpdate();
                  }
                }}
                className={`${
                  selectedAction === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {selectedAction === 'update' ? 'Continue' : `Apply ${selectedAction}`}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Confirm Bulk Action"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Confirm {selectedAction} action
              </h3>
              <p className="text-gray-600 mt-1">
                {getActionDescription(selectedAction)}
              </p>
            </div>
          </div>

          {selectedAction === 'update' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Fields to update:</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(updateData).map(([key, value]) => {
                  if (value !== '' && value !== null) {
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="text-gray-900">{value.toString()}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              This action will affect <strong>{selectedServices.length} services</strong>. 
              {selectedAction === 'delete' && ' This action cannot be undone.'}
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={bulkUpdateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={bulkUpdateMutation.isPending}
              className={`${
                selectedAction === 'delete' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } flex items-center space-x-2`}
            >
              {bulkUpdateMutation.isPending && <LoadingSpinner size="sm" />}
              <span>
                {bulkUpdateMutation.isPending 
                  ? 'Processing...' 
                  : `Confirm ${selectedAction}`
                }
              </span>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BulkOperations;
