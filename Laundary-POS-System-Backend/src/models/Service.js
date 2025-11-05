const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    unique: true,
    trim: true
  },
  description: String,
  priceType: {
    type: String,
    enum: ['per_kg', 'per_piece'],
    required: false // Now optional, kept for backward compatibility
  },
  basePrice: {
    type: Number,
    required: false, // Optional if using clothingPrices
    min: [0, 'Price cannot be negative']
  },
  statuses: {
    type: [String],
    enum: ['wash', 'dry', 'iron', 'dry_clean', 'fold'],
    default: ['wash', 'dry']
  },
  clothingPrices: {
    type: Map,
    of: Number,
    default: {}
  },
  // New: Store priceType for each clothing category
  clothingPriceTypes: {
    type: Map,
    of: {
      type: String,
      enum: ['per_kg', 'per_piece'],
      default: 'per_piece'
    },
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 60
  },
  icon: String,
  color: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
