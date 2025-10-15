import { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import campaignConfig, { isCampaignActive, getDiscountText, getButtonText, shouldShowNavbarBadge, getNavbarBadgeText } from '../../config/campaign';

/**
 * Navigation Component
 * Sticky navigation bar with smooth scrolling
 */
const Navigation = ({ onRegisterClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Why Choose Us', href: '#why-choose-us' },
    { name: 'Services', href: '#services' },
    { name: 'Contact', href: '#contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if scrolled past threshold
      setIsScrolled(currentScrollY > 50);
      
      // Determine visibility based on scroll direction
      if (currentScrollY < 10) {
        // Always show at top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past threshold - hide
        setIsVisible(false);
        setIsOpen(false); // Close mobile menu when hiding
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLinkClick = (href) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav 
      className={`fixed left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-out ${
        isVisible ? 'top-4 opacity-100' : '-top-32 opacity-0'
      }`}
    >
      {/* Enhanced Glassmorphic Navy Container */}
      <div className={`max-w-7xl mx-auto transition-all duration-500 ease-out rounded-2xl border relative overflow-hidden ${
        isScrolled 
          ? 'py-3 shadow-2xl' 
          : 'py-4 shadow-xl'
      }`}>
        {/* Glassy Navy Background with Blur */}
        <div className={`absolute inset-0 transition-all duration-500 ${
          isScrolled
            ? 'bg-navy/95 backdrop-blur-3xl'
            : 'bg-navy/85 backdrop-blur-2xl'
        }`}></div>
        
        {/* Gradient Overlay for Depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-navy/20 pointer-events-none"></div>
        
        {/* Top Shine Line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        
        {/* Border Glow */}
        <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
          isScrolled
            ? 'border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
            : 'border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
        }`}></div>
        
        {/* Content Container */}
        <div className="relative z-10">
        <div className="flex items-center justify-between px-6 sm:px-8">
          
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer" onClick={() => handleLinkClick('#home')}>
            <div className="transform group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
              <img 
                src="/FFLogo.webp" 
                alt="FoldFox Laundry Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
            </div>
            <div>
                <h1 className={`text-lg sm:text-2xl font-bold transition-colors duration-300 ${
                  isScrolled ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]' : 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
                }`}>
                FoldFox <span className="text-orange group-hover:text-orange/80 transition-colors drop-shadow-lg">Laundry</span>
              </h1>
              {shouldShowNavbarBadge() && (
                <p className="text-[10px] sm:text-xs text-orange font-semibold flex items-center gap-1 animate-pulse drop-shadow-lg">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden xs:inline">{getDiscountText()}</span> {getNavbarBadgeText()}
                </p>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleLinkClick(link.href)}
                  className={`hover:text-orange transition-all duration-300 font-medium relative group text-sm lg:text-base ${
                    isScrolled ? 'text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                  }`}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange transition-all duration-300 group-hover:w-full shadow-lg shadow-orange/50"></span>
              </button>
            ))}
                    {/* Enhanced Orange CTA Button */}
                    <button
                      onClick={onRegisterClick}
                      className="bg-gradient-to-r from-orange via-orange to-orange/90 hover:from-orange-600 hover:via-orange hover:to-orange/95 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl text-sm lg:text-base font-bold border-2 border-orange/40 shadow-[0_8px_30px_rgba(254,127,45,0.4)] hover:shadow-[0_12px_40px_rgba(254,127,45,0.6)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
                    >
                      {/* Shimmer Animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      
                      {/* Radial Glow */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
                      </div>
                      
                      <span className="relative z-10 drop-shadow-sm">
                        {getButtonText()}
                      </span>
                      
                      {/* Inner Border Glow */}
                      <div className="absolute inset-0 rounded-xl border-2 border-white/30 pointer-events-none"></div>
                      <div className="absolute inset-[2px] rounded-xl border border-white/10 pointer-events-none"></div>
                    </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
              className={`md:hidden p-2.5 rounded-xl backdrop-blur-sm transition-all duration-300 border hover:border-orange/30 hover:shadow-lg ${
                isScrolled 
                  ? 'hover:bg-white/10 border-white/30' 
                  : 'hover:bg-white/20 border-white/20'
              }`}
          >
            {isOpen ? (
                <X className={`w-6 h-6 transition-colors ${isScrolled ? 'text-white drop-shadow-lg' : 'text-white drop-shadow-lg'}`} />
              ) : (
                <Menu className={`w-6 h-6 transition-colors ${isScrolled ? 'text-white drop-shadow-lg' : 'text-white drop-shadow-lg'}`} />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-6 pb-4 px-6 animate-slide-down">
              {/* Enhanced Mobile Menu with Glassmorphism */}
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                {/* Glassy Background */}
                <div className="absolute inset-0 bg-navy/95 backdrop-blur-3xl"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-navy/20"></div>
                
                {/* Border */}
                <div className="absolute inset-0 rounded-2xl border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"></div>
                
                {/* Content */}
                <div className="relative z-10 p-4">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleLinkClick(link.href)}
                    className="block w-full text-left py-3 px-4 text-white/90 hover:bg-orange/20 hover:text-orange transition-all duration-300 rounded-xl mb-1 font-medium"
                >
                  {link.name}
                </button>
              ))}
                      {/* Enhanced Mobile Orange CTA Button */}
                      <button
                        onClick={onRegisterClick}
                        className="w-full mt-3 bg-gradient-to-r from-orange via-orange to-orange/90 hover:from-orange-600 hover:via-orange hover:to-orange/95 text-white px-6 py-3.5 rounded-xl font-bold border-2 border-orange/40 shadow-[0_8px_30px_rgba(254,127,45,0.4)] hover:shadow-[0_12px_40px_rgba(254,127,45,0.6)] hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
                      >
                        {/* Shimmer Animation */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        
                        {/* Radial Glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                        </div>
                        
                        <span className="relative z-10 drop-shadow-sm">
                          {getButtonText()}
                        </span>
                        
                        {/* Inner Border Glow */}
                        <div className="absolute inset-0 rounded-xl border-2 border-white/30 pointer-events-none"></div>
                        <div className="absolute inset-[2px] rounded-xl border border-white/10 pointer-events-none"></div>
                      </button>
              </div>
              </div>
            </div>
        )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

