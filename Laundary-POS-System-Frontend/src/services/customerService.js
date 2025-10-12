import { customersAPI } from './api';

// Customer service layer for API interactions
export const customerService = {
  // Get all customers with pagination and filters
  getCustomers: async (params = {}) => {
    try {
      // Filter out empty string values and undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([key, value]) => 
          value !== '' && value !== undefined && value !== null
        )
      );
      
      console.log('Customer API Request Params:', cleanParams); // Debug log
      const response = await customersAPI.getAll(cleanParams);
      console.log('Customer API Response:', response.data); // Debug log
      
      return {
        success: true,
        customers: response.data.data.customers || [],
        totalCustomers: response.data.data.pagination?.totalCustomers || 0,
        totalPages: response.data.data.pagination?.totalPages || 1,
        currentPage: response.data.data.pagination?.currentPage || 1,
        hasNextPage: response.data.data.pagination?.hasNext || false,
        hasPrevPage: response.data.data.pagination?.hasPrev || false,
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      return {
        success: false,
        customers: [],
        totalCustomers: 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
        error: error.response?.data?.message || 'Failed to fetch customers',
      };
    }
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    try {
      const response = await customersAPI.getById(id);
      console.log('Customer by ID Response:', response.data); // Debug log
      return {
        success: true,
        customer: response.data.customer,
      };
    } catch (error) {
      console.error('Error fetching customer:', error);
      return {
        success: false,
        customer: null,
        error: error.response?.data?.message || 'Failed to fetch customer',
      };
    }
  },

  // Get customer by phone number
  getCustomerByPhone: async (phoneNumber) => {
    try {
      const response = await customersAPI.getByPhone(phoneNumber);
      console.log('Customer by Phone Response:', response.data); // Debug log
      return {
        success: true,
        data: response.data.customer,
      };
    } catch (error) {
      console.error('Error fetching customer by phone:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Customer not found',
      };
    }
  },

  // Create new customer
  createCustomer: async (customerData) => {
    try {
      const response = await customersAPI.create(customerData);
      console.log('Create Customer Response:', response.data); // Debug log
      return {
        success: true,
        customer: response.data.customer,
        message: response.data.message || 'Customer created successfully',
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        customer: null,
        error: error.response?.data?.message || 'Failed to create customer',
      };
    }
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    try {
      const response = await customersAPI.update(id, customerData);
      console.log('Update Customer Response:', response.data); // Debug log
      return {
        success: true,
        customer: response.data.customer,
        message: response.data.message || 'Customer updated successfully',
      };
    } catch (error) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        customer: null,
        error: error.response?.data?.message || 'Failed to update customer',
      };
    }
  },

  // Delete customer
  deleteCustomer: async (id) => {
    try {
      await customersAPI.delete(id);
      return {
        success: true,
        message: 'Customer deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete customer',
      };
    }
  },

  // Search customers
  searchCustomers: async (searchParams) => {
    try {
      const response = await customersAPI.search(searchParams);
      console.log('Search Customers Response:', response.data); // Debug log
      return {
        success: true,
        customers: response.data.data || [],
        totalCustomers: response.data.data?.length || 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };
    } catch (error) {
      console.error('Error searching customers:', error);
      return {
        success: false,
        customers: [],
        totalCustomers: 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
        error: error.response?.data?.message || 'Failed to search customers',
      };
    }
  },

  // Get customer order history
  getCustomerOrderHistory: async (id, params = {}) => {
    try {
      const response = await customersAPI.getOrderHistory(id, params);
      console.log('Order History Response:', response.data); // Debug log
      return {
        success: true,
        data: response.data.data, // Extract the nested data object
      };
    } catch (error) {
      console.error('Error fetching order history:', error);
      return {
        success: false,
        data: { orders: [] }, // Return empty array structure on error
        error: error.response?.data?.message || 'Failed to fetch order history',
      };
    }
  },

  // Get customer analytics
  getCustomerAnalytics: async (id, params = {}) => {
    try {
      const response = await customersAPI.getAnalytics(id, params);
      console.log('Customer Analytics Response:', response.data); // Debug log
      return {
        success: true,
        data: response.data.data, // Extract the nested data object
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        success: false,
        data: {},
        error: error.response?.data?.message || 'Failed to fetch customer analytics',
      };
    }
  },

  // Update loyalty points
  updateLoyaltyPoints: async (id, pointsData) => {
    try {
      const response = await customersAPI.updateLoyaltyPoints(id, pointsData);
      return {
        success: true,
        data: response.data,
        message: 'Loyalty points updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update loyalty points',
      };
    }
  },

  // Bulk update customers
  bulkUpdateCustomers: async (updateData) => {
    try {
      const response = await customersAPI.bulkUpdate(updateData);
      return {
        success: true,
        data: response.data,
        message: 'Customers updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update customers',
      };
    }
  },

  // Get customer statistics
  getCustomerStats: async (params = {}) => {
    try {
      console.log('Customer Stats API Request Params:', params);
      const response = await customersAPI.getStats(params);
      console.log('Customer Stats API Response:', response);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      return {
        success: false,
        data: {},
        error: error.response?.data?.message || 'Failed to fetch customer statistics',
      };
    }
  },
};

export default customerService;
