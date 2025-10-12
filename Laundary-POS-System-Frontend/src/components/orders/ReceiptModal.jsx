import React, { useRef } from 'react';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { formatOrderNumber, formatOrderDate, formatOrderAmount, getOrderStatusLabel } from '../../services/orderService';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const ReceiptModal = ({ isOpen, onClose, order }) => {
  const receiptRef = useRef(null);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt" size="md">
      <div className="space-y-6">
        {/* Receipt Content */}
        <div ref={receiptRef} className="bg-white p-6 border border-gray-200 rounded-lg">
          {/* Header */}
          <div className="header">
            <div className="business-name">Fold Fox Laundry</div>
            <div className="business-address">
              123 Main Street, Colombo 01<br />
              Sri Lanka<br />
              Phone: +94 11 234 5678<br />
              Email: info@foldfoxlaundry.com
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
            <div className="total-row">
              <span>Order Type:</span>
              <span>{order.orderType?.charAt(0).toUpperCase() + order.orderType?.slice(1)}</span>
            </div>
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

          {/* Totals */}
          <div className="totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{formatOrderAmount(order.subtotal)}</span>
            </div>
            {order.taxAmount > 0 && (
              <div className="total-row">
                <span>Tax:</span>
                <span>{formatOrderAmount(order.taxAmount)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="total-row">
                <span>{order.customer?.isStudent ? 'Student Discount (10%):' : 'Discount:'}</span>
                <span>-{formatOrderAmount(order.discountAmount)}</span>
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
              <span>{formatOrderAmount(order.balanceAmount)}</span>
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
            <div>Thank you for choosing Fold Fox Laundry!</div>
            <div>Please keep this receipt for your records.</div>
            <div>For inquiries, call +94 11 234 5678</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 no-print">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} className="flex items-center">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
