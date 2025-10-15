import PropTypes from 'prop-types';
import { ChevronRight } from 'lucide-react';

/**
 * Reusable Button Component
 * Modern design with gradient background and animations
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  icon: Icon,
  showArrow = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group";
  
  const variants = {
    // Vibrant Orange Gradient with Glow
    primary: "bg-gradient-to-r from-orange via-orange to-orange/90 hover:from-orange-600 hover:via-orange hover:to-orange/95 text-white border-2 border-orange/40 shadow-[0_8px_30px_rgba(254,127,45,0.4)] hover:shadow-[0_12px_40px_rgba(254,127,45,0.6)] hover:-translate-y-1 hover:scale-[1.02]",
    // Navy Gradient
    secondary: "bg-gradient-to-r from-navy to-navy/90 hover:from-navy-600 hover:to-navy text-white border-2 border-navy/40 shadow-lg hover:shadow-xl hover:-translate-y-1",
    disabled: "bg-gray-400/60 cursor-not-allowed transform-none shadow-none border-none"
  };

  const variantClass = isLoading || props.disabled ? variants.disabled : variants[variant];

  return (
    <button
      className={`${baseStyles} ${variantClass} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Animated Shimmer Effect */}
      {!isLoading && !props.disabled && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          {/* Radial Glow on Hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
          </div>
        </>
      )}
      
      {/* Button Content */}
      <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Processing...
          </>
        ) : (
          <>
            {children}
            {Icon && <Icon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />}
            {showArrow && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />}
          </>
        )}
      </span>
      
      {/* Inner Border Glow */}
      {!isLoading && !props.disabled && (
        <>
          <div className="absolute inset-0 rounded-xl border-2 border-white/30 pointer-events-none"></div>
          <div className="absolute inset-[2px] rounded-xl border border-white/10 pointer-events-none"></div>
        </>
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary']),
  isLoading: PropTypes.bool,
  icon: PropTypes.elementType,
  showArrow: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;

