const nodemailer = require('nodemailer');

// ============================================================================
// CONFIGURATION & INITIALIZATION
// ============================================================================

// Initialize email transporter
let emailTransporter = null;
let emailConfigured = false;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  try {
    emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
      },
      // Production settings
      pool: true, // Use pooled connections
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    });
    emailConfigured = true;
    console.log('✅ Email service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error.message);
  }
} else {
  console.warn('⚠️  Email not configured - Email notifications will not be sent');
}

// ============================================================================
// CONNECTION VERIFICATION
// ============================================================================

/**
 * Verify email connection
 * @returns {Promise<boolean>}
 */
const verifyEmailConnection = async () => {
  if (!emailTransporter || !emailConfigured) {
    return false;
  }
  
  try {
    await emailTransporter.verify();
    console.log('✅ Email connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email connection failed:', error.message);
    return false;
  }
};

// Verify connections on startup (optional - comment out if causing issues)
if (process.env.NODE_ENV === 'production') {
  setTimeout(() => {
    verifyEmailConnection();
  }, 2000);
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Send email to customer
 * @param {string} email - Customer email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise<object>} - Result of email sending
 */
const sendEmail = async (email, subject, text, html = null) => {
  try {
    if (!emailTransporter || !emailConfigured) {
      console.warn('Email service not configured. Email not sent.');
      return {
        success: false,
        message: 'Email service not configured',
        method: 'email'
      };
    }

    if (!email || email.trim() === '') {
      return {
        success: false,
        message: 'Email address is required',
        method: 'email'
      };
    }

    const mailOptions = {
      from: `${process.env.BUSINESS_NAME || 'Fast Laundry Services'} <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: text,
      html: html || text.replace(/\n/g, '<br>')
    };

    const result = await emailTransporter.sendMail(mailOptions);

    console.log(`Email sent successfully to ${email}:`, result.messageId);

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
      method: 'email'
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: error.message || 'Failed to send email',
      method: 'email',
      error
    };
  }
};

/**
 * Send bank account details to customer via Email
 * @param {object} params - Parameters
 * @param {string} params.email - Customer email
 * @param {string} params.orderNumber - Order number
 * @param {number} params.amount - Amount to transfer
 * @param {object} params.bankDetails - Bank account details
 * @returns {Promise<object>} - Result of notification sending
 */
const sendBankAccountDetails = async ({ email, orderNumber, amount, bankDetails }) => {
  try {
    const businessName = process.env.BUSINESS_NAME || 'Fast Laundry Services';
    const currency = process.env.CURRENCY || 'LKR';

    // Email HTML content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .bank-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2563eb; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .label { font-weight: bold; color: #4b5563; }
    .value { color: #1f2937; }
    .amount { font-size: 24px; font-weight: bold; color: #2563eb; text-align: center; margin: 20px 0; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
    .important { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bank Transfer Details</h1>
      <p>${businessName}</p>
    </div>
    <div class="content">
      <p>Dear Customer,</p>
      <p>Thank you for choosing ${businessName}. Please transfer the payment to the following bank account:</p>
      
      <div class="bank-details">
        <h3 style="margin-top: 0; color: #2563eb;">Bank Account Information</h3>
        <div class="detail-row">
          <span class="label">Bank Name:</span>
          <span class="value">${bankDetails.bankName}</span>
        </div>
        <div class="detail-row">
          <span class="label">Account Name:</span>
          <span class="value">${bankDetails.accountName}</span>
        </div>
        <div class="detail-row">
          <span class="label">Account Number:</span>
          <span class="value">${bankDetails.accountNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Branch:</span>
          <span class="value">${bankDetails.branch}</span>
        </div>
        <div class="detail-row">
          <span class="label">SWIFT Code:</span>
          <span class="value">${bankDetails.swiftCode || 'N/A'}</span>
        </div>
      </div>

      <div class="amount">
        Amount to Transfer: ${currency} ${parseFloat(amount).toLocaleString('en-LK')}
      </div>

      <div class="important">
        <strong>⚠️ Important:</strong> Please use your order number <strong>${orderNumber}</strong> as the reference/remarks when making the transfer.
      </div>

      <p>After completing the transfer, please provide us with the transaction ID/reference number to confirm your payment.</p>

      <p>If you have any questions, please don't hesitate to contact us.</p>

      <p>Best regards,<br>${businessName}</p>
    </div>
    <div class="footer">
      ${process.env.BUSINESS_ADDRESS || ''}
      ${process.env.BUSINESS_PHONE ? `<br>Phone: ${process.env.BUSINESS_PHONE}` : ''}
      ${process.env.BUSINESS_EMAIL ? `<br>Email: ${process.env.BUSINESS_EMAIL}` : ''}
    </div>
  </div>
</body>
</html>
`;

    const emailText = `${businessName} - Bank Transfer Details

Dear Customer,

Thank you for choosing ${businessName}. Please transfer the payment to the following bank account:

Bank Account Information:
- Bank Name: ${bankDetails.bankName}
- Account Name: ${bankDetails.accountName}
- Account Number: ${bankDetails.accountNumber}
- Branch: ${bankDetails.branch}
- SWIFT Code: ${bankDetails.swiftCode || 'N/A'}

Amount to Transfer: ${currency} ${parseFloat(amount).toLocaleString('en-LK')}

IMPORTANT: Please use your order number ${orderNumber} as the reference/remarks when making the transfer.

After completing the transfer, please provide us with the transaction ID/reference number to confirm your payment.

If you have any questions, please don't hesitate to contact us.

Best regards,
${businessName}`;

    // Send email only
    if (!email || email.trim() === '') {
      return {
        success: false,
        message: 'No email provided',
        results: {
          email: { success: false, message: 'Email address required' }
        },
        sentVia: []
      };
    }

    const emailResult = await sendEmail(
      email, 
      `Bank Transfer Details - Order ${orderNumber}`, 
      emailText, 
      emailHtml
    );

    return {
      success: emailResult.success,
      message: emailResult.success 
        ? 'Bank details sent successfully via email' 
        : 'Failed to send bank details',
      results: {
        email: emailResult
      },
      sentVia: emailResult.success ? ['Email'] : []
    };
  } catch (error) {
    console.error('Error sending bank account details:', error);
    return {
      success: false,
      message: error.message || 'Failed to send bank account details',
      error
    };
  }
};

/**
 * Send pickup scheduled notification (Email 1 - Minimal info, no amounts)
 * @param {object} params - Parameters
 * @param {string} params.email - Customer email
 * @param {string} params.orderNumber - Order number
 * @param {string} params.customerName - Customer name
 * @param {object} params.pickupAddress - Pickup address
 * @returns {Promise<object>} - Result of notification sending
 */
const sendPickupScheduledEmail = async ({ email, orderNumber, customerName, pickupAddress }) => {
  try {
    const businessName = process.env.BUSINESS_NAME || 'Fast Laundry Services';

    // Format pickup address
    const addressStr = pickupAddress 
      ? `${pickupAddress.street || ''}, ${pickupAddress.city || ''}, ${pickupAddress.state || ''} ${pickupAddress.zipCode || ''}`.trim()
      : 'Your provided address';

    // Plain text email
    const emailText = `Dear ${customerName},

Thank you for choosing ${businessName}!

Your pickup has been scheduled and confirmed.

Order Number: ${orderNumber}
Status: Pickup Scheduled

📍 Pickup Address:
${addressStr}

⏰ Next Steps:
We will pick up your items and inspect them at our facility. You'll receive a detailed confirmation email with final quantities and pricing once we've received and verified your items.

If you have any questions, please don't hesitate to contact us.

Best regards,
${businessName}
${process.env.BUSINESS_PHONE ? 'Phone: ' + process.env.BUSINESS_PHONE : ''}
${process.env.BUSINESS_EMAIL ? 'Email: ' + process.env.BUSINESS_EMAIL : ''}`;

    // HTML email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .order-number { background-color: #f0f9ff; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 5px; font-size: 16px; }
    .info-box { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 5px; }
    .address-box { background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🚚 Pickup Scheduled!</h1>
      <p style="margin: 5px 0 0 0;">${businessName}</p>
    </div>
    <div class="content">
      <p>Dear ${customerName},</p>
      <p>Thank you for choosing ${businessName}!</p>
      
      <p>Your pickup has been scheduled and confirmed.</p>
      
      <div class="order-number">
        <strong>Order Number:</strong> <span style="font-size: 20px; color: #10b981;">${orderNumber}</span><br>
        <strong>Status:</strong> <span style="color: #059669;">Pickup Scheduled</span>
      </div>
      
      <div class="address-box">
        <strong>📍 Pickup Address:</strong><br>
        ${addressStr}
      </div>
      
      <div class="info-box">
        <strong>⏰ Next Steps:</strong><br>
        We will pick up your items and inspect them at our facility. You'll receive a detailed confirmation email with final quantities and pricing once we've received and verified your items.
      </div>
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      
      <p style="margin-top: 30px;">Best regards,<br><strong>${businessName}</strong></p>
    </div>
    <div class="footer">
      ${process.env.BUSINESS_ADDRESS || ''}
      ${process.env.BUSINESS_PHONE ? '<br>Phone: ' + process.env.BUSINESS_PHONE : ''}
      ${process.env.BUSINESS_EMAIL ? '<br>Email: ' + process.env.BUSINESS_EMAIL : ''}
    </div>
  </div>
</body>
</html>
`;

    if (!email || email.trim() === '') {
      return {
        success: false,
        message: 'No email provided'
      };
    }

    const emailResult = await sendEmail(
      email, 
      `Pickup Scheduled - Order ${orderNumber}`, 
      emailText,
      emailHtml
    );

    return {
      success: emailResult.success,
      email: emailResult,
      message: emailResult.success ? 'Pickup scheduled email sent' : 'Failed to send pickup notification'
    };
  } catch (error) {
    console.error('Error sending pickup scheduled email:', error);
    return {
      success: false,
      message: error.message || 'Failed to send pickup scheduled email'
    };
  }
};

/**
 * Send order confirmation notification (Email 2 - Full details with actual amounts)
 * @param {object} params - Parameters
 * @param {string} params.email - Customer email
 * @param {string} params.orderNumber - Order number
 * @param {string} params.customerName - Customer name
 * @param {number} params.totalAmount - Total order amount
 * @param {object} params.orderDetails - Order details (optional)
 * @returns {Promise<object>} - Result of notification sending
 */
const sendOrderConfirmation = async ({ email, orderNumber, customerName, totalAmount, orderDetails }) => {
  try {
    const businessName = process.env.BUSINESS_NAME || 'Fast Laundry Services';
    const currency = process.env.CURRENCY || 'LKR';

    // Build items list if order details provided
    let itemsList = '';
    let itemsHtml = '';
    
    if (orderDetails && orderDetails.items && orderDetails.items.length > 0) {
      // Plain text version
      itemsList = '\n\nOrder Items:\n' + orderDetails.items.map((item, index) => {
        const qty = item.quantity > 0 ? `${item.quantity} piece(s)` : '';
        const weight = item.weight > 0 ? `${item.weight} kg` : '';
        const qtyOrWeight = qty || weight;
        return `${index + 1}. ${item.serviceName} - ${qtyOrWeight} - ${currency} ${parseFloat(item.totalPrice).toLocaleString('en-LK')}`;
      }).join('\n');

      // HTML version
      itemsHtml = `
        <div style="margin: 20px 0;">
          <h3 style="color: #2563eb; margin-bottom: 10px;">Order Items:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Service</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Quantity</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${orderDetails.items.map(item => {
                const qty = item.quantity > 0 ? `${item.quantity} piece(s)` : '';
                const weight = item.weight > 0 ? `${item.weight} kg` : '';
                const qtyOrWeight = qty || weight;
                return `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.serviceName}</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${qtyOrWeight}</td>
                    <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${currency} ${parseFloat(item.totalPrice).toLocaleString('en-LK')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Build summary if order details provided
    let summaryText = '';
    let summaryHtml = '';
    
    if (orderDetails) {
      const discount = orderDetails.discountAmount || 0;
      const tax = orderDetails.taxAmount || 0;
      const subtotal = orderDetails.subtotal || totalAmount;

      if (discount > 0 || tax > 0) {
        summaryText = `\n\nOrder Summary:\nSubtotal: ${currency} ${parseFloat(subtotal).toLocaleString('en-LK')}`;
        if (discount > 0) summaryText += `\nDiscount: -${currency} ${parseFloat(discount).toLocaleString('en-LK')}`;
        if (tax > 0) summaryText += `\nTax: ${currency} ${parseFloat(tax).toLocaleString('en-LK')}`;
        summaryText += `\nTotal Amount: ${currency} ${parseFloat(totalAmount).toLocaleString('en-LK')}`;

        summaryHtml = `
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">Order Summary:</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px 0;">Subtotal:</td>
                <td style="text-align: right; padding: 5px 0;">${currency} ${parseFloat(subtotal).toLocaleString('en-LK')}</td>
              </tr>
              ${discount > 0 ? `
              <tr>
                <td style="padding: 5px 0; color: #059669;">Discount:</td>
                <td style="text-align: right; padding: 5px 0; color: #059669;">-${currency} ${parseFloat(discount).toLocaleString('en-LK')}</td>
              </tr>` : ''}
              ${tax > 0 ? `
              <tr>
                <td style="padding: 5px 0;">Tax:</td>
                <td style="text-align: right; padding: 5px 0;">${currency} ${parseFloat(tax).toLocaleString('en-LK')}</td>
              </tr>` : ''}
              <tr style="border-top: 2px solid #2563eb; font-weight: bold; font-size: 18px;">
                <td style="padding: 10px 0;">Total Amount:</td>
                <td style="text-align: right; padding: 10px 0; color: #2563eb;">${currency} ${parseFloat(totalAmount).toLocaleString('en-LK')}</td>
              </tr>
            </table>
          </div>
        `;
      }
    }

    // Additional info
    let additionalInfo = '';
    let additionalInfoHtml = '';
    
    if (orderDetails) {
      if (orderDetails.pickupRequired) {
        additionalInfo += '\n\n✓ Pickup service requested';
        additionalInfoHtml += '<p style="color: #2563eb;">✓ Pickup service requested</p>';
      }
      if (orderDetails.deliveryRequired) {
        additionalInfo += '\n✓ Delivery service requested';
        additionalInfoHtml += '<p style="color: #2563eb;">✓ Delivery service requested</p>';
      }
      if (orderDetails.estimatedTime) {
        additionalInfo += `\n\nEstimated completion: ${orderDetails.estimatedTime} hours`;
        additionalInfoHtml += `<p style="background-color: #fef3c7; padding: 10px; border-radius: 5px; margin: 15px 0;"><strong>⏱️ Estimated completion:</strong> ${orderDetails.estimatedTime} hours</p>`;
      }
    }

    // Plain text email
    const emailText = `Dear ${customerName},

Thank you for your order! Your order has been confirmed and we're processing it now.

Order Number: ${orderNumber}${itemsList}${summaryText || '\n\nTotal Amount: ' + currency + ' ' + parseFloat(totalAmount).toLocaleString('en-LK')}${additionalInfo}

We will notify you once your order is ready for pickup/delivery.

Thank you for choosing ${businessName}!

Best regards,
${businessName}
${process.env.BUSINESS_PHONE ? '\nPhone: ' + process.env.BUSINESS_PHONE : ''}
${process.env.BUSINESS_EMAIL ? '\nEmail: ' + process.env.BUSINESS_EMAIL : ''}`;

    // HTML email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .order-number { background-color: #f0f9ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 5px; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Order Confirmed!</h1>
      <p style="margin: 5px 0 0 0;">${businessName}</p>
    </div>
    <div class="content">
      <p>Dear ${customerName},</p>
      <p>Thank you for your order! Your order has been confirmed and we're processing it now.</p>
      
      <div class="order-number">
        <strong>Order Number:</strong> <span style="font-size: 18px; color: #2563eb;">${orderNumber}</span>
      </div>
      
      ${itemsHtml}
      ${summaryHtml || `<div style="font-size: 20px; font-weight: bold; color: #2563eb; text-align: center; margin: 20px 0;">Total Amount: ${currency} ${parseFloat(totalAmount).toLocaleString('en-LK')}</div>`}
      ${additionalInfoHtml}
      
      <p style="margin-top: 30px;">We will notify you once your order is ready for pickup/delivery.</p>
      
      <p>Thank you for choosing ${businessName}!</p>
      
      <p style="margin-top: 30px;">Best regards,<br><strong>${businessName}</strong></p>
    </div>
    <div class="footer">
      ${process.env.BUSINESS_ADDRESS || ''}
      ${process.env.BUSINESS_PHONE ? '<br>Phone: ' + process.env.BUSINESS_PHONE : ''}
      ${process.env.BUSINESS_EMAIL ? '<br>Email: ' + process.env.BUSINESS_EMAIL : ''}
    </div>
  </div>
</body>
</html>
`;

    if (!email || email.trim() === '') {
      return {
        success: false,
        message: 'No email provided'
      };
    }

    const emailResult = await sendEmail(
      email, 
      `Order Confirmation - ${orderNumber}`, 
      emailText,
      emailHtml
    );

    return {
      success: emailResult.success,
      email: emailResult,
      message: emailResult.success ? 'Order confirmation sent' : 'Failed to send confirmation'
    };
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return {
      success: false,
      message: error.message || 'Failed to send order confirmation'
    };
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Send functions
  sendEmail,
  sendBankAccountDetails,
  sendOrderConfirmation,
  sendPickupScheduledEmail,
  
  // Verification functions
  verifyEmailConnection,
  
  // Status check
  getNotificationStatus: () => ({
    email: emailConfigured
  })
};

