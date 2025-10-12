#!/usr/bin/env node

/**
 * Quick .env Configuration Checker
 * Run this to verify your .env file is set up correctly
 */

require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║       🔍 .env Configuration Check                        ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

const checks = {
  email: {
    name: 'Email Service',
    vars: {
      'EMAIL_SERVICE': process.env.EMAIL_SERVICE,
      'EMAIL_USER': process.env.EMAIL_USER,
      'EMAIL_PASSWORD': process.env.EMAIL_PASSWORD
    },
    required: true
  },
  bank: {
    name: 'Bank Details',
    vars: {
      'BANK_NAME': process.env.BANK_NAME,
      'BANK_ACCOUNT_NUMBER': process.env.BANK_ACCOUNT_NUMBER,
      'BANK_ACCOUNT_NAME': process.env.BANK_ACCOUNT_NAME,
      'BANK_BRANCH': process.env.BANK_BRANCH
    },
    required: true
  },
  business: {
    name: 'Business Information',
    vars: {
      'BUSINESS_NAME': process.env.BUSINESS_NAME,
      'BUSINESS_PHONE': process.env.BUSINESS_PHONE,
      'BUSINESS_EMAIL': process.env.BUSINESS_EMAIL
    },
    required: false
  }
};

let allRequired = true;

for (const [key, check] of Object.entries(checks)) {
  console.log(`${colors.blue}━━━ ${check.name} ${check.required ? '(REQUIRED)' : '(OPTIONAL)'}${colors.reset}`);
  
  let sectionOk = true;
  for (const [varName, value] of Object.entries(check.vars)) {
    const isSet = value && value !== '' && value !== 'your_' && !value.includes('xxxx');
    const icon = isSet ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    
    let displayValue;
    if (!isSet) {
      displayValue = `${colors.red}NOT SET${colors.reset}`;
    } else if (varName.includes('PASSWORD') || varName.includes('TOKEN')) {
      displayValue = `${colors.green}***${value.slice(-4)}${colors.reset}`;
    } else if (varName.includes('ACCOUNT_SID') && value) {
      displayValue = `${colors.green}${value.substring(0, 10)}...${colors.reset}`;
    } else {
      displayValue = `${colors.green}${value}${colors.reset}`;
    }
    
    console.log(`  ${icon} ${varName}: ${displayValue}`);
    
    if (!isSet && check.required) {
      sectionOk = false;
      allRequired = false;
    }
  }
  
  console.log();
}

console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

if (allRequired) {
  console.log(`${colors.green}✅ All required configuration is set!${colors.reset}`);
  console.log(`${colors.green}   You can start the server with: npm start${colors.reset}\n`);
} else {
  console.log(`${colors.red}❌ Some required configuration is missing!${colors.reset}`);
  console.log(`${colors.yellow}   Please update your .env file and try again.${colors.reset}\n`);
  console.log(`${colors.yellow}📝 Steps to fix:${colors.reset}`);
  console.log(`   1. Open: ${colors.cyan}Laundary-POS-System-Backend/.env${colors.reset}`);
  console.log(`   2. Fill in the missing values`);
  console.log(`   3. Save the file`);
  console.log(`   4. Run this check again: ${colors.cyan}node check-env.js${colors.reset}\n`);
}

// Additional checks
console.log(`${colors.blue}Additional Information:${colors.reset}`);
console.log(`  Node Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`  Port: ${process.env.PORT || '5000'}`);
console.log(`  MongoDB: ${process.env.MONGO_URI ? '✓ Set' : '✗ Not Set'}`);
console.log(`  JWT Secret: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Not Set'}`);
console.log();

process.exit(allRequired ? 0 : 1);

