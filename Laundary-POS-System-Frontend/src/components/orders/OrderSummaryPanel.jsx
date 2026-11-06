import React from 'react';
import { formatOrderAmount } from '../../services/orderService';

const Row = ({ label, value, muted = false, accent = '' }) => (
  <div className="flex items-center justify-between text-sm">
    <span className={muted ? 'text-gray-500' : 'text-gray-700'}>{label}</span>
    <span className={`font-semibold ${accent || 'text-gray-900'}`}>{value}</span>
  </div>
);

/**
 * Live order total shown at the bottom of the order form steps.
 * Figures are indicative: the server recomputes everything on save.
 */
const OrderSummaryPanel = ({ totals }) => {
  if (!totals) return null;
  const {
    subtotal = 0,
    extrasLines = [],
    extrasTotal = 0,
    discountAmount = 0,
    discountLabel = '',
    expressFee = 0,
    pickupCharges = 0,
    deliveryCharges = 0,
    minimumTopUp = 0,
    minimumOrderAmount = 0,
    total = 0,
  } = totals;

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Summary</h4>
      <div className="space-y-2">
        <Row label="Services subtotal" value={formatOrderAmount(subtotal)} />

        {extrasLines.map((line) => (
          <Row
            key={line.id}
            label={`${line.name} × ${line.quantity}`}
            value={`+${formatOrderAmount(line.total)}`}
            muted
            accent="text-orange-700"
          />
        ))}
        {extrasTotal > 0 && extrasLines.length > 1 && (
          <Row label="Extras total" value={`+${formatOrderAmount(extrasTotal)}`} accent="text-orange-700" />
        )}

        {expressFee > 0 && <Row label="⚡ 1-Day Express" value={`+${formatOrderAmount(expressFee)}`} accent="text-blue-700" />}
        {pickupCharges > 0 && <Row label="📦 Pickup" value={`+${formatOrderAmount(pickupCharges)}`} accent="text-orange-700" />}
        {deliveryCharges > 0 && <Row label="🚚 Delivery" value={`+${formatOrderAmount(deliveryCharges)}`} accent="text-green-700" />}

        {discountAmount > 0 && (
          <Row
            label={`Discount${discountLabel ? ` · ${discountLabel}` : ''}`}
            value={`-${formatOrderAmount(discountAmount)}`}
            accent="text-green-700"
          />
        )}

        {minimumTopUp > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 -mx-1">
            <Row
              label={`Minimum order top-up (min ${formatOrderAmount(minimumOrderAmount)})`}
              value={`+${formatOrderAmount(minimumTopUp)}`}
              accent="text-amber-700"
            />
            <p className="text-[11px] text-amber-700 mt-1">
              This order is below the shop minimum, so it will be charged at {formatOrderAmount(minimumOrderAmount)}.
            </p>
          </div>
        )}

        <div className="border-t-2 border-dashed border-gray-200 pt-3 mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-gray-900">Estimated Total</span>
          <span className="text-2xl font-bold" style={{ color: '#fe7f2d' }}>{formatOrderAmount(total)}</span>
        </div>
        <p className="text-[11px] text-gray-400">Final amount is confirmed by the system when the order is saved.</p>
      </div>
    </div>
  );
};

export default OrderSummaryPanel;
