import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants';
import { cn } from '../../utils/helpers';

const Sidebar = ({ isOpen, onClose }) => {
  const { isAdmin, isCashier, canAccess, user } = useAuth();

  // Categorized navigation based on role
  const getNavigationCategories = () => {
    if (isAdmin()) {
      // Admin Navigation - Full Management Access
      return [
        {
          title: 'Overview',
          items: [
            {
              name: 'Dashboard',
              href: ROUTES.DASHBOARD,
              icon: HomeIcon,
              badge: null,
            },
          ],
        },
        {
          title: 'Core Operations',
          items: [
            {
              name: 'Orders',
              href: ROUTES.ORDERS,
              icon: ClipboardDocumentListIcon,
              canAccess: canAccess('orders', 'read'),
            },
            {
              name: 'Customers',
              href: ROUTES.CUSTOMERS,
              icon: UsersIcon,
              canAccess: canAccess('customers', 'read'),
            },
          ],
        },
        {
          title: 'Management',
          items: [
            {
              name: 'Services',
              href: ROUTES.SERVICES,
              icon: WrenchScrewdriverIcon,
              canAccess: canAccess('services', 'read'),
            },
            {
              name: 'Staff',
              href: ROUTES.STAFF,
              icon: UserGroupIcon,
              canAccess: canAccess('staff', 'read'),
            },
            {
              name: 'Users',
              href: ROUTES.USERS,
              icon: ShieldCheckIcon,
              canAccess: canAccess('users', 'read'),
            },
          ],
        },
        {
          title: 'Analytics',
          items: [
            {
              name: 'Reports',
              href: ROUTES.REPORTS,
              icon: ChartBarIcon,
              canAccess: canAccess('reports', 'read'),
            },
          ],
        },
      ];
    } else {
      // Cashier Navigation - Streamlined Operations
      return [
        {
          title: 'Quick Access',
          items: [
            {
              name: 'Dashboard',
              href: ROUTES.DASHBOARD,
              icon: HomeIcon,
            },
          ],
        },
        {
          title: 'Daily Operations',
          items: [
            {
              name: 'New Order',
              href: ROUTES.ORDERS,
              icon: SparklesIcon,
              canAccess: canAccess('orders', 'create'),
            },
            {
              name: 'Orders',
              href: ROUTES.ORDERS,
              icon: ClipboardDocumentListIcon,
              canAccess: canAccess('orders', 'read'),
            },
          ],
        },
        {
          title: 'Customer Service',
          items: [
            {
              name: 'Customers',
              href: ROUTES.CUSTOMERS,
              icon: UsersIcon,
              canAccess: canAccess('customers', 'read'),
            },
          ],
        },
        {
          title: 'Insights',
          items: [
            {
              name: 'Reports',
              href: ROUTES.REPORTS,
              icon: DocumentChartBarIcon,
              canAccess: canAccess('reports', 'read'),
            },
          ],
        },
      ];
    }
  };

  const categories = getNavigationCategories();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: '#233d4d' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <img
                src="/images/FFLogo.webp"
                alt="Fox Fold Logo"
                className="h-12 w-12 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200 object-contain bg-white/5 p-1.5"
              />
              <div>
                <span className="text-lg font-bold text-white block leading-tight">
                  Fold Fox
                </span>
                <span className="text-xs font-medium text-white/60">
                  {isAdmin() ? 'Admin Portal' : 'Cashier Terminal'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
            {categories.map((category) => {
              const visibleItems = category.items.filter(item => item.canAccess !== false);
              if (visibleItems.length === 0) return null;

              return (
                <div key={category.title}>
                  <h3 className="px-3 mb-3 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    {category.title}
                  </h3>
                  <div className="space-y-1">
                    {visibleItems.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                            isActive
                              ? 'text-white shadow-lg'
                              : 'text-white/70 hover:text-white hover:bg-white/5'
                          )
                        }
                        style={({ isActive }) => 
                          isActive 
                            ? { backgroundColor: '#fe7f2d' }
                            : {}
                        }
                        onClick={onClose}
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center">
                              <item.icon
                                className={cn(
                                  'mr-3 h-5 w-5 flex-shrink-0 transition-all duration-200',
                                  isActive 
                                    ? 'text-white drop-shadow-lg' 
                                    : 'text-white/60 group-hover:text-white'
                                )}
                                aria-hidden="true"
                              />
                              <span className="font-medium">{item.name}</span>
                            </div>
                            {item.badge && (
                              <span 
                                className="px-2 py-0.5 text-xs font-semibold rounded-full"
                                style={{ 
                                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#fe7f2d',
                                  color: 'white'
                                }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* User info at bottom */}
          <div className="p-4 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 hover:bg-white/10 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <div 
                  className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  style={{ backgroundColor: '#fe7f2d' }}
                >
                  <span className="text-white font-bold text-base">
                    {user?.name?.charAt(0).toUpperCase() || (isAdmin() ? 'A' : 'C')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.name || (isAdmin() ? 'Administrator' : 'Cashier')}
                  </p>
                  <p className="text-xs text-white/60 truncate flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
                    {isAdmin() ? 'Full Access' : 'Cashier Mode'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
};

export default Sidebar;
