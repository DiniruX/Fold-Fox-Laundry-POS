const mongoose = require('mongoose');
const Discount = require('../models/Discount');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { getLiveDiscountsForCustomer } = require('../utils/orderPricing');

const pickDiscountFields = (body) => {
  const data = {};
  if (body.name !== undefined) data.name = String(body.name || '').trim().replace(/\s+/g, ' ');
  if (body.code !== undefined) data.code = String(body.code || '').trim().toUpperCase() || undefined;
  if (body.description !== undefined) data.description = String(body.description || '').trim();
  if (body.type !== undefined) data.type = body.type;
  if (body.value !== undefined) data.value = Number(body.value);
  if (body.maxDiscountAmount !== undefined) {
    data.maxDiscountAmount = body.maxDiscountAmount === '' || body.maxDiscountAmount === null
      ? undefined
      : Number(body.maxDiscountAmount);
  }
  if (body.minOrderAmount !== undefined) data.minOrderAmount = Number(body.minOrderAmount) || 0;
  if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : new Date();
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
  if (body.customerType !== undefined) data.customerType = body.customerType;
  if (body.isActive !== undefined) data.isActive = body.isActive === true || body.isActive === 'true';
  return data;
};

const validateDiscount = (data, existing = null) => {
  const name = data.name ?? existing?.name;
  const type = data.type ?? existing?.type ?? 'percentage';
  const value = data.value ?? existing?.value;
  const startDate = data.startDate ?? existing?.startDate;
  const endDate = data.endDate !== undefined ? data.endDate : existing?.endDate;
  const customerType = data.customerType ?? existing?.customerType ?? 'all';

  if (!name || name.length < 2) return 'Discount name must be at least 2 characters';
  if (!Discount.TYPES.includes(type)) return `Type must be one of: ${Discount.TYPES.join(', ')}`;
  if (value === undefined || Number.isNaN(value) || value <= 0) return 'Discount value must be greater than 0';
  if (type === 'percentage' && value > 100) return 'Percentage discount cannot exceed 100%';
  if (data.maxDiscountAmount !== undefined && data.maxDiscountAmount !== null && (Number.isNaN(data.maxDiscountAmount) || data.maxDiscountAmount < 0)) {
    return 'Maximum discount amount cannot be negative';
  }
  if (data.minOrderAmount !== undefined && data.minOrderAmount < 0) return 'Minimum order amount cannot be negative';
  if (startDate && Number.isNaN(new Date(startDate).getTime())) return 'Invalid start date';
  if (endDate && Number.isNaN(new Date(endDate).getTime())) return 'Invalid end date';
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) return 'End date must be after the start date';
  if (!Discount.CUSTOMER_TYPES.includes(customerType)) {
    return `Customer type must be one of: ${Discount.CUSTOMER_TYPES.join(', ')}`;
  }
  if (data.code && !/^[A-Z0-9_-]{2,20}$/.test(data.code)) {
    return 'Code must be 2-20 characters: letters, numbers, - or _';
  }
  return null;
};

// End dates coming from a <input type="date"> mean "through the end of that day"
const normalizeEndDate = (date) => {
  if (!date) return date;
  const d = new Date(date);
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0) {
    d.setUTCHours(23, 59, 59, 999);
  }
  return d;
};

/**
 * @desc    List all discounts (admin). Filter with ?status=active|scheduled|expired|inactive
 * @route   GET /api/discounts
 * @access  Private (Admin only)
 */
const getDiscounts = async (req, res) => {
  try {
    const { status, search, customerType } = req.query;

    const filter = {};
    if (customerType && Discount.CUSTOMER_TYPES.includes(customerType)) filter.customerType = customerType;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    let discounts = await Discount.find(filter)
      .populate('createdBy', 'name')
      .sort({ isActive: -1, startDate: -1 });

    if (status) {
      discounts = discounts.filter(d => d.status === status);
    }

    const all = await Discount.find().select('isActive startDate endDate');
    const stats = all.reduce((acc, d) => {
      acc.total += 1;
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, { total: 0, active: 0, scheduled: 0, expired: 0, inactive: 0 });

    res.json({
      success: true,
      data: {
        discounts,
        stats,
        types: Discount.TYPES,
        customerTypes: Discount.CUSTOMER_TYPES
      }
    });
  } catch (error) {
    console.error('Get discounts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch discounts' });
  }
};

/**
 * @desc    Live offers right now. With ?customerId= each offer is flagged
 *          with `eligible` for that customer and the customer's built-in
 *          discount (student / campaign) is returned as `customerDiscount`.
 * @route   GET /api/discounts/active?customerId=
 * @access  Private (Admin & Cashier)
 */
const getActiveDiscounts = async (req, res) => {
  try {
    const { customerId } = req.query;

    let customer = null;
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      customer = await Customer.findById(customerId);
    }

    const live = await getLiveDiscountsForCustomer(customer);

    const customerDiscount = customer ? customer.getApplicableDiscount() : null;

    res.json({
      success: true,
      data: {
        discounts: live.map(({ discount, eligible }) => ({
          ...discount.toJSON(),
          eligible: customer ? eligible : undefined
        })),
        customerDiscount: customerDiscount && customerDiscount.percentage > 0 ? customerDiscount : null
      }
    });
  } catch (error) {
    console.error('Get active discounts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active discounts' });
  }
};

/**
 * @desc    Get one discount with usage stats
 * @route   GET /api/discounts/:id
 * @access  Private (Admin only)
 */
const getDiscount = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id).populate('createdBy', 'name');
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    const [usage] = await Order.aggregate([
      { $match: { 'discount.promotion': discount._id, isDeleted: { $ne: true } } },
      { $group: { _id: null, orders: { $sum: 1 }, totalDiscounted: { $sum: '$discountAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        discount,
        usage: { orders: usage?.orders || 0, totalDiscounted: usage?.totalDiscounted || 0 }
      }
    });
  } catch (error) {
    console.error('Get discount error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch discount' });
  }
};

/**
 * @desc    Create a discount
 * @route   POST /api/discounts
 * @access  Private (Admin only)
 */
const createDiscount = async (req, res) => {
  try {
    const data = pickDiscountFields(req.body);
    if (!data.startDate) data.startDate = new Date();
    data.endDate = normalizeEndDate(data.endDate);

    const error = validateDiscount(data);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    if (data.code && await Discount.exists({ code: data.code })) {
      return res.status(400).json({ success: false, message: `Code "${data.code}" is already in use` });
    }

    const discount = await Discount.create({ ...data, createdBy: req.user._id });

    res.status(201).json({ success: true, message: 'Discount created', data: { discount } });
  } catch (error) {
    console.error('Create discount error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create discount' });
  }
};

/**
 * @desc    Update a discount
 * @route   PUT /api/discounts/:id
 * @access  Private (Admin only)
 */
const updateDiscount = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    const data = pickDiscountFields(req.body);
    if (data.endDate !== undefined) data.endDate = normalizeEndDate(data.endDate);

    const error = validateDiscount(data, discount);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    if (data.code && data.code !== discount.code && await Discount.exists({ code: data.code, _id: { $ne: discount._id } })) {
      return res.status(400).json({ success: false, message: `Code "${data.code}" is already in use` });
    }

    Object.keys(data).forEach(key => {
      discount[key] = data[key];
    });
    if (req.body.code === '' ) discount.code = undefined;
    discount.updatedBy = req.user._id;
    await discount.save();

    res.json({ success: true, message: 'Discount updated', data: { discount } });
  } catch (error) {
    console.error('Update discount error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update discount' });
  }
};

/**
 * @desc    Toggle active flag
 * @route   PATCH /api/discounts/:id/toggle-status
 * @access  Private (Admin only)
 */
const toggleDiscountStatus = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }
    discount.isActive = req.body.isActive !== undefined ? !!req.body.isActive : !discount.isActive;
    discount.updatedBy = req.user._id;
    await discount.save();

    res.json({
      success: true,
      message: `Discount ${discount.isActive ? 'activated' : 'deactivated'}`,
      data: { discount }
    });
  } catch (error) {
    console.error('Toggle discount error:', error);
    res.status(500).json({ success: false, message: 'Failed to update discount status' });
  }
};

/**
 * @desc    Delete a discount (blocked once orders have used it)
 * @route   DELETE /api/discounts/:id
 * @access  Private (Admin only)
 */
const deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    const used = await Order.countDocuments({ 'discount.promotion': discount._id });
    if (used > 0) {
      return res.status(400).json({
        success: false,
        message: `"${discount.name}" has been applied to ${used} order(s). Deactivate it instead of deleting.`
      });
    }

    await discount.deleteOne();
    res.json({ success: true, message: 'Discount deleted' });
  } catch (error) {
    console.error('Delete discount error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete discount' });
  }
};

module.exports = {
  getDiscounts,
  getActiveDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  toggleDiscountStatus,
  deleteDiscount
};
