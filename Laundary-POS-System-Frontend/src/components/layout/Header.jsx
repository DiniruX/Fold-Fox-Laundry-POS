import React, { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { getInitials, capitalize } from '../../utils/helpers';
import ProfileModal from '../modals/ProfileModal';
import LogoutModal from '../modals/LogoutModal';

const Header = ({ onMenuClick }) => {
  const { user, logout, isAdmin, isCashier } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const handleLogout = () => {
    setIsLogoutOpen(true);
  };

  // Get current time
  const [currentTime, setCurrentTime] = useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header 
      className="shadow-md border-b"
      style={{ 
        backgroundColor: '#233d4d',
        borderBottomColor: 'rgba(254, 127, 45, 0.2)'
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Menu button and search */}
          <div className="flex items-center flex-1 space-x-4">
            <button
              type="button"
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 lg:hidden"
              style={{ focusRingColor: '#fe7f2d' }}
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            
            {/* Search bar - Desktop only */}
            <div className="hidden md:flex items-center flex-1 max-w-lg">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-white/40" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl leading-5 bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-white/20 focus:ring-2 transition-all duration-200 text-sm"
                  style={{ focusRingColor: 'rgba(254, 127, 45, 0.3)' }}
                  placeholder="Search orders, customers..."
                />
              </div>
            </div>

            {/* Current time - Desktop only */}
            <div className="hidden lg:flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm">
              <ClockIcon className="h-5 w-5 text-white/60" />
              <span className="text-sm font-medium text-white/80">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            </div>
          </div>

          {/* Right side - Notifications and user menu */}
          <div className="flex items-center space-x-3">
            {/* Search button - Mobile only */}
            <button
              type="button"
              className="md:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 transition-all duration-200 relative"
            >
              <span className="sr-only">Search</span>
              <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 transition-all duration-200 relative"
              style={{ focusRingColor: '#fe7f2d' }}
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              {/* Notification badge */}
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full ring-2 ring-[#233d4d] bg-[#fe7f2d]"></span>
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-white/10"></div>

            {/* User menu */}
            <Menu as="div" className="relative">
              <div>
                <Menu.Button className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{ focusRingColor: '#fe7f2d' }}
                >
                  <div className="flex items-center space-x-3">
                    {/* User avatar */}
                    <div 
                      className="h-9 w-9 rounded-lg flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: '#fe7f2d' }}
                    >
                      <span className="text-sm font-bold text-white">
                        {getInitials(user?.name)}
                      </span>
                    </div>
                    
                    {/* User info - hidden on mobile */}
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-white leading-tight">{user?.name}</p>
                      <p className="text-xs text-white/60 leading-tight">{capitalize(user?.role)}</p>
                    </div>

                    {/* Dropdown arrow */}
                    <svg className="hidden md:block h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items 
                  className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl shadow-xl ring-1 ring-white/10 focus:outline-none overflow-hidden"
                  style={{ backgroundColor: '#1a2d3a' }}
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-white/60 mt-0.5">{user?.email}</p>
                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: 'rgba(254, 127, 45, 0.15)', color: '#fe7f2d' }}
                    >
                      {capitalize(user?.role)}
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? 'bg-white/5' : ''
                          } flex items-center w-full px-4 py-2.5 text-sm text-white/80 hover:text-white transition-colors duration-150`}
                          onClick={() => setIsProfileOpen(true)}
                        >
                          <UserCircleIcon className="mr-3 h-5 w-5 text-white/60" />
                          View Profile
                        </button>
                      )}
                    </Menu.Item>

                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? 'bg-white/5' : ''
                          } flex items-center w-full px-4 py-2.5 text-sm text-white/80 hover:text-white transition-colors duration-150`}
                        >
                          <Cog6ToothIcon className="mr-3 h-5 w-5 text-white/60" />
                          Settings
                        </button>
                      )}
                    </Menu.Item>

                    <div className="border-t border-white/10 my-1"></div>

                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? 'bg-red-500/10' : ''
                          } flex items-center w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 transition-colors duration-150`}
                          onClick={handleLogout}
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
      />
    </header>
  );
};

export default Header;
