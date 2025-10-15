import { X, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';

/**
 * ErrorModal Component
 * 
 * User-friendly error display with retry functionality
 * Replaces blocking alert() dialogs
 */
const ErrorModal = ({ 
  isOpen, 
  onClose, 
  onRetry, 
  errorMessage, 
  title = 'Registration Failed',
  showRetry = true 
}) => {
  if (!isOpen) return null;

  // Determine if error is recoverable (network/server error vs validation error)
  const isRecoverable = errorMessage?.includes('connect') || 
                        errorMessage?.includes('network') ||
                        errorMessage?.includes('server') ||
                        errorMessage?.includes('timeout');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Error Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Header with colored stripe */}
        <div className="h-2 bg-gradient-to-r from-red-500 to-red-600" />
        
        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>
          
          {/* Error Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </h3>
          
          {/* Error Message */}
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            {errorMessage || 'An unexpected error occurred. Please try again.'}
          </p>
          
          {/* Help Section for Rate Limiting */}
          {errorMessage?.includes('Too many') && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Why am I seeing this?</p>
                  <p>
                    For security, we limit registration attempts. Please wait a few minutes before trying again.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            {showRetry && onRetry && isRecoverable && (
              <button
                onClick={() => {
                  onClose();
                  onRetry();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-orange text-white hover:bg-orange/90 transition-all duration-200 hover:shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}
            
            <button
              onClick={onClose}
              className={`${showRetry && onRetry && isRecoverable ? 'flex-1' : 'w-full'} inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200`}
            >
              Close
            </button>
          </div>
          
          {/* Support Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Need help?{' '}
              <a 
                href="#contact" 
                onClick={onClose}
                className="text-orange font-semibold hover:underline"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ErrorModal;

