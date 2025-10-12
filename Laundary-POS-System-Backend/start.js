#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Fold Fox Laundry POS - Backend Setup');
console.log('=====================================\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from template...');
  try {
    fs.copyFileSync('env.example', '.env');
    console.log('✅ .env file created successfully!');
    console.log('⚠️  Please update the .env file with your configuration before starting the server.\n');
  } catch (error) {
    console.log('❌ Error creating .env file:', error.message);
    console.log('Please manually copy env.example to .env and configure it.\n');
  }
} else {
  console.log('✅ .env file already exists\n');
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully!\n');
  } catch (error) {
    console.log('❌ Error installing dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed\n');
}

// Check if MongoDB is running
console.log('🔍 Checking MongoDB connection...');
try {
  execSync('mongosh --eval "db.runCommand({ping: 1})" --quiet', { stdio: 'pipe' });
  console.log('✅ MongoDB is running\n');
} catch (error) {
  console.log('⚠️  MongoDB is not running or not accessible');
  console.log('Please start MongoDB before running the application.\n');
}

console.log('🎯 Next steps:');
console.log('1. Update your .env file with proper configuration');
console.log('2. Make sure MongoDB is running');
console.log('3. Run: npm run seed (to seed the database)');
console.log('4. Run: npm run dev (to start development server)');
console.log('5. Visit: http://localhost:5000/api/health (to test the API)');
console.log('\n📚 For more information, check the README.md file');
console.log('\nHappy coding! 🎉');
