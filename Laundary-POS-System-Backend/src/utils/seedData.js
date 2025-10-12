const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Service = require('../models/Service');
const Customer = require('../models/Customer');
const connectDB = require('../config/database');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Service.deleteMany({});
    await Customer.deleteMany({});

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@laundry.com',
      password: 'password123',
      role: 'admin'
    });

    // Create cashier user
    console.log('👤 Creating cashier user...');
    const cashierUser = await User.create({
      name: 'Cashier User',
      email: 'cashier@laundry.com',
      password: 'password123',
      role: 'cashier'
    });


    // Create default services
    console.log('🛠️ Creating default services...');
    const services = [
      {
        name: 'Washing',
        description: 'Regular washing service with detergent',
        priceType: 'per_kg',
        basePrice: 2.50,
        category: 'washing',
        estimatedTime: 60,
        icon: '🧺',
        color: '#4CAF50'
      },
      {
        name: 'Drying',
        description: 'Machine drying service',
        priceType: 'per_kg',
        basePrice: 1.50,
        category: 'drying',
        estimatedTime: 45,
        icon: '🌪️',
        color: '#FF9800'
      },
      {
        name: 'Dry Cleaning',
        description: 'Professional dry cleaning for delicate items',
        priceType: 'per_item',
        basePrice: 8.00,
        category: 'dry_cleaning',
        estimatedTime: 120,
        icon: '👔',
        color: '#2196F3'
      },
      {
        name: 'Ironing',
        description: 'Professional ironing service',
        priceType: 'per_item',
        basePrice: 3.00,
        category: 'ironing',
        estimatedTime: 30,
        icon: '👕',
        color: '#9C27B0'
      },
      {
        name: 'Folding',
        description: 'Professional folding service',
        priceType: 'per_item',
        basePrice: 1.00,
        category: 'folding',
        estimatedTime: 15,
        icon: '📦',
        color: '#607D8B'
      },
      {
        name: 'Express Service',
        description: 'Same-day service (extra charge)',
        priceType: 'flat_rate',
        basePrice: 5.00,
        category: 'special',
        estimatedTime: 30,
        icon: '⚡',
        color: '#F44336'
      }
    ];

    await Service.insertMany(services);

    // Create sample customers
    console.log('👥 Creating sample customers...');
    const customers = [
      {
        fullName: 'John Doe',
        phoneNumber: '1234567890',
        email: 'john.doe@email.com',
        campusId: 'STU001',
        isStudent: true,
        address: {
          street: '123 University Ave',
          city: 'College Town',
          state: 'CA',
          zipCode: '12345'
        },
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0
      },
      {
        fullName: 'Jane Smith',
        phoneNumber: '0987654321',
        email: 'jane.smith@email.com',
        campusId: 'STU002',
        isStudent: true,
        address: {
          street: '456 Campus Dr',
          city: 'College Town',
          state: 'CA',
          zipCode: '12345'
        },
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0
      },
      {
        fullName: 'Bob Johnson',
        phoneNumber: '5555555555',
        email: 'bob.johnson@email.com',
        address: {
          street: '789 Main St',
          city: 'Downtown',
          state: 'CA',
          zipCode: '54321'
        },
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0
      }
    ];

    await Customer.insertMany(customers);

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@laundry.com / password123');
    console.log('Cashier: cashier@laundry.com / password123');
    console.log('\n🛠️ Services created:', services.length);
    console.log('👥 Sample customers created:', customers.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
