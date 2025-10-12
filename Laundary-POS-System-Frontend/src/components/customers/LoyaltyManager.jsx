import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  StarIcon,
  PlusIcon,
  MinusIcon,
  GiftIcon,
  ClockIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { customerService } from '../../services/customerService';

// Validation schema
const schema = yup.object({
  points: yup
    .number()
    .required('Points amount is required')
    .min(1, 'Points must be at least 1')
    .max(10000, 'Points cannot exceed 10,000'),
  reason: yup
    .string()
    .required('Reason is required')
    .min(5, 'Reason must be at least 5 characters')
    .max(200, 'Reason must be less than 200 characters'),
});

const LoyaltyManager = ({ isOpen, onClose, customer, onSuccess }) => {
  const [actionType, setActionType] = useState('add'); // 'add', 'subtract', 'set'
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedPreset, setSelectedPreset] = useState(null);

  const queryClient = useQueryClient();

  // Preset point values for quick actions
  const presets = {
    add: [
      { value: 10, label: '+10 Points', reason: 'Small purchase reward' },
      { value: 25, label: '+25 Points', reason: 'Regular purchase reward' },
      { value: 50, label: '+50 Points', reason: 'Large purchase reward' },
      { value: 100, label: '+100 Points', reason: 'VIP purchase reward' },
      { value: 500, label: '+500 Points', reason: 'Special promotion bonus' },
    ],
    subtract: [
      { value: 10, label: '-10 Points', reason: 'Small redemption' },
      { value: 25, label: '-25 Points', reason: 'Discount redemption' },
      { value: 50, label: '-50 Points', reason: 'Service discount' },
      { value: 100, label: '-100 Points', reason: 'Major redemption' },
    ],
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      points: 0,
      reason: '',
    },
  });

  // Update loyalty points mutation
  const mutation = useMutation({
    mutationFn: (data) => customerService.updateLoyaltyPoints(customer._id, data),
    onSuccess: (result) => {
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        queryClient.invalidateQueries(['customers']);
        queryClient.invalidateQueries(['customer', customer._id]);
        setTimeout(() => {
          onSuccess();
          reset();
          setMessage({ type: '', text: '' });
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    },
    onError: (error) => {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    const submitData = {
      action: actionType,
      points: parseInt(data.points),
      reason: data.reason,
      currentPoints: customer.loyaltyPoints || 0,
    };

    mutation.mutate(submitData);
    setIsLoading(false);
  };

  const handleClose = () => {
    reset();
    setMessage({ type: '', text: '' });
    setActionType('add');
    setSelectedPreset(null);
    onClose();
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    setValue('points', preset.value);
    setValue('reason', preset.reason);
  };

  const getActionDescription = () => {
    switch (actionType) {
      case 'add':
        return 'Add loyalty points to reward the customer';
      case 'subtract':
        return 'Subtract loyalty points (e.g., for redemptions)';
      case 'set':
        return 'Set the exact loyalty points amount';
      default:
        return '';
    }
  };

  const getNewPointsPreview = () => {
    const points = parseInt(watch('points')) || 0;
    const current = customer.loyaltyPoints || 0;

    switch (actionType) {
      case 'add':
        return current + points;
      case 'subtract':
        return Math.max(0, current - points);
      case 'set':
        return points;
      default:
        return current;
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

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: '#fe7f2d' }}
            >
              <StarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Loyalty Points</h2>
              <p className="text-sm text-gray-500 mt-1">
                Update loyalty points for <span className="font-semibold">{customer.fullName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Points</p>
              <p className="text-2xl font-semibold text-gray-900">
                {customer.loyaltyPoints || 0}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLoyaltyTierColor(
                  customer.loyaltyPoints || 0
                )}`}
              >
                <StarIcon className="h-4 w-4 mr-1" />
                {getLoyaltyTierName(customer.loyaltyPoints || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`rounded-md p-4 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center">
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {message.text}
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Action Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900">Step 1: Select Action Type</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setActionType('add');
                  setSelectedPreset(null);
                }}
                className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                  actionType === 'add'
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <PlusIcon className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-semibold">Add Points</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('subtract');
                  setSelectedPreset(null);
                }}
                className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                  actionType === 'subtract'
                    ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <MinusIcon className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-semibold">Subtract</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('set');
                  setSelectedPreset(null);
                }}
                className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                  actionType === 'set'
                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <GiftIcon className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-semibold">Set Points</p>
              </button>
            </div>
            <p className="text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              💡 {getActionDescription()}
            </p>
          </div>

          {/* Quick Presets (only for add/subtract) */}
          {(actionType === 'add' || actionType === 'subtract') && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">
                Step 2: Quick Presets (Optional)
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {presets[actionType].map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                      selectedPreset?.value === preset.value
                        ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200'
                        : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50/30'
                    }`}
                  >
                    <p className="text-lg font-bold text-gray-900">{preset.label}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{preset.reason}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Click a preset for quick selection, or enter custom values below
              </p>
            </div>
          )}

          {/* Manual Entry Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <label className="text-sm font-semibold text-gray-900">
              {actionType === 'set' ? 'Step 2' : 'Step 3'}: Custom Values
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  {...register('points')}
                  label="Points Amount"
                  type="number"
                  placeholder="Enter points"
                  error={errors.points?.message}
                  leftIcon={<StarIcon className="h-5 w-5 text-gray-400" />}
                />
                <p className="mt-1 text-xs text-gray-500">Enter any custom amount</p>
              </div>

              <div>
                <Input
                  {...register('reason')}
                  label="Reason"
                  type="text"
                  placeholder="e.g., Purchase reward"
                  error={errors.reason?.message}
                  leftIcon={<ClockIcon className="h-5 w-5 text-gray-400" />}
                />
                <p className="mt-1 text-xs text-gray-500">Brief explanation (5-200 chars)</p>
              </div>
            </div>
          </div>

          {/* Enhanced Preview */}
          {watch('points') && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                </div>
                <p className="text-base font-bold text-gray-900">Preview Changes</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Current</p>
                  <p className="text-2xl font-bold text-gray-900">{customer.loyaltyPoints || 0}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-3xl font-bold" style={{ color: '#fe7f2d' }}>→</div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">New Total</p>
                  <p className="text-2xl font-bold" style={{ color: '#fe7f2d' }}>{getNewPointsPreview()}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                <span className="text-sm text-gray-700 font-medium">New Tier:</span>
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${getLoyaltyTierColor(
                    getNewPointsPreview()
                  )}`}
                >
                  <StarIcon className="h-4 w-4 mr-1" />
                  {getLoyaltyTierName(getNewPointsPreview())}
                </span>
              </div>
            </div>
          )}

          {/* Enhanced Form Actions */}
          <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
            <p className="text-xs text-gray-500">
              {selectedPreset ? (
                <span className="text-green-600 font-medium">✓ Using preset: {selectedPreset.reason}</span>
              ) : (
                'Enter points amount and reason to continue'
              )}
            </p>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                className="px-8 shadow-lg"
                style={{ backgroundColor: '#fe7f2d' }}
              >
                ✓ Update Points
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default LoyaltyManager;
