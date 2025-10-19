import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PencilIcon,
  PrinterIcon,
  ClipboardDocumentIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  TruckIcon,
  BoltIcon,
  InformationCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import {
  getOrderStatusLabel,
  getOrderStatusColor,
  formatOrderNumber,
  formatOrderDate,
  formatOrderAmount,
  calculateOrderProgress,
  useOrder,
} from '../services/orderService';
import Button from '../components/ui/Button';
import PaymentModal from '../components/orders/PaymentModal';
import ReceiptModal from '../components/orders/ReceiptModal';
import OrderStatusManager from '../components/orders/OrderStatusManager';
import ConfirmItemsModal from '../components/orders/ConfirmItemsModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// Helper function to get order phase label and styling
const getOrderPhaseInfo = (phase) => {
  const phaseMap = {
    draft: { label: 'Draft', color: 'bg-gray-500', icon: '📝', description: 'Order is being prepared' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-500', icon: '✅', description: 'Order confirmed, awaiting payment' },
    processing: { label: 'Processing', color: 'bg-purple-500', icon: '⚙️', description: 'Order is being processed' },
    completed: { label: 'Completed', color: 'bg-green-500', icon: '✨', description: 'Order completed' },
    cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: '❌', description: 'Order cancelled' }
  };
  return phaseMap[phase] || { label: 'Unknown', color: 'bg-gray-400', icon: '❓', description: 'Unknown phase' };
};

const OrderDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('details');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showConfirmItemsModal, setShowConfirmItemsModal] = useState(false);

  // Fetch order data
  const { data: orderData, isLoading, error, refetch } = useOrder(id);
  const order = orderData?.order || null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Handle API errors
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Order</h2>
        <p className="text-gray-600 mb-4">{error?.response?.data?.message || error?.message || 'Failed to fetch order details'}</p>
        <div className="space-x-3">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // Handle order not found
  if (!order && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or has been deleted.</p>
        <button
          onClick={() => navigate('/orders')}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          ← Back to Orders
        </button>
      </div>
    );
  }

  const progress = calculateOrderProgress(order.status);
  const phaseInfo = getOrderPhaseInfo(order.orderPhase || 'draft');
  const canEdit = order.isEditable !== false && (order.orderPhase === 'draft' || (order.orderPhase === 'confirmed' && order.paidAmount === 0));

  const tabs = [
    { id: 'details', label: 'Order Details', icon: InformationCircleIcon },
    { id: 'status', label: 'Status Management', icon: BoltIcon },
    { id: 'timeline', label: 'Timeline', icon: ClockIcon },
  ];

  const handlePayment = () => {
    setShowPaymentModal(true);
  };

  const handlePrint = () => {
    setShowReceiptModal(true);
  };

  const handleCopyOrderInfo = () => {
    const orderInfo = `
Order Number: ${order.orderNumber}
Customer: ${order.customerInfo?.name}
Phone: ${order.customerInfo?.phone}
Status: ${getOrderStatusLabel(order.status)}
Total: ${formatOrderAmount(order.totalAmount)}
    `.trim();
    
    navigator.clipboard?.writeText(orderInfo);
  };

  // Copy Email 1: Pickup Scheduled SMS Message
  const copyPickupScheduledSMS = () => {
    const businessName = import.meta.env.VITE_BUSINESS_NAME;
    const address = order.pickupAddress 
      ? `${order.pickupAddress.street || ''}, ${order.pickupAddress.city || ''}`.trim()
      : 'your address';
    
    const smsMessage = `${businessName} - Pickup Scheduled

Order: ${order.orderNumber}
Status: Pickup Scheduled

📍 Pickup: ${address}

We'll pick up your items and send you final confirmation with amounts after we receive and verify them.

Questions? Call us!`;

    navigator.clipboard.writeText(smsMessage).then(() => {
      toast.success('Pickup Scheduled SMS copied! Ready to send.');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  // Copy Email 2: Order Confirmed SMS Message
  const copyOrderConfirmedSMS = () => {
    const businessName = import.meta.env.VITE_BUSINESS_NAME;
    const currency = import.meta.env.VITE_CURRENCY;
    
    // Build items list (short format for SMS)
    let itemsList = '';
    if (order.items && order.items.length > 0) {
      itemsList = order.items.map(item => {
        const qty = item.weight > 0 ? `${item.weight}kg` : `${item.quantity}pcs`;
        return `- ${item.serviceName}: ${qty} = ${formatOrderAmount(item.totalPrice)}`;
      }).join('\n');
    }

    const smsMessage = `${businessName} - Order Confirmed!

Order: ${order.orderNumber}
Status: Processing

Items:
${itemsList}

${order.discountAmount > 0 ? `Subtotal: ${formatOrderAmount(order.subtotal)}\nDiscount: -${formatOrderAmount(order.discountAmount)}\n` : ''}Total: ${formatOrderAmount(order.totalAmount)}

Your order will be ready soon!
Thank you!`;

    navigator.clipboard.writeText(smsMessage).then(() => {
      toast.success('Order Confirmed SMS copied! Ready to send.');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  // Copy customer phone number
  const copyCustomerPhone = () => {
    const phone = order.customerInfo?.phone || 'N/A';
    if (phone === 'N/A') {
      toast.error('No phone number available');
      return;
    }
    navigator.clipboard.writeText(phone).then(() => {
      toast.success('Phone number copied!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const handleStatusUpdate = () => {
    refetch();
  };

  const handleEditOrder = () => {
    navigate(`/orders/edit/${order._id}`);
  };

  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Enhanced Order Header with Gradient */}
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
                  onClick={() => navigate('/orders')}
                  className="h-12 w-12 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-white" />
                </button>
                <div 
                  className="h-16 w-16 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: '#fe7f2d' }}
                >
                  <ClipboardDocumentIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    {formatOrderNumber(order.orderNumber)}
                  </h2>
                  <p className="text-sm text-white/70 mt-1">
                    📅 Created {formatOrderDate(order.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-md ${phaseInfo.color} text-white`} title={phaseInfo.description}>
                    {phaseInfo.icon} {phaseInfo.label}
                  </span>
                  <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>
                {order.balanceAmount > 0 ? (
                  <span className="text-red-300 text-sm font-medium">
                    💰 {formatOrderAmount(order.balanceAmount)} due
                  </span>
                ) : (
                  <span className="text-green-300 text-sm font-medium">
                    ✓ Fully Paid
                  </span>
                )}
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm text-white mb-3">
                <span className="font-semibold">Order Progress</span>
                <span className="font-bold text-lg">{progress}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ 
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #fe7f2d 0%, #fcab10 100%)'
                  }}
                ></div>
              </div>
            </div>

            {/* Priority Quick Actions */}
            <div className="flex flex-wrap gap-3 mt-4">
              {/* Confirm Items Button - Only for pickup orders */}
              {order.pickupRequired && (order.status === 'pickup' || order.status === 'received') && !order.itemsConfirmed && (
                <button
                  onClick={() => setShowConfirmItemsModal(true)}
                  className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 animate-pulse"
                >
                  <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                  🔍 Confirm Items
                </button>
              )}
              
              {order.balanceAmount > 0 && (
                <button
                  onClick={handlePayment}
                  className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                  Process Payment
                </button>
              )}
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-white/10 text-white hover:bg-white/20 border-2 border-white/20 transition-all duration-200"
              >
                <PrinterIcon className="h-5 w-5 mr-2" />
                Print Receipt
              </button>
              {canEdit ? (
                <button
                  onClick={handleEditOrder}
                  className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-white/10 text-white hover:bg-white/20 border-2 border-white/20 transition-all duration-200"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Order
                </button>
              ) : (
                <button
                  onClick={() => {
                    let reason = 'Order cannot be edited';
                    if (order.orderPhase === 'processing') reason = 'Order is being processed and cannot be edited';
                    else if (order.orderPhase === 'completed') reason = 'Order is completed and cannot be edited';
                    else if (order.orderPhase === 'cancelled') reason = 'Order is cancelled and cannot be edited';
                    else if (order.paidAmount > 0) reason = 'Order has payment and cannot be edited. Refund payment first.';
                    toast.error(reason);
                  }}
                  className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-gray-400 text-white cursor-not-allowed opacity-60 border-2 border-gray-400"
                  title="Order cannot be edited"
                >
                  <LockClosedIcon className="h-5 w-5 mr-2" />
                  Edit Locked
                </button>
              )}
              <button
                onClick={handleCopyOrderInfo}
                className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-white/10 text-white hover:bg-white/20 border-2 border-white/20 transition-all duration-200"
              >
                <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                Copy Info
              </button>
            </div>
          </div>
        </div>

        {/* Warning for orders that need re-confirmation */}
        {order.orderPhase === 'draft' && order.pickupRequired && order.itemsConfirmed === false && order.status === 'received' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-bold text-yellow-900">Items Need Confirmation</h3>
                <p className="text-xs text-yellow-700 mt-1">
                  Items have been picked up but not confirmed yet. Please confirm the actual quantities to proceed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation history display */}
        {order.confirmationHistory && order.confirmationHistory.difference && Math.abs(order.confirmationHistory.difference) > 0.01 && (
          <div className={`border-l-4 p-4 rounded-lg ${order.confirmationHistory.difference > 0 ? 'bg-orange-50 border-orange-400' : 'bg-green-50 border-green-400'}`}>
            <div className="flex items-center">
              <InformationCircleIcon className={`h-6 w-6 mr-3 ${order.confirmationHistory.difference > 0 ? 'text-orange-600' : 'text-green-600'}`} />
              <div>
                <h3 className={`text-sm font-bold ${order.confirmationHistory.difference > 0 ? 'text-orange-900' : 'text-green-900'}`}>
                  Order Total Adjusted After Confirmation
                </h3>
                <p className={`text-xs mt-1 ${order.confirmationHistory.difference > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                  Estimated: {formatOrderAmount(order.confirmationHistory.estimatedTotal)} → 
                  Actual: {formatOrderAmount(order.confirmationHistory.actualTotal)} 
                  ({order.confirmationHistory.difference > 0 ? '+' : ''}{formatOrderAmount(order.confirmationHistory.difference)})
                </p>
                {order.confirmationHistory.notes && (
                  <p className={`text-xs mt-1 ${order.confirmationHistory.difference > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {order.confirmationHistory.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex space-x-1 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-5 border-b-3 font-semibold text-sm transition-all duration-200 ${
                      isActive
                        ? 'text-white border-b-3'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                    }`}
                    style={
                      isActive
                        ? { 
                            borderBottomWidth: '3px',
                            borderBottomColor: '#fe7f2d',
                            color: '#233d4d',
                            backgroundColor: 'white'
                          }
                        : { borderBottomWidth: '3px' }
                    }
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-orange-500' : ''}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 min-h-[400px]">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Pickup Order Confirmation Alert */}
                {order.pickupRequired && !order.itemsConfirmed && (order.status === 'pickup' || order.status === 'received') && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 p-5 rounded-r-xl shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ClipboardDocumentCheckIcon className="h-7 w-7 text-yellow-600 mr-3 animate-bounce" />
                        <div>
                          <h3 className="text-base font-bold text-yellow-900">
                            ⚠️ Action Required: Confirm Received Items
                          </h3>
                          <p className="text-sm text-yellow-800 mt-1">
                            This is a pickup order with estimated quantities. Please confirm actual items received to send accurate details to customer.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowConfirmItemsModal(true)}
                        className="ml-4 inline-flex items-center px-5 py-3 text-sm font-bold rounded-xl bg-yellow-600 text-white hover:bg-yellow-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex-shrink-0"
                      >
                        <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                        Confirm Now
                      </button>
                    </div>
                  </div>
                )}

                {/* Enhanced Customer Information & Order Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center mr-2">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                      Customer Information
                    </h3>
                    <div className="space-y-3 bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase w-16">Name:</span>
                          <p className="text-sm font-semibold text-gray-900">{order.customerInfo?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase w-16">Phone:</span>
                          <p className="text-sm text-gray-900">📞 {order.customerInfo?.phone || 'N/A'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={copyCustomerPhone}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Copy phone number"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                      {order.customerInfo?.email && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase w-16">Email:</span>
                          <p className="text-sm text-gray-900 truncate">✉️ {order.customerInfo.email}</p>
                        </div>
                      )}
                      {order.customerInfo?.address && (
                        <div className="pt-3 border-t border-gray-200">
                          <span className="text-xs font-semibold text-gray-500 uppercase">Address:</span>
                          <p className="text-sm text-gray-900 mt-1">
                            {[
                              order.customerInfo.address.street,
                              order.customerInfo.address.city,
                            ].filter(Boolean).join(', ') || 'N/A'}
                          </p>
                        </div>
                      )}

                      {/* SMS Copy Buttons */}
                      <div className="pt-3 border-t border-gray-200 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase">📱 Manual SMS Messages:</p>
                        
                        {/* Pickup Scheduled SMS */}
                        {order.pickupRequired && !order.itemsConfirmed && (
                          <button
                            type="button"
                            onClick={copyPickupScheduledSMS}
                            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                            <span className="text-sm font-semibold">Copy "Pickup Scheduled" SMS</span>
                          </button>
                        )}

                        {/* Order Confirmed SMS */}
                        {(!order.pickupRequired || order.itemsConfirmed) && (
                          <button
                            type="button"
                            onClick={copyOrderConfirmedSMS}
                            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                            <span className="text-sm font-semibold">Copy "Order Confirmed" SMS</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center mr-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-white" />
                      </div>
                      Payment Summary
                    </h3>
                    <div className="space-y-3 bg-white rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="text-sm font-semibold text-gray-900">{formatOrderAmount(order.subtotal)}</span>
                      </div>
                      {order.isExpressService && order.expressServiceFee > 0 && (
                        <div className="flex justify-between items-center bg-blue-50 -mx-4 px-4 py-2 border-l-4 border-blue-500">
                          <span className="text-sm text-blue-700 font-medium flex items-center">
                            ⚡ Express Service (1 Day):
                          </span>
                          <span className="text-sm font-bold text-blue-700">+{formatOrderAmount(order.expressServiceFee)}</span>
                        </div>
                      )}
                      {order.extraCharges && order.extraCharges.items && order.extraCharges.items.length > 0 && (
                        <div className="bg-purple-50 -mx-4 px-4 py-2 border-l-4 border-purple-500">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-purple-700 font-medium">Extra Items:</span>
                            <span className="text-sm font-bold text-purple-700">+{formatOrderAmount(order.extraCharges.total)}</span>
                          </div>
                          <div className="space-y-1 mt-2">
                            {order.extraCharges.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs text-purple-600">
                                <span>• {item.name} ({item.quantity}x)</span>
                                <span>{formatOrderAmount(item.quantity * item.price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {order.taxAmount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Tax:</span>
                          <span className="text-sm font-semibold text-gray-900">{formatOrderAmount(order.taxAmount)}</span>
                        </div>
                      )}
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between items-center bg-green-50 -mx-4 px-4 py-2 border-l-4 border-green-500">
                          <div>
                            <span className="text-sm text-green-700 font-medium block">
                              Discount ({order.discount?.percentage}%):
                            </span>
                            {order.discount?.description && (
                              <span className="text-xs text-green-600">{order.discount.description}</span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-green-700">-{formatOrderAmount(order.discountAmount)}</span>
                        </div>
                      )}
                      <div className="border-t-2 border-gray-200 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-bold text-gray-900">Total Amount:</span>
                          <span className="text-xl font-bold text-gray-900">{formatOrderAmount(order.totalAmount)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Amount Paid:</span>
                        <span className="text-sm font-bold text-green-600">{formatOrderAmount(order.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-900">Balance Due:</span>
                        <span className={`text-lg font-bold ${order.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatOrderAmount(order.balanceAmount)}
                        </span>
                      </div>
                      {order.balanceAmount <= 0 ? (
                        <div className="mt-3 p-3 bg-green-100 rounded-lg text-center">
                          <span className="text-sm font-bold text-green-700">✓ Fully Paid</span>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-red-100 rounded-lg text-center">
                          <span className="text-sm font-bold text-red-700">⚠️ Payment Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Order Items */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center mr-2">
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                      </div>
                      Order Items
                    </h3>
                    <div className="flex items-center space-x-2">
                      {order.pickupRequired && !order.itemsConfirmed && order.status === 'pickup' && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-300 shadow-sm">
                          ⏳ Awaiting Confirmation
                        </span>
                      )}
                      {order.itemsConfirmed && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border-2 border-green-300 shadow-sm">
                          ✅ Items Confirmed
                        </span>
                      )}
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800">
                        {order.items?.length || 0} Item{order.items?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Service</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Qty/Weight</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Unit Price</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.items?.map((item, index) => (
                          <tr key={index} className="hover:bg-orange-50 transition-colors duration-150">
                            <td className="px-4 py-4">
                              <div className="text-sm font-semibold text-gray-900">{item.serviceName}</div>
                              {item.notes && (
                                <div className="text-xs text-gray-600 mt-1 italic">📝 {item.notes}</div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-700">
                              {item.quantity} {item.weight > 0 && `(${item.weight}kg)`}
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 shadow-sm">
                                {item.clothingCategory?.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-right">
                              {formatOrderAmount(item.unitPrice)}
                            </td>
                            <td className="px-4 py-4 text-base font-bold text-right" style={{ color: '#fe7f2d' }}>
                              {formatOrderAmount(item.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="4" className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            Subtotal:
                          </td>
                          <td className="px-4 py-3 text-right text-base font-bold text-gray-900">
                            {formatOrderAmount(order.subtotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Enhanced Pickup & Delivery Info */}
                {(order.pickupRequired || order.deliveryRequired) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {order.pickupRequired && (
                      <div className="bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-orange-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <div className="h-8 w-8 rounded-lg bg-orange-600 flex items-center justify-center mr-2">
                            <TruckIcon className="h-5 w-5 text-white" />
                          </div>
                          Pickup Information
                        </h3>
                        <div className="bg-white rounded-lg p-4 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Address</p>
                            <p className="text-sm font-medium text-gray-900">
                              {[
                                order.pickupAddress?.street,
                                order.pickupAddress?.city,
                              ].filter(Boolean).join(', ') || 'No address provided'}
                            </p>
                          </div>
                          {order.pickupAddress?.notes && (
                            <div className="pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p>
                              <p className="text-sm text-gray-700 italic">📝 {order.pickupAddress.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {order.deliveryRequired && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center mr-2">
                            <TruckIcon className="h-5 w-5 text-white" />
                          </div>
                          Delivery Information
                        </h3>
                        <div className="bg-white rounded-lg p-4 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Address</p>
                            <p className="text-sm font-medium text-gray-900">
                              {[
                                order.deliveryAddress?.street,
                                order.deliveryAddress?.city,
                              ].filter(Boolean).join(', ') || 'No address provided'}
                            </p>
                          </div>
                          {order.deliveryAddress?.notes && (
                            <div className="pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p>
                              <p className="text-sm text-gray-700 italic">📝 {order.deliveryAddress.notes}</p>
                            </div>
                          )}
                          {order.actualDeliveryDate && (
                            <div className="pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Delivered</p>
                              <p className="text-sm font-bold text-green-600">
                                ✓ {formatOrderDate(order.actualDeliveryDate)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Special Instructions */}
                {order.specialInstructions && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
                        <InformationCircleIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-yellow-900 mb-2">⚠️ Special Instructions</h4>
                        <p className="text-sm text-yellow-800 font-medium">{order.specialInstructions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Management Tab */}
            {activeTab === 'status' && (
              <OrderStatusManager 
                order={order} 
                onStatusUpdate={handleStatusUpdate}
              />
            )}

            {/* Enhanced Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-2">
                      <ClockIcon className="h-5 w-5 text-white" />
                    </div>
                    Order Timeline
                  </h3>
                  <div className="relative space-y-6 pl-8">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    {/* Created */}
                    <div className="relative flex items-start space-x-4">
                      <div className="absolute -left-8 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                          <CalendarIcon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-bold text-gray-900">Order Created</p>
                        <p className="text-xs text-gray-600 mt-1">📅 {formatOrderDate(order.createdAt)}</p>
                        {order.createdBy && (
                          <p className="text-xs text-gray-500 mt-1">👤 By: {order.createdBy.fullName || order.createdBy.username}</p>
                        )}
                      </div>
                    </div>

                    {/* Updated */}
                    {order.updatedAt && order.updatedAt !== order.createdAt && (
                      <div className="relative flex items-start space-x-4">
                        <div className="absolute -left-8 flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                            <ClockIcon className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 bg-green-50 rounded-lg p-4 border border-green-200">
                          <p className="text-sm font-bold text-gray-900">Last Updated</p>
                          <p className="text-xs text-gray-600 mt-1">📅 {formatOrderDate(order.updatedAt)}</p>
                        </div>
                      </div>
                    )}

                    {/* Delivered */}
                    {order.actualDeliveryDate && (
                      <div className="relative flex items-start space-x-4">
                        <div className="absolute -left-8 flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center shadow-md">
                            <TruckIcon className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 bg-teal-50 rounded-lg p-4 border border-teal-200">
                          <p className="text-sm font-bold text-gray-900">Order Delivered</p>
                          <p className="text-xs text-gray-600 mt-1">📅 {formatOrderDate(order.actualDeliveryDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Payment History */}
                {order.payments && order.payments.length > 0 && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center mr-2">
                          <CurrencyDollarIcon className="h-5 w-5 text-white" />
                        </div>
                        Payment History
                      </h3>
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                        {order.payments.length} Payment{order.payments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {order.payments.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
                              <CurrencyDollarIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {payment.method?.replace('_', ' ').toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                📅 {formatOrderDate(payment.processedAt || payment.createdAt)}
                              </p>
                              {payment.transactionId && (
                                <p className="text-xs text-gray-500 mt-0.5">ID: {payment.transactionId}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">{formatOrderAmount(payment.amount)}</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold mt-1 ${
                              payment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {payment.status === 'completed' ? '✓ ' : '⏳ '}{payment.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          order={order}
          onPaymentSuccess={refetch}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          order={order}
        />
      )}

      {/* Confirm Items Modal */}
      {showConfirmItemsModal && (
        <ConfirmItemsModal
          isOpen={showConfirmItemsModal}
          onClose={() => setShowConfirmItemsModal(false)}
          order={order}
          onSuccess={() => {
            setShowConfirmItemsModal(false);
            refetch();
          }}
        />
      )}
    </>
  );
};

export default OrderDetailsPage;

