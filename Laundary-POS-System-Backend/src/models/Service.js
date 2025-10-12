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
    required: true
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
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
