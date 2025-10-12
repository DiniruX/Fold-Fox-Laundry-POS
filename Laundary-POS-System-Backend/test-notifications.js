/**
 * Test script for notification service
 * This script helps you verify your Email and SMS configuration
 * 
 * Usage:
 *   node test-notifications.js email test@example.com
 *   node test-notifications.js sms +94771234567
 *   node test-notifications.js both test@example.com +94771234567
 */

require('dotenv').config();
const { sendSMS, sendEmail, sendBankAccountDetails } = require('./src/services/notificationService');

const testEmail = async (emailAddress) => {
  console.log('\n📧 Testing Email Service...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Email Service: ${process.env.EMAIL_SERVICE || 'Not configured'}`);
  console.log(`Email User: ${process.env.EMAIL_USER || 'Not configured'}`);
  console.log(`Sending to: ${emailAddress}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const subject = 'Test Email - Laundry POS Notification Service';
  const text = `
Hello,

This is a test email from your Laundry POS System notification service.

If you received this email, your email configuration is working correctly!

Test Details:
- Service: ${process.env.EMAIL_SERVICE}
- Sent from: ${process.env.EMAIL_USER}
- Business: ${process.env.BUSINESS_NAME || 'Not configured'}

Best regards,
${process.env.BUSINESS_NAME || 'Your Laundry Business'}
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Test Email</h2>
      <p>Hello,</p>
      <p>This is a test email from your <strong>Laundry POS System</strong> notification service.</p>
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #047857;">
          ✅ If you received this email, your email configuration is working correctly!
        </p>
      </div>
      <h3 style="color: #4b5563;">Test Details:</h3>
      <ul style="color: #6b7280;">
        <li>Service: ${process.env.EMAIL_SERVICE}</li>
        <li>Sent from: ${process.env.EMAIL_USER}</li>
        <li>Business: ${process.env.BUSINESS_NAME || 'Not configured'}</li>
      </ul>
      <p>Best regards,<br>${process.env.BUSINESS_NAME || 'Your Laundry Business'}</p>
    </div>
  `;

  try {
    const result = await sendEmail(emailAddress, subject, text, html);
    
    if (result.success) {
      console.log('✅ SUCCESS! Email sent successfully');
      console.log(`📬 Message ID: ${result.messageId}`);
      console.log('\nPlease check the inbox (and spam folder) of:', emailAddress);
    } else {
      console.log('❌ FAILED! Could not send email');
      console.log('Error:', result.message);
      
      if (result.message.includes('not configured')) {
        console.log('\n💡 Tip: Make sure EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASSWORD are set in your .env file');
      }
    }
  } catch (error) {
    console.log('❌ ERROR!', error.message);
  }
  
  console.log('\n');
};

const testSMS = async (phoneNumber) => {
  console.log('\n📱 Testing SMS Service...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Twilio Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`Twilio Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER || 'Not configured'}`);
  console.log(`Sending to: ${phoneNumber}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const message = `Test SMS from ${process.env.BUSINESS_NAME || 'Laundry POS'}

This is a test message. If you received this, your SMS configuration is working!

Test Details:
From: ${process.env.TWILIO_PHONE_NUMBER}
Business: ${process.env.BUSINESS_NAME || 'Not configured'}`;

  try {
    const result = await sendSMS(phoneNumber, message);
    
    if (result.success) {
      console.log('✅ SUCCESS! SMS sent successfully');
      console.log(`📬 Message SID: ${result.messageId}`);
      console.log('\nPlease check the phone:', phoneNumber);
      console.log('\n💡 Note: Twilio trial accounts can only send to verified phone numbers');
    } else {
      console.log('❌ FAILED! Could not send SMS');
      console.log('Error:', result.message);
      
      if (result.message.includes('not configured')) {
        console.log('\n💡 Tip: Make sure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set in your .env file');
      } else if (result.message.includes('not a valid phone number')) {
        console.log('\n💡 Tip: Make sure the phone number is in international format (e.g., +94771234567)');
      } else if (result.message.includes('unverified number')) {
        console.log('\n💡 Tip: For Twilio trial accounts, you need to verify the recipient phone number first');
        console.log('   Visit: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      }
    }
  } catch (error) {
    console.log('❌ ERROR!', error.message);
  }
  
  console.log('\n');
};

const testBankDetails = async (email, phone) => {
  console.log('\n💳 Testing Bank Account Details Notification...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Email: ${email || 'Not provided'}`);
  console.log(`Phone: ${phone || 'Not provided'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const bankDetails = {
    bankName: process.env.BANK_NAME || 'Commercial Bank of Sri Lanka',
    accountName: process.env.BANK_ACCOUNT_NAME || 'Fast Laundry Services',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
    branch: process.env.BANK_BRANCH || 'Colombo Main Branch',
    swiftCode: process.env.BANK_SWIFT_CODE || 'CBCYLKLX'
  };

  try {
    const result = await sendBankAccountDetails({
      phoneNumber: phone,
      email: email,
      orderNumber: 'TEST-001',
      amount: 5000,
      bankDetails
    });
    
    if (result.success) {
      console.log('✅ SUCCESS! Bank details sent');
      console.log('📤 Sent via:', result.sentVia.join(', '));
      console.log('\nDetails:');
      if (result.results.sms.success) {
        console.log('  SMS: ✅ Sent (ID:', result.results.sms.messageId + ')');
      } else {
        console.log('  SMS: ❌', result.results.sms.message);
      }
      if (result.results.email.success) {
        console.log('  Email: ✅ Sent (ID:', result.results.email.messageId + ')');
      } else {
        console.log('  Email: ❌', result.results.email.message);
      }
    } else {
      console.log('❌ FAILED! Could not send bank details');
      console.log('Error:', result.message);
    }
  } catch (error) {
    console.log('❌ ERROR!', error.message);
  }
  
  console.log('\n');
};

const showUsage = () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║          Laundry POS - Notification Service Test                 ║
╚═══════════════════════════════════════════════════════════════════╝

This script helps you test your email and SMS configuration.

USAGE:
  node test-notifications.js email <email-address>
  node test-notifications.js sms <phone-number>
  node test-notifications.js both <email-address> <phone-number>
  node test-notifications.js bank <email-address> <phone-number>

EXAMPLES:
  node test-notifications.js email john@example.com
  node test-notifications.js sms +94771234567
  node test-notifications.js both john@example.com +94771234567
  node test-notifications.js bank john@example.com +94771234567

NOTES:
  - Phone numbers should be in international format (+94XXXXXXXXX)
  - Make sure your .env file is configured properly
  - Check NOTIFICATION_SERVICE_SETUP.md for configuration guide

CURRENT CONFIGURATION:
  Email Service: ${process.env.EMAIL_SERVICE || '❌ Not configured'}
  Email User: ${process.env.EMAIL_USER || '❌ Not configured'}
  Twilio SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Not configured'}
  Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER || '❌ Not configured'}
  Business Name: ${process.env.BUSINESS_NAME || '❌ Not configured'}
  Bank Name: ${process.env.BANK_NAME || '❌ Not configured'}

`);
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    showUsage();
    return;
  }

  console.log('\n🚀 Starting Notification Service Test...\n');

  switch (command.toLowerCase()) {
    case 'email':
      if (!args[1]) {
        console.log('❌ Error: Email address is required');
        console.log('Usage: node test-notifications.js email <email-address>');
        return;
      }
      await testEmail(args[1]);
      break;

    case 'sms':
      if (!args[1]) {
        console.log('❌ Error: Phone number is required');
        console.log('Usage: node test-notifications.js sms <phone-number>');
        return;
      }
      await testSMS(args[1]);
      break;

    case 'both':
      if (!args[1] || !args[2]) {
        console.log('❌ Error: Both email and phone number are required');
        console.log('Usage: node test-notifications.js both <email-address> <phone-number>');
        return;
      }
      await testEmail(args[1]);
      await testSMS(args[2]);
      break;

    case 'bank':
      if (!args[1] || !args[2]) {
        console.log('❌ Error: Both email and phone number are required');
        console.log('Usage: node test-notifications.js bank <email-address> <phone-number>');
        return;
      }
      await testBankDetails(args[1], args[2]);
      break;

    case 'help':
    case '--help':
    case '-h':
      showUsage();
      break;

    default:
      console.log(`❌ Unknown command: ${command}`);
      showUsage();
  }

  console.log('✅ Test completed!\n');
};

main();

