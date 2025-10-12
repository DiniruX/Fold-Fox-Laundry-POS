import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import staffService from '../services/staffService';
import toast from 'react-hot-toast';

/**
 * Custom hook for staff service operations
 * Provides React Query integration for staff management
 */
export const useStaffService = () => {
  const queryClient = useQueryClient();

  // Create staff mutation
  const createStaff = useMutation({
    mutationFn: (staffData) => {
      const validation = staffService.validateStaffData(staffData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
      }
      const formattedData = staffService.formatStaffData(staffData);
      return staffService.createStaff(formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffStats'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create staff member');
    },
  });

  // Update staff mutation
  const updateStaff = useMutation({
    mutationFn: ({ id, staffData }) => {
      const validation = staffService.validateStaffData(staffData, true);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
      }
      const formattedData = staffService.formatStaffData(staffData);
      return staffService.updateStaff(id, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffStats'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update staff member');
    },
  });

  // Delete staff mutation
  const deleteStaff = useMutation({
    mutationFn: (id) => staffService.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffStats'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete staff member');
    },
  });

  // Update staff status mutation
  const updateStaffStatus = useMutation({
    mutationFn: ({ id, statusData }) => staffService.updateStaffStatus(id, statusData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffStats'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update staff status');
    },
  });

  // Update attendance mutation
  const updateAttendance = useMutation({
    mutationFn: ({ id, attendanceData }) => staffService.updateAttendance(id, attendanceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffStats'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update attendance');
    },
  });

  // Add skill mutation
  const addSkill = useMutation({
    mutationFn: ({ id, skillData }) => staffService.addSkill(id, skillData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add skill');
    },
  });

  // Add training mutation
  const addTraining = useMutation({
    mutationFn: ({ id, trainingData }) => staffService.addTraining(id, trainingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add training record');
    },
  });

  // Bulk update mutation
  const bulkUpdateStaff = useMutation({
    mutationFn: (bulkData) => staffService.bulkUpdateStaff(bulkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffStats'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to perform bulk update');
    },
  });

  return {
    // Mutations
    createStaff,
    updateStaff,
    deleteStaff,
    updateStaffStatus,
    updateAttendance,
    addSkill,
    addTraining,
    bulkUpdateStaff,
    
    // Service methods (for direct API calls)
    getAllStaff: staffService.getAllStaff.bind(staffService),
    getStaffById: staffService.getStaffById.bind(staffService),
    getStaffStats: staffService.getStaffStats.bind(staffService),
    searchStaff: staffService.searchStaff.bind(staffService),
    getStaffAnalytics: staffService.getStaffAnalytics.bind(staffService),
    
    // Utility methods
    validateStaffData: staffService.validateStaffData.bind(staffService),
    formatStaffData: staffService.formatStaffData.bind(staffService),
    getEmploymentTypeOptions: staffService.getEmploymentTypeOptions.bind(staffService),
    getEmploymentStatusOptions: staffService.getEmploymentStatusOptions.bind(staffService),
    getSkillLevelOptions: staffService.getSkillLevelOptions.bind(staffService),
    getSystemAccessOptions: staffService.getSystemAccessOptions.bind(staffService),
    getPhysicalAccessAreaOptions: staffService.getPhysicalAccessAreaOptions.bind(staffService),
    getWorkingDaysOptions: staffService.getWorkingDaysOptions.bind(staffService),
    getShiftTypeOptions: staffService.getShiftTypeOptions.bind(staffService),
    getPaymentFrequencyOptions: staffService.getPaymentFrequencyOptions.bind(staffService),
    getCurrencyOptions: staffService.getCurrencyOptions.bind(staffService),
    getGenderOptions: staffService.getGenderOptions.bind(staffService),
  };
};

/**
 * Custom hook for fetching staff data with React Query
 */
export const useStaff = (refreshTrigger = 0) => {
  const {
    data: staff,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['staff', refreshTrigger],
    queryFn: () => staffService.getAllStaff(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    staff,
    isLoading,
    error: error?.message,
    refetch,
  };
};

/**
 * Custom hook for fetching a single staff member
 */
export const useStaffMember = (id) => {
  const {
    data: staffMember,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffService.getStaffById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    staffMember,
    error: error?.message,
    isLoading,
    refetch,
  };
};

/**
 * Custom hook for staff analytics
 */
export const useStaffAnalytics = (id) => {
  const {
    data: analytics,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['staffAnalytics', id],
    queryFn: () => staffService.getStaffAnalytics(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    analytics,
    error: error?.message,
    isLoading,
    refetch,
  };
};

/**
 * Custom hook for staff search
 */
export const useStaffSearch = (searchParams) => {
  const {
    data: searchResults,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['staffSearch', searchParams],
    queryFn: () => staffService.searchStaff(searchParams),
    enabled: !!searchParams?.q && searchParams.q.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    searchResults,
    error: error?.message,
    isLoading,
    refetch,
  };
};

export default useStaffService;
