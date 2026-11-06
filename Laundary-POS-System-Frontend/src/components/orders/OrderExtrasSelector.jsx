import React, { useState } from 'react';
import { MinusIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { formatOrderAmount } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { EXTRA_ITEM_CATEGORIES } from '../../constants';

const MAX_QTY = 999;

const Counter = ({ value, onChange, disabled }) => {
  const qty = Number(value) || 0;
  return (
    <div className="inline-flex items-center rounded-xl border-2 border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, qty - 1))}
        disabled={disabled || qty <= 0}
        className="h-10 w-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <input
        type="number"
        min="0"
        max={MAX_QTY}
        value={qty}
        onChange={(e) => {
          const next = parseInt(e.target.value, 10);
          onChange(Number.isNaN(next) ? 0 : Math.min(MAX_QTY, Math.max(0, next)));
        }}
        disabled={disabled}
        className="w-14 h-10 text-center text-sm font-bold text-gray-900 border-x-2 border-gray-200 focus:outline-none focus:bg-orange-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(MAX_QTY, qty + 1))}
        disabled={disabled || qty >= MAX_QTY}
        className="h-10 w-10 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        style={{ backgroundColor: '#fe7f2d' }}
        aria-label="Increase"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

const ExtraRow = ({ item, quantity, onChange, highlight = false }) => {
  const qty = Number(quantity) || 0;
  return (
    <div
      className={`flex items-center justify-between gap-3 p-3 rounded-xl border-2 transition-colors ${
        qty > 0 ? 'border-orange-300 bg-orange-50/60' : highlight ? 'border-orange-200 bg-white' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {highlight && <span className="mr-1">🧥</span>}
          {item.name}
        </p>
        <p className="text-xs text-gray-500">
          {formatOrderAmount(item.price)} / {item.unit || 'piece'}
          {qty > 0 && (
            <span className="ml-2 font-bold text-orange-700">= {formatOrderAmount(item.price * qty)}</span>
          )}
        </p>
      </div>
      <Counter value={qty} onChange={onChange} />
    </div>
  );
};

/**
 * Hangers counter (+ any other sellable add-ons) for the order form.
 * `items` are the active entries from the "Other Items" catalog.
 */
const OrderExtrasSelector = ({ items = [], quantities = {}, onChange }) => {
  const { isAdmin } = useAuth();
  const [showOthers, setShowOthers] = useState(false);

  const hangers = items.filter((i) => i.category === EXTRA_ITEM_CATEGORIES.HANGER);
  const others = items.filter((i) => i.category !== EXTRA_ITEM_CATEGORIES.HANGER);
  const othersSelected = others.filter((i) => Number(quantities[i._id]) > 0).length;

  const setQty = (itemId, qty) => {
    onChange((prev) => {
      const next = { ...prev };
      if (qty > 0) next[itemId] = qty;
      else delete next[itemId];
      return next;
    });
  };

  const total = items.reduce((sum, i) => sum + (Number(quantities[i._id]) || 0) * i.price, 0);

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 space-y-3 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Hangers & Extras</h4>
          <p className="text-xs text-gray-500">Priced from “Other Items”</p>
        </div>
        {total > 0 && (
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-100 text-orange-800">
            +{formatOrderAmount(total)}
          </span>
        )}
      </div>

      {hangers.length === 0 ? (
        <div className="p-3 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-500">
          No hanger price is configured, so hangers can’t be added to this order.
          {isAdmin() && (
            <>
              {' '}Add a <span className="font-semibold">Hanger</span> item under <span className="font-semibold">Management → Other Items</span>.
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {hangers.map((item) => (
            <ExtraRow
              key={item._id}
              item={item}
              quantity={quantities[item._id]}
              onChange={(qty) => setQty(item._id, qty)}
              highlight
            />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowOthers((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 hover:text-gray-900 py-1"
          >
            <span>
              Other add-ons ({others.length})
              {othersSelected > 0 && <span className="ml-1 text-orange-700">· {othersSelected} selected</span>}
            </span>
            {showOthers ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          </button>
          {(showOthers || othersSelected > 0) && (
            <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-1">
              {others.map((item) => (
                <ExtraRow
                  key={item._id}
                  item={item}
                  quantity={quantities[item._id]}
                  onChange={(qty) => setQty(item._id, qty)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderExtrasSelector;
