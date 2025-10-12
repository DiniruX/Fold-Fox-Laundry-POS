import React from 'react';
import { cn } from '../../utils/helpers';

const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  className = '',
  text = '',
}) => {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-14 w-14 border-[3px]',
    xl: 'h-20 w-20 border-4',
  };

  const colors = {
    primary: 'border-[#fe7f2d] border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
    green: 'border-green-500 border-t-transparent',
    red: 'border-red-500 border-t-transparent',
    dark: 'border-[#233d4d] border-t-transparent',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative">
        <div
          className={cn(
            'animate-spin rounded-full',
            sizes[size],
            colors[color]
          )}
        />
        {/* Decorative pulse ring */}
        <div 
          className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-20',
            colors[color]
          )}
        />
      </div>
      {text && (
        <p className="text-sm font-medium text-[#233d4d] animate-pulse">{text}</p>
      )}
    </div>
  );
};

// Full screen loading component
export const FullScreenLoader = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-gradient-to-r from-[#fe7f2d] to-[#fcab10] rounded-full opacity-20 animate-pulse" />
        </div>
        <LoadingSpinner size="lg" color="primary" />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-bold text-[#233d4d]">{text}</p>
        <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-[#fe7f2d] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[#fe7f2d] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[#fe7f2d] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  </div>
);

// Page loading component
export const PageLoader = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center py-16">
    <div className="text-center space-y-4">
      <LoadingSpinner size="md" color="primary" />
      {text && (
        <p className="text-sm font-medium text-gray-600">{text}</p>
      )}
    </div>
  </div>
);

// Button loading component
export const ButtonLoader = ({ size = 'sm' }) => (
  <LoadingSpinner size={size} color="white" />
);

// Inline loading component (for smaller spaces)
export const InlineLoader = ({ text = '' }) => (
  <div className="flex items-center gap-2">
    <LoadingSpinner size="sm" color="primary" />
    {text && <span className="text-sm text-gray-600">{text}</span>}
  </div>
);

export default LoadingSpinner;
