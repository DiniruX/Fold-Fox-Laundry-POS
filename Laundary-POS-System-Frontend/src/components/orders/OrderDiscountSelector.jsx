import React from 'react';
import { CheckCircleIcon, TagIcon } from '@heroicons/react/24/outline';
import { formatOrderAmount } from '../../services/orderService';
import {
  formatDiscountValue,
  calculateDiscountAmount,
  getDiscountCustomerTypeShort,
} from '../../services/discountService';
import { formatDate } from '../../utils/helpers';
import LoadingSpinner from '../ui/LoadingSpinner';

const Option = ({ selected, disabled, onSelect, title, subtitle, amount, badge, badgeClass }) => (
  <button
    type="button"
    onClick={onSelect}
    disabled={disabled}
    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
      selected
        ? 'border-green-500 bg-green-50 shadow-sm'
        : disabled
          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
          : 'border-gray-200 bg-white hover:border-green-300'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? 'border-green-600 bg-green-600' : 'border-gray-300'
        }`}>
          {selected && <CheckCircleIcon className="h-4 w-4 text-white" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {badge && (
          <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-md ${badgeClass || 'bg-gray-100 text-gray-700'}`}>
            {badge}
          </span>
        )}
        {amount !== undefined && (
          <p className={`text-sm font-bold mt-0.5 ${amount > 0 ? 'text-green-700' : 'text-gray-400'}`}>
            {amount > 0 ? `-${formatOrderAmount(amount)}` : '—'}
          </p>
        )}
      </div>
    </div>
  </button>
);

/**
 * Shows which offers are live right now and lets the cashier pick the one to
 * apply: the customer's built-in discount (default), a promotion, or none.
 *
 * `value`: 'auto' | 'none' | <promotion id>
 */
const OrderDiscountSelector = ({
  customer,
  customerDiscount,
  discounts = [],
  isLoading = false,
  subtotal = 0,
  value = 'auto',
  onChange,
  currentLabel = '',
}) => {
  const eligible = discounts.filter((d) => d.eligible !== false);
  const ineligible = discounts.filter((d) => d.eligible === false);
  const hasAuto = !!(customerDiscount && customerDiscount.percentage > 0);
  const autoAmount = hasAuto ? Math.round(((subtotal * customerDiscount.percentage) / 100) * 100) / 100 : 0;
  // Editing an order whose promotion has since ended: keep it selectable
  const keptPromotion = /^[a-f\d]{24}$/i.test(String(value)) && !discounts.some((d) => d._id === value);

  const reasonForIneligible = (d) => {
    if (d.minOrderAmount > 0 && subtotal < d.minOrderAmount) return `Min order ${formatOrderAmount(d.minOrderAmount)}`;
    return `${getDiscountCustomerTypeShort(d.customerType)} only`;
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 space-y-3 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <TagIcon className="h-4 w-4 text-green-600" />
            Discounts & Offers
          </h4>
          <p className="text-xs text-gray-500">
            {discounts.length > 0
              ? `${discounts.length} offer${discounts.length === 1 ? '' : 's'} running now`
              : 'No promotions running right now'}
          </p>
        </div>
        {isLoading && <LoadingSpinner size="sm" />}
      </div>

      {!customer && (
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          Select a customer to see which offers they qualify for.
        </p>
      )}

      <div className="space-y-2">
        {keptPromotion && (
          <Option
            selected
            onSelect={() => {}}
            title={currentLabel || 'Current discount'}
            subtitle="Applied when this order was created (offer has since ended)"
            badge="Kept"
            badgeClass="bg-amber-100 text-amber-800"
          />
        )}

        {hasAuto && (
          <Option
            selected={value === 'auto'}
            onSelect={() => onChange('auto')}
            title={customerDiscount.description}
            subtitle="Customer's built-in discount"
            amount={autoAmount}
            badge={`${customerDiscount.percentage}% OFF`}
            badgeClass="bg-blue-100 text-blue-800"
          />
        )}

        {eligible.map((d) => (
          <Option
            key={d._id}
            selected={value === d._id}
            onSelect={() => onChange(d._id)}
            title={d.name}
            subtitle={[
              d.code ? `Code ${d.code}` : null,
              d.endDate ? `until ${formatDate(d.endDate)}` : 'no end date',
              d.minOrderAmount > 0 ? `min ${formatOrderAmount(d.minOrderAmount)}` : null,
            ].filter(Boolean).join(' · ')}
            amount={calculateDiscountAmount(d, subtotal)}
            badge={formatDiscountValue(d)}
            badgeClass="bg-green-100 text-green-800"
          />
        ))}

        {ineligible.map((d) => (
          <Option
            key={d._id}
            selected={false}
            disabled
            title={d.name}
            subtitle={reasonForIneligible(d)}
            badge={formatDiscountValue(d)}
          />
        ))}

        <Option
          selected={value === 'none' || (!hasAuto && value === 'auto')}
          onSelect={() => onChange(hasAuto ? 'none' : 'auto')}
          title="No discount"
          subtitle={hasAuto ? 'Charge the full price' : 'Nothing applies to this order'}
        />
      </div>
    </div>
  );
};

export default OrderDiscountSelector;
