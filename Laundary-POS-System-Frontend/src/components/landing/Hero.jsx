import PropTypes from 'prop-types';
import { 
  Truck, 
  Heart, 
  Clock, 
  DollarSign, 
  Smartphone, 
  MapPin,
  CheckCircle,
  Sparkles,
  ArrowDown,
  Gift
} from 'lucide-react';
import HighlightCard from './HighlightCard';
import Button from './ui/Button';
import campaignConfig, { isCampaignActive, getDiscountText, getButtonText, getAnnouncement } from '../../config/campaign';

/**
 * Hero Section Component
 * Displays main headline, campaign banner, service highlights, and CTA button
 */
const Hero = ({ onCTAClick }) => {
  const announcement = getAnnouncement();
  
  const highlights = [
    { icon: Truck, text: 'FREE Pickup & Delivery' },
    { icon: Heart, text: 'Special Care for Girls\' Clothes – safer & more hygienic!' },
    { icon: Clock, text: 'Fast & Reliable Service' },
    { icon: DollarSign, text: 'Budget-Friendly for Campus Students' },
    { icon: Smartphone, text: 'Book Directly via Our App & Website' },
  ];

  return (
    <section 
      id="home"
      className="relative overflow-hidden bg-cover bg-center bg-no-repeat min-h-screen flex items-center" 
      style={{ backgroundImage: "url('/hero-bg.webp')" }}
    >
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 md:py-32">
        
        {/* Campaign Announcement Banner - Premium Glassmorphism */}
        {announcement && (
          <div className="mb-8 sm:mb-10 animate-fade-in-up">
            <div className="relative inline-block group">
              {/* Glassmorphism Container */}
              <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/30 shadow-xl">
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-orange/5"></div>
                
                {/* Content */}
                <div className="relative flex items-center gap-4 sm:gap-5 pl-6 sm:pl-8 pr-6 sm:pr-8 py-3.5 sm:py-4">
                  {/* Icon Container with Glow */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-orange to-orange/70 flex items-center justify-center shadow-lg shadow-orange/30">
                      <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    {/* Icon Glow */}
                    <div className="absolute inset-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange blur-md opacity-40"></div>
                  </div>
                  
                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm sm:text-base lg:text-lg drop-shadow-lg leading-tight">
                      {announcement.text}
                    </p>
                  </div>
                </div>
                
                {/* Top Shine */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                
                {/* Bottom Shine */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>
              
              {/* Floating Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-orange/20 via-white/10 to-orange/20 rounded-2xl blur-lg opacity-50 -z-10"></div>
            </div>
          </div>
        )}
        
        {/* Main Heading */}
        <div className="mb-12 sm:mb-16 max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
            Smart Laundry
            <span className="block text-orange mt-1 sm:mt-2 drop-shadow-[0_2px_15px_rgba(0,0,0,0.4)]">Made Simple</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 font-light mb-6 max-w-2xl drop-shadow-[0_1px_10px_rgba(0,0,0,0.4)]">
            Professional laundry care just 300m from campus. Quality service at student-friendly prices!
          </p>
        </div>

       

        {/* CTA Buttons */}
        <div className="space-y-4">
          <Button
            onClick={onCTAClick}
            variant="primary"
            className="text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 shadow-2xl w-full sm:w-auto"
          >
            {getButtonText()}
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 text-white/70 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
      </div>
    </section>
  );
};

Hero.propTypes = {
  onCTAClick: PropTypes.func.isRequired,
};

export default Hero;
