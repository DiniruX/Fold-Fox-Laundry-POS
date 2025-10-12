const { authorizeRole, authorizeResource } = require('./auth');

// Role-based middleware shortcuts
const requireAdmin = authorizeRole(['admin']);
const requireCashierOrAdmin = authorizeRole(['admin', 'cashier']);

// Resource-based middleware shortcuts
const canManageUsers = authorizeResource('users', 'create');
const canViewUsers = authorizeResource('users', 'read');
const canUpdateUsers = authorizeResource('users', 'update');
const canDeleteUsers = authorizeResource('users', 'delete');

const canManageCustomers = authorizeResource('customers', 'create');
const canViewCustomers = authorizeResource('customers', 'read');
const canUpdateCustomers = authorizeResource('customers', 'update');
const canDeleteCustomers = authorizeResource('customers', 'delete');

const canManageOrders = authorizeResource('orders', 'create');
const canViewOrders = authorizeResource('orders', 'read');
const canUpdateOrders = authorizeResource('orders', 'update');
const canDeleteOrders = authorizeResource('orders', 'delete');

const canManageServices = authorizeResource('services', 'create');
const canViewServices = authorizeResource('services', 'read');
const canUpdateServices = authorizeResource('services', 'update');
const canDeleteServices = authorizeResource('services', 'delete');

const canManageStaff = authorizeResource('staff', 'create');
const canViewStaff = authorizeResource('staff', 'read');
const canUpdateStaff = authorizeResource('staff', 'update');
const canDeleteStaff = authorizeResource('staff', 'delete');

const canViewReports = authorizeResource('reports', 'read');

module.exports = {
  // Role-based middleware
  requireAdmin,
  requireCashierOrAdmin,
  
  // User permissions
  canManageUsers,
  canViewUsers,
  canUpdateUsers,
  canDeleteUsers,
  
  // Customer permissions
  canManageCustomers,
  canViewCustomers,
  canUpdateCustomers,
  canDeleteCustomers,
  
  // Order permissions
  canManageOrders,
  canViewOrders,
  canUpdateOrders,
  canDeleteOrders,
  
  // Service permissions
  canManageServices,
  canViewServices,
  canUpdateServices,
  canDeleteServices,
  
  // Staff permissions
  canManageStaff,
  canViewStaff,
  canUpdateStaff,
  canDeleteStaff,
  
  // Report permissions
  canViewReports
};
