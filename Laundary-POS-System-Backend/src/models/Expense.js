const mongoose = require('mongoose');

/**
 * Expense Model - Money going out of the business.
 *
 * Covers staff salary payments (linked to a Staff record) as well as
 * day-to-day running costs (utilities, supplies, rent, transport, ...).
 */
const EXPENSE_CATEGORIES = [
  'salary',
  'utilities',
  'rent',
  'supplies',
  'maintenance',
  'transport',
  'marketing',
  'other'
];

const EXPENSE_PAYMENT_METHODS = ['cash', 'bank_transfer', 'card', 'other'];

const expenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    unique: true,
    index: true
  },
  category: {
    type: String,
    enum: EXPENSE_CATEGORIES,
    required: [true, 'Expense category is required'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: EXPENSE_PAYMENT_METHODS,
    default: 'cash'
  },
  // Salary-specific fields
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    index: true
  },
  staffName: {
    type: String,
    trim: true
  },
  // Pay period for salary payments, stored as "YYYY-MM"
  salaryPeriod: {
    type: String,
    trim: true,
    match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Salary period must be in YYYY-MM format']
  },
  // Free-text reference: receipt / invoice / bank slip number
  reference: {
    type: String,
    trim: true,
    maxlength: [60, 'Reference cannot exceed 60 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

expenseSchema.index({ date: -1, category: 1 });

expenseSchema.statics.CATEGORIES = EXPENSE_CATEGORIES;
expenseSchema.statics.PAYMENT_METHODS = EXPENSE_PAYMENT_METHODS;

// Generate a human-readable expense number: EXP<yy><mm>-<seq>
expenseSchema.pre('save', async function(next) {
  if (this.expenseNumber) return next();

  try {
    const Counter = require('./Counter');
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const key = `expense:${year}-${month}`;

    const updated = await Counter.findOneAndUpdate(
      { key },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    this.expenseNumber = `EXP${year}${month}-${updated.seq.toString().padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Sum expenses in a date range, broken down by category.
 */
expenseSchema.statics.summarize = async function(startDate, endDate, extraMatch = {}) {
  const match = { ...extraMatch };
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = startDate;
    if (endDate) match.date.$lte = endDate;
  }

  const [result] = await this.aggregate([
    { $match: match },
    {
      $facet: {
        total: [
          { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }
        ],
        byCategory: [
          { $group: { _id: '$category', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { amount: -1 } }
        ]
      }
    }
  ]);

  return {
    totalAmount: result?.total[0]?.amount || 0,
    count: result?.total[0]?.count || 0,
    byCategory: (result?.byCategory || []).map(c => ({
      category: c._id,
      amount: c.amount,
      count: c.count
    }))
  };
};

module.exports = mongoose.model('Expense', expenseSchema);
