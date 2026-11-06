import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { CurrencyDollarIcon, BanknotesIcon, ArrowPathIcon, ClipboardDocumentIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useAddPayment, usePricingConfig } from '../../services/orderService';
import { PAYMENT_METHODS, BUSINESS_NAME } from '../../constants';
import { formatOrderAmount } from '../../services/orderService';
import { getBankAccountDetails, sendBankAccountDetails } from '../../services/paymentService';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const PaymentModal = ({ isOpen, onClose, order }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState('method'); // 'method', 'bank_details', 'transaction_id'
  const [bankAccountSent, setBankAccountSent] = useState(false);
  // 'full' settles the balance; 'partial' lets the cashier enter what was handed over
  const [paymentMode, setPaymentMode] = useState('full');

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
  const enteredAmount = watch('amount');

  const { pricing } = usePricingConfig();
  const currentTopUp = Number(order?.minimumOrderAdjustment) || 0;

  // What is still owed, and what this payment will collect
  const balanceDue = round2(order?.balanceAmount || 0);
  const partialAmount = round2(enteredAmount);
  const paymentAmount = paymentMode === 'full' ? balanceDue : Math.min(Math.max(partialAmount, 0), balanceDue);
  const remainingAfter = round2(balanceDue - paymentAmount);
  const amountError =
    paymentMode === 'partial' && (partialAmount <= 0 ? 'Enter the amount received' : partialAmount > balanceDue ? `Cannot exceed the balance of ${formatOrderAmount(balanceDue)}` : '');

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
      setPaymentMode('full');
    }
  }, [isOpen, order, reset]);

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
    if (amountError) {
      toast.error(amountError);
      return;
    }
    if (paymentAmount <= 0) {
      toast.error('Nothing left to pay on this order');
      return;
    }
    try {
      setIsLoading(true);
      const paymentNotes = [
        remainingAfter > 0 ? `Partial payment - ${formatOrderAmount(remainingAfter)} still due` : null,
        data.notes || null,
      ].filter(Boolean).join('\n');

      if (paymentMethod === PAYMENT_METHODS.CASH) {
        await addPaymentMutation.mutateAsync({
          id: order._id,
          data: {
            method: data.method,
            amount: paymentAmount,
            status: 'completed',
            notes: paymentNotes,
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

      {/* How much is being paid */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold text-gray-900">Payment Amount</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMode('full')}
            className={`p-4 border-2 rounded-xl text-left transition-all ${paymentMode === 'full' ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 hover:border-green-300'}`}
          >
            <p className="text-sm font-bold text-gray-900">Pay in full</p>
            <p className="text-xs text-gray-500 mt-0.5">Settle the whole remaining balance</p>
            <p className="text-2xl font-black text-green-700 mt-2">{formatOrderAmount(balanceDue)}</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setPaymentMode('partial');
              if (!partialAmount) setValue('amount', '');
            }}
            className={`p-4 border-2 rounded-xl text-left transition-all ${paymentMode === 'partial' ? 'border-amber-500 bg-amber-50 shadow-md' : 'border-gray-200 hover:border-amber-300'}`}
          >
            <p className="text-sm font-bold text-gray-900">Partial payment</p>
            <p className="text-xs text-gray-500 mt-0.5">Record an advance or instalment; the rest stays due</p>
            <p className="text-2xl font-black text-amber-700 mt-2">{paymentMode === 'partial' && paymentAmount > 0 ? formatOrderAmount(paymentAmount) : '—'}</p>
          </button>
        </div>

        {paymentMode === 'partial' && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <label className="block text-sm font-semibold text-amber-900 mb-2">Amount paid now (LKR) *</label>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
              <div className="flex-1">
                <input
                  type="number"
                  min="1"
                  step="1"
                  max={balanceDue}
                  autoFocus
                  {...register('amount')}
                  className={`w-full px-4 py-3 text-lg font-bold border-2 rounded-xl focus:outline-none focus:ring-4 ${amountError ? 'border-red-300 focus:ring-red-100' : 'border-amber-300 focus:ring-amber-100 focus:border-amber-500'}`}
                  placeholder="0"
                />
                {amountError && <p className="mt-1 text-sm text-red-600 font-medium">{amountError}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {[0.25, 0.5, 0.75].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setValue('amount', Math.round(balanceDue * f))}
                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100"
                  >
                    {f * 100}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-blue-700 font-medium">Already paid</p>
              <p className="text-lg font-bold text-gray-800">{formatOrderAmount(order?.paidAmount || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Paying now</p>
              <p className="text-2xl font-black text-blue-900">{formatOrderAmount(paymentAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Left after this</p>
              <p className={`text-lg font-bold ${remainingAfter > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {remainingAfter > 0 ? formatOrderAmount(remainingAfter) : '✓ Fully paid'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t-2 border-gray-200">
        <Button type="button" variant="outline" onClick={onClose} className="px-6 py-3">
          Cancel
        </Button>
        {paymentMethod === PAYMENT_METHODS.CASH ? (
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading || !!amountError || paymentAmount <= 0}
            className="px-6 py-3 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : remainingAfter > 0 ? `✓ Record ${formatOrderAmount(paymentAmount)} Cash` : '✓ Complete Cash Payment'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setPaymentStep('bank_details')}
            disabled={!!amountError || paymentAmount <= 0}
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
    const extraItemsText = remainingAfter > 0 ? `\n(Partial payment - ${formatOrderAmount(remainingAfter)} remains due)` : '';

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
    const amountText = `Amount: ${formatOrderAmount(paymentAmount)}`;
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
    const businessName = BUSINESS_NAME;
    const extraItemsText = remainingAfter > 0 ? `\n(Partial - ${formatOrderAmount(remainingAfter)} remains)` : '';

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
          <p className="text-2xl font-bold text-yellow-800">
            {formatOrderAmount(paymentAmount)}
            {remainingAfter > 0 && <span className="ml-2 text-sm font-semibold text-amber-700">partial · {formatOrderAmount(remainingAfter)} remains</span>}
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
            New Balance: {formatOrderAmount(remainingAfter)}
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t-2 border-gray-200">
        <div>
          <Button type="button" variant="outline" onClick={() => setPaymentStep('method')} className="px-6 py-3">
            ← Back
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            type="button" 
            onClick={sendBankDetails}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
            title={bankAccountSent ? 'Resend bank details to customer' : 'Send bank details to customer'}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : (bankAccountSent ? '✉️ Resend Bank Details' : '✉️ Send Bank Details')}
          </Button>
          <Button
            type="button"
            onClick={() => setPaymentStep('transaction_id')}
            className="px-6 py-3 bg-green-600 hover:bg-green-700"
          >
            Add Transaction ID & Complete →
          </Button>
        </div>
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
          {isLoading ? <LoadingSpinner size="sm" /> : remainingAfter > 0 ? `✓ Record ${formatOrderAmount(paymentAmount)} Transfer` : '✓ Complete Payment'}
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

            {/* Pickup - Always show if required */}
            {order.pickupRequired && (
              <div className="flex justify-between items-center bg-orange-50 -mx-4 px-4 py-2 border-l-4 border-orange-500">
                <span className="text-orange-700 font-medium">📦 Pickup:</span>
                <span className="font-bold text-orange-700">
                  {order.pickupCharges > 0 ? formatOrderAmount(order.pickupCharges) : 'FREE'}
                </span>
              </div>
            )}

            {/* Delivery - Always show if required */}
            {order.deliveryRequired && (
              <div className="flex justify-between items-center bg-green-50 -mx-4 px-4 py-2 border-l-4 border-green-500">
                <span className="text-green-700 font-medium">
                  🚚 Delivery{order.deliveryDistance > 0 ? ` (${order.deliveryDistance}km)` : ''}:
                </span>
                <span className="font-bold text-green-700">
                  {order.deliveryCharges > 0 ? formatOrderAmount(order.deliveryCharges) : 'FREE'}
                </span>
              </div>
            )}

            {/* Express fee */}
            {order.isExpressService && order.expressServiceFee > 0 && (
              <div className="flex justify-between items-center bg-blue-50 -mx-4 px-4 py-2 border-l-4 border-blue-500">
                <span className="text-blue-700 font-medium">⚡ Express Service (1 Day):</span>
                <span className="font-bold text-blue-700">+ {formatOrderAmount(order.expressServiceFee)}</span>
              </div>
            )}

            {/* Extras already on the order (hangers, bags, ...) */}
            {order.extraCharges?.total > 0 && (
              <div className="flex justify-between items-center bg-purple-50 -mx-4 px-4 py-2 border-l-4 border-purple-500">
                <div>
                  <span className="text-purple-700 font-medium block">Extra Items:</span>
                  <span className="text-xs text-purple-600">
                    {(order.extraCharges.items || []).map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                  </span>
                </div>
                <span className="font-bold text-purple-700">+ {formatOrderAmount(order.extraCharges.total)}</span>
              </div>
            )}

            {/* Minimum order top-up */}
            {currentTopUp > 0 && (
              <div className="flex justify-between items-center bg-amber-50 -mx-4 px-4 py-2 border-l-4 border-amber-500">
                <div>
                  <span className="text-amber-700 font-medium block">Minimum order top-up:</span>
                  <span className="text-xs text-amber-600">Orders are charged at least {formatOrderAmount(pricing.minimumOrderAmount)}</span>
                </div>
                <span className="font-bold text-amber-700">+ {formatOrderAmount(currentTopUp)}</span>
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