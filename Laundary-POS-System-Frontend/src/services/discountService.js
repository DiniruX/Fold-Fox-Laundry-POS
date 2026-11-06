import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { discountsAPI } from './api';
import { DISCOUNT_TYPES, DISCOUNT_CUSTOMER_TYPES } from '../constants';

export const DISCOUNT_QUERY_KEYS = {
  DISCOUNTS: 'discounts',
  DISCOUNT: 'discount',
  ACTIVE: 'activeDiscounts',
};

const CUSTOMER_TYPE_LABELS = {
  [DISCOUNT_CUSTOMER_TYPES.ALL]: 'All customers',
  [DISCOUNT_CUSTOMER_TYPES.STUDENT]: 'Students',
  [DISCOUNT_CUSTOMER_TYPES.NEW]: 'New customers (first order)',
  [DISCOUNT_CUSTOMER_TYPES.REGULAR]: 'Returning customers',
  [DISCOUNT_CUSTOMER_TYPES.CAMPAIGN]: 'Campaign sign-ups',
};

const CUSTOMER_TYPE_SHORT = {
  [DISCOUNT_CUSTOMER_TYPES.ALL]: 'Everyone',
  [DISCOUNT_CUSTOMER_TYPES.STUDENT]: 'Students',
  [DISCOUNT_CUSTOMER_TYPES.NEW]: 'New',
  [DISCOUNT_CUSTOMER_TYPES.REGULAR]: 'Returning',
  [DISCOUNT_CUSTOMER_TYPES.CAMPAIGN]: 'Campaign',
};

const STATUS_LABELS = {
  active: 'Active',
  scheduled: 'Scheduled',
  expired: 'Expired',
  inactive: 'Inactive',
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
  expired: 'bg-gray-100 text-gray-600',
  inactive: 'bg-red-100 text-red-800',
};

export const getDiscountCustomerTypeLabel = (type) => CUSTOMER_TYPE_LABELS[type] || type;
export const getDiscountCustomerTypeShort = (type) => CUSTOMER_TYPE_SHORT[type] || type;
export const getDiscountStatusLabel = (status) => STATUS_LABELS[status] || status;
export const getDiscountStatusColor = (status) => STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

export const DISCOUNT_TYPE_OPTIONS = [
  { value: DISCOUNT_TYPES.PERCENTAGE, label: 'Percentage (%)' },
  { value: DISCOUNT_TYPES.FIXED, label: 'Fixed amount (LKR)' },
];

export const DISCOUNT_CUSTOMER_TYPE_OPTIONS = Object.values(DISCOUNT_CUSTOMER_TYPES).map((value) => ({
  value,
  label: CUSTOMER_TYPE_LABELS[value],
}));

/** "20% OFF" / "LKR 150 OFF" */
export const formatDiscountValue = (discount) => {
  if (!discount) return '';
  return discount.type === DISCOUNT_TYPES.FIXED
    ? `LKR ${Number(discount.value).toLocaleString('en-LK')} OFF`
    : `${discount.value}% OFF`;
};

/**
 * Client-side mirror of Discount.calculateAmount for live previews on the
 * order form. The server recomputes the real figure.
 */
export const calculateDiscountAmount = (discount, subtotal) => {
  const base = Number(subtotal) || 0;
  if (!discount || base <= 0) return 0;
  if (discount.minOrderAmount && base < discount.minOrderAmount) return 0;

  let amount = discount.type === DISCOUNT_TYPES.FIXED
    ? Number(discount.value)
    : (base * Number(discount.value)) / 100;

  if (discount.type === DISCOUNT_TYPES.PERCENTAGE && discount.maxDiscountAmount > 0) {
    amount = Math.min(amount, discount.maxDiscountAmount);
  }
  return Math.round(Math.min(amount, base) * 100) / 100;
};

export const useDiscounts = (params = {}) => {
  return useQuery({
    queryKey: [DISCOUNT_QUERY_KEYS.DISCOUNTS, params],
    queryFn: () => discountsAPI.getAll(params),
    select: (response) => response.data.data,
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });
};

/**
 * Offers live right now. Pass a customerId to learn which ones that customer
 * qualifies for and what built-in discount (student/campaign) they already get.
 */
export const useActiveDiscounts = (customerId) => {
  return useQuery({
    queryKey: [DISCOUNT_QUERY_KEYS.ACTIVE, customerId || null],
    queryFn: () => discountsAPI.getActive(customerId ? { customerId } : undefined),
    select: (response) => response.data.data,
    staleTime: 2 * 60 * 1000,
  });
};

const invalidateDiscounts = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [DISCOUNT_QUERY_KEYS.DISCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [DISCOUNT_QUERY_KEYS.ACTIVE] });
};

export const useCreateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => discountsAPI.create(data),
    onSuccess: (response) => {
      invalidateDiscounts(queryClient);
      toast.success(`"${response.data.data.discount.name}" created`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create discount');
    },
  });
};

export const useUpdateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => discountsAPI.update(id, data),
    onSuccess: () => {
      invalidateDiscounts(queryClient);
      toast.success('Discount updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update discount');
    },
  });
};

export const useToggleDiscountStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }) => discountsAPI.toggleStatus(id, { isActive }),
    onSuccess: (response) => {
      invalidateDiscounts(queryClient);
      toast.success(response.data.message || 'Discount status updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update discount status');
    },
  });
};

export const useDeleteDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => discountsAPI.delete(id),
    onSuccess: () => {
      invalidateDiscounts(queryClient);
      toast.success('Discount deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete discount');
    },
  });
};

export default {
  useDiscounts,
  useActiveDiscounts,
  useCreateDiscount,
  useUpdateDiscount,
  useToggleDiscountStatus,
  useDeleteDiscount,
  getDiscountCustomerTypeLabel,
  getDiscountCustomerTypeShort,
  getDiscountStatusLabel,
  getDiscountStatusColor,
  formatDiscountValue,
  calculateDiscountAmount,
  DISCOUNT_TYPE_OPTIONS,
  DISCOUNT_CUSTOMER_TYPE_OPTIONS,
};
