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

  // Helper to get category-specific priceType
  const getCategoryPriceType = (service, category) => {
    if (!service || !category) return service?.priceType || 'per_piece';
    let priceTypesObj = service.clothingPriceTypes;
    if (service.clothingPriceTypes instanceof Map) {
      priceTypesObj = Object.fromEntries(service.clothingPriceTypes);
    }
    if (priceTypesObj && priceTypesObj[category]) {
      return priceTypesObj[category];
    }
    return service.priceType || 'per_piece';
  };

  // Initialize confirmed items with estimated values
  useEffect(() => {
    if (isOpen && order && order.items) {
      const initialItems = order.items.map(item => {
        const categoryPriceType = getCategoryPriceType(item.service, item.clothingCategory);
        return {
          itemId: item._id,
          serviceName: item.serviceName,
          serviceId: item.service?._id || item.service,
          priceType: categoryPriceType,
          clothingCategory: item.clothingCategory,
          estimatedQuantity: item.quantity || 0,
          estimatedWeight: item.weight || 0,
          actualQuantity: item.quantity || 0,
          actualWeight: item.weight || 0,
          unitPrice: item.unitPrice,
          estimatedPrice: item.totalPrice,
          actualPrice: item.totalPrice,
          notes: item.notes || ''
        };
      });
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
    
    // Apply discount if applicable
    const discountRate = order.discountAmount > 0 ? (order.discountAmount / order.subtotal) : 0;
    const actualDiscount = actualSubtotal * discountRate;
    
    // Include express service fee and extra charges
    const expressServiceFee = order.expressServiceFee || 0;
    const extraChargesTotal = order.extraCharges?.total || 0;
    const pickupCharges = Number(order.pickupCharges) || 0;
    const deliveryCharges = Number(order.deliveryCharges) || 0;
    
    const actualTotal = actualSubtotal 
      - actualDiscount 
      + expressServiceFee 
      + extraChargesTotal 
      + pickupCharges 
      + deliveryCharges;
    const estimatedTotal = order.totalAmount;
    const difference = actualTotal - estimatedTotal;

    return {
      estimatedSubtotal,
      actualSubtotal,
      actualDiscount,
      expressServiceFee,
      extraChargesTotal,
      pickupCharges,
      deliveryCharges,
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
      size="xl"
    >
      <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
        
        {/* Quick Actions */}
        <div className="flex justify-between items-center bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium">
            Update actual quantities and weights below
          </p>
          <button
            type="button"
            onClick={quickConfirmAll}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <ClipboardDocumentCheckIcon className="h-4 w-4" />
            <span>Quick Confirm All</span>
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {confirmedItems.map((item, index) => {
            const indicator = getItemIndicator(item);
            const Icon = indicator.icon;
            const priceDiff = item.actualPrice - item.estimatedPrice;
            const isPerKg = item.priceType === 'per_kg';

            return (
              <div key={item.itemId} className="border-2 rounded-xl p-5 bg-white border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-base">
                    {item.clothingCategory 
                      ? `${item.serviceName} - ${getClothingCategoryLabel(item.clothingCategory)}`
                      : item.serviceName}
                  </h3>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${indicator.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                {/* Estimated vs Actual - Grid Layout */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Estimated</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {isPerKg ? `${item.estimatedWeight} kg` : `${item.estimatedQuantity} pcs`}
                    </span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <span className="text-xs text-blue-600 uppercase font-semibold block mb-1">Actual {isPerKg ? '(kg)' : '(pcs)'}</span>
                    {isPerKg ? (
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={item.actualWeight}
                        onChange={(e) => updateItemQuantity(index, 'actualWeight', e.target.value)}
                        placeholder="Enter kg"
                        className="text-base font-bold h-10 w-full"
                      />
                    ) : (
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={item.actualQuantity}
                        onChange={(e) => updateItemQuantity(index, 'actualQuantity', e.target.value)}
                        placeholder="Enter pcs"
                        className="text-base font-bold h-10 w-full"
                      />
                    )}
                  </div>
                </div>

                {/* Price Info */}
                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Total Price:</span>
                  <div className="text-right">
                    <span className="font-bold text-blue-600 text-lg">{formatOrderAmount(item.actualPrice)}</span>
                    {Math.abs(priceDiff) > 0.01 && (
                      <span className={`ml-2 text-sm font-semibold ${priceDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ({priceDiff > 0 ? '+' : ''}{formatOrderAmount(priceDiff)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Charges Summary */}
        {(totals.expressServiceFee > 0 || totals.extraChargesTotal > 0 || totals.actualDiscount > 0 || totals.pickupCharges > 0 || totals.deliveryCharges > 0) && (
          <div className="rounded-xl p-4 border-2 border-blue-200 bg-blue-50">
            <h4 className="text-sm font-bold text-blue-900 mb-3">Additional Charges & Discounts</h4>
            <div className="space-y-2 text-sm">
              {totals.pickupCharges > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">📦 Pickup Charges:</span>
                  <span className="font-semibold text-blue-900">+{formatOrderAmount(totals.pickupCharges)}</span>
                </div>
              )}
              {totals.deliveryCharges > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-green-700">🚚 Delivery Charges:</span>
                  <span className="font-semibold text-green-900">+{formatOrderAmount(totals.deliveryCharges)}</span>
                </div>
              )}
              {totals.expressServiceFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">⚡ Express Service (1 Day):</span>
                  <span className="font-semibold text-blue-900">+{formatOrderAmount(totals.expressServiceFee)}</span>
                </div>
              )}
              {totals.extraChargesTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-purple-700">Extra Items:</span>
                  <span className="font-semibold text-purple-900">+{formatOrderAmount(totals.extraChargesTotal)}</span>
                </div>
              )}
              {totals.actualDiscount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Discount:</span>
                  <span className="font-semibold text-green-900">-{formatOrderAmount(totals.actualDiscount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Total Display */}
        <div className="rounded-xl p-5 border-2 border-gray-300 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700 text-base">Estimated Total:</span>
            <span className="font-bold text-gray-900 text-lg">{formatOrderAmount(totals.estimatedTotal)}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-gray-900 text-base">New Total:</span>
            <span className="font-bold text-blue-600 text-xl">{formatOrderAmount(totals.actualTotal)}</span>
          </div>
          {Math.abs(totals.difference) > 0.01 && (
            <div className={`pt-3 border-t-2 ${
              totals.difference > 0 ? 'border-yellow-300' : 'border-green-300'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">Change:</span>
                <span className={`font-bold text-xl ${totals.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {totals.difference > 0 ? '+' : ''}{formatOrderAmount(totals.difference)}
                  <span className="text-sm ml-2">({totals.differencePercent > 0 ? '+' : ''}{totals.differencePercent.toFixed(0)}%)</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t-2 border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={confirmMutation.isPending}
            className="px-6 py-3"
          >
            Cancel
          </Button>
          
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={confirmMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
          >
            {confirmMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Confirm & Email Customer
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmItemsModal;

