import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from './api';

export const DELIVERY_QUERY_KEYS = {
  SCHEDULE: 'deliverySchedule',
};

export const toDateKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/** Human label for a day relative to today: Today / Tomorrow / Yesterday / weekday date */
export const describeDay = (date) => {
  const key = toDateKey(date);
  const today = toDateKey(new Date());
  if (key === today) return 'Today';
  if (key === toDateKey(addDays(new Date(), 1))) return 'Tomorrow';
  if (key === toDateKey(addDays(new Date(), -1))) return 'Yesterday';
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

/**
 * Delivery orders scheduled between two dates (inclusive, local days), plus
 * delivery orders that still have no date.
 */
export const useDeliverySchedule = (rangeStart, rangeEnd) => {
  const startDate = startOfDay(rangeStart).toISOString();
  const endDate = endOfDay(rangeEnd).toISOString();

  return useQuery({
    queryKey: [DELIVERY_QUERY_KEYS.SCHEDULE, startDate, endDate],
    queryFn: () => ordersAPI.getDeliverySchedule({ startDate, endDate }),
    select: (response) => {
      const data = response.data.data || { scheduled: [], unscheduled: [] };
      const byDay = {};
      data.scheduled.forEach((order) => {
        const key = toDateKey(order.expectedDeliveryDate);
        if (!byDay[key]) byDay[key] = [];
        byDay[key].push(order);
      });
      return { ...data, byDay };
    },
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });
};

export default { useDeliverySchedule, toDateKey, addDays, describeDay };
