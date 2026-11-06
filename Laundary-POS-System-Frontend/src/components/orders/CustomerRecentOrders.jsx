import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';
import { customersAPI } from '../../services/api';
import { formatOrderAmount, getOrderStatusLabel, getOrderStatusColor } from '../../services/orderService';
import { formatDate } from '../../utils/helpers';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * The customer's last few orders, shown on the order form so the cashier can
 * see what they usually bring and repeat an order in one click.
 */
const CustomerRecentOrders = ({ customerId, onReorder, limit = 5 }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['customer-orders', customerId, { page: 1, limit }],
    queryFn: () => customersAPI.getOrderHistory(customerId, { page: 1, limit }),
    select: (response) => response.data.data,
    enabled: !!customerId,
    staleTime: 60 * 1000,
  });

  const orders = data?.orders || [];
  const analytics = data?.analytics;

  if (!customerId) return null;

  return (
    <div className="p-4 bg-white border-2 border-gray-200 rounded-xl animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-gray-500" />
          <h4 className="text-sm font-semibold text-gray-900">Order History</h4>
          {analytics && (
            <span className="text-xs text-gray-500">
              {analytics.totalOrders} order{analytics.totalOrders === 1 ? '' : 's'} · {formatOrderAmount(analytics.totalSpent || 0)}
              {analytics.outstandingBalance > 0 && <span className="text-red-600 font-semibold"> · {formatOrderAmount(analytics.outstandingBalance)} unpaid</span>}
            </span>
          )}
        </div>
        {analytics?.totalOrders > limit && (
          <button type="button" onClick={() => navigate(`/customers/${customerId}`)} className="text-xs font-semibold text-[#fe7f2d] hover:underline">
            View all
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-4 flex justify-center"><LoadingSpinner size="sm" /></div>
      ) : orders.length === 0 ? (
        <p className="text-xs text-gray-500">First order for this customer.</p>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order._id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => navigate(`/orders/${order._id}`)} className="text-xs font-bold font-mono text-gray-800 hover:text-[#fe7f2d]">
                    {order.orderNumber}
                  </button>
                  <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-semibold ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate mt-0.5">
                  {(order.items || []).map((i) => `${i.serviceName}${i.weight > 0 ? ` ${i.weight}kg` : ` ×${i.quantity}`}`).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-gray-900">{formatOrderAmount(order.totalAmount)}</span>
                {onReorder && (
                  <button
                    type="button"
                    onClick={() => onReorder(order)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border-2 border-orange-200 text-[#fe7f2d] hover:bg-orange-50"
                    title="Use the same items for this order"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5" />
                    Reorder
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerRecentOrders;
