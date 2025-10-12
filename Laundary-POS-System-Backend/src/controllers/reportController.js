const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const ExcelJS = require('exceljs');

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Today's stats
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: startOfDay }
    });
    
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay },
          balanceAmount: { $lte: 0 },  // Only include fully paid orders
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // This month's stats
    const monthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    const monthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          balanceAmount: { $lte: 0 },  // Only include fully paid orders
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // Total customers
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    
    // Pending orders
    const pendingOrders = await Order.countDocuments({
      orderStatus: { $nin: ['delivered', 'cancelled'] }
    });
    
    res.json({
      success: true,
      stats: {
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthOrders,
        monthRevenue: monthRevenue[0]?.total || 0,
        totalCustomers,
        pendingOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};

const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    // DEBUG: Log incoming parameters
    console.log('📊 Revenue Report Request:');
    console.log('   Query params:', req.query);
    console.log('   startDate:', startDate);
    console.log('   endDate:', endDate);
    console.log('   groupBy:', groupBy);
    
    let matchStage = { 
      balanceAmount: { $lte: 0 },  // Only include fully paid orders
      isDeleted: { $ne: true }
    };
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
      console.log('   Date filter applied:', matchStage.createdAt);
    } else {
      console.log('   No date filter applied');
    }
    
    console.log('   Match stage:', JSON.stringify(matchStage, null, 2));
    
    let groupFormat;
    switch (groupBy) {
      case 'day':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }
    
    const revenueData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormat,
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // DEBUG: Log results
    console.log('   Query results:', revenueData.length, 'periods found');
    console.log('   Revenue data:', JSON.stringify(revenueData, null, 2));
    console.log('─'.repeat(80));
    
    res.json({
      success: true,
      revenueData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue report',
      error: error.message
    });
  }
};

const getOrderStatusReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const statusData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      statusData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order status report',
      error: error.message
    });
  }
};

const getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    let matchStage = {};
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const customerData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$customer',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          customerName: '$customer.fullName',
          phoneNumber: '$customer.phoneNumber',
          totalOrders: 1,
          totalSpent: 1,
          averageOrderValue: 1
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: Math.min(parseInt(limit) || 10, 100) }
    ]);
    
    res.json({
      success: true,
      customerData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer report',
      error: error.message
    });
  }
};

const getServiceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const serviceData = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'services',
          localField: 'items.service',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      {
        $group: {
          _id: '$service._id',
          serviceName: { $first: '$service.name' },
          serviceCategory: { $first: '$service.category' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    res.json({
      success: true,
      serviceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service report',
      error: error.message
    });
  }
};

// Excel Export Functions
const exportRevenueToExcel = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    let matchStage = { 
      balanceAmount: { $lte: 0 },  // Only include fully paid orders
      isDeleted: { $ne: true }
    };
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    let groupFormat;
    switch (groupBy) {
      case 'day':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }
    
    const revenueData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormat,
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Revenue Report');
    
    // Add headers
    worksheet.columns = [
      { header: 'Period', key: 'period', width: 20 },
      { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
      { header: 'Order Count', key: 'orderCount', width: 15 },
      { header: 'Average Order Value', key: 'averageOrderValue', width: 20 }
    ];
    
    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Add data
    revenueData.forEach(item => {
      let period = '';
      if (groupBy === 'day') {
        period = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        period = `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`;
      } else {
        period = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      }
      
      worksheet.addRow({
        period,
        totalRevenue: item.totalRevenue.toFixed(2),
        orderCount: item.orderCount,
        averageOrderValue: item.averageOrderValue.toFixed(2)
      });
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.xlsx');
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export revenue report',
      error: error.message
    });
  }
};

const exportOrderStatusToExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const statusData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Order Status Report');
    
    // Add headers
    worksheet.columns = [
      { header: 'Order Status', key: 'status', width: 20 },
      { header: 'Count', key: 'count', width: 15 }
    ];
    
    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Add data
    statusData.forEach(item => {
      worksheet.addRow({
        status: item._id || 'Unknown',
        count: item.count
      });
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=order-status-report.xlsx');
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export order status report',
      error: error.message
    });
  }
};

const exportCustomerToExcel = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    let matchStage = {};
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const customerData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$customer',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          customerName: '$customer.fullName',
          phoneNumber: '$customer.phoneNumber',
          email: '$customer.email',
          totalOrders: 1,
          totalSpent: 1,
          averageOrderValue: 1
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: Math.min(parseInt(limit) || 100, 1000) }
    ]);
    
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customer Report');
    
    // Add headers
    worksheet.columns = [
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Phone Number', key: 'phoneNumber', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Total Orders', key: 'totalOrders', width: 15 },
      { header: 'Total Spent', key: 'totalSpent', width: 15 },
      { header: 'Average Order Value', key: 'averageOrderValue', width: 20 }
    ];
    
    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Add data
    customerData.forEach(item => {
      worksheet.addRow({
        customerName: item.customerName,
        phoneNumber: item.phoneNumber,
        email: item.email || 'N/A',
        totalOrders: item.totalOrders,
        totalSpent: item.totalSpent.toFixed(2),
        averageOrderValue: item.averageOrderValue.toFixed(2)
      });
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customer-report.xlsx');
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export customer report',
      error: error.message
    });
  }
};

const exportServiceToExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const serviceData = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'services',
          localField: 'items.service',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      {
        $group: {
          _id: '$service._id',
          serviceName: { $first: '$service.name' },
          serviceCategory: { $first: '$service.category' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Service Report');
    
    // Add headers
    worksheet.columns = [
      { header: 'Service Name', key: 'serviceName', width: 30 },
      { header: 'Category', key: 'serviceCategory', width: 20 },
      { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
      { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
      { header: 'Order Count', key: 'orderCount', width: 15 }
    ];
    
    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Add data
    serviceData.forEach(item => {
      worksheet.addRow({
        serviceName: item.serviceName,
        serviceCategory: item.serviceCategory,
        totalQuantity: item.totalQuantity,
        totalRevenue: item.totalRevenue.toFixed(2),
        orderCount: item.orderCount
      });
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=service-report.xlsx');
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export service report',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getRevenueReport,
  getOrderStatusReport,
  getCustomerReport,
  getServiceReport,
  exportRevenueToExcel,
  exportOrderStatusToExcel,
  exportCustomerToExcel,
  exportServiceToExcel
};
