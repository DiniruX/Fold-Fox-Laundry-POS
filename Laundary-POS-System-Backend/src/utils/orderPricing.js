const Discount = require('../models/Discount');
const ExtraItem = require('../models/ExtraItem');

/**
 * Helpers shared by order create / update / confirm for the two pricing
 * features that live outside the service catalog:
 *   - extra items (hangers, bags, ...) → order.extraCharges
 *   - discounts (customer-based or admin promotions) → order.discount
 */

const NO_DISCOUNT = Object.freeze({
  type: 'none',
  percentage: 0,
  amount: 0,
  description: 'No Discount',
  code: null,
  isFirstOrderDiscount: false,
  promotion: null,
  source: 'auto'
});

// Cashier explicitly chose "no discount" - must survive re-pricing
const MANUAL_NO_DISCOUNT = Object.freeze({ ...NO_DISCOUNT, source: 'manual_none' });

/**
 * Build the order.extraCharges block from [{ itemId, quantity }].
 * Prices are always read from the database, never trusted from the client.
 *
 * @returns {{ items: Array, total: number }}
 * @throws {Error} with .statusCode = 400 for invalid input
 */
const buildExtraCharges = async (extraItems = []) => {
  if (!Array.isArray(extraItems) || extraItems.length === 0) {
    return { items: [], total: 0 };
  }

  const requested = extraItems
    .map(e => ({ itemId: String(e.itemId || e.id || ''), quantity: parseInt(e.quantity, 10) || 0 }))
    .filter(e => e.itemId && e.quantity > 0);

  if (requested.length === 0) {
    return { items: [], total: 0 };
  }

  const ids = [...new Set(requested.map(r => r.itemId))];
  const dbItems = await ExtraItem.find({ _id: { $in: ids } }).lean();
  const byId = new Map(dbItems.map(i => [String(i._id), i]));

  const items = [];
  let total = 0;

  for (const r of requested) {
    const item = byId.get(r.itemId);
    if (!item) {
      const err = new Error(`Extra item not found: ${r.itemId}`);
      err.statusCode = 400;
      throw err;
    }
    if (!item.isActive) {
      const err = new Error(`"${item.name}" is not available at the moment`);
      err.statusCode = 400;
      throw err;
    }
    const lineTotal = Math.round(item.price * r.quantity * 100) / 100;
    items.push({
      id: String(item._id),
      name: item.name,
      quantity: r.quantity,
      price: item.price
    });
    total += lineTotal;
  }

  return { items, total: Math.round(total * 100) / 100 };
};

/**
 * Convert the customer's built-in entitlement (campaign / student) into the
 * order.discount shape.
 */
const discountInfoFromCustomer = (customer, subtotal) => {
  const applicable = customer?.getApplicableDiscount?.();
  if (!applicable || !applicable.percentage || applicable.percentage <= 0) {
    return { ...NO_DISCOUNT };
  }
  const amount = Math.round(((subtotal * applicable.percentage) / 100) * 100) / 100;
  return {
    type: applicable.type,
    percentage: applicable.percentage,
    amount,
    description: applicable.description,
    code: applicable.code,
    isFirstOrderDiscount: applicable.type === 'campaign',
    promotion: null,
    source: 'auto'
  };
};

/**
 * Convert an admin promotion into the order.discount shape.
 */
const discountInfoFromPromotion = (promotion, subtotal) => {
  const amount = promotion.calculateAmount(subtotal);
  const percentage = promotion.type === 'percentage'
    ? promotion.value
    : (subtotal > 0 ? Math.round((amount / subtotal) * 10000) / 100 : 0);

  const label = promotion.type === 'percentage'
    ? `${promotion.value}% OFF`
    : `LKR ${promotion.value} OFF`;

  return {
    type: 'promotion',
    percentage,
    amount,
    description: `${promotion.name} (${label})`,
    code: promotion.code || null,
    isFirstOrderDiscount: false,
    promotion: promotion._id,
    source: 'promotion'
  };
};

/**
 * Resolve which discount an order gets.
 *
 * @param {Object} opts
 * @param {Object} opts.customer      Customer mongoose document
 * @param {number} opts.subtotal      Items subtotal
 * @param {string} [opts.discountId]  Promotion chosen by the cashier
 * @param {boolean} [opts.noDiscount] Explicitly apply no discount at all
 * @returns {Promise<Object>} order.discount block (with .amount)
 * @throws {Error} with .statusCode = 400 if the chosen promotion is not usable
 */
const resolveDiscount = async ({ customer, subtotal, discountId, noDiscount = false }) => {
  if (noDiscount) {
    return { ...MANUAL_NO_DISCOUNT };
  }

  if (discountId) {
    const promotion = await Discount.findById(discountId);
    if (!promotion) {
      const err = new Error('Selected discount was not found');
      err.statusCode = 400;
      throw err;
    }
    if (!promotion.isLive()) {
      const err = new Error(`"${promotion.name}" is not currently active`);
      err.statusCode = 400;
      throw err;
    }
    if (!promotion.appliesToCustomer(customer)) {
      const err = new Error(`"${promotion.name}" does not apply to this customer`);
      err.statusCode = 400;
      throw err;
    }
    if (promotion.minOrderAmount > 0 && subtotal < promotion.minOrderAmount) {
      const err = new Error(`"${promotion.name}" needs a minimum order of LKR ${promotion.minOrderAmount}`);
      err.statusCode = 400;
      throw err;
    }
    return discountInfoFromPromotion(promotion, subtotal);
  }

  return discountInfoFromCustomer(customer, subtotal);
};

/**
 * Re-price an existing order's discount against a new subtotal, keeping the
 * same source (promotion or customer entitlement). Used when items change.
 */
const repriceExistingDiscount = async (order, customer, subtotal) => {
  const current = order.discount || {};

  if (current.source === 'manual_none') {
    return { ...MANUAL_NO_DISCOUNT };
  }

  if (current.type === 'promotion' && current.promotion) {
    const promotion = await Discount.findById(current.promotion);
    if (promotion) {
      // Honour the promotion the order was created with even if it has since
      // expired: the customer was promised it when the order was placed.
      return discountInfoFromPromotion(promotion, subtotal);
    }
  }

  return discountInfoFromCustomer(customer, subtotal);
};

/**
 * Promotions a customer can use right now.
 */
const getLiveDiscountsForCustomer = async (customer) => {
  const now = new Date();
  const live = await Discount.find({
    isActive: true,
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }]
  }).sort({ value: -1, name: 1 });

  return live.map(d => ({
    discount: d,
    eligible: d.appliesToCustomer(customer)
  }));
};

module.exports = {
  NO_DISCOUNT,
  MANUAL_NO_DISCOUNT,
  buildExtraCharges,
  discountInfoFromCustomer,
  discountInfoFromPromotion,
  resolveDiscount,
  repriceExistingDiscount,
  getLiveDiscountsForCustomer
};
