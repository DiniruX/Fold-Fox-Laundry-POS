const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Staff = require('../models/Staff');

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const pickExpenseFields = (body) => {
  const data = {};
  if (body.category !== undefined) data.category = body.category;
  if (body.description !== undefined) data.description = String(body.description || '').trim();
  if (body.amount !== undefined) data.amount = Number(body.amount);
  if (body.date !== undefined) data.date = body.date ? new Date(body.date) : new Date();
  if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod;
  if (body.staff !== undefined) data.staff = body.staff || null;
  if (body.salaryPeriod !== undefined) data.salaryPeriod = body.salaryPeriod || undefined;
  if (body.reference !== undefined) data.reference = String(body.reference || '').trim();
  if (body.notes !== undefined) data.notes = String(body.notes || '').trim();
  return data;
};

/**
 * Validate and enrich an expense payload. Resolves the staff name for salary
 * payments and fills a default description.
 * @returns {string|null} error message
 */
const prepareExpense = async (data, existing = null) => {
  const category = data.category ?? existing?.category;
  const amount = data.amount ?? existing?.amount;

  if (!category || !Expense.CATEGORIES.includes(category)) {
    return `Category must be one of: ${Expense.CATEGORIES.join(', ')}`;
  }
  if (amount === undefined || Number.isNaN(amount) || amount <= 0) {
    return 'Amount must be greater than 0';
  }
  if (data.date && Number.isNaN(data.date.getTime())) {
    return 'Invalid date';
  }
  if (data.paymentMethod && !Expense.PAYMENT_METHODS.includes(data.paymentMethod)) {
    return `Payment method must be one of: ${Expense.PAYMENT_METHODS.join(', ')}`;
  }

  if (category === 'salary') {
    const staffId = data.staff ?? existing?.staff;
    if (!staffId || !mongoose.Types.ObjectId.isValid(staffId)) {
      return 'A staff member is required for salary payments';
    }
    const staff = await Staff.findById(staffId).select('personalInfo.firstName personalInfo.lastName employeeId');
    if (!staff) {
      return 'Staff member not found';
    }
    data.staff = staff._id;
    data.staffName = `${staff.personalInfo.firstName} ${staff.personalInfo.lastName}`.trim();
    if (!data.description && !existing?.description) {
      const period = data.salaryPeriod ?? existing?.salaryPeriod;
      data.description = `Salary - ${data.staffName}${period ? ` (${period})` : ''}`;
    }
  } else {
    // Non-salary expenses never carry staff / period data
    data.staff = undefined;
    data.staffName = undefined;
    data.salaryPeriod = undefined;
    if (!data.description && !existing?.description) {
      return 'Description is required';
    }
  }

  return null;
};

/**
 * @desc    List expenses with filters, pagination and a period summary
 * @route   GET /api/expenses
 * @access  Private (Admin only)
 */
const getExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      staffId,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (category && Expense.CATEGORIES.includes(category)) filter.category = category;
    if (staffId && mongoose.Types.ObjectId.isValid(staffId)) filter.staff = staffId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = endOfDay(new Date(endDate));
    }
    if (search) {
      filter.$or = [
        { expenseNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { staffName: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const sort = { [sortBy === 'amount' ? 'amount' : sortBy === 'createdAt' ? 'createdAt' : 'date']: sortOrder === 'asc' ? 1 : -1, _id: -1 };

    const [expenses, total, filteredSummary] = await Promise.all([
      Expense.find(filter)
        .populate('staff', 'employeeId personalInfo.firstName personalInfo.lastName employmentInfo.position')
        .populate('recordedBy', 'name')
        .sort(sort)
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Expense.countDocuments(filter),
      Expense.summarize(filter.date?.$gte, filter.date?.$lte, (({ date, ...rest }) => rest)(filter))
    ]);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / pageSize),
          totalExpenses: total,
          hasNext: pageNum * pageSize < total,
          hasPrev: pageNum > 1
        },
        summary: filteredSummary,
        categories: Expense.CATEGORIES,
        paymentMethods: Expense.PAYMENT_METHODS
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
};

/**
 * @desc    Headline numbers: today, this month, last month, month by category
 * @route   GET /api/expenses/summary
 * @access  Private (Admin only)
 */
const getExpenseSummary = async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);

    const [today, thisMonth, lastMonth] = await Promise.all([
      Expense.summarize(startOfDay(now), endOfDay(now)),
      Expense.summarize(thisMonthStart, null),
      Expense.summarize(lastMonthStart, lastMonthEnd)
    ]);

    const salaryThisMonth = thisMonth.byCategory.find(c => c.category === 'salary')?.amount || 0;

    res.json({
      success: true,
      data: {
        today: today.totalAmount,
        todayCount: today.count,
        thisMonth: thisMonth.totalAmount,
        thisMonthCount: thisMonth.count,
        thisMonthSalaries: salaryThisMonth,
        thisMonthOther: thisMonth.totalAmount - salaryThisMonth,
        lastMonth: lastMonth.totalAmount,
        byCategory: thisMonth.byCategory
      }
    });
  } catch (error) {
    console.error('Expense summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expense summary' });
  }
};

/**
 * @desc    Get a single expense
 * @route   GET /api/expenses/:id
 * @access  Private (Admin only)
 */
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('staff', 'employeeId personalInfo.firstName personalInfo.lastName employmentInfo.position employmentInfo.salary')
      .populate('recordedBy', 'name')
      .populate('updatedBy', 'name');
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, data: { expense } });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expense' });
  }
};

/**
 * @desc    Record an expense
 * @route   POST /api/expenses
 * @access  Private (Admin only)
 */
const createExpense = async (req, res) => {
  try {
    const data = pickExpenseFields(req.body);
    if (!data.date) data.date = new Date();

    const error = await prepareExpense(data);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const expense = await Expense.create({ ...data, recordedBy: req.user._id });
    const populated = await Expense.findById(expense._id)
      .populate('staff', 'employeeId personalInfo.firstName personalInfo.lastName')
      .populate('recordedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Expense recorded',
      data: { expense: populated }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to record expense' });
  }
};

/**
 * @desc    Update an expense
 * @route   PUT /api/expenses/:id
 * @access  Private (Admin only)
 */
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const data = pickExpenseFields(req.body);
    const error = await prepareExpense(data, expense);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    Object.keys(data).forEach(key => {
      expense[key] = data[key];
    });
    expense.updatedBy = req.user._id;
    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('staff', 'employeeId personalInfo.firstName personalInfo.lastName')
      .populate('recordedBy', 'name');

    res.json({ success: true, message: 'Expense updated', data: { expense: populated } });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update expense' });
  }
};

/**
 * @desc    Delete an expense
 * @route   DELETE /api/expenses/:id
 * @access  Private (Admin only)
 */
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    await expense.deleteOne();
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
};

module.exports = {
  getExpenses,
  getExpenseSummary,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense
};
