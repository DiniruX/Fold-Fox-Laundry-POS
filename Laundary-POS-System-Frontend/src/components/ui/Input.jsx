import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon, // kept for backward compatibility (ignored)
  rightIcon, // kept for backward compatibility (ignored)
  className = '',
  type = 'text',
  ...props
}, ref) => {
  const inputClasses = cn(
    'block w-full px-4 py-3 border-2 rounded-xl shadow-sm placeholder-gray-400 transition-all duration-200 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed text-gray-900 font-medium',
    {
      'border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-400 bg-red-50/30': error,
      'border-gray-200 focus:ring-4 focus:ring-orange-100 focus:border-[#fe7f2d] hover:border-gray-300 bg-white': !error,
    },
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-[#233d4d] mb-2">
          {label}
          {props.required && <span className="text-[#fe7f2d] ml-1">*</span>}
        </label>
      )}
      
      <div className="relative group">
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
