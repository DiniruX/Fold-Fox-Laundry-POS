const Customer = require('../models/Customer');
const Order = require('../models/Order');
const mongoose = require('mongoose');

/**
 * Customer Controller - Comprehensive CRUD operations with role-based permissions
 * Admin & Cashier: Full access to customer operations
 * Features: Advanced search, analytics, bulk operations, customer insights
 */

/**
 * @desc    Create new customer
 * @route   POST /api/customers
 * @access  Admin & Cashier
 */
const createCustomer = async (req, res) => {
  try {
    const customerData = req.body;
    
    // Check if customer with phone number already exists
    const existingCustomer = await Customer.findOne({ 
      phoneNumber: customerData.phoneNumber 
    });
    
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone number already exists'
      });
    }
    
    // Check if it's a student based on campus ID or isStudent flag
    const isStudent = !!(customerData.campusId || customerData.isStudent);
    if (isStudent) {
      customerData.isStudent = true;
    }
    
    // Set student discount eligibility
    customerData.eligibleForStudentDiscount = isStudent;
    
    // Remove empty email field to avoid validation issues
    if (customerData.email && customerData.email.trim() === '') {
      delete customerData.email;
    }
    
    const customer = await Customer.create(customerData);
    
    // Get discount information for response
    const discountInfo = customer.getApplicableDiscount();
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: {
        customer: {
          id: customer._id,
          fullName: customer.fullName,
          phoneNumber: customer.phoneNumber,
          email: customer.email,
          isStudent: customer.isStudent,
          campusId: customer.campusId,
          eligibleForStudentDiscount: customer.eligibleForStudentDiscount,
          discountInfo: discountInfo
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
};

/**
 * @desc    Get all customers with advanced filtering and search
 * @route   GET /api/customers
 * @access  Admin & Cashier
 */
const getCustomers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      isStudent, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      campusId,
      hasOrders
    } = req.query;
    
    // Build query
    let query = {};
    
    
    // Student filter
    if (isStudent !== undefined && isStudent !== '') {
      query.isStudent = isStudent === 'true';
    }
    
    // Campus ID filter
    if (campusId) {
      query.campusId = { $regex: campusId, $options: 'i' };
    }
    
    // Search across multiple fields
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { campusId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Pagination
    const maxLimit = Math.min(parseInt(limit) || 10, 100);
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * maxLimit;
    
    // Execute query with pagination
    let customers = await Customer.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(maxLimit);
    
    // If hasOrders filter is specified, we need to filter customers who have orders
    if (hasOrders !== undefined) {
      const customerIds = await Order.distinct('customer');
      if (hasOrders === 'true') {
        customers = customers.filter(customer => customerIds.includes(customer._id.toString()));
      } else {
        customers = customers.filter(customer => !customerIds.includes(customer._id.toString()));
      }
    }
    
    const total = await Customer.countDocuments(query);
    
    // Calculate additional stats
    const stats = {
      totalCustomers: total,
      studentCustomers: await Customer.countDocuments({ ...query, isStudent: true })
    };
    
    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / maxLimit),
          totalCustomers: total,
          hasNext: pageNum < Math.ceil(total / maxLimit),
          hasPrev: pageNum > 1
        },
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findById(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
};

const getCustomerByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    const customer = await Customer.findOne({ phoneNumber });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if it's a student based on campus ID or isStudent flag
    const isStudent = !!(updateData.campusId || updateData.isStudent);
    if (isStudent) {
      updateData.isStudent = true;
    }
    
    // Set student discount eligibility
    updateData.eligibleForStudentDiscount = isStudent;
    
    // Remove empty email field to avoid validation issues
    if (updateData.email && updateData.email.trim() === '') {
      delete updateData.email;
    }
    
    const customer = await Customer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Get discount information for response
    const discountInfo = customer.getApplicableDiscount();
    
    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: {
        customer: {
          id: customer._id,
          fullName: customer.fullName,
          phoneNumber: customer.phoneNumber,
          email: customer.email,
          isStudent: customer.isStudent,
          campusId: customer.campusId,
          eligibleForStudentDiscount: customer.eligibleForStudentDiscount,
          discountInfo: discountInfo
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hard delete - permanently remove from database
    const customer = await Customer.findByIdAndDelete(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Customer permanently deleted from database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
};

/**
 * @desc    Get customer order history with detailed analytics
 * @route   GET /api/customers/:id/orders
 * @access  Admin & Cashier
 */
const getCustomerOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    
    
    // Build order query
    let orderQuery = { customer: id, isDeleted: { $ne: true } };
    
    if (status) {
      orderQuery.status = status;
    }
    
    if (startDate || endDate) {
      orderQuery.createdAt = {};
      if (startDate) orderQuery.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(endDate))) end.setHours(23, 59, 59, 999);
        orderQuery.createdAt.$lte = end;
      }
    }
    
    // Pagination
    const maxLimit = Math.min(parseInt(limit) || 10, 50);
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * maxLimit;
    
    const orders = await Order.find(orderQuery)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(maxLimit);
    
    
    const total = await Order.countDocuments(orderQuery);
    
    // Calculate customer analytics
    const analytics = await Order.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(id), isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          outstandingBalance: { $sum: { $cond: [{ $gt: ['$balanceAmount', 0] }, '$balanceAmount', 0] } },
          lastOrderDate: { $max: '$createdAt' },
          averageOrderValue: { $avg: '$totalAmount' },
          statusBreakdown: {
            $push: '$status'
          }
        }
      }
    ]);
    
    
    // Process status breakdown
    let statusStats = {};
    if (analytics.length > 0 && analytics[0].statusBreakdown) {
      analytics[0].statusBreakdown.forEach(status => {
        statusStats[status] = (statusStats[status] || 0) + 1;
      });
    }
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / maxLimit),
          totalOrders: total,
          hasNext: pageNum < Math.ceil(total / maxLimit),
          hasPrev: pageNum > 1
        },
        analytics: analytics[0] ? {
          totalOrders: analytics[0].totalOrders,
          totalSpent: analytics[0].totalSpent,
          averageOrderValue: Math.round(analytics[0].averageOrderValue * 100) / 100,
          outstandingBalance: analytics[0].outstandingBalance || 0,
          lastOrderDate: analytics[0].lastOrderDate,
          statusBreakdown: statusStats
        } : null
      }
    });
  } catch (error) {
    console.error('Error in getCustomerOrderHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order history',
      error: error.message
    });
  }
};

/**
 * @desc    Get customer analytics and insights
 * @route   GET /api/customers/:id/analytics
 * @access  Admin & Cashier
 */
const getCustomerAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;
    
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    const analytics = await Order.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(id),
          isDeleted: { $ne: true },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          totalDiscounts: { $sum: '$discount.amount' },
          lastOrderDate: { $max: '$createdAt' },
          firstOrderDate: { $min: '$createdAt' }
        }
      }
    ]);
    
    // Monthly spending trend
    const monthlyTrend = await Order.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(id),
          isDeleted: { $ne: true },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          orders: { $sum: 1 },
          spent: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    const customerMatch = { customer: new mongoose.Types.ObjectId(id), isDeleted: { $ne: true } };

    // Lifetime totals (all orders, not limited to the period)
    const [lifetime] = await Order.aggregate([
      { $match: customerMatch },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          outstandingBalance: { $sum: { $cond: [{ $gt: ['$balanceAmount', 0] }, '$balanceAmount', 0] } },
          lastOrderDate: { $max: '$createdAt' },
          firstOrderDate: { $min: '$createdAt' }
        }
      }
    ]);

    // Weight / pieces across all items
    const [volume] = await Order.aggregate([
      { $match: customerMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalWeight: { $sum: { $ifNull: ['$items.weight', 0] } },
          // Only count pieces for items that were priced per piece (weight-based lines carry quantity 1)
          totalPieces: { $sum: { $cond: [{ $gt: ['$items.weight', 0] }, 0, { $ifNull: ['$items.quantity', 0] }] } }
        }
      }
    ]);

    // Service usage: every service this customer has ever used
    const serviceUsage = await Order.aggregate([
      { $match: customerMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.service',
          serviceName: { $first: '$items.serviceName' },
          orders: { $addToSet: '$_id' },
          totalQuantity: { $sum: { $cond: [{ $gt: ['$items.weight', 0] }, 0, { $ifNull: ['$items.quantity', 0] }] } },
          totalWeight: { $sum: { $ifNull: ['$items.weight', 0] } },
          totalSpent: { $sum: '$items.totalPrice' },
          lastUsed: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $project: {
          serviceName: { $ifNull: [{ $arrayElemAt: ['$service.name', 0] }, '$serviceName'] },
          color: { $arrayElemAt: ['$service.color', 0] },
          orderCount: { $size: '$orders' },
          totalQuantity: 1,
          totalWeight: { $round: ['$totalWeight', 2] },
          totalSpent: { $round: ['$totalSpent', 2] },
          lastUsed: 1
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);
    
    const responseData = {
      success: true,
      data: {
        period,
        overview: analytics[0] || {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          totalDiscounts: 0
        },
        lifetime: {
          totalOrders: lifetime?.totalOrders || 0,
          totalSpent: lifetime?.totalSpent || 0,
          outstandingBalance: lifetime?.outstandingBalance || 0,
          lastOrderDate: lifetime?.lastOrderDate || null,
          firstOrderDate: lifetime?.firstOrderDate || null,
          totalWeight: Math.round((volume?.totalWeight || 0) * 100) / 100,
          totalPieces: volume?.totalPieces || 0
        },
        monthlyTrend,
        serviceUsage,
        // Kept for older clients
        servicePreferences: serviceUsage.slice(0, 5),
        dateRange: { startDate, endDate }
      }
    };
    
    res.json(responseData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer analytics',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk update customers
 * @route   PUT /api/customers/bulk-update
 * @access  Admin only
 */
const bulkUpdateCustomers = async (req, res) => {
  try {
    const { customerIds, updateData, action } = req.body;
    
    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer IDs array is required'
      });
    }
    
    let result;
    
    switch (action) {
      case 'activate':
      case 'update':
        if (!updateData) {
          return res.status(400).json({
            success: false,
            message: 'Update data is required for update action'
          });
        }
        result = await Customer.updateMany(
          { _id: { $in: customerIds } },
          updateData
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be activate, deactivate, or update'
        });
    }
    
    res.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        customerIds
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk update',
      error: error.message
    });
  }
};

/**
 * @desc    Get customer statistics
 * @route   GET /api/customers/stats
 * @access  Admin & Cashier
 */
const getCustomerStats = async (req, res) => {
  try {
    const stats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          studentCustomers: { $sum: { $cond: ['$isStudent', 1, 0] } },
          totalSpent: { $sum: '$totalSpent' },
          totalOrders: { $sum: '$totalOrders' }
        }
      }
    ]);
    
    // Campus distribution
    const campusStats = await Customer.aggregate([
      { $match: { campusId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$campusId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Recent customers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCustomers = await Customer.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    const overview = stats[0] || {
      totalCustomers: 0,
      studentCustomers: 0,
      totalSpent: 0,
      totalOrders: 0
    };
    delete overview._id;

    // Customers who have ordered at least once, and the biggest spenders
    const [returningCustomers, topCustomers] = await Promise.all([
      Customer.countDocuments({ totalOrders: { $gte: 1 } }),
      Customer.find({ totalSpent: { $gt: 0 } })
        .select('fullName phoneNumber email totalOrders totalSpent')
        .sort({ totalSpent: -1 })
        .limit(5)
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        ...overview,
        totalRevenue: overview.totalSpent,
        averageSpend: overview.totalCustomers > 0 ? Math.round(overview.totalSpent / overview.totalCustomers) : 0,
        returningCustomers,
        topCustomers,
        recentCustomers,
        topCampuses: campusStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Search customers by multiple criteria
 * @route   GET /api/customers/search
 * @access  Admin & Cashier
 */
const searchCustomers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const customers = await Customer.find({
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { phoneNumber: { $regex: q, $options: 'i' } },
        { campusId: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('fullName phoneNumber campusId email totalOrders totalSpent isStudent address')
    .limit(parseInt(limit))
    .sort({ totalSpent: -1 });
    
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search customers',
      error: error.message
    });
  }
};

/**
 * @desc    Register customer from landing page
 * @route   POST /api/customers/register-from-landing
 * @access  Public (no authentication required)
 */
const registerFromLanding = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      phoneNumber,
      address,
      isStudent,
      studentId,
      campaignCode
    } = req.body;

    // Validate required fields
    if (!fullName || (!phone && !phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Full name and phone number are required'
      });
    }

    // Normalize phone field
    const customerPhone = phone || phoneNumber;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [
        { phoneNumber: customerPhone },
        ...(email ? [{ email: email.toLowerCase() }] : [])
      ]
    })
    .select('_id')
    .lean()
    .exec();

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer already registered with this phone number or email'
      });
    }

    // Verify campaign code (if provided)
    let isCampaignValid = false;
    if (campaignCode) {
      const validCampaigns = ['GRAND_OPENING_2025', 'STUDENT_WELCOME_2025', 'CAMPAIGN2025'];
      isCampaignValid = validCampaigns.includes(campaignCode.toUpperCase());
    }

    // Create customer object
    const customerData = {
      fullName,
      phoneNumber: customerPhone,
      email: email || undefined,
      address: address || {},
      
      // Student information
      isStudent: isStudent || false,
      studentId: isStudent ? studentId : null,
      campusId: isStudent ? studentId : null,
      
      // Campaign tracking
      registeredViaCampaign: isCampaignValid,
      campaignCode: isCampaignValid ? campaignCode.toUpperCase() : null,
      campaignRegistrationDate: isCampaignValid ? new Date() : null,
      
      // Discount eligibility
      eligibleForCampaignDiscount: isCampaignValid,
      eligibleForStudentDiscount: isStudent || false,
      
      // Source tracking
      registrationSource: 'landing_page',
      
      // First order tracking
      firstOrderCompleted: false
    };

    const customer = await Customer.create(customerData);

    // Get discount information
    const discountInfo = customer.getApplicableDiscount();

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        customer: {
          id: customer._id,
          fullName: customer.fullName,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
          isStudent: customer.isStudent,
          registeredViaCampaign: customer.registeredViaCampaign,
          discountInfo: discountInfo
        }
      }
    });

  } catch (error) {
    console.error('Landing page registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message
    });
  }
};

/**
 * @desc    Get customer discount information
 * @route   GET /api/customers/:id/discount-info
 * @access  Admin & Cashier
 */
const getCustomerDiscountInfo = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const discountInfo = customer.getApplicableDiscount();
    const discountSummary = customer.getDiscountSummary();

    // Get order count
    const orderCount = await Order.countDocuments({ 
      customer: customer._id,
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        discountInfo,
        discountSummary,
        orderHistory: {
          totalOrders: orderCount,
          firstOrderCompleted: customer.firstOrderCompleted,
          firstOrderDate: customer.firstOrderDate
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discount info',
      error: error.message
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  getCustomerByPhone,
  updateCustomer,
  deleteCustomer,
  getCustomerOrderHistory,
  getCustomerAnalytics,
  bulkUpdateCustomers,
  getCustomerStats,
  searchCustomers,
  registerFromLanding,
  getCustomerDiscountInfo
};