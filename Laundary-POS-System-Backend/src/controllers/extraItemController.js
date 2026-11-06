const ExtraItem = require('../models/ExtraItem');
const Order = require('../models/Order');

const pickItemFields = (body) => {
  const data = {};
  if (body.name !== undefined) data.name = String(body.name).trim().replace(/\s+/g, ' ');
  if (body.description !== undefined) data.description = String(body.description || '').trim();
  if (body.category !== undefined) data.category = body.category;
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.unit !== undefined) data.unit = String(body.unit || 'piece').trim() || 'piece';
  if (body.isActive !== undefined) data.isActive = body.isActive === true || body.isActive === 'true';
  return data;
};

const validateItemData = (data, { partial = false } = {}) => {
  if (!partial || data.name !== undefined) {
    if (!data.name || data.name.length < 2) return 'Item name must be at least 2 characters';
  }
  if (!partial || data.price !== undefined) {
    if (data.price === undefined || Number.isNaN(data.price) || data.price < 0) {
      return 'Price must be a number of 0 or more';
    }
  }
  if (data.category !== undefined && !ExtraItem.CATEGORIES.includes(data.category)) {
    return `Category must be one of: ${ExtraItem.CATEGORIES.join(', ')}`;
  }
  return null;
};

/**
 * @desc    List extra items (admin sees all, cashier sees active only)
 * @route   GET /api/extra-items?includeInactive=true&category=hanger&search=
 * @access  Private (Admin & Cashier)
 */
const getExtraItems = async (req, res) => {
  try {
    const { includeInactive, category, search } = req.query;
    const isAdmin = req.user.role === 'admin';

    const filter = {};
    if (!(isAdmin && includeInactive === 'true')) {
      filter.isActive = true;
    }
    if (category && ExtraItem.CATEGORIES.includes(category)) {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const items = await ExtraItem.find(filter)
      .populate('createdBy', 'name')
      .sort({ category: 1, name: 1 })
      .lean();

    const stats = {
      total: await ExtraItem.countDocuments(),
      active: await ExtraItem.countDocuments({ isActive: true }),
      hangers: await ExtraItem.countDocuments({ category: 'hanger', isActive: true })
    };

    res.json({
      success: true,
      data: { items, stats, categories: ExtraItem.CATEGORIES }
    });
  } catch (error) {
    console.error('Get extra items error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch items' });
  }
};

/**
 * @desc    Get one extra item
 * @route   GET /api/extra-items/:id
 * @access  Private (Admin & Cashier)
 */
const getExtraItem = async (req, res) => {
  try {
    const item = await ExtraItem.findById(req.params.id).populate('createdBy', 'name');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, data: { item } });
  } catch (error) {
    console.error('Get extra item error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch item' });
  }
};

/**
 * @desc    Create an extra item
 * @route   POST /api/extra-items
 * @access  Private (Admin only)
 */
const createExtraItem = async (req, res) => {
  try {
    const data = pickItemFields(req.body);
    const validationError = validateItemData(data);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const exists = await ExtraItem.findOne({ name: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (exists) {
      return res.status(400).json({ success: false, message: `An item named "${data.name}" already exists` });
    }

    const item = await ExtraItem.create({ ...data, createdBy: req.user._id });

    res.status(201).json({
      success: true,
      message: 'Item added',
      data: { item }
    });
  } catch (error) {
    console.error('Create extra item error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to add item' });
  }
};

/**
 * @desc    Update an extra item
 * @route   PUT /api/extra-items/:id
 * @access  Private (Admin only)
 */
const updateExtraItem = async (req, res) => {
  try {
    const item = await ExtraItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const data = pickItemFields(req.body);
    const validationError = validateItemData(data, { partial: true });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    if (data.name && data.name.toLowerCase() !== item.name.toLowerCase()) {
      const exists = await ExtraItem.findOne({
        _id: { $ne: item._id },
        name: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      });
      if (exists) {
        return res.status(400).json({ success: false, message: `An item named "${data.name}" already exists` });
      }
    }

    Object.assign(item, data, { updatedBy: req.user._id });
    await item.save();

    res.json({ success: true, message: 'Item updated', data: { item } });
  } catch (error) {
    console.error('Update extra item error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update item' });
  }
};

/**
 * @desc    Toggle active flag
 * @route   PATCH /api/extra-items/:id/toggle-status
 * @access  Private (Admin only)
 */
const toggleExtraItemStatus = async (req, res) => {
  try {
    const item = await ExtraItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    item.isActive = req.body.isActive !== undefined ? !!req.body.isActive : !item.isActive;
    item.updatedBy = req.user._id;
    await item.save();

    res.json({
      success: true,
      message: `Item ${item.isActive ? 'activated' : 'deactivated'}`,
      data: { item }
    });
  } catch (error) {
    console.error('Toggle extra item error:', error);
    res.status(500).json({ success: false, message: 'Failed to update item status' });
  }
};

/**
 * @desc    Delete an extra item (blocked if any order references it)
 * @route   DELETE /api/extra-items/:id
 * @access  Private (Admin only)
 */
const deleteExtraItem = async (req, res) => {
  try {
    const item = await ExtraItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const usedInOrders = await Order.countDocuments({ 'extraCharges.items.id': String(item._id) });
    if (usedInOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `"${item.name}" is used in ${usedInOrders} order(s). Deactivate it instead of deleting.`
      });
    }

    await item.deleteOne();
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Delete extra item error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};

module.exports = {
  getExtraItems,
  getExtraItem,
  createExtraItem,
  updateExtraItem,
  toggleExtraItemStatus,
  deleteExtraItem
};
