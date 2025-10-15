const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  weight: {
    type: Number,
    default: 0,
    min: [0, 'Weight cannot be negative']
  },
  clothingCategory: {
    type: String,
    enum: ['normal_clothes', 'bed_sheets', 'curtains', 'suits', 'jeans', 'blankets', 'towels', 'other'],
    default: 'normal_clothes'
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  estimatedTime: {
    type: Number,
    required: true,
    min: [1, 'Estimated time must be at least 1 minute']
  },
  notes: {
    type: String,
    maxLength: [200, 'Notes cannot exceed 200 characters']
  }
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'card', 'digital_wallet', 'bank_transfer', 'upi', 'cheque'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Payment amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    maxLength: [100, 'Payment notes cannot exceed 100 characters']
  },
  processedAt: {
    type: Date
  }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'Sri Lanka'
      }
    }
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: [
      'pickup',            // If pickup required - ready for pickup
      'received',          // After pickup or for self-service - items received
      'washing',          // Based on service statuses
      'drying',           // Based on service statuses
      'ironing',          // Based on service statuses
      'dry_cleaning',     // Based on service statuses
      'folding',          // Based on service statuses
      'complete',         // All services completed
      'deliver',          // If delivery required - ready for delivery
      'cancelled'         // Order cancelled
    ],
    default: 'pickup'
  },
  serviceStatuses: {
    type: [String],
    enum: ['wash', 'dry', 'iron', 'dry_clean', 'fold'],
    default: []
  },
  pickupRequired: {
    type: Boolean,
    default: false
  },
  pickupAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    notes: String
  },
  deliveryRequired: {
    type: Boolean,
    default: false
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    notes: String
  },
  actualDeliveryDate: {
    type: Date
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  // Express Service (1 Day Service)
  isExpressService: {
    type: Boolean,
    default: false
  },
  expressServiceFee: {
    type: Number,
    default: 0,
    min: [0, 'Express service fee cannot be negative']
  },
  // Discount Information (Enhanced)
  discount: {
    type: {
      type: String,
      enum: ['campaign', 'student', 'manual', 'loyalty', 'none'],
      default: 'none'
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    description: {
      type: String,
      default: ''
    },
    code: {
      type: String,
      trim: true,
      uppercase: true
    },
    isFirstOrderDiscount: {
      type: Boolean,
      default: false
    }
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  payments: [paymentSchema],
  loyaltyPointsUsed: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points used cannot be negative']
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points earned cannot be negative']
  },
  specialInstructions: {
    type: String,
    maxLength: [500, 'Special instructions cannot exceed 500 characters']
  },
  staffNotes: {
    type: String,
    maxLength: [500, 'Staff notes cannot exceed 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedStaff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  // Item confirmation tracking (for pickup orders)
  itemsConfirmed: {
    type: Boolean,
    default: false
  },
  confirmedAt: {
    type: Date
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Order lifecycle phase management
  orderPhase: {
    type: String,
    enum: ['draft', 'confirmed', 'processing', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  // Confirmation history for audit trail
  confirmationHistory: {
    estimatedTotal: Number,
    actualTotal: Number,
    difference: Number,
    confirmedAt: Date,
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  },
  // Edit permission flag
  isEditable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ pickupRequired: 1 });
orderSchema.index({ deliveryRequired: 1 });
orderSchema.index({ createdBy: 1, createdAt: -1 });
orderSchema.index({ 'customerInfo.phone': 1 });
orderSchema.index({ orderType: 1, status: 1 });
orderSchema.index({ orderPhase: 1, createdAt: -1 });

// Virtual for payment status
orderSchema.virtual('paymentStatus').get(function() {
  if (this.balanceAmount <= 0) return 'paid';
  if (this.paidAmount > 0) return 'partial';
  return 'unpaid';
});

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for estimated completion
orderSchema.virtual('estimatedCompletion').get(function() {
  const maxTime = Math.max(...this.items.map(item => item.estimatedTime));
  return new Date(this.createdAt.getTime() + (maxTime * 60 * 1000));
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.orderNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      // Generate order number with timestamp to ensure uniqueness
      const timestamp = Date.now().toString().slice(-6);
      this.orderNumber = `FL${year}${month}${day}${timestamp}`;
    }
    
    // Calculate balance amount
    this.balanceAmount = this.totalAmount - this.paidAmount;
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  }
  next();
});

// Static method to get order statistics
orderSchema.statics.getOrderStats = async function(filters = {}) {
  // Build match condition
  const matchCondition = { isDeleted: false };
  
  // Add filters
  if (filters.createdAt) {
    matchCondition.createdAt = filters.createdAt;
  }
  if (filters.status) {
    matchCondition.status = filters.status;
  }
  
  console.log('getOrderStats matchCondition:', matchCondition);
  
  const pipeline = [
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
        paidOrders: {
          $sum: {
            $cond: [{ $lte: ['$balanceAmount', 0] }, 1, 0]
          }
        },
        pendingOrders: {
          $sum: {
            $cond: [{ $gt: ['$balanceAmount', 0] }, 1, 0]
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  console.log('getOrderStats result:', result);
  
  return result[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    paidOrders: 0,
    pendingOrders: 0
  };
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = async function() {
  return this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Instance method to update order status
orderSchema.methods.updateStatus = function(newStatus, staffId = null, notes = '') {
  this.status = newStatus;
  
  if (staffId && !this.assignedStaff.includes(staffId)) {
    this.assignedStaff.push(staffId);
  }
  
  if (notes) {
    this.staffNotes = this.staffNotes ? `${this.staffNotes}\n${notes}` : notes;
  }
  
  return this.save();
};

// Instance method to add payment
orderSchema.methods.addPayment = function(paymentData) {
  this.payments.push(paymentData);
  this.paidAmount += paymentData.amount;
  this.balanceAmount = this.totalAmount - this.paidAmount;
  return this.save();
};

// Instance method to calculate loyalty points
orderSchema.methods.calculateLoyaltyPoints = function(pointsPerRupee = 1) {
  this.loyaltyPointsEarned = Math.floor(this.totalAmount * pointsPerRupee);
  return this.loyaltyPointsEarned;
};

/**
 * Apply discount to order
 * @param {Object} discountInfo - Discount information from customer.getApplicableDiscount()
 */
orderSchema.methods.applyDiscount = function(discountInfo) {
  if (!discountInfo || discountInfo.percentage === 0) {
    // No discount
    this.discount = {
      type: 'none',
      percentage: 0,
      amount: 0,
      description: 'No Discount',
      code: null,
      isFirstOrderDiscount: false
    };
    this.discountAmount = 0;
    return;
  }

  // Calculate discount amount
  const discountAmount = (this.subtotal * discountInfo.percentage) / 100;

  // Set discount information
  this.discount = {
    type: discountInfo.type,
    percentage: discountInfo.percentage,
    amount: discountAmount,
    description: discountInfo.description,
    code: discountInfo.code,
    isFirstOrderDiscount: discountInfo.type === 'campaign'
  };
  
  this.discountAmount = discountAmount;
};

/**
 * Recalculate order totals with discount
 */
orderSchema.methods.recalculateTotal = function() {
  // Calculate subtotal from items
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }
  
  // Calculate total with discount and tax
  this.totalAmount = this.subtotal - this.discountAmount + this.taxAmount;
  this.balanceAmount = this.totalAmount - this.paidAmount;
  
  return this.totalAmount;
};

// Instance method to check if order can be edited
orderSchema.methods.canEdit = function() {
  // Cannot edit if processing started
  if (this.orderPhase === 'processing' || this.orderPhase === 'completed') {
    return { allowed: false, reason: 'Order is already being processed or completed' };
  }
  
  // Cannot edit if cancelled
  if (this.orderPhase === 'cancelled') {
    return { allowed: false, reason: 'Order is cancelled' };
  }
  
  // Cannot edit if payment made
  if (this.paidAmount > 0) {
    return { allowed: false, reason: 'Payment already received. Refund payment to edit.' };
  }
  
  // Can edit draft phase freely
  if (this.orderPhase === 'draft') {
    return { allowed: true };
  }
  
  // Can edit confirmed phase only if no payment
  if (this.orderPhase === 'confirmed' && this.paidAmount === 0) {
    return { allowed: true, warning: 'Order is confirmed. Edit will require re-confirmation.' };
  }
  
  return { allowed: false, reason: 'Order cannot be edited in current state' };
};

// Instance method to check if order can be confirmed
orderSchema.methods.canConfirm = function() {
  if (this.orderPhase !== 'draft') {
    return { allowed: false, reason: 'Order is not in draft phase' };
  }
  if (!this.pickupRequired) {
    return { allowed: false, reason: 'Walk-in orders are auto-confirmed' };
  }
  if (this.itemsConfirmed) {
    return { allowed: false, reason: 'Order already confirmed' };
  }
  return { allowed: true };
};

// Instance method to transition order phase
orderSchema.methods.transitionPhase = function(newPhase, reason = '') {
  const validTransitions = {
    draft: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };

  const allowedPhases = validTransitions[this.orderPhase] || [];
  
  if (!allowedPhases.includes(newPhase)) {
    throw new Error(`Cannot transition from ${this.orderPhase} to ${newPhase}`);
  }

  const oldPhase = this.orderPhase;
  this.orderPhase = newPhase;
  
  // Update isEditable flag
  this.isEditable = (newPhase === 'draft' || (newPhase === 'confirmed' && this.paidAmount === 0));
  
  // Log transition if needed
  console.log(`Order ${this.orderNumber}: ${oldPhase} → ${newPhase}${reason ? ` (${reason})` : ''}`);
  
  return this;
};

module.exports = mongoose.model('Order', orderSchema);