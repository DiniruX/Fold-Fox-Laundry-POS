#!/usr/bin/env node

/**
 * Notification Service Configuration Verification Script
 * 
 * This script verifies that your Email and SMS services are properly configured
 * Run this before deploying to production to ensure everything works.
 * 
 * Usage:
 *   node verify-notifications.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.cyan}═══ ${msg} ═══${colors.reset}\n`)
};

// Track results
const results = {
  email: false,
  sms: false,
  config: {
    email: false,
    sms: false,
    bank: false,
    business: false
  }
};

// ============================================================================
// CONFIGURATION CHECKS
// ============================================================================

async function checkEmailConfig() {
  log.section('EMAIL CONFIGURATION');
  
  const checks = {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : undefined
  };
  
  console.log('📧 Email Settings:');
  console.log(`   Service: ${checks.service || '❌ NOT SET'}`);
  console.log(`   User: ${checks.user || '❌ NOT SET'}`);
  console.log(`   Password: ${checks.password || '❌ NOT SET'}`);
  
  if (!checks.user || !checks.password) {
    log.error('Email not configured - EMAIL_USER and EMAIL_PASSWORD required');
    log.info('Setup instructions: See PRODUCTION_EMAIL_SMS_SETUP_GUIDE.md');
    return false;
  }
  
  log.success('Email configuration found');
  results.config.email = true;
  return true;
}

async function checkSMSConfig() {
  log.section('SMS CONFIGURATION');
  
  const checks = {
    sid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_AUTH_TOKEN ? '***' + process.env.TWILIO_AUTH_TOKEN.slice(-4) : undefined,
    phone: process.env.TWILIO_PHONE_NUMBER
  };
  
  console.log('📱 Twilio Settings:');
  console.log(`   Account SID: ${checks.sid ? checks.sid.substring(0, 10) + '...' : '❌ NOT SET'}`);
  console.log(`   Auth Token: ${checks.token || '❌ NOT SET'}`);
  console.log(`   Phone Number: ${checks.phone || '❌ NOT SET'}`);
  
  if (!checks.sid || !checks.token || !checks.phone) {
    log.warning('SMS not configured (OPTIONAL) - Twilio credentials not found');
    log.info('To enable SMS: See PRODUCTION_EMAIL_SMS_SETUP_GUIDE.md');
    return false;
  }
  
  log.success('SMS configuration found');
  results.config.sms = true;
  return true;
}

async function checkBankConfig() {
  log.section('BANK DETAILS CONFIGURATION');
  
  const checks = {
    name: process.env.BANK_NAME,
    accountName: process.env.BANK_ACCOUNT_NAME,
    accountNumber: process.env.BANK_ACCOUNT_NUMBER,
    branch: process.env.BANK_BRANCH,
    swift: process.env.BANK_SWIFT_CODE
  };
  
  console.log('🏦 Bank Information:');
  console.log(`   Bank Name: ${checks.name || '❌ NOT SET'}`);
  console.log(`   Account Name: ${checks.accountName || '❌ NOT SET'}`);
  console.log(`   Account Number: ${checks.accountNumber || '❌ NOT SET'}`);
  console.log(`   Branch: ${checks.branch || '❌ NOT SET'}`);
  console.log(`   SWIFT Code: ${checks.swift || '❌ NOT SET'}`);
  
  if (!checks.name || !checks.accountName || !checks.accountNumber) {
    log.error('Bank details not configured - Required for bank transfer payments');
    log.info('Update these in .env file');
    return false;
  }
  
  log.success('Bank details configured');
  results.config.bank = true;
  return true;
}

async function checkBusinessConfig() {
  log.section('BUSINESS INFORMATION');
  
  const checks = {
    name: process.env.BUSINESS_NAME,
    address: process.env.BUSINESS_ADDRESS,
    phone: process.env.BUSINESS_PHONE,
    email: process.env.BUSINESS_EMAIL,
    currency: process.env.CURRENCY
  };
  
  console.log('🏢 Business Details:');
  console.log(`   Name: ${checks.name || '❌ NOT SET'}`);
  console.log(`   Address: ${checks.address || '❌ NOT SET'}`);
  console.log(`   Phone: ${checks.phone || '❌ NOT SET'}`);
  console.log(`   Email: ${checks.email || '❌ NOT SET'}`);
  console.log(`   Currency: ${checks.currency || '❌ NOT SET'}`);
  
  if (!checks.name || !checks.address) {
    log.warning('Business information incomplete - Will use defaults');
    return false;
  }
  
  log.success('Business information configured');
  results.config.business = true;
  return true;
}

// ============================================================================
// CONNECTION TESTS
// ============================================================================

async function testEmailConnection() {
  log.section('EMAIL CONNECTION TEST');
  
  if (!results.config.email) {
    log.error('Skipping email test - Configuration missing');
    return false;
  }
  
  try {
    log.info('Creating email transporter...');
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    log.info('Verifying email connection...');
    await transporter.verify();
    
    log.success('Email connection successful!');
    log.info(`Ready to send emails from: ${process.env.EMAIL_USER}`);
    results.email = true;
    return true;
  } catch (error) {
    log.error(`Email connection failed: ${error.message}`);
    
    if (error.message.includes('Invalid login')) {
      log.error('Authentication failed - Check your credentials');
      log.info('Common issues:');
      log.info('  1. Using regular password instead of App Password');
      log.info('  2. 2-Factor Authentication not enabled');
      log.info('  3. App Password not generated correctly');
      log.info('');
      log.info('Fix: See "Gmail Setup" in PRODUCTION_EMAIL_SMS_SETUP_GUIDE.md');
    }
    
    return false;
  }
}

async function testSMSConnection() {
  log.section('SMS CONNECTION TEST');
  
  if (!results.config.sms) {
    log.warning('Skipping SMS test - Configuration missing (optional)');
    return false;
  }
  
  try {
    log.info('Creating Twilio client...');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    log.info('Verifying Twilio connection...');
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    log.success('Twilio connection successful!');
    log.info(`Account: ${account.friendlyName}`);
    log.info(`Status: ${account.status}`);
    log.info(`Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);
    
    if (account.status === 'active') {
      log.success('Account is active - Ready to send SMS');
      results.sms = true;
    } else {
      log.warning(`Account status: ${account.status} - May not be able to send SMS`);
    }
    
    return true;
  } catch (error) {
    log.error(`Twilio connection failed: ${error.message}`);
    
    if (error.message.includes('authenticate')) {
      log.error('Authentication failed - Check your credentials');
      log.info('Common issues:');
      log.info('  1. Incorrect Account SID or Auth Token');
      log.info('  2. Extra spaces in credentials');
      log.info('  3. Using expired or regenerated credentials');
      log.info('');
      log.info('Fix: Copy credentials from https://console.twilio.com');
    }
    
    return false;
  }
}

// ============================================================================
// PRODUCTION READINESS CHECK
// ============================================================================

function checkProductionReadiness() {
  log.section('PRODUCTION READINESS CHECK');
  
  const checks = [
    {
      name: 'Email Service',
      status: results.email,
      required: true,
      impact: 'Cannot send bank details or notifications to customers'
    },
    {
      name: 'SMS Service',
      status: results.sms,
      required: false,
      impact: 'No SMS notifications (email only)'
    },
    {
      name: 'Bank Details',
      status: results.config.bank,
      required: true,
      impact: 'Cannot send bank transfer payment details'
    },
    {
      name: 'Business Info',
      status: results.config.business,
      required: false,
      impact: 'Generic branding in notifications'
    }
  ];
  
  console.log('Production Requirements:\n');
  
  let allRequired = true;
  checks.forEach(check => {
    const icon = check.status ? '✓' : '✗';
    const color = check.status ? colors.green : (check.required ? colors.red : colors.yellow);
    const req = check.required ? '(REQUIRED)' : '(OPTIONAL)';
    
    console.log(`  ${color}${icon}${colors.reset} ${check.name} ${req}`);
    if (!check.status) {
      console.log(`     Impact: ${check.impact}`);
    }
    
    if (check.required && !check.status) {
      allRequired = false;
    }
  });
  
  console.log('');
  
  if (allRequired) {
    log.success('All required services configured - Ready for production! 🚀');
    return true;
  } else {
    log.error('Some required services are not configured');
    log.error('Please fix the issues above before deploying to production');
    return false;
  }
}

// ============================================================================
// SUMMARY AND NEXT STEPS
// ============================================================================

function printSummary() {
  log.section('SUMMARY');
  
  console.log('Configuration Status:');
  console.log(`  Email: ${results.email ? '✓ Working' : '✗ Not Working'}`);
  console.log(`  SMS: ${results.sms ? '✓ Working' : results.config.sms ? '✗ Not Working' : '- Not Configured'}`);
  console.log(`  Bank Details: ${results.config.bank ? '✓ Configured' : '✗ Missing'}`);
  console.log(`  Business Info: ${results.config.business ? '✓ Configured' : '- Incomplete'}`);
  
  console.log('\nNext Steps:');
  
  if (!results.email) {
    console.log(`  ${colors.red}1. Fix email configuration${colors.reset}`);
    console.log('     See: PRODUCTION_EMAIL_SMS_SETUP_GUIDE.md');
  }
  
  if (!results.config.bank) {
    console.log(`  ${colors.red}2. Configure bank details in .env${colors.reset}`);
  }
  
  if (!results.sms && results.config.sms) {
    console.log(`  ${colors.yellow}3. Fix Twilio SMS configuration (optional)${colors.reset}`);
  } else if (!results.config.sms) {
    console.log(`  ${colors.yellow}3. Configure Twilio for SMS (optional)${colors.reset}`);
  }
  
  if (results.email && results.config.bank) {
    console.log(`\n  ${colors.green}Ready to test:${colors.reset}`);
    console.log(`     node test-notifications.js email your@email.com`);
    if (results.sms) {
      console.log(`     node test-notifications.js sms +94771234567`);
      console.log(`     node test-notifications.js both your@email.com +94771234567`);
    }
  }
  
  console.log('\nDocumentation:');
  console.log('  - Setup Guide: PRODUCTION_EMAIL_SMS_SETUP_GUIDE.md');
  console.log('  - Quick Start: QUICK_START_BANK_NOTIFICATIONS.md');
  console.log('  - Troubleshooting: See setup guide section 6');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(`
${colors.bright}${colors.magenta}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🔍 NOTIFICATION SERVICE CONFIGURATION VERIFICATION          ║
║                                                               ║
║   Laundry POS System - Production Readiness Check            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
`);
  
  log.info('Checking environment: ' + (process.env.NODE_ENV || 'development'));
  log.info('Starting verification...\n');
  
  // Configuration checks
  await checkEmailConfig();
  await checkSMSConfig();
  await checkBankConfig();
  await checkBusinessConfig();
  
  // Connection tests
  await testEmailConnection();
  await testSMSConnection();
  
  // Production readiness
  const ready = checkProductionReadiness();
  
  // Summary
  printSummary();
  
  // Exit with appropriate code
  process.exit(ready ? 0 : 1);
}

// Run the verification
main().catch(error => {
  log.error(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

