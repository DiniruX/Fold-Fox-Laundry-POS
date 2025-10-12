// Simple role-based permissions
const ROLE_PERMISSIONS = {
  admin: {
    // Full access to everything
    users: ['create', 'read', 'update', 'delete'],
    customers: ['create', 'read', 'update', 'delete'],
    orders: ['create', 'read', 'update', 'delete'],
    services: ['create', 'read', 'update', 'delete'],
    staff: ['create', 'read', 'update', 'delete'],
    reports: ['read']
  },
  cashier: {
    // Limited access
    customers: ['create', 'read', 'update', 'delete'],
    orders: ['create', 'read', 'update', 'delete'],
    services: ['read'],
    reports: ['read']
  }
};

// Helper function to check if user has permission
const hasPermission = (userRole, resource, action) => {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions || !permissions[resource]) return false;
  return permissions[resource].includes(action);
};

// Helper function to get user permissions
const getUserPermissions = (userRole) => {
  return ROLE_PERMISSIONS[userRole] || {};
};

module.exports = { 
  ROLE_PERMISSIONS, 
  hasPermission, 
  getUserPermissions 
};


