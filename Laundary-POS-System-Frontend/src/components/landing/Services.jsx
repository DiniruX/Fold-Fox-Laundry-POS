import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import campaignConfig, { isCampaignActive, getButtonText } from '../../config/campaign';

// Services data
const SERVICES = [
  {
    id: 1,
    title: "Wash and Dry",
    description: "Complete laundry service with washing and drying for everyday clothes",
    image: "/service1.webp",
    link: "#wash-and-dry",
    price: "From Rs. 200/kg"
  },
  {
    id: 2,
    title: "Washing",
    description: "Professional washing service for all types of garments",
    image: "/service2.webp",
    link: "#washing",
    price: "From Rs. 150/kg"
  },
  {
    id: 3,
    title: "Dry Cleaning",
    description: "Expert dry cleaning for delicate fabrics and formal wear",
    image: "/service3.webp",
    link: "#dry-cleaning",
    price: "From Rs. 300/item"
  }
];

/**
 * Services Component
 * Modern interactive services showcase for FoldFox Laundry
 */
const Services = ({ onRegisterClick }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const getServiceWidth = (index) => {
    if (hoveredIndex === null) {
      return `${100 / SERVICES.length}%`; // Equal width when no hover
    }
    if (hoveredIndex === index) {
      return '45%'; // Expanded width for hovered service
    }
    return `${55 / (SERVICES.length - 1)}%`; // Compressed width for others
  };

  return (
    <section id="services" className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-orange/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-navy/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-orange/3 to-navy/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange"></div>
            <h2 className="text-orange text-sm md:text-base lg:text-lg font-bold tracking-[0.25em] uppercase leading-relaxed mx-4">
              Our Services
            </h2>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange"></div>
          </div>
          
          {/* Subheading */}
          <div className="text-center max-w-4xl mx-auto">
            <h3 className="text-navy text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4 tracking-tight">
              Professional laundry care with modern convenience
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience premium laundry services designed for busy students and professionals
            </p>
          </div>
        </div>

        {/* Modern Services Container */}
        <div className="mb-16">
          {/* Desktop View - Horizontal Expandable Cards */}
          <div className="hidden lg:block">
            <div className="relative p-1.5 rounded-3xl bg-gradient-to-r from-orange/30 via-navy/30 to-orange/30 shadow-2xl">
              {/* Animated Gradient Border */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange/20 via-navy/20 to-orange/20 animate-gradient"></div>
              
              <div className="relative rounded-3xl bg-gradient-to-br from-white via-gray-50/50 to-white backdrop-blur-xl border border-gray-200/50 overflow-hidden shadow-inner">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-navy/40 to-transparent" />
                
                <div className="flex h-[600px] overflow-hidden rounded-3xl">
                  {SERVICES.map((service, index) => (
                    <div
                      key={service.id}
                      className="relative cursor-pointer group overflow-hidden first:rounded-l-3xl last:rounded-r-3xl transition-all duration-700 ease-out"
                      style={{
                        width: getServiceWidth(index),
                      }}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <div className="absolute inset-0 overflow-hidden">
                        <img
                          src={service.image}
                          alt={service.title}
                          className={`w-full h-full object-cover transition-all duration-700 ease-out ${
                            hoveredIndex === index 
                              ? 'scale-110 brightness-60 contrast-125 saturate-110' 
                              : 'scale-100 brightness-50 contrast-125 saturate-110'
                          }`}
                        />
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/80" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      
                      <div className={`absolute inset-0 backdrop-blur-[0.5px] transition-all duration-600 ${
                        hoveredIndex === index ? 'bg-black/10' : 'bg-black/30'
                      }`} />

                      <div className="absolute top-6 left-6 z-20">
                        <div className={`text-white/80 font-black tracking-wider transition-all duration-600 ease-out ${
                          hoveredIndex === index ? 'text-4xl opacity-30 translate-y-2' : 
                          hoveredIndex !== null ? 'text-6xl opacity-15' : 'text-6xl opacity-40'
                        }`}>
                          {String(index + 1).padStart(2, '0')}
                        </div>
                      </div>

                      <div className={`absolute bottom-6 left-6 right-6 transition-all duration-500 ease-out ${
                        hoveredIndex === null ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                      }`}>
                        <h3 className="text-2xl font-bold text-white leading-tight tracking-tight">
                          {service.title}
                        </h3>
                        <div className="text-orange font-semibold text-sm mt-1">
                          {service.price}
                        </div>
                      </div>

                      <div className={`absolute inset-0 flex flex-col justify-end p-6 z-30 transition-all duration-600 ease-out ${
                        hoveredIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                      }`}>
                        <div className={`bg-gradient-to-br from-navy/80 via-navy/70 to-navy/60 rounded-2xl p-6 border border-orange/30 backdrop-blur-md shadow-2xl transition-all duration-600 ${
                          hoveredIndex === index ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
                        }`}>
                          <h3 className="text-3xl font-bold text-white mb-3 leading-tight tracking-tight">
                            {service.title}
                          </h3>
                          <p className="text-white/90 text-lg leading-relaxed mb-4 font-light max-w-xs">
                            {service.description}
                          </p>
                          <div className="text-orange font-bold text-lg mb-6">
                            {service.price}
                          </div>
                          
                          <a
                            href={service.link}
                            className="inline-flex items-center text-white font-semibold group/btn hover:text-orange transition-colors duration-300"
                          >
                            <span>Learn More</span>
                            <ArrowUpRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all duration-300" />
                          </a>
                        </div>
                      </div>

                      <div className={`absolute inset-0 rounded-3xl border transition-all duration-400 ${
                        hoveredIndex === index ? 'border-white/30' : 'border-transparent'
                      }`} />
                      
                      <div className={`absolute inset-0 rounded-3xl transition-all duration-400 ${
                        hoveredIndex === index 
                          ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.2)]'
                          : 'shadow-none'
                      }`} />

                      <div 
                        className={`absolute top-0 right-0 transition-all duration-600 ease-out ${
                          hoveredIndex === index ? 'w-10 h-10 border-l-[40px] border-b-[40px]' : 'w-0 h-0 border-l-0 border-b-0'
                        }`}
                        style={{
                          borderLeftColor: 'transparent',
                          borderBottomColor: 'rgba(254, 127, 45, 0.3)',
                          borderTopRightRadius: '1.5rem'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet View - Stacked Cards */}
          <div className="lg:hidden grid sm:grid-cols-2 gap-4 sm:gap-6">
            {SERVICES.map((service, index) => (
              <div
                key={service.id}
                className="relative overflow-hidden rounded-2xl shadow-2xl group cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
              >
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange/20 via-navy/20 to-orange/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative h-80 sm:h-96">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Enhanced Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/95" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" />
                  
                  {/* Decorative Number */}
                  <div className="absolute top-4 left-4 z-20">
                    <div className="relative">
                      <div className="text-white/60 font-black text-5xl tracking-wider drop-shadow-2xl">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="absolute inset-0 text-orange/20 font-black text-5xl tracking-wider blur-sm">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative Corner Element */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange/10 to-transparent rounded-bl-3xl"></div>
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
                    <div className="relative bg-gradient-to-br from-navy/90 via-navy/85 to-navy/80 rounded-2xl p-5 sm:p-6 border-2 border-orange/40 backdrop-blur-md shadow-2xl transform transition-all duration-300 group-hover:border-orange/60">
                      {/* Inner Glow Effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange/5 via-transparent to-transparent"></div>
                      
                      <div className="relative z-10">
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
                          {service.title}
                        </h3>
                        <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-3">
                          {service.description}
                        </p>
                        <div className="text-orange font-bold text-base mb-4 flex items-center gap-2">
                          <div className="w-1 h-4 bg-orange rounded-full"></div>
                          {service.price}
                        </div>
                        
                        <a
                          href={service.link}
                          className="inline-flex items-center text-white text-sm font-semibold hover:text-orange transition-colors duration-300 group/link"
                        >
                          <span>Learn More</span>
                          <ArrowUpRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform duration-300" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Button Below Container */}
        <div className="flex justify-center">
          <button
            onClick={onRegisterClick}
            className="group relative overflow-hidden bg-gradient-to-r from-orange via-orange to-orange/90 hover:from-orange/90 hover:via-orange/95 hover:to-orange/85 text-white font-bold px-10 py-5 rounded-2xl border-2 border-orange/40 shadow-2xl hover:shadow-orange/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            
            {/* Radial Glow Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
            </div>
            
            {/* Button Content */}
            <span className="relative flex items-center text-lg font-bold tracking-wide">
              <span className="drop-shadow-lg">{getButtonText()}</span>
              <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform duration-300 drop-shadow-lg" />
            </span>
            
            {/* Multiple Border Layers for Depth */}
            <div className="absolute inset-0 rounded-2xl border-2 border-white/30 pointer-events-none" />
            <div className="absolute inset-[2px] rounded-2xl border border-white/10 pointer-events-none" />
          </button>
        </div>
      </div>
    </section>
  );
};

Services.propTypes = {
  onRegisterClick: PropTypes.func.isRequired,
};

export default Services;
