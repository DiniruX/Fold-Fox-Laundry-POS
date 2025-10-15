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
      
      const response = await customersAPI.getAll(cleanParams);
      
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
      // Error fetching customers
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
      return {
        success: true,
        customer: response.data.customer,
      };
    } catch (error) {
      // Error fetching customer
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
      return {
        success: true,
        data: response.data.customer,
      };
    } catch (error) {
      // Error fetching customer by phone
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
      return {
        success: true,
        customer: response.data.customer,
        message: response.data.message || 'Customer created successfully',
      };
    } catch (error) {
      // Error creating customer
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
      return {
        success: true,
        customer: response.data.customer,
        message: response.data.message || 'Customer updated successfully',
      };
    } catch (error) {
      // Error updating customer
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
      // Error searching customers
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
      return {
        success: true,
        data: response.data.data, // Extract the nested data object
      };
    } catch (error) {
      // Error fetching order history
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
      return {
        success: true,
        data: response.data.data, // Extract the nested data object
      };
    } catch (error) {
      // Error fetching analytics
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
      const response = await customersAPI.getStats(params);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      // Error fetching customer stats
      return {
        success: false,
        data: {},
        error: error.response?.data?.message || 'Failed to fetch customer statistics',
      };
    }
  },

  // Register customer from landing page (PUBLIC - no auth required)
  // Includes automatic retry logic for transient failures
  registerFromLanding: async (customerData, maxRetries = 3) => {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await customersAPI.registerFromLanding(customerData);
        return {
          success: true,
          customer: response.data.data.customer,
          message: response.data.message
        };
      } catch (error) {
        lastError = error;
        
        // Get error status and message
        const status = error.response?.status;
        const errorMsg = error.response?.data?.message || error.message;
        
        // Don't retry on client errors (400-499) - these are validation/user errors
        if (status >= 400 && status < 500) {
          // Return immediately for client errors
          return {
            success: false,
            customer: null,
            error: errorMsg || 'Registration failed. Please check your information.',
          };
        }
        
        // Retry on server errors (500+) or network errors
        if (attempt < maxRetries) {
          // Exponential backoff: wait longer between each retry
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
          continue;
        }
      }
    }
    
    // All retries exhausted
    return {
      success: false,
      customer: null,
      error: lastError?.response?.data?.message || 
             'Registration failed after multiple attempts. Please try again later.',
    };
  },

  // Get customer discount information (Protected)
  getCustomerDiscountInfo: async (customerId) => {
    try {
      const response = await customersAPI.getDiscountInfo(customerId);
      return {
        success: true,
        discountInfo: response.data.data.discountInfo,
        discountSummary: response.data.data.discountSummary,
        orderHistory: response.data.data.orderHistory
      };
    } catch (error) {
      // Error fetching customer discount info
      return {
        success: false,
        discountInfo: null,
        error: error.response?.data?.message || 'Failed to fetch discount information',
      };
    }
  },
};

export default customerService;
