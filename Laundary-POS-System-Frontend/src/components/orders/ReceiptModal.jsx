import React, { useRef, useState } from 'react';
import { PrinterIcon, EnvelopeIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { formatOrderNumber, formatOrderDate, formatOrderAmount, getOrderStatusLabel } from '../../services/orderService';
import { ordersAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const ReceiptModal = ({ isOpen, onClose, order }) => {
  const receiptRef = useRef(null);
  const [isSending, setIsSending] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${formatOrderNumber(order.orderNumber)}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                font-size: 12px;
                line-height: 1.4;
              }
              .header { text-align: center; margin-bottom: 20px; }
              .business-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
              .business-address { font-size: 11px; color: #666; }
              .receipt-info { margin-bottom: 15px; }
              .customer-info { margin-bottom: 15px; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
              .items-table th, .items-table td { 
                border-bottom: 1px solid #ddd; 
                padding: 5px; 
                text-align: left; 
              }
              .items-table th { background-color: #f5f5f5; font-weight: bold; }
              .totals { margin-top: 15px; }
              .total-row { 
                display: flex; 
                justify-content: space-between; 
                margin: 5px 0; 
              }
              .final-total { 
                font-weight: bold; 
                font-size: 14px; 
                border-top: 2px solid #333; 
                padding-top: 5px; 
              }
              .footer { 
                text-align: center; 
                margin-top: 20px; 
                font-size: 10px; 
                color: #666; 
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${receiptRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendEmail = async () => {
    // Check both customer.email and customerInfo.email
    const customerEmail = order.customer?.email || order.customerInfo?.email;
    
    if (!customerEmail || customerEmail.trim() === '') {
      toast.error('Customer email not available');
      return;
    }

    try {
      setIsSending(true);
      const response = await ordersAPI.sendReceipt(order._id, {
        email: customerEmail
      });
      
      if (response.data.success) {
        toast.success(`Receipt sent to ${customerEmail}`);
      } else {
        toast.error(response.data.message || 'Failed to send receipt');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send receipt');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyReceipt = () => {
    if (!receiptRef.current) return;

    // Get the receipt text content
    const receiptText = receiptRef.current.innerText;
    
    // Copy to clipboard
    navigator.clipboard.writeText(receiptText)
      .then(() => {
        toast.success('Receipt copied to clipboard! You can now paste it anywhere.');
      })
      .catch(() => {
        toast.error('Failed to copy receipt');
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt" size="lg">
      <div className="space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
        {/* Receipt Content */}
        <div ref={receiptRef} className="bg-white p-6 border border-gray-200 rounded-lg">
          {/* Header */}
          <div className="header">
            <div className="business-name">{import.meta.env.VITE_BUSINESS_NAME}</div>
            <div className="business-address">
              {import.meta.env.VITE_BUSINESS_ADDRESS}<br />
              Phone: {import.meta.env.VITE_BUSINESS_PHONE}<br />
              Email: {import.meta.env.VITE_BUSINESS_EMAIL}
            </div>
          </div>

          {/* Receipt Info */}
          <div className="receipt-info">
            <div className="total-row">
              <span>Receipt No:</span>
              <span>{formatOrderNumber(order.orderNumber)}</span>
            </div>
            <div className="total-row">
              <span>Date:</span>
              <span>{formatOrderDate(order.createdAt)}</span>
            </div>
            <div className="total-row">
              <span>Status:</span>
              <span>{getOrderStatusLabel(order.status)}</span>
            </div>
            {order.isExpressService && (
              <div className="total-row" style={{ color: '#f97316', fontWeight: 'bold' }}>
                <span>⚡ Express Service:</span>
                <span>1-Day Service</span>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="customer-info">
            <div className="total-row">
              <span><strong>Customer:</strong></span>
              <span><strong>{order.customerInfo?.name || 'N/A'}</strong></span>
            </div>
            <div className="total-row">
              <span>Phone:</span>
              <span>{order.customerInfo?.phone || 'N/A'}</span>
            </div>
            {order.customerInfo?.email && (
              <div className="total-row">
                <span>Email:</span>
                <span>{order.customerInfo.email}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <table className="items-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Qty/Wt</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div>{item.serviceName}</div>
                    {item.notes && (
                      <div style={{ fontSize: '10px', color: '#666' }}>{item.notes}</div>
                    )}
                  </td>
                  <td>
                    {item.weight > 0 ? `${item.weight} kg` : `${item.quantity} pcs`}
                  </td>
                  <td>{formatOrderAmount(item.unitPrice)}</td>
                  <td>{formatOrderAmount(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals with Enhanced Discount Display */}
          <div className="totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{formatOrderAmount(order.subtotal)}</span>
            </div>
            {order.isExpressService && order.expressServiceFee > 0 && (
              <div className="total-row" style={{ color: '#3b82f6' }}>
                <span>Express Service (1 Day):</span>
                <span>+{formatOrderAmount(order.expressServiceFee)}</span>
              </div>
            )}
            {order.extraCharges && order.extraCharges.items && order.extraCharges.items.length > 0 && (
              <div style={{ marginTop: '10px', marginBottom: '10px', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#7c3aed' }}>Extra Items:</div>
                {order.extraCharges.items.map((item, idx) => (
                  <div key={idx} className="total-row" style={{ fontSize: '11px', color: '#6b7280' }}>
                    <span>  • {item.name} ({item.quantity}x @ {formatOrderAmount(item.price)})</span>
                    <span>{formatOrderAmount(item.quantity * item.price)}</span>
                  </div>
                ))}
                <div className="total-row" style={{ color: '#7c3aed', fontWeight: 'bold', marginTop: '5px' }}>
                  <span>Extra Items Total:</span>
                  <span>+{formatOrderAmount(order.extraCharges.total)}</span>
                </div>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="total-row">
                <span>Tax:</span>
                <span>{formatOrderAmount(order.taxAmount)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="total-row" style={{ backgroundColor: '#f0fdf4', padding: '5px', margin: '5px 0', borderLeft: '3px solid #22c55e' }}>
                <span style={{ fontWeight: 'bold', color: '#15803d' }}>
                  {order.discount && order.discount.description 
                    ? `${order.discount.description}:`
                    : order.discount && order.discount.percentage 
                    ? `Discount (${order.discount.percentage}%):`
                    : 'Discount:'}
                  {order.discount && order.discount.type === 'campaign' && (
                    <span style={{ fontSize: '10px', backgroundColor: '#fe7f2d', color: 'white', padding: '2px 6px', borderRadius: '3px', marginLeft: '5px' }}>
                      CAMPAIGN
                    </span>
                  )}
                  {order.discount && order.discount.type === 'student' && (
                    <span style={{ fontSize: '10px', backgroundColor: '#2563eb', color: 'white', padding: '2px 6px', borderRadius: '3px', marginLeft: '5px' }}>
                      STUDENT
                    </span>
                  )}
                </span>
                <span style={{ fontWeight: 'bold', color: '#15803d' }}>
                  -{formatOrderAmount(order.discountAmount)}
                </span>
              </div>
            )}
            {order.discount && order.discount.code && (
              <div className="total-row" style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                <span>Discount Code: {order.discount.code}</span>
                <span>{order.discount.isFirstOrderDiscount ? '(First Order Special)' : ''}</span>
              </div>
            )}
            <div className="total-row final-total">
              <span>Total:</span>
              <span>{formatOrderAmount(order.totalAmount)}</span>
            </div>
            <div className="total-row">
              <span>Paid:</span>
              <span>{formatOrderAmount(order.paidAmount)}</span>
            </div>
            <div className="total-row">
              <span>Balance:</span>
              <span style={{ color: order.balanceAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                {formatOrderAmount(order.balanceAmount)}
              </span>
            </div>
          </div>

          {/* Payment Info */}
          {order.payments && order.payments.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Payment History:</div>
              {order.payments.map((payment, index) => (
                <div key={index} className="total-row">
                  <span>
                    {payment.method?.charAt(0).toUpperCase() + payment.method?.slice(1)} 
                    ({formatOrderDate(payment.createdAt)})
                  </span>
                  <span>{formatOrderAmount(payment.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Dates */}
          <div style={{ marginTop: '15px' }}>
            <div className="total-row">
              <span>Pickup Date:</span>
              <span>{formatOrderDate(order.pickupDate)}</span>
            </div>
            {order.deliveryDate && (
              <div className="total-row">
                <span>Delivery Date:</span>
                <span>{formatOrderDate(order.deliveryDate)}</span>
              </div>
            )}
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Special Instructions:</div>
              <div style={{ fontSize: '11px' }}>{order.specialInstructions}</div>
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <div>Thank you for choosing {import.meta.env.VITE_BUSINESS_NAME}!</div>
            <div>Please keep this receipt for your records.</div>
            <div>For inquiries, call {import.meta.env.VITE_BUSINESS_PHONE}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center no-print">
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleCopyReceipt}
              className="flex items-center"
            >
              <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
              Copy Receipt
            </Button>
            {(order.customer?.email || order.customerInfo?.email) && (
              <Button 
                variant="outline" 
                onClick={handleSendEmail}
                disabled={isSending}
                className="flex items-center"
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send to Email'}
              </Button>
            )}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handlePrint} className="flex items-center">
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
