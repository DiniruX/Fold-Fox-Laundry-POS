import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { CurrencyDollarIcon, BanknotesIcon, ArrowPathIcon, ClipboardDocumentIcon, PhoneIcon, PlusIcon, TrashIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useAddPayment } from '../../services/orderService';
import { PAYMENT_METHODS } from '../../constants';
import { getPaymentMethodLabel, formatOrderAmount } from '../../services/orderService';
import { getBankAccountDetails, sendBankAccountDetails } from '../../services/paymentService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

// Common extra items that customers might purchase
const COMMON_EXTRA_ITEMS = [
  { name: 'Hanger (Plastic)', price: 25 },
  { name: 'Hanger (Wooden)', price: 50 },
  { name: 'Garment Bag', price: 100 },
  { name: 'Laundry Bag', price: 150 },
  { name: 'Fabric Softener', price: 200 },
  { name: 'Stain Remover', price: 250 },
];

const PaymentModal = ({ isOpen, onClose, order }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState('method'); // 'method', 'bank_details', 'transaction_id'
  const [bankAccountSent, setBankAccountSent] = useState(false);
  const [extraItems, setExtraItems] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      method: 'cash',
      amount: 0,
      transactionId: '',
      notes: '',
    },
  });

  const addPaymentMutation = useAddPayment();
  const paymentMethod = watch('method');
  
  // Calculate total extra charges
  const extraChargesTotal = extraItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate final payment amount (balance + extra charges)
  const baseAmount = order?.balanceAmount || 0;
  const paymentAmount = baseAmount + extraChargesTotal;

  // Get bank account details from service
  const bankAccountDetails = getBankAccountDetails();

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && order) {
      reset({
        method: 'cash',
        amount: order.balanceAmount || 0,
        transactionId: '',
        notes: '',
      });
      setPaymentStep('method');
      setBankAccountSent(false);
      setSendWarning(null);
      setExtraItems([]);
    }
  }, [isOpen, order, reset]);

  // Add extra item
  const addExtraItem = (itemTemplate = null) => {
    const newItem = itemTemplate || { name: '', price: 0, quantity: 1 };
    setExtraItems([...extraItems, { ...newItem, id: Date.now() }]);
  };

  // Remove extra item
  const removeExtraItem = (itemId) => {
    setExtraItems(extraItems.filter(item => item.id !== itemId));
  };

  // Update extra item
  const updateExtraItem = (itemId, field, value) => {
    setExtraItems(extraItems.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handlePaymentMethodChange = (method) => {
    setValue('method', method);
    if (method === PAYMENT_METHODS.CASH) {
      setPaymentStep('method');
    } else if (method === PAYMENT_METHODS.BANK_TRANSFER) {
      setPaymentStep('bank_details');
    }
  };

  const [sendWarning, setSendWarning] = useState(null);

  const sendBankDetails = async () => {
    try {
      setIsLoading(true);
      setSendWarning(null);
      const result = await sendBankAccountDetails(order._id, paymentAmount);
      
      if (result.success) {
        setBankAccountSent(true);
        if (result.warning) {
          // Store warning message to display
          setSendWarning(result.message);
        }
        setPaymentStep('transaction_id');
      } else {
        // Show error but still allow proceeding to transaction ID
        console.error('Error sending bank details:', result.message);
        setSendWarning('Failed to send bank details. Please inform customer manually.');
        setBankAccountSent(true);
        setPaymentStep('transaction_id');
      }
    } catch (error) {
      console.error('Error sending bank details:', error);
      // Still proceed to transaction ID step even if sending fails
      setSendWarning('An error occurred. Please inform customer manually.');
      setBankAccountSent(true);
      setPaymentStep('transaction_id');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Build notes with extra items details
      let paymentNotes = data.notes || '';
      if (extraItems.length > 0) {
        const extraItemsText = extraItems.map(item => 
          `${item.name}: ${item.quantity}x @ LKR ${item.price} = LKR ${item.quantity * item.price}`
        ).join('; ');
        paymentNotes = paymentNotes 
          ? `${paymentNotes}\nExtra Items: ${extraItemsText}` 
          : `Extra Items: ${extraItemsText}`;
      }
      
      if (paymentMethod === PAYMENT_METHODS.CASH) {
        // For cash payments, complete immediately
        await addPaymentMutation.mutateAsync({
          id: order._id,
          data: {
            method: data.method,
            amount: paymentAmount,
            status: 'completed',
            notes: paymentNotes,
            extraCharges: extraChargesTotal > 0 ? {
              items: extraItems,
              total: extraChargesTotal
            } : undefined,
          },
        });
        onClose();
      } else if (paymentMethod === PAYMENT_METHODS.BANK_TRANSFER) {
        // For bank transfer, require transaction ID
        if (!data.transactionId) {
          throw new Error('Transaction ID is required for bank transfer');
        }
        
        await addPaymentMutation.mutateAsync({
          id: order._id,
          data: {
            method: data.method,
            amount: paymentAmount,
            status: 'completed',
            transactionId: data.transactionId,
            notes: paymentNotes,
            extraCharges: extraChargesTotal > 0 ? {
              items: extraItems,
              total: extraChargesTotal
            } : undefined,
          },
        });
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPaymentMethodSelection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`p-6 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
            paymentMethod === PAYMENT_METHODS.CASH
              ? 'border-green-500 bg-green-50 shadow-lg'
              : 'border-gray-200 hover:border-green-300 shadow-sm'
          }`}
          onClick={() => handlePaymentMethodChange(PAYMENT_METHODS.CASH)}
        >
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Cash Payment</h3>
              <p className="text-sm text-gray-500 mt-1">Pay with cash at the counter</p>
            </div>
          </div>
        </div>

        <div
          className={`p-6 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
            paymentMethod === PAYMENT_METHODS.BANK_TRANSFER
              ? 'border-blue-500 bg-blue-50 shadow-lg'
              : 'border-gray-200 hover:border-blue-300 shadow-sm'
          }`}
          onClick={() => handlePaymentMethodChange(PAYMENT_METHODS.BANK_TRANSFER)}
        >
          <div className="flex items-center">
            <ArrowPathIcon className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Bank Transfer</h3>
              <p className="text-sm text-gray-500 mt-1">Transfer to our bank account</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Amount Display */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold text-gray-900">Payment Amount</h4>
        
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800 font-semibold mb-2">Order Balance to Pay:</p>
              <p className="text-3xl font-black text-blue-900">{formatOrderAmount(order?.balanceAmount || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700 font-medium">Already Paid:</p>
              <p className="text-xl font-bold text-green-600">{formatOrderAmount(order?.paidAmount || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Extra Items/Charges Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-900 flex items-center">
            <ShoppingBagIcon className="h-5 w-5 mr-2 text-purple-600" />
            Extra Items (Optional)
          </h4>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-sm text-purple-800 mb-2">
            Add extra items purchased by customer (hangers, bags, etc.)
          </p>
          
          {/* Quick Add Common Items */}
          <div className="mb-3">
            <p className="text-xs font-medium text-purple-900 mb-2">Quick Add:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_EXTRA_ITEMS.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => addExtraItem(item)}
                  className="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-md transition-colors"
                >
                  + {item.name} (LKR {item.price})
                </button>
              ))}
            </div>
          </div>

          {/* Extra Items List */}
          {extraItems.length > 0 && (
            <div className="space-y-2 mb-3">
              {extraItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-2 bg-white rounded p-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateExtraItem(item.id, 'name', e.target.value)}
                    placeholder="Item name"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateExtraItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-xs text-gray-500">×</span>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateExtraItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-900 w-24 text-right">
                    = {formatOrderAmount(item.quantity * item.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExtraItem(item.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {/* Extra Items Total */}
              <div className="flex justify-between items-center bg-purple-100 rounded p-2 font-semibold">
                <span className="text-sm text-purple-900">Extra Items Total:</span>
                <span className="text-sm text-purple-900">{formatOrderAmount(extraChargesTotal)}</span>
              </div>
            </div>
          )}

          {/* Add Custom Item Button */}
          <button
            type="button"
            onClick={() => addExtraItem()}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Custom Item</span>
          </button>
        </div>
      </div>

      {/* Payment Summary with Extra Charges */}
      {extraChargesTotal > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-4">
          <h4 className="text-md font-semibold text-orange-900 mb-3">💰 Payment Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Order Balance:</span>
              <span className="font-medium text-gray-900">{formatOrderAmount(order?.balanceAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Extra Items:</span>
              <span className="font-medium text-purple-900">{formatOrderAmount(extraChargesTotal)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-orange-300 pt-2 mt-2">
              <span className="font-bold text-gray-900">Total Payment:</span>
              <span className="font-bold text-orange-600 text-lg">{formatOrderAmount(paymentAmount)}</span>
            </div>
          </div>
          <div className="bg-white rounded p-2 mt-3">
            <p className="text-xs font-medium text-gray-700">After Payment:</p>
            <p className="text-xs text-gray-600">
              New Total Paid: {formatOrderAmount((order?.paidAmount || 0) + paymentAmount)}
            </p>
            <p className="text-xs text-gray-600">
              Order will be fully paid
              {extraChargesTotal > 0 && <span className="text-purple-600"> (includes extra items: +{formatOrderAmount(extraChargesTotal)})</span>}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-4 border-t-2 border-gray-200">
        <Button type="button" variant="outline" onClick={onClose} className="px-6 py-3">
          Cancel
        </Button>
        {paymentMethod === PAYMENT_METHODS.CASH ? (
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="px-6 py-3 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : '✓ Complete Cash Payment'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setPaymentStep('bank_details')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
          >
            Continue to Bank Details →
          </Button>
        )}
      </div>
    </div>
  );

  // Copy to clipboard functions
  const copyBankDetails = () => {
    let extraItemsText = '';
    if (extraItems.length > 0) {
      const itemsList = extraItems.map(item => 
        `  - ${item.name}: ${item.quantity}x @ LKR ${item.price} = ${formatOrderAmount(item.quantity * item.price)}`
      ).join('\n');
      extraItemsText = `\n\nExtra Items:\n${itemsList}\nExtra Total: ${formatOrderAmount(extraChargesTotal)}`;
    }
    
    const details = `Bank Transfer Details:
Bank: ${bankAccountDetails.bankName}
Account Name: ${bankAccountDetails.accountName}
Account Number: ${bankAccountDetails.accountNumber}
Branch: ${bankAccountDetails.branch}
SWIFT: ${bankAccountDetails.swiftCode}
Amount: ${formatOrderAmount(paymentAmount)}${extraItemsText}
Order: ${order?.orderNumber}

Please use order number as reference.`;
    
    navigator.clipboard.writeText(details).then(() => {
      toast.success('Bank details copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const copyAmount = () => {
    let amountText = `Amount: ${formatOrderAmount(paymentAmount)}`;
    if (extraChargesTotal > 0) {
      amountText += `\n(Order: ${formatOrderAmount(baseAmount)} + Extra Items: ${formatOrderAmount(extraChargesTotal)})`;
    }
    navigator.clipboard.writeText(amountText).then(() => {
      toast.success('Amount copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const copyPhoneNumber = () => {
    const phone = order?.customerInfo?.phone || order?.customer?.phoneNumber || 'N/A';
    if (phone === 'N/A') {
      toast.error('No phone number available');
      return;
    }
    navigator.clipboard.writeText(phone).then(() => {
      toast.success('Phone number copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const copySMSMessage = () => {
    const businessName = import.meta.env.VITE_BUSINESS_NAME;
    
    let extraItemsText = '';
    if (extraItems.length > 0) {
      const itemsList = extraItems.map(item => `${item.name} (${item.quantity}x)`).join(', ');
      extraItemsText = `\nExtra Items: ${itemsList}\nExtra: ${formatOrderAmount(extraChargesTotal)}`;
    }
    
    const smsMessage = `${businessName} - Bank Transfer:
Bank: ${bankAccountDetails.bankName}
Acc: ${bankAccountDetails.accountName}
No: ${bankAccountDetails.accountNumber}
Amount: ${formatOrderAmount(paymentAmount)}${extraItemsText}
Ref: ${order?.orderNumber}

Use order number as reference.`;
    
    navigator.clipboard.writeText(smsMessage).then(() => {
      toast.success('SMS message copied! Ready to paste and send.');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const renderBankDetails = () => (
    <div className="space-y-4">
      {/* Customer Contact Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-medium text-purple-900 flex items-center">
            <PhoneIcon className="h-5 w-5 mr-2" />
            Customer Contact
          </h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-white rounded p-2">
            <div>
              <p className="text-sm text-gray-600">Name:</p>
              <p className="font-medium text-gray-900">{order?.customerInfo?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white rounded p-2">
            <div>
              <p className="text-sm text-gray-600">Phone:</p>
              <p className="font-medium text-gray-900">{order?.customerInfo?.phone || order?.customer?.phoneNumber || 'N/A'}</p>
            </div>
            <button
              type="button"
              onClick={copyPhoneNumber}
              className="ml-2 p-2 text-purple-600 hover:bg-purple-100 rounded transition-colors"
              title="Copy phone number"
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bank Account Details */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-blue-900">Bank Account Details</h3>
          <button
            type="button"
            onClick={copyBankDetails}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            title="Copy all bank details"
          >
            <ClipboardDocumentIcon className="h-5 w-5" />
            <span>Copy All</span>
          </button>
        </div>
        <div className="space-y-3 text-base bg-white rounded-xl p-5 shadow-sm">
          <div className="flex justify-between border-b-2 pb-3">
            <span className="font-semibold text-gray-700">Bank:</span>
            <span className="text-gray-900 font-bold">{bankAccountDetails.bankName}</span>
          </div>
          <div className="flex justify-between border-b-2 pb-3">
            <span className="font-semibold text-gray-700">Account Name:</span>
            <span className="text-gray-900 font-bold">{bankAccountDetails.accountName}</span>
          </div>
          <div className="flex justify-between border-b-2 pb-3">
            <span className="font-semibold text-gray-700">Account Number:</span>
            <span className="text-gray-900 font-mono font-bold text-lg">{bankAccountDetails.accountNumber}</span>
          </div>
          <div className="flex justify-between border-b-2 pb-3">
            <span className="font-semibold text-gray-700">Branch:</span>
            <span className="text-gray-900 font-bold">{bankAccountDetails.branch}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">SWIFT Code:</span>
            <span className="text-gray-900 font-mono font-bold">{bankAccountDetails.swiftCode}</span>
          </div>
        </div>
      </div>

      {/* Payment Amount */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-md font-medium text-yellow-900">Payment Amount</h4>
          <button
            type="button"
            onClick={copyAmount}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            title="Copy amount"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
            <span>Copy</span>
          </button>
        </div>
        <div className="space-y-2">
          {extraChargesTotal > 0 && (
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-yellow-700">Order Balance:</span>
                <span className="font-medium text-yellow-900">{formatOrderAmount(baseAmount)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-purple-700">Extra Items:</span>
                <span className="font-medium text-purple-900">{formatOrderAmount(extraChargesTotal)}</span>
              </div>
              <div className="border-t border-yellow-300 pt-1"></div>
            </div>
          )}
          <p className="text-2xl font-bold text-yellow-800">
            {formatOrderAmount(paymentAmount)}
          </p>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          Order Reference: <span className="font-mono font-semibold">{order?.orderNumber}</span>
        </p>
        <div className="bg-white rounded p-2 mt-2">
          <p className="text-xs font-medium text-gray-700">Payment Preview:</p>
          <p className="text-xs text-gray-600">
            Current Paid: {formatOrderAmount(order?.paidAmount || 0)} + 
            New Payment: {formatOrderAmount(paymentAmount)} = 
            Total Paid: {formatOrderAmount((order?.paidAmount || 0) + paymentAmount)}
          </p>
          <p className="text-xs text-gray-600">
            New Balance: {formatOrderAmount(Math.max(0, (order?.balanceAmount || 0) - baseAmount))}
            {extraChargesTotal > 0 && <span className="text-purple-600"> (Extra items: +{formatOrderAmount(extraChargesTotal)})</span>}
          </p>
        </div>
      </div>

      {/* SMS Helper Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-md font-medium text-green-900 flex items-center">
            <PhoneIcon className="h-5 w-5 mr-2" />
            Send Manual SMS
          </h4>
        </div>
        <p className="text-sm text-green-700 mb-3">
          Copy the formatted message below and send it manually via your phone's SMS app.
        </p>
        <button
          type="button"
          onClick={copySMSMessage}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          <ClipboardDocumentIcon className="h-5 w-5" />
          <span>Copy SMS Message</span>
        </button>
        <p className="text-xs text-green-600 mt-2 text-center">
          Message is pre-formatted and ready to send
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between space-x-4 pt-4 border-t-2 border-gray-200">
        <Button type="button" variant="outline" onClick={() => setPaymentStep('method')} className="px-6 py-3">
          ← Back
        </Button>
        <Button 
          type="button" 
          onClick={sendBankDetails}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : '✉️ Send Details via Email & Continue →'}
        </Button>
      </div>
    </div>
  );

  const renderTransactionId = () => (
    <div className="space-y-4">
      {bankAccountSent && !sendWarning && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-green-900">Bank details sent to customer via Email!</h4>
          <p className="text-sm text-green-700">Please wait for the customer to complete the transfer.</p>
        </div>
      )}

      {sendWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-yellow-900">⚠️ Manual Notification Required</h4>
          <p className="text-sm text-yellow-700">{sendWarning}</p>
          <p className="text-sm text-yellow-700 mt-2">
            Please inform the customer about the bank details by phone or in person.
          </p>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-base font-semibold text-gray-800 mb-2">
            Transaction ID / Reference Number *
          </label>
          <input
            {...register('transactionId', {
              required: 'Transaction ID is required',
              minLength: { value: 3, message: 'Transaction ID must be at least 3 characters' }
            })}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter transaction ID from bank"
          />
          {errors.transactionId && (
            <p className="mt-2 text-sm text-red-600">{errors.transactionId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-800 mb-2">
            Notes (Optional)
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any additional notes"
          />
        </div>
      </div>

      <div className="flex justify-between space-x-4 pt-4 border-t-2 border-gray-200">
        <Button type="button" variant="outline" onClick={() => setPaymentStep('bank_details')} className="px-6 py-3">
          ← Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
          className="px-6 py-3 bg-green-600 hover:bg-green-700"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : '✓ Complete Payment'}
        </Button>
      </div>
    </div>
  );

  if (!order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Process Payment" size="xl">
      <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
        {/* Enhanced Order Summary with Discount Breakdown */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-5 flex items-center">
            <CurrencyDollarIcon className="h-7 w-7 mr-3 text-orange-500" />
            Order Summary
          </h3>
          
          {/* Basic Info */}
          <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-mono font-semibold text-gray-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium text-gray-900">{order.customerInfo?.name || 'N/A'}</span>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Price Breakdown</h4>
            
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-semibold text-gray-900 text-lg">
                {formatOrderAmount(order.subtotal || 0)}
              </span>
            </div>

            {/* Discount - Highlighted if exists */}
            {order.discount && order.discount.percentage > 0 && (
              <div className="flex justify-between items-center bg-green-50 -mx-4 px-4 py-2.5 border-l-4 border-green-500">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-green-700 font-medium">
                      Discount ({order.discount.percentage}%):
                    </span>
                    {order.discount.type === 'campaign' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange text-white">
                        CAMPAIGN
                      </span>
                    )}
                    {order.discount.type === 'student' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-600 text-white">
                        STUDENT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-green-600 mt-0.5">{order.discount.description}</p>
                </div>
                <span className="font-bold text-green-700 text-lg">
                  - {formatOrderAmount(order.discountAmount || 0)}
                </span>
              </div>
            )}

            {/* Tax */}
            {order.taxAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Tax:</span>
                <span className="font-semibold text-gray-900">
                  + {formatOrderAmount(order.taxAmount)}
                </span>
              </div>
            )}

            {/* Total - Prominent */}
            <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-gray-300">
              <span className="text-lg font-bold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-black text-orange">
                {formatOrderAmount(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Already Paid:</span>
              <span className="font-semibold text-green-600">
                {formatOrderAmount(order.paidAmount || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Remaining Balance:</span>
              <span className={`text-2xl font-black ${order.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatOrderAmount(order.balanceAmount)}
              </span>
            </div>
          </div>

          {/* Discount Info Badge (if applicable) */}
          {order.discount && order.discount.code && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-700 font-medium">Discount Code:</p>
                  <p className="text-sm font-mono font-bold text-blue-900">{order.discount.code}</p>
                </div>
                {order.discount.isFirstOrderDiscount && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange text-white">
                    🎉 FIRST ORDER
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Payment Steps */}
        {paymentStep === 'method' && renderPaymentMethodSelection()}
        {paymentStep === 'bank_details' && renderBankDetails()}
        {paymentStep === 'transaction_id' && renderTransactionId()}
      </div>
    </Modal>
  );
};

export default PaymentModal;