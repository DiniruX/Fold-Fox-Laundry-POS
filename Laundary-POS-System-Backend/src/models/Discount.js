const mongoose = require('mongoose');

/**
 * Discount Model - Promotions / offers managed by admins.
 *
 * A discount is "live" when it is active and today's date falls between
 * startDate and endDate (endDate is optional: open-ended offer).
 * `customerType` restricts who the offer applies to.
 */
const DISCOUNT_TYPES = ['percentage', 'fixed'];

const DISCOUNT_CUSTOMER_TYPES = [
  'all',       // every customer
  'student',   // customer.isStudent
  'new',       // customer has not completed a first order yet
  'regular',   // customer has completed at least one order
  'campaign'   // customer registered through the landing-page campaign
];

const discountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Discount name is required'],
    trim: true,
    maxlength: [80, 'Discount name cannot exceed 80 characters']
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Code cannot exceed 20 characters'],
    match: [/^[A-Z0-9_-]*$/, 'Code may only contain letters, numbers, - and _']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  type: {
    type: String,
    enum: DISCOUNT_TYPES,
    default: 'percentage'
  },
  // Percentage (0-100) when type = percentage, LKR amount when type = fixed
  value: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  // Optional cap for percentage discounts (LKR)
  maxDiscountAmount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative']
  },
  // Optional minimum order subtotal (LKR) for the offer to apply
  minOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date
  },
  customerType: {
    type: String,
    enum: DISCOUNT_CUSTOMER_TYPES,
    default: 'all'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

discountSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
discountSchema.index({ code: 1 }, { unique: true, sparse: true });

discountSchema.statics.TYPES = DISCOUNT_TYPES;
discountSchema.statics.CUSTOMER_TYPES = DISCOUNT_CUSTOMER_TYPES;

discountSchema.pre('validate', function(next) {
  if (this.code === '') this.code = undefined;
  if (this.type === 'percentage' && this.value > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    return next(new Error('End date must be after the start date'));
  }
  next();
});

/**
 * Lifecycle status derived from the active flag and the date window.
 * inactive | scheduled | active | expired
 */
discountSchema.virtual('status').get(function() {
  const now = new Date();
  if (!this.isActive) return 'inactive';
  if (this.startDate && this.startDate > now) return 'scheduled';
  if (this.endDate && this.endDate < now) return 'expired';
  return 'active';
});

discountSchema.methods.isLive = function(at = new Date()) {
  if (!this.isActive) return false;
  if (this.startDate && this.startDate > at) return false;
  if (this.endDate && this.endDate < at) return false;
  return true;
};

/**
 * Does this offer apply to the given customer document?
 */
discountSchema.methods.appliesToCustomer = function(customer) {
  if (!customer) return this.customerType === 'all';
  switch (this.customerType) {
    case 'student':
      return !!customer.isStudent;
    case 'new':
      return !customer.firstOrderCompleted;
    case 'regular':
      return !!customer.firstOrderCompleted;
    case 'campaign':
      return !!customer.registeredViaCampaign;
    case 'all':
    default:
      return true;
  }
};

/**
 * Discount amount for a given order subtotal (never more than the subtotal).
 */
discountSchema.methods.calculateAmount = function(subtotal) {
  const base = Number(subtotal) || 0;
  if (base <= 0) return 0;
  if (this.minOrderAmount && base < this.minOrderAmount) return 0;

  let amount = this.type === 'percentage'
    ? (base * this.value) / 100
    : this.value;

  if (this.type === 'percentage' && this.maxDiscountAmount > 0) {
    amount = Math.min(amount, this.maxDiscountAmount);
  }

  amount = Math.min(amount, base);
  return Math.round(amount * 100) / 100;
};

module.exports = mongoose.model('Discount', discountSchema);
