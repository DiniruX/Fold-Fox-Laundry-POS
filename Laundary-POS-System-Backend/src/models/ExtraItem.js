const mongoose = require('mongoose');

/**
 * ExtraItem Model - Sellable add-ons that are not laundry services
 * (hangers, garment bags, laundry bags, detergents, ...).
 *
 * Items are managed by admins under "Other Items" and can be added to an order
 * at creation time (e.g. the hangers counter) or at payment time.
 * The `category` drives special behaviour in the POS: items in the `hanger`
 * category power the "Hangers" counter on the order form.
 */
const EXTRA_ITEM_CATEGORIES = ['hanger', 'packaging', 'consumable', 'other'];

const extraItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    unique: true,
    trim: true,
    maxlength: [60, 'Item name cannot exceed 60 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  category: {
    type: String,
    enum: EXTRA_ITEM_CATEGORIES,
    default: 'other'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    trim: true,
    default: 'piece',
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  isActive: {
    type: Boolean,
    default: true
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
  timestamps: true
});

extraItemSchema.index({ category: 1, isActive: 1 });

extraItemSchema.statics.CATEGORIES = EXTRA_ITEM_CATEGORIES;

module.exports = mongoose.model('ExtraItem', extraItemSchema);
