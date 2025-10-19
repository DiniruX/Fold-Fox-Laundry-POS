// Payment service for handling payment-related operations
import { ordersAPI } from './api';
import toast from 'react-hot-toast';

/**
 * Send bank account details to customer via Email
 * @param {string} orderId - Order ID
 * @param {number} amount - Amount to transfer
 * @returns {Promise} - API response
 */
export const sendBankAccountDetails = async (orderId, amount) => {
  try {
    const response = await ordersAPI.sendBankDetails(orderId, { amount });
    
    if (response.data.success) {
      const sentVia = response.data.data?.sentVia || [];
      const isWarning = response.data.warning;
      
      if (isWarning) {
        // Email service not configured - show warning but allow continuation
        toast(
          response.data.message || 
          'Email service not configured. Please inform customer manually.',
          { 
            duration: 5000,
            icon: '⚠️',
            style: {
              background: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FCD34D'
            }
          }
        );
      } else {
        // Successfully sent via email
        toast.success('Bank details sent successfully via Email!');
      }
      
      return {
        success: true,
        warning: isWarning,
        message: response.data.message,
        sentVia: sentVia,
        details: response.data.data?.details,
        bankDetails: response.data.data?.bankDetails
      };
    } else {
      toast.error(response.data.message || 'Failed to send bank details');
      return {
        success: false,
        message: response.data.message
      };
    }
  } catch (error) {
    console.error('Error sending bank details:', error);
    const errorMessage = error.response?.data?.message || 'Failed to send bank account details via email';
    toast.error(errorMessage);
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

export const validateTransactionId = (transactionId) => {
  // Basic validation for transaction ID
  if (!transactionId || transactionId.trim().length < 3) {
    return {
      valid: false,
      message: 'Transaction ID must be at least 3 characters long'
    };
  }

  // Check for common invalid patterns
  const invalidPatterns = [
    /^[0-9]+$/, // Only numbers
    /^[a-zA-Z]+$/, // Only letters
    /^[^a-zA-Z0-9]+$/ // Only special characters
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(transactionId)) {
      return {
        valid: false,
        message: 'Transaction ID should contain both letters and numbers'
      };
    }
  }

  return {
    valid: true,
    message: 'Transaction ID is valid'
  };
};

export const getBankAccountDetails = () => {
  // This could be fetched from a configuration service or database
  return {
    bankName: import.meta.env.VITE_BANK_NAME,
    accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || import.meta.env.VITE_BUSINESS_NAME,
    accountNumber: import.meta.env.VITE_BANK_ACCOUNT_NUMBER,
    branch: import.meta.env.VITE_BANK_BRANCH,
    swiftCode: import.meta.env.VITE_BANK_SWIFT_CODE,
    instructions: "Please include your order number as reference when making the transfer."
  };
};
