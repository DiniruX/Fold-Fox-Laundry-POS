import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { extraItemsAPI } from './api';
import { EXTRA_ITEM_CATEGORIES } from '../constants';

export const EXTRA_ITEM_QUERY_KEYS = {
  ITEMS: 'extraItems',
  ITEM: 'extraItem',
};

const CATEGORY_LABELS = {
  [EXTRA_ITEM_CATEGORIES.HANGER]: 'Hanger',
  [EXTRA_ITEM_CATEGORIES.PACKAGING]: 'Packaging',
  [EXTRA_ITEM_CATEGORIES.CONSUMABLE]: 'Consumable',
  [EXTRA_ITEM_CATEGORIES.OTHER]: 'Other',
};

const CATEGORY_COLORS = {
  [EXTRA_ITEM_CATEGORIES.HANGER]: 'bg-orange-100 text-orange-800',
  [EXTRA_ITEM_CATEGORIES.PACKAGING]: 'bg-blue-100 text-blue-800',
  [EXTRA_ITEM_CATEGORIES.CONSUMABLE]: 'bg-purple-100 text-purple-800',
  [EXTRA_ITEM_CATEGORIES.OTHER]: 'bg-gray-100 text-gray-800',
};

export const getExtraItemCategoryLabel = (category) => CATEGORY_LABELS[category] || 'Other';
export const getExtraItemCategoryColor = (category) => CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

export const EXTRA_ITEM_CATEGORY_OPTIONS = Object.values(EXTRA_ITEM_CATEGORIES).map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

/**
 * All items. Admins pass { includeInactive: true } to manage the whole catalog;
 * the order form uses the default (active only).
 */
export const useExtraItems = (params = {}) => {
  return useQuery({
    queryKey: [EXTRA_ITEM_QUERY_KEYS.ITEMS, params],
    queryFn: () => extraItemsAPI.getAll(params),
    select: (response) => response.data.data,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateExtraItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => extraItemsAPI.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [EXTRA_ITEM_QUERY_KEYS.ITEMS] });
      toast.success(`"${response.data.data.item.name}" added`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add item');
    },
  });
};

export const useUpdateExtraItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => extraItemsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXTRA_ITEM_QUERY_KEYS.ITEMS] });
      toast.success('Item updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update item');
    },
  });
};

export const useToggleExtraItemStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }) => extraItemsAPI.toggleStatus(id, { isActive }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [EXTRA_ITEM_QUERY_KEYS.ITEMS] });
      toast.success(response.data.message || 'Item status updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update item status');
    },
  });
};

export const useDeleteExtraItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => extraItemsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXTRA_ITEM_QUERY_KEYS.ITEMS] });
      toast.success('Item deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    },
  });
};

export default {
  useExtraItems,
  useCreateExtraItem,
  useUpdateExtraItem,
  useToggleExtraItemStatus,
  useDeleteExtraItem,
  getExtraItemCategoryLabel,
  getExtraItemCategoryColor,
  EXTRA_ITEM_CATEGORY_OPTIONS,
};
