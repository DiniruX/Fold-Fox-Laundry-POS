const ClothingCategory = require('../models/ClothingCategory');
const Service = require('../models/Service');
const {
  FIXED_CLOTHING_CATEGORIES,
  FIXED_CATEGORY_KEYS,
  toCategoryKey,
} = require('../constants/clothingCategories');

/**
 * @desc    Get all clothing categories (built-in first, then custom)
 * @route   GET /api/clothing-categories
 * @access  Private (Admin & Cashier)
 */
const getClothingCategories = async (req, res) => {
  try {
    const custom = await ClothingCategory.find().sort({ label: 1 }).lean();

    const categories = [
      ...FIXED_CLOTHING_CATEGORIES.map(c => ({ ...c, isCustom: false })),
      ...custom.map(c => ({ _id: c._id, key: c.key, label: c.label, isCustom: true })),
    ];

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get clothing categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clothing categories' });
  }
};

/**
 * @desc    Add a custom clothing category
 * @route   POST /api/clothing-categories
 * @access  Private (Admin only)
 */
const createClothingCategory = async (req, res) => {
  try {
    const label = String(req.body.label || '').trim().replace(/\s+/g, ' ');

    if (label.length < 2 || label.length > 40) {
      return res.status(400).json({
        success: false,
        message: 'Category name must be between 2 and 40 characters'
      });
    }

    const key = toCategoryKey(label);
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Category name must contain letters or numbers'
      });
    }

    const labelTaken = FIXED_CLOTHING_CATEGORIES.some(c => c.label.toLowerCase() === label.toLowerCase());
    if (FIXED_CATEGORY_KEYS.includes(key) || labelTaken || await ClothingCategory.exists({ key })) {
      return res.status(400).json({
        success: false,
        message: `A category named "${label}" already exists`
      });
    }

    const category = await ClothingCategory.create({ key, label, createdBy: req.user._id });

    res.status(201).json({
      success: true,
      message: 'Clothing category added',
      data: { _id: category._id, key: category.key, label: category.label, isCustom: true }
    });
  } catch (error) {
    console.error('Create clothing category error:', error);
    res.status(500).json({ success: false, message: 'Failed to add clothing category' });
  }
};

/**
 * @desc    Delete a custom clothing category (only if no service prices it)
 * @route   DELETE /api/clothing-categories/:key
 * @access  Private (Admin only)
 */
const deleteClothingCategory = async (req, res) => {
  try {
    const { key } = req.params;

    if (FIXED_CATEGORY_KEYS.includes(key)) {
      return res.status(400).json({ success: false, message: 'Built-in categories cannot be deleted' });
    }

    const category = await ClothingCategory.findOne({ key });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Clothing category not found' });
    }

    const servicesUsing = await Service.find({ [`clothingPrices.${key}`]: { $exists: true } })
      .select('name')
      .lean();
    if (servicesUsing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `"${category.label}" is priced in: ${servicesUsing.map(s => s.name).join(', ')}. Remove its price from those services first.`
      });
    }

    await category.deleteOne();

    res.json({ success: true, message: 'Clothing category deleted' });
  } catch (error) {
    console.error('Delete clothing category error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete clothing category' });
  }
};

module.exports = {
  getClothingCategories,
  createClothingCategory,
  deleteClothingCategory,
};
