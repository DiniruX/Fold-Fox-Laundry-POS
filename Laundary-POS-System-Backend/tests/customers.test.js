const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const jwt = require('jsonwebtoken');

describe('Customers', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Create a test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'cashier',
      permissions: ['view_customers', 'create_customers', 'edit_customers']
    });

    userId = user._id;
    authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'test-secret');
  });

  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      const customerData = {
        fullName: 'John Doe',
        phoneNumber: '1234567890',
        email: 'john@example.com',
        campusId: 'STU001'
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.customer.fullName).toBe(customerData.fullName);
      expect(response.body.customer.isStudent).toBe(true);
    });

    it('should not create customer with existing phone number', async () => {
      const customerData = {
        fullName: 'John Doe',
        phoneNumber: '1234567890',
        email: 'john@example.com'
      };

      // Create customer first
      await Customer.create(customerData);

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Customer with this phone number already exists');
    });
  });

  describe('GET /api/customers', () => {
    beforeEach(async () => {
      // Create test customers
      await Customer.create([
        { fullName: 'John Doe', phoneNumber: '1234567890' },
        { fullName: 'Jane Smith', phoneNumber: '0987654321' }
      ]);
    });

    it('should get all customers', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.customers).toHaveLength(2);
    });

    it('should search customers by name', async () => {
      const response = await request(app)
        .get('/api/customers?search=John')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.customers).toHaveLength(1);
      expect(response.body.customers[0].fullName).toBe('John Doe');
    });
  });
});
