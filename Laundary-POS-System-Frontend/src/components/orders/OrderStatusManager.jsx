import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  CubeIcon,
  SparklesIcon,
  XCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';
import { useUpdateOrderStatus } from '../../services/orderService';

const OrderStatusManager = ({ order, onStatusUpdate }) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');
  
  const updateStatusMutation = useUpdateOrderStatus();

  // Define all possible statuses with their properties (matching exact specifications)
  const allStatuses = [
    { 
      value: 'pickup', 
      label: 'Pickup', 
      emoji: '🚚',
      icon: TruckIcon, 
      color: 'orange',
      description: 'Items need collection from customer'
    },
    { 
      value: 'received', 
      label: 'Received', 
      emoji: '✅',
      icon: CheckCircleIcon, 
      color: 'cyan',
      description: 'Items arrived at facility'
    },
    { 
      value: 'washing', 
      label: 'Washing', 
      emoji: '🧺',
      icon: CubeIcon, 
      color: 'indigo',
      description: 'Washing in progress'
    },
    { 
      value: 'drying', 
      label: 'Drying', 
      emoji: '🌬️',
      icon: CubeIcon, 
      color: 'cyan',
      description: 'Drying in progress'
    },
    { 
      value: 'ironing', 
      label: 'Ironing', 
      emoji: '👔',
      icon: CubeIcon, 
      color: 'purple',
      description: 'Ironing in progress'
    },
    { 
      value: 'dry_cleaning', 
      label: 'Dry Cleaning', 
      emoji: '🧼',
      icon: CubeIcon, 
      color: 'pink',
      description: 'Dry cleaning in progress'
    },
    { 
      value: 'folding', 
      label: 'Folding', 
      emoji: '📦',
      icon: CubeIcon, 
      color: 'green',
      description: 'Folding/packaging in progress'
    },
    { 
      value: 'complete', 
      label: 'Complete', 
      emoji: '✨',
      icon: SparklesIcon, 
      color: 'emerald',
      description: 'All services finished'
    },
    { 
      value: 'deliver', 
      label: 'Deliver', 
      emoji: '🚗',
      icon: TruckIcon, 
      color: 'teal',
      description: 'Ready for delivery'
    },
    { 
      value: 'cancelled', 
      label: 'Cancelled', 
      emoji: '❌',
      icon: XCircleIcon, 
      color: 'red',
      description: 'Order cancelled'
    },
  ];

  // Get applicable statuses first (before using them)
  const applicableStatuses = React.useMemo(() => {
    const statuses = [];

    // Step 1: Add pickup if required
    if (order.pickupRequired) {
      statuses.push('pickup');
    }

    // Step 2: Always add received
    statuses.push('received');

    // Step 3: Add service statuses based on order items' services
    const serviceStatuses = new Set();
    
    // Try multiple ways to get service statuses
    order.items?.forEach(item => {
      // Method 1: Check if service object has statuses array
      if (item.service?.statuses && Array.isArray(item.service.statuses)) {
        item.service.statuses.forEach(status => {
          serviceStatuses.add(status);
        });
      }
      // Method 2: Check serviceName and infer common statuses
      // This is a fallback in case service details aren't populated
      else if (item.serviceName) {
        const name = item.serviceName.toLowerCase();
        // Common patterns in service names
        if (name.includes('wash')) serviceStatuses.add('wash');
        if (name.includes('dry') && !name.includes('dry clean')) serviceStatuses.add('dry');
        if (name.includes('iron')) serviceStatuses.add('iron');
        if (name.includes('dry clean') || name.includes('dryclean')) serviceStatuses.add('dry_clean');
        if (name.includes('fold')) serviceStatuses.add('fold');
      }
    });

    // Map service statuses to order statuses (maintains order)
    const serviceStatusMap = {
      'wash': 'washing',
      'dry': 'drying',
      'iron': 'ironing',
      'dry_clean': 'dry_cleaning',
      'fold': 'folding'
    };

    // Add statuses in the correct order
    const statusOrder = ['washing', 'drying', 'ironing', 'dry_cleaning', 'folding'];
    statusOrder.forEach(orderStatus => {
      const serviceStatus = Object.keys(serviceStatusMap).find(
        key => serviceStatusMap[key] === orderStatus
      );
      if (serviceStatus && serviceStatuses.has(serviceStatus)) {
        statuses.push(orderStatus);
      }
    });

    // Step 4: Always add complete
    statuses.push('complete');

    // Step 5: Add deliver if required
    if (order.deliveryRequired) {
      statuses.push('deliver');
    }

    // Step 6: Always allow cancelled
    if (!statuses.includes('cancelled')) {
      statuses.push('cancelled');
    }

    return statuses;
  }, [order]);

  // Get timeline statuses (filtered from allStatuses)
  const timelineStatuses = React.useMemo(() => {
    return allStatuses.filter(status => 
      applicableStatuses.includes(status.value)
    );
  }, [applicableStatuses]);

  // Get current status details
  const currentStatusObj = allStatuses.find(s => s.value === order.status);
  const currentIndex = timelineStatuses.findIndex(s => s.value === order.status);


  // Check if status is completed
  const isStatusCompleted = (statusValue) => {
    const statusIndex = timelineStatuses.findIndex(s => s.value === statusValue);
    return statusIndex !== -1 && statusIndex <= currentIndex;
  };

  // Check if status is current
  const isStatusCurrent = (statusValue) => {
    return order.status === statusValue;
  };

  // Check if status is accessible (can be updated to)
  const isStatusAccessible = (statusValue) => {
    if (order.status === 'cancelled') return statusValue === 'cancelled';
    if (statusValue === 'cancelled') return true; // Can always cancel
    
    const statusIndex = timelineStatuses.findIndex(s => s.value === statusValue);
    const currentIdx = timelineStatuses.findIndex(s => s.value === order.status);
    
    // Can update to next status or same status
    return statusIndex >= currentIdx && statusIndex <= currentIdx + 2;
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: order._id,
        data: {
          status: selectedStatus,
          notes: notes.trim(),
        }
      });

      toast.success(`Order status updated to ${allStatuses.find(s => s.value === selectedStatus)?.label}`);
      setShowUpdateModal(false);
      setSelectedStatus('');
      setNotes('');
      
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const openUpdateModal = (status = '') => {
    setSelectedStatus(status);
    setShowUpdateModal(true);
  };

  const getStatusColor = (color) => {
    const colors = {
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300' },
      cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-300' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-300' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-300' },
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-300' },
      teal: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-300' },
      red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' },
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-blue-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {currentStatusObj && (
              <>
                <div className="text-5xl">
                  {currentStatusObj.emoji}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{currentStatusObj.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{currentStatusObj.description}</p>
                </div>
              </>
            )}
          </div>
          <Button
            onClick={() => openUpdateModal()}
            variant="primary"
            size="sm"
            className="whitespace-nowrap"
          >
            Update Status
          </Button>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h4 className="text-base font-semibold text-gray-900 mb-5">Timeline</h4>
        
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div 
            className="absolute left-5 top-0 w-0.5 bg-blue-500 transition-all duration-300"
            style={{ 
              height: `${((currentIndex + 1) / timelineStatuses.length) * 100}%` 
            }}
          ></div>

          {/* Timeline Steps */}
          <div className="space-y-4">
            {timelineStatuses.map((status, index) => {
              const isCompleted = isStatusCompleted(status.value);
              const isCurrent = isStatusCurrent(status.value);

              return (
                <div key={status.value} className="relative flex items-center">
                  {/* Status Icon */}
                  <div className={`
                    relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 text-xl
                    ${isCompleted 
                      ? 'bg-blue-50 border-blue-500' 
                      : 'bg-white border-gray-300'
                    }
                    ${isCurrent ? 'ring-4 ring-blue-100 border-blue-600' : ''}
                  `}>
                    {status.emoji}
                  </div>

                  {/* Status Info */}
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : 'text-gray-900'}`}>
                            {status.label}
                          </h5>
                          {isCurrent && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{status.description}</p>
                      </div>
                      
                      {/* Quick Update Button */}
                      {isStatusAccessible(status.value) && !isCurrent && status.value !== 'cancelled' && (
                        <Button
                          onClick={() => openUpdateModal(status.value)}
                          variant="outline"
                          size="sm"
                        >
                          Update
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status History / Notes */}
      {order.staffNotes && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h4 className="text-base font-semibold text-gray-900 mb-3">Notes</h4>
          <div className="space-y-1.5">
            {order.staffNotes.split('\n').filter(note => note.trim()).map((note, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-gray-400 text-sm">•</span>
                <p className="text-sm text-gray-700">{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Staff */}
      {order.assignedStaff && order.assignedStaff.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <UserIcon className="h-4 w-4 mr-2" />
            Assigned Staff
          </h4>
          <div className="flex flex-wrap gap-2">
            {order.assignedStaff.map((staff, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
              >
                {staff.fullName || staff.username || 'Staff Member'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedStatus('');
          setNotes('');
        }}
        title="Update Order Status"
        size="lg"
      >
        <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {/* Status Selection */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-4">
              Select New Status
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {timelineStatuses
                .filter(status => isStatusAccessible(status.value))
                .map(status => {
                  const isSelected = selectedStatus === status.value;
                  return (
                    <button
                      key={status.value}
                      onClick={() => setSelectedStatus(status.value)}
                      className={`
                        p-4 rounded-xl border-2 text-left transition-all transform hover:scale-105 shadow-sm
                        ${isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-3xl">{status.emoji}</span>
                        <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                          {status.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-3">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder="Add any notes about this status update..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t-2 border-gray-200">
            <Button
              onClick={() => {
                setShowUpdateModal(false);
                setSelectedStatus('');
                setNotes('');
              }}
              variant="outline"
              className="px-6 py-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              variant="primary"
              disabled={updateStatusMutation.isLoading || !selectedStatus}
              className="px-6 py-3"
            >
              {updateStatusMutation.isLoading ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderStatusManager;

