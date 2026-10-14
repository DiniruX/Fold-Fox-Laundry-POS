const mongoose = require('mongoose');

/**
 * ClothingCategory Model - Custom clothing categories added by admins.
 * The built-in categories live in constants/clothingCategories.js and are not stored here.
 */
const clothingCategorySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^[a-z0-9_]+$/, 'Category key may only contain lowercase letters, numbers and underscores']
  },
  label: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [40, 'Category name cannot exceed 40 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ClothingCategory', clothingCategorySchema);
