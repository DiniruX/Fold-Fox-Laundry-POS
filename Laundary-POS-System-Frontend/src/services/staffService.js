import { staffAPI } from './api';

/**
 * Staff Service - Handles all staff-related API operations
 * Provides methods for CRUD operations, analytics, and bulk operations
 */
class StaffService {
  /**
   * Get all staff members with filtering and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getAllStaff(params = {}) {
    try {
      const response = await staffAPI.getAll(params);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch staff members');
    }
  }

  /**
   * Get staff member by ID
   * @param {string} id - Staff ID
   * @returns {Promise} API response
   */
  async getStaffById(id) {
    try {
      const response = await staffAPI.getById(id);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch staff member');
    }
  }

  /**
   * Create new staff member
   * @param {Object} staffData - Staff data
   * @returns {Promise} API response
   */
  async createStaff(staffData) {
    try {
      const response = await staffAPI.create(staffData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create staff member');
    }
  }

  /**
   * Update staff member
   * @param {string} id - Staff ID
   * @param {Object} staffData - Updated staff data
   * @returns {Promise} API response
   */
  async updateStaff(id, staffData) {
    try {
      const response = await staffAPI.update(id, staffData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update staff member');
    }
  }

  /**
   * Delete staff member
   * @param {string} id - Staff ID
   * @returns {Promise} API response
   */
  async deleteStaff(id) {
    try {
      const response = await staffAPI.delete(id);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete staff member');
    }
  }

  /**
   * Update staff status
   * @param {string} id - Staff ID
   * @param {Object} statusData - Status update data
   * @returns {Promise} API response
   */
  async updateStaffStatus(id, statusData) {
    try {
      const response = await staffAPI.updateStatus(id, statusData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update staff status');
    }
  }

  /**
   * Update staff attendance
   * @param {string} id - Staff ID
   * @param {Object} attendanceData - Attendance data
   * @returns {Promise} API response
   */
  async updateAttendance(id, attendanceData) {
    try {
      const response = await staffAPI.updateAttendance(id, attendanceData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update attendance');
    }
  }

  /**
   * Add skill to staff member
   * @param {string} id - Staff ID
   * @param {Object} skillData - Skill data
   * @returns {Promise} API response
   */
  async addSkill(id, skillData) {
    try {
      const response = await staffAPI.addSkill(id, skillData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add skill');
    }
  }

  /**
   * Add training record to staff member
   * @param {string} id - Staff ID
   * @param {Object} trainingData - Training data
   * @returns {Promise} API response
   */
  async addTraining(id, trainingData) {
    try {
      const response = await staffAPI.addTraining(id, trainingData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add training record');
    }
  }

  /**
   * Bulk update staff members
   * @param {Object} bulkData - Bulk update data
   * @returns {Promise} API response
   */
  async bulkUpdateStaff(bulkData) {
    try {
      const response = await staffAPI.bulkUpdate(bulkData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to perform bulk update');
    }
  }

  /**
   * Get staff statistics
   * @returns {Promise} API response
   */
  async getStaffStats() {
    try {
      const response = await staffAPI.getStats();
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch staff statistics');
    }
  }

  /**
   * Search staff members
   * @param {Object} params - Search parameters
   * @returns {Promise} API response
   */
  async searchStaff(params) {
    try {
      const response = await staffAPI.search(params);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search staff');
    }
  }

  /**
   * Get staff performance analytics
   * @param {string} id - Staff ID
   * @returns {Promise} API response
   */
  async getStaffAnalytics(id) {
    try {
      const response = await staffAPI.getAnalytics(id);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch staff analytics');
    }
  }

  /**
   * Validate staff data before submission
   * @param {Object} staffData - Staff data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validation result
   */
  validateStaffData(staffData, isUpdate = false) {
    const errors = {};

    // Personal Information Validation
    if (!staffData.personalInfo?.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!staffData.personalInfo?.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!staffData.personalInfo?.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    if (!staffData.personalInfo?.gender) {
      errors.gender = 'Gender is required';
    }
    if (!staffData.personalInfo?.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10,15}$/.test(staffData.personalInfo.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }

    // Email validation (optional but must be valid if provided)
    if (staffData.personalInfo?.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(staffData.personalInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Employment Information Validation
    if (!staffData.employmentInfo?.position?.trim()) {
      errors.position = 'Position is required';
    }
    if (!staffData.employmentInfo?.hireDate) {
      errors.hireDate = 'Hire date is required';
    }

    // Salary validation
    if (staffData.employmentInfo?.salary?.amount && staffData.employmentInfo.salary.amount < 0) {
      errors.salary = 'Salary amount cannot be negative';
    }

    // Date validations
    if (staffData.personalInfo?.dateOfBirth) {
      const birthDate = new Date(staffData.personalInfo.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        errors.dateOfBirth = 'Date of birth must be in the past';
      }
    }

    if (staffData.employmentInfo?.hireDate) {
      const hireDate = new Date(staffData.employmentInfo.hireDate);
      const today = new Date();
      if (hireDate > today) {
        errors.hireDate = 'Hire date cannot be in the future';
      }
    }

    // Cross-field validation
    if (staffData.personalInfo?.dateOfBirth && staffData.employmentInfo?.hireDate) {
      const birthDate = new Date(staffData.personalInfo.dateOfBirth);
      const hireDate = new Date(staffData.employmentInfo.hireDate);
      const ageAtHire = hireDate.getFullYear() - birthDate.getFullYear();
      
      if (ageAtHire < 16) {
        errors.dateOfBirth = 'Staff member must be at least 16 years old at hire date';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Format staff data for API submission
   * @param {Object} staffData - Raw staff data
   * @returns {Object} Formatted staff data
   */
  formatStaffData(staffData) {
    const formatted = { ...staffData };

    // Clean and format personal information
    if (formatted.personalInfo) {
      // Trim string fields
      Object.keys(formatted.personalInfo).forEach(key => {
        if (typeof formatted.personalInfo[key] === 'string') {
          formatted.personalInfo[key] = formatted.personalInfo[key].trim();
        }
      });

      // Handle empty email
      if (formatted.personalInfo.email === '') {
        delete formatted.personalInfo.email;
      }

      // Format address
      if (formatted.personalInfo.address) {
        Object.keys(formatted.personalInfo.address).forEach(key => {
          if (typeof formatted.personalInfo.address[key] === 'string') {
            formatted.personalInfo.address[key] = formatted.personalInfo.address[key].trim();
          }
        });
      }

      // Format emergency contact
      if (formatted.personalInfo.emergencyContact) {
        Object.keys(formatted.personalInfo.emergencyContact).forEach(key => {
          if (typeof formatted.personalInfo.emergencyContact[key] === 'string') {
            formatted.personalInfo.emergencyContact[key] = formatted.personalInfo.emergencyContact[key].trim();
          }
        });
      }
    }

    // Clean and format employment information
    if (formatted.employmentInfo) {
      // Trim string fields
      Object.keys(formatted.employmentInfo).forEach(key => {
        if (typeof formatted.employmentInfo[key] === 'string') {
          formatted.employmentInfo[key] = formatted.employmentInfo[key].trim();
        }
      });

      // Remove empty reportingManager (should be ObjectId or undefined, not empty string)
      if (formatted.employmentInfo.reportingManager === '' || !formatted.employmentInfo.reportingManager) {
        delete formatted.employmentInfo.reportingManager;
      }

      // Ensure working days is an array
      if (formatted.employmentInfo.workSchedule?.workingDays) {
        formatted.employmentInfo.workSchedule.workingDays = Array.isArray(formatted.employmentInfo.workSchedule.workingDays)
          ? formatted.employmentInfo.workSchedule.workingDays
          : [];
      }
    }

    return formatted;
  }

  /**
   * Get employment type options for dropdowns
   * @returns {Array} Employment type options
   */
  getEmploymentTypeOptions() {
    return [
      { value: 'full_time', label: 'Full Time' },
      { value: 'part_time', label: 'Part Time' },
      { value: 'contract', label: 'Contract' },
      { value: 'intern', label: 'Intern' },
    ];
  }

  /**
   * Get employment status options for dropdowns
   * @returns {Array} Employment status options
   */
  getEmploymentStatusOptions() {
    return [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'terminated', label: 'Terminated' },
      { value: 'on_leave', label: 'On Leave' },
      { value: 'suspended', label: 'Suspended' },
    ];
  }

  /**
   * Get skill level options for dropdowns
   * @returns {Array} Skill level options
   */
  getSkillLevelOptions() {
    return [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
      { value: 'expert', label: 'Expert' },
    ];
  }

  /**
   * Get system access options for checkboxes
   * @returns {Array} System access options
   */
  getSystemAccessOptions() {
    return [
      { value: 'orders', label: 'Orders' },
      { value: 'customers', label: 'Customers' },
      { value: 'services', label: 'Services' },
      { value: 'reports', label: 'Reports' },
      { value: 'inventory', label: 'Inventory' },
    ];
  }

  /**
   * Get physical access area options for checkboxes
   * @returns {Array} Physical access area options
   */
  getPhysicalAccessAreaOptions() {
    return [
      { value: 'washing_area', label: 'Washing Area' },
      { value: 'drying_area', label: 'Drying Area' },
      { value: 'ironing_area', label: 'Ironing Area' },
      { value: 'packaging_area', label: 'Packaging Area' },
      { value: 'storage_area', label: 'Storage Area' },
      { value: 'office_area', label: 'Office Area' },
    ];
  }

  /**
   * Get working days options for checkboxes
   * @returns {Array} Working days options
   */
  getWorkingDaysOptions() {
    return [
      { value: 'monday', label: 'Monday' },
      { value: 'tuesday', label: 'Tuesday' },
      { value: 'wednesday', label: 'Wednesday' },
      { value: 'thursday', label: 'Thursday' },
      { value: 'friday', label: 'Friday' },
      { value: 'saturday', label: 'Saturday' },
      { value: 'sunday', label: 'Sunday' },
    ];
  }

  /**
   * Get shift type options for dropdowns
   * @returns {Array} Shift type options
   */
  getShiftTypeOptions() {
    return [
      { value: 'morning', label: 'Morning' },
      { value: 'afternoon', label: 'Afternoon' },
      { value: 'evening', label: 'Evening' },
      { value: 'night', label: 'Night' },
    ];
  }

  /**
   * Get payment frequency options for dropdowns
   * @returns {Array} Payment frequency options
   */
  getPaymentFrequencyOptions() {
    return [
      { value: 'monthly', label: 'Monthly' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'daily', label: 'Daily' },
    ];
  }

  /**
   * Get currency options for dropdowns
   * @returns {Array} Currency options
   */
  getCurrencyOptions() {
    return [
      { value: 'LKR', label: 'LKR (Sri Lankan Rupee)' },
      { value: 'USD', label: 'USD (US Dollar)' },
      { value: 'EUR', label: 'EUR (Euro)' },
    ];
  }

  /**
   * Get gender options for dropdowns
   * @returns {Array} Gender options
   */
  getGenderOptions() {
    return [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ];
  }
}

// Create and export a singleton instance
const staffService = new StaffService();
export default staffService;
