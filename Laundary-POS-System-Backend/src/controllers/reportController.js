const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const Expense = require('../models/Expense');
const ExcelJS = require('exceljs');

/**
 * Timezone handling: the browser sends ?tz=<getTimezoneOffset()> (minutes, e.g. -330
 * for Sri Lanka). Dates picked in the UI are interpreted in that zone so a "day"
 * in a report matches the user's calendar day even when the server runs in UTC.
 */
const parseTzOffset = (tz) => {
  const n = parseInt(tz, 10);
  if (Number.isNaN(n) || n < -840 || n > 840) return null;
  return n;
};

// "+05:30" style string for MongoDB date operators
const tzString = (tz) => {
  const offset = parseTzOffset(tz);
  if (offset === null) return undefined;
  const total = -offset; // getTimezoneOffset is minutes *behind* UTC
  const sign = total >= 0 ? '+' : '-';
  const abs = Math.abs(total);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
};

const BARE_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Local midnight / end-of-day for a bare YYYY-MM-DD in the user's zone
const dayBoundary = (dateStr, tz, endOfDay) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const offset = parseTzOffset(tz);
  if (offset === null) {
    return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d);
  }
  const utc = endOfDay ? Date.UTC(y, m - 1, d, 23, 59, 59, 999) : Date.UTC(y, m - 1, d);
  return new Date(utc + offset * 60000);
};

/**
 * Build a createdAt/date filter from ?startDate&endDate(&tz).
 * Either bound may be given alone; the end bound covers the whole end day.
 */
const buildDateRange = (startDate, endDate, tz) => {
  const range = {};
  if (startDate) {
    const start = BARE_DATE.test(String(startDate)) ? dayBoundary(startDate, tz, false) : new Date(startDate);
    if (!Number.isNaN(start.getTime())) range.$gte = start;
  }
  if (endDate) {
    const end = BARE_DATE.test(String(endDate)) ? dayBoundary(endDate, tz, true) : new Date(endDate);
    if (!Number.isNaN(end.getTime())) range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
};

const periodGroupFormat = (groupBy, field = '$createdAt', tz) => {
  const timezone = tzString(tz);
  const dateExpr = timezone ? { date: field, timezone } : field;
  switch (groupBy) {
    case 'week':
      return { year: { $isoWeekYear: dateExpr }, week: { $isoWeek: dateExpr } };
    case 'month':
      return { year: { $year: dateExpr }, month: { $month: dateExpr } };
    case 'day':
    default:
      return { year: { $year: dateExpr }, month: { $month: dateExpr }, day: { $dayOfMonth: dateExpr } };
  }
};

const formatPeriodKey = (id, groupBy) => {
  if (groupBy === 'week') return `${id.year}-W${String(id.week).padStart(2, '0')}`;
  if (groupBy === 'month') return `${id.year}-${String(id.month).padStart(2, '0')}`;
  return `${id.year}-${String(id.month).padStart(2, '0')}-${String(id.day).padStart(2, '0')}`;
};

const styleHeaderRow = (worksheet) => {
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
};

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Today's stats
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: startOfDay },
      isDeleted: { $ne: true }
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
      createdAt: { $gte: startOfMonth },
      isDeleted: { $ne: true }
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
    const totalCustomers = await Customer.countDocuments({});
    
    // Pending orders
    const pendingOrders = await Order.countDocuments({
      status: { $nin: ['deliver', 'complete'] },
      orderPhase: { $ne: 'cancelled' },
      isDeleted: { $ne: true }
    });

    // Deliveries due today (scheduled delivery orders not yet completed)
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const todayDeliveries = await Order.countDocuments({
      deliveryRequired: true,
      expectedDeliveryDate: { $gte: startOfDay, $lte: endOfToday },
      status: { $ne: 'complete' },
      orderPhase: { $ne: 'cancelled' },
      isDeleted: { $ne: true }
    });

    // Expenses (admin-only figure; cashiers simply don't render it)
    let todayExpenses = 0;
    let monthExpenses = 0;
    if (req.user?.role === 'admin') {
      const [todayExp, monthExp] = await Promise.all([
        Expense.summarize(startOfDay, null),
        Expense.summarize(startOfMonth, null)
      ]);
      todayExpenses = todayExp.totalAmount;
      monthExpenses = monthExp.totalAmount;
    }

    res.json({
      success: true,
      stats: {
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthOrders,
        monthRevenue: monthRevenue[0]?.total || 0,
        totalCustomers,
        pendingOrders,
        todayExpenses,
        monthExpenses,
        todayDeliveries
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
    
    
    let matchStage = { 
      balanceAmount: { $lte: 0 },  // Only include fully paid orders
      isDeleted: { $ne: true }
    };
    
    const dateRange = buildDateRange(startDate, endDate, req.query.tz);
    if (dateRange) matchStage.createdAt = dateRange;
    
    const groupFormat = periodGroupFormat(groupBy, '$createdAt', req.query.tz);
    
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
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } }
    ]);
    
    
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
    
    let matchStage = { isDeleted: { $ne: true } };
    
    const dateRange = buildDateRange(startDate, endDate, req.query.tz);
    if (dateRange) matchStage.createdAt = dateRange;
    
    const statusData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
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
    
    let matchStage = { isDeleted: { $ne: true } };
    
    const dateRange = buildDateRange(startDate, endDate, req.query.tz);
    if (dateRange) matchStage.createdAt = dateRange;
    
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
    
    let matchStage = { isDeleted: { $ne: true } };
    
    const dateRange = buildDateRange(startDate, endDate, req.query.tz);
    if (dateRange) matchStage.createdAt = dateRange;
    
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
          serviceCategory: { $first: { $reduce: { input: '$service.statuses', initialValue: '', in: { $concat: ['$$value', { $cond: [{ $eq: ['$$value', ''] }, '', ' + '] }, '$$this'] } } } },
          totalQuantity: { $sum: '$items.quantity' },
          totalWeight: { $sum: '$items.weight' },
          totalRevenue: { $sum: '$items.totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Revenue split by clothing category (what the customer actually brought in)
    const categoryData = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: { $ifNull: ['$items.clothingCategory', 'normal_clothes'] },
          totalRevenue: { $sum: '$items.totalPrice' },
          totalQuantity: { $sum: '$items.quantity' },
          totalWeight: { $sum: '$items.weight' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    res.json({
      success: true,
      serviceData,
      categoryData
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
    
    const dateRange = buildDateRange(startDate, endDate, req.query.tz);
    if (dateRange) matchStage.createdAt = dateRange;
    
    const groupFormat = periodGroupFormat(groupBy, '$createdAt', req.query.tz);
    
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
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } }
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
      worksheet.addRow({
        period: formatPeriodKey(item._id, groupBy),
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
    
    let matchStage = { isDeleted: { $ne: true } };
    
    const dateRange = buildDateRange(startDate, endDate, req.query.tz);
    if (dateRange) matchStage.createdAt = dateRange;
    
    const statusData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
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
    
    let matchStage = { isDeleted: { $ne: true } };
    
    const dateRange = buildDateRange(startDate, endDate, req.query.tz);
    if (dateRange) matchStage.createdAt = dateRange;
    
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
    
    let matchStage = { isDeleted: { $ne: true } };
    
    const dateRange = buildDateRange(startDate, endDate, req.query.tz);
    if (dateRange) matchStage.createdAt = dateRange;
    
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
          serviceCategory: { $first: { $reduce: { input: '$service.statuses', initialValue: '', in: { $concat: ['$$value', { $cond: [{ $eq: ['$$value', ''] }, '', ' + '] }, '$$this'] } } } },
          totalQuantity: { $sum: '$items.quantity' },
          totalWeight: { $sum: '$items.weight' },
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
      { header: 'Process Steps', key: 'serviceCategory', width: 20 },
      { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
      { header: 'Total Weight (kg)', key: 'totalWeight', width: 18 },
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
        totalWeight: Number(item.totalWeight || 0).toFixed(2),
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

/**
 * Income vs expenses for a period.
 * Income = payments actually received (completed payments, by payment date).
 * Expenses = Expense records (by expense date).
 */
const computeIncomeExpense = async ({ startDate, endDate, groupBy = 'day', tz }) => {
  const dateRange = buildDateRange(startDate, endDate, tz);

  // --- Income: completed payments on non-deleted orders ---
  const paymentMatch = { 'payments.status': 'completed' };
  if (dateRange) paymentMatch['payments.processedAt'] = dateRange;

  const paymentPipelineBase = [
    { $match: { isDeleted: { $ne: true }, 'payments.0': { $exists: true } } },
    { $unwind: '$payments' },
    // Older payments may lack processedAt; fall back to the payment's createdAt
    { $addFields: { 'payments.processedAt': { $ifNull: ['$payments.processedAt', '$payments.createdAt'] } } },
    { $match: paymentMatch }
  ];

  const [incomeByPeriod, incomeByMethod, incomeLedger] = await Promise.all([
    Order.aggregate([
      ...paymentPipelineBase,
      { $group: { _id: periodGroupFormat(groupBy, '$payments.processedAt', tz), income: { $sum: '$payments.amount' }, count: { $sum: 1 } } }
    ]),
    Order.aggregate([
      ...paymentPipelineBase,
      { $group: { _id: '$payments.method', amount: { $sum: '$payments.amount' }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } }
    ]),
    Order.aggregate([
      ...paymentPipelineBase,
      {
        $project: {
          _id: 0,
          type: { $literal: 'income' },
          date: '$payments.processedAt',
          reference: '$orderNumber',
          description: { $concat: ['Payment - ', { $ifNull: ['$customerInfo.name', 'Customer'] }] },
          category: '$payments.method',
          amount: '$payments.amount',
          orderId: '$_id'
        }
      },
      { $sort: { date: -1 } },
      { $limit: 500 }
    ])
  ]);

  // --- Expenses ---
  const expenseMatch = {};
  if (dateRange) expenseMatch.date = dateRange;

  const [expenseByPeriod, expenseByCategory, expenseLedger] = await Promise.all([
    Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: periodGroupFormat(groupBy, '$date', tz), expenses: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: '$category', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } }
    ]),
    Expense.find(expenseMatch).sort({ date: -1 }).limit(500).lean()
  ]);

  // --- Merge periods ---
  const periods = new Map();
  const ensure = (id) => {
    const key = formatPeriodKey(id, groupBy);
    if (!periods.has(key)) periods.set(key, { period: key, income: 0, expenses: 0, payments: 0, expenseEntries: 0 });
    return periods.get(key);
  };
  incomeByPeriod.forEach(p => { const row = ensure(p._id); row.income += p.income; row.payments += p.count; });
  expenseByPeriod.forEach(p => { const row = ensure(p._id); row.expenses += p.expenses; row.expenseEntries += p.count; });
  const periodRows = [...periods.values()]
    .map(r => ({ ...r, income: Math.round(r.income * 100) / 100, expenses: Math.round(r.expenses * 100) / 100, net: Math.round((r.income - r.expenses) * 100) / 100 }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const totalIncome = Math.round(periodRows.reduce((s, r) => s + r.income, 0) * 100) / 100;
  const totalExpenses = Math.round(periodRows.reduce((s, r) => s + r.expenses, 0) * 100) / 100;

  const ledger = [
    ...incomeLedger,
    ...expenseLedger.map(e => ({
      type: 'expense',
      date: e.date,
      reference: e.expenseNumber,
      description: e.description,
      category: e.category,
      amount: e.amount,
      expenseId: e._id,
      staffName: e.staffName,
      paymentMethod: e.paymentMethod
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    summary: {
      totalIncome,
      totalExpenses,
      net: Math.round((totalIncome - totalExpenses) * 100) / 100,
      margin: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 10000) / 100 : 0,
      paymentCount: incomeByMethod.reduce((s, m) => s + m.count, 0),
      expenseCount: expenseByCategory.reduce((s, c) => s + c.count, 0)
    },
    periods: periodRows,
    incomeByMethod: incomeByMethod.map(m => ({ method: m._id, amount: m.amount, count: m.count })),
    expensesByCategory: expenseByCategory.map(c => ({ category: c._id, amount: c.amount, count: c.count })),
    ledger
  };
};

const getIncomeExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day', tz } = req.query;
    const data = await computeIncomeExpense({ startDate, endDate, groupBy, tz });
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch income & expense report',
      error: error.message
    });
  }
};

const exportIncomeExpenseToExcel = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day', tz } = req.query;
    const data = await computeIncomeExpense({ startDate, endDate, groupBy, tz });

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: summary + periods
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Period', key: 'period', width: 16 },
      { header: 'Income', key: 'income', width: 16 },
      { header: 'Expenses', key: 'expenses', width: 16 },
      { header: 'Net', key: 'net', width: 16 },
      { header: 'Payments', key: 'payments', width: 12 },
      { header: 'Expense Entries', key: 'expenseEntries', width: 16 }
    ];
    styleHeaderRow(summarySheet);
    data.periods.forEach(p => summarySheet.addRow({
      period: p.period,
      income: p.income.toFixed(2),
      expenses: p.expenses.toFixed(2),
      net: p.net.toFixed(2),
      payments: p.payments,
      expenseEntries: p.expenseEntries
    }));
    const totalRow = summarySheet.addRow({
      period: 'TOTAL',
      income: data.summary.totalIncome.toFixed(2),
      expenses: data.summary.totalExpenses.toFixed(2),
      net: data.summary.net.toFixed(2),
      payments: data.summary.paymentCount,
      expenseEntries: data.summary.expenseCount
    });
    totalRow.font = { bold: true };

    // Sheet 2: expenses by category
    const categorySheet = workbook.addWorksheet('Expenses by Category');
    categorySheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Amount', key: 'amount', width: 16 },
      { header: 'Entries', key: 'count', width: 12 }
    ];
    styleHeaderRow(categorySheet);
    data.expensesByCategory.forEach(c => categorySheet.addRow({ category: c.category, amount: c.amount.toFixed(2), count: c.count }));

    // Sheet 3: ledger
    const ledgerSheet = workbook.addWorksheet('Ledger');
    ledgerSheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Reference', key: 'reference', width: 18 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Category / Method', key: 'category', width: 18 },
      { header: 'Income', key: 'income', width: 14 },
      { header: 'Expense', key: 'expense', width: 14 }
    ];
    styleHeaderRow(ledgerSheet);
    data.ledger.forEach(entry => ledgerSheet.addRow({
      date: new Date(entry.date).toISOString().slice(0, 16).replace('T', ' '),
      type: entry.type,
      reference: entry.reference,
      description: entry.description,
      category: entry.category,
      income: entry.type === 'income' ? entry.amount.toFixed(2) : '',
      expense: entry.type === 'expense' ? entry.amount.toFixed(2) : ''
    }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=income-expense-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export income & expense report',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getRevenueReport,
  getIncomeExpenseReport,
  exportIncomeExpenseToExcel,
  getOrderStatusReport,
  getCustomerReport,
  getServiceReport,
  exportRevenueToExcel,
  exportOrderStatusToExcel,
  exportCustomerToExcel,
  exportServiceToExcel
};
