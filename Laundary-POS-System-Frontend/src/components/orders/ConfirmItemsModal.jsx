import React, { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { ordersAPI } from '../../services/api';
import { formatOrderAmount } from '../../services/orderService';
import { getClothingCategoryLabel } from '../../services/serviceService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ConfirmItemsModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [confirmedItems, setConfirmedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Initialize confirmed items with estimated values
  useEffect(() => {
    if (isOpen && order && order.items) {
      const initialItems = order.items.map(item => ({
        itemId: item._id,
        serviceName: item.serviceName,
        serviceId: item.service?._id || item.service,
        priceType: item.service?.priceType || 'per_piece',
        clothingCategory: item.clothingCategory,
        estimatedQuantity: item.quantity || 0,
        estimatedWeight: item.weight || 0,
        actualQuantity: item.quantity || 0,
        actualWeight: item.weight || 0,
        unitPrice: item.unitPrice,
        estimatedPrice: item.totalPrice,
        actualPrice: item.totalPrice,
        notes: item.notes || ''
      }));
      setConfirmedItems(initialItems);
    }
  }, [isOpen, order]);

  // Update actual price when quantities change
  const updateItemQuantity = (index, field, value) => {
    const newItems = [...confirmedItems];
    newItems[index][field] = parseFloat(value) || 0;

    // Recalculate actual price
    const item = newItems[index];
    if (item.priceType === 'per_kg') {
      item.actualPrice = item.unitPrice * item.actualWeight;
    } else {
      item.actualPrice = item.unitPrice * item.actualQuantity;
    }

    setConfirmedItems(newItems);
  };

  // Quick confirm all (set actual = estimated)
  const quickConfirmAll = () => {
    const newItems = confirmedItems.map(item => ({
      ...item,
      actualQuantity: item.estimatedQuantity,
      actualWeight: item.estimatedWeight,
      actualPrice: item.estimatedPrice
    }));
    setConfirmedItems(newItems);
    toast.success('All items set to estimated values');
  };

  // Calculate totals
  const calculateTotals = () => {
    const estimatedSubtotal = confirmedItems.reduce((sum, item) => sum + item.estimatedPrice, 0);
    const actualSubtotal = confirmedItems.reduce((sum, item) => sum + item.actualPrice, 0);
    
    // Apply student discount if applicable
    const discountRate = order.discountAmount > 0 ? (order.discountAmount / order.subtotal) : 0;
    const actualDiscount = actualSubtotal * discountRate;
    
    const actualTotal = actualSubtotal - actualDiscount;
    const estimatedTotal = order.totalAmount;
    const difference = actualTotal - estimatedTotal;

    return {
      estimatedSubtotal,
      actualSubtotal,
      actualDiscount,
      actualTotal,
      estimatedTotal,
      difference,
      differencePercent: estimatedTotal > 0 ? ((difference / estimatedTotal) * 100) : 0
    };
  };

  const totals = calculateTotals();

  // Get visual indicator for item
  const getItemIndicator = (item) => {
    const priceDiff = item.actualPrice - item.estimatedPrice;
    const percentDiff = item.estimatedPrice > 0 ? (priceDiff / item.estimatedPrice) * 100 : 0;

    if (Math.abs(priceDiff) < 0.01) {
      return { icon: CheckCircleIcon, color: 'text-green-500', label: 'No change', bgColor: 'bg-green-50' };
    } else if (Math.abs(percentDiff) < 20) {
      return { icon: ExclamationTriangleIcon, color: 'text-yellow-500', label: 'Small change', bgColor: 'bg-yellow-50' };
    } else {
      return { icon: ExclamationTriangleIcon, color: 'text-red-500', label: 'Large change', bgColor: 'bg-red-50' };
    }
  };

  // Submit confirmation
  const confirmMutation = useMutation({
    mutationFn: async (data) => {
      const response = await ordersAPI.confirmItems(order._id, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['order', order._id]);
      queryClient.invalidateQueries(['orders']);
      toast.success('Items confirmed and customer notified via email!');
      if (onSuccess) onSuccess(data.data.order);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to confirm items');
    }
  });

  const handleConfirm = () => {
    // Validate all items
    const hasErrors = confirmedItems.some(item => {
      if (item.priceType === 'per_kg') {
        return item.actualWeight <= 0;
      } else {
        return item.actualQuantity <= 0;
      }
    });

    if (hasErrors) {
      toast.error('Please enter valid quantities for all items');
      return;
    }

    // Warning if large difference
    if (Math.abs(totals.differencePercent) > 30) {
      if (!window.confirm(`Total amount changed by ${Math.abs(totals.differencePercent).toFixed(0)}%. Confirm this is correct?`)) {
        return;
      }
    }

    // Prepare data for API
    const payload = {
      items: confirmedItems.map(item => ({
        itemId: item.itemId,
        actualQuantity: item.actualQuantity,
        actualWeight: item.actualWeight,
        clothingCategory: item.clothingCategory,
        notes: item.notes
      }))
    };

    confirmMutation.mutate(payload);
  };

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Confirm Items - ${order.orderNumber}`}
      size="sm"
      className="!max-w-sm"
    >
      <div className="space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
        
        {/* Quick Actions */}
        <div className="flex justify-between items-center bg-blue-50 rounded-lg p-2">
          <p className="text-xs text-blue-800">
            Update quantities below
          </p>
          <button
            type="button"
            onClick={quickConfirmAll}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <ClipboardDocumentCheckIcon className="h-3 w-3" />
            <span>Quick Confirm</span>
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {confirmedItems.map((item, index) => {
            const indicator = getItemIndicator(item);
            const Icon = indicator.icon;
            const priceDiff = item.actualPrice - item.estimatedPrice;
            const isPerKg = item.priceType === 'per_kg';

            return (
              <div key={item.itemId} className="border rounded-lg p-2.5 bg-white border-gray-300">
                {/* Header - Compact */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {item.serviceName}
                  </h3>
                  <div className={`flex items-center space-x-0.5 ${indicator.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Estimated vs Actual - Inline */}
                <div className="flex items-center gap-2 text-xs mb-1.5">
                  <div className="flex-1">
                    <span className="text-gray-500">Est:</span>
                    <span className="font-medium ml-1">
                      {isPerKg ? `${item.estimatedWeight}kg` : `${item.estimatedQuantity}pcs`}
                    </span>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex-1">
                    {isPerKg ? (
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={item.actualWeight}
                        onChange={(e) => updateItemQuantity(index, 'actualWeight', e.target.value)}
                        placeholder="kg"
                        className="text-sm font-semibold h-7 w-full"
                      />
                    ) : (
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={item.actualQuantity}
                        onChange={(e) => updateItemQuantity(index, 'actualQuantity', e.target.value)}
                        placeholder="pcs"
                        className="text-sm font-semibold h-7 w-full"
                      />
                    )}
                  </div>
                </div>

                {/* Price Info - Compact */}
                <div className="flex justify-between items-center text-xs pt-1.5 border-t">
                  <span className="text-gray-600">Price:</span>
                  <div className="text-right">
                    <span className="font-bold text-blue-600">{formatOrderAmount(item.actualPrice)}</span>
                    {Math.abs(priceDiff) > 0.01 && (
                      <span className={`ml-2 ${priceDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ({priceDiff > 0 ? '+' : ''}{formatOrderAmount(priceDiff)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Display - Compact */}
        {Math.abs(totals.difference) > 0.01 && (
          <div className={`rounded-lg p-2 text-xs ${
            totals.difference > 0 ? 'bg-yellow-50 border border-yellow-300' : 'bg-green-50 border border-green-300'
          }`}>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Total Change:</span>
              <span className={`font-bold ${totals.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {totals.difference > 0 ? '+' : ''}{formatOrderAmount(totals.difference)}
                <span className="text-xs ml-1">({totals.differencePercent > 0 ? '+' : ''}{totals.differencePercent.toFixed(0)}%)</span>
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between space-x-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={confirmMutation.isPending}
            className="text-sm"
          >
            Cancel
          </Button>
          
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={confirmMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-sm"
          >
            {confirmMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Confirm & Email
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmItemsModal;

