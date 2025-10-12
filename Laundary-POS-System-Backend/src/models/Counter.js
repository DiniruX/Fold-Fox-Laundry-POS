const mongoose = require('mongoose');

/**
 * Counter Model - For auto-incrementing sequence numbers
 * Used for generating unique IDs like employee IDs, order IDs, etc.
 */
const counterSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster lookups
counterSchema.index({ key: 1 });

module.exports = mongoose.model('Counter', counterSchema);

