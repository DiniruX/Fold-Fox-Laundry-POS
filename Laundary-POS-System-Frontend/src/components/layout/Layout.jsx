import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowUpIcon } from '@heroicons/react/24/outline';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle scroll detection for dynamic styling
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const handleScroll = () => {
      const scrollTop = mainContent.scrollTop;
      setIsScrolled(scrollTop > 20);
      setShowScrollTop(scrollTop > 300);
    };

    mainContent.addEventListener('scroll', handleScroll);
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 relative">
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fe7f2d' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-slate-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <Header onMenuClick={handleMenuClick} />

        {/* Main content area */}
        <main 
          id="main-content"
          className="flex-1 overflow-y-auto scroll-smooth"
          style={{
            scrollBehavior: 'smooth',
          }}
        >
          {/* Content wrapper with max-width */}
          <div className="min-h-full">
            {/* Top spacing and breadcrumb area */}
            <div className={`sticky top-0 z-10 transition-all duration-300 ${
              isScrolled 
                ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-orange-100' 
                : 'bg-transparent'
            }`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {/* Breadcrumb or page indicator can go here */}
              </div>
            </div>

            {/* Main content with animation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="animate-fade-in">
                <Outlet key={location.pathname} />
              </div>
            </div>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12">
              <div className="border-t border-gray-200 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  {/* Footer left - Brand */}
                  <div className="flex items-center gap-3">
                    <img
                      src="/images/FFLogo.png"
                      alt="Fox Fold Logo"
                      className="h-10 w-10 rounded-lg shadow-sm object-contain bg-white"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#233d4d]">
                        Fox Fold POS System
                      </p>
                      <p className="text-xs text-gray-500">
                        Professional Management Suite
                      </p>
                    </div>
                  </div>

                  {/* Footer right - Copyright and links */}
                  <div className="text-center md:text-right">
                    <p className="text-sm text-gray-600">
                      © {new Date().getFullYear()} Fox Fold. All rights reserved.
                    </p>
                    <div className="flex items-center justify-center md:justify-end gap-4 mt-2">
                      <a href="#" className="text-xs text-gray-500 hover:text-[#fe7f2d] transition-colors">
                        Privacy Policy
                      </a>
                      <span className="text-gray-300">•</span>
                      <a href="#" className="text-xs text-gray-500 hover:text-[#fe7f2d] transition-colors">
                        Terms of Service
                      </a>
                      <span className="text-gray-300">•</span>
                      <a href="#" className="text-xs text-gray-500 hover:text-[#fe7f2d] transition-colors">
                        Support
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </main>

        {/* Scroll to top button */}
        <button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 z-50 p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group ${
            showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          style={{ 
            background: 'linear-gradient(135deg, #fe7f2d 0%, #fcab10 100%)',
          }}
          aria-label="Scroll to top"
        >
          <ArrowUpIcon className="w-5 h-5 text-white transform group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      <style>{`
        /* Custom scrollbar styling */
        #main-content::-webkit-scrollbar {
          width: 8px;
        }
        
        #main-content::-webkit-scrollbar-track {
          background: #e2e8f0;
        }
        
        #main-content::-webkit-scrollbar-thumb {
          background: #233d4d;
          border-radius: 10px;
        }
        
        #main-content::-webkit-scrollbar-thumb:hover {
          background: #1a2f3d;
        }

        /* Smooth scroll behavior */
        #main-content {
          scroll-behavior: smooth;
        }

        /* Page transition animation */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeInUp 0.3s ease-out;
        }

        /* Firefox scrollbar */
        #main-content {
          scrollbar-width: thin;
          scrollbar-color: #233d4d #e2e8f0;
        }
      `}</style>
    </div>
  );
};

export default Layout;
