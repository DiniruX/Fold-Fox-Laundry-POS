/**
 * Business pricing rules. Values come from the environment so they can be
 * changed per deployment without a code change; the defaults match the shop.
 *
 *   MINIMUM_ORDER_AMOUNT  Every order is charged at least this much (LKR).
 *                         If the computed total is lower, the difference is
 *                         added as a "minimum order top-up" line.
 *   EXPRESS_SERVICE_FEE   Flat fee for 1-day express service (LKR).
 */
const readNumber = (name, fallback) => {
  const value = parseFloat(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

const MINIMUM_ORDER_AMOUNT = readNumber('MINIMUM_ORDER_AMOUNT', 400);
const EXPRESS_SERVICE_FEE = readNumber('EXPRESS_SERVICE_FEE', 100);

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Amount to add so an order reaches the minimum. 0 when already at/above it.
 */
const minimumOrderAdjustment = (baseTotal) => {
  const base = Number(baseTotal) || 0;
  if (base <= 0) return 0; // nothing ordered → nothing to top up
  return base < MINIMUM_ORDER_AMOUNT ? round2(MINIMUM_ORDER_AMOUNT - base) : 0;
};

module.exports = {
  MINIMUM_ORDER_AMOUNT,
  EXPRESS_SERVICE_FEE,
  minimumOrderAdjustment,
  round2
};
