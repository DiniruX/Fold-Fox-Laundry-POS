// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier'
};

// Routes
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CUSTOMERS: '/customers',
  ORDERS: '/orders',
  SERVICES: '/services',
  STAFF: '/staff',
  USERS: '/users',
  REPORTS: '/reports'
};

// Order Status - Simplified Workflow
export const ORDER_STATUS = {
  PICKUP: 'pickup',           // If pickup required
  RECEIVED: 'received',       // After pickup or for self-service
  WASHING: 'washing',         // Based on service statuses
  DRYING: 'drying',           // Based on service statuses
  IRONING: 'ironing',         // Based on service statuses
  DRY_CLEANING: 'dry_cleaning', // Based on service statuses
  FOLDING: 'folding',         // Based on service statuses
  COMPLETE: 'complete',       // All services completed
  DELIVER: 'deliver',         // If delivery required
  CANCELLED: 'cancelled'
};

// Order Types (simplified - removed, keeping for backward compatibility)
export const ORDER_TYPES = {
  STANDARD: 'standard'
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer'
};


// Service Statuses (Steps in the laundry process)
export const SERVICE_STATUSES = {
  WASH: 'wash',
  DRY: 'dry',
  IRON: 'iron',
  DRY_CLEAN: 'dry_clean',
  FOLD: 'fold'
};

// Service Price Types
export const SERVICE_PRICE_TYPES = {
  PER_KG: 'per_kg',
  PER_PIECE: 'per_piece'
};

// Clothing Categories for per_piece pricing
export const CLOTHING_CATEGORIES = {
  NORMAL_CLOTHES: 'normal_clothes',
  BED_SHEETS: 'bed_sheets',
  TOWELS: 'towels',
  BLAZERS: 'blazers',
  SAREE: 'saree',
  CURTAINS: 'curtains',
  PILLOWCASES: 'pillowcases'
};

// Staff Departments
export const STAFF_DEPARTMENTS = {
  OPERATIONS: 'operations',
  CUSTOMER_SERVICE: 'customer_service',
  QUALITY_CONTROL: 'quality_control',
  DELIVERY: 'delivery',
  MAINTENANCE: 'maintenance',
  ADMINISTRATION: 'administration'
};

// Employment Types
export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  INTERN: 'intern'
};

// Employment Status
export const EMPLOYMENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TERMINATED: 'terminated',
  ON_LEAVE: 'on_leave',
  SUSPENDED: 'suspended'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data'
};

// UI Constants
export const UI = {
  SIDEBAR_WIDTH: 256,
  HEADER_HEIGHT: 64,
  ANIMATION_DURATION: 200
};

// Form Validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[0-9]{10,15}$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MAX_LENGTH: 50,
  TEXTAREA_MAX_LENGTH: 500
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm'
};
