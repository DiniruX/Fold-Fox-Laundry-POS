import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TruckIcon } from '@heroicons/react/24/outline';
import { useUpdateOrderStatus } from '../../services/orderService';
import { ORDER_STATUS } from '../../constants';
import { getOrderStatusLabel, getOrderStatusColor } from '../../services/orderService';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';

const StatusUpdateModal = ({ isOpen, onClose, order }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: order?.status || 'pickup',
      autoProgress: false,
      notes: '',
    },
  });

  const autoProgress = watch('autoProgress');

  const updateStatusMutation = useUpdateOrderStatus();

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && order) {
      reset({
        status: order.status || 'pickup',
        autoProgress: false,
        notes: '',
      });
    }
  }, [isOpen, order, reset]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await updateStatusMutation.mutateAsync({
        id: order._id,
        data: {
          status: data.status,
          autoProgress: data.autoProgress,
          notes: data.notes || undefined,
        },
      });
      onClose();
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Get available status transitions based on current status
  const getAvailableStatuses = (currentStatus) => {
    const statusFlow = {
      pickup: ['received', 'cancelled'],
      received: ['washing', 'drying', 'ironing', 'dry_cleaning', 'folding', 'cancelled'],
      washing: ['drying', 'ironing', 'dry_cleaning', 'folding', 'cancelled'],
      drying: ['ironing', 'folding', 'cancelled'],
      ironing: ['folding', 'cancelled'],
      dry_cleaning: ['folding', 'cancelled'],
      folding: ['complete', 'cancelled'],
      complete: ['deliver', 'cancelled'],
      deliver: ['cancelled'],
      cancelled: [], // Terminal state
    };

    return statusFlow[currentStatus] || [];
  };

  const availableStatuses = getAvailableStatuses(order?.status || 'pickup');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Update Order Status" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Status:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order?.status || 'pickup')}`}>
              {getOrderStatusLabel(order?.status || 'pickup')}
            </span>
          </div>
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
          <select
            {...register('status', { required: 'Status is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {getOrderStatusLabel(status)}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
          {availableStatuses.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">
              No status transitions available from current status.
            </p>
          )}
        </div>

        {/* Auto Progress */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoProgress"
            {...register('autoProgress')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="autoProgress" className="ml-2 block text-sm font-medium text-gray-700">
            Auto-progress based on service requirements
          </label>
        </div>
        <p className="text-xs text-gray-500">
          When enabled, the system will automatically determine the next status based on the services in this order.
        </p>

        {/* Status Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add any notes about this status change..."
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>

        {/* Status Flow Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Order Status Flow</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Pending</strong> → Confirmed → Washing → Drying → Ironing → Folding → Quality Check → Ready for Pickup → Delivered → Completed</p>
            <p><strong>Alternative:</strong> Washing → Dry Cleaning → Folding → Quality Check</p>
            <p><strong>Delivery:</strong> Ready for Pickup → Out for Delivery → Delivered</p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || availableStatuses.length === 0}
            className="flex items-center"
          >
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            <TruckIcon className="h-4 w-4 mr-2" />
            Update Status
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StatusUpdateModal;
