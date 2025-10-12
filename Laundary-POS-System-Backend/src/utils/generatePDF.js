const PDFDocument = require('pdfkit');

const generateReceiptPDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text('Fold Fox Laundry', { align: 'center' });
      doc.fontSize(12).text('Receipt', { align: 'center' });
      doc.moveDown();

      // Order Info
      doc.text(`Order ID: ${order.orderId}`);
      doc.text(`Date: ${order.createdAt.toLocaleDateString()}`);
      doc.text(`Time: ${order.createdAt.toLocaleTimeString()}`);
      doc.moveDown();

      // Customer Info
      doc.text('Customer Details:', { underline: true });
      doc.text(`Name: ${order.customer.fullName}`);
      doc.text(`Phone: ${order.customer.phoneNumber}`);
      if (order.customer.campusId) {
        doc.text(`Campus ID: ${order.customer.campusId}`);
      }
      doc.moveDown();

      // Order Details
      doc.text('Order Details:', { underline: true });
      doc.text(`Weight: ${order.clothWeight} kg`);
      
      // Services
      doc.text('Services:');
      order.items.forEach(item => {
        const serviceName = item.service && item.service.name ? item.service.name : (() => {
          const found = Array.isArray(order.services) ? order.services.find(s => s._id.toString() === (item.service._id || item.service).toString()) : null;
          return found ? found.name : 'Service';
        })();
        doc.text(`  - ${serviceName}: ${item.quantity} x ${item.unitPrice} = ${item.totalPrice}`);
      });
      
      doc.moveDown();

      // Billing
      doc.text('Billing:', { underline: true });
      doc.text(`Subtotal: ${order.subtotal.toFixed(2)}`);
      
      if (order.discount.amount > 0) {
        doc.text(`Discount (${order.discount.type}): -${order.discount.amount.toFixed(2)}`);
      }
      
      if (order.tax > 0) {
        doc.text(`Tax: ${order.tax.toFixed(2)}`);
      }
      
      doc.fontSize(14).text(`Total: ${order.totalAmount.toFixed(2)}`, { underline: true });
      doc.fontSize(12);
      
      doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`);
      doc.text(`Order Status: ${order.orderStatus.toUpperCase()}`);
      
      if (order.estimatedCompletion) {
        doc.text(`Estimated Completion: ${order.estimatedCompletion.toLocaleDateString()} ${order.estimatedCompletion.toLocaleTimeString()}`);
      }

      doc.moveDown();
      doc.text('Thank you for choosing Fold Fox Laundry!', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateReceiptPDF
};
