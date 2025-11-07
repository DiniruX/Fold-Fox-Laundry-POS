const Service = require('../models/Service');
const Order = require('../models/Order');

/**
 * Service Controller - Comprehensive CRUD operations with role-based permissions
 * Admin: Full access to all service operations
 * Cashier: Read-only access to services (can view but not modify)
 * Features: Advanced analytics, bulk operations, service performance tracking
 */

/**
 * @desc    Create new service
 * @route   POST /api/services
 * @access  Admin only
 */
const createService = async (req, res) => {
  try {
    const {
      name,
      description,
      priceType, // Legacy field, kept for backward compatibility
      basePrice,
      statuses,
      clothingPrices,
      clothingPriceTypes, // New: priceType per category
      estimatedTime,
      icon,
      color
    } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'name is required'
      });
    }

    // clothingPrices is required
    if (!clothingPrices || Object.keys(clothingPrices).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'clothingPrices is required. Please set prices for each clothing category.'
      });
    }

    // clothingPriceTypes should be provided for each category
    if (!clothingPriceTypes || Object.keys(clothingPriceTypes).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'clothingPriceTypes is required. Please set priceType (per_kg or per_piece) for each clothing category.'
      });
    }

    // Ensure all categories in clothingPrices have a corresponding priceType
    const priceCategories = Object.keys(clothingPrices);
    const priceTypeCategories = Object.keys(clothingPriceTypes);
    const missingPriceTypes = priceCategories.filter(cat => !priceTypeCategories.includes(cat));
    
    if (missingPriceTypes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing priceType for categories: ${missingPriceTypes.join(', ')}. Please set priceType for each category.`
      });
    }

    const allowedPriceTypes = ['per_kg', 'per_piece'];
    const allowedStatuses = ['wash', 'dry', 'iron', 'dry_clean', 'fold'];
    
    // Validate all priceTypes in clothingPriceTypes
    for (const [category, catPriceType] of Object.entries(clothingPriceTypes)) {
      if (!allowedPriceTypes.includes(catPriceType)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid priceType for category ${category}. Must be per_kg or per_piece.` 
        });
      }
    }

    // Validate statuses if provided
    if (statuses && Array.isArray(statuses)) {
      const invalidStatuses = statuses.filter(status => !allowedStatuses.includes(status));
      if (invalidStatuses.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid statuses: ${invalidStatuses.join(', ')}. Allowed: ${allowedStatuses.join(', ')}` 
        });
      }
    }

    const parsedEstimatedTime = estimatedTime !== undefined ? Number(estimatedTime) : 60;
    
    if (Number.isNaN(parsedEstimatedTime) || parsedEstimatedTime < 1) {
      return res.status(400).json({ success: false, message: 'estimatedTime must be at least 1 minute' });
    }

    // Validate that all clothing prices are valid numbers
    const validatedClothingPrices = {};
    for (const [category, price] of Object.entries(clothingPrices)) {
      const parsedPrice = Number(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid price for category ${category}. Price must be a non-negative number.` 
        });
      }
      validatedClothingPrices[category] = parsedPrice;
    }

    // Validate clothingPriceTypes
    const validatedClothingPriceTypes = {};
    for (const [category, catPriceType] of Object.entries(clothingPriceTypes)) {
      if (!allowedPriceTypes.includes(catPriceType)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid priceType for category ${category}. Must be per_kg or per_piece.` 
        });
      }
      validatedClothingPriceTypes[category] = catPriceType;
    }

    // Determine legacy priceType (use first category's priceType or provided one)
    const legacyPriceType = priceType || Object.values(validatedClothingPriceTypes)[0] || 'per_piece';

    const priceValues = Object.values(validatedClothingPrices);
    const basePriceValue = priceValues.length > 0 ? Math.min(...priceValues) : 0;

    const service = await Service.create({
      name,
      description,
      priceType: legacyPriceType, // Legacy field for backward compatibility
      basePrice: basePriceValue,
      statuses: statuses || ['wash', 'dry'],
      clothingPrices: validatedClothingPrices,
      clothingPriceTypes: validatedClothingPriceTypes,
      estimatedTime: parsedEstimatedTime,
      icon,
      color
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    // Handle duplicate name error
    if (error && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A service with this name already exists'
      });
    }
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message
    });
  }
};

/**
 * @desc    Get all services with advanced filtering and pagination
 * @route   GET /api/services
 * @access  Admin & Cashier (read-only for cashier)
 */
const getServices = async (req, res) => {
  try {
    const { 
      status, 
      isActive, 
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      priceType,
      minPrice,
      maxPrice
    } = req.query;
    
    // Build query
    let query = {};
    
    // Handle isActive filter
    if (isActive && isActive !== 'all') {
      const isActiveBool = typeof isActive === 'string'
        ? isActive.toLowerCase() === 'true'
        : Boolean(isActive);
      query.isActive = isActiveBool;
    }
    
    // Handle status filter
    if (status && status !== 'all') {
      query.statuses = { $in: [status] };
    }
    
    // Handle price type filter
    if (priceType && priceType !== 'all') {
      query.priceType = priceType;
    }
    
    // Handle price range filter
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
    }
    
    // Handle search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Pagination
    const maxLimit = Math.min(parseInt(limit) || 10, 100);
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * maxLimit;
    
    const services = await Service.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(maxLimit);
    
    const total = await Service.countDocuments(query);
    
    // Calculate service statistics
    const stats = await Service.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          activeServices: { $sum: { $cond: ['$isActive', 1, 0] } },
          averagePrice: { $avg: '$basePrice' },
          priceTypeCounts: {
            $push: '$priceType'
          }
        }
      }
    ]);
    
    // Process price type counts
    let priceTypeStats = {};
    if (stats.length > 0 && stats[0].priceTypeCounts) {
      stats[0].priceTypeCounts.forEach(priceType => {
        priceTypeStats[priceType] = (priceTypeStats[priceType] || 0) + 1;
      });
    }
    
    res.json({
      success: true,
      data: {
        services,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / maxLimit),
          totalServices: total,
          hasNext: pageNum < Math.ceil(total / maxLimit),
          hasPrev: pageNum > 1
        },
        stats: stats[0] ? {
          totalServices: stats[0].totalServices,
          activeServices: stats[0].activeServices,
          averagePrice: Math.round(stats[0].averagePrice * 100) / 100,
          priceTypeBreakdown: priceTypeStats
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
};

const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
      error: error.message
    });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      priceType,
      basePrice,
      statuses,
      clothingPrices,
      clothingPriceTypes,
      estimatedTime,
      icon,
      color,
      isActive,
      ...otherFields
    } = req.body;
    
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (estimatedTime !== undefined) updateData.estimatedTime = Number(estimatedTime);
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (statuses !== undefined) {
      const allowedStatuses = ['wash', 'dry', 'iron', 'dry_clean', 'fold'];
      const invalidStatuses = statuses.filter(status => !allowedStatuses.includes(status));
      if (invalidStatuses.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid statuses: ${invalidStatuses.join(', ')}` 
        });
      }
      updateData.statuses = statuses;
    }

    // Handle clothingPrices and clothingPriceTypes
    if (clothingPrices !== undefined) {
      const validatedClothingPrices = {};
      for (const [category, price] of Object.entries(clothingPrices)) {
        const parsedPrice = Number(price);
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({ 
            success: false, 
            message: `Invalid price for category ${category}. Price must be a non-negative number.` 
          });
        }
        validatedClothingPrices[category] = parsedPrice;
      }
      updateData.clothingPrices = validatedClothingPrices;

      const priceValues = Object.values(validatedClothingPrices);
      if (priceValues.length > 0) {
        updateData.basePrice = Math.min(...priceValues);
      }
    }

    if (clothingPriceTypes !== undefined) {
      const allowedPriceTypes = ['per_kg', 'per_piece'];
      const validatedClothingPriceTypes = {};
      for (const [category, catPriceType] of Object.entries(clothingPriceTypes)) {
        if (!allowedPriceTypes.includes(catPriceType)) {
          return res.status(400).json({ 
            success: false, 
            message: `Invalid priceType for category ${category}. Must be per_kg or per_piece.` 
          });
        }
        validatedClothingPriceTypes[category] = catPriceType;
      }
      updateData.clothingPriceTypes = validatedClothingPriceTypes;
      
      // Update legacy priceType if provided, otherwise use first category's priceType
      updateData.priceType = priceType || Object.values(validatedClothingPriceTypes)[0] || service.priceType || 'per_piece';
    } else if (priceType !== undefined) {
      updateData.priceType = priceType;
    }

    // Ensure consistency: if clothingPrices are updated, clothingPriceTypes should exist
    if (updateData.clothingPrices && !updateData.clothingPriceTypes) {
      // Keep existing clothingPriceTypes if not provided
      const existingPriceTypes = service.clothingPriceTypes || {};
      const priceCategories = Object.keys(updateData.clothingPrices);
      const missingPriceTypes = priceCategories.filter(cat => !existingPriceTypes[cat]);
      
      if (missingPriceTypes.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing priceType for categories: ${missingPriceTypes.join(', ')}. Please provide clothingPriceTypes.`
        });
      }
    }

    const updatedService = await Service.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Service updated successfully',
      service: updatedService
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findByIdAndDelete(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
};

const getServiceStatuses = async (req, res) => {
  try {
    // Get all unique statuses from all services
    const services = await Service.find({}, 'statuses');
    const allStatuses = services.reduce((acc, service) => {
      if (service.statuses) {
        service.statuses.forEach(status => acc.add(status));
      }
      return acc;
    }, new Set());
    
    res.json({
      success: true,
      statuses: Array.from(allStatuses)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statuses',
      error: error.message
    });
  }
};

const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'isActive is required'
      });
    }
    
    const service = await Service.findByIdAndUpdate(
      id,
      { isActive: Boolean(isActive) },
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Service status updated',
      service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update service status',
      error: error.message
    });
  }
};

/**
 * @desc    Get service performance analytics
 * @route   GET /api/services/:id/analytics
 * @access  Admin & Cashier
 */
const getServiceAnalytics = async (req, res) => {
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
    
    // Service usage analytics
    const analytics = await Order.aggregate([
      {
        $match: {
          'items.service': id,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.service': id
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          averageOrderValue: { $avg: '$items.totalPrice' },
          lastUsed: { $max: '$createdAt' }
        }
      }
    ]);
    
    // Monthly trend
    const monthlyTrend = await Order.aggregate([
      {
        $match: {
          'items.service': id,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.service': id
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          orders: { $sum: 1 },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Get service details
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        service: {
          id: service._id,
          name: service.name,
          category: service.category,
          basePrice: service.basePrice,
          priceType: service.priceType
        },
        period,
        overview: analytics[0] || {
          totalOrders: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        },
        monthlyTrend,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service analytics',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk update services
 * @route   PUT /api/services/bulk-update
 * @access  Admin only
 */
const bulkUpdateServices = async (req, res) => {
  try {
    const { serviceIds, updateData, action } = req.body;
    
    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Service IDs array is required'
      });
    }
    
    let result;
    
    switch (action) {
      case 'activate':
        result = await Service.updateMany(
          { _id: { $in: serviceIds } },
          { isActive: true }
        );
        break;
      case 'deactivate':
        result = await Service.updateMany(
          { _id: { $in: serviceIds } },
          { isActive: false }
        );
        break;
      case 'update':
        if (!updateData) {
          return res.status(400).json({
            success: false,
            message: 'Update data is required for update action'
          });
        }
        result = await Service.updateMany(
          { _id: { $in: serviceIds } },
          updateData
        );
        break;
      case 'delete':
        result = await Service.deleteMany(
          { _id: { $in: serviceIds } }
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be activate, deactivate, update, or delete'
        });
    }
    
    res.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        serviceIds
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
 * @desc    Get service statistics
 * @route   GET /api/services/stats
 * @access  Admin & Cashier
 */
const getServiceStats = async (req, res) => {
  try {
    const stats = await Service.aggregate([
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          activeServices: { $sum: { $cond: ['$isActive', 1, 0] } },
          averagePrice: { $avg: '$basePrice' },
          categoryCounts: {
            $push: '$category'
          },
          priceTypeCounts: {
            $push: '$priceType'
          }
        }
      }
    ]);
    
    // Process category and price type counts
    let categoryStats = {};
    let priceTypeStats = {};
    if (stats.length > 0) {
      if (stats[0].categoryCounts) {
        stats[0].categoryCounts.forEach(category => {
          categoryStats[category] = (categoryStats[category] || 0) + 1;
        });
      }
      if (stats[0].priceTypeCounts) {
        stats[0].priceTypeCounts.forEach(priceType => {
          priceTypeStats[priceType] = (priceTypeStats[priceType] || 0) + 1;
        });
      }
    }
    
    // Most popular services (by order count)
    const popularServices = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.service',
          orderCount: { $sum: 1 },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
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
      { $unwind: '$service' },
      {
        $project: {
          serviceName: '$service.name',
          serviceCategory: '$service.category',
          orderCount: 1,
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalServices: 0,
          activeServices: 0,
          averagePrice: 0
        },
        categoryBreakdown: categoryStats,
        priceTypeBreakdown: priceTypeStats,
        popularServices
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Search services
 * @route   GET /api/services/search
 * @access  Admin & Cashier
 */
const searchServices = async (req, res) => {
  try {
    const { q, limit = 10, activeOnly = true } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    let query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    };
    
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    
    const services = await Service.find(query)
      .select('name description category basePrice priceType isActive estimatedTime icon color')
      .limit(parseInt(limit))
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search services',
      error: error.message
    });
  }
};

/**
 * @desc    Duplicate a service
 * @route   POST /api/services/:id/duplicate
 * @access  Admin only
 */
const duplicateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name: newName } = req.body;
    
    const originalService = await Service.findById(id);
    if (!originalService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    if (!newName) {
      return res.status(400).json({
        success: false,
        message: 'New service name is required'
      });
    }
    
    // Check if service with new name already exists
    const existingService = await Service.findOne({ name: newName });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'A service with this name already exists'
      });
    }
    
    let duplicatedPrices = originalService.clothingPrices;
    if (duplicatedPrices instanceof Map) {
      duplicatedPrices = Object.fromEntries(duplicatedPrices);
    }

    let duplicatedPriceTypes = originalService.clothingPriceTypes;
    if (duplicatedPriceTypes instanceof Map) {
      duplicatedPriceTypes = Object.fromEntries(duplicatedPriceTypes);
    }

    const newService = await Service.create({
      name: newName,
      description: originalService.description,
      priceType: originalService.priceType,
      basePrice: originalService.basePrice,
      statuses: originalService.statuses,
      clothingPrices: duplicatedPrices,
      clothingPriceTypes: duplicatedPriceTypes,
      category: originalService.category,
      estimatedTime: originalService.estimatedTime,
      icon: originalService.icon,
      color: originalService.color,
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Service duplicated successfully',
      data: newService
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A service with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate service',
      error: error.message
    });
  }
};

/**
 * @desc    Get service price calculation preview
 * @route   POST /api/services/:id/calculate-price
 * @access  Admin & Cashier
 */
const calculateServicePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1, weight = 0, clothingCategory = 'normal_clothes' } = req.body;
    
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Helper function to get priceType for a category
    const getCategoryPriceType = (service, category) => {
      let priceTypesObj = service.clothingPriceTypes;
      if (service.clothingPriceTypes instanceof Map) {
        priceTypesObj = Object.fromEntries(service.clothingPriceTypes);
      }
      if (priceTypesObj && priceTypesObj[category]) {
        return priceTypesObj[category];
      }
      return service.priceType || 'per_piece';
    };
    
    let totalPrice = 0;
    let unitPrice = 0;
    
    // Get category-specific priceType
    const categoryPriceType = getCategoryPriceType(service, clothingCategory);
    
    // Get clothing-specific price
    // Convert Map to Object if necessary
    let pricesObj = service.clothingPrices;
    if (service.clothingPrices instanceof Map) {
      pricesObj = Object.fromEntries(service.clothingPrices);
    }
    
    // Try to get the price for the category
    const clothingPrice = pricesObj?.[clothingCategory];
    
    if (clothingPrice !== undefined && clothingPrice !== null) {
      unitPrice = Number(clothingPrice);
    } else {
      return res.status(400).json({
        success: false,
        message: `No price found for clothing category: ${clothingCategory}. Available categories: ${Object.keys(pricesObj || {}).join(', ')}`
      });
    }
    
    switch (categoryPriceType) {
      case 'per_kg':
        if (weight <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Weight must be greater than 0 for per_kg pricing'
          });
        }
        totalPrice = unitPrice * weight;
        break;
      case 'per_piece':
        if (quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Quantity must be greater than 0 for per_piece pricing'
          });
        }
        totalPrice = unitPrice * quantity;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid price type'
        });
    }
    
    res.json({
      success: true,
      data: {
        service: {
          id: service._id,
          name: service.name,
          priceType: service.priceType,
          basePrice: service.basePrice,
          clothingPrices: service.clothingPrices
        },
        calculation: {
          quantity,
          weight,
          clothingCategory,
          unitPrice,
          totalPrice: Math.round(totalPrice * 100) / 100
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate service price',
      error: error.message
    });
  }
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getServiceStatuses,
  toggleServiceStatus,
  getServiceAnalytics,
  bulkUpdateServices,
  getServiceStats,
  searchServices,
  duplicateService,
  calculateServicePrice
};
