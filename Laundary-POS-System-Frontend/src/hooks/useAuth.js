import { useAuth as useAuthContext } from '../context/AuthContext';

// Custom hook that provides additional authentication utilities
export const useAuth = () => {
  const authContext = useAuthContext();

  // Additional helper functions
  const isLoggedIn = () => {
    return authContext.isAuthenticated && authContext.user !== null;
  };

  const hasRole = (role) => {
    return authContext.user?.role === role;
  };

  const canAccess = (resource, action) => {
    return authContext.canAccess(resource, action);
  };

  const getUserDisplayName = () => {
    return authContext.user?.name || 'User';
  };

  const getUserInitials = () => {
    const name = authContext.user?.name || '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substr(0, 2);
  };

  const getRoleDisplayName = () => {
    const role = authContext.user?.role;
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'cashier':
        return 'Cashier';
      default:
        return 'User';
    }
  };

  const getRoleColor = () => {
    const role = authContext.user?.role;
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'cashier':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return {
    ...authContext,
    isLoggedIn,
    hasRole,
    canAccess,
    getUserDisplayName,
    getUserInitials,
    getRoleDisplayName,
    getRoleColor,
  };
};
