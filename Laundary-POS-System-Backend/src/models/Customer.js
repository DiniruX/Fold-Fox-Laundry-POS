const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number'],
    index: true
  },
  address: {
    street: String,
    city: String,
    country: {
      type: String,
      default: 'Sri Lanka'
    }
  },
  campusId: {
    type: String,
    trim: true,
    uppercase: true
  },
  isStudent: {
    type: Boolean,
    default: false
  },
  studentId: {
    type: String,
    trim: true,
    uppercase: true
  },
  university: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Allow empty string or valid email format
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  // Campaign & Discount Tracking
  registeredViaCampaign: {
    type: Boolean,
    default: false,
    index: true
  },
  campaignCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  campaignRegistrationDate: {
    type: Date
  },
  firstOrderCompleted: {
    type: Boolean,
    default: false,
    index: true
  },
  firstOrderDate: {
    type: Date
  },
  firstOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  eligibleForCampaignDiscount: {
    type: Boolean,
    default: false,
    index: true
  },
  eligibleForStudentDiscount: {
    type: Boolean,
    default: false,
    index: true
  },
  registrationSource: {
    type: String,
    enum: ['landing_page', 'pos_system', 'walk_in', 'phone'],
    default: 'pos_system'
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  notes: String
}, {
  timestamps: true
});

// Index for faster searches
customerSchema.index({ campusId: 1 });
customerSchema.index({ fullName: 'text' });

/**
 * Get applicable discount for customer
 * Priority: Campaign (20%) > Student (10%) > None (0%)
 */
customerSchema.methods.getApplicableDiscount = function() {
  // First order with campaign discount (highest priority)
  if (!this.firstOrderCompleted && this.eligibleForCampaignDiscount) {
    return {
      type: 'campaign',
      percentage: 20,
      description: 'Campaign Discount - First Order (20% OFF)',
      isOneTime: true,
      code: this.campaignCode || 'CAMPAIGN2025'
    };
  }
  
  // Student discount (ongoing)
  if (this.eligibleForStudentDiscount && this.isStudent) {
    return {
      type: 'student',
      percentage: 10,
      description: 'Student Discount (10% OFF)',
      isOneTime: false,
      code: 'STUDENT10'
    };
  }
  
  // No discount
  return {
    type: 'none',
    percentage: 0,
    description: 'No Discount',
    isOneTime: false,
    code: null
  };
};

/**
 * Mark customer's first order as completed
 */
customerSchema.methods.markFirstOrderCompleted = async function(orderId) {
  if (!this.firstOrderCompleted) {
    this.firstOrderCompleted = true;
    this.firstOrderDate = new Date();
    this.firstOrderId = orderId;
    await this.save();
    return true;
  }
  return false;
};

/**
 * Get customer discount summary
 */
customerSchema.methods.getDiscountSummary = function() {
  const currentDiscount = this.getApplicableDiscount();
  return {
    isStudent: this.isStudent,
    registeredViaCampaign: this.registeredViaCampaign,
    campaignCode: this.campaignCode,
    firstOrderCompleted: this.firstOrderCompleted,
    currentDiscount: currentDiscount,
    futureDiscount: this.eligibleForStudentDiscount && this.isStudent ? {
      type: 'student',
      percentage: 10,
      description: 'Student Discount (10% OFF)'
    } : null
  };
};

module.exports = mongoose.model('Customer', customerSchema);
