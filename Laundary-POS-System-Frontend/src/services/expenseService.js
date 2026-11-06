import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { expensesAPI } from './api';
import { EXPENSE_CATEGORIES } from '../constants';

export const EXPENSE_QUERY_KEYS = {
  EXPENSES: 'expenses',
  EXPENSE: 'expense',
  SUMMARY: 'expenseSummary',
};

const CATEGORY_LABELS = {
  [EXPENSE_CATEGORIES.SALARY]: 'Salary',
  [EXPENSE_CATEGORIES.UTILITIES]: 'Utilities',
  [EXPENSE_CATEGORIES.RENT]: 'Rent',
  [EXPENSE_CATEGORIES.SUPPLIES]: 'Supplies',
  [EXPENSE_CATEGORIES.MAINTENANCE]: 'Maintenance',
  [EXPENSE_CATEGORIES.TRANSPORT]: 'Transport',
  [EXPENSE_CATEGORIES.MARKETING]: 'Marketing',
  [EXPENSE_CATEGORIES.OTHER]: 'Other',
};

const CATEGORY_COLORS = {
  [EXPENSE_CATEGORIES.SALARY]: 'bg-indigo-100 text-indigo-800',
  [EXPENSE_CATEGORIES.UTILITIES]: 'bg-yellow-100 text-yellow-800',
  [EXPENSE_CATEGORIES.RENT]: 'bg-pink-100 text-pink-800',
  [EXPENSE_CATEGORIES.SUPPLIES]: 'bg-blue-100 text-blue-800',
  [EXPENSE_CATEGORIES.MAINTENANCE]: 'bg-orange-100 text-orange-800',
  [EXPENSE_CATEGORIES.TRANSPORT]: 'bg-teal-100 text-teal-800',
  [EXPENSE_CATEGORIES.MARKETING]: 'bg-purple-100 text-purple-800',
  [EXPENSE_CATEGORIES.OTHER]: 'bg-gray-100 text-gray-800',
};

const CATEGORY_ICONS = {
  [EXPENSE_CATEGORIES.SALARY]: '👤',
  [EXPENSE_CATEGORIES.UTILITIES]: '💡',
  [EXPENSE_CATEGORIES.RENT]: '🏠',
  [EXPENSE_CATEGORIES.SUPPLIES]: '🧴',
  [EXPENSE_CATEGORIES.MAINTENANCE]: '🔧',
  [EXPENSE_CATEGORIES.TRANSPORT]: '🚚',
  [EXPENSE_CATEGORIES.MARKETING]: '📣',
  [EXPENSE_CATEGORIES.OTHER]: '📦',
};

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  other: 'Other',
};

export const getExpenseCategoryLabel = (category) => CATEGORY_LABELS[category] || 'Other';
export const getExpenseCategoryColor = (category) => CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
export const getExpenseCategoryIcon = (category) => CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
export const getExpensePaymentMethodLabel = (method) => PAYMENT_METHOD_LABELS[method] || method;

export const EXPENSE_CATEGORY_OPTIONS = Object.values(EXPENSE_CATEGORIES).map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

export const EXPENSE_PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const useExpenses = (params = {}) => {
  return useQuery({
    queryKey: [EXPENSE_QUERY_KEYS.EXPENSES, params],
    queryFn: () => expensesAPI.getAll(params),
    select: (response) => response.data.data,
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });
};

export const useExpenseSummary = () => {
  return useQuery({
    queryKey: [EXPENSE_QUERY_KEYS.SUMMARY],
    queryFn: () => expensesAPI.getSummary(),
    select: (response) => response.data.data,
    staleTime: 60 * 1000,
  });
};

const invalidateExpenses = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [EXPENSE_QUERY_KEYS.EXPENSES] });
  queryClient.invalidateQueries({ queryKey: [EXPENSE_QUERY_KEYS.SUMMARY] });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => expensesAPI.create(data),
    onSuccess: () => {
      invalidateExpenses(queryClient);
      toast.success('Expense recorded');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record expense');
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => expensesAPI.update(id, data),
    onSuccess: () => {
      invalidateExpenses(queryClient);
      toast.success('Expense updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update expense');
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => expensesAPI.delete(id),
    onSuccess: () => {
      invalidateExpenses(queryClient);
      toast.success('Expense deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    },
  });
};

export default {
  useExpenses,
  useExpenseSummary,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  getExpenseCategoryLabel,
  getExpenseCategoryColor,
  getExpenseCategoryIcon,
  getExpensePaymentMethodLabel,
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_PAYMENT_METHOD_OPTIONS,
};
