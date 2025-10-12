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
    state: String,
    zipCode: String,
    isDeliveryAddress: {
      type: Boolean,
      default: false
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

module.exports = mongoose.model('Customer', customerSchema);
