import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { servicesAPI } from './api';

// Query Keys
export const SERVICE_QUERY_KEYS = {
  SERVICES: 'services',
  SERVICE: 'service',
  SERVICE_STATS: 'serviceStats',
  SERVICE_STATUSES: 'serviceStatuses',
  SERVICE_ANALYTICS: 'serviceAnalytics',
};

// Custom hooks for service management
export const useServices = (params = {}) => {
  return useQuery({
    queryKey: [SERVICE_QUERY_KEYS.SERVICES, params],
    queryFn: () => servicesAPI.getAll(params),
    select: (response) => response.data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useService = (id) => {
  return useQuery({
    queryKey: [SERVICE_QUERY_KEYS.SERVICE, id],
    queryFn: () => servicesAPI.getById(id),
    select: (response) => response.data.service,
    enabled: !!id,
  });
};

export const useServiceStats = () => {
  return useQuery({
    queryKey: [SERVICE_QUERY_KEYS.SERVICE_STATS],
    queryFn: () => servicesAPI.getStats(),
    select: (response) => response.data.data,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useServiceStatuses = () => {
  return useQuery({
    queryKey: [SERVICE_QUERY_KEYS.SERVICE_STATUSES],
    queryFn: () => servicesAPI.getStatuses(),
    select: (response) => response.data.statuses,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useServiceAnalytics = (id, params = {}) => {
  return useQuery({
    queryKey: [SERVICE_QUERY_KEYS.SERVICE_ANALYTICS, id, params],
    queryFn: () => servicesAPI.getAnalytics(id, params),
    select: (response) => response.data.data,
    enabled: !!id,
  });
};

export const useSearchServices = (params = {}) => {
  return useQuery({
    queryKey: ['servicesSearch', params],
    queryFn: () => servicesAPI.search(params),
    select: (response) => response.data.data,
    enabled: !!params.q && params.q.length >= 2,
  });
};

// Mutations
export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => servicesAPI.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICES]);
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICE_STATS]);
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICE_STATUSES]);
      toast.success('Service created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create service';
      toast.error(message);
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => servicesAPI.update(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICES]);
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICE, id]);
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICE_STATS]);
      toast.success('Service updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update service';
      toast.error(message);
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => servicesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICES]);
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICE_STATS]);
      toast.success('Service deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete service';
      toast.error(message);
    },
  });
};

export const useToggleServiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }) => servicesAPI.toggleStatus(id, { isActive }),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICES]);
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICE, id]);
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICE_STATS]);
      toast.success('Service status updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update service status';
      toast.error(message);
    },
  });
};

export const useBulkUpdateServices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => servicesAPI.bulkUpdate(data),
    onSuccess: (response, { action }) => {
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICES]);
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICE_STATS]);
      toast.success(`Bulk ${action} completed successfully`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to perform bulk update';
      toast.error(message);
    },
  });
};

export const useDuplicateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => servicesAPI.duplicate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICES]);
      queryClient.invalidateQueries([SERVICE_QUERY_KEYS.SERVICE_STATS]);
      toast.success('Service duplicated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to duplicate service';
      toast.error(message);
    },
  });
};

export const useCalculateServicePrice = () => {
  return useMutation({
    mutationFn: ({ id, data }) => servicesAPI.calculatePrice(id, data),
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to calculate price';
      toast.error(message);
    },
  });
};

// Utility functions
export const formatPrice = (price, priceType, clothingCategory = null) => {
  if (priceType === 'per_kg') return `LKR ${price}/kg`;
  if (priceType === 'per_piece') {
    if (clothingCategory) {
      return `LKR ${price}/piece (${getClothingCategoryLabel(clothingCategory)})`;
    }
    return `LKR ${price}/piece`;
  }
  return `LKR ${price}`;
};

export const getPriceTypeLabel = (priceType) => {
  const labels = {
    per_kg: 'Per Kilogram',
    per_piece: 'Per Piece',
  };
  return labels[priceType] || priceType;
};


export const getStatusLabel = (status) => {
  const labels = {
    wash: 'Wash',
    dry: 'Dry',
    iron: 'Iron',
    dry_clean: 'Dry Clean',
    fold: 'Fold',
  };
  return labels[status] || status;
};

export const getClothingCategoryLabel = (category) => {
  const labels = {
    normal_clothes: 'Normal Clothes',
    bed_sheets: 'Bed Sheets',
    towels: 'Towels',
    blazers: 'Blazers',
    saree: 'Saree',
    curtains: 'Curtains',
    pillowcases: 'Pillowcases',
    suits: 'Suits',
    jeans: 'Jeans',
    blankets: 'Blankets',
    other: 'Other',
  };
  return labels[category] || category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getStatusBadgeColor = (isActive) => {
  return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
};


export const getStatusColor = (status) => {
  const colors = {
    wash: 'bg-blue-100 text-blue-800',
    dry: 'bg-orange-100 text-orange-800',
    iron: 'bg-yellow-100 text-yellow-800',
    dry_clean: 'bg-purple-100 text-purple-800',
    fold: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getClothingCategoryColor = (category) => {
  const colors = {
    normal_clothes: 'bg-gray-100 text-gray-800',
    bed_sheets: 'bg-blue-100 text-blue-800',
    towels: 'bg-orange-100 text-orange-800',
    blazers: 'bg-indigo-100 text-indigo-800',
    saree: 'bg-pink-100 text-pink-800',
    curtains: 'bg-purple-100 text-purple-800',
    pillowcases: 'bg-green-100 text-green-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

// Service validation schemas
export const serviceValidation = {
  name: {
    required: 'Service name is required',
    minLength: { value: 2, message: 'Name must be at least 2 characters' },
    maxLength: { value: 50, message: 'Name must be less than 50 characters' },
  },
  description: {
    maxLength: { value: 200, message: 'Description must be less than 200 characters' },
  },
  basePrice: {
    required: 'Base price is required',
    min: { value: 0, message: 'Price must be non-negative' },
    max: { value: 999999, message: 'Price is too high' },
  },
  estimatedTime: {
    required: 'Estimated time is required',
    min: { value: 1, message: 'Time must be at least 1 minute' },
    max: { value: 1440, message: 'Time cannot exceed 24 hours' },
  },
  category: {
    required: 'Category is required',
  },
  priceType: {
    required: 'Price type is required',
  },
};

export default {
  useServices,
  useService,
  useServiceStats,
  useServiceStatuses,
  useServiceAnalytics,
  useSearchServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useToggleServiceStatus,
  useBulkUpdateServices,
  useDuplicateService,
  useCalculateServicePrice,
  formatPrice,
  getPriceTypeLabel,
  getStatusLabel,
  getClothingCategoryLabel,
  getStatusBadgeColor,
  getStatusColor,
  getClothingCategoryColor,
  serviceValidation,
};
