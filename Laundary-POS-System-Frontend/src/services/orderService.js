import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersAPI } from './api';

// Query keys
export const ORDER_QUERY_KEYS = {
  ORDERS: 'orders',
  ORDER: 'order',
  ORDER_ANALYTICS: 'orderAnalytics',
  ORDER_STATS: 'orderStats',
};

// React Query hooks
export const useOrders = (params = {}) => {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.ORDERS, params],
    queryFn: () => ordersAPI.getAll(params),
    select: (response) => response.data.data,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useOrder = (id) => {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.ORDER, id],
    queryFn: () => ordersAPI.getById(id),
    select: (response) => response.data.data,
    enabled: !!id,
  });
};

export const useOrderAnalytics = (params = {}) => {
  return useQuery({
    queryKey: [ORDER_QUERY_KEYS.ORDER_ANALYTICS, params],
    queryFn: () => ordersAPI.getAnalytics(params),
    select: (response) => response.data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutations
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => ordersAPI.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDERS]);
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDER_ANALYTICS]);
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDER_STATS]);
      toast.success('Order created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create order';
      toast.error(message);
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => ordersAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDERS]);
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDER, variables.id]);
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDER_ANALYTICS]);
      toast.success('Order updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update order';
      toast.error(message);
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => ordersAPI.updateStatus(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDERS]);
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDER, variables.id]);
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDER_ANALYTICS]);
      toast.success('Order status updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update order status';
      toast.error(message);
    },
  });
};

export const useAddPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => ordersAPI.addPayment(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDERS]);
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDER, variables.id]);
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDER_ANALYTICS]);
      toast.success('Payment added successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to add payment';
      toast.error(message);
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => ordersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDERS]);
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDER_ANALYTICS]);
      toast.success('Order deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete order';
      toast.error(message);
    },
  });
};

export const useBulkUpdateOrders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => ordersAPI.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDERS]);
      queryClient.invalidateQueries([ORDER_QUERY_KEYS.ORDER_ANALYTICS]);
      toast.success('Orders updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update orders';
      toast.error(message);
    },
  });
};

// Utility functions
export const getOrderStatusLabel = (status) => {
  const statusLabels = {
    pickup: 'Ready for Pickup',
    received: 'Items Received',
    washing: 'Washing',
    drying: 'Drying',
    ironing: 'Ironing',
    dry_cleaning: 'Dry Cleaning',
    folding: 'Folding',
    packing: 'Packing',
    deliver: 'Ready for Delivery',
    complete: 'Order Complete',
  };
  return statusLabels[status] || status;
};

export const getOrderStatusColor = (status) => {
  const statusColors = {
    pickup: 'bg-orange-100 text-orange-800',
    received: 'bg-cyan-100 text-cyan-800',
    washing: 'bg-indigo-100 text-indigo-800',
    drying: 'bg-cyan-100 text-cyan-800',
    ironing: 'bg-purple-100 text-purple-800',
    dry_cleaning: 'bg-pink-100 text-pink-800',
    folding: 'bg-green-100 text-green-800',
    packing: 'bg-amber-100 text-amber-800',
    deliver: 'bg-teal-100 text-teal-800',
    complete: 'bg-emerald-100 text-emerald-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

export const getOrderTypeLabel = (type) => {
  const typeLabels = {
    standard: 'Standard',
  };
  return typeLabels[type] || type;
};

export const getOrderTypeColor = (type) => {
  const typeColors = {
    standard: 'bg-blue-100 text-blue-800',
  };
  return typeColors[type] || 'bg-gray-100 text-gray-800';
};

export const getPriorityLabel = (priority) => {
  const priorityLabels = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
  };
  return priorityLabels[priority] || priority;
};

export const getPriorityColor = (priority) => {
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  return priorityColors[priority] || 'bg-gray-100 text-gray-800';
};

export const getPaymentMethodLabel = (method) => {
  const methodLabels = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
  };
  return methodLabels[method] || method;
};

export const getPaymentStatusLabel = (status) => {
  const statusLabels = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return statusLabels[status] || status;
};

export const getPaymentStatusColor = (status) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

export const formatOrderNumber = (orderNumber) => {
  if (!orderNumber) return '';
  // Format as FL2412050001
  return orderNumber;
};

export const formatOrderDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatOrderAmount = (amount) => {
  if (amount === null || amount === undefined) return 'LKR 0';
  return `LKR ${parseFloat(amount).toLocaleString('en-LK')}`;
};

export const calculateOrderProgress = (status) => {
  const statusProgress = {
    pickup: 10,
    received: 20,
    washing: 35,
    drying: 45,
    ironing: 55,
    dry_cleaning: 65,
    folding: 75,
    packing: 85,
    deliver: 90,
    complete: 100,
  };
  return statusProgress[status] || 0;
};

export const getOrderTimeline = (order) => {
  const timeline = [];
  
  if (order.createdAt) {
    timeline.push({
      status: 'Order Created',
      date: order.createdAt,
      description: `Order ${order.orderNumber} created`,
      icon: '📝',
    });
  }

  if (order.status && order.status !== 'pickup') {
    timeline.push({
      status: 'Confirmed',
      date: order.createdAt, // This would be updated when status changes
      description: 'Order confirmed and ready for processing',
      icon: '✅',
    });
  }

  // Add more timeline items based on status
  if (['washing', 'drying', 'ironing', 'dry_cleaning', 'folding', 'packing', 'deliver', 'complete'].includes(order.status)) {
    timeline.push({
      status: getOrderStatusLabel(order.status),
      date: new Date(), // This would be the actual status change date
      description: `Order moved to ${getOrderStatusLabel(order.status)}`,
      icon: '🔄',
    });
  }

  return timeline;
};

export const orderValidation = {
  items: {
    required: 'At least one order item is required',
  },
  'items.*.serviceId': {
    required: 'Service is required for each item',
  },
  pickupDate: {
    required: 'Pickup date is required',
  },
  customerInfo: {
    name: {
      required: 'Customer name is required',
    },
    phone: {
      required: 'Customer phone is required',
    },
  },
};

export default {
  useOrders,
  useOrder,
  useOrderAnalytics,
  useCreateOrder,
  useUpdateOrder,
  useUpdateOrderStatus,
  useAddPayment,
  useDeleteOrder,
  useBulkUpdateOrders,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOrderTypeLabel,
  getOrderTypeColor,
  getPriorityLabel,
  getPriorityColor,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  formatOrderNumber,
  formatOrderDate,
  formatOrderAmount,
  calculateOrderProgress,
  getOrderTimeline,
  orderValidation,
};
