import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const PasswordStrength = ({ password = '' }) => {
  const getStrength = (password) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;

    return { score, checks };
  };

  const { score, checks } = getStrength(password);

  const getStrengthConfig = () => {
    if (score <= 2) return { 
      color: 'bg-gradient-to-r from-red-500 to-red-600', 
      text: 'Weak', 
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    };
    if (score <= 3) return { 
      color: 'bg-gradient-to-r from-amber-500 to-orange-500', 
      text: 'Fair', 
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    };
    if (score <= 4) return { 
      color: 'bg-gradient-to-r from-blue-500 to-blue-600', 
      text: 'Good', 
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    };
    return { 
      color: 'bg-gradient-to-r from-green-500 to-green-600', 
      text: 'Strong', 
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  };

  const strengthConfig = getStrengthConfig();

  if (!password) return null;

  return (
    <div className="space-y-4">
      {/* Strength Bar with Badge */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-[#233d4d]">Password Strength</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${strengthConfig.bgColor} ${strengthConfig.textColor} border ${strengthConfig.borderColor}`}>
            {strengthConfig.text}
          </span>
        </div>
        
        {/* Modern segmented progress bar */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((segment) => (
            <div
              key={segment}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                segment <= score 
                  ? strengthConfig.color + ' shadow-sm' 
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 border border-gray-100">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Requirements</p>
        {Object.entries(checks).map(([key, passed]) => {
          const labels = {
            length: 'At least 8 characters',
            lowercase: 'One lowercase letter',
            uppercase: 'One uppercase letter',
            number: 'One number',
            special: 'One special character',
          };

          return (
            <div key={key} className={`flex items-center gap-2.5 text-sm transition-all duration-200 ${
              passed ? 'opacity-100' : 'opacity-60'
            }`}>
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                passed 
                  ? 'bg-green-500 shadow-sm shadow-green-200' 
                  : 'bg-gray-300'
              }`}>
                {passed ? (
                  <CheckIcon className="h-3 w-3 text-white stroke-[3]" />
                ) : (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              <span className={`font-medium ${
                passed ? 'text-green-700' : 'text-gray-600'
              }`}>
                {labels[key]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Success message when all requirements met */}
      {score === 5 && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 animate-fade-in">
          <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700">
            Excellent! Your password is very secure
          </p>
        </div>
      )}
    </div>
  );
};

export default PasswordStrength;
