const PDFDocument = require('pdfkit');
const { formatServiceNameWithCategory, getCategoryPriceType } = require('./helpers');

const generateReceiptPDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text(process.env.BUSINESS_NAME, { align: 'center' });
      doc.fontSize(12).text('Receipt', { align: 'center' });
      doc.moveDown();

      // Order Info
      doc.text(`Order Number: ${order.orderNumber || order._id}`);
      doc.text(`Date: ${order.createdAt ? order.createdAt.toLocaleDateString() : new Date().toLocaleDateString()}`);
      doc.text(`Time: ${order.createdAt ? order.createdAt.toLocaleTimeString() : new Date().toLocaleTimeString()}`);
      doc.moveDown();

      // Customer Info
      doc.text('Customer Details:', { underline: true });
      const customerName = order.customerInfo?.name || (order.customer?.fullName) || 'N/A';
      const customerPhone = order.customerInfo?.phone || (order.customer?.phoneNumber) || 'N/A';
      doc.text(`Name: ${customerName}`);
      doc.text(`Phone: ${customerPhone}`);
      if (order.customerInfo?.email || order.customer?.email) {
        doc.text(`Email: ${order.customerInfo?.email || order.customer?.email}`);
      }
      if (order.customer?.campusId) {
        doc.text(`Campus ID: ${order.customer.campusId}`);
      }
      doc.moveDown();
      
      // Services
      doc.text('Services:');
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const serviceName = item.serviceName || (item.service && item.service.name ? item.service.name : 'Service');
          const serviceDisplay = formatServiceNameWithCategory(serviceName, item.clothingCategory);
          const quantity = item.quantity || 0;
          const unitPrice = item.unitPrice || 0;
          const totalPrice = item.totalPrice || 0;
          const weight = item.weight || 0;
          const categoryPriceType = getCategoryPriceType(item.service, item.clothingCategory);
          
          if (categoryPriceType === 'per_kg') {
            doc.text(`  - ${serviceDisplay}: ${weight} kg x ${unitPrice.toFixed(2)}/kg = ${totalPrice.toFixed(2)}`);
          } else {
            doc.text(`  - ${serviceDisplay}: ${quantity} pcs x ${unitPrice.toFixed(2)}/pc = ${totalPrice.toFixed(2)}`);
          }
        });
      }
      
      doc.moveDown();

      // Billing
      doc.text('Billing:', { underline: true });
      doc.text(`Subtotal: ${order.subtotal.toFixed(2)}`);
      
      // Express Service Fee
      if (order.isExpressService && order.expressServiceFee > 0) {
        doc.text(`Express Service (1 Day): +${order.expressServiceFee.toFixed(2)}`);
      }
      
      // Extra Charges
      if (order.extraCharges && order.extraCharges.items && order.extraCharges.items.length > 0) {
        doc.text('Extra Items:');
        order.extraCharges.items.forEach(item => {
          doc.text(`  - ${item.name} (${item.quantity}x @ ${item.price.toFixed(2)}) = ${(item.quantity * item.price).toFixed(2)}`);
        });
        doc.text(`Extra Items Total: +${order.extraCharges.total.toFixed(2)}`);
      }
      
      // Pickup Charges
      if (order.pickupRequired) {
        const pickupDisplay = order.pickupCharges > 0 
          ? `+${order.pickupCharges.toFixed(2)}` 
          : 'FREE';
        doc.text(`Pickup: ${pickupDisplay}`);
      }
      
      // Delivery Charges
      if (order.deliveryRequired) {
        const distanceText = order.deliveryDistance > 0 ? ` (${order.deliveryDistance}km)` : '';
        const deliveryDisplay = order.deliveryCharges > 0 
          ? `+${order.deliveryCharges.toFixed(2)}` 
          : 'FREE';
        doc.text(`Delivery${distanceText}: ${deliveryDisplay}`);
      }
      
      // Discount - check both discount.amount and discountAmount
      const discountAmount = (order.discount && order.discount.amount > 0) ? order.discount.amount : (order.discountAmount || 0);
      if (discountAmount > 0) {
        const discountType = (order.discount && order.discount.type) ? order.discount.type : 'Discount';
        const discountDesc = (order.discount && order.discount.description) ? order.discount.description : '';
        if (discountDesc) {
          doc.text(`Discount (${discountDesc}): -${discountAmount.toFixed(2)}`);
        } else {
          doc.text(`Discount (${discountType}): -${discountAmount.toFixed(2)}`);
        }
      }
      
      if (order.taxAmount > 0) {
        doc.text(`Tax: +${order.taxAmount.toFixed(2)}`);
      }
      
      doc.fontSize(14).text(`Total: ${order.totalAmount.toFixed(2)}`, { underline: true });
      doc.fontSize(12);
      
      // Payment and Order Status
      const paidAmount = order.paidAmount || 0;
      const balanceAmount = order.balanceAmount || (order.totalAmount - paidAmount);
      doc.text(`Payment Status: ${paidAmount >= order.totalAmount ? 'PAID' : 'PARTIAL'}`);
      doc.text(`Order Status: ${(order.status || 'PENDING').toUpperCase()}`);
      if (paidAmount > 0) {
        doc.text(`Paid: ${paidAmount.toFixed(2)}`);
      }
      if (balanceAmount > 0) {
        doc.text(`Balance: ${balanceAmount.toFixed(2)}`);
      }
      
      if (order.estimatedCompletion || order.estimatedDeliveryDate) {
        const completionDate = order.estimatedCompletion || order.estimatedDeliveryDate;
        doc.text(`Estimated Completion: ${completionDate.toLocaleDateString()} ${completionDate.toLocaleTimeString()}`);
      }

      doc.moveDown();
      doc.text(`Thank you for choosing ${process.env.BUSINESS_NAME}!`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateReceiptPDF
};
